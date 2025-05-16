import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import tw from "@/tailwind";
import { useTranslation } from "react-i18next";

export default function NotificationScreen(): JSX.Element {
  const { t } = useTranslation();
  
  
  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Notification Section Header */}
      <View style={tw`flex-row justify-between px-4 py-3 border-b border-gray-200`}>
        <Text style={[tw`text-gray-500`, { fontFamily: "Inter_500Medium" }]}>
          {t("today") || "Today"}
        </Text>
        <TouchableOpacity>
          <Text style={[tw`text-blue-500`, { fontFamily: "Inter_500Medium" }]}>
            {t("mark_all_read") || "Mark as all read"}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={tw`flex-1`}>
        {/* Empty State with bell icon */}
        <View style={tw`flex-1 items-center justify-center p-8 mt-16`}>
          <View style={tw`bg-gray-100 rounded-full p-6 mb-4`}>
            <MaterialIcons name="notifications-none" size={36} color="#666" />
          </View>
          <Text style={[tw`text-lg text-center mb-2`, { fontFamily: "Inter_600SemiBold" }]}>
            {t("no_notifications") || "No notifications yet"}
          </Text>
          <Text style={[tw`text-gray-500 text-center`, { fontFamily: "Inter_400Regular" }]}>
            {t("notifications_appear_here") || "When you receive notifications, they'll appear here"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}