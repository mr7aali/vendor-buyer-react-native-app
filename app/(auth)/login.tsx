import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppleAuth, {
  AppleRequestOperation,
  AppleRequestScope,
} from "@invertase/react-native-apple-authentication";
import { GoogleLogo } from "@/components/ui/google-logo";
import { getLayoutDirection } from "@/constants/rtl";
import { useTranslation } from "@/hooks/use-translation";
import { persistAuthState } from "@/services/authStorage";
import {
  clearRememberedLogin,
  disableBiometricLogin,
  getBiometricLoginState,
  maskLoginIdentifier,
  promptBiometricUnlock,
  saveRememberedLogin,
} from "@/services/biometricAuth";
import { apiSlice } from "@/store/api/apiSlice";
import {
  useAppleAuthMutation,
  useGoogleAuthMutation,
  useLoginMutation,
} from "@/store/api/authApiSlice";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PendingBiometricEnrollment = {
  identifier: string;
  password: string;
  supported: boolean;
  enrolled: boolean;
  effectiveRole: string;
};

export default function LoginScreen() {
  const { language, setAppLanguage, t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const autoPromptedRef = useRef(false);

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isBiometricBusy, setIsBiometricBusy] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricTypeLabel, setBiometricTypeLabel] = useState("Fingerprint");
  const [savedLoginHint, setSavedLoginHint] = useState("");
  const [showEnableBiometricModal, setShowEnableBiometricModal] = useState(false);
  const [pendingBiometricEnrollment, setPendingBiometricEnrollment] =
    useState<PendingBiometricEnrollment | null>(null);

  const googleWebClientId = (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "").trim();
  const isRTL = getLayoutDirection(language) === "rtl";

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
        quickLoginTitle: "כניסה מאובטחת מהירה",
        quickLoginSubtitle: "השתמש באישורים השמורים שלך עם אימות ביומטרי.",
        quickLoginButton: "המשך עם ביומטריה",
        disableBiometric: "השבת",
        enableBiometricTitle: "לאפשר כניסה ביומטרית?",
        enableBiometricBody:
          "השתמש בטביעת האצבע או בביומטריה של המכשיר להתחברות מהירה ובטוחה יותר בפעם הבאה.",
        notNow: "לא עכשיו",
        enableNow: "אפשר עכשיו",
        biometricUnsupported: "אימות ביומטרי אינו נתמך במכשיר זה.",
        biometricNotEnrolled: "לא מוגדרת טביעת אצבע או ביומטריה במכשיר זה.",
        biometricFailed: "האימות הביומטרי נכשל. נסה שוב או התחבר ידנית.",
        biometricCancelled: "האימות הביומטרי בוטל.",
        credentialsMissing:
          "פרטי ההתחברות הביומטריים השמורים אינם זמינים. התחבר שוב ידנית.",
        fillCredentials: "אנא הזן גם אימייל וגם סיסמה.",
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
        quickLoginTitle: "त्वरित सुरक्षित लॉगिन",
        quickLoginSubtitle:
          "बायोमेट्रिक सत्यापन के साथ अपने सेव किए गए क्रेडेंशियल्स का उपयोग करें।",
        quickLoginButton: "बायोमेट्रिक्स के साथ जारी रखें",
        disableBiometric: "बंद करें",
        enableBiometricTitle: "बायोमेट्रिक लॉगिन सक्षम करें?",
        enableBiometricBody:
          "अगली बार तेज और सुरक्षित लॉगिन के लिए अपने फिंगरप्रिंट या डिवाइस बायोमेट्रिक्स का उपयोग करें।",
        notNow: "अभी नहीं",
        enableNow: "अभी सक्षम करें",
        biometricUnsupported: "इस डिवाइस पर बायोमेट्रिक ऑथेंटिकेशन समर्थित नहीं है।",
        biometricNotEnrolled: "इस डिवाइस पर कोई फिंगरप्रिंट या बायोमेट्रिक सेट नहीं है।",
        biometricFailed:
          "बायोमेट्रिक ऑथेंटिकेशन विफल रहा। कृपया फिर से कोशिश करें या मैन्युअली लॉगिन करें।",
        biometricCancelled: "बायोमेट्रिक ऑथेंटिकेशन रद्द कर दिया गया।",
        credentialsMissing:
          "सेव किए गए बायोमेट्रिक क्रेडेंशियल्स उपलब्ध नहीं हैं। कृपया फिर से मैन्युअली लॉगिन करें।",
        fillCredentials: "कृपया ईमेल और पासवर्ड दोनों दर्ज करें।",
      };
    }

    return {
      welcomeBack: "Welcome Back",
      loginToAccount: "Login to your account",
      enterEmail: "Enter your e-mail",
      emailAddress: "E-mail address",
      password: "Password",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      login: "Login",
      loggingIn: "Logging in...",
      orContinue: "Or Continue With",
      noAccount: "Don't have an account?",
      signUp: "Sign Up",
      loginFailed: "Login failed",
      invalidResponse: "Login failed: Invalid server response",
      quickLoginTitle: "Quick secure login",
      quickLoginSubtitle: "Use your saved credentials with biometric verification.",
      quickLoginButton: "Continue with biometrics",
      disableBiometric: "Disable",
      enableBiometricTitle: "Enable biometric login?",
      enableBiometricBody:
        "Use your fingerprint or device biometrics next time for a faster and secure login.",
      notNow: "Not now",
      enableNow: "Enable now",
      biometricUnsupported: "Biometric authentication is not supported on this device.",
      biometricNotEnrolled: "No fingerprint or biometric is enrolled on this device.",
      biometricFailed: "Biometric authentication failed. Please try again or log in manually.",
      biometricCancelled: "Biometric authentication was cancelled.",
      credentialsMissing:
        "Saved biometric credentials are unavailable. Please log in manually again.",
      fillCredentials: "Please enter both your e-mail and password.",
    };
  }, [language]);

  const languageSheetTitle = React.useMemo(() => {
    if (language === "he") return "בחר שפה";
    if (language === "hi") return "भाषा चुनें";
    return "Choose Language";
  }, [language]);

  const languageSheetSubtitle = React.useMemo(() => {
    if (language === "he") return "הבחירה שלך תחול מיד בכל רחבי האפליקציה.";
    if (language === "hi") return "आपका चयन तुरंत पूरे ऐप में लागू हो जाएगा।";
    return "Your selection will apply instantly across the app.";
  }, [language]);

  const languageOptions = React.useMemo(
    () => [
      {
        code: "en" as const,
        label: t("english", "English"),
        nativeLabel: "English",
        shortLabel: "EN",
      },
      {
        code: "he" as const,
        label: t("hebrew", "Hebrew"),
        nativeLabel: "עברית",
        shortLabel: "HE",
      },
      {
        code: "hi" as const,
        label: t("hindi", "Hindi"),
        nativeLabel: "हिंदी",
        shortLabel: "HI",
      },
    ],
    [t],
  );

  const currentLanguageOption =
    languageOptions.find((option) => option.code === language) || languageOptions[0];

  const [login, { isLoading }] = useLoginMutation();
  const [googleAuthMutation] = useGoogleAuthMutation();
  const [appleAuthMutation] = useAppleAuthMutation();
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const canUseQuickLogin =
    biometricSupported && biometricEnrolled && biometricEnabled && !!savedLoginHint;

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const state = await getBiometricLoginState();
      if (!mounted) return;

      setBiometricSupported(state.biometricSupported);
      setBiometricEnrolled(state.biometricEnrolled);
      setBiometricEnabled(state.biometricEnabled);
      setBiometricTypeLabel(state.biometricTypeLabel);

      if (state.savedCredentials) {
        setRememberMe(true);
        setEmailOrPhone(state.savedCredentials.identifier);
        setPassword(state.savedCredentials.password);
        setSavedLoginHint(maskLoginIdentifier(state.savedCredentials.identifier));
      }

    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLanguageSelect = async (nextLanguage: typeof language) => {
    await setAppLanguage(nextLanguage);
    setIsLanguageModalVisible(false);
  };

  const getGoogleModule = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("@react-native-google-signin/google-signin") as typeof import("@react-native-google-signin/google-signin");
    } catch {
      return null;
    }
  };

  const parseAuthError = (error: any): string => {
    const message = error?.data?.message || error?.response?.data?.message || error?.message;
    if (message) return message;
    if (error?.code === "SIGN_IN_CANCELLED") return "Sign in was cancelled.";
    if (error?.code === "IN_PROGRESS") return "Sign in already in progress.";
    if (error?.code === "PLAY_SERVICES_NOT_AVAILABLE") {
      return "Google Play Services is not available on this device.";
    }
    return "Something went wrong. Please try again.";
  };

  const routeAfterAuth = React.useCallback((role: string) => {
    if (role === "vendor") {
      router.replace("/(tabs)");
      return;
    }

    if (role === "buyer") {
      router.replace("/(users)");
      return;
    }

    router.replace("/(onboarding)/user-selection");
  }, [router]);

  const finalizeSuccessfulLogin = React.useCallback(async ({
    identifier,
    password: secret,
    accessToken,
    refreshToken,
    normalizedUser,
    availableProfiles,
    effectiveRole,
    keepBiometricEnabled = false,
  }: {
    identifier: string;
    password: string;
    accessToken: string;
    refreshToken?: string | null;
    normalizedUser: any;
    availableProfiles: any;
    effectiveRole: string;
    keepBiometricEnabled?: boolean;
  }) => {
    dispatch(apiSlice.util.resetApiState());
    dispatch(
      setCredentials({
        user: normalizedUser,
        accessToken,
        refreshToken: refreshToken || null,
        availableProfiles,
      }),
    );

    await persistAuthState({
      accessToken,
      refreshToken: refreshToken || null,
      user: normalizedUser,
      availableProfiles,
    });

    if (biometricSupported && biometricEnrolled && !biometricEnabled) {
      setPendingBiometricEnrollment({
        identifier,
        password: secret,
        supported: biometricSupported,
        enrolled: biometricEnrolled,
        effectiveRole,
      });
      setShowEnableBiometricModal(true);
      return;
    }

    if (!rememberMe && !keepBiometricEnabled) {
      await clearRememberedLogin();
      routeAfterAuth(effectiveRole);
      return;
    }

    await saveRememberedLogin({
      identifier,
      password: secret,
      biometricEnabled: keepBiometricEnabled,
    });
    setSavedLoginHint(maskLoginIdentifier(identifier));

    routeAfterAuth(effectiveRole);
  }, [
    biometricEnabled,
    biometricEnrolled,
    biometricSupported,
    dispatch,
    rememberMe,
    routeAfterAuth,
  ]);

  const submitLogin = React.useCallback(async (identifier: string, secret: string) => {
    const normalizedIdentifier = String(identifier || "").trim();
    if (!normalizedIdentifier || !secret) {
      Alert.alert(ui.loginFailed, ui.fillCredentials);
      return;
    }

    try {
      const userData = await login({ email: normalizedIdentifier, password: secret }).unwrap();
      const { data } = userData;

      if (!data?.accessToken) {
        Alert.alert(ui.loginFailed, ui.invalidResponse);
        return;
      }

      const userType = data.user?.userType;
      const storedRole = await AsyncStorage.getItem("userRole");
      const effectiveRole =
        userType === "buyer" || userType === "vendor"
          ? userType
          : storedRole === "buyer" || storedRole === "vendor"
            ? storedRole
            : "user";

      const inferredEmail = normalizedIdentifier.includes("@") ? normalizedIdentifier : "";
      const normalizedUser = {
        ...data.user,
        email: data.user?.email || inferredEmail,
        userType: effectiveRole,
      };

      await finalizeSuccessfulLogin({
        identifier: normalizedIdentifier,
        password: secret,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        normalizedUser,
        availableProfiles: data.availableProfiles || null,
        effectiveRole,
        keepBiometricEnabled: biometricEnabled,
      });
    } catch (err) {
      Alert.alert(
        ui.loginFailed,
        ((err as any)?.data?.message || "Check your credentials.") as string,
      );
    }
  }, [
    biometricEnabled,
    finalizeSuccessfulLogin,
    login,
    ui.fillCredentials,
    ui.invalidResponse,
    ui.loginFailed,
  ]);

  const handleBiometricLogin = React.useCallback(async () => {
    setIsBiometricBusy(true);

    try {
      const result = await promptBiometricUnlock(`Use ${biometricTypeLabel} to log in`);

      if (!result.success) {
        if (result.reason === "not_supported") {
          Alert.alert("Biometric unavailable", ui.biometricUnsupported);
        } else if (result.reason === "not_enrolled") {
          Alert.alert("Biometric unavailable", ui.biometricNotEnrolled);
        } else if (result.reason === "user_cancelled") {
          Alert.alert("Cancelled", ui.biometricCancelled);
        } else if (result.reason === "credentials_missing") {
          Alert.alert("Saved login unavailable", ui.credentialsMissing);
          await clearRememberedLogin();
          setBiometricEnabled(false);
          setSavedLoginHint("");
        } else {
          Alert.alert("Authentication failed", ui.biometricFailed);
        }

        return;
      }

      setEmailOrPhone(result.credentials.identifier);
      setPassword(result.credentials.password);
      await submitLogin(result.credentials.identifier, result.credentials.password);
    } finally {
      setIsBiometricBusy(false);
    }
  }, [
    biometricTypeLabel,
    submitLogin,
    ui.biometricCancelled,
    ui.biometricFailed,
    ui.biometricNotEnrolled,
    ui.biometricUnsupported,
    ui.credentialsMissing,
  ]);

  useFocusEffect(
    React.useCallback(() => {
      autoPromptedRef.current = false;

      const runAutoBiometricLogin = async () => {
        const state = await getBiometricLoginState();

        if (
          autoPromptedRef.current ||
          isBiometricBusy ||
          isLoading ||
          isSocialLoading ||
          showEnableBiometricModal ||
          !state.biometricSupported ||
          !state.biometricEnrolled ||
          !state.biometricEnabled ||
          !state.savedCredentials
        ) {
          return;
        }

        autoPromptedRef.current = true;
        await handleBiometricLogin();
      };

      const timer = setTimeout(() => {
        void runAutoBiometricLogin();
      }, 250);

      return () => {
        clearTimeout(timer);
        autoPromptedRef.current = false;
      };
    }, [
      handleBiometricLogin,
      isBiometricBusy,
      isLoading,
      isSocialLoading,
      showEnableBiometricModal,
    ]),
  );

  const handleDisableBiometric = async () => {
    await disableBiometricLogin();
    setBiometricEnabled(false);
  };

  const handleEnableBiometricNow = async () => {
    if (!pendingBiometricEnrollment) {
      setShowEnableBiometricModal(false);
      return;
    }

    if (!pendingBiometricEnrollment.supported) {
      Alert.alert("Biometric unavailable", ui.biometricUnsupported);
      setShowEnableBiometricModal(false);
      routeAfterAuth(pendingBiometricEnrollment.effectiveRole);
      return;
    }

    if (!pendingBiometricEnrollment.enrolled) {
      Alert.alert("Biometric unavailable", ui.biometricNotEnrolled);
      setShowEnableBiometricModal(false);
      routeAfterAuth(pendingBiometricEnrollment.effectiveRole);
      return;
    }

    await saveRememberedLogin({
      identifier: pendingBiometricEnrollment.identifier,
      password: pendingBiometricEnrollment.password,
      biometricEnabled: true,
    });

    setBiometricEnabled(true);
    setSavedLoginHint(maskLoginIdentifier(pendingBiometricEnrollment.identifier));
    setShowEnableBiometricModal(false);
    setPendingBiometricEnrollment(null);
    routeAfterAuth(pendingBiometricEnrollment.effectiveRole);
  };

  const closeBiometricEnrollmentModal = () => {
    setShowEnableBiometricModal(false);
    if (!pendingBiometricEnrollment) {
      return;
    }

    const { identifier, password: passwordValue, effectiveRole } = pendingBiometricEnrollment;
    if (rememberMe) {
      void saveRememberedLogin({
        identifier,
        password: passwordValue,
        biometricEnabled: false,
      });
    } else {
      void clearRememberedLogin();
    }
    setPendingBiometricEnrollment(null);
    routeAfterAuth(effectiveRole);
  };

  const completeSocialAuth = async (response: any) => {
    const payload = response?.data?.accessToken || response?.data?.user ? response.data : response;

    if (!payload?.accessToken || !payload?.user) {
      Alert.alert(ui.loginFailed, ui.invalidResponse);
      return;
    }

    const userType = payload.user?.userType;
    const storedRole = await AsyncStorage.getItem("userRole");
    const effectiveRole =
      userType === "buyer" || userType === "vendor"
        ? userType
        : storedRole === "buyer" || storedRole === "vendor"
          ? storedRole
          : "user";

    const normalizedUser = { ...payload.user, userType: effectiveRole };
    const availableProfiles = payload.availableProfiles || null;

    await persistAuthState({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken || null,
      user: normalizedUser,
      availableProfiles,
    });

    dispatch(apiSlice.util.resetApiState());
    dispatch(
      setCredentials({
        user: normalizedUser,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken || null,
        availableProfiles,
      }),
    );

    if (payload?.isNewUser === true) {
      router.replace("/(onboarding)/user-selection");
      return;
    }

    routeAfterAuth(effectiveRole);
  };

  const handleGoogleLogin = async () => {
    if (Constants.appOwnership === "expo") {
      Alert.alert(
        "Google Sign-In unavailable",
        "Use a development build, not Expo Go, for native Google Sign-In.",
      );
      return;
    }

    if (!googleWebClientId) {
      Alert.alert(
        "Missing Google Client ID",
        "Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env and restart the app.",
      );
      return;
    }

    const googleModule = getGoogleModule();
    if (!googleModule) {
      Alert.alert(
        "Google Sign-In unavailable",
        "Google Sign-In native module is missing. Rebuild the app.",
      );
      return;
    }

    setIsSocialLoading(true);
    try {
      const { GoogleSignin } = googleModule;
      GoogleSignin.configure({ webClientId: googleWebClientId });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      if (GoogleSignin.getCurrentUser()) {
        await GoogleSignin.signOut();
      }

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
      Alert.alert("Apple Sign-In unavailable", "Apple Sign-In works only on supported iOS devices.");
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
        throw new Error("Apple Sign-In failed - missing tokens");
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
      Alert.alert("Apple Login Failed", parseAuthError(error));
    } finally {
      setIsSocialLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.topBar, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={28} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.languageTrigger, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          onPress={() => setIsLanguageModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.languageBadge}>
            <Text style={styles.languageBadgeText}>{currentLanguageOption.shortLabel}</Text>
          </View>
          <Text style={styles.languageTriggerText}>{currentLanguageOption.label}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color="#4B5563" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>{ui.welcomeBack}</Text>
          <Text style={styles.subText}>{ui.loginToAccount}</Text>
        </View>

        {canUseQuickLogin ? (
          <View style={styles.quickLoginShell}>
            <TouchableOpacity
              style={styles.quickLoginCard}
              onPress={handleBiometricLogin}
              activeOpacity={0.92}
              disabled={isLoading || isSocialLoading || isBiometricBusy}
            >
              <LinearGradient
                colors={["#0F766E", "#2BA7A0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickLoginGradient}
              >
                <View style={styles.quickLoginIconWrap}>
                  {isBiometricBusy ? (
                    <ActivityIndicator color="#0F766E" />
                  ) : (
                    <Ionicons name="finger-print-outline" size={28} color="#0F766E" />
                  )}
                </View>

                <View style={styles.quickLoginTextWrap}>
                  <Text style={styles.quickLoginTitle}>{ui.quickLoginTitle}</Text>
                  <Text style={styles.quickLoginSubtitle}>{ui.quickLoginSubtitle}</Text>
                  <Text style={styles.quickLoginMeta}>
                    {ui.quickLoginButton} {"\u2022"} {savedLoginHint}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.disableBiometricButton} onPress={handleDisableBiometric}>
              <Text style={styles.disableBiometricText}>{ui.disableBiometric}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.label}>{ui.enterEmail}</Text>
          <TextInput
            style={styles.input}
            placeholder={ui.emailAddress}
            placeholderTextColor="#9CA3AF"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            autoCapitalize="none"
          />

          <Text style={styles.label}>{ui.password}</Text>
          <View style={styles.passwordInputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.lockIcon} />
            <TextInput
              style={styles.passwordInput}
              placeholder="********"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setIsPasswordVisible((value) => !value)}>
              <Ionicons
                name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                size={22}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setRememberMe((value) => !value)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe ? <View style={styles.checkboxInner} /> : null}
              </View>
              <Text style={styles.optionText}>{ui.rememberMe}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
              <Text style={styles.forgotText}>{ui.forgotPassword}</Text>
            </TouchableOpacity>
          </View>

          {rememberMe ? (
            <View style={styles.helperCard}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#0F766E" />
              <Text style={styles.helperText}>
                {biometricSupported && biometricEnrolled
                  ? `${biometricTypeLabel} login can be enabled right after a successful login.`
                  : "Saved login is enabled. Biometric login will stay unavailable until this device supports and enrolls it."}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => void submitLogin(emailOrPhone, password)}
            disabled={isLoading || isBiometricBusy}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>{ui.login}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.socialSection}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{ui.orContinue}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialIconsRow}>
            <TouchableOpacity
              style={styles.socialIconCircle}
              onPress={handleGoogleLogin}
              disabled={isSocialLoading || isLoading}
            >
              <GoogleLogo size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialIconCircle}
              onPress={handleAppleLogin}
              disabled={isSocialLoading || isLoading}
            >
              <FontAwesome name="apple" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{`${ui.noAccount} `}</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.signUpText}>{ui.signUp}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isLanguageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsLanguageModalVisible(false)}>
          <Pressable style={styles.languageSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.languageSheetTitle}>{languageSheetTitle}</Text>
            <Text style={styles.languageSheetSubtitle}>{languageSheetSubtitle}</Text>

            <View style={styles.languageOptionList}>
              {languageOptions.map((option) => {
                const selected = option.code === language;

                return (
                  <TouchableOpacity
                    key={option.code}
                    style={[styles.languageOption, selected && styles.languageOptionSelected]}
                    onPress={() => void handleLanguageSelect(option.code)}
                    activeOpacity={0.88}
                  >
                    <View style={styles.languageOptionTextWrap}>
                      <Text
                        style={[
                          styles.languageOptionLabel,
                          selected && styles.languageOptionLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text style={styles.languageOptionNativeLabel}>{option.nativeLabel}</Text>
                    </View>

                    <View
                      style={[
                        styles.languageOptionIndicator,
                        selected && styles.languageOptionIndicatorSelected,
                      ]}
                    >
                      {selected ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showEnableBiometricModal}
        transparent
        animationType="fade"
        onRequestClose={closeBiometricEnrollmentModal}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.biometricModalCard}>
            <View style={styles.biometricModalIcon}>
              <Ionicons name="finger-print-outline" size={28} color="#0F766E" />
            </View>
            <Text style={styles.biometricModalTitle}>{ui.enableBiometricTitle}</Text>
            <Text style={styles.biometricModalBody}>{ui.enableBiometricBody}</Text>

            <View style={styles.biometricModalActions}>
              <TouchableOpacity
                style={styles.biometricModalSecondaryButton}
                onPress={closeBiometricEnrollmentModal}
              >
                <Text style={styles.biometricModalSecondaryText}>{ui.notNow}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.biometricModalPrimaryButton}
                onPress={() => void handleEnableBiometricNow()}
              >
                <Text style={styles.biometricModalPrimaryText}>{ui.enableNow}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5FAF9",
  },
  topBar: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    paddingVertical: 6,
  },
  languageTrigger: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2EBEA",
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 8,
    shadowColor: "#173B3A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    gap: 8,
  },
  languageBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E7F4F3",
    alignItems: "center",
    justifyContent: "center",
  },
  languageBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#237B7B",
    letterSpacing: 0.6,
  },
  languageTriggerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  header: {
    marginTop: 20,
    marginBottom: 26,
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: "800",
    color: "#142321",
  },
  subText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 6,
  },
  quickLoginShell: {
    marginBottom: 18,
  },
  quickLoginCard: {
    borderRadius: 24,
    overflow: "hidden",
  },
  quickLoginGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  quickLoginIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E7FCF9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  quickLoginTextWrap: {
    flex: 1,
  },
  quickLoginTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  quickLoginSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  quickLoginMeta: {
    color: "#D8FFFB",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
  },
  disableBiometricButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  disableBiometricText: {
    color: "#0F766E",
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5EEEC",
    padding: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
    marginTop: 14,
  },
  input: {
    height: 58,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 58,
  },
  lockIcon: {
    marginRight: 12,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#111827",
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    borderColor: "#0F766E",
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0F766E",
  },
  optionText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
  },
  forgotText: {
    color: "#E25D6D",
    fontSize: 14,
    fontWeight: "600",
  },
  helperCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    backgroundColor: "#EFFAFA",
    borderWidth: 1,
    borderColor: "#D5EEEE",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  helperText: {
    flex: 1,
    color: "#355C59",
    fontSize: 13,
    lineHeight: 18,
  },
  loginButton: {
    backgroundColor: "#197E77",
    height: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  socialSection: {
    marginTop: 40,
    alignItems: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E7E5",
  },
  dividerText: {
    paddingHorizontal: 15,
    color: "#7C7C7C",
    fontSize: 13,
  },
  socialIconsRow: {
    flexDirection: "row",
    gap: 20,
  },
  socialIconCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  footerRow: {
    flexDirection: "row",
    marginTop: 35,
  },
  footerText: {
    color: "#7C7C7C",
    fontSize: 15,
  },
  signUpText: {
    color: "#1A1A1A",
    fontWeight: "bold",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.22)",
    justifyContent: "flex-end",
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.24)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  languageSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D7E2E1",
    marginBottom: 18,
  },
  languageSheetTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#172033",
  },
  languageSheetSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 18,
  },
  languageOptionList: {
    gap: 12,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7FAFA",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E4ECEB",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  languageOptionSelected: {
    backgroundColor: "#ECF7F6",
    borderColor: "#2D8C8C",
  },
  languageOptionTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  languageOptionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  languageOptionLabelSelected: {
    color: "#166B6B",
  },
  languageOptionNativeLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  languageOptionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#C8D2D1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  languageOptionIndicatorSelected: {
    backgroundColor: "#2D8C8C",
    borderColor: "#2D8C8C",
  },
  biometricModalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  biometricModalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E7F7F4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  biometricModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#142321",
    textAlign: "center",
  },
  biometricModalBody: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
  },
  biometricModalActions: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  biometricModalSecondaryButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    alignItems: "center",
  },
  biometricModalSecondaryText: {
    color: "#374151",
    fontWeight: "700",
  },
  biometricModalPrimaryButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#197E77",
    paddingVertical: 14,
    alignItems: "center",
  },
  biometricModalPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
