

import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/use-translation";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { useDispatch } from "react-redux";
import { updateVendorRegistration } from "../../store/slices/registrationSlice";

const EndorIDUploadScreen = () => {
  const { language } = useTranslation();
  const dispatch = useDispatch();
  // State variables with types
  const [nationalIdNumber, setIdNumber] = useState<string>("");
  const [nidFront, setFrontImage] = useState<string | null>(null);
  const [nidBack, setBackImage] = useState<string | null>(null);
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        nationalIdNo: "מספר תעודת זהות",
        uploadFront: "העלה תמונת תעודה (קדמי)",
        uploadBack: "העלה תמונת תעודה (אחורי)",
        upload: "העלה",
        next: "הבא",
      };
    }
    if (language === "hi") {
      return {
        nationalIdNo: "राष्ट्रीय आईडी नंबर",
        uploadFront: "राष्ट्रीय आईडी तस्वीर अपलोड करें (फ्रंट)",
        uploadBack: "राष्ट्रीय आईडी तस्वीर अपलोड करें (बैक)",
        upload: "अपलोड",
        next: "आगे",
      };
    }
    return {
      nationalIdNo: "National ID No",
      uploadFront: "Upload your National ID picture (Front)",
      uploadBack: "Upload your National ID picture (Back)",
      upload: "Upload",
      next: "Next",
    };
  }, [language]);

  // Type-safe pickImage function
  const pickImage = async (type: "front" | "back") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
    });

    if (!result.canceled) {
      if (type === "front") {
        setFrontImage(result.assets[0].uri);
      } else {
        setBackImage(result.assets[0].uri);
      }
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
          {/* National ID Number Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{ui.nationalIdNo}</Text>
            <TextInput
              style={styles.input}
              placeholder="3264 35465 341654"
              placeholderTextColor="#C7C7CD"
              value={nationalIdNumber}
              onChangeText={setIdNumber}
              keyboardType="numeric"
            />
          </View>

          {/* Upload Front Side */}
          <View style={styles.uploadGroup}>
            <Text style={styles.label}>{ui.uploadFront}</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => pickImage("front")}
              activeOpacity={0.7}
            >
              {nidFront ? (
                <Image
                  source={{ uri: nidFront }}
                  style={styles.previewImage}
                />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera" size={40} color="#181725" />
                  <Text style={styles.uploadText}>{ui.upload}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Upload Back Side */}
          <View style={styles.uploadGroup}>
            <Text style={styles.label}>{ui.uploadBack}</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => pickImage("back")}
              activeOpacity={0.7}
            >
              {nidBack ? (
                <Image
                  source={{ uri: nidBack }}
                  style={styles.previewImage}
                />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera" size={40} color="#181725" />
                  <Text style={styles.uploadText}>{ui.upload}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            style={[styles.nextButton, !nationalIdNumber && styles.disabledButton]}
            disabled={!nationalIdNumber}
            onPress={() => {
              dispatch(
                updateVendorRegistration({
                  nationalIdNumber: nationalIdNumber,
                  nidFront: nidFront || undefined,
                  nidBack: nidBack || undefined,
                })
              );
              router.push("/(screens)/BusinessIdUploadScreen");
            }}
          >
            <Text style={styles.nextButtonText}>{ui.next}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAF9",
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 30,
    flexGrow: 1,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#181725",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#FFFFFF",
    height: 55,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#181725",
    borderWidth: 1,
    borderColor: "#D1D1D1",
  },
  uploadGroup: {
    marginBottom: 25,
  },
  uploadBox: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#7C7C7C",
    borderStyle: "dashed",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#181725",
    marginTop: 10,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  nextButton: {
    backgroundColor: "#3B8C8C",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#A0C4C4",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default EndorIDUploadScreen;
