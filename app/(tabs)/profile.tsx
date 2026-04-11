import { SkeletonBlock } from "@/components/ui/skeleton";
import { persistAuthState } from "@/services/authStorage";
import { unregisterPushTokenFromBackend } from "@/services/pushNotifications";
import { apiSlice } from "@/store/api/apiSlice";
import { useGetProfileQuery, useSwitchProfileMutation } from "@/store/api/authApiSlice";
import {
  useCreateAccountLinkMutation,
  useCreateVendorAccountMutation,
  useGetVendorAccountStatusQuery,
} from "@/store/api/paymentApiSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  logOut,
  selectAvailableProfiles,
  selectCurrentAccessToken,
  selectCurrentUser,
  setCredentials,
} from "@/store/slices/authSlice";
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

const sectionTitleStyle = {
  fontSize: 18,
  fontWeight: "700" as const,
  color: "#1F2937",
  marginBottom: 20,
};

const ProfileActionRowSkeleton = () => (
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
    <SkeletonBlock style={{ width: 16, height: 16, borderRadius: 8 }} />
  </View>
);

const ProfileScreen = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const accessToken = useAppSelector(selectCurrentAccessToken);
  const availableProfiles = useAppSelector(selectAvailableProfiles);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [switchProfile, { isLoading: isSwitchingProfile }] = useSwitchProfileMutation();
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
  } = useGetProfileQuery({});

  const {
    data: stripeStatus,
    isLoading: isStripeLoading,
    refetch: refetchStripeStatus,
  } = useGetVendorAccountStatusQuery(undefined, { skip: !user });

  const [createVendorAccount, { isLoading: isCreatingAccount }] = useCreateVendorAccountMutation();
  const [createAccountLink, { isLoading: isCreatingLink }] = useCreateAccountLinkMutation();

  const displayUser = profileData?.data || user;
  const shouldShowProfileSkeleton = !displayUser && (isProfileLoading || isProfileFetching);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        refetchStripeStatus();
      }
    }, [user, refetchStripeStatus]),
  );

  const handleConnectStripe = async () => {
    try {
      if (!stripeStatus?.stripeAccountId) {
        await createVendorAccount({}).unwrap();
      }

      const linkResponse = await createAccountLink({}).unwrap();
      const onboardingUrl =
        linkResponse?.url ||
        linkResponse?.accountLink ||
        linkResponse?.onboardingUrl ||
        linkResponse?.data?.url;

      if (onboardingUrl) {
        router.push({
          pathname: "/(screens)/stripe_webview",
          params: {
            url: encodeURIComponent(onboardingUrl),
            flow: "connect",
            title: "Stripe Connect",
          },
        });
        return;
      }

      Alert.alert("Error", "Stripe onboarding link was not returned.");
    } catch (error: any) {
      console.error("Stripe Connect error:", error);
      Alert.alert("Error", error?.data?.message || "Failed to initiate Stripe connection.");
    }
  };

  const onLogout = async () => {
    setShowLogoutModal(false);
    try {
      await unregisterPushTokenFromBackend(accessToken);

      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("userRole");
      await AsyncStorage.removeItem("userType");
      await AsyncStorage.removeItem("availableProfiles");

      dispatch(logOut());
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.replace("/(auth)/login");
    }
  };

  const toggleSwitch = () => {
    setShowSwitchModal(true);
  };

  const onConfirmSwitch = async () => {
    setShowSwitchModal(false);

    try {
      const response = await switchProfile("buyer").unwrap();
      const payload = response?.data || response;

      if (!payload?.accessToken || !payload?.user) {
        throw new Error("Invalid switch profile response");
      }

      const normalizedUser = { ...payload.user, userType: "buyer" };
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

      router.replace("/(users)");
    } catch (error: any) {
      const message = String(error?.data?.message || error?.message || "");

      if (error?.status === 400) {
        Alert.alert(
          t("switch_profile", "Switch profile"),
          message || "Buyer profile is not available. Please complete buyer registration first.",
          [
            {
              text: t("ok", "OK"),
              onPress: () => router.replace("/(user_screen)/CompleteProfileScreen"),
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
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: "85%",
            backgroundColor: "#FFF",
            borderRadius: 20,
            padding: 25,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "bold", marginVertical: 10 }}>{title}</Text>
          <Text style={{ fontSize: 14, color: "#666", textAlign: "center", marginBottom: 25 }}>
            {subtitle}
          </Text>
          <View style={{ flexDirection: "row", width: "100%" }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: "center",
                marginHorizontal: 5,
                backgroundColor: "#F5F5F5",
              }}
              onPress={onClose}
            >
              <Text style={{ color: "#333", fontWeight: "bold" }}>{t("cancel", "Cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: "center",
                marginHorizontal: 5,
                backgroundColor: confirmColor,
              }}
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
    name:
      displayUser?.vendor?.fullName ||
      displayUser?.fullName ||
      displayUser?.name ||
      displayUser?.storename ||
      displayUser?.businessName ||
      "User",
    avatar:
      displayUser?.vendor?.logoUrl ||
      displayUser?.vendor?.logo ||
      displayUser?.logo ||
      displayUser?.image ||
      displayUser?.avatar,
  };

  const isStripeConnected = Boolean(stripeStatus?.chargesEnabled && stripeStatus?.payoutsEnabled);
  const stripeStatusLabel = String(stripeStatus?.status || "").toLowerCase();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
        {shouldShowProfileSkeleton ? (
          <>
            <View style={cardStyle}>
              <View style={{ alignItems: "center", marginBottom: 24 }}>
                <SkeletonBlock style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 12 }} />
                <SkeletonBlock style={{ width: 160, height: 22, borderRadius: 11 }} />
              </View>
              <SkeletonBlock style={{ width: 170, height: 22, borderRadius: 10, marginBottom: 20 }} />
              <ProfileActionRowSkeleton />
              <ProfileActionRowSkeleton />
              <ProfileActionRowSkeleton />
              <ProfileActionRowSkeleton />
            </View>

            <View style={cardStyle}>
              <SkeletonBlock style={{ width: 145, height: 22, borderRadius: 10, marginBottom: 20 }} />
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <SkeletonBlock style={{ width: 26, height: 26, borderRadius: 13 }} />
                  <SkeletonBlock style={{ width: 132, height: 16, borderRadius: 8, marginLeft: 14 }} />
                </View>
                <SkeletonBlock style={{ width: 84, height: 32, borderRadius: 8 }} />
              </View>
              <SkeletonBlock style={{ width: "74%", height: 12, borderRadius: 6, marginTop: 14 }} />
              <SkeletonBlock style={{ width: 108, height: 12, borderRadius: 6, marginTop: 8 }} />
            </View>

            <View style={cardStyle}>
              <SkeletonBlock style={{ width: 92, height: 22, borderRadius: 10, marginBottom: 20 }} />
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
                  <SkeletonBlock style={{ width: 120, height: 16, borderRadius: 8, marginLeft: 14 }} />
                </View>
                <SkeletonBlock style={{ width: 50, height: 30, borderRadius: 999 }} />
              </View>
              <ProfileActionRowSkeleton />
              <ProfileActionRowSkeleton />
              <ProfileActionRowSkeleton />
            </View>

            <View style={{ ...cardStyle, flexDirection: "row", alignItems: "center", marginBottom: 0 }}>
              <SkeletonBlock style={{ width: 26, height: 26, borderRadius: 13 }} />
              <SkeletonBlock style={{ width: 90, height: 16, borderRadius: 8, marginLeft: 14 }} />
            </View>
          </>
        ) : (
          <>
            <View style={cardStyle}>
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

              <Text style={sectionTitleStyle}>{t("account_information", "Account Information")}</Text>

              <TouchableOpacity
                onPress={() => router.push("/(screens)/personal_info")}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}>
                  <Ionicons name="person-outline" size={26} color="#4B5563" />
                  <Text style={{ fontSize: 16, color: "#4B5563", marginLeft: 14, fontWeight: "500" }}>
                    {t("personal_info", "Personal info")}
                  </Text>
                </View>
                <MaterialIcons name="arrow-back-ios-new" size={16} color="black" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(screens)/business_info")}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}>
                  <Ionicons name="business-outline" size={26} color="#4B5563" />
                  <Text style={{ fontSize: 16, color: "#4B5563", marginLeft: 14, fontWeight: "500" }}>
                    {t("business_info", "Business info")}
                  </Text>
                </View>
                <MaterialIcons name="arrow-back-ios-new" size={16} color="black" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(screens)/transaction_history")}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}>
                  <AntDesign name="transaction" size={24} color="black" />
                  <Text style={{ fontSize: 16, color: "#4B5563", marginLeft: 14, fontWeight: "500" }}>
                    {t("transaction_history", "Transaction History")}
                  </Text>
                </View>
                <MaterialIcons name="arrow-back-ios-new" size={16} color="black" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(screens)/MakeCoupon")}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14 }}>
                  <MaterialCommunityIcons name="ticket-percent-outline" size={26} color="#4B5563" />
                  <Text style={{ fontSize: 16, color: "#4B5563", marginLeft: 14, fontWeight: "500" }}>
                    {t("make_coupon", "Make a coupon")}
                  </Text>
                </View>
                <MaterialIcons name="arrow-back-ios-new" size={16} color="black" />
              </TouchableOpacity>
            </View>

            <View style={cardStyle}>
              <Text style={sectionTitleStyle}>{t("payout_settings", "Payout Settings")}</Text>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons name="bank-transfer" size={26} color="#4B5563" />
                  <Text style={{ fontSize: 16, color: "#4B5563", marginLeft: 14, fontWeight: "500" }}>
                    {t("stripe_connect", "Stripe Connect")}
                  </Text>
                </View>

                {isStripeLoading ? (
                  <ActivityIndicator size="small" color="#2D8C8C" />
                ) : isStripeConnected ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#E8F5E9",
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 12,
                    }}
                  >
                    <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                    <Text style={{ color: "#4CAF50", fontWeight: "bold", marginLeft: 5, fontSize: 12 }}>
                      {stripeStatusLabel === "verified" ? "Verified" : t("connected", "Connected")}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleConnectStripe}
                    disabled={isCreatingAccount || isCreatingLink}
                    style={{
                      backgroundColor: "#635BFF",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    {isCreatingAccount || isCreatingLink ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 12 }}>
                          {t("connect", "Connect")}
                        </Text>
                        <MaterialIcons name="arrow-back" size={12} color="#FFF" style={{ marginLeft: 4 }} />
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {!isStripeConnected && !isStripeLoading && (
                <Text style={{ fontSize: 12, color: "#666", marginTop: 10, fontStyle: "italic" }}>
                  {t("stripe_connect_hint", "Connect your Stripe account to receive payouts.")}
                </Text>
              )}

              {stripeStatus?.stripeAccountId ? (
                <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 8 }}>
                  Stripe ID: {stripeStatus.stripeAccountId}
                </Text>
              ) : null}
            </View>

            <View style={cardStyle}>
              <Text style={sectionTitleStyle}>{t("setting", "Setting")}</Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="people-outline" size={26} color="#4B5563" />
                  <Text style={{ fontSize: 16, color: "#4B5563", marginLeft: 14, fontWeight: "500" }}>
                    {t("switch_profile", "Switch profile")}
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: "#78788029", true: "#E3E6F0" }}
                  thumbColor="#278687"
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={toggleSwitch}
                  value={true}
                  disabled={isSwitchingProfile}
                />
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
                <MaterialIcons name="arrow-back-ios-new" size={16} color="black" />
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
                <MaterialIcons name="arrow-back-ios-new" size={16} color="black" />
              </TouchableOpacity>

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
                <MaterialIcons name="arrow-back-ios-new" size={16} color="black" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{ ...cardStyle, flexDirection: "row", alignItems: "center", marginBottom: 0 }}
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
        subtitle={t("switch_profile_desc_personal", "Are you sure you want to switch to Personal profile?")}
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
