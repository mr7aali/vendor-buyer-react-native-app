import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from "expo-router";
import React from 'react';
import "react-native-reanimated";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Provider, useSelector } from 'react-redux';
import { View } from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { SocketProvider } from "../context/SocketContext";
import { getLayoutDirection, syncRTLForLanguage } from "../constants/rtl";
import { registerForPushNotificationsAsync, syncPushTokenToBackend } from "../services/pushNotifications";
import { useGetProfileQuery } from "../store/api/authApiSlice";
import { setCredentials } from '../store/slices/authSlice';
import { selectLanguage, setLanguage } from '../store/slices/languageSlice';
import { RootState, store } from '../store/store';
import "./global.css";

const AuthSync = () => {
  const dispatch = store.dispatch;
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const refreshToken = useSelector((state: RootState) => state.auth.refreshToken);
  const syncedPushTokenRef = React.useRef<string | null>(null);

  const { data: profileData } = useGetProfileQuery(undefined, {
    skip: !token
  });

  React.useEffect(() => {
    if (profileData?.data && token) {
      const resolvedUserId = profileData.data.userId || profileData.data.vendor?.userId || profileData.data.buyer?.userId || profileData.data.id;
      const updatedUser = { ...user, ...profileData.data, userId: resolvedUserId || user?.userId };
      const currentUserJson = JSON.stringify(user || {});
      const updatedUserJson = JSON.stringify(updatedUser || {});

      if (currentUserJson === updatedUserJson) return;

      console.log('Syncing profile data into auth state');
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      dispatch(setCredentials({
        user: updatedUser,
        accessToken: token,
        refreshToken: refreshToken || ''
      }));
    }
  }, [profileData, token, refreshToken, dispatch, user]);

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
    <View style={{ flex: 1, direction: isRTL ? "rtl" : "ltr" }}>
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
  const stripePublishableKey = (process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').trim();

  // Startup auth routing logic
  React.useEffect(() => {
    const checkLogin = async () => {
      let shouldRedirect = false;
      let targetPath = "/(onboarding)";

      try {
        const savedLanguage = await AsyncStorage.getItem("app_language");
        if (savedLanguage === "en" || savedLanguage === "he" || savedLanguage === "hi") {
          syncRTLForLanguage(savedLanguage);
          store.dispatch(setLanguage(savedLanguage));
        }

        const accessToken = await AsyncStorage.getItem("accessToken");
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        const rawUser = await AsyncStorage.getItem("user");
        const storedRole = (await AsyncStorage.getItem("userRole")) || "";

        let parsedUser: any = null;
        if (rawUser) {
          try {
            parsedUser = JSON.parse(rawUser);
          } catch {
            parsedUser = null;
          }
        }

        if (accessToken && parsedUser) {
          store.dispatch(
            setCredentials({
              user: parsedUser,
              accessToken,
              refreshToken: refreshToken || "",
            })
          );

          const detectedRole = String(
            parsedUser?.userType ||
            parsedUser?.role ||
            storedRole ||
            (parsedUser?.vendor ? "vendor" : parsedUser?.buyer ? "buyer" : "")
          ).toLowerCase();

          targetPath = detectedRole === "vendor" ? "/(tabs)" : "/(users)";
        } else {
          // Not logged in -> onboarding/auth flow
          targetPath = "/(onboarding)";
        }

        shouldRedirect = true;
      } catch (e) {
        console.error('Auto-login failed:', e);
      } finally {
        setIsReady(true);
        // Delay redirect slightly so navigator is mounted before route change.
        if (shouldRedirect && targetPath !== "/(onboarding)") {
          setTimeout(() => {
            router.replace(targetPath as any);
          }, 500);
        }
      }
    };

    checkLogin();
  }, []);

  if (!isReady) {
    return null; // Or return a custom loading component/splash screen
  }

  return (
    <Provider store={store}>
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
    </Provider >
  );
}
