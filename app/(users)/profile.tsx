import { SkeletonBlock } from "@/components/ui/skeleton";
import { clearPersistedAuthState, persistAuthState } from "@/services/authStorage";
import { buildApiUrl } from "@/services/apiConfig";
import {
  clearRememberedLogin,
  disableBiometricLogin,
  enableBiometricLogin,
  getBiometricLoginState,
} from "@/services/biometricAuth";
import { unregisterPushTokenFromBackend } from "@/services/pushNotifications";
import { useGetProfileQuery, useSwitchProfileMutation } from "@/store/api/authApiSlice";
import { apiSlice } from "@/store/api/apiSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  logOut,
  selectAvailableProfiles,
  selectCurrentUser,
  setCredentials,
} from "@/store/slices/authSlice";
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../hooks/use-translation";

const cardStyle = {
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 1,
} as const;

const headerTitleStyle = {
  fontSize: 18,
  fontWeight: "700" as const,
  color: "#1F2937",
  marginBottom: 20,
};

const ProfileActionRowSkeleton = ({ switchRow = false }: { switchRow?: boolean }) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
      <SkeletonBlock style={{ width: 26, height: 26, borderRadius: 13 }} />
      <SkeletonBlock style={{ width: "44%", height: 16, borderRadius: 8, marginLeft: 14 }} />
    </View>
    <SkeletonBlock
      style={{
        width: switchRow ? 50 : 16,
        height: switchRow ? 30 : 16,
        borderRadius: switchRow ? 999 : 8,
      }}
    />
  </View>
);

const ProfileScreen = () => {
  const { t, language } = useTranslation();
  const profileArrowIcon = language === "he" ? "arrow-back-ios-new" : "arrow-forward-ios";
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const availableProfiles = useAppSelector(selectAvailableProfiles);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricTypeLabel, setBiometricTypeLabel] = useState("Fingerprint");
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [hasSavedLogin, setHasSavedLogin] = useState(false);
  const [isUpdatingBiometric, setIsUpdatingBiometric] = useState(false);
  const [switchProfile, { isLoading: isSwitchingProfile }] = useSwitchProfileMutation();
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
  } = useGetProfileQuery({});
  const displayUser = profileData?.data || user;
  const shouldShowProfileSkeleton = !displayUser && (isProfileLoading || isProfileFetching);
  const currentModeLabel = t("customer_mode", "Customer");
  const targetModeLabel = t("vendor_mode", "Vendor");
  const switchButtonLabel = t("switch_to_vendor", "Switch to Vendor");

  const refreshBiometricState = useCallback(async () => {
    const state = await getBiometricLoginState();
    setBiometricEnabled(state.biometricEnabled);
    setBiometricTypeLabel(state.biometricTypeLabel);
    setBiometricSupported(state.biometricSupported);
    setBiometricEnrolled(state.biometricEnrolled);
    setHasSavedLogin(!!state.savedCredentials);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshBiometricState();
    }, [refreshBiometricState]),
  );

  const handleBiometricToggle = async (value: boolean) => {
    if (isUpdatingBiometric) return;

    setIsUpdatingBiometric(true);
    try {
      if (!value) {
        await disableBiometricLogin();
        setBiometricEnabled(false);
        return;
      }

      const result = await enableBiometricLogin();

      if (!result.success) {
        if (result.reason === "not_supported") {
          Alert.alert("Biometric unavailable", "This device does not support biometric login.");
        } else if (result.reason === "not_enrolled") {
          Alert.alert("Biometric unavailable", "No fingerprint or biometric is enrolled on this device.");
        } else {
          Alert.alert(
            "Saved login required",
            "Log in once with Remember me enabled before turning on biometric login.",
          );
        }
        return;
      }

      setBiometricEnabled(true);
    } finally {
      setIsUpdatingBiometric(false);
      await refreshBiometricState();
    }
  };

  const onLogout = async () => {
    setShowLogoutModal(false);
    try {
      const [[, accessToken], [, refreshToken]] = await AsyncStorage.multiGet([
        "accessToken",
        "refreshToken",
      ]);
      await unregisterPushTokenFromBackend(accessToken);

      const logoutUrl = buildApiUrl("/auth/logout");
      if (/^https?:\/\//i.test(logoutUrl) && accessToken) {
        try {
          await fetch(logoutUrl, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              refreshToken: refreshToken || undefined,
            }),
          });
        } catch (logoutError) {
          console.warn("Remote logout failed; continuing local sign-out.", logoutError);
        }
      }

      await clearPersistedAuthState();
      await AsyncStorage.removeItem("userType");
      await clearRememberedLogin();

      dispatch(logOut());
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
        }),
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
          ],
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
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
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
      displayUser?.logo,
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
        {shouldShowProfileSkeleton ? (
          <>
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <SkeletonBlock style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 12 }} />
              <SkeletonBlock style={{ width: 156, height: 22, borderRadius: 11 }} />
            </View>

            <View style={cardStyle}>
              <SkeletonBlock style={{ width: 170, height: 22, borderRadius: 10, marginBottom: 20 }} />
              <ProfileActionRowSkeleton />
              <ProfileActionRowSkeleton />
            </View>

            <View style={cardStyle}>
              <SkeletonBlock style={{ width: 92, height: 22, borderRadius: 10, marginBottom: 20 }} />
              <ProfileActionRowSkeleton switchRow />
              <ProfileActionRowSkeleton />
              <ProfileActionRowSkeleton />
              <ProfileActionRowSkeleton />
            </View>

            <View
              style={{
                ...cardStyle,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 0,
              }}
            >
              <SkeletonBlock style={{ width: 26, height: 26, borderRadius: 13 }} />
              <SkeletonBlock style={{ width: 90, height: 16, borderRadius: 8, marginLeft: 14 }} />
            </View>
          </>
        ) : (
          <>
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
              <Text style={{ fontSize: 22, fontWeight: "600", color: "#111" }}>{userData.name}</Text>
            </View>

            <View style={cardStyle}>
              <Text style={headerTitleStyle}>{t("account_information", "Account Information")}</Text>

              <TouchableOpacity
                onPress={() => router.push("/(user_screen)/ProfileInfoScreen")}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}>
                  <Ionicons name="person-outline" size={26} color="#4B5563" />
                  <Text style={{ fontSize: 16, color: "#4B5563", marginLeft: 14, fontWeight: "500" }}>
                    {t("personal_info", "Personal info")}
                  </Text>
                </View>
                <MaterialIcons name={profileArrowIcon} size={16} color="black" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(user_screen)/BuyerTransactionHistoryScreen")}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}>
                  <AntDesign name="transaction" size={24} color="black" />
                  <Text style={{ fontSize: 16, color: "#4B5563", marginLeft: 14, fontWeight: "500" }}>
                    {t("transaction_history", "Transaction History")}
                  </Text>
                </View>
                <MaterialIcons name={profileArrowIcon} size={16} color="black" />
              </TouchableOpacity>
            </View>

            <View style={cardStyle}>
              <Text style={headerTitleStyle}>{t("setting", "Setting")}</Text>

              <View
                style={{
                  paddingVertical: 8,
                  borderRadius: 18,
                  backgroundColor: "#F5FBFA",
                  borderWidth: 1,
                  borderColor: "#D9EEEC",
                  padding: 16,
                  marginBottom: 8,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "#DDF3F1",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="swap-horizontal" size={22} color="#278687" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 16, color: "#111827", fontWeight: "700" }}>
                      {t("switch_profile", "Switch profile")}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 4, lineHeight: 18 }}>
                      {t("current_mode_customer", "You are currently using the Customer profile.")}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  <View
                    style={{
                      backgroundColor: "#278687",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                    }}
                  >
                    <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>{currentModeLabel}</Text>
                  </View>
                  <Ionicons
                    name={language === "he" ? "arrow-back" : "arrow-forward"}
                    size={16}
                    color="#94A3B8"
                    style={{ marginHorizontal: 10 }}
                  />
                  <View
                    style={{
                      backgroundColor: "#E7F0EF",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                    }}
                  >
                    <Text style={{ color: "#355E5E", fontSize: 12, fontWeight: "700" }}>{targetModeLabel}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={toggleSwitch}
                  disabled={isSwitchingProfile}
                  style={{
                    minHeight: 56,
                    borderRadius: 16,
                    backgroundColor: isSwitchingProfile ? "#97C9C5" : "#278687",
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "700" }}>{switchButtonLabel}</Text>

                  </View>
                  {isSwitchingProfile ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons
                      name={language === "he" ? "arrow-back" : "arrow-forward"}
                      size={18}
                      color="#FFF"
                    />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => router.push("/(screens)/permission")}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}>
                  <Feather name="check-circle" size={24} color="#4B5563" />
                  <Text style={{ fontSize: 16, color: "#4B5563", marginLeft: 14, fontWeight: "500" }}>
                    {t("permission", "Permission")}
                  </Text>
                </View>
                <MaterialIcons name={profileArrowIcon} size={16} color="black" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(screens)/settings")}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}>
                  <Ionicons name="settings-outline" size={26} color="#4B5563" />
                  <Text style={{ fontSize: 16, color: "#4B5563", marginLeft: 14, fontWeight: "500" }}>
                    {t("settings", "Settings")}
                  </Text>
                </View>
                <MaterialIcons name={profileArrowIcon} size={16} color="black" />
              </TouchableOpacity>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, flex: 1 }}>
                  <Ionicons name="finger-print-outline" size={26} color="#4B5563" />
                  <View style={{ marginLeft: 14, flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontSize: 16, color: "#4B5563", fontWeight: "500" }}>
                      {`${biometricTypeLabel} Login`}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4, lineHeight: 17 }}>
                      {biometricEnabled
                        ? "Biometric login is on for your saved account."
                        : !biometricSupported
                          ? "This device does not support biometric login."
                          : !biometricEnrolled
                            ? "Set up a fingerprint or biometric on this device first."
                            : hasSavedLogin
                              ? "Turn this on to use biometric login next time."
                              : "Use Remember me on login once before enabling this."}
                    </Text>
                  </View>
                </View>

                {isUpdatingBiometric ? (
                  <ActivityIndicator size="small" color="#278687" />
                ) : (
                  <Switch
                    value={biometricEnabled}
                    onValueChange={(value) => void handleBiometricToggle(value)}
                    trackColor={{ false: "#D1D5DB", true: "#9FD6D1" }}
                    thumbColor={biometricEnabled ? "#278687" : "#FFFFFF"}
                  />
                )}
              </View>

              <TouchableOpacity
                onPress={() => router.push("/(screens)/language")}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}>
                  <Ionicons name="language-outline" size={26} color="#4B5563" />
                  <Text style={{ fontSize: 16, color: "#4B5563", marginLeft: 14, fontWeight: "500" }}>
                    {t("language", "Language")}
                  </Text>
                </View>
                <MaterialIcons name={profileArrowIcon} size={16} color="black" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{
                ...cardStyle,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 0,
              }}
              onPress={() => setShowLogoutModal(true)}
            >
              <MaterialIcons name="logout" size={26} color="#4B5563" />
              <Text style={{ fontSize: 16, color: "#4B5563", marginLeft: 14, fontWeight: "600" }}>
                {t("logout", "Log Out")}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <ConfirmationModal
        visible={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
        onConfirm={onConfirmSwitch}
        title={t("switch_profile_q", "Switch Profile?")}
        subtitle={t(
          "switch_profile_desc_vendor",
          "Are you sure you want to switch to the Vendor profile?",
        )}
        confirmText={t("confirm", "Confirm")}
        confirmColor="#2D8C8C"
      />

      <ConfirmationModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={onLogout}
        title={t("logout_q", "Log Out?")}
        subtitle={t("logout_desc", "Are you sure you want to log out?")}
        confirmText={t("logout", "Log Out")}
        confirmColor="#FF3B30"
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;
