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

const AbcdStoreCard = () => {
  const { language } = useTranslation();
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

  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        myQrCode: "×§×•×“ ×”-QR ×©×œ×™",
        officialStoreLink: "×§×™×©×•×¨ ×—× ×•×ª ×¨×©×ž×™",
        shareQrCode: "×©×ª×£ ×§×•×“ QR",
        vendorCode: "×§×•×“ ×¡×¤×§",
        copy: "×”×¢×ª×§",
        copied: "×”×•×¢×ª×§",
        codeCopied: "Vendor code copied to clipboard!",
        shareMessage: `×‘×“×§×• ××ª ×”×—× ×•×ª ×”×¨×©×ž×™×ª ×©×œ× ×•: ${storeUrl}`,
        qrFallback:
          "×œ× × ×™×ª×Ÿ ×”×™×” ×œ×˜×¢×•×Ÿ QR ×ž×”×©×¨×ª. ×ž×•×¦×’ QR ×ž×§×•×ž×™.",
      };
    }
    if (language === "hi") {
      return {
        myQrCode: "à¤®à¥‡à¤°à¤¾ QR à¤•à¥‹à¤¡",
        officialStoreLink: "à¤‘à¤«à¤¿à¤¶à¤¿à¤¯à¤² à¤¸à¥à¤Ÿà¥‹à¤° à¤²à¤¿à¤‚à¤•",
        shareQrCode: "QR à¤•à¥‹à¤¡ à¤¶à¥‡à¤¯à¤° à¤•à¤°à¥‡à¤‚",
        vendorCode: "à¤µà¥‡à¤‚à¤¡à¤° à¤•à¥‹à¤¡",
        copy: "à¤•à¥‰à¤ªà¥€ à¤•à¤°à¥‡à¤‚",
        copied: "à¤•à¥‰à¤ªà¥€ à¤¹à¥à¤†",
        codeCopied: "Vendor code copied to clipboard!",
        shareMessage: `à¤¹à¤®à¤¾à¤°à¥‡ à¤†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• à¤¸à¥à¤Ÿà¥‹à¤° à¤•à¥‹ à¤¦à¥‡à¤–à¥‡à¤‚: ${storeUrl}`,
        qrFallback:
          "à¤¸à¤°à¥à¤µà¤° QR à¤²à¥‹à¤¡ à¤¨à¤¹à¥€à¤‚ à¤¹à¥à¤†à¥¤ à¤²à¥‹à¤•à¤² QR à¤¦à¤¿à¤–à¤¾à¤¯à¤¾ à¤œà¤¾ à¤°à¤¹à¤¾ à¤¹à¥ˆà¥¤",
      };
    }
    return {
      myQrCode: "My QR Code",
      officialStoreLink: "Official Store Link",
      shareQrCode: "Share QR Code",
      vendorCode: "Vendor Code",
      copy: "Copy",
      copied: "Copied",
      codeCopied: "Vendor code copied to clipboard!",
      shareMessage: `Check out our official store: ${storeUrl}`,
      qrFallback: "Could not load server QR. Showing local fallback QR.",
    };
  }, [language, storeUrl]);

  const copyToClipboard = async () => {
    if (!vendorCode) {
      Alert.alert("Unavailable", "Vendor code not found yet.");
      return;
    }
    await Clipboard.setStringAsync(vendorCode);
    Alert.alert(ui.copied, ui.codeCopied);
  };

  // Function for the Share button
  const onShare = async () => {
    try {
      if (!vendorCode) {
        Alert.alert("Unavailable", "Vendor code not found yet.");
        return;
      }
      await Share.share({
        message: ui.shareMessage,
      });
    } catch (error) {
      // Check if error is an instance of Error to access .message safely
      if (error instanceof Error) {
        console.log(error.message);
      } else {
        console.log("An unknown error occurred");
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F7F5" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios-new" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>{ui.myQrCode}</Text>
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
              source={{ uri: avatarUri }}
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#1A1A1A",
              marginBottom: 12,
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
            }}
          >
            {ui.officialStoreLink}
          </Text>

          {/* QR Code Section */}
          <View
            style={{
              padding: 16,
              borderWidth: 1,
              borderColor: "#E8F0FE",
              borderRadius: 24,
              marginBottom: 24, // Adjusted spacing
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
            <Text style={{ color: "#B45309", fontSize: 12, marginBottom: 12 }}>
              {ui.qrFallback}
            </Text>
          ) : null}

          {/* --- ADDED SHARE BUTTON --- */}
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
              {ui.shareQrCode}
            </Text>
          </TouchableOpacity>

          {/* Vendor Input Section */}
          <View style={{ width: "100%" }}>
            <Text
              style={{
                fontSize: 16,
                color: "#444",
                fontWeight: "500",
                marginBottom: 10,
              }}
            >
              {ui.vendorCode}
            </Text>

            <View
              style={{
                flexDirection: "row",
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
                <Text style={{ color: "#666", fontSize: 15 }}>
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
                <Text
                  style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}
                >
                  {ui.copy}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AbcdStoreCard;
