import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "@/hooks/use-translation";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

import { useRegisterBuyerMutation } from "@/store/api/authApiSlice";
import { buildApiUrl } from "@/services/apiConfig";
import { persistAuthState } from "@/services/authStorage";
import { setCredentials } from "@/store/slices/authSlice";
import { updateBuyerRegistration } from "../../store/slices/registrationSlice";
import { RootState } from "../../store/store";

const UploadPictureScreen = () => {
  const { language, t } = useTranslation();
  const dispatch = useDispatch();
  const buyerData = useSelector((state: RootState) => state.registration.buyer);
  const auth = useSelector((state: RootState) => state.auth);
  const [registerBuyer, { isLoading }] = useRegisterBuyerMutation();
  const [image, setImage] = useState<string | null>(null);
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        uploadPicture: "העלה תמונה שלך",
        upload: "העלה",
        submit: "שלח",
        required: "נדרש",
        uploadProfilePicture: "נא להעלות תמונת פרופיל.",
        registrationSuccess: "ההרשמה הצליחה!",
        registrationFailed: "ההרשמה נכשלה",
        networkError: "שגיאת רשת: לא ניתן להגיע לשרת. בדוק את החיבור.",
      };
    }
    if (language === "hi") {
      return {
        uploadPicture: "अपनी तस्वीर अपलोड करें",
        upload: "अपलोड",
        submit: "सबमिट करें",
        required: "आवश्यक",
        uploadProfilePicture: "कृपया प्रोफाइल तस्वीर अपलोड करें।",
        registrationSuccess: "रजिस्ट्रेशन सफल रहा!",
        registrationFailed: "रजिस्ट्रेशन विफल रहा",
        networkError: "नेटवर्क त्रुटि: सर्वर तक नहीं पहुंच सके। कृपया कनेक्शन जांचें।",
      };
    }
    return {
      uploadPicture: "Upload your picture",
      upload: "Upload",
      submit: "Submit",
      required: "Required",
      uploadProfilePicture: "Please upload a profile picture.",
      registrationSuccess: "Registration successful!",
      registrationFailed: "Registration failed",
      networkError: "Network error: Could not reach server. Please check your connection.",
    };
  }, [language]);
  const imageMediaTypes = (ImagePicker as any).MediaType?.Images
    ? [(ImagePicker as any).MediaType.Images]
    : ImagePicker.MediaTypeOptions.Images;

  const getMimeType = (uri: string) => {
    const lower = uri.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".heic")) return "image/heic";
    if (lower.endsWith(".webp")) return "image/webp";
    return "image/jpeg";
  };

  const makeFilePart = (uri: string, name: string) => ({
    uri: Platform.OS === "ios" ? uri.replace("file://", "file://") : uri,
    name,
    type: getMimeType(uri),
  });

  const handleSubmit = async () => {
    if (!image) {
      Alert.alert(ui.required, ui.uploadProfilePicture);
      return;
    }

    try {
      // Update slice with final image
      dispatch(updateBuyerRegistration({ profilePhotoUrl: image }));

      // Use FormData for multipart/form-data request (required for file uploads)
      const formData = new FormData();

      // Append text fields (Exclude email as backend rejects it)
      if (buyerData.fullName) formData.append('fullName', buyerData.fullName);
      if (buyerData.phone) formData.append('phone', buyerData.phone);
      if (buyerData.gender) formData.append('gender', buyerData.gender);
      if (buyerData.nidNumber) formData.append('nidNumber', buyerData.nidNumber);
      if (buyerData.country) formData.append('country', buyerData.country);

      // Append files
      // NOTE: Backend error literally said 'nidFontPhotoUrl' (missing 'r'). 
      // We will follow the backend's requested key name.
      if (image) formData.append('profilePhotoUrl', makeFilePart(image, 'profile.jpg') as any);

      if (buyerData.nidFrontPhotoUrl) {
        formData.append('nidFontPhotoUrl', makeFilePart(buyerData.nidFrontPhotoUrl, 'nid_front.jpg') as any);
      }

      if (buyerData.nidBackPhotoUrl) {
        formData.append('nidBackPhotoUrl', makeFilePart(buyerData.nidBackPhotoUrl, 'nid_back.jpg') as any);
      }

      console.log('Registering Buyer with FormData:', JSON.stringify(Object.fromEntries((formData as any)._parts)));

      try {
        let result: any;
        try {
          result = await registerBuyer(formData).unwrap();
        } catch (err: any) {
          // Fallback for cases where fetchBaseQuery fails multipart upload on some Android builds
          if (err?.status === "FETCH_ERROR") {
            const registerBuyerUrl = buildApiUrl("/auth/register/buyer");
            if (!registerBuyerUrl) throw err;

            const fallbackResponse = await fetch(registerBuyerUrl, {
              method: "POST",
              headers: {
                ...(auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
              },
              body: formData,
            });

            const fallbackJson = await fallbackResponse.json().catch(() => ({}));
            if (!fallbackResponse.ok) {
              throw {
                status: fallbackResponse.status,
                data: fallbackJson,
              };
            }
            result = fallbackJson;
          } else {
            throw err;
          }
        }

        console.log('Registration success result:', result);

        const updatedUser = result?.data?.user || result?.user || result?.data;
        if (updatedUser || auth.user) {
          const mergedUser = { ...(auth.user || {}), ...(updatedUser || {}), userType: "buyer" };
          const availableProfiles = {
            buyer: true,
            vendor: !!(auth.availableProfiles?.vendor || (auth.user as any)?.vendor || (auth.user as any)?.userType === "vendor"),
          };
          dispatch(
            setCredentials({
              user: mergedUser as any,
              accessToken: auth.accessToken || "",
              refreshToken: auth.refreshToken,
              availableProfiles,
            })
          );
          await persistAuthState({
            accessToken: auth.accessToken || "",
            refreshToken: auth.refreshToken,
            user: mergedUser,
            availableProfiles,
          });
        }

        Alert.alert(t("success", "Success"), ui.registrationSuccess, [
          { text: t("ok", "OK"), onPress: () => router.push("/(users)") }
        ]);
      } catch (err: any) {
        console.error("Registration failed raw error:", err);
        throw err;
      }
    } catch (error: any) {
      console.error("Registration validation failed:", JSON.stringify(error, null, 2));
      let errorMessage = ui.registrationFailed;
      if (error?.status === 'FETCH_ERROR') {
        errorMessage = ui.networkError;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }
      Alert.alert(t("error", "Error"), errorMessage);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        t("permission_required", "Permission Required"),
        t("need_photos_permission", "Sorry, we need camera roll permissions to make this work!")
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: imageMediaTypes,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7FAF9" />
      <View style={styles.content}>
        <Text style={styles.label}>{ui.uploadPicture}</Text>

        {/* Upload Box Section */}
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={pickImage}
          activeOpacity={0.7}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="camera" size={45} color="#444" />
              <Text style={styles.uploadText}>{ui.upload}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>{ui.submit}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAF9", // Matching your background color
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 50,
  },
  label: {
    fontSize: 18,
    fontWeight: "500",
    color: "#181725",
    marginBottom: 20,
  },
  uploadBox: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#7C7C7C",
    borderStyle: "dashed", // Dashed border as per your image
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 40,
  },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#181725",
    marginTop: 10,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  submitButton: {
    backgroundColor: "#3B8C8C", // Teal color matching your buttons
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 40,
    left: 25,
    right: 25,
  },
  disabledButton: {
    backgroundColor: "#A0C4C4", // Lighter teal when disabled
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default UploadPictureScreen;
