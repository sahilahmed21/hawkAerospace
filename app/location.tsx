import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent  } from 'react-native-maps';
import React from 'react';

// First, let's define our types and interfaces
interface LocationCoords {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface SelectedLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface SavedAddress {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

const ZOOM_FACTOR = 2;

const LocationScreen = () => {
  const router = useRouter();
  const [isMapModalVisible, setMapModalVisible] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressName, setAddressName] = useState<string>('');
  const mapRef = useRef<MapView | null>(null);

  const handleBack = () => {
    router.back();
  };

  const handleAddAddress = () => {
    setMapModalVisible(true);
  };

  const handleUseCurrentLocation = async () => {
    try {
      setIsLoading(true);
      
      // Request permission to access location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        setIsLoading(false);
        return;
      }
      
      // Get current position
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      setCurrentLocation({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      
      // Get address from coordinates
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const formattedAddress = `${address.street || ''}, ${address.city || ''}, ${address.region || ''}, ${address.country || ''}`;
        
        setSelectedLocation({
          latitude,
          longitude,
          address: formattedAddress
        });
        
        setAddressName('Current Location');
        setMapModalVisible(true);
      }
      
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Failed to get current location');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAddress = () => {
    if (selectedLocation && addressName) {
      const newAddress: SavedAddress = {
        id: Date.now().toString(),
        name: addressName,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: selectedLocation.address || 'Unknown address'
      };
      
      setSavedAddresses([...savedAddresses, newAddress]);
      setMapModalVisible(false);
      setSelectedLocation(null);
      setAddressName('');
    } else {
      alert('Please select a location and provide a name for this address');
    }
  };

  const onMapPress = async (e: MapPressEvent ) => {
    const { coordinate } = e.nativeEvent;
    
    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
    
    // Get address from coordinates
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude
      });
      
      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const formattedAddress = `${address.street || ''}, ${address.city || ''}, ${address.region || ''}, ${address.country || ''}`;
        
        setSelectedLocation(prev => {
          if (prev) {
            return {
              ...prev,
              address: formattedAddress
            };
          }
          return null;
        });
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
  };

  // Function to handle zoom in
  const handleZoomIn = () => {
    if (mapRef.current && currentLocation) {
      const region = {
        latitude: selectedLocation?.latitude || currentLocation.latitude,
        longitude: selectedLocation?.longitude || currentLocation.longitude,
        latitudeDelta: currentLocation.latitudeDelta / ZOOM_FACTOR,
        longitudeDelta: currentLocation.longitudeDelta / ZOOM_FACTOR,
      };
      
      mapRef.current.animateToRegion(region, 300);
      setCurrentLocation(region);
    }
  };

  // Function to handle zoom out
  const handleZoomOut = () => {
    if (mapRef.current && currentLocation) {
      const region = {
        latitude: selectedLocation?.latitude || currentLocation.latitude,
        longitude: selectedLocation?.longitude || currentLocation.longitude,
        latitudeDelta: currentLocation.latitudeDelta * ZOOM_FACTOR,
        longitudeDelta: currentLocation.longitudeDelta * ZOOM_FACTOR,
      };
      
      mapRef.current.animateToRegion(region, 300);
      setCurrentLocation(region);
    }
  };

  // Initialize with user's location when component mounts
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        setCurrentLocation({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    })();
  }, []);

  // Custom "modal" component since we're not using the external package
  const MapModal = () => {
    if (!isMapModalVisible) return null;
    
    return (
      <View style={tw`absolute top-0 left-0 right-0 bottom-0 bg-white z-50`}>
        <SafeAreaView style={tw`flex-1`}>
          {/* Header */}
          <View style={tw`flex-row items-center justify-between p-4 border-b border-gray-200`}>
            <TouchableOpacity onPress={() => setMapModalVisible(false)}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={tw`font-bold text-lg`}>Select Location</Text>
            <TouchableOpacity onPress={saveAddress}>
              <Text style={tw`text-blue-600 font-medium`}>Save</Text>
            </TouchableOpacity>
          </View>
          
          {/* Search Bar Placeholder (would need to implement without the package) */}
          <View style={tw`px-4 py-2`}>
            <TouchableOpacity 
              style={tw`p-3 border border-gray-200 rounded-lg flex-row items-center`}
              onPress={() => alert('Search functionality requires Google Places Autocomplete package')}
            >
              <Ionicons name="search" size={18} color="#777" style={tw`mr-2`} />
              <Text style={tw`text-gray-500`}>Search for a place</Text>
            </TouchableOpacity>
          </View>

          {/* Map View */}
          <View style={tw`flex-1 relative`}>
            {currentLocation ? (
              <>
                <MapView
                  ref={mapRef}
                  style={tw`flex-1`}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={currentLocation}
                  onPress={onMapPress}
                >
                  {selectedLocation && (
                    <Marker
                      coordinate={{
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                      }}
                      pinColor="#0066cc"
                    />
                  )}
                </MapView>

                {/* Zoom Controls */}
                <View style={tw`absolute right-4 bottom-24 z-10`}>
                  <TouchableOpacity
                    style={tw`bg-white w-10 h-10 rounded-full shadow-md items-center justify-center mb-2`}
                    onPress={handleZoomIn}
                  >
                    <Ionicons name="add" size={24} color="#0066cc" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={tw`bg-white w-10 h-10 rounded-full shadow-md items-center justify-center`}
                    onPress={handleZoomOut}
                  >
                    <Ionicons name="remove" size={24} color="#0066cc" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={tw`flex-1 items-center justify-center`}>
                <ActivityIndicator size="large" color="#0066cc" />
              </View>
            )}
          </View>

          {/* Selected Location Details */}
          {selectedLocation && (
            <View style={tw`p-4 border-t border-gray-200`}>
              <Text style={tw`font-medium mb-2`}>Selected Location</Text>
              <Text style={tw`text-gray-600 mb-4`}>{selectedLocation.address || 'Unknown address'}</Text>
              
              <View style={tw`mb-4`}>
                <Text style={tw`text-gray-600 mb-1`}>Save as:</Text>
                <TouchableOpacity 
                  style={tw`p-3 border border-gray-200 rounded-lg`}
                  onPress={() => {
                    // Alternative for prompt() which doesn't exist in RN
                    // In a real app, you'd show a custom input dialog
                    const demoName = 'Home';
                    setAddressName(demoName);
                    alert(`Address will be saved as "${demoName}"`);
                  }}
                >
                  <Text>{addressName || 'Add a name for this address'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Location Options */}
      <View style={tw`m-4 border border-gray-200 rounded-xl`}>
        {/* Use Current Location Option */}
        <TouchableOpacity 
          style={tw`p-4 flex-row items-center border-b border-gray-200`}
          onPress={handleUseCurrentLocation}
          disabled={isLoading}
        >
          <View style={tw`w-6 h-6 mr-3 items-center justify-center border border-blue-500 rounded-full`}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#0066cc" />
            ) : (
              <Ionicons name="locate" size={14} color="#0066cc" />
            )}
          </View>
          <Text style={tw`text-blue-600`}>Use Current Location</Text>
        </TouchableOpacity>

        {/* Add Address Option */}
        <TouchableOpacity 
          style={tw`p-4 flex-row items-center`}
          onPress={handleAddAddress}
        >
          <View style={tw`w-6 h-6 mr-3 items-center justify-center`}>
            <Ionicons name="add" size={20} color="#0066cc" />
          </View>
          <Text style={tw`text-blue-600`}>Add Address</Text>
        </TouchableOpacity>
      </View>

      {/* Saved Addresses Section */}
      <View style={tw`px-4`}>
        <Text style={tw`font-semibold text-base mb-6`}>Saved Address</Text>
        
        {savedAddresses.length === 0 ? (
          /* No Saved Addresses Message */
          <View style={tw`items-center justify-center py-4`}>
            <Text style={tw`text-gray-500 mb-1`}>You haven't saved any address!</Text>
            <Text style={tw`text-gray-500 mb-4`}>You haven't saved any addresses here</Text>
            
            <TouchableOpacity onPress={handleAddAddress}>
              <Text style={tw`text-blue-600`}>Add Address+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Saved Addresses List */
          <View style={tw`mb-4`}>
            {savedAddresses.map(address => (
              <TouchableOpacity 
                key={address.id} 
                style={tw`p-4 border border-gray-200 rounded-lg mb-2 flex-row items-center`}
              >
                <View style={tw`w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3`}>
                  <Ionicons name="location" size={16} color="#0066cc" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`font-medium mb-1`}>{address.name}</Text>
                  <Text style={tw`text-gray-500 text-sm`} numberOfLines={2}>{address.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Map Modal */}
      <MapModal />
    </SafeAreaView>
  );
};

export default LocationScreen;