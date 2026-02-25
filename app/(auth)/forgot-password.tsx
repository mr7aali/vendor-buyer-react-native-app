import { useForgotPasswordScreenMutation } from "@/store/api/authApiSlice";
import { useTranslation } from "@/hooks/use-translation";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Mail } from "lucide-react-native";
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

const ForgotPasswordScreen: React.FC = () => {
  const { language } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [forgotPassword, { isLoading }] = useForgotPasswordScreenMutation();
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        forgotPassword: "שכחת סיסמה",
        forgotTitle: "שכחת סיסמה?",
        subtitle: "אל דאגה! הזן אימייל או מספר טלפון רשום.",
        content: "תוכן",
        enterEmailOrPhone: "הזן אימייל או טלפון",
        sendResetCode: "שלח קוד איפוס",
        sending: "שולח...",
        remembered: "נזכרת בסיסמה שלך?",
        login: "התחברות",
        needHelp: "צריך עזרה?",
        pleaseEnterEmail: "נא להזין אימייל",
        failedToSendCode: "שליחת הקוד נכשלה",
      };
    }
    if (language === "hi") {
      return {
        forgotPassword: "पासवर्ड भूल गए",
        forgotTitle: "पासवर्ड भूल गए?",
        subtitle: "चिंता न करें! अपना रजिस्टर्ड ईमेल या फोन नंबर दर्ज करें।",
        content: "कंटेंट",
        enterEmailOrPhone: "अपना ईमेल या फोन नंबर दर्ज करें",
        sendResetCode: "रीसेट कोड भेजें",
        sending: "भेजा जा रहा है...",
        remembered: "पासवर्ड याद आ गया?",
        login: "लॉगिन",
        needHelp: "मदद चाहिए?",
        pleaseEnterEmail: "कृपया अपना ईमेल दर्ज करें",
        failedToSendCode: "कोड भेजना विफल रहा",
      };
    }
    return {
      forgotPassword: "Forgot Password",
      forgotTitle: "Forgot Password?",
      subtitle: "Don t worry! Enter your registered email or phone number.",
      content: "Content",
      enterEmailOrPhone: "Enter your email or phone number",
      sendResetCode: "Send Reset Code",
      sending: "Sending...",
      remembered: "Remembered your password?",
      login: "Login",
      needHelp: "Need Help?",
      pleaseEnterEmail: "Please enter your email",
      failedToSendCode: "Failed to send code",
    };
  }, [language]);

  const handleSendCode = async () => {
    try {
      if (!email) {
        alert(ui.pleaseEnterEmail);
        return;
      }
      await forgotPassword({ email }).unwrap();
      // Navigate to OTP screen with email params
      router.push({ pathname: "/(auth)/OTPVerification", params: { email } });
    } catch (err) {
      console.error("Forgot password failed", err);
      alert(`${ui.failedToSendCode}: ` + ((err as any)?.data?.message || "Unknown error"));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{ui.forgotPassword}</Text>
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
          <View style={styles.textContainer}>
            <Text style={styles.title}>{ui.forgotTitle}</Text>
            <Text style={styles.subtitle}>
              {ui.subtitle}
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>{ui.content}</Text>
            <Text style={styles.inputGuide}>
              {ui.enterEmailOrPhone}
            </Text>

            <View style={styles.inputWrapper}>
              <Mail color="#999" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={ui.enterEmailOrPhone}
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, isLoading && { opacity: 0.7 }]}
              onPress={handleSendCode}
              disabled={isLoading}
            >
              <Text style={styles.sendButtonText}>{isLoading ? ui.sending : ui.sendResetCode}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              {`${ui.remembered} `}
              <Text
                style={styles.loginLink}
                onPress={() => router.push("/(auth)/login")}
              >
                {ui.login}
              </Text>
            </Text>
            <TouchableOpacity>
              <Text style={styles.helpText}>{ui.needHelp}</Text>
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: "#F8FAF9",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  backButton: {
    padding: 4,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
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
    fontSize: 16,
    color: "#7C7C7C",
    lineHeight: 24,
  },
  formSection: {
    marginBottom: 40,
  },
  label: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 20,
  },
  inputGuide: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4A4A4A",
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  sendButton: {
    backgroundColor: "#2D8C8C",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  footerContainer: {
    alignItems: "center",
    gap: 15,
    marginTop: 20,
  },
  footerText: {
    fontSize: 15,
    color: "#7C7C7C",
  },
  loginLink: {
    color: "#2D8C8C",
    fontWeight: "700",
  },
  helpText: {
    fontSize: 15,
    color: "#7C7C7C",
  },
});

export default ForgotPasswordScreen;
