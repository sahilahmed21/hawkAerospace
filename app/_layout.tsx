import React from "react";
import 'react-native-get-random-values';

import { useEffect, useState } from "react";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
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
import { UserProvider, useAuth } from "./contexts/UserContext";
import WelcomeScreen from "./screens/WelcomeScreen";
import OtpScreen from "./screens/OtpScreen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <UserProvider>
      <RootLayoutNav />
    </UserProvider>
  );
}

function RootLayoutNav() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });
  const { currentUser, loadingAuth } = useAuth();
  const [appStep, setAppStep] = useState("loading");

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!loadingAuth && fontsLoaded) {
      if (currentUser) {
        setAppStep("main");
      } else {
        setAppStep("welcome");
      }
    }
  }, [currentUser, loadingAuth, fontsLoaded]);

  if (appStep === "loading" || !fontsLoaded || loadingAuth) {
    return null;
  }

  if (appStep === "welcome") {
    return <WelcomeScreen onFinish={() => setAppStep("otp")} />;
  }

  if (appStep === "otp") {
    return <OtpScreen onVerify={() => setAppStep("main")} />;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <I18nextProvider i18n={i18n}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="location" options={{ title: "Select Location" }} />
          <Stack.Screen name="notification" options={{ title: "Notification" }} />
          <Stack.Screen name="fieldlocation" options={{ title: "FieldLocation" }} />
          <Stack.Screen name="screens/settings" options={{ title: "Settings" }} />
        </Stack>
      </I18nextProvider>
    </ThemeProvider>
  );
}