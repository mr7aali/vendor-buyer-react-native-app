import { unregisterPushTokenFromBackend } from "@/services/pushNotifications";
import { persistAuthState } from "@/services/authStorage";
import { useGetProfileQuery, useSwitchProfileMutation } from "@/store/api/authApiSlice";
import { apiSlice } from "@/store/api/apiSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logOut, selectAvailableProfiles, setCredentials } from "@/store/slices/authSlice";
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialIcons
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Modal, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../hooks/use-translation";

const ProfileScreen = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const availableProfiles = useAppSelector(selectAvailableProfiles);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [switchProfile, { isLoading: isSwitchingProfile }] = useSwitchProfileMutation();
  const { data: profileData } = useGetProfileQuery({});
  const displayUser = profileData?.data;

  const onLogout = async () => {
    setShowLogoutModal(false);
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      await unregisterPushTokenFromBackend(accessToken);

      // Clear AsyncStorage
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('userType');
      await AsyncStorage.removeItem('availableProfiles');

      // Clear Redux state
      dispatch(logOut());

      // Navigate to onboarding
      router.replace("/(onboarding)/GetStarted");
    } catch (error) {
      console.error("Logout error:", error);
      router.replace("/(onboarding)/GetStarted");
    }
  };

  const toggleSwitch = () => {
    setShowSwitchModal(true);
  };

  const onConfirmSwitch = async () => {
    setShowSwitchModal(false);

    try {
      const response = await switchProfile("vendor").unwrap();
      const payload = response?.data || response;

      if (!payload?.accessToken || !payload?.user) {
        throw new Error("Invalid switch profile response");
      }

      const normalizedUser = { ...payload.user, userType: "vendor" };
      const nextAvailableProfiles = payload.availableProfiles || availableProfiles || null;

      dispatch(apiSlice.util.resetApiState());
      dispatch(
        setCredentials({
          user: normalizedUser,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken || null,
          availableProfiles: nextAvailableProfiles,
        })
      );

      await persistAuthState({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken || null,
        user: normalizedUser,
        availableProfiles: nextAvailableProfiles,
      });

      router.replace("/(tabs)");
    } catch (error: any) {
      const message = String(error?.data?.message || error?.message || "");

      if (error?.status === 400) {
        Alert.alert(
          t("switch_profile", "Switch profile"),
          message || "Vendor profile is not available. Please complete vendor registration first.",
          [
            {
              text: t("ok", "OK"),
              onPress: () => router.replace("/(screens)/CompleteProfileScreen"),
            },
          ]
        );
        return;
      }

      Alert.alert(t("error", "Error"), message || "Failed to switch profile");
    }
  };

  const ConfirmationModal = ({
    visible,
    onClose,
    onConfirm,
    title,
    subtitle,
    confirmText,
    confirmColor,
  }: any) => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
        <View style={{ width: "85%", backgroundColor: "#FFF", borderRadius: 20, padding: 25, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginVertical: 10 }}>{title}</Text>
          <Text style={{ fontSize: 14, color: "#666", textAlign: "center", marginBottom: 25 }}>{subtitle}</Text>
          <View style={{ flexDirection: "row", width: "100%" }}>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", marginHorizontal: 5, backgroundColor: "#F5F5F5" }}
              onPress={onClose}
            >
              <Text style={{ color: "#333", fontWeight: "bold" }}>{t("cancel", "Cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", marginHorizontal: 5, backgroundColor: confirmColor }}
              onPress={onConfirm}
            >
              <Text style={{ color: "#FFF", fontWeight: "bold" }}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  const userData = {
    name: displayUser?.buyer?.fullName || displayUser?.fullName || displayUser?.name || displayUser?.fulllName || "User",
    avatar:
      displayUser?.buyer?.profilePhotoUrl ||
      displayUser?.buyer?.avatar ||
      displayUser?.avatar ||
      displayUser?.image ||
      displayUser?.logo ||
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6",
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/*Account Information Card*/}

        {/* Profile Header */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Image
            source={{ uri: userData.avatar }}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              marginBottom: 12,
            }}
          />
          <Text style={{ fontSize: 22, fontWeight: "600", color: "#111" }}>
            {userData.name}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 1,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#1F2937",
              marginBottom: 20,
            }}
          >
            {t("account_information", "Account Information")}
          </Text>


          {/* Personal Info Link */}
          <TouchableOpacity
            onPress={() => router.push("/(user_screen)/ProfileInfoScreen")}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
              }}
            >
              <Ionicons name="person-outline" size={26} color="#4B5563" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#4B5563",
                  marginLeft: 14,
                  fontWeight: "500",
                }}
              >
                {t("personal_info", "Personal info")}
              </Text>
            </View>
            <MaterialIcons name="arrow-back-ios-new" size={16} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(user_screen)/BuyerTransactionHistoryScreen")}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
              }}
            >
              <AntDesign name="transaction" size={24} color="black" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#4B5563",
                  marginLeft: 14,
                  fontWeight: "500",
                }}
              >
                {t("transaction_history", "Transaction History")}
              </Text>
            </View>
            <MaterialIcons name="arrow-back-ios-new" size={16} color="black" />
          </TouchableOpacity>
        </View>


        {/* Setting Card */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 1,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#1F2937",
              marginBottom: 20,
            }}
          >
            {t("setting", "Setting")}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 14,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="people-outline" size={26} color="#4B5563" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#4B5563",
                  marginLeft: 14,
                  fontWeight: "500",
                }}
              >
                {t("switch_profile", "Switch profile")}
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#78788029", true: "#E3E6F0" }}
              thumbColor="#278687"
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleSwitch}
              value={false}
              disabled={isSwitchingProfile}
            />
          </View>


          {/* Permission Link */}
          <TouchableOpacity
            onPress={() => router.push("/(screens)/permission")}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
              }}
            >
              <Feather name="check-circle" size={24} color="#4B5563" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#4B5563",
                  marginLeft: 14,
                  fontWeight: "500",
                }}
              >
                {t("permission", "Permission")}
              </Text>
            </View>
            <MaterialIcons name="arrow-back-ios-new" size={16} color="black" />
          </TouchableOpacity>
          {/* Settings Link */}
          <TouchableOpacity
            onPress={() => router.push("/(screens)/settings")}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
              }}
            >
              <Ionicons name="settings-outline" size={26} color="#4B5563" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#4B5563",
                  marginLeft: 14,
                  fontWeight: "500",
                }}
              >
                {t("settings", "Settings")}
              </Text>
            </View>
            <MaterialIcons name="arrow-back-ios-new" size={16} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(screens)/language")}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
              }}
            >
              <Ionicons name="language-outline" size={26} color="#4B5563" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#4B5563",
                  marginLeft: 14,
                  fontWeight: "500",
                }}
              >
                {t("language", "Language")}
              </Text>
            </View>
            <MaterialIcons name="arrow-back-ios-new" size={16} color="black" />
          </TouchableOpacity>
        </View>

        {/* Logout Card */}
        <TouchableOpacity
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 1,
          }}
          onPress={() => setShowLogoutModal(true)}
        >
          <MaterialIcons name="logout" size={26} color="#4B5563" />
          <Text
            style={{
              fontSize: 16,
              color: "#4B5563",
              marginLeft: 14,
              fontWeight: "600",
            }}
          >
            {t("logout", "Log Out")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
        onConfirm={onConfirmSwitch}
        title={t("switch_profile_q", "Switch Profile?")}
        subtitle={t("switch_profile_desc_business", "Are you sure you want to switch to Business profile?")}
        confirmText={t("confirm", "Confirm")}
        confirmColor="#2D8C8C"
      />

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={onLogout}
        title={t("logout_q", "Log Out?")}
        subtitle={t("logout_desc", "Are you sure you want to log out?")}
        confirmText={t("logout", "Log Out")}
        confirmColor="#FF3B30"
      />
    </SafeAreaView >
  );
};

export default ProfileScreen;
