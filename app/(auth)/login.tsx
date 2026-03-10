


import { FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";
import { useTranslation } from "@/hooks/use-translation";
import AppleAuth, { AppleRequestOperation, AppleRequestScope } from "@invertase/react-native-apple-authentication";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppleAuthMutation, useGoogleAuthMutation, useLoginMutation } from "@/store/api/authApiSlice";
import { apiSlice } from "@/store/api/apiSlice";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";

export default function LoginScreen() {
  const { language } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const googleWebClientId = (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "").trim();
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        welcomeBack: "ברוך שובך",
        loginToAccount: "התחבר לחשבון שלך",
        enterEmail: "הזן אימייל",
        emailAddress: "כתובת אימייל",
        password: "סיסמה",
        rememberMe: "זכור אותי",
        forgotPassword: "שכחת סיסמה?",
        login: "התחברות",
        loggingIn: "מתחבר...",
        orContinue: "או המשך עם",
        noAccount: "אין לך חשבון?",
        signUp: "הרשמה",
        loginFailed: "ההתחברות נכשלה",
        invalidResponse: "התחברות נכשלה: תגובת שרת לא תקינה",
      };
    }
    if (language === "hi") {
      return {
        welcomeBack: "वापसी पर स्वागत है",
        loginToAccount: "अपने अकाउंट में लॉगिन करें",
        enterEmail: "अपना ईमेल दर्ज करें",
        emailAddress: "ईमेल पता",
        password: "पासवर्ड",
        rememberMe: "मुझे याद रखें",
        forgotPassword: "पासवर्ड भूल गए?",
        login: "लॉगिन",
        loggingIn: "लॉगिन हो रहा है...",
        orContinue: "या जारी रखें",
        noAccount: "क्या आपका अकाउंट नहीं है?",
        signUp: "साइन अप",
        loginFailed: "लॉगिन विफल",
        invalidResponse: "लॉगिन विफल: अमान्य सर्वर रिस्पॉन्स",
      };
    }
    return {
      welcomeBack: "Welcome Back",
      loginToAccount: "Login to your account",
      enterEmail: "Enter Your E-mail",
      emailAddress: "E-mail address",
      password: "Password",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      login: "Login",
      loggingIn: "Logging in...",
      orContinue: "Or Continue With",
      noAccount: "Don t have an account?",
      signUp: "Sign Up",
      loginFailed: "Login failed",
      invalidResponse: "Login failed: Invalid server response",
    };
  }, [language]);

  const [login, { isLoading }] = useLoginMutation();
  const [googleAuthMutation] = useGoogleAuthMutation();
  const [appleAuthMutation] = useAppleAuthMutation();
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const getGoogleModule = () => {
    try {
      return require("@react-native-google-signin/google-signin") as typeof import("@react-native-google-signin/google-signin");
    } catch {
      return null;
    }
  };

  const parseAuthError = (error: any): string => {
    const message = error?.data?.message || error?.response?.data?.message || error?.message;
    if (message) return message;

    if (error?.code === "SIGN_IN_CANCELLED") {
      return "Sign in was cancelled.";
    }
    if (error?.code === "IN_PROGRESS") {
      return "Sign in already in progress.";
    }
    if (error?.code === "PLAY_SERVICES_NOT_AVAILABLE") {
      return "Google Play Services is not available on this device.";
    }

    return "Something went wrong. Please try again.";
  };

  const completeSocialAuth = async (response: any) => {
    const payload = response?.data?.accessToken || response?.data?.user ? response.data : response;

    if (!payload?.accessToken || !payload?.user) {
      alert(ui.invalidResponse);
      return;
    }

    const userType = payload.user?.userType;
    const storedRole = await AsyncStorage.getItem('userRole');
    const effectiveRole =
      userType === 'buyer' || userType === 'vendor'
        ? userType
        : (storedRole === 'buyer' || storedRole === 'vendor' ? storedRole : 'user');

    const normalizedUser = { ...payload.user, userType: effectiveRole };

    await AsyncStorage.setItem('accessToken', payload.accessToken);
    if (payload.refreshToken) {
      await AsyncStorage.setItem('refreshToken', payload.refreshToken);
    }
    await AsyncStorage.setItem('user', JSON.stringify(normalizedUser));
    await AsyncStorage.setItem('userRole', effectiveRole);

    dispatch(apiSlice.util.resetApiState());
    dispatch(setCredentials({
      user: normalizedUser,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken || null
    }));

    if (payload?.isNewUser === true) {
      router.replace("/(onboarding)/user-selection");
      return;
    }

    if (effectiveRole === 'vendor') {
      router.replace("/(tabs)");
      return;
    }

    if (effectiveRole === 'buyer') {
      router.replace("/(users)");
      return;
    }

    router.replace("/(onboarding)/user-selection");
  };

  const handleGoogleLogin = async () => {
    if (Constants.appOwnership === "expo") {
      Alert.alert("Google Sign-In unavailable", "Use a development build (not Expo Go) for native Google Sign-In.");
      return;
    }
    if (!googleWebClientId) {
      Alert.alert("Missing Google Client ID", "Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env and restart the app.");
      return;
    }
    const googleModule = getGoogleModule();
    if (!googleModule) {
      Alert.alert("Google Sign-In unavailable", "RNGoogleSignin native module is missing. Rebuild the app with expo run:android/ios.");
      return;
    }

    setIsSocialLoading(true);
    try {
      const { GoogleSignin } = googleModule;
      GoogleSignin.configure({ webClientId: googleWebClientId });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();
      let idToken = (signInResult as any)?.data?.idToken || (signInResult as any)?.idToken;

      if (!idToken) {
        const tokenPayload = await GoogleSignin.getTokens();
        idToken = tokenPayload?.idToken;
      }

      if (!idToken) {
        throw new Error("Failed to get Google ID token");
      }

      const response = await googleAuthMutation({ idToken }).unwrap();
      await completeSocialAuth(response);
    } catch (error) {
      Alert.alert("Google Login Failed", parseAuthError(error));
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== "ios" || !AppleAuth.isSupported) {
      alert("Apple Sign In is only available on supported iOS devices.");
      return;
    }

    setIsSocialLoading(true);
    try {
      const appleAuthRequestResponse = await AppleAuth.performRequest({
        requestedOperation: AppleRequestOperation.LOGIN,
        requestedScopes: [AppleRequestScope.EMAIL, AppleRequestScope.FULL_NAME],
      });

      const { identityToken, authorizationCode, fullName } = appleAuthRequestResponse;

      if (!identityToken || !authorizationCode) {
        throw new Error("Apple Sign In failed - missing tokens");
      }

      const displayName = fullName?.givenName
        ? `${fullName.givenName} ${fullName.familyName ?? ""}`.trim()
        : undefined;

      const response = await appleAuthMutation({
        identityToken,
        authorizationCode,
        fullName: displayName,
      }).unwrap();

      await completeSocialAuth(response);
    } catch (error) {
      alert(parseAuthError(error));
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleLogin = async () => {
    console.log('Attempting login with:', emailOrPhone);
    try {
      const userData = await login({ email: emailOrPhone, password }).unwrap();
      console.log('Login successful, complete response:', JSON.stringify(userData, null, 2));

      const { data } = userData;

      if (!data || !data.accessToken) {
        console.error('Login response missing data or accessToken!', userData);
        alert(ui.invalidResponse);
        return;
      }

      console.log('User data from response:', JSON.stringify(data.user, null, 2));

      // Save to AsyncStorage
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
      if (data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
      }

      // Auto-navigate based on registered role
      const userType = data.user?.userType;
      const storedRole = await AsyncStorage.getItem('userRole');
      const effectiveRole =
        userType === 'buyer' || userType === 'vendor'
          ? userType
          : (storedRole === 'buyer' || storedRole === 'vendor' ? storedRole : 'user');
      console.log('User type detected:', userType);

      const normalizedUser = { ...data.user, userType: effectiveRole };
      dispatch(apiSlice.util.resetApiState());
      dispatch(setCredentials({ user: normalizedUser, accessToken: data.accessToken, refreshToken: data.refreshToken }));
      await AsyncStorage.setItem('user', JSON.stringify(normalizedUser));

      // Save role to AsyncStorage for role-based UI
      if (effectiveRole) {
        await AsyncStorage.setItem('userRole', effectiveRole);
      }

      if (effectiveRole === 'vendor') {
        console.log('Redirecting vendor to (tabs)...');
        router.replace("/(tabs)");
      } else if (effectiveRole === 'buyer') {
        console.log('Redirecting buyer to (users)...');
        router.replace("/(users)");
      } else {
        console.log('No final role yet, redirecting to role selection...');
        router.replace("/(onboarding)/user-selection");
      }
    } catch (err) {
      console.error('Login error full object:', JSON.stringify(err, null, 2));
      alert(`${ui.loginFailed}: ` + ((err as any)?.data?.message || "Check your credentials"));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#333" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>{ui.welcomeBack}</Text>
          <Text style={styles.subText}>{ui.loginToAccount}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{ui.enterEmail}</Text>
          <TextInput
            style={styles.input}
            placeholder={ui.emailAddress}
            placeholderTextColor="#999"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            autoCapitalize="none"
          />

          <Text style={styles.label}>{ui.password}</Text>
          <View style={styles.passwordInputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#ccc" style={styles.lockIcon} />
            <TextInput
              style={styles.passwordInput}
              placeholder="********"
              placeholderTextColor="#ccc"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
              <Ionicons
                name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                size={22}
                color="#ccc"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.checkboxContainer} onPress={() => setRememberMe(!rememberMe)}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.optionText}>{ui.rememberMe}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
              <Text style={styles.forgotText}>{ui.forgotPassword}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>{ui.login}</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.socialSection}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{ui.orContinue}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialIconsRow}>
            <TouchableOpacity style={styles.socialIconCircle} onPress={handleGoogleLogin} disabled={isSocialLoading || isLoading}><FontAwesome name="google" size={24} color="#DB4437" /></TouchableOpacity>
            <TouchableOpacity style={styles.socialIconCircle} onPress={handleAppleLogin} disabled={isSocialLoading || isLoading}><FontAwesome name="apple" size={24} color="black" /></TouchableOpacity>
            
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{`${ui.noAccount} `}</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.signUpText}>{ui.signUp}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FBFB" },
  backButton: { paddingHorizontal: 20, paddingTop: 10 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 20 },
  header: { direction: 'ltr', marginTop: 20, marginBottom: 30 },
  welcomeText: { fontSize: 28, fontWeight: "bold", color: "#1A1A1A" },
  subText: { fontSize: 16, color: "#7C7C7C", marginTop: 5 },
  form: { width: "100%" },
  label: { fontSize: 15, fontWeight: "500", color: "#444", marginBottom: 10, marginTop: 15 },
  input: {
    height: 58,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#333",
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 58,
  },
  lockIcon: { marginRight: 12 },
  passwordInput: { flex: 1, height: "100%", fontSize: 16, color: "#000" },
  optionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 15 },
  checkboxContainer: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 10, // Circular checkbox
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: { borderColor: "#2D8C8C" },
  checkboxInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#2D8C8C" },
  optionText: { color: "#7C7C7C", fontSize: 14 },
  forgotText: { color: "#FF7070", fontSize: 14, fontWeight: "500" }, // Red text
  loginButton: {
    backgroundColor: "#3A8B8B", // Teal color from image
    height: 58,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  loginButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  socialSection: { marginTop: 40, alignItems: "center" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E0E0E0" },
  dividerText: { paddingHorizontal: 15, color: "#7C7C7C", fontSize: 13 },
  socialIconsRow: { flexDirection: "row", gap: 20 },
  socialIconCircle: {
    width: 55, height: 55, borderRadius: 28, backgroundColor: "#FFF",
    justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#EAEAEA",
  },
  footerRow: { flexDirection: "row", marginTop: 35 },
  footerText: { color: "#7C7C7C", fontSize: 15 },
  signUpText: { color: "#1A1A1A", fontWeight: "bold", fontSize: 15 },
});

