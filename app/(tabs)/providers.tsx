import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import tw from "../../tailwind";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const Providers = () => {
  const router = useRouter();

  return (
    <>
      <View style={tw`flex-1 bg-white pt-8`}>
        {/* Header bar with 3-dot icon */}
        <View style={tw`px-4 mb-4 flex-row items-center justify-between`}>
          {/* Search Bar */}
          <View style={tw`flex-row flex-1 items-center border border-gray-200 rounded-lg p-2 bg-gray-50`}>
            <TouchableOpacity style={tw`pr-2`}>
              <Ionicons name="search" size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TextInput 
              placeholder="Search for providers, services..." 
              style={tw`flex-1 text-gray-700`} 
            />
          </View>

          {/* Three-dot icon without functionality */}
          <TouchableOpacity style={tw`ml-2`}>
            <Ionicons name="ellipsis-vertical" size={22} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Distance chip — optional: remove if not needed */}
        <View style={tw`px-4 mb-4`}>
          <View style={tw`border border-blue-500 self-start rounded-full px-4 py-1`}>
            <Text style={tw`text-blue-500 text-sm`}>Within 100 km</Text>
          </View>
        </View>

        {/* Heading */}
        <Text style={tw`px-4 text-black font-medium mb-2`}>Select provider to create request</Text>

        {/* Provider list */}
        <ScrollView style={tw`px-4`}>
          {/* Example provider card */}
          <TouchableOpacity 
            style={[tw`flex-row items-center bg-white rounded-lg p-4 mb-2`, styles.providerCard]}
            onPress={() => router.push("/Spraying")}
          >
            <View style={tw`h-12 w-12 rounded-full bg-blue-500 items-center justify-center mr-4`}>
              <Text style={tw`text-white font-bold`}>B</Text>
            </View>
            <View>
              <Text style={tw`font-medium text-black`}>BhuMeet Spraying Services</Text>
              <Text style={tw`text-xs text-gray-500`}>42.7 km Away</Text>
              <Text style={tw`text-xs text-gray-500`}>Chandrapur, MAHARASHTRA</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  filterIconContainer: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  providerCard: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  }
});

export default Providers;
