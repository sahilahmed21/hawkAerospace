import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface LocationHook {
  location: Location.LocationObject | null;
  address: Location.LocationGeocodedAddress | null;
  errorMsg: string | null;
  requestLocationPermission: () => Promise<void>;
}

export function useLocation(): LocationHook {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<Location.LocationGeocodedAddress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        Alert.alert(
          'Location Access Denied',
          'The app needs location access to provide you with nearby drone services.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Attempt to get high accuracy location
      let attempts = 0;
      let currentLocation: Location.LocationObject | null = null;

      do {
        currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        if (
          currentLocation?.coords &&
          typeof currentLocation.coords.accuracy === 'number' &&
          currentLocation.coords.accuracy <= 50
        ) {
          break;
        }

        console.log(
          'Attempt',
          attempts + 1,
          'Location:',
          JSON.stringify(currentLocation, null, 2)
        );

        attempts++;
      } while (attempts < 3);

      // Check final accuracy
      if (
        !currentLocation?.coords ||
        typeof currentLocation.coords.accuracy !== 'number' ||
        currentLocation.coords.accuracy > 50
      ) {
        setErrorMsg('Location accuracy is too low');
        Alert.alert(
          'Low Location Accuracy',
          'Unable to get a precise location. Try moving to an open area.',
          [{ text: 'OK' }]
        );
        return;
      }

      setLocation(currentLocation);

      // Reverse geocoding
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (addressResponse && addressResponse.length > 0) {
        console.log('Address:', addressResponse[0]);
        setAddress(addressResponse[0]); // Store address in state
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Failed to get location');
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (location) {
      console.log('Location updated in state:', JSON.stringify(location, null, 2));
    }
  }, [location]);

  useEffect(() => {
    if (address) {
      console.log('Address updated in state:', JSON.stringify(address, null, 2));
    }
  }, [address]);

  return { location, address, errorMsg, requestLocationPermission };
}
