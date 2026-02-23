import { useGetProfileQuery, useUpdateProfileMutation } from "@/store/api/authApiSlice";
import { useTranslation } from "@/hooks/use-translation";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EditPersonalInfoScreen = () => {
  const { language, t } = useTranslation();
  const { data: profileData } = useGetProfileQuery({});
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const userData = profileData?.data;

  const [formData, setFormData] = useState({
    fullName: "",
    emailOrNumber: "",
    phone: "",
    email: "",
    address: "",
  });
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        editPersonalInfo: "עריכת מידע אישי",
        enterFullName: "הזן את שמך המלא",
        enterPhone: "הזן מספר טלפון",
        enterEmail: "הזן כתובת אימייל",
        enterAddress: "הזן כתובת",
        save: "שמור",
        saving: "שומר...",
        missingInfo: "מידע חסר",
        fillRequired: "יש למלא את כל השדות הנדרשים לפני שמירה.",
        invalidEmail: "אימייל לא תקין",
        invalidEmailMsg: "נא להזין כתובת אימייל תקינה.",
        invalidPhone: "טלפון לא תקין",
        invalidPhoneMsg: "נא להזין מספר טלפון תקין.",
        personalSaved: "המידע האישי נשמר בהצלחה!",
        failedUpdate: "עדכון הפרופיל נכשל. נסה שוב.",
      };
    }
    if (language === "hi") {
      return {
        editPersonalInfo: "व्यक्तिगत जानकारी संपादित करें",
        enterFullName: "अपना पूरा नाम दर्ज करें",
        enterPhone: "अपना फोन नंबर दर्ज करें",
        enterEmail: "ईमेल पता दर्ज करें",
        enterAddress: "अपना पता दर्ज करें",
        save: "सेव करें",
        saving: "सेव हो रहा है...",
        missingInfo: "जानकारी अधूरी है",
        fillRequired: "सेव करने से पहले सभी आवश्यक फ़ील्ड भरें।",
        invalidEmail: "अमान्य ईमेल",
        invalidEmailMsg: "कृपया मान्य ईमेल पता दर्ज करें।",
        invalidPhone: "अमान्य फोन",
        invalidPhoneMsg: "कृपया मान्य फोन नंबर दर्ज करें।",
        personalSaved: "आपकी व्यक्तिगत जानकारी सफलतापूर्वक सेव हो गई!",
        failedUpdate: "प्रोफाइल अपडेट विफल रहा। कृपया फिर से प्रयास करें।",
      };
    }
    return {
      editPersonalInfo: "Edit Personal info",
      enterFullName: "Enter Your Full Name",
      enterPhone: "Enter Your Phone Number",
      enterEmail: "Enter Email Address",
      enterAddress: "Enter Your Address",
      save: "Save",
      saving: "Saving...",
      missingInfo: "Missing Information",
      fillRequired: "Please fill in all required fields before saving.",
      invalidEmail: "Invalid Email",
      invalidEmailMsg: "Please enter a valid email address.",
      invalidPhone: "Invalid Phone",
      invalidPhoneMsg: "Please enter a valid phone number.",
      personalSaved: "Your personal information has been saved successfully!",
      failedUpdate: "Failed to update profile. Please try again.",
    };
  }, [language]);

  useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.vendor.fullName || userData.name || "",
        emailOrNumber: userData.email || "",
        phone: userData.vendor.phone || userData.phoneNumber || "",
        email: userData.email || "",
        address: userData.vendor.address || "",
      });
    }
  }, [userData]);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validate form
    const requiredFields = ["fullName", "phone", "email", "address"];
    const emptyFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]?.trim()
    );

    if (emptyFields.length > 0) {
      Alert.alert(
        ui.missingInfo,
        ui.fillRequired,
        [{ text: t("ok", "OK") }]
      );
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      Alert.alert(ui.invalidEmail, ui.invalidEmailMsg, [
        { text: t("ok", "OK") },
      ]);
      return;
    }

    // Phone validation (basic)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      Alert.alert(ui.invalidPhone, ui.invalidPhoneMsg, [
        { text: t("ok", "OK") },
      ]);
      return;
    }

    // Success - Save data and navigate back
    try {
      const updateData: any = {};

      // Send only vendor table fields without nesting
      if (formData.fullName) updateData.fullName = formData.fullName;
      if (formData.phone) updateData.phone = formData.phone;
      if (formData.address) updateData.address = formData.address;

      // Clean up empty objects if necessary, but backend might handle partials.
      // If user provided no email change, we might not want to send user object with just empty fields if backend validates.
      // But typically sending what we have is okay.

      await updateProfile(updateData).unwrap();

      Alert.alert(
        t("success", "Success"),
        ui.personalSaved,
        [
          {
            text: t("ok", "OK"),
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Update failed", error);
      Alert.alert(t("error", "Error"), ui.failedUpdate);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 32,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingBottom: 30,
            }}
          >
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons
                name="arrow-back-ios-new"
                size={24}
                color="black"
              />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>
              {ui.editPersonalInfo}
            </Text>
            <View></View>
          </View>
          {/* Full Name Input */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: "#333333",
                marginBottom: 8,
                letterSpacing: -0.3,
              }}
            >
              {ui.enterFullName}
            </Text>
            <View
              style={{
                height: 56,
                borderWidth: 1,
                borderColor: "#E0E0E0",
                borderRadius: 12,
                backgroundColor: "#FAFAFA",
                paddingHorizontal: 16,
                justifyContent: "center",
              }}
            >
              <TextInput
                style={{
                  fontSize: 16,
                  color: "#333333",
                  padding: 0,
                  margin: 0,
                  flex: 1,
                  height: "100%",
                  letterSpacing: -0.3,
                }}
                placeholder={ui.enterFullName}
                placeholderTextColor="#999999"
                value={formData.fullName}
                onChangeText={(text) => handleInputChange("fullName", text)}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Phone Number Input */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: "#333333",
                marginBottom: 8,
                letterSpacing: -0.3,
              }}
            >
              {ui.enterPhone}
            </Text>
            <View
              style={{
                height: 56,
                borderWidth: 1,
                borderColor: "#E0E0E0",
                borderRadius: 12,
                backgroundColor: "#FAFAFA",
                paddingHorizontal: 16,
                justifyContent: "center",
              }}
            >
              <TextInput
                style={{
                  fontSize: 16,
                  color: "#333333",
                  padding: 0,
                  margin: 0,
                  flex: 1,
                  height: "100%",
                  letterSpacing: -0.3,
                }}
                placeholder={ui.enterPhone}
                placeholderTextColor="#999999"
                value={formData.phone}
                onChangeText={(text) => handleInputChange("phone", text)}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: "#333333",
                marginBottom: 8,
                letterSpacing: -0.3,
              }}
            >
              {ui.enterEmail}
            </Text>
            <View
              style={{
                height: 56,
                borderWidth: 1,
                borderColor: "#E0E0E0",
                borderRadius: 12,
                backgroundColor: "#FAFAFA",
                paddingHorizontal: 16,
                justifyContent: "center",
              }}
            >
              <TextInput
                style={{
                  fontSize: 16,
                  color: "#333333",
                  padding: 0,
                  margin: 0,
                  flex: 1,
                  height: "100%",
                  letterSpacing: -0.3,
                  opacity: 0.6
                }}
                placeholder={ui.enterEmail}
                placeholderTextColor="#999999"
                value={formData.email}
                editable={false}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Address Input */}
          <View style={{ marginBottom: 40 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: "#333333",
                marginBottom: 8,
                letterSpacing: -0.3,
              }}
            >
              {ui.enterAddress}
            </Text>
            <View
              style={{
                minHeight: 112,
                borderWidth: 1,
                borderColor: "#E0E0E0",
                borderRadius: 12,
                backgroundColor: "#FAFAFA",
                paddingHorizontal: 16,
                paddingVertical: 16,
              }}
            >
              <TextInput
                style={{
                  fontSize: 16,
                  color: "#333333",
                  padding: 0,
                  margin: 0,
                  flex: 1,
                  minHeight: 80,
                  textAlignVertical: "top",
                  letterSpacing: -0.3,
                }}
                placeholder={ui.enterAddress}
                placeholderTextColor="#999999"
                value={formData.address}
                onChangeText={(text) => handleInputChange("address", text)}
                multiline
                numberOfLines={4}
                maxLength={200}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.9}
            style={{
              height: 56,
              backgroundColor: "#278687",
              borderRadius: 28,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#278687",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#FFFFFF",
                letterSpacing: -0.3,
              }}
            >
              {isLoading ? ui.saving : ui.save}
            </Text>
          </TouchableOpacity>

          {/* Bottom spacing for iOS keyboard */}
          {Platform.OS === "ios" && <View style={{ height: 20 }} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditPersonalInfoScreen;
