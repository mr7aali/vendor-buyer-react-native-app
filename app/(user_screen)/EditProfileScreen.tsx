import { useGetProfileQuery, useUpdateProfileMutation } from "@/store/api/authApiSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "@/hooks/use-translation";
import { setCredentials } from "@/store/slices/authSlice";
import { RootState } from "@/store/store";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  dob: Date;
  gender: string;
}

const GENDER_OPTIONS = ["male", "female", "other"] as const;

const EditProfileScreen = () => {
  const { t } = useTranslation();
  const { data: profileData, refetch: refetchProfile } = useGetProfileQuery({});
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const userData = profileData?.data;
  const dispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    dob: new Date(),
    gender: "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  useEffect(() => {
    if (!userData) return;

    setFormData((prev) => ({
      ...prev,
      fullName: userData?.buyer?.fullName || userData?.name || "",
      email: userData?.email || "",
      phone: userData?.buyer?.phone || userData?.phoneNumber || "",
      gender: userData?.buyer?.gender || "",
      dob: userData?.buyer?.dob ? new Date(userData.buyer.dob) : prev.dob,
    }));
  }, [userData]);

  const ui = useMemo(
    () => ({
      editProfile: t("edit_profile", "Edit Profile"),
      fullName: t("full_name", "Full name"),
      email: t("email_address", "alice@example.com"),
      phone: t("phone_number", "Phone number"),
      date: t("date_placeholder", "mm/dd/yyyy"),
      gender: t("gender", "Gender"),
      chooseGender: t("choose_gender", "Choose Gender"),
      save: t("save", "Save"),
      saving: t("saving", "Saving..."),
      profileSaved: t("profile_saved", "Profile information saved!"),
      failedSave: t("failed_save", "Failed to save profile information"),
    }),
    [t]
  );

  const handleChange = (name: keyof FormData, value: string | Date) => {
    setFormData((prev) => ({ ...prev, [name]: value } as FormData));
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) handleChange("dob", selectedDate);
  };

  const handleSave = async () => {
    try {
      const updateData: any = {
        buyer: {
          fullName: formData.fullName,
          phone: formData.phone,
          ...(formData.gender ? { gender: formData.gender } : {}),
        },
      };

      await updateProfile(updateData).unwrap();
      await refetchProfile();

      if (authState?.accessToken) {
        const mergedUser = {
          ...(authState.user || {}),
          buyer: {
            ...((authState.user as any)?.buyer || {}),
            fullName: formData.fullName,
            phone: formData.phone,
            ...(formData.gender ? { gender: formData.gender } : {}),
          },
          fullName: formData.fullName || (authState.user as any)?.fullName,
          phone: formData.phone || (authState.user as any)?.phone,
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

      Alert.alert(t("success", "Success"), ui.profileSaved);
      router.back();
    } catch (error) {
      console.error("Failed to update profile", error);
      Alert.alert(t("error", "Error"), ui.failedSave);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={30} color="#2F3437" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{ui.editProfile}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={ui.fullName}
              value={formData.fullName}
              onChangeText={(val) => handleChange("fullName", val)}
              placeholderTextColor="#7C8585"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.readonlyInput]}
              value={formData.email}
              editable={false}
              placeholder={ui.email}
              placeholderTextColor="#7C8585"
            />
            <MaterialCommunityIcons name="lock-outline" size={20} color="#8B9494" />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={ui.phone}
              value={formData.phone}
              onChangeText={(val) => handleChange("phone", val)}
              keyboardType="phone-pad"
              placeholderTextColor="#7C8585"
            />
          </View>

          <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.inputText}>
              {formData.dob ? formData.dob.toLocaleDateString("en-US") : ui.date}
            </Text>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#8B9494" />
          </TouchableOpacity>

          {showDatePicker && <DateTimePicker value={formData.dob} mode="date" onChange={onDateChange} />}

          <TouchableOpacity style={styles.inputContainer} onPress={() => setShowGenderModal(true)}>
            <Text style={[styles.inputText, { color: formData.gender ? "#2F3437" : "#7C8585" }]}>
              {formData.gender
                ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)
                : ui.gender}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={24} color="#6A7474" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isLoading}>
            <Text style={styles.saveButtonText}>{isLoading ? ui.saving : ui.save}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showGenderModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowGenderModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{ui.chooseGender}</Text>
            {GENDER_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.modalItem}
                onPress={() => {
                  handleChange("gender", item);
                  setShowGenderModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{item.charAt(0).toUpperCase() + item.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2F1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 64,
    marginBottom: 18,
  },
  headerTitle: { fontSize: 32 / 2, fontWeight: "700", color: "#2F3437" },
  backBtn: { padding: 2 },
  headerSpacer: { width: 30 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DDE4E3",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 54,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#D6DEDD",
  },
  input: { flex: 1, fontSize: 28 / 2, color: "#2F3437" },
  readonlyInput: { color: "#7A8484" },
  inputText: { flex: 1, fontSize: 28 / 2, color: "#2F3437" },
  saveButton: {
    backgroundColor: "#2D8A8A",
    height: 54,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonText: { color: "#FFF", fontSize: 34 / 2, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EEE",
  },
  modalItemText: { fontSize: 16, textAlign: "center", color: "#333" },
});

export default EditProfileScreen;
