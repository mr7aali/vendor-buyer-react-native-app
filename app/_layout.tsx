import { useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { View } from "react-native";
import "react-native-reanimated";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { Provider, useSelector } from "react-redux";
import { getLayoutDirection, syncRTLForLanguage } from "../constants/rtl";
import { SocketProvider } from "../context/SocketContext";
import { loadPersistedAuthState, persistAuthState } from "../services/authStorage";
import {
  registerForPushNotificationsAsync,
  syncPushTokenToBackend,
} from "../services/pushNotifications";
import { useGetProfileQuery } from "../store/api/authApiSlice";
import { setCredentials } from "../store/slices/authSlice";
import { selectLanguage, setLanguage } from "../store/slices/languageSlice";
import { RootState, store } from "../store/store";
import "./global.css";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if the splash screen is already controlled elsewhere.
});

const APP_BACKGROUND_COLOR = "#F8FAF9";

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
      <Stack key={isRTL ? "rtl" : "ltr"} initialRouteName="(onboarding)">
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

export default function RootLayout() {
  const [isReady, setIsReady] = React.useState(false);
  const stripePublishableKey = (
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
  ).trim();

  // Startup auth routing logic
  React.useEffect(() => {
    const checkLogin = async () => {
      let shouldRedirect = false;
      let targetPath = "/(onboarding)";

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

        const persistedAuth = await loadPersistedAuthState();

        if (persistedAuth) {
          store.dispatch(
            setCredentials({
              user: null,
              accessToken: persistedAuth.accessToken,
              refreshToken: persistedAuth.refreshToken || "",
              availableProfiles: persistedAuth.availableProfiles,
            }),
          );

          const detectedRole = String(persistedAuth.userRole || "").toLowerCase();

          targetPath =
            detectedRole === "vendor"
              ? "/(tabs)"
              : detectedRole === "buyer"
                ? "/(users)"
                : "/(onboarding)";
        } else {
          // Not logged in -> onboarding/auth flow
          targetPath = "/(onboarding)";
        }

        shouldRedirect = true;
      } catch (e) {
        console.error("Auto-login failed:", e);
      } finally {
        setIsReady(true);
        if (shouldRedirect && targetPath !== "/(onboarding)") {
          router.replace(targetPath as any);
        }
      }
    };

    checkLogin();
  }, []);

  React.useEffect(() => {
    if (!isReady) return;

    SplashScreen.hideAsync().catch(() => {
      // Ignore splash hide race conditions during fast refresh.
    });
  }, [isReady]);

  return (
    <Provider store={store}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StripeProvider
          publishableKey={stripePublishableKey}
          merchantIdentifier="merchant.com.yozietranceapp"
          urlScheme="yozietranceapp"
        >
          <AuthSync />
          <SocketProvider>
            <AppNavigator />
          </SocketProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
