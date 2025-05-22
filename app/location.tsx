import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import * as LocationExpo from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent, Region } from 'react-native-maps';
import { GooglePlacesAutocomplete, GooglePlaceData, GooglePlaceDetail } from 'react-native-google-places-autocomplete';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './contexts/UserContext';
import { useTranslation } from 'react-i18next';
import React from 'react';

interface UserCoords {
  latitude: number;
  longitude: number;
}

interface LocationCoords extends UserCoords {
  latitudeDelta: number;
  longitudeDelta: number;
}

interface SelectedLocationData extends UserCoords {
  address?: string;
}

export interface SavedAddressData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  userId?: string;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyASo6tuiRzfa7a9IklzOsMWRgVhDnM9Too";

const LocationScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [isMapModalVisible, setMapModalVisible] = useState<boolean>(false);
  const [mapRegion, setMapRegion] = useState<Region | undefined>(undefined);
  const [selectedLocationOnMap, setSelectedLocationOnMap] = useState<SelectedLocationData | null>(null);
  const [isLoadingCurrentLocation, setIsLoadingCurrentLocation] = useState<boolean>(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressData[]>([]);
  const [isLoadingSavedAddresses, setIsLoadingSavedAddresses] = useState<boolean>(true);
  const [addressNameToSave, setAddressNameToSave] = useState<string>('');
  const mapRef = useRef<MapView | null>(null);
  const placesAutocompleteRef = useRef<any>(null);

  useEffect(() => {
    const fetchAndSetInitialMapRegion = async () => {
      try {
        let { status } = await LocationExpo.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await LocationExpo.getCurrentPositionAsync({ accuracy: LocationExpo.Accuracy.Balanced });
          setMapRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        } else {
          Alert.alert(t('permission_denied'), t('location_permission_denied'));
          setMapRegion({ latitude: 20.5937, longitude: 78.9629, latitudeDelta: 15, longitudeDelta: 15 });
        }
      } catch (e) {
        console.error("Error fetching initial map region:", e);
        Alert.alert(t('error'), t('failed_to_load_map'));
        setMapRegion({ latitude: 20.5937, longitude: 78.9629, latitudeDelta: 15, longitudeDelta: 15 });
      }
    };
    fetchAndSetInitialMapRegion();
  }, [t]);

  useEffect(() => {
    if (!currentUser) {
      setSavedAddresses([]);
      setIsLoadingSavedAddresses(false);
      return;
    }
    setIsLoadingSavedAddresses(true);
    const unsubscribe = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .collection('savedAddresses')
      .orderBy('name', 'asc')
      .onSnapshot(querySnapshot => {
        const addresses: SavedAddressData[] = [];
        querySnapshot.forEach(doc => {
          addresses.push({ id: doc.id, ...doc.data() } as SavedAddressData);
        });
        setSavedAddresses(addresses);
        setIsLoadingSavedAddresses(false);
      }, error => {
        console.error("Error fetching saved addresses:", error);
        Alert.alert(t('error'), t('failed_to_load_addresses'));
        setIsLoadingSavedAddresses(false);
      });
    return () => unsubscribe();
  }, [currentUser, t]);

  const handleUseCurrentLocation = async () => {
    setIsLoadingCurrentLocation(true);
    try {
      let { status } = await LocationExpo.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permission_denied'), t('location_permission_denied'));
        setIsLoadingCurrentLocation(false);
        return;
      }
      let location = await LocationExpo.getCurrentPositionAsync({ accuracy: LocationExpo.Accuracy.High });
      const { latitude, longitude } = location.coords;

      const newRegion = { latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 };
      setMapRegion(newRegion);
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 300);
      }
      await reverseGeocodeAndSetLocation(latitude, longitude);
      setAddressNameToSave(t('my_current_location'));
      setMapModalVisible(true);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(t('error'), t('failed_to_get_location'));
    } finally {
      setIsLoadingCurrentLocation(false);
    }
  };

  const handleAddNewAddress = () => {
    setSelectedLocationOnMap(null);
    setAddressNameToSave('');
    if (placesAutocompleteRef.current) {
      placesAutocompleteRef.current.setAddressText("");
    }
    const regionToOpen = mapRegion || { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 15, longitudeDelta: 15 };
    setMapRegion(regionToOpen);
    setMapModalVisible(true);
  };

  const reverseGeocodeAndSetLocation = async (latitude: number, longitude: number) => {
    try {
      const reverseGeocode = await LocationExpo.reverseGeocodeAsync({ latitude, longitude });
      let formattedAddress = t('address_unavailable');
      if (reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const parts = [addr.name, addr.streetNumber, addr.street, addr.district, addr.city, addr.subregion, addr.region, addr.postalCode, addr.country];
        formattedAddress = parts.filter(Boolean).join(', ');
      }
      setSelectedLocationOnMap({ latitude, longitude, address: formattedAddress });
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setSelectedLocationOnMap({ latitude, longitude, address: t('address_fetch_failed') });
      Alert.alert(t('error'), t('failed_to_fetch_address'));
    }
  };

  const handleSaveAddressToFirestore = async () => {
    if (!currentUser) {
      Alert.alert(t('error'), t('must_be_logged_in'));
      return;
    }
    if (!selectedLocationOnMap || !addressNameToSave.trim()) {
      Alert.alert(t('incomplete'), t('select_location_and_name'));
      return;
    }

    try {
      const newAddressData: Omit<SavedAddressData, 'id' | 'userId'> = {
        name: addressNameToSave.trim(),
        latitude: selectedLocationOnMap.latitude,
        longitude: selectedLocationOnMap.longitude,
        address: selectedLocationOnMap.address || t('unknown_address'),
      };
      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('savedAddresses')
        .add(newAddressData);

      Alert.alert(t('success'), t('address_saved'));
      setMapModalVisible(false);
    } catch (error) {
      console.error("Error saving address to Firestore:", error);
      Alert.alert(t('error'), t('failed_to_save_address'));
    }
  };

  const onMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setAddressNameToSave('');
    reverseGeocodeAndSetLocation(latitude, longitude);
    if (mapRef.current) {
      mapRef.current.animateToRegion({ latitude, longitude, latitudeDelta: mapRegion?.latitudeDelta || 0.005, longitudeDelta: mapRegion?.longitudeDelta || 0.005 }, 300);
    }
  };

  const handleSelectSavedAddress = (address: SavedAddressData) => {
    Alert.alert(
      t('use_address'),
      t('use_address_for_spraying', { name: address.name, address: address.address }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('use'),
          onPress: () => {
            router.replace({
              pathname: "/Spraying",
              params: {
                selectedAddressName: address.name,
                selectedFullAddress: address.address,
                lat: String(address.latitude),
                lng: String(address.longitude),
              },
            });
          },
        },
      ]
    );
  };

  const MapModalContent = () => (
    <View style={tw`absolute top-0 left-0 right-0 bottom-0 bg-white z-50`}>
      <SafeAreaView style={tw`flex-1`}>
        <View style={tw`flex-row items-center justify-between p-3 border-b border-gray-200`}>
          <TouchableOpacity onPress={() => setMapModalVisible(false)} style={tw`p-2`}>
            <Ionicons name="close" size={28} color="black" />
          </TouchableOpacity>
          <Text style={tw`font-semibold text-lg`}>{t('select_or_search_location')}</Text>
          <TouchableOpacity onPress={handleSaveAddressToFirestore} style={tw`p-2`}>
            <Text style={tw`text-blue-600 font-medium text-base`}>{t('save')}</Text>
          </TouchableOpacity>
        </View>

        <GooglePlacesAutocomplete
          ref={placesAutocompleteRef}
          placeholder={t('search_place_or_address')}
          fetchDetails={true}
          onPress={(data: GooglePlaceData, details: GooglePlaceDetail | null = null) => {
            if (details?.geometry?.location) {
              const { lat, lng } = details.geometry.location;
              const newRegion = { latitude: lat, longitude: lng, latitudeDelta: 0.005, longitudeDelta: 0.005 };
              if (mapRef.current) mapRef.current.animateToRegion(newRegion, 300);
              setMapRegion(newRegion);
              reverseGeocodeAndSetLocation(lat, lng);
              setAddressNameToSave(data.structured_formatting?.main_text || data.description);
            }
          }}
          query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
          styles={{
            container: { flex: 0, position: 'absolute', width: '100%', zIndex: 1000, paddingHorizontal: 10, paddingTop: 10 },
            textInput: { height: 44, color: '#5d5d5d', fontSize: 16, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 10, backgroundColor: 'white' },
            listView: { backgroundColor: 'white', borderRadius: 8, marginTop: 5, borderWidth: 1, borderColor: '#DDD', maxHeight: 200 },
            description: { fontWeight: '600', color: '#333' },
            predefinedPlacesDescription: { color: '#1faadb' },
          }}
          debounce={300}
          enablePoweredByContainer={false}
        />

        <View style={tw`flex-1 mt-16`}>
          {mapRegion ? (
            <MapView
              ref={mapRef}
              style={tw`flex-1`}
              provider={PROVIDER_GOOGLE}
              initialRegion={mapRegion}
              onPress={onMapPress}
              showsUserLocation={true}
            >
              {selectedLocationOnMap && (
                <Marker
                  coordinate={selectedLocationOnMap}
                  pinColor="#0066cc"
                  title={t('selected_location')}
                  description={selectedLocationOnMap.address?.substring(0, 50)}
                />
              )}
            </MapView>
          ) : (
            <View style={tw`flex-1 items-center justify-center`}>
              <ActivityIndicator size="large" color="#0066cc" style={tw`mt-20`} />
              <Text style={tw`mt-2 text-gray-500`}>{t('loading_map')}</Text>
            </View>
          )}
        </View>

        {selectedLocationOnMap && (
          <View style={tw`p-4 border-t border-gray-200 bg-white`}>
            <Text style={tw`font-medium mb-1 text-gray-700 text-sm`}>{t('selected_point_address')}</Text>
            <Text style={tw`text-gray-600 mb-3 text-xs`} numberOfLines={2}>{selectedLocationOnMap.address}</Text>
            <TextInput
              style={tw`p-3 border border-gray-300 rounded-lg text-base h-12`}
              placeholder={t('name_location_placeholder')}
              value={addressNameToSave}
              onChangeText={setAddressNameToSave}
              placeholderTextColor="#999"
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`flex-row items-center p-4 bg-white border-b border-gray-200 shadow-sm`}>
        {router.canGoBack() && (
          <TouchableOpacity onPress={() => router.back()} style={tw`p-1 mr-3`}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        )}
        <Text style={tw`font-semibold text-xl text-gray-800`}>{t('manage_locations')}</Text>
      </View>

      <ScrollView>
        <View style={tw`m-4 p-1 bg-white border border-gray-200 rounded-xl shadow`}>
          <TouchableOpacity
            style={tw`p-4 flex-row items-center border-b border-gray-100`}
            onPress={handleUseCurrentLocation}
            disabled={isLoadingCurrentLocation}
          >
            <View style={tw`w-8 h-8 mr-3 items-center justify-center bg-blue-100 rounded-full`}>
              {isLoadingCurrentLocation ? (
                <ActivityIndicator size="small" color="#0066cc" />
              ) : (
                <Ionicons name="locate" size={18} color="#0066cc" />
              )}
            </View>
            <Text style={tw`text-blue-600 font-medium text-base`}>{t('use_my_current_location')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tw`p-4 flex-row items-center`} onPress={handleAddNewAddress}>
            <View style={tw`w-8 h-8 mr-3 items-center justify-center bg-green-100 rounded-full`}>
              <Ionicons name="add-circle-outline" size={20} color="#059669" />
            </View>
            <Text style={tw`text-green-700 font-medium text-base`}>{t('add_new_address')}</Text>
          </TouchableOpacity>
        </View>

        <View style={tw`px-4 pt-2 pb-4`}>
          <Text style={tw`font-semibold text-lg mb-3 text-gray-700`}>{t('saved_addresses')}</Text>
          {isLoadingSavedAddresses ? (
            <ActivityIndicator size="large" color="#0066cc" style={tw`mt-5`} />
          ) : savedAddresses.length === 0 ? (
            <View style={tw`items-center justify-center py-8 bg-white rounded-lg border border-gray-200 p-4`}>
              <Ionicons name="map-outline" size={48} color={tw.color('gray-400')} style={tw`mb-3`} />
              <Text style={tw`text-gray-600 text-base mb-1 text-center`}>{t('no_saved_addresses')}</Text>
              <Text style={tw`text-gray-500 text-sm text-center mb-4`}>{t('add_addresses_prompt')}</Text>
              <TouchableOpacity onPress={handleAddNewAddress} style={tw`bg-blue-500 px-5 py-2.5 rounded-lg shadow`}>
                <Text style={tw`text-white font-medium`}>{t('add_address')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {savedAddresses.map(address => (
                <TouchableOpacity
                  key={address.id}
                  style={tw`p-3 bg-white border border-gray-200 rounded-lg mb-2.5 shadow-sm flex-row items-center`}
                  onPress={() => handleSelectSavedAddress(address)}
                >
                  <View style={tw`w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3`}>
                    <Ionicons name="location-sharp" size={20} color="#3b82f6" />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`font-medium text-base text-gray-800 mb-0.5`}>{address.name}</Text>
                    <Text style={tw`text-gray-600 text-sm`} numberOfLines={2}>{address.address}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={tw.color('gray-400')} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      {isMapModalVisible && <MapModalContent />}
    </SafeAreaView>
  );
};

export default LocationScreen;