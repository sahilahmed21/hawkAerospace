import { useEffect, useState } from "react";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "@/hooks/useColorScheme";
import "../i18n/i18n";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/i18n";
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from "@expo-google-fonts/inter";

import WelcomeScreen from "./screens/WelcomeScreen";
import OtpScreen from "./screens/OtpScreen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  // Remove useColorScheme hook since we're forcing light theme
  const [step, setStep] = useState("welcome");

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  if (step === "welcome") {
    return <WelcomeScreen onFinish={() => setStep("otp")} />;
  }

  if (step === "otp") {
    return <OtpScreen onVerify={() => setStep("main")} />;
  }

  // Force DefaultTheme (light) for all devices
  return (
    <ThemeProvider value={DefaultTheme}>
      <I18nextProvider i18n={i18n}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="location" options={{ title: "Select Location" }} />
          <Stack.Screen name="notification" options={{ title: "Notification" }} />
          <Stack.Screen name="fieldlocation" options={{ title: "FieldLocation" }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
      </I18nextProvider>
    </ThemeProvider>
  );
}