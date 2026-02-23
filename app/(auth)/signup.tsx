

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "@/hooks/use-translation";

import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useRegisterMutation } from "@/store/api/authApiSlice";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Apple, Chrome } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SignUpScreen: React.FC = () => {
  const { language } = useTranslation();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

  const [register, { isLoading }] = useRegisterMutation();
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        signUp: "הרשמה",
        subtitle: "זה לוקח רק דקה ליצור חשבון",
        email: "כתובת אימייל",
        password: "סיסמה",
        confirmPassword: "אימות סיסמה",
        acceptTerms: "אשר תנאים והגבלות",
        signingUp: "נרשם...",
        orContinue: "או המשך עם",
        pleaseAcceptTerms: "נא לאשר תנאים והגבלות",
        fillAllFields: "נא למלא את כל השדות",
        passwordsMismatch: "הסיסמאות אינן תואמות!",
        signupFailed: "הרשמה נכשלה",
        signupFailedServer: "הרשמה נכשלה: לא ניתן להגיע לשרת",
        signupSuccessManualLogin: "ההרשמה הצליחה אבל התחברות אוטומטית נכשלה. התחבר ידנית.",
      };
    }
    if (language === "hi") {
      return {
        signUp: "साइन अप",
        subtitle: "अकाउंट बनाने में केवल एक मिनट लगता है",
        email: "ईमेल पता",
        password: "पासवर्ड",
        confirmPassword: "पासवर्ड पुष्टि करें",
        acceptTerms: "नियम और शर्तें स्वीकार करें",
        signingUp: "साइन अप हो रहा है...",
        orContinue: "या जारी रखें",
        pleaseAcceptTerms: "कृपया नियम और शर्तें स्वीकार करें",
        fillAllFields: "कृपया सभी फ़ील्ड भरें",
        passwordsMismatch: "पासवर्ड मेल नहीं खाते!",
        signupFailed: "साइन अप विफल रहा",
        signupFailedServer: "साइन अप विफल: सर्वर तक पहुंच नहीं",
        signupSuccessManualLogin: "साइन अप सफल रहा लेकिन ऑटो-लॉगिन विफल रहा। कृपया मैन्युअली लॉगिन करें।",
      };
    }
    return {
      signUp: "Sign Up",
      subtitle: "It only takes a minute to create your account",
      email: "E-mail address",
      password: "Password",
      confirmPassword: "Confirm Password",
      acceptTerms: "Accept terms & conditions",
      signingUp: "Signing Up...",
      orContinue: "Or Continue With",
      pleaseAcceptTerms: "Please accept the terms and conditions",
      fillAllFields: "Please fill in all fields",
      passwordsMismatch: "Passwords do not match!",
      signupFailed: "Signup failed",
      signupFailedServer: "Signup failed: Unable to reach server",
      signupSuccessManualLogin: "Signup successful but failed to auto-login. Please login manually.",
    };
  }, [language]);

  const handleSignup = async () => {
    if (!acceptedTerms) {
      alert(ui.pleaseAcceptTerms);
      return;
    }
    const locationData = await AsyncStorage.getItem("userLocation");

    // Basic Validation
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      alert(ui.fillAllFields);
      return;
    }

    if (password !== confirmPassword) {
      alert(ui.passwordsMismatch);
      return;
    }

    try {
      let resolvedAddress = "N/A";
      if (locationData) {
        try {
          const parsedLocation = JSON.parse(locationData);
          resolvedAddress =
            parsedLocation?.address ||
            `${parsedLocation?.latitude || ""}, ${parsedLocation?.longitude || ""}`.trim() ||
            "N/A";
        } catch {
          resolvedAddress = String(locationData);
        }
      }

      if (!resolvedAddress || resolvedAddress.trim().length < 2) {
        resolvedAddress = "Unknown";
      }

      const payload = {
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        evanAddress: resolvedAddress,
      };

      console.log(payload);
      const response = await register(payload).unwrap();
      console.log('Signup successful', response);

      const { data } = response;
      if (data && data.accessToken) {
        // Correctly handle the nested data structure from backend
        const user = data.user;
        const accessToken = data.accessToken;
        const refreshToken = data.refreshToken || response.refreshToken || null;

        dispatch(setCredentials({ user, accessToken, refreshToken }));

        // Save to AsyncStorage for persistence
        await AsyncStorage.setItem('accessToken', accessToken);
        if (refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        // Save role to AsyncStorage for role-based UI
        const userType = user?.userType;
        if (userType) {
          await AsyncStorage.setItem('userRole', userType);
        }

        console.log('Signup successful, redirecting to role selection. UserType:', userType);
        router.replace("/(onboarding)/user-selection");
      } else {
        console.error("Signup response missing data/token", response);
        alert(ui.signupSuccessManualLogin);
        router.push("/(auth)/login");
      }
    } catch (err) {
      console.error('Signup failed', err);
      const fetchStatus = (err as any)?.status;
      const serverMessage = (err as any)?.data?.message;
      if (fetchStatus === 'FETCH_ERROR') {
        alert(`${ui.signupFailedServer}. Check EXPO_PUBLIC_API_URL and backend availability.`);
        return;
      }
      alert(`${ui.signupFailed}: ` + (serverMessage || "Something went wrong"));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#333" />
      </TouchableOpacity>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{ui.signUp}</Text>
            <Text style={styles.subtitle}>
              {ui.subtitle}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>

            <TextInput
              style={styles.input}
              placeholder={ui.email}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder={ui.password}
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              style={styles.input}
              placeholder={ui.confirmPassword}
              placeholderTextColor="#999"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {/* Terms and Conditions */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View
                style={[
                  styles.checkbox,
                  acceptedTerms && styles.checkboxChecked,
                ]}
              />
              <Text style={styles.termsText}>{ui.acceptTerms}</Text>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, isLoading && { opacity: 0.7 }]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.signUpButtonText}>
                {isLoading ? ui.signingUp : ui.signUp}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>{ui.orContinue}</Text>
            <View style={styles.line} />
          </View>

          {/* Social Icons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialIcon}>
              <Chrome color="#EA4335" size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Apple color="#000" size={24} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: -20 },
  container: {
    flex: 1,
    backgroundColor: "#F8FAF9",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#7C7C7C",
    lineHeight: 22,
  },
  formContainer: {
    gap: 16,
  },
  input: {
    height: 58, // Height ektu barano hoyeche image-er moto korte
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E2E2", // Image-er moto light border
    borderRadius: 10, // Rounded corners
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#000",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: "#7C7C7C",
    borderRadius: 4,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#2D8C8C",
    borderColor: "#2D8C8C",
  },
  termsText: {
    fontSize: 14,
    color: "#7C7C7C",
  },
  signUpButton: {
    backgroundColor: "#2D8C8C",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 40,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#7C7C7C",
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  socialIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default SignUpScreen;
