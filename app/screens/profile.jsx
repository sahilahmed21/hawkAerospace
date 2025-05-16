import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    occupation: '',
    phone: '',
    dob: '',
  });

  const toggleEdit = () => setIsEditing(!isEditing);
  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerBackTitle: 'Back',
        }}
      />

      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <TouchableOpacity onPress={toggleEdit}>
          <Text style={styles.editText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Fields */}
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
        editable={isEditing}
        onChangeText={(val) => handleChange('phone', val)}
      />
      <ProfileItem
        icon="calendar-outline"
        placeholder="Date of Birth"
        value={profile.dob}
        editable={isEditing}
        onChangeText={(val) => handleChange('dob', val)}
      />

      {/* Static Options */}
      <View style={styles.item}>
        <Ionicons name="power-outline" size={20} style={styles.icon} />
        <Text style={styles.label}>Logout My Account</Text>
      </View>

      <View style={styles.item}>
        <Ionicons name="trash-outline" size={20} style={styles.icon} />
        <Text style={styles.label}>Delete Account</Text>
      </View>
    </View>
  );
}

function ProfileItem({ icon, value, editable, onChangeText, placeholder }) {
  return (
    <View style={styles.item}>
      <Ionicons name={icon} size={20} style={styles.icon} />
      {editable ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
        />
      ) : (
        <Text style={styles.label}>{value || placeholder}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  editText: {
    fontSize: 14,
    color: '#007AFF',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  icon: {
    marginRight: 15,
    color: '#333',
  },
  label: {
    fontSize: 14,
    color: '#333',
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 2,
    color: '#000',
  },
});
