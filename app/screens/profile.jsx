import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useAuth } from '../contexts/UserContext';

const Profile = () => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    occupation: '',
    phone: currentUser?.phoneNumber || '',
    dob: '',
  });

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      const userRef = firestore().collection('users').doc(currentUser.uid);
      const unsubscribe = userRef.onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          setProfile(prev => ({
            ...prev,
            name: data.name || '',
            occupation: data.occupation || '',
            dob: data.dob || '',
            phone: currentUser.phoneNumber || data.phone || '',
          }));
        }
        setLoading(false);
      }, error => {
        console.error("Error fetching profile:", error);
        Alert.alert("Error", "Could not load profile data.");
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userRef = firestore().collection('users').doc(currentUser.uid);
      await userRef.set(
        {
          name: profile.name,
          occupation: profile.occupation,
          dob: profile.dob,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      Alert.alert('Success', 'Profile updated!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error("Logout error", error);
      Alert.alert("Error", "Logout failed.");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "This feature is not yet implemented.");
  };

  const toggleEdit = () => {
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
    }
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (loading && !profile.name) {
    return <View style={styles.container}><Text>Loading profile...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Profile', headerBackTitle: 'Back' }} />
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <TouchableOpacity onPress={toggleEdit} disabled={loading}>
          <Text style={styles.editText}>{isEditing ? (loading ? 'Saving...' : 'Save') : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ProfileItem
        icon="person-outline"
        placeholder="Name"
        value={profile.name}
        editable={isEditing}
        onChangeText={(val) => handleChange('name', val)}
      />
      <ProfileItem
        icon="briefcase-outline"
        placeholder="Occupation"
        value={profile.occupation}
        editable={isEditing}
        onChangeText={(val) => handleChange('occupation', val)}
      />
      <ProfileItem
        icon="call-outline"
        placeholder="Phone Number"
        value={profile.phone}
        editable={false}
        onChangeText={(val) => handleChange('phone', val)}
      />
      <ProfileItem
        icon="calendar-outline"
        placeholder="Date of Birth (YYYY-MM-DD)"
        value={profile.dob}
        editable={isEditing}
        onChangeText={(val) => handleChange('dob', val)}
      />

      <TouchableOpacity style={styles.item} onPress={handleLogout}>
        <Ionicons name="power-outline" size={20} style={styles.icon} />
        <Text style={styles.label}>Logout My Account</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={handleDeleteAccount}>
        <Ionicons name="trash-outline" size={20} style={[styles.icon, { color: 'red' }]} />
        <Text style={[styles.label, { color: 'red' }]}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const ProfileItem = ({ icon, value, editable, onChangeText, placeholder }) => {
  return (
    <View style={styles.item}>
      <Ionicons name={icon} size={20} style={styles.icon} />
      {editable ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
        />
      ) : (
        <Text style={styles.label}>{value || placeholder}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  editText: { fontSize: 14, color: '#007AFF' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  icon: { marginRight: 15, color: '#333' },
  label: { fontSize: 14, color: '#333' },
  input: { flex: 1, fontSize: 14, paddingVertical: 2, color: '#000' },
});

export default Profile;