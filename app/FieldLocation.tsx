import React, { useState } from 'react';
import { View, TouchableOpacity, SafeAreaView, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import tw from '@/tailwind';

const FieldLocation: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();

  const initialLat = params.lat ? parseFloat(params.lat) : 45.5;
  const initialLng = params.lng ? parseFloat(params.lng) : -94.0;

  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: initialLat,
    longitude: initialLng,
  });

  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleMapPress = async (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    fetchAddress(latitude, longitude);
  };

  const fetchAddress = async (latitude: number, longitude: number) => {
    setLoading(true);
    try {
      let [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result) {
        const formattedAddress = `${result.name ? result.name + ', ' : ''}${result.street ? result.street + ', ' : ''}${result.city ? result.city + ', ' : ''}${result.region ? result.region : ''}`;
        setAddress(formattedAddress);
      } else {
        setAddress('Address not found');
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setAddress('Error fetching address');
    }
    setLoading(false);
  };

  const handleConfirmSelection = () => {
    console.log(selectedLocation);
    
    if (selectedLocation) {
      router.replace({
        pathname: "/Spraying",
        params: { lat: selectedLocation.latitude, lng: selectedLocation.longitude, address },
      });
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`p-4 border-b border-gray-200`}>
        <Text style={tw`text-lg font-medium`}>Select Location</Text>
        <Text style={tw`text-gray-500`}>
          {loading ? 'Fetching address...' : address || 'Tap on the map to select a location'}
        </Text>
      </View>

      <View style={tw`flex-1`}>
        <MapView
          style={tw`flex-1`}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: initialLat,
            longitude: initialLng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={handleMapPress}
        >
          {selectedLocation && <Marker coordinate={selectedLocation} title="Selected Location" />}
        </MapView>
      </View>

      <View style={tw`p-4`}>
        {loading && <ActivityIndicator size="small" color="blue" />}
        <TouchableOpacity
          style={tw`bg-blue-500 py-3 rounded-full items-center`}
          onPress={handleConfirmSelection}
          disabled={loading}
        >
          <Text style={tw`text-white font-medium`}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FieldLocation;
