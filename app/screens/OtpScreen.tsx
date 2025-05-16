import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import tw from "@/tailwind";
import React from "react";

interface OtpScreenProps {
  onVerify: () => void;
}

export default function OtpScreen({ onVerify }: OtpScreenProps) {
  const { t } = useTranslation();
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle sending OTP (simplified)
  const handleSendOtp = () => {
    if (mobileNumber.length < 10) {
      Alert.alert(t("invalid_number"), t("enter_valid_number"));
      return;
    }

    // Simulate loading
    setLoading(true);
    setTimeout(() => {
      setIsOtpSent(true);
      setLoading(false);
      Alert.alert(t("success"), t("otp_sent"));
    }, 1000);
  };

  // Handle OTP verification (simplified)
  const handleVerifyOtp = () => {
    if (!otp || otp.length < 4) {
      Alert.alert(t("error"), t("invalid_otp_format"));
      return;
    }

    // Simulate loading
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      
      // Hardcoded OTP verification (1234)
      if (otp === "1234") {
        Alert.alert(t("success"), t("otp_verified"));
        onVerify();
      } else {
        Alert.alert(t("error"), t("invalid_otp"));
      }
    }, 1000);
  };

  // Handle resend OTP (simplified)
  const handleResendOtp = () => {
    // Simulate loading
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(t("success"), t("otp_resent"));
    }, 1000);
  };

  return (
    <View style={tw`flex-1 justify-center items-center bg-white px-6`}>
      {/* Logo & Title */}
      <Text style={tw`text-3xl font-bold mb-2`}>AeroSystem</Text>
      <Text style={tw`text-xl font-semibold`}>{t("greeting")}</Text>
      <Text style={tw`text-gray-500 mb-4`}>{t("login_continue")}</Text>
      
      {/* Mobile Number Input */}
      <Text style={tw`text-lg font-medium mb-1`}>{t("enter_mobile")}</Text>
      <View style={tw`flex-row border border-gray-300 rounded-lg px-3 py-2 mb-3 w-full`}>
        <Text style={tw`text-lg mr-2 mt-2`}>+91</Text>
        <TextInput
          style={tw`flex-1 text-lg`}
          placeholder={t("enter_mobile_placeholder")}
          keyboardType="phone-pad"
          maxLength={10}
          value={mobileNumber}
          onChangeText={setMobileNumber}
          editable={!isOtpSent}
        />
      </View>
      
      {/* Send OTP Button */}
      {!isOtpSent && (
        <TouchableOpacity
          style={tw`bg-blue-500 w-full py-3 rounded-full mb-3`}
          onPress={handleSendOtp}
          disabled={loading || mobileNumber.length < 10}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={tw`text-white text-center text-lg font-semibold`}>
              {t("send_otp")}
            </Text>
          )}
        </TouchableOpacity>
      )}
      
      {/* OTP Input Section */}
      {isOtpSent && (
        <>
          <Text style={tw`text-lg font-medium mb-1`}>{t("enter_otp")}</Text>
          <TextInput
            style={tw`border border-gray-300 rounded-lg text-lg px-3 py-2 text-center mb-3 w-full`}
            placeholder={t("enter_otp_placeholder")}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />
          
          <TouchableOpacity
            style={tw`bg-green-500 w-full py-3 rounded-full mb-3`}
            onPress={handleVerifyOtp}
            disabled={loading || otp.length < 4}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={tw`text-white text-center text-lg font-semibold`}>
                {t("verify")}
              </Text>
            )}
          </TouchableOpacity>
          
          {/* Resend OTP option */}
          <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
            <Text style={tw`text-blue-500 text-center`}>
              {t("resend_otp")}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}