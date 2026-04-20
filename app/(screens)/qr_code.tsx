import { getLayoutDirection } from "@/constants/rtl";
import { useTranslation } from "@/hooks/use-translation";
import { useGetProfileQuery } from "@/store/api/authApiSlice";
import { useGetVendorQrQuery } from "@/store/api/connectionApiSlice";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const normalizeVendorCode = (rawCode: string) => {
  const trimmed = (rawCode || "").trim();
  if (!trimmed) return "";

  // Accept values like full URL, "v.CODE", "/v/CODE", ".CODE" and normalize to only CODE.
  return trimmed
    .replace(/^https?:\/\/[^/]+\/v[/.]/i, "")
    .replace(/^v[/.]/i, "")
    .replace(/^[./]+/, "");
};

const QrCodeScreen = () => {
  const { language, t } = useTranslation();
  const isRTL = getLayoutDirection(language) === "rtl";
  const user = useAppSelector(selectCurrentUser);
  const { data: profileData } = useGetProfileQuery(undefined, {
    refetchOnFocus: true,
  });

  const vendorId =
    (profileData as any)?.data?.vendor?.id ||
    (profileData as any)?.data?.vendor?._id ||
    (user as any)?.vendor?.id ||
    (user as any)?.vendor?._id;

  const {
    data: qrData,
    isLoading: isQrLoading,
    isError: isQrError,
  } = useGetVendorQrQuery(vendorId, { skip: !vendorId });

  const displayUser = (profileData as any)?.data || user;
  const rawVendorCode =
    qrData?.vendorCode ||
    (displayUser as any)?.vendorCode ||
    (displayUser as any)?.vendor_code ||
    (displayUser as any)?.vendor?.vendorCode ||
    (displayUser as any)?.vendor?.vendor_code ||
    (displayUser as any)?.vendorID ||
    (displayUser as any)?.code ||
    "";
  const vendorCode = normalizeVendorCode(rawVendorCode);
  const businessName =
    (displayUser as any)?.vendor?.businessName ||
    (displayUser as any)?.vendor?.storename ||
    (displayUser as any)?.businessName ||
    (displayUser as any)?.storename ||
    "Your Store";
  const avatarUri =
    (displayUser as any)?.vendor?.logoUrl ||
    (displayUser as any)?.vendor?.logo ||
    (displayUser as any)?.logo ||
    (displayUser as any)?.image ||
    (displayUser as any)?.avatar;
  const hasVendorCode = Boolean(vendorCode);
  const storeUrl = hasVendorCode ? `https://abcd.store/v/${vendorCode}` : "";
  const qrValue = vendorCode || storeUrl || "https://abcd.store";
  const shareMessage = `${t("qr_share_message_prefix", "Check out our official store:")} ${storeUrl}`.trim();

  const copyToClipboard = async () => {
    if (!vendorCode) {
      Alert.alert(
        t("qr_unavailable_title", "Unavailable"),
        t("qr_vendor_not_found", "Vendor code not found yet."),
      );
      return;
    }

    await Clipboard.setStringAsync(vendorCode);
    Alert.alert(
      t("qr_copied", "Copied"),
      t("qr_code_copied", "Vendor code copied to clipboard!"),
    );
  };

  const onShare = async () => {
    try {
      if (!vendorCode) {
        Alert.alert(
          t("qr_unavailable_title", "Unavailable"),
          t("qr_vendor_not_found", "Vendor code not found yet."),
        );
        return;
      }

      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
      } else {
        console.log("An unknown error occurred");
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F7F5" }}>
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios-new" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>
          {t("qr_my_code", "My QR Code")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            width: width * 0.9,
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingVertical: 32,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <View style={{ marginBottom: 16 }}>
            <Image
              source={
                avatarUri
                  ? { uri: avatarUri }
                  : require("@/assets/images/logo.png")
              }
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#1A1A1A",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            {businessName}
          </Text>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "600",
              color: "#328888",
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            {t("qr_official_store_link", "Official Store Link")}
          </Text>

          <View
            style={{
              padding: 16,
              borderWidth: 1,
              borderColor: "#E8F0FE",
              borderRadius: 24,
              marginBottom: 24,
              backgroundColor: "#FFF",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isQrLoading ? (
              <View
                style={{
                  width: 180,
                  height: 180,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#328888" />
              </View>
            ) : (
              <QRCode
                value={qrValue}
                size={180}
                color="#000"
                backgroundColor="#FFFFFF"
              />
            )}
          </View>

          {isQrError ? (
            <Text
              style={{
                color: "#B45309",
                fontSize: 12,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {t(
                "qr_fallback",
                "Could not load server QR. Showing local fallback QR.",
              )}
            </Text>
          ) : null}

          <TouchableOpacity
            onPress={onShare}
            activeOpacity={0.8}
            style={{
              backgroundColor: "#328888",
              width: "100%",
              height: 54,
              borderRadius: 12,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>
              {t("qr_share_code", "Share QR Code")}
            </Text>
          </TouchableOpacity>

          <View style={{ width: "100%" }}>
            <Text
              style={{
                fontSize: 16,
                color: "#444",
                fontWeight: "500",
                marginBottom: 10,
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {t("qr_vendor_code", "Vendor Code")}
            </Text>

            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                height: 54,
                width: "100%",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#D1D1D1",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  paddingHorizontal: 16,
                  backgroundColor: "#F9F9F9",
                }}
              >
                <Text
                  style={{
                    color: "#666",
                    fontSize: 15,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {vendorCode || "-"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={copyToClipboard}
                activeOpacity={0.8}
                style={{
                  backgroundColor: "#328888",
                  paddingHorizontal: 24,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>
                  {t("qr_copy", "Copy")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default QrCodeScreen;
