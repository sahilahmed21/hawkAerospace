// hooks/useLocation.ts
import { useState, useEffect, useCallback } from 'react';
import * as LocationExpo from 'expo-location';
import { Alert } from 'react-native'; // For showing permission alerts

export interface UserCoords {
  latitude: number;
  longitude: number;
  accuracy?: number | null; // expo-location provides this
}

export interface SavedAddressData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}


export interface FullAddress {
  streetNumber?: string | null;
  street?: string | null;
  district?: string | null; // For some regions
  city?: string | null;
  subregion?: string | null; // County / Sub-administrative area
  region?: string | null; // State / Administrative area
  postalCode?: string | null;
  country?: string | null;
  isoCountryCode?: string | null;
  name?: string | null; // Name of the place (e.g., POI, street name)
  formattedAddress?: string; // A fully formatted address string
}

export interface LocationHookResult {
  userCoords: UserCoords | null;
  addressInfo: FullAddress | null;
  errorMsg: string | null;
  loadingLocation: boolean;
  requestLocationPermission: () => Promise<boolean>; // Returns true if permission granted
  fetchCurrentUserLocation: () => Promise<void>; // For re-fetching
}

export function useLocation(): LocationHookResult {
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);
  const [addressInfo, setAddressInfo] = useState<FullAddress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(true); // Start true

  const performReverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      console.log("[useLocation] Performing reverse geocode for:", { latitude, longitude });
      const geocodedAddresses = await LocationExpo.reverseGeocodeAsync({ latitude, longitude });
      if (geocodedAddresses.length > 0) {
        const firstAddress = geocodedAddresses[0];
        // Construct a comprehensive formattedAddress if not directly provided
        const parts = [firstAddress.name, firstAddress.streetNumber, firstAddress.street, firstAddress.district, firstAddress.city, firstAddress.subregion, firstAddress.region, firstAddress.postalCode, firstAddress.country];
        const generatedFormattedAddress = parts.filter(Boolean).join(', ');

        const fullAddr: FullAddress = {
          ...firstAddress,
          formattedAddress: firstAddress.formattedAddress || generatedFormattedAddress
        };
        console.log("[useLocation] Reverse geocode result:", fullAddr);
        setAddressInfo(fullAddr);
        return fullAddr; // Return for immediate use if needed
      } else {
        setErrorMsg("No address found for coordinates.");
        setAddressInfo(null);
      }
    } catch (e: any) {
      console.error("[useLocation] Reverse geocoding error:", e);
      setErrorMsg(`Reverse geocoding failed: ${e.message}`);
      setAddressInfo(null);
    }
    return null;
  }, []);

  const fetchCurrentUserLocation = useCallback(async () => {
    setLoadingLocation(true);
    setErrorMsg(null);
    setUserCoords(null);
    setAddressInfo(null);

    console.log("[useLocation] fetchCurrentUserLocation called");
    let { status } = await LocationExpo.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      status = (await LocationExpo.requestForegroundPermissionsAsync()).status;
    }

    console.log("[useLocation] Permission status:", status);
    if (status !== 'granted') {
      setErrorMsg('Location permission denied.');
      Alert.alert(
        'Location Permission',
        'This app needs location access to function properly. Please enable it in settings.',
        [{ text: 'OK' }]
      );
      setLoadingLocation(false);
      return;
    }

    try {
      console.log("[useLocation] Getting current position...");
      // Consider using getLastKnownPositionAsync first for speed, then getCurrentPositionAsync
      const location = await LocationExpo.getCurrentPositionAsync({
        accuracy: LocationExpo.Accuracy.Balanced, // Balanced is often good enough and faster
      });
      console.log("[useLocation] Got position:", location.coords);
      setUserCoords(location.coords);
      await performReverseGeocode(location.coords.latitude, location.coords.longitude);
    } catch (e: any) {
      console.error("[useLocation] Error getting location:", e);
      setErrorMsg(`Failed to get location: ${e.message}. Ensure GPS is on.`);
      // Alert.alert("Location Error", `Could not fetch location. Ensure GPS is enabled. ${e.message}`);
    } finally {
      setLoadingLocation(false);
    }
  }, [performReverseGeocode]);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    let { status } = await LocationExpo.getForegroundPermissionsAsync();
    if (status === 'granted') return true;

    status = (await LocationExpo.requestForegroundPermissionsAsync()).status;
    if (status !== 'granted') {
      setErrorMsg('Location permission denied.');
      Alert.alert(
        'Location Permission Required',
        'This app needs location access to show relevant information. Please grant permission.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }, []);

  useEffect(() => {
    fetchCurrentUserLocation(); // Fetch on initial mount
  }, [fetchCurrentUserLocation]); // fetchCurrentUserLocation is memoized with useCallback

  return { userCoords, addressInfo, errorMsg, loadingLocation, requestLocationPermission, fetchCurrentUserLocation };
}