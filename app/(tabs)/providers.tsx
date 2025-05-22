import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import tw from "../../tailwind";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { useLocation as useExpoLocationHook } from '@/hooks/useLocation';
import { getDistance } from 'geolib';
import { useTranslation } from 'react-i18next';

interface Provider {
  id: string;
  name: string;
  locationName: string;
  coordinates: FirebaseFirestoreTypes.GeoPoint;
  profileImageUrl?: string;
  isActive: boolean;
}

interface ProviderWithDistance extends Provider {
  distance?: number;
}

interface LocationData {
  coords: { latitude: number; longitude: number };
}

interface AddressData {
  city?: string;
  region?: string;
}

interface LocationHookResult {
  location: LocationData | null;
  errorMsg: string | null;
  address: AddressData | null;
  requestLocationPermission: () => Promise<void>;
}

const Providers = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { location: userLocation, errorMsg: locationError, requestLocationPermission } = useExpoLocationHook() as LocationHookResult;
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ProviderWithDistance[]>([]);
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
        setAllProviders(fetchedProviders);
      }, error => {
        console.error("Error fetching providers: ", error);
        Alert.alert(t('error'), t('failed_to_load_providers'));
        setLoading(false);
      });
    return () => unsubscribe();
  }, [t]);

  useEffect(() => {
    setLoading(true);
    let processedProviders: ProviderWithDistance[] = allProviders.map(p => ({ ...p, distance: undefined }));

    if (userLocation?.coords) {
      processedProviders = allProviders.map(p => {
        const distanceInMeters = getDistance(
          { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude },
          { latitude: p.coordinates.latitude, longitude: p.coordinates.longitude }
        );
        return { ...p, distance: distanceInMeters / 1000 };
      });
    }

    const lowerSearchQuery = searchQuery.toLowerCase();
    processedProviders = processedProviders.filter(p =>
      p.name.toLowerCase().includes(lowerSearchQuery) ||
      p.locationName.toLowerCase().includes(lowerSearchQuery)
    );

    processedProviders = processedProviders.filter(p =>
      p.distance === undefined || p.distance <= distanceFilterKm
    );

    processedProviders.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      if (a.distance !== undefined) return -1;
      if (b.distance !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });

    setFilteredProviders(processedProviders);
    setLoading(false);
  }, [allProviders, userLocation, distanceFilterKm, searchQuery]);

  const handleDistanceChange = () => {
    Alert.prompt(
      t("filter_by_distance"),
      t("enter_max_distance"),
      (text) => {
        const dist = parseInt(text);
        if (!isNaN(dist) && dist > 0) {
          setDistanceFilterKm(dist);
        } else if (text === '') {
          setDistanceFilterKm(Infinity);
        }
      },
      "plain-text",
      distanceFilterKm === Infinity ? "" : String(distanceFilterKm)
    );
  };

  return (
    <View style={tw`flex-1 bg-white pt-8`}>
      <View style={tw`px-4 mb-4 flex-row items-center justify-between`}>
        <View style={tw`flex-row flex-1 items-center border border-gray-200 rounded-lg p-2 bg-gray-50 mr-2`}>
          <TouchableOpacity style={tw`pr-2`}>
            <Ionicons name="search" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TextInput
            placeholder={t("search_providers_services")}
            style={tw`flex-1 text-gray-700 h-full`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={tw`ml-2 p-2`} onPress={() => Alert.alert(t("menu"), t("more_options"))}>
          <Ionicons name="ellipsis-vertical" size={22} color="#3b82f6" style={styles.filterIconContainer} />
        </TouchableOpacity>
      </View>

      <View style={tw`px-4 mb-4 flex-row justify-between items-center`}>
        <TouchableOpacity
          style={tw`border border-blue-500 self-start rounded-full px-4 py-1`}
          onPress={handleDistanceChange}
        >
          <Text style={tw`text-blue-500 text-sm`}>
            {distanceFilterKm === Infinity ? t("all_distances") : t("within_km", { km: distanceFilterKm })}
          </Text>
        </TouchableOpacity>
        {locationError && !userLocation && (
          <TouchableOpacity onPress={requestLocationPermission}>
            <Text style={tw`text-red-500 text-xs`}>{t("enable_location")}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={tw`px-4 text-black font-medium mb-2`}>{t("select_provider")}</Text>

      {loading ? (
        <ActivityIndicator size="large" color={tw.color('blue-500')} style={tw`mt-10`} />
      ) : filteredProviders.length === 0 ? (
        <Text style={tw`text-center text-gray-500 mt-10`}>
          {searchQuery ? t("no_providers_match_search") :
            (distanceFilterKm === Infinity ? t("no_providers_found") : t("no_providers_within_km", { km: distanceFilterKm }))}
        </Text>
      ) : (
        <ScrollView style={tw`px-4`}>
          {filteredProviders.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              style={[tw`flex-row items-center bg-white rounded-lg p-4 mb-3 shadow-md border border-gray-100`, styles.providerCard]}
              onPress={() => router.push({ pathname: "/Spraying", params: { providerId: provider.id } })}
            >
              {provider.profileImageUrl ? (
                <Image source={{ uri: provider.profileImageUrl }} style={tw`h-12 w-12 rounded-full bg-gray-300 mr-4`} />
              ) : (
                <View style={tw`h-12 w-12 rounded-full bg-blue-500 items-center justify-center mr-4`}>
                  <Text style={tw`text-white font-bold text-xl`}>{provider.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={tw`flex-1`}>
                <Text style={tw`font-semibold text-black text-base`}>{provider.name}</Text>
                {provider.distance !== undefined ? (
                  <Text style={tw`text-xs text-green-600`}>{provider.distance.toFixed(1)} {t("km_away")}</Text>
                ) : locationError ? (
                  <Text style={tw`text-xs text-red-500`}>{t("enable_location_for_distance")}</Text>
                ) : (
                  <Text style={tw`text-xs text-gray-400`}>{t("distance_unavailable")}</Text>
                )}
                <Text style={tw`text-xs text-gray-500 mt-1`} numberOfLines={1}>{provider.locationName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={tw.color('gray-400')} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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