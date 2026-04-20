import { useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Stack, router, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { AppState, View } from "react-native";
import "react-native-reanimated";
import { CountryModalProvider } from "react-native-country-picker-modal";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { Provider, useSelector } from "react-redux";
import { getLayoutDirection, syncRTLForLanguage } from "../constants/rtl";
import { SocketProvider } from "../context/SocketContext";
import {
  clearPersistedAuthState,
  persistAuthState,
} from "../services/authStorage";
import {
  getBiometricLoginState,
  promptBiometricUnlock,
} from "../services/biometricAuth";
import {
  registerForPushNotificationsAsync,
  syncPushTokenToBackend,
} from "../services/pushNotifications";
import { useGetProfileQuery } from "../store/api/authApiSlice";
import { logOut, setCredentials } from "../store/slices/authSlice";
import { selectLanguage, setLanguage } from "../store/slices/languageSlice";
import { RootState, store } from "../store/store";
import "./global.css";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if the splash screen is already controlled elsewhere.
});

const APP_BACKGROUND_COLOR = "#F8FAF9";
const ONBOARDING_ROUTE_PREFIXES = ["/(onboarding)"];

const AuthSync = () => {
  const dispatch = store.dispatch;
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const refreshToken = useSelector(
    (state: RootState) => state.auth.refreshToken,
  );
  const availableProfiles = useSelector(
    (state: RootState) => state.auth.availableProfiles,
  );
  const syncedPushTokenRef = React.useRef<string | null>(null);

  const { data: profileData } = useGetProfileQuery(undefined, {
    skip: !token,
  });

  React.useEffect(() => {
    if (profileData?.data && token) {
      const resolvedUserId =
        profileData.data.userId ||
        profileData.data.vendor?.userId ||
        profileData.data.buyer?.userId ||
        profileData.data.id;
      const updatedUser = {
        ...user,
        ...profileData.data,
        userId: resolvedUserId || user?.userId,
      };
      const currentUserJson = JSON.stringify(user || {});
      const updatedUserJson = JSON.stringify(updatedUser || {});

      if (currentUserJson === updatedUserJson) return;

      console.log("Syncing profile data into auth state");
      persistAuthState({
        accessToken: token,
        refreshToken: refreshToken || null,
        user: updatedUser,
        availableProfiles,
      });

      dispatch(
        setCredentials({
          user: updatedUser,
          accessToken: token,
          refreshToken: refreshToken || "",
          availableProfiles,
        }),
      );
    }
  }, [profileData, token, refreshToken, dispatch, user, availableProfiles]);

  React.useEffect(() => {
    let isMounted = true;

    const registerAndSyncPushToken = async () => {
      try {
        if (!token) return;

        const tokens = await registerForPushNotificationsAsync();
        if (!tokens || !isMounted) return;

        const tokenKey = `${tokens.expoPushToken || ""}|${tokens.nativePushToken || ""}`;
        if (!tokenKey.replace("|", "")) return;
        if (tokenKey === syncedPushTokenRef.current) return;

        const synced = await syncPushTokenToBackend(tokens, token);
        if (synced && isMounted) {
          syncedPushTokenRef.current = tokenKey;
        }
      } catch (error) {
        console.warn("Push token registration/sync effect failed.", error);
      }
    };

    registerAndSyncPushToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return null;
};

const AppNavigator = () => {
  const language = useAppSelector(selectLanguage);
  const isRTL = getLayoutDirection(language) === "rtl";

  return (
    <View
      style={{
        flex: 1,
        direction: isRTL ? "rtl" : "ltr",
        backgroundColor: APP_BACKGROUND_COLOR,
      }}
    >
      <StatusBar
        style="dark"
        backgroundColor={APP_BACKGROUND_COLOR}
        translucent={false}
      />
      <Stack key={isRTL ? "rtl" : "ltr"} initialRouteName="index">
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(users)" options={{ headerShown: false }} />
        <Stack.Screen name="(user_screen)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(screens)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
};

const BiometricAppLock = () => {
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const pathname = usePathname();
  const appStateRef = React.useRef(AppState.currentState);
  const isPromptingRef = React.useRef(false);
  const hasBootPromptedRef = React.useRef(false);

  React.useEffect(() => {
    const shouldSkipCurrentRoute = ONBOARDING_ROUTE_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    );

    const lockToLogin = async () => {
      await clearPersistedAuthState();
      store.dispatch(logOut());
      router.replace("/(auth)/login");
    };

    const maybePromptForUnlock = async () => {
      if (shouldSkipCurrentRoute || isPromptingRef.current) {
        return;
      }

      const biometricState = await getBiometricLoginState();

      if (
        !biometricState.biometricSupported ||
        !biometricState.biometricEnrolled ||
        !biometricState.biometricEnabled ||
        !biometricState.savedCredentials
      ) {
        return;
      }

      isPromptingRef.current = true;

      try {
        const result = await promptBiometricUnlock(
          `Use ${biometricState.biometricTypeLabel} to unlock the app`,
        );

        if (!result.success) {
          await lockToLogin();
        }
      } finally {
        isPromptingRef.current = false;
      }
    };

    if (!hasBootPromptedRef.current) {
      hasBootPromptedRef.current = true;
      setTimeout(() => {
        void maybePromptForUnlock();
      }, 250);
    }

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const previousAppState = appStateRef.current;

      if (
        (previousAppState === "inactive" || previousAppState === "background") &&
        nextAppState === "active"
      ) {
        void maybePromptForUnlock();
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [pathname, token]);

  return null;
};

export default function RootLayout() {
  const stripePublishableKey = (
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
  ).trim();

  React.useEffect(() => {
    const syncSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("app_language");
        if (
          savedLanguage === "en" ||
          savedLanguage === "he" ||
          savedLanguage === "hi"
        ) {
          syncRTLForLanguage(savedLanguage);
          store.dispatch(setLanguage(savedLanguage));
        }
      } catch (error) {
        console.warn("Failed to restore saved language.", error);
      }
    };

    syncSavedLanguage();
  }, []);

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {
        // Ignore splash hide race conditions during fast refresh.
      });
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StripeProvider
          publishableKey={stripePublishableKey}
          merchantIdentifier="merchant.com.yozietranceapp"
          urlScheme="yozietranceapp"
        >
          <AuthSync />
          <BiometricAppLock />
          <SocketProvider>
            <CountryModalProvider>
              <AppNavigator />
            </CountryModalProvider>
          </SocketProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
