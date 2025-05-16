import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import tw from "../../tailwind";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { useLocation } from '@/hooks/useLocation';
import { getDistance } from 'geolib';

interface Coords {
  latitude: number;
  longitude: number;
}

interface LocationData {
  coords: Coords;
}

interface LocationHookResult {
  location: LocationData | null;
  errorMsg: string | null;
  address: any;
}

interface Provider {
  id: string;
  name: string;
  locationName: string;
  coordinates: FirebaseFirestoreTypes.GeoPoint;
  isActive: boolean;
}

interface ProviderWithDistance extends Provider {
  distance?: number;
}

const Providers = () => {
  const router = useRouter();
  const { location } = useLocation() as LocationHookResult;
  const [providers, setProviders] = useState<ProviderWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [distanceFilterKm, setDistanceFilterKm] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = firestore()
      .collection('providers')
      .where('isActive', '==', true)
      .onSnapshot(querySnapshot => {
        const fetchedProviders: Provider[] = [];
        querySnapshot.forEach(doc => {
          fetchedProviders.push({ id: doc.id, ...doc.data() } as Provider);
        });

        if (location?.coords) {
          const providersWithDist = fetchedProviders
            .map(p => {
              const distanceInMeters = getDistance(
                { latitude: location.coords.latitude, longitude: location.coords.longitude },
                { latitude: p.coordinates.latitude, longitude: p.coordinates.longitude }
              );
              return { ...p, distance: distanceInMeters / 1000 };
            })
            .filter(p => p.distance === undefined || p.distance <= distanceFilterKm)
            .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
          setProviders(providersWithDist);
        } else {
          setProviders(fetchedProviders.map(p => ({ ...p, distance: undefined })));
        }
        setLoading(false);
      }, error => {
        console.error("Error fetching providers: ", error);
        setLoading(false);
      });
    return () => unsubscribe();
  }, [location, distanceFilterKm]);

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    provider.locationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color={tw.color('blue-600')} />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white pt-8`}>
      <View style={tw`px-4 mb-4 flex-row items-center justify-between`}>
        <View style={tw`flex-row flex-1 items-center border border-gray-200 rounded-lg p-2 bg-gray-50`}>
          <TouchableOpacity style={tw`pr-2`}>
            <Ionicons name="search" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TextInput
            placeholder="Search for providers, services..."
            style={tw`flex-1 text-gray-700`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={tw`ml-2`} onPress={() => Alert.alert('Options', 'Filter or sort options coming soon!')}>
          <Ionicons name="ellipsis-vertical" size={22} color="#3b82f6" style={styles.filterIconContainer} />
        </TouchableOpacity>
      </View>

      <View style={tw`px-4 mb-4`}>
        <TouchableOpacity
          style={tw`border border-blue-500 self-start rounded-full px-4 py-1`}
          onPress={() => Alert.prompt(
            "Set Distance",
            "Enter max distance in km:",
            (text) => {
              const dist = parseInt(text);
              if (!isNaN(dist) && dist > 0) setDistanceFilterKm(dist);
            },
            "plain-text",
            String(distanceFilterKm)
          )}
        >
          <Text style={tw`text-blue-500 text-sm`}>Within {distanceFilterKm} km</Text>
        </TouchableOpacity>
      </View>

      <Text style={tw`px-4 text-black font-medium mb-2`}>Select provider to create request</Text>

      <ScrollView style={tw`px-4`}>
        {filteredProviders.length === 0 && (
          <Text style={tw`text-center text-gray-500 mt-10`}>
            No providers found {searchQuery ? 'matching your search' : `within ${distanceFilterKm}km`}.
          </Text>
        )}
        {filteredProviders.map(provider => (
          <TouchableOpacity
            key={provider.id}
            style={[tw`flex-row items-center bg-white rounded-lg p-4 mb-2 border border-gray-100`, styles.providerCard]}
            onPress={() => router.push({ pathname: "/Spraying", params: { providerId: provider.id } })}
          >
            <View style={tw`h-12 w-12 rounded-full bg-blue-500 items-center justify-center mr-4`}>
              <Text style={tw`text-white font-bold text-lg`}>{provider.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={tw`font-medium text-black text-base`}>{provider.name}</Text>
              {provider.distance !== undefined ? (
                <Text style={tw`text-xs text-gray-500`}>{provider.distance.toFixed(1)} km Away</Text>
              ) : (
                <Text style={tw`text-xs text-gray-500`}>Distance unknown</Text>
              )}
              <Text style={tw`text-xs text-gray-500`}>{provider.locationName}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
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