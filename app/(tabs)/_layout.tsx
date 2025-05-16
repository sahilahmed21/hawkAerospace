import { Tabs } from "expo-router";
import React, { useState } from "react";
import { Platform, TouchableOpacity, View, StyleSheet } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import Feather from "react-native-vector-icons/Feather";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomDrawer from "@/components/BottomDrawer";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const toggleDrawer = () => {
    setDrawerVisible((prev) => !prev);
  };

  const drawerOptions = [
    { name: "Settings", icon: "settings", route: "screens/settings" },
    {
      name: "BES",
      iconType: "image",
      imagePath: require('@/assets/images/logo.png'),
      route: "screens/BES",
      iconStyle: { backgroundColor: 'black', borderRadius: 100, padding: 5 }
    },
    { name: "Coupons", icon: "local-offer", route: "screens/coupons" },
    { name: "Buy a Drone", icon: "shopping-cart", route: "screens/BuyaDrone" },
  ];

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarLabelStyle: {
            fontWeight: '400',
            fontSize: 12,
            color: "black"
          },
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
              height: 60,
              flexDirection: 'row',
              justifyContent: 'space-between',
            },
            default: {
              height: 60,
              flexDirection: 'row',
              justifyContent: 'space-between',
            },
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Feather name="home" size={28} color="black" />
            ),
          }}
        />
        <Tabs.Screen
          name="providers"
          options={{
            title: "Providers",
            tabBarIcon: ({ color }) => (
              <Feather name="user" size={28} color="black" />
            ),
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: "Requests",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="web-refresh" size={28} color="black" />
            ),
          }}
        />
        <Tabs.Screen
          name="read"
          options={{
            title: "Read",
            tabBarIcon: ({ color }) => (
              <Feather name="file" size={28} color="black" />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
            tabBarIcon: ({ color }) => (
              <Feather name="more-horizontal" size={28} color="black" />
            ),
            tabBarButton: (props) => (
              <TouchableOpacity {...props} onPress={toggleDrawer} />
            ),
          }}
        />
      </Tabs>

      {/* Bottom Drawer UI */}
      <BottomDrawer
        visible={drawerVisible}
        onClose={toggleDrawer}
        options={drawerOptions}
        style={styles.drawer} // Apply custom drawer style
      />
    </>
  );
}

// Styles for Drawer
const styles = StyleSheet.create({
  drawer: {
    width: '80%', // Adjust width to fit content
    height: '70%', // Adjust height for content
    marginBottom: 20, // Optional: Add space below the drawer
    position: 'absolute', // Fixed position
    bottom: 0, // Keep the drawer at the bottom
    left: '10%', // Center the drawer horizontally
    backgroundColor: 'white', // Optional: background color
    borderTopLeftRadius: 20, // Optional: rounded corners
    borderTopRightRadius: 20, // Optional: rounded corners
    padding: 10, // Padding for content
  },
});
