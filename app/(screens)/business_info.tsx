import { images } from "@/constants/import_images";
import { useTranslation } from "@/hooks/use-translation";
import { useGetProfileQuery } from "@/store/api/authApiSlice";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Fontisto from "@expo/vector-icons/Fontisto";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const VerificationCard = () => {
  const { language, t } = useTranslation();
  const currentUser = useAppSelector(selectCurrentUser);
  const { data: profileData } = useGetProfileQuery({});
  const displayUser = profileData?.data || currentUser;
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        businessInformation: "מידע עסקי",
        contactInformation: "פרטי קשר",
        businessName: "שם העסק",
        phone: "טלפון",
        identification: "זיהוי",
        businessId: "מזהה עסק",
        warning: "אם תשנה מידע עסקי, סטטוס האימות ייבדק מחדש ויכול לקחת עד 15 ימים.",
      };
    }
    if (language === "hi") {
      return {
        businessInformation: "व्यवसाय जानकारी",
        contactInformation: "संपर्क जानकारी",
        businessName: "व्यवसाय का नाम",
        phone: "फोन",
        identification: "पहचान",
        businessId: "व्यवसाय आईडी",
        warning: "अगर आप कोई व्यवसाय जानकारी बदलते हैं, तो आपका सत्यापन स्टेटस फिर से समीक्षा किया जाएगा और इसमें 15 दिन लग सकते हैं।",
      };
    }
    return {
      businessInformation: "Business Information",
      contactInformation: "Contact Information",
      businessName: "Business Name",
      phone: "Phone",
      identification: "Identification",
      businessId: "Business ID",
      warning: "If you change any business information, your verification status will be reviewed again and may take up to 15 days.",
    };
  }, [language]);
  const [user, setUser] = useState({
    businessName: displayUser?.vendor?.businessName || displayUser?.vendor?.storename || "N/A",
    avatar:
      displayUser?.vendor?.logoUrl ||
      displayUser?.vendor?.logo ||
      displayUser?.logo ||
      displayUser?.image ||
      "N/A",
    dob: displayUser?.dob || "N/A",
    email: displayUser?.email || "N/A",
    phone: displayUser?.vendor?.phone || displayUser?.vendor?.phoneNumber || "N/A",
    address: displayUser?.vendor?.address || "N/A",
    bussinessRegNumber: displayUser?.vendor?.bussinessRegNumber || "N/A",
  });

  // Effect to update local state when profileData changes
  React.useEffect(() => {
    if (displayUser) {
      setUser({
        businessName: displayUser?.vendor?.businessName || displayUser?.vendor?.storename || "N/A",
        avatar:
          displayUser?.vendor?.logoUrl ||
          displayUser?.vendor?.logo ||
          displayUser?.logo ||
          displayUser?.image ||
          "N/A",
        dob: displayUser?.dob || "N/A",
        email: displayUser?.email || "N/A",
        phone: displayUser?.vendor?.phone || displayUser?.vendor?.phoneNumber || "N/A",
        address: displayUser?.vendor?.address || "N/A",
        bussinessRegNumber: displayUser?.vendor?.bussinessRegNumber || "N/A",
      });
    }
  }, [displayUser]);

  // handle back
  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Main Card */}
        <View>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
            }}
          >
            <TouchableOpacity onPress={() => handleBack()}>
              <MaterialIcons
                name="arrow-back-ios-new"
                size={24}
                color="black"
              />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>
              {t("business_info", "Business info")}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(screens)/edit_business_info")}
              style={{
                backgroundColor: "#278687",
                padding: 8,
                borderRadius: 10,
              }}
            >
              <MaterialIcons name="edit" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
              padding: 24,
              marginTop: 16,
            }}
          >
            <View
              style={{
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Image
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 50,
                }}
                source={user.avatar && user.avatar !== "N/A" ? { uri: user.avatar } : images.welcome_image}
              />
            </View>
            {/* Personal Information Section */}
            <View style={{ marginBottom: 32 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#000000",
                  marginBottom: 24,
                  letterSpacing: 0.2,
                }}
              >
                {ui.businessInformation}
              </Text>
              {/* Business Name*/}
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <View style={{ marginTop: 4 }}>
                  {/* REMOVED the <Text> wrapper around Feather icon */}
                  <Feather name="user" size={24} color="black" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#666666",
                      marginBottom: 8,
                    }}
                  >
                    {ui.businessName}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "400",
                      color: "#000000",
                    }}
                  >
                    {user.businessName}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: "#e0e0e0",
                  marginBottom: 24,
                }}
              />
              {/* Contact Information */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#000000",
                  marginBottom: 24,
                  letterSpacing: 0.2,
                }}
              >
                {ui.contactInformation}
              </Text>

              {/* Email */}
              <View
                style={{
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View style={{ marginTop: 4 }}>
                  {/* REMOVED the <Text> wrapper around Feather icon */}
                  <Fontisto name="email" size={24} color="black" />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#666666",
                      marginBottom: 8,
                      letterSpacing: 0.2,
                    }}
                  >
                    {t("info_email", "Email")}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "400",
                      color: "#000000",
                      letterSpacing: 0.2,
                    }}
                  >
                    {user.email}
                  </Text>
                </View>
              </View>

              {/* Phone */}
              <View
                style={{
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View style={{ marginTop: 4 }}>
                  {/* REMOVED the <Text> wrapper around Feather icon */}
                  <FontAwesome6 name="phone" size={24} color="black" />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#666666",
                      marginBottom: 8,
                      letterSpacing: 0.2,
                    }}
                  >
                    {ui.phone}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "400",
                      color: "#000000",
                      letterSpacing: 0.2,
                    }}
                  >
                    {user.phone}
                  </Text>
                </View>
              </View>

              {/* Address */}
              <View
                style={{
                  marginBottom: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View style={{ marginTop: 4 }}>
                  {/* REMOVED the <Text> wrapper around Feather icon */}
                  <SimpleLineIcons
                    name="location-pin"
                    size={24}
                    color="black"
                  />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#666666",
                      marginBottom: 8,
                      letterSpacing: 0.2,
                    }}
                  >
                    {t("info_address_1", "Address")}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "400",
                      color: "#000000",
                      letterSpacing: 0.2,
                      lineHeight: 22,
                    }}
                  >
                    {user.address}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: "#e0e0e0",
                  marginBottom: 24,
                }}
              />

              {/* Identification */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#000000",
                  marginBottom: 24,
                  letterSpacing: 0.2,
                }}
              >
                {ui.identification}
              </Text>
              {/* Business ID */}
              <View
                style={{
                  marginBottom: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View style={{ marginTop: 4 }}>
                  {/* REMOVED the <Text> wrapper around Feather icon */}
                  <FontAwesome name="id-card-o" size={24} color="black" />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#666666",
                      marginBottom: 8,
                      letterSpacing: 0.2,
                    }}
                  >
                    {ui.businessId}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "400",
                      color: "#000000",
                      letterSpacing: 0.2,
                    }}
                  >
                    {user.bussinessRegNumber}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: "#e0e0e0",
                  marginBottom: 24,
                }}
              />

              {/* Warning Note */}
              <View
                style={{
                  backgroundColor: "#F3F8F4",
                  padding: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#278687",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "400",
                    color: "#333333",
                    lineHeight: 20,
                    letterSpacing: 0.2,
                  }}
                >
                  {ui.warning}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default VerificationCard;
