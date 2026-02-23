import { useGetProfileQuery, useUpdateProfileMutation } from "@/store/api/authApiSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "@/hooks/use-translation";
import { setCredentials } from "@/store/slices/authSlice";
import { RootState } from "@/store/store";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

const BusinessInfoForm = () => {
  const { language, t } = useTranslation();
  const { data: profileData, refetch: refetchProfile } = useGetProfileQuery({});
  const [updateProfile] = useUpdateProfileMutation();
  const userData = profileData?.data;
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    fullName: "",
    emailOrNumber: "",
    phoneNumber: "",
    email: "",
    address: "",
    businessID: "",
    businessName: "",
  });

  const [profileImage, setProfileImage] = useState<any>(null);
  const [businessIdImage, setBusinessIdImage] = useState<any>(null);
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        editBusinessInfo: "עריכת מידע עסקי",
        uploadProfilePicture: "העלה תמונת פרופיל",
        clickUploadProfile: "לחץ להעלאת תמונת פרופיל",
        enterFullName: "הזן את שמך המלא",
        enterPhone: "הזן מספר טלפון",
        enterEmail: "הזן כתובת אימייל",
        enterAddress: "הזן כתובת",
        businessId: "מזהה עסק",
        uploadBusinessId: "העלה מזהה עסק",
        upload: "העלה",
        submit: "שלח",
        missingInfo: "מידע חסר",
        fillRequired: "נא למלא את כל השדות הנדרשים",
        missingProfileImage: "חסרה תמונת פרופיל",
        uploadProfileImage: "נא להעלות תמונת פרופיל",
        missingDocument: "חסר מסמך",
        uploadBusinessIdDoc: "נא להעלות מזהה עסק",
        successBusinessSaved: "המידע העסקי נשמר בהצלחה!",
        failedBusinessUpdate: "עדכון המידע העסקי נכשל.",
        uploadFailed: "העלאת הקובץ נכשלה",
        warning: "אם תשנה מידע עסקי, סטטוס האימות ייבדק מחדש",
      };
    }
    if (language === "hi") {
      return {
        editBusinessInfo: "व्यवसाय जानकारी संपादित करें",
        uploadProfilePicture: "प्रोफाइल तस्वीर अपलोड करें",
        clickUploadProfile: "अपनी प्रोफाइल इमेज अपलोड करने के लिए क्लिक करें",
        enterFullName: "अपना पूरा नाम दर्ज करें",
        enterPhone: "अपना फोन नंबर दर्ज करें",
        enterEmail: "ईमेल पता दर्ज करें",
        enterAddress: "अपना पता दर्ज करें",
        businessId: "व्यवसाय आईडी",
        uploadBusinessId: "अपना व्यवसाय आईडी अपलोड करें",
        upload: "अपलोड",
        submit: "सबमिट करें",
        missingInfo: "जानकारी अधूरी है",
        fillRequired: "कृपया सभी आवश्यक फ़ील्ड भरें",
        missingProfileImage: "प्रोफाइल इमेज नहीं है",
        uploadProfileImage: "कृपया अपनी प्रोफाइल इमेज अपलोड करें",
        missingDocument: "दस्तावेज़ नहीं है",
        uploadBusinessIdDoc: "कृपया अपना व्यवसाय आईडी अपलोड करें",
        successBusinessSaved: "व्यवसाय जानकारी सफलतापूर्वक सबमिट हुई!",
        failedBusinessUpdate: "व्यवसाय जानकारी अपडेट नहीं हुई।",
        uploadFailed: "फ़ाइल अपलोड विफल रहा",
        warning: "यदि आप कोई व्यवसाय जानकारी बदलते हैं, तो आपका सत्यापन स्टेटस फिर से समीक्षा किया जाएगा",
      };
    }
    return {
      editBusinessInfo: "Edit Business info",
      uploadProfilePicture: "Upload Profile Picture",
      clickUploadProfile: "Click to upload your profile image",
      enterFullName: "Enter Your Full Name",
      enterPhone: "Enter your Phone Number",
      enterEmail: "Enter Email Address",
      enterAddress: "Enter Your Address",
      businessId: "Business ID",
      uploadBusinessId: "Upload your Business ID",
      upload: "Upload",
      submit: "Submit",
      missingInfo: "Missing Information",
      fillRequired: "Please fill in all required fields",
      missingProfileImage: "Missing Profile Image",
      uploadProfileImage: "Please upload your profile image",
      missingDocument: "Missing Document",
      uploadBusinessIdDoc: "Please upload your Business ID",
      successBusinessSaved: "Business information submitted successfully!",
      failedBusinessUpdate: "Failed to update business information.",
      uploadFailed: "Failed to upload file",
      warning: "If you change any business information, your verification status will be reviewed again",
    };
  }, [language]);

  React.useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.vendor.fullName || userData.vendor.name || "",
        emailOrNumber: userData.email || "",
        phoneNumber: userData.vendor.phone || userData.vendor.phoneNumber || "",
        email: userData.email || "",
        address: userData.vendor.address || "",
        businessID: userData.vendor.bussinessRegNumber || userData.vendor.businessID || "",
        businessName: userData.vendor.storename || userData.vendor.businessName || "",
      });
      // Optionally prefill images if URL exists (not implemented for file object but for UI display)
      if (userData.logo) {
        setProfileImage({ uri: userData.logo, name: 'current_logo' }); // Placeholder logic
      }
    }
  }, [userData]);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProfileImageUpload = async () => {
    try {
      if (Platform.OS === "web") {
        // For web, use document picker
        const result = await DocumentPicker.getDocumentAsync({
          type: ["image/*"],
          copyToCacheDirectory: true,
        });

        if (result.assets && result.assets[0]) {
          setProfileImage({
            uri: result.assets[0].uri,
            name: result.assets[0].name,
          });
        }
      } else {
        // For mobile, use image picker
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
          Alert.alert(
            t("permission_required", "Permission Required"),
            t("need_photos_permission", "Please grant permission to access photos")
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1], // Square aspect ratio for profile
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          setProfileImage({
            uri: result.assets[0].uri,
            name: "profile_image.jpg",
          });
        }
      }
    } catch (error) {
      console.error("Profile image upload error:", error);
      Alert.alert(t("error", "Error"), ui.uploadFailed);
    }
  };

  const handleBusinessIdUpload = async () => {
    try {
      if (Platform.OS === "web") {
        // For web, use document picker
        const result = await DocumentPicker.getDocumentAsync({
          type: ["image/*", "application/pdf"],
          copyToCacheDirectory: true,
        });

        if (result.assets && result.assets[0]) {
          setBusinessIdImage({
            uri: result.assets[0].uri,
            name: result.assets[0].name,
          });
        }
      } else {
        // For mobile, use image picker
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
          Alert.alert(
            t("permission_required", "Permission Required"),
            t("need_photos_permission", "Please grant permission to access photos")
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
          setBusinessIdImage({
            uri: result.assets[0].uri,
            name: "business_id.jpg",
          });
        }
      }
    } catch (error) {
      console.error("Business ID upload error:", error);
      Alert.alert(t("error", "Error"), ui.uploadFailed);
    }
  };

  const handleSubmit = async () => {
    // Validate form
    const requiredFields = ["fullName", "phoneNumber", "email", "address"];
    const emptyFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData].trim()
    );

    if (emptyFields.length > 0) {
      Alert.alert(ui.missingInfo, ui.fillRequired);
      return;
    }

    if (!profileImage) {
      Alert.alert(ui.missingProfileImage, ui.uploadProfileImage);
      return;
    }

    if (!businessIdImage) {
      Alert.alert(ui.missingDocument, ui.uploadBusinessIdDoc);
      return;
    }

    // Submit logic here
    try {
      const updateData: any = {
        vendor: {
          fullName: formData.fullName,
          phone: formData.phoneNumber,
          address: formData.address,
          storename: formData.businessName,
        },
      };

      await updateProfile(updateData).unwrap();
      await refetchProfile();

        if (authState?.accessToken) {
          const mergedUser = {
            ...(authState.user || {}),
            vendor: {
              ...((authState.user as any)?.vendor || {}),
              fullName: formData.fullName,
            phone: formData.phoneNumber,
            address: formData.address,
            storename: formData.businessName,
          },
          fullName: formData.fullName || (authState.user as any)?.fullName,
          phone: formData.phoneNumber || (authState.user as any)?.phone,
          address: formData.address || (authState.user as any)?.address,
          storename: formData.businessName || (authState.user as any)?.storename,
        };

        dispatch(
          setCredentials({
            user: mergedUser as any,
            accessToken: authState.accessToken,
            refreshToken: authState.refreshToken || "",
          })
        );
        await AsyncStorage.setItem("user", JSON.stringify(mergedUser));
      }

      Alert.alert(t("success", "Success"), ui.successBusinessSaved, [
        { text: t("ok", "OK"), onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Update failed", error);
      Alert.alert(t("error", "Error"), ui.failedBusinessUpdate);
    }
  };

  //   this is for handle back
  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
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
          <TouchableOpacity onPress={() => handleBack()}>
            <MaterialIcons name="arrow-back-ios-new" size={24} color="black" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "600" }}>
            {ui.editBusinessInfo}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Image Upload Section */}
        <View style={{ marginBottom: 32, alignItems: "center" }}>
          <TouchableOpacity
            onPress={handleProfileImageUpload}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60, // Makes it circular
              backgroundColor: "#f5f5f5",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: "#e0e0e0",
              borderStyle: "dashed",
              overflow: "hidden", // Ensures image stays within circle
            }}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage.uri }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 60,
                }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ alignItems: "center" }}>
                <MaterialIcons name="add-a-photo" size={40} color="#278687" />
                <Text
                  style={{
                    fontSize: 14,
                    color: "#278687",
                    marginTop: 8,
                    textAlign: "center",
                  }}
                  >
                  {ui.uploadProfilePicture}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 12,
              color: "#666666",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {ui.clickUploadProfile}
          </Text>
        </View>

        {/* Full Name Input */}\n        {/* Note: This label says 'Full Name' but might be intended for Business Name in this context? Keeping generic for now based on file content. */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: "#333333",
              marginBottom: 8,
            }}
            >
            {ui.enterFullName}
          </Text>
          <TextInput
            style={{
              height: 50,
              borderWidth: 1,
              borderColor: "#e0e0e0",
              borderRadius: 8,
              paddingHorizontal: 16,
              fontSize: 16,
              color: "#333333",
              backgroundColor: "#fafafa",
            }}
            placeholder={ui.enterFullName}
            placeholderTextColor="#999999"
            value={formData.fullName}
            onChangeText={(text) => handleInputChange("fullName", text)}
          />
        </View>

        {/* Phone Number Input */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: "#333333",
              marginBottom: 8,
            }}
            >
            {ui.enterPhone}
          </Text>
          <TextInput
            style={{
              height: 50,
              borderWidth: 1,
              borderColor: "#e0e0e0",
              borderRadius: 8,
              paddingHorizontal: 16,
              fontSize: 16,
              color: "#333333",
              backgroundColor: "#fafafa",
            }}
            placeholder={ui.enterPhone}
            placeholderTextColor="#999999"
            value={formData.phoneNumber}
            onChangeText={(text) => handleInputChange("phoneNumber", text)}
            keyboardType="phone-pad"
          />
        </View>

        {/* Email Input */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: "#333333",
              marginBottom: 8,
            }}
            >
            {ui.enterEmail}
          </Text>
          <TextInput
            style={{
              height: 50,
              borderWidth: 1,
              borderColor: "#e0e0e0",
              borderRadius: 8,
              paddingHorizontal: 16,
              fontSize: 16,
              color: "#333333",
              backgroundColor: "#fafafa",
            }}
            placeholder={ui.enterEmail}
            placeholderTextColor="#999999"
            value={formData.email}
            onChangeText={(text) => handleInputChange("email", text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Address Input */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: "#333333",
              marginBottom: 8,
            }}
            >
            {ui.enterAddress}
          </Text>
          <TextInput
            style={{
              height: 100,
              borderWidth: 1,
              borderColor: "#e0e0e0",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingTop: 12,
              fontSize: 16,
              color: "#333333",
              backgroundColor: "#fafafa",
              textAlignVertical: "top",
            }}
            placeholder={ui.enterAddress}
            placeholderTextColor="#999999"
            value={formData.address}
            onChangeText={(text) => handleInputChange("address", text)}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Business ID Display */}
        <View
          style={{
            marginBottom: 20,
            padding: 16,
            backgroundColor: "#f8f9fa",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#e0e0e0",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#666666",
              marginBottom: 8,
            }}
          >
            {ui.businessId}
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#333333",
            }}
          >
            {formData.businessID}
          </Text>
        </View>

        {/* Business ID Upload Section */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: "#333333",
              marginBottom: 12,
            }}
          >
            {ui.uploadBusinessId}
          </Text>

          <TouchableOpacity
            onPress={handleBusinessIdUpload}
            style={{
              height: 120,
              borderWidth: 2,
              borderColor: "#e0e0e0",
              borderStyle: "dashed",
              borderRadius: 12,
              backgroundColor: "#fafafa",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            {businessIdImage ? (
              <View style={{ alignItems: "center" }}>
                <MaterialIcons name="check-circle" size={48} color="#4CAF50" />
                <Text
                  style={{
                    fontSize: 14,
                    color: "#4CAF50",
                    marginTop: 8,
                  }}
                >
                  {businessIdImage.name}
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: "center" }}>
                <MaterialIcons name="cloud-upload" size={48} color="#278687" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: "#278687",
                    marginTop: 8,
                  }}
                >
                  {ui.upload}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 12,
              color: "#666666",
              lineHeight: 16,
              textAlign: "center",
            }}
          >
            {ui.warning}
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={{
            height: 56,
            backgroundColor: "#278687",
            borderRadius: 28,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#ffffff",
            }}
          >
            {ui.submit}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BusinessInfoForm;
