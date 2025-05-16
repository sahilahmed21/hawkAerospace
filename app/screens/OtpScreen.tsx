import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import tw from "@/tailwind";
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface OtpScreenProps {
  onVerify: () => void;
}

export default function OtpScreen({ onVerify }: OtpScreenProps) {
  const { t } = useTranslation();
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const i18n = require('@/i18n/i18n').default;

  const handleSendOtp = async () => {
    if (mobileNumber.length < 10) {
      Alert.alert(t("invalid_number"), t("enter_valid_number"));
      return;
    }
    setLoading(true);
    try {
      const fullPhoneNumber = `+91${mobileNumber}`;
      const confirmation = await auth().signInWithPhoneNumber(fullPhoneNumber);
      setConfirmResult(confirmation);
      setIsOtpSent(true);
      Alert.alert(t("success"), t("otp_sent_to_number", { number: fullPhoneNumber }));
    } catch (error: any) {
      Alert.alert(t("error"), error.message || t("failed_to_send_otp"));
      console.error("OTP Send Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert(t("error"), t("invalid_otp_format_6_digits"));
      return;
    }
    if (!confirmResult) {
      Alert.alert(t("error"), t("no_confirmation_result"));
      return;
    }
    setLoading(true);
    try {
      const userCredential = await confirmResult.confirm(otp);
      const user = userCredential?.user;

      if (user) {
        Alert.alert(t("success"), t("otp_verified"));

        const userRef = firestore().collection('users').doc(user.uid);
        const userDoc = await userRef.get();

        const userData = {
          phoneNumber: user.phoneNumber,
          uid: user.uid,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };

        if (!userDoc.exists) {
          await userRef.set({
            ...userData,
            createdAt: firestore.FieldValue.serverTimestamp(),
            preferredLanguage: i18n.language,
          });
          console.log('New user created in Firestore');
        } else {
          await userRef.update(userData);
          console.log('User data updated in Firestore');
        }
        onVerify();
      } else {
        Alert.alert(t("error"), t("otp_verification_failed"));
      }
    } catch (error: any) {
      Alert.alert(t("error"), error.message || t("invalid_otp"));
      console.error("OTP Verify Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    Alert.alert(t("info"), t("to_resend_otp_retry_send"));
  };

  return (
    <View style={tw`flex-1 justify-center items-center bg-white px-6`}>
      <Text style={tw`text-3xl font-bold mb-2`}>AeroSystem</Text>
      <Text style={tw`text-xl font-semibold`}>{t("greeting")}</Text>
      <Text style={tw`text-gray-500 mb-4`}>{t("login_continue")}</Text>

      <Text style={tw`text-lg font-medium mb-1`}>{t("enter_mobile")}</Text>
      <View style={tw`flex-row border border-gray-300 rounded-lg px-3 py-2 mb-3 w-full items-center`}>
        <Text style={tw`text-lg mr-2`}>+91</Text>
        <TextInput
          style={tw`flex-1 text-lg h-10`}
          placeholder={t("enter_mobile_placeholder")}
          keyboardType="phone-pad"
          maxLength={10}
          value={mobileNumber}
          onChangeText={setMobileNumber}
          editable={!isOtpSent && !loading}
        />
      </View>

      {!isOtpSent ? (
        <TouchableOpacity
          style={tw`bg-blue-500 w-full py-3 rounded-full mb-3 ${loading || mobileNumber.length < 10 ? 'opacity-50' : ''}`}
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
      ) : (
        <>
          <Text style={tw`text-lg font-medium mb-1`}>{t("enter_otp")}</Text>
          <TextInput
            style={tw`border border-gray-300 rounded-lg text-lg px-3 py-2 text-center mb-3 w-full h-12`}
            placeholder={t("enter_otp_placeholder")}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            editable={!loading}
          />

          <TouchableOpacity
            style={tw`bg-green-500 w-full py-3 rounded-full mb-3 ${loading || otp.length < 6 ? 'opacity-50' : ''}`}
            onPress={handleVerifyOtp}
            disabled={loading || otp.length < 6}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={tw`text-white text-center text-lg font-semibold`}>
                {t("verify")}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
            <Text style={tw`text-blue-500 text-center ${loading ? 'opacity-50' : ''}`}>
              {t("resend_otp")}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}