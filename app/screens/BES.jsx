import React, { useLayoutEffect } from 'react';
import { SafeAreaView, View, ScrollView, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useNavigation } from 'expo-router';
import { Feather } from '@expo/vector-icons'; // Make sure to install @expo/vector-icons

export default function BESScreen() {
  const navigation = useNavigation();

  // Custom header with back arrow
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'BES',
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} style={{ paddingHorizontal: 16 }}>
          <Feather name="arrow-left" size={24} color="black" />
        </Pressable>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image
            source={{
              uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/fJWEVg4enh/4fx7e8mh_expires_30_days.png',
            }}
            resizeMode="contain"
            style={{ width: 110, height: 121 }}
          />
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.comingSoon}>We are coming soon.</Text>
        </View>

        <Text style={styles.footerText}>
          We are coming with BES app soon.{"\n"}Stay tuned.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: 18,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  comingSoon: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#847D7D',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 349,
    marginHorizontal: 75,
  },
});
