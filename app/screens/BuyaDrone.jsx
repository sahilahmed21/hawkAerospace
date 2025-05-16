import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Image,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
import { Stack } from "expo-router";

export default function BuyDroneScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Stack.Screen
        options={{
          title: "Buy a Drone",
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      />

      <ScrollView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        {/* Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 20,
            marginBottom: 20,
            marginHorizontal: 20,
            backgroundColor: "#F8F8F8",
            borderRadius: 24,
            height: 48,
            paddingHorizontal: 16,
            shadowColor: "#0000001F",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/622/622669.png" }}
            style={{ width: 20, height: 20, marginRight: 10, tintColor: "#666" }}
          />
          <TextInput
            placeholder="Search for manufactures..."
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, fontSize: 16 }}
          />
        </View>

        {/* Drone Image */}
        <Image
          source={{
            uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/fJWEVg4enh/326gvd4i_expires_30_days.png",
          }}
          resizeMode="stretch"
          style={{
            width: 294,
            height: 168,
            marginBottom: 29,
            marginTop: 80,
            alignSelf: "center",
          }}
        />

        <Text
          style={{
            color: "#000000",
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          No manufacturers right now
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
