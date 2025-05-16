import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "../../tailwind";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useLocation } from "@/hooks/useLocation";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

// Type definitions
interface Coords {
  latitude: number;
  longitude: number;
}

interface LocationData {
  coords: Coords;
}

interface AddressData {
  city?: string;
  region?: string;
}

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
}

// Define the return type for useLocation hook
interface LocationHookResult {
  location: LocationData | null;
  errorMsg: string | null;
  address: AddressData | null;
}

// Weather code descriptions mapping
const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export default function HomePage(): JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();
  
  // Fixed the useLocation hook usage with proper type annotation
  const { location, errorMsg, address } = useLocation() as LocationHookResult;

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Format the location string
  const locationDisplay = address
    ? `${address.city || ""}, ${address.region || ""}`
    : t("fetching_location");

  // Fetch weather data when location is available
  useEffect(() => {
    const fetchWeather = async (): Promise<void> => {
      if (location?.coords) {
        try {
          console.log("Starting weather fetch...");
          setWeatherLoading(true);
          setWeatherError(null);

          const { latitude, longitude } = location.coords;
          console.log(
            `Fetching weather for coordinates: ${latitude}, ${longitude}`
          );

          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timeformat=unixtime&timezone=auto`
          );

          console.log("API response status:", response.status);

          if (!response.ok) {
            throw new Error(
              `API Error: ${response.status} ${response.statusText}`
            );
          }

          const data: WeatherData = await response.json();
          console.log(
            "Weather data received:",
            JSON.stringify(data).substring(0, 200) + "..."
          );
          setWeather(data);
        } catch (error) {
          console.error(
            "Error fetching weather:",
            error instanceof Error ? error.message : String(error)
          );
          setWeatherError(
            error instanceof Error ? error.message : "Unknown error occurred"
          );
        } finally {
          setWeatherLoading(false);
        }
      }
    };

    fetchWeather();
  }, [location]);

  // Format weather data from Open-Meteo API
  const formatWeatherData = (
    data: WeatherData | null
  ): FormattedWeather | null => {
    if (!data || !data.current) return null;

    return {
      temp: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
    };
  };

  const weatherData: FormattedWeather | null = formatWeatherData(weather);

  // Get weather description based on code
  const getWeatherDescription = (code?: number): string => {
    if (code === undefined) return "Unknown";
    return WEATHER_DESCRIPTIONS[code] || "Unknown";
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`flex-1`}>
        {/* Drone Image and Request Banner */}
        <View style={tw`relative`}>
          <Image
            source={require("../../assets/images/drone.jpg")}
            style={tw`w-full h-56`}
          />
          <View
            style={tw`absolute top-0 left-0 right-0 p-4 flex-row justify-between items-center`}
          >
            <View style={tw`flex-row items-center`}>
              <MaterialIcons name="person" size={24} color="white" />
              <Text
                style={[
                  tw`text-white text-base ml-2`,
                  { fontFamily: "Inter_700Bold" },
                ]}
              >
                {t("greeting")} Ravi Kumar
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/notification")}>
              <MaterialIcons
                name="notifications-none"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>

          {/* Location Bar - Updated to use actual location */}
          <TouchableOpacity
            style={tw`absolute top-12 left-0 right-0 p-3 flex-row items-center`}
            onPress={() => router.push("/location")}
          >
            <MaterialIcons name="location-on" size={20} color="white" />
            <Text
              style={[tw`text-white ml-1`, { fontFamily: "Inter_400Regular" }]}
            >
              {t("current_location")}: {locationDisplay}
            </Text>
          </TouchableOpacity>

          <View
            style={tw`absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4 flex-row justify-between items-center`}
          >
            <Text style={[tw`text-white`, { fontFamily: "Inter_700Bold" }]}>
              {t("create_request_txt")}
            </Text>
            <TouchableOpacity 
              style={tw`bg-white px-2 py-2 rounded-full`}
              onPress={() => router.push("/(tabs)/providers")}
            >
              <Text style={[tw`text-xs`, { fontFamily: "Inter_600SemiBold" }]}>
                {t("create_request").toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Featured Section */}
        <View style={tw`p-4`}>
          <Text style={[tw`text-lg mb-3`, { fontFamily: "Inter_700Bold" }]}>
            {t("featured_for_you")}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={tw`bg-blue-500 rounded-lg p-4 w-64 mr-3`}>
              <Text
                style={[
                  tw`text-lg text-white mb-2`,
                  { fontFamily: "Inter_700Bold" },
                ]}
              >
                {t("get_discount")}
              </Text>
              <Text
                style={[
                  tw`text-white mb-4`,
                  { fontFamily: "Inter_400Regular" },
                ]}
              >
                {t("save_offer")}
              </Text>
              <TouchableOpacity 
                style={tw`bg-white py-2 rounded items-center`}
                onPress={() => router.push("/(tabs)/providers")}
              >
                <Text
                  style={[
                    tw`text-blue-500 text-xs`,
                    { fontFamily: "Inter_600SemiBold" },
                  ]}
                >
                  {t("create_request").toUpperCase()}
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  tw`text-white text-xs mt-1 text-center`,
                  { fontFamily: "Inter_300Light" },
                ]}  
              >
                T&C Apply
              </Text>
            </View>

            <View style={tw`bg-orange-500 rounded-lg p-4 w-64`}>
              <Text
                style={[
                  tw`text-lg text-white mb-2`,
                  { fontFamily: "Inter_700Bold" },
                ]}
                onPress={() => router.push("/screens/invite")}
              >
                {t("refer_earn")}
              </Text>
              <Text
                style={[
                  tw`text-white mb-4`,
                  { fontFamily: "Inter_400Regular" },
                ]}
                onPress={() => router.push("/screens/invite")}
              >
                {t("refer_friends")}
              </Text>
              <TouchableOpacity style={tw`bg-white py-2 rounded items-center`}>
                <Text
                  style={[
                    tw`text-orange-500 text-xs`,
                    { fontFamily: "Inter_600SemiBold" },
                  ]}
                  onPress={() => router.push("/screens/invite")}
                >
                  {t("refer_earn").toUpperCase()}
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  tw`text-white text-xs mt-1 text-center`,
                  { fontFamily: "Inter_300Light" },
                ]}
                onPress={() => router.push("/screens/invite")}
              >
                T&C Apply
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* Weather Section - Updated with actual weather data */}
        <View style={tw`p-4`}>
          <Text style={[tw`text-lg mb-3`, { fontFamily: "Inter_700Bold" }]}>
            {t("todays_weather")}
          </Text>
          <View style={tw`bg-gray-800 rounded-lg p-6`}>
            {weatherLoading ? (
              <View style={tw`items-center`}>
                <ActivityIndicator color="white" size="large" />
                <Text
                  style={[
                    tw`text-white mt-2`,
                    { fontFamily: "Inter_500Medium" },
                  ]}
                >
                  {t("fetching_weather")}
                </Text>
              </View>
            ) : weatherError ? (
              <View style={tw`items-center`}>
                <Feather name="alert-circle" size={36} color="white" />
                <Text
                  style={[
                    tw`text-white mt-2 text-center`,
                    { fontFamily: "Inter_500Medium" },
                  ]}
                >
                  {t("error")}: {weatherError}
                </Text>
              </View>
            ) : weatherData ? (
              <View style={tw`items-center`}>
                <View
                  style={tw`flex-row items-center justify-between w-full mb-3`}
                >
                  <View>
                    <Text
                      style={[
                        tw`text-white text-2xl`,
                        { fontFamily: "Inter_700Bold" },
                      ]}
                    >
                      {Math.round(weatherData.temp)}°C
                    </Text>
                    <Text
                      style={[
                        tw`text-white text-sm capitalize`,
                        { fontFamily: "Inter_400Regular" },
                      ]}
                    >
                      {getWeatherDescription(weatherData.weatherCode)}
                    </Text>
                  </View>
                </View>
                <View
                  style={tw`w-full border-t border-gray-600 pt-3 flex-row justify-between`}
                >
                  <View style={tw`items-center`}>
                    <Text
                      style={[
                        tw`text-white text-xs`,
                        { fontFamily: "Inter_300Light" },
                      ]}
                    >
                      {t("humidity").toUpperCase()}
                    </Text>
                    <Text
                      style={[
                        tw`text-white`,
                        { fontFamily: "Inter_600SemiBold" },
                      ]}
                    >
                      {weatherData.humidity}%
                    </Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text
                      style={[
                        tw`text-white text-xs`,
                        { fontFamily: "Inter_300Light" },
                      ]}
                    >
                      {t("wind_speed").toUpperCase()}
                    </Text>
                    <Text
                      style={[
                        tw`text-white`,
                        { fontFamily: "Inter_600SemiBold" },
                      ]}
                    >
                      {Math.round(weatherData.windSpeed)} km/h
                    </Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text
                      style={[
                        tw`text-white text-xs`,
                        { fontFamily: "Inter_300Light" },
                      ]}
                    >
                      {t("location").toUpperCase()}
                    </Text>
                    <Text
                      style={[
                        tw`text-white`,
                        { fontFamily: "Inter_600SemiBold" },
                      ]}
                    >
                      {address?.city || "Unknown"}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={tw`items-center`}>
                <Feather name="cloud" size={36} color="white" />
                <Text
                  style={[
                    tw`text-white mt-2`,
                    { fontFamily: "Inter_500Medium" },
                  ]}
                >
                  {address
                    ? "Weather data unavailable"
                    : t("fetching_weather")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Read Section */}
        <View style={tw`p-4`}>
          <Text style={[tw`text-lg mb-3`, { fontFamily: "Inter_700Bold" }]}>
            {t("read_more")}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={tw`mr-3`}
              onPress={() => router.push("/(tabs)/read")}
            >
              <Image
                source={{ uri: "https://picsum.photos/256/160?random=2" }}
                style={tw`w-64 h-40 rounded-lg`}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`mr-3`}
              onPress={() => router.push("/(tabs)/read")}
            >
              <Image
                source={{ uri: "https://picsum.photos/256/160?random=2" }}
                style={tw`w-64 h-40 rounded-lg`}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/read")}
            >
              <Image
                source={{ uri: "https://picsum.photos/256/160?random=2" }}
                style={tw`w-64 h-40 rounded-lg`}
              />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}