import { useEffect, useState } from "react";
import {
  View,
  Text,
  Animated,
  Image,
  Modal,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useTranslation } from "react-i18next";
import { RadioButton } from "react-native-paper";
import i18n from "@/i18n/i18n";
import tw from "@/tailwind";
import React from "react";

interface WelcomeScreenProps {
  onFinish: () => void;
}

const languages = [
  { code: "en", label: "English" },
  { code: "gu", label: "Gujarati" },
  { code: "hi", label: "Hindi" },
  { code: "ka", label: "Kannada" },
  { code: "ma", label: "Marathi" },
  { code: "pu", label: "Punjabi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
];

export default function WelcomeScreen({ onFinish }: WelcomeScreenProps) {
  const [fadeAnim] = useState(new Animated.Value(1)); // Start fully visible
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const { t } = useTranslation();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      setModalVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setModalVisible(false);
    setTimeout(onFinish, 500);
  };

  return (
    <View style={tw`flex-1 items-center justify-center bg-[#0A4D99]`}>
      {/* Background Circles */}
      <View
        style={tw`absolute top-0 right-0 w-64 h-64 rounded-full bg-[#2F6AAE] -mr-16 -mt-16`}
      />
      <View
        style={tw`absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#2F6AAE] -ml-12 -mb-12`}
      />

      <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
        <View style={tw`mb-6`}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={tw`w-24 h-24`}
            resizeMode="contain"
          />
        </View>
        <Text style={tw`text-white text-xl text-center font-semibold`}>
          {t("welcome1")}
        </Text>
        <Text style={tw`text-white text-sm text-center mt-2 mb-2 font-semibold`}>
          {t("welcome2")}
        </Text>
      </Animated.View>

      {/* Language Selection Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={tw`flex-1 items-center justify-center bg-black bg-opacity-50`}>
          <View style={tw`bg-white p-6 rounded-lg w-3/4`}>
            <Text style={tw`text-lg font-bold text-center mb-4`}>
              {t("change_language")}
            </Text>

            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={tw`flex-row items-center p-3 border-b border-gray-200`}
                  onPress={() => setSelectedLanguage(item.code)}
                >
                  <RadioButton
                    value={item.code}
                    status={selectedLanguage === item.code ? "checked" : "unchecked"}
                    onPress={() => setSelectedLanguage(item.code)}
                  />
                  <Text style={tw`ml-2 text-base`}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={tw`mt-4 p-3 bg-blue-500 rounded-lg`}
              onPress={() => changeLanguage(selectedLanguage)}
            >
              <Text style={tw`text-white text-center text-lg`}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
