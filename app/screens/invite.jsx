import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Share, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router'; // ✅ IMPORT Stack

export default function InviteFriend() {
  const shareMessage = async () => {
    try {
      await Share.share({
        message:
          'Join this app using my code and get discount coupons! Download now: https://yourapp.com/referral-code',
      });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Setup Header using Stack.Screen */}
      <Stack.Screen 
        options={{ 
          title: 'Invite a Friend', // ✅ Title here
          headerBackTitle: 'Back',
          headerTitleAlign: 'center', // (optional) center title
        }} 
      />
      
      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title}>Invite Your Friend</Text>
        <Text style={styles.subtitle}>Refer a friend and get Discount Coupons!</Text>

        <Image
          source={require('../../assets/images/invite.png')} // ✅ Make sure path is correct
          style={styles.image}
        />

        <Text style={styles.description}>
          Just share this code with your friends to sign up and get discount coupons.
          You can refer 10 friends.
        </Text>

        {/* Sharing Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#25D366' }]} onPress={shareMessage}>
            <Ionicons name="logo-whatsapp" size={24} color="white" />
            <Text style={styles.buttonText}>Whatsapp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: '#FF9500' }]} onPress={shareMessage}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
            <Text style={styles.buttonText}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: '#7B8FA1' }]} onPress={shareMessage}>
            <Ionicons name="share-social" size={24} color="white" />
            <Text style={styles.buttonText}>Share to...</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginVertical: 10,
  },
  image: {
    width: 120,
    height: 180,
    marginVertical: 20,
    resizeMode: 'contain',
  },
  description: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    width: 90,
    height: 90,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
