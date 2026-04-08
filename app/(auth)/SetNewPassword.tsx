import { useSetNewPasswordScreenMutation } from "@/store/api/authApiSlice";
import { useTranslation } from "@/hooks/use-translation";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import {
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

const SetNewPasswordScreen: React.FC = () => {
  const { language } = useTranslation();
  const router = useRouter();
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const [resetPassword, { isLoading }] = useSetNewPasswordScreenMutation();
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        backToLogin: "חזרה להתחברות",
        setNewPassword: "הגדר סיסמה חדשה",
        subtitle: "אנא הגדר סיסמה חדשה כדי להמשיך",
        newPassword: "סיסמה חדשה",
        confirmPassword: "אימות סיסמה",
        updatePassword: "עדכן סיסמה",
        updating: "מעדכן...",
        missingEmailOtp: "חסר אימייל או OTP. נסה את התהליך מחדש.",
        passwordsMismatch: "הסיסמאות אינן תואמות",
        enterNewPassword: "נא להזין סיסמה חדשה",
        passwordUpdated: "הסיסמה עודכנה בהצלחה!",
        resetFailed: "האיפוס נכשל",
      };
    }
    if (language === "hi") {
      return {
        backToLogin: "लॉगिन पर वापस जाएं",
        setNewPassword: "नया पासवर्ड सेट करें",
        subtitle: "जारी रखने के लिए कृपया नया पासवर्ड सेट करें",
        newPassword: "नया पासवर्ड",
        confirmPassword: "पासवर्ड पुष्टि करें",
        updatePassword: "पासवर्ड अपडेट करें",
        updating: "अपडेट हो रहा है...",
        missingEmailOtp: "ईमेल या OTP गायब है। कृपया प्रक्रिया फिर से करें।",
        passwordsMismatch: "पासवर्ड मेल नहीं खाते",
        enterNewPassword: "कृपया नया पासवर्ड दर्ज करें",
        passwordUpdated: "पासवर्ड सफलतापूर्वक अपडेट हो गया!",
        resetFailed: "रीसेट विफल रहा",
      };
    }
    return {
      backToLogin: "Back to Login",
      setNewPassword: "Set a new password",
      subtitle: "Please set a new password for your account to continue",
      newPassword: "New Password",
      confirmPassword: "Confirm Password",
      updatePassword: "Update Password",
      updating: "Updating...",
      missingEmailOtp: "Missing email or OTP. Please try the reset process again.",
      passwordsMismatch: "Passwords do not match",
      enterNewPassword: "Please enter a new password",
      passwordUpdated: "Password updated successfully!",
      resetFailed: "Reset failed",
    };
  }, [language]);

  const handleUpdatePassword = async () => {
    if (!email || !otp) {
      alert(ui.missingEmailOtp);
      return;
    }

    if (newPassword !== confirmPassword) {
      alert(ui.passwordsMismatch);
      return;
    }
    if (!newPassword) {
      alert(ui.enterNewPassword);
      return;
    }

    try {
      // Prepare payload with email, newPassword, and confirmPassword as required by the backend
      await resetPassword({ email, otp, newPassword, confirmPassword }).unwrap();
      alert(ui.passwordUpdated);
      router.push("/(auth)/login");
    } catch (err) {
      console.error("Reset password failed", err);
      alert(`${ui.resetFailed}: ` + ((err as any)?.data?.message || "Unknown error"));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backButton}>
          <ChevronLeft
            onPress={() => router.push("/(auth)/login")}
            color="#1A1A1A"
            size={28}
          />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{ui.backToLogin}</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Titles Section */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{ui.setNewPassword}</Text>
            <Text style={styles.subtitle}>
              {ui.subtitle}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* New Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={ui.newPassword}
                placeholderTextColor="#999"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeIcon}
              >
                {showNewPassword ? (
                  <Eye color="#999" size={22} />
                ) : (
                  <EyeOff color="#999" size={22} />
                )}
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={ui.confirmPassword}
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                {showConfirmPassword ? (
                  <Eye color="#999" size={22} />
                ) : (
                  <EyeOff color="#999" size={22} />
                )}
              </TouchableOpacity>
            </View>

            {/* Update Button */}
            <TouchableOpacity
              style={[styles.updateButton, isLoading && { opacity: 0.7 }]}
              activeOpacity={0.8}
              onPress={handleUpdatePassword}
              disabled={isLoading}
            >
              <Text style={styles.updateButtonText}>{isLoading ? ui.updating : ui.updatePassword}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAF9",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
  },
  backButton: {
    padding: 4,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  textContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#7C7C7C",
    lineHeight: 22,
  },
  formContainer: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  eyeIcon: {
    padding: 4,
  },
  updateButton: {
    backgroundColor: "#2D8C8C",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    // Optional shadow for depth
    shadowColor: "#2D8C8C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default SetNewPasswordScreen;
