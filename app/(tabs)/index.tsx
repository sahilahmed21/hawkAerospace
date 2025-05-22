
import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Button,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "../../tailwind";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useLocation, UserCoords, FullAddress } from "@/hooks/useLocation";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../contexts/UserContext';

interface WeatherCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  weather_code: number;
  wind_speed_10m: number;
}

interface WeatherData {
  current: WeatherCurrent;
}

interface FormattedWeather {
  temp: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  description?: string;
}

interface CarouselItemFirestore {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  actionLink?: string;
  isActive: boolean;
  displayOrder: number;
}

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
  55: "Dense drizzle", 56: "Light freezing drizzle", 57: "Dense freezing drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain", 66: "Light freezing rain",
  67: "Heavy freezing rain", 71: "Slight snow fall", 73: "Moderate snow fall",
  75: "Heavy snow fall", 77: "Snow grains", 80: "Slight rain showers",
  81: "Moderate rain showers", 82: "Violent rain showers", 85: "Slight snow showers",
  86: "Heavy snow showers", 95: "Thunderstorm", 96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

const PREVIEW_ARTICLES = [
  { id: '1', title: 'Drone Farming Trends', imageUrl: 'https://images.unsplash.com/photo-1581092000490-9251d921fisch?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMjA3fDB8MXxzZWFyY2h8MXx8ZHJvbmUlMjBmYXJtaW5nfGVufDB8fHx8MTYxOTAwMDAwMA&ixlib=rb-1.2.1&q=80&w=400' },
  { id: '2', title: 'Precision Agriculture', imageUrl: 'https://images.unsplash.com/photo-1605290334528-9f2047d936e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMjA3fDB8MXxzZWFyY2h8Mnx8cHJlY2lzaW9uJTIwYWdyaWN1bHR1cmV8ZW58MHx8fHwxNjE5MDAwMDAw&ixlib=rb-1.2.1&q=80&w=400' },
  { id: '3', title: 'Future of AgTech', imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMjA3fDB8MXxzZWFyY2h8MXx8YWd0ZWNoJTIwZnV0dXJlfGVufDB8fHx8MTYxOTAwMDAwMA&ixlib=rb-1.2.1&q=80&w=400' },
];

export default function HomePage(): JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { userCoords, addressInfo, errorMsg: locationError, loadingLocation, fetchCurrentUserLocation } = useLocation();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [carouselItems, setCarouselItems] = useState<CarouselItemFirestore[]>([]);
  const [carouselLoading, setCarouselLoading] = useState<boolean>(true);

  const locationDisplay = loadingLocation
    ? t("fetching_location")
    : addressInfo?.city && addressInfo?.region
      ? `${addressInfo.city}, ${addressInfo.region}`
      : addressInfo?.formattedAddress
        ? addressInfo.formattedAddress.substring(0, 40) + (addressInfo.formattedAddress.length > 40 ? "..." : "")
        : locationError
          ? t("location_unavailable")
          : t("tap_to_set_location");

  useEffect(() => {
    if (!userCoords && locationError && !loadingLocation) {
      // Optionally show an alert for manual retry, but rely on retry button
      // Alert.alert(t("location_permission_title"), t("location_permission_message"), [
      //   { text: "OK", onPress: fetchCurrentUserLocation },
      //   { text: "Cancel", style: "cancel" }
      // ]);
    }
  }, [userCoords, locationError, loadingLocation, fetchCurrentUserLocation, t]);

  useEffect(() => {
    const fetchWeatherData = async (lat: number, lon: number): Promise<void> => {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timeformat=unixtime&timezone=auto`
        );
        if (!response.ok) throw new Error(t("weather_api_error", { status: response.status }));
        const data: WeatherData = await response.json();
        setWeather(data);
      } catch (error: any) {
        console.error("Error fetching weather:", error.message);
        setWeatherError(error.message || t("failed_to_fetch_weather"));
      } finally {
        setWeatherLoading(false);
      }
    };

    if (userCoords) {
      fetchWeatherData(userCoords.latitude, userCoords.longitude);
    } else if (!loadingLocation && locationError) {
      setWeatherError(t("weather_requires_location"));
      setWeatherLoading(false);
    }
  }, [userCoords, loadingLocation, locationError, t]);

  useEffect(() => {
    setCarouselLoading(true);
    const unsubscribe = firestore()
      .collection('carouselItems')
      .where('isActive', '==', true)
      .orderBy('displayOrder', 'asc')
      .onSnapshot(
        querySnapshot => {
          const items: CarouselItemFirestore[] = [];
          querySnapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() } as CarouselItemFirestore);
          });
          setCarouselItems(items);
          setCarouselLoading(false);
        },
        error => {
          console.error("Error fetching carousel items: ", error);
          Alert.alert(t('error'), t('failed_to_load_promotions'));
          setCarouselLoading(false);
        }
      );
    return () => unsubscribe();
  }, [t]);

  const formattedWeatherData: FormattedWeather | null = weather?.current
    ? {
      temp: weather.current.temperature_2m,
      humidity: weather.current.relative_humidity_2m,
      windSpeed: weather.current.wind_speed_10m,
      weatherCode: weather.current.weather_code,
      description: WEATHER_DESCRIPTIONS[weather.current.weather_code] || t("unknown_weather"),
    }
    : null;

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView style={tw`flex-1`} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={tw`relative`}>
          <Image
            source={require("../../assets/images/drone.jpg")}
            style={tw`w-full h-56`}
            resizeMode="cover"
          />
          <View style={tw`absolute top-0 left-0 right-0 p-4 flex-row justify-between items-center`}>
            <View style={tw`flex-row items-center`}>
              <MaterialIcons name="person" size={24} color="white" />
              <Text style={[tw`text-white text-base ml-2`, { fontFamily: "Inter_700Bold" }]}>
                {t("greeting")} {currentUser?.displayName || t("user")}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/notification")}>
              <MaterialIcons name="notifications-none" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={tw`absolute top-12 left-0 right-0 p-3 flex-row items-center`}
            onPress={() => router.push("/location")}
          >
            <MaterialIcons name="location-on" size={20} color="white" />
            <Text style={[tw`text-white ml-1 text-sm`, { fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
              {t("current_location")}: {locationDisplay}
            </Text>
          </TouchableOpacity>

          <View style={tw`absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4 flex-row justify-between items-center`}>
            <Text style={[tw`text-white`, { fontFamily: "Inter_700Bold" }]}>
              {t("create_request_txt")}
            </Text>
            <TouchableOpacity
              style={tw`bg-white px-2 py-2 rounded-full`}
              onPress={() => router.push("/Spraying")}
            >
              <Text style={[tw`text-xs`, { fontFamily: "Inter_600SemiBold" }]}>
                {t("create_request").toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {locationError && !userCoords && !loadingLocation && (
          <View style={tw`p-4 items-center`}>
            <Text style={tw`text-red-500 mb-2`}>{locationError}</Text>
            <Button title={t("retry_location")} onPress={fetchCurrentUserLocation} />
          </View>
        )}

        <View style={tw`p-4`}>
          <Text style={[tw`text-lg mb-3`, { fontFamily: "Inter_700Bold" }]}>
            {t("featured_for_you")}
          </Text>
          {carouselLoading ? (
            <ActivityIndicator color={tw.color('blue-500')} size="large" />
          ) : carouselItems.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {carouselItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={tw`bg-blue-500 rounded-lg p-3 w-64 mr-3 shadow-md`}
                  onPress={() => {
                    if (item.actionLink) router.push(item.actionLink as any);
                    else Alert.alert(item.title, item.description || t("no_action_defined"));
                  }}
                >
                  <Image source={{ uri: item.imageUrl }} style={tw`w-full h-32 rounded-md mb-2`} resizeMode="cover" />
                  <Text style={[tw`text-lg text-white mb-1 font-semibold`, { fontFamily: "Inter_700Bold" }]}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text style={[tw`text-white text-sm`, { fontFamily: "Inter_400Regular" }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={tw`text-gray-500`}>{t("no_promotions_available")}</Text>
          )}
        </View>

        <View style={tw`p-4`}>
          <Text style={[tw`text-lg mb-3`, { fontFamily: "Inter_700Bold" }]}>
            {t("todays_weather")}
          </Text>
          <View style={tw`bg-gray-800 rounded-lg p-5 shadow-md`}>
            {weatherLoading ? (
              <View style={tw`items-center py-5`}>
                <ActivityIndicator color="white" size="large" />
                <Text style={[tw`text-white mt-2`, { fontFamily: "Inter_500Medium" }]}>{t("fetching_weather")}</Text>
              </View>
            ) : weatherError ? (
              <View style={tw`items-center py-5`}>
                <Feather name="alert-circle" size={36} color="white" />
                <Text style={[tw`text-white mt-2 text-center`, { fontFamily: "Inter_500Medium" }]}>{weatherError}</Text>
              </View>
            ) : formattedWeatherData ? (
              <View style={tw`items-center`}>
                <View style={tw`flex-row items-center justify-between w-full mb-3`}>
                  <View>
                    <Text style={[tw`text-white text-3xl`, { fontFamily: "Inter_700Bold" }]}>
                      {Math.round(formattedWeatherData.temp)}°C
                    </Text>
                    <Text style={[tw`text-white text-sm capitalize`, { fontFamily: "Inter_400Regular" }]}>
                      {formattedWeatherData.description}
                    </Text>
                  </View>
                </View>
                <View style={tw`w-full border-t border-gray-600 pt-3 flex-row justify-between`}>
                  <View style={tw`items-center`}>
                    <Text style={[tw`text-white text-xs`, { fontFamily: "Inter_300Light" }]}>{t("humidity").toUpperCase()}</Text>
                    <Text style={[tw`text-white font-semibold`, { fontFamily: "Inter_600SemiBold" }]}>{formattedWeatherData.humidity}%</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={[tw`text-white text-xs`, { fontFamily: "Inter_300Light" }]}>{t("wind_speed").toUpperCase()}</Text>
                    <Text style={[tw`text-white font-semibold`, { fontFamily: "Inter_600SemiBold" }]}>{Math.round(formattedWeatherData.windSpeed)} km/h</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={[tw`text-white text-xs`, { fontFamily: "Inter_300Light" }]}>{t("location").toUpperCase()}</Text>
                    <Text style={[tw`text-white font-semibold`, { fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
                      {addressInfo?.city || t("unknown_location")}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={tw`items-center py-5`}>
                <Feather name="cloud-off" size={36} color="white" />
                <Text style={[tw`text-white mt-2`, { fontFamily: "Inter_500Medium" }]}>{t("weather_data_unavailable")}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={tw`p-4`}>
          <Text style={[tw`text-lg mb-3`, { fontFamily: "Inter_700Bold" }]}>
            {t("read_more")}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PREVIEW_ARTICLES.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={tw`mr-3 bg-white rounded-lg shadow w-64 overflow-hidden`}
                onPress={() => router.push({ pathname: "/(tabs)/read", params: { articleId: article.id } })}
              >
                <Image
                  source={{ uri: article.imageUrl }}
                  style={tw`w-full h-40`}
                  resizeMode="cover"
                />
                <Text style={[tw`p-2 font-semibold text-sm`, { fontFamily: "Inter_600SemiBold" }]}>{article.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
