import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useRegisterVendorMutation } from "../../store/api/authApiSlice";
import { setCredentials } from "../../store/slices/authSlice";
import { updateVendorRegistration } from "../../store/slices/registrationSlice";
import { RootState } from "../../store/store";

const BusinessIdUploadScreen: React.FC = () => {
  const { language, t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const vendorData = useSelector((state: RootState) => state.registration.vendor);
  const auth = useSelector((state: RootState) => state.auth);
  const [registerVendor, { isLoading }] = useRegisterVendorMutation();
  const imageMediaTypes = (ImagePicker as any).MediaType?.Images
    ? [(ImagePicker as any).MediaType.Images]
    : ImagePicker.MediaTypeOptions.Images;

  // States
  const [businessId, setBusinessId] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        businessId: "מזהה עסק",
        uploadBusinessId: "העלה מזהה עסק",
        upload: "העלה",
        submit: "שלח",
        required: "נדרש",
        provideIdAndImage: "נא להזין מזהה עסק ולהעלות תמונה.",
        vendorRegistered: "רישום ספק הצליח!",
      };
    }
    if (language === "hi") {
      return {
        businessId: "व्यवसाय आईडी",
        uploadBusinessId: "अपना व्यवसाय आईडी अपलोड करें",
        upload: "अपलोड",
        submit: "सबमिट करें",
        required: "आवश्यक",
        provideIdAndImage: "कृपया व्यवसाय आईडी दें और इमेज अपलोड करें।",
        vendorRegistered: "वेंडर रजिस्ट्रेशन सफल रहा!",
      };
    }
    return {
      businessId: "Business ID",
      uploadBusinessId: "Upload your Business ID",
      upload: "Upload",
      submit: "Submit",
      required: "Required",
      provideIdAndImage: "Please provide Business ID and upload an image.",
      vendorRegistered: "Vendor registration successful!",
    };
  }, [language]);

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

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        t("permission_required", "Permission Required"),
        t("need_photos_permission", "Sorry, we need camera roll permissions to make this work!")
      );
      return;
    }



    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: imageMediaTypes,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("ImagePicker Error: ", error);
      Alert.alert(t("error", "Error"), t("failed_pick_image", "Failed to pick image. Please try again."));
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || isLoading) return;

    if (!businessId || !selectedImage) {
      Alert.alert(ui.required, ui.provideIdAndImage);
      return;
    }

    try {
      setIsSubmitting(true);
      // FIX: Merging current states with Redux data to avoid stale selector values
      const latestData = {
        ...vendorData,
        businessId: selectedImage,
        bussinessRegNumber: businessId,
      };

      dispatch(updateVendorRegistration({
        businessId: selectedImage,
        bussinessRegNumber: businessId,
      }));

      const buildVendorFormData = () => {
        const formData = new FormData();

        const safeAppend = (key: string, value: any) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value);
          }
        };

        safeAppend('fullName', String(latestData.fullName || ''));
        safeAppend('phone', String(latestData.phone || ''));
        safeAppend('address', String(latestData.address || ''));
        safeAppend('storename', String(latestData.storename || ''));
        safeAppend('storeDescription', String(latestData.storeDescription || ''));
        safeAppend('gender', String(latestData.gender || 'Other'));
        safeAppend('nationalIdNumber', String(latestData.nationalIdNumber || ''));
        safeAppend('bussinessRegNumber', String(latestData.bussinessRegNumber || businessId || ''));
        safeAppend('country', String(latestData.country || 'United States'));

        if (latestData.logo) {
          formData.append('logo', makeFilePart(latestData.logo, 'logo.jpg') as any);
        }

        if (latestData.nidFront) {
          formData.append('nidFront', makeFilePart(latestData.nidFront, 'nid_front.jpg') as any);
        }

        if (latestData.nidBack) {
          formData.append('nidBack', makeFilePart(latestData.nidBack, 'nid_back.jpg') as any);
        }

        if (selectedImage) {
          formData.append('businessId', makeFilePart(selectedImage, 'business_id.jpg') as any);
        }

        return formData;
      };

      const formData = buildVendorFormData();

      console.log('Registering Vendor with FormData:', JSON.stringify(Object.fromEntries((formData as any)._parts)));

      let response: any;
      try {
        response = await registerVendor(formData).unwrap();
      } catch (err: any) {
        // Fallback for timeout/abort issues in fetchBaseQuery multipart uploads.
        const isAbortFetchError =
          err?.status === "FETCH_ERROR" &&
          (String(err?.error || "").includes("AbortError") || String(err?.error || "").includes("Network request failed"));

        if (!isAbortFetchError) {
          throw err;
        }

        const apiUrl = (process.env.EXPO_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
        if (!apiUrl) throw err;

        const fallbackFormData = buildVendorFormData();
        const fallbackResponse = await fetch(`${apiUrl}/auth/register/vendor`, {
          method: "POST",
          headers: {
            ...(auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
          },
          body: fallbackFormData,
        });

        const fallbackJson = await fallbackResponse.json().catch(() => ({}));
        if (!fallbackResponse.ok) {
          throw {
            status: fallbackResponse.status,
            data: fallbackJson,
          };
        }
        response = fallbackJson;
      }

      console.log('Vendor registration success result:', response);
      const updatedUser = response?.data?.user || response?.user || response?.data;

      if (updatedUser) {
        const mergedUser = { ...updatedUser, userType: "vendor" };
        // Update Redux
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        dispatch(setCredentials({
          user: mergedUser,
          accessToken: accessToken || '',
          refreshToken: refreshToken || ''
        }));

        // Update AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(mergedUser));
        await AsyncStorage.setItem('userRole', 'vendor');
      }

      Alert.alert(t("success", "Success"), ui.vendorRegistered, [
        { text: t("ok", "OK"), onPress: () => router.push("/(tabs)") }
      ]);

    } catch (error: any) {
      console.error("Vendor registration failed raw error:", error);
      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        error?.error ||
        error?.message ||
        "Something went wrong.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Business ID Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>{ui.businessId}</Text>
            <TextInput
              style={styles.input}
              placeholder="3264 35465"
              placeholderTextColor="#999"
              value={businessId}
              onChangeText={setBusinessId}
              keyboardType="numeric"
            />
          </View>

          {/* Business ID Upload Section */}
          <View style={styles.uploadSection}>
            <Text style={styles.label}>{ui.uploadBusinessId}</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={handleImagePicker}
              activeOpacity={0.7}
            >
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                />
              ) : (
                <View style={styles.placeholder}>
                  <Image
                    source={{
                      uri: "https://cdn-icons-png.flaticon.com/512/685/685655.png",
                    }}
                    style={styles.cameraIcon}
                  />
                  <Text style={styles.uploadText}>{ui.upload}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>{ui.submit}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BusinessIdUploadScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FBF9",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  inputSection: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 15 : 12,
    fontSize: 16,
    color: "#000",
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadBox: {
    width: "100%",
    height: 180,
    borderWidth: 1.5,
    borderColor: "#C0C0C0",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  placeholder: {
    alignItems: "center",
  },
  cameraIcon: {
    width: 35,
    height: 35,
    tintColor: "#444",
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 18,
    color: "#444",
    fontWeight: "500",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  footer: {
    padding: 20,
    backgroundColor: "#F7FBF9",
  },
  submitButton: {
    backgroundColor: "#318585",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
