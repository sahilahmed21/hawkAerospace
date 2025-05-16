import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

export default function Settings() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Settings',
          headerBackTitle: 'Back'
        }} 
      />
      
      <View style={styles.list}>
        <SettingItem 
          icon={<Feather name="user" size={24} />} 
          title="Profile"
          onPress={() => router.push('/screens/profile')}
        />
        <SettingItem 
          icon={<Ionicons name="language" size={24} />} 
          title="Language Settings" 
          subtitle="English" 
          onPress={() => router.push('/screens/Language')}
        />
        <SettingItem 
          icon={<Feather name="user-plus" size={24} />} 
          title="Invite a Friend"
          onPress={() => router.push('/screens/invite')} 
        />
        <SettingItem 
          icon={<Ionicons name="information-circle-outline" size={24} />} 
          title="About"
          onPress={() => router.push('/screens/about')} 
        />
        <SettingItem 
          icon={<MaterialIcons name="policy" size={24} />} 
          title="Privacy Policy" 
        />
        <SettingItem 
          icon={<MaterialIcons name="description" size={24} />} 
          title="Terms and Conditions" 
        />
      </View>
    </View>
  );
}

function SettingItem({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      {icon}
      <View style={{ marginLeft: 16 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  list: {
    marginTop: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#777',
  },
});