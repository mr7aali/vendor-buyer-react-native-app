import { useGetProfileQuery } from "@/store/api/authApiSlice";
import { useTranslation } from "@/hooks/use-translation";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PersonalInfoScreen = () => {
  const { language, t } = useTranslation();
  const currentUser = useAppSelector(selectCurrentUser);
  const { data: profileData } = useGetProfileQuery({});
  const displayUser = profileData?.data || currentUser;
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        personalInformation: "מידע אישי",
        contactInformation: "פרטי קשר",
        identification: "זיהוי",
        fullName: "שם מלא",
        dateOfBirth: "תאריך לידה",
        phone: "טלפון",
        idType: "סוג מזהה",
        idNumber: "מספר מזהה",
      };
    }
    if (language === "hi") {
      return {
        personalInformation: "व्यक्तिगत जानकारी",
        contactInformation: "संपर्क जानकारी",
        identification: "पहचान",
        fullName: "पूरा नाम",
        dateOfBirth: "जन्म तिथि",
        phone: "फोन",
        idType: "आईडी प्रकार",
        idNumber: "आईडी नंबर",
      };
    }
    return {
      personalInformation: "Personal Information",
      contactInformation: "Contact Information",
      identification: "Identification",
      fullName: "Full Name",
      dateOfBirth: "Date of Birth",
      phone: "Phone",
      idType: "ID Type",
      idNumber: "ID Number",
    };
  }, [language]);

  console.log(displayUser, "displayUser");
  // Initialize state with Redux data or defaults
  const [user, setUser] = useState({
    name: displayUser?.vendor?.fullName || displayUser?.buyer?.fullName || displayUser?.fullName || displayUser?.name || "N/A",
    avatar:
      displayUser?.vendor?.logoUrl ||
      displayUser?.vendor?.logo ||
      displayUser?.buyer?.profilePhotoUrl ||
      displayUser?.avatar ||
      displayUser?.image ||
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6",
    dob: displayUser?.dob || "N/A",
    email: displayUser?.email || "N/A",
    phone: displayUser?.vendor?.phone || displayUser?.buyer?.phone || displayUser?.phone || displayUser?.phoneNumber || "N/A",
    idType: displayUser?.vendor?.idType || displayUser?.buyer?.idType || "National ID",
    nationalIdNumber: displayUser?.vendor?.nationalIdNumber || displayUser?.buyer?.nidNumber || "N/A",
  });

  // Effect to update local state when profileData changes
  React.useEffect(() => {
    if (displayUser) {
      setUser({
        name: displayUser?.vendor?.fullName || displayUser?.buyer?.fullName || displayUser?.fullName || displayUser?.name || "N/A",
        avatar:
          displayUser?.vendor?.logoUrl ||
          displayUser?.vendor?.logo ||
          displayUser?.buyer?.profilePhotoUrl ||
          displayUser?.avatar ||
          displayUser?.image ||
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6",
        dob: displayUser?.dob || "N/A",
        email: displayUser?.email || "N/A",
        phone: displayUser?.vendor?.phone || displayUser?.buyer?.phone || displayUser?.phone || displayUser?.phoneNumber || "N/A",
        idType: displayUser?.vendor?.idType || displayUser?.buyer?.idType || "National ID",
        nationalIdNumber: displayUser?.vendor?.nationalIdNumber || displayUser?.buyer?.nidNumber || "N/A",
      });
    }
  }, [displayUser]);


  // Function to handle image picker
  const handleImagePicker = async () => {
    // Request permissions
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        t("permission_required", "Permission Required"),
        t("need_photos_permission", "Please grant camera roll permissions to upload an image.")
      );
      return;
    }

    // Open gallery directly
    openGallery();
  };

  // Open gallery
  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setUser((prev) => ({ ...prev, avatar: result.assets[0].uri }));
      }
    } catch {
      Alert.alert(t("error", "Error"), t("failed_pick_image", "Failed to pick image. Please try again."));
    }
  };

  // Helper to render Info Rows
  const InfoRow = ({
    icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string;
  }) => (
    <View
      style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
    >
      <View style={{ width: 40 }}>{icon}</View>
      <View>
        <Text style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 2 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 16, color: "#1F2937", fontWeight: "600" }}>
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 15,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#4B5563" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1F2937" }}>
          {t("personal_info", "Personal info")}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(screens)/edit_personal_info")}
          style={{
            backgroundColor: "#278687",
            padding: 8,
            borderRadius: 10,
          }}
        >
          <MaterialIcons name="edit" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* Profile Image Section */}
        <View style={{ alignItems: "center", marginTop: 20, marginBottom: 30 }}>
          <View style={{ position: "relative" }}>
            <Image
              source={{ uri: user.avatar }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 2,
                borderColor: "#E5E7EB",
              }}
            />
            <TouchableOpacity
              onPress={handleImagePicker}
              style={{
                position: "absolute",
                bottom: 5,
                right: 5,
                backgroundColor: "#278687",
                padding: 6,
                borderRadius: 15,
                borderWidth: 2,
                borderColor: "#fff",
              }}
            >
              <MaterialIcons name="photo-camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
            <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#1F2937",
              marginTop: 15,
            }}
          >
            {user.name}
          </Text>
        </View>

        {/* Personal Information Card */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 15,
            padding: 20,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#1F2937",
              marginBottom: 20,
            }}
            >
            {ui.personalInformation}
          </Text>
          <InfoRow
            label={ui.fullName}
            value={user.name}
            icon={<Ionicons name="person-outline" size={24} color="#9CA3AF" />}
          />
          <InfoRow
            label={ui.dateOfBirth}
            value={user.dob}
            icon={
              <Ionicons name="calendar-outline" size={24} color="#9CA3AF" />
            }
          />
        </View>

        {/* Contact Information Card */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 15,
            padding: 20,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#1F2937",
              marginBottom: 20,
            }}
            >
            {ui.contactInformation}
          </Text>
          <InfoRow
            label={t("info_email", "Email")}
            value={user.email}
            icon={
              <MaterialIcons name="mail-outline" size={24} color="#9CA3AF" />
            }
          />
          <InfoRow
            label={ui.phone}
            value={user.phone}
            icon={<Ionicons name="call-outline" size={24} color="#9CA3AF" />}
          />
        </View>

        {/* Identification Card */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 15,
            padding: 20,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#1F2937",
              marginBottom: 20,
            }}
            >
            {ui.identification}
          </Text>
          <InfoRow
            label={ui.idType}
            value={user.idType}
            icon={<FontAwesome5 name="id-card" size={20} color="#9CA3AF" />}
          />
          <InfoRow
            label={ui.idNumber}
            value={user.nationalIdNumber}
            icon={<FontAwesome5 name="id-card" size={20} color="#9CA3AF" />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PersonalInfoScreen;
