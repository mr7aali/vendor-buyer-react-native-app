import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildApiUrl } from "@/services/apiConfig";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),


  
});

const rawPushTokenEndpoint = process.env.EXPO_PUBLIC_PUSH_TOKEN_ENDPOINT ?? "/notifications/fcm-token";
const pushTokenEndpoint = rawPushTokenEndpoint.trim();
const STORAGE_PUSH_TOKEN_KEY = "pushDeviceToken";

const buildEndpointUrl = () => {
  if (!pushTokenEndpoint) return "";
  if (/^https?:\/\//i.test(pushTokenEndpoint)) return pushTokenEndpoint;
  return buildApiUrl(pushTokenEndpoint);
};

export const registerForPushNotificationsAsync = async () => {
  try {
    if (!Device.isDevice) {
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#278687",
      });
    }

    const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn("Missing EAS projectId; push token registration skipped.");
      return null;
    }

    let expoPushToken: string | null = null;
    try {
      expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("[PushToken] Expo:", expoPushToken);
    } catch (error) {
      console.warn("Expo push token fetch failed.", error);
    }

    let nativePushToken: string | null = null;
    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      nativePushToken = typeof deviceToken.data === "string" ? deviceToken.data : null;
      console.log("[PushToken] Native:", nativePushToken);
    } catch (error) {
      console.warn("Native push token fetch failed.", error);
    }

    if (!expoPushToken && !nativePushToken) return null;

    return {
      expoPushToken,
      nativePushToken,
    };
  } catch (error) {
    console.warn("Push notification registration failed.", error);
    return null;
  }
};

type PushTokens = {
  expoPushToken: string | null;
  nativePushToken: string | null;
};

export const syncPushTokenToBackend = async (tokens: PushTokens, accessToken?: string | null) => {
  if (!accessToken) {
    console.warn("Push token sync skipped: missing access token.");
    return false;
  }
  if (!tokens?.expoPushToken && !tokens?.nativePushToken) {
    console.warn("Push token sync skipped: missing push tokens.");
    return false;
  }

  const endpointUrl = buildEndpointUrl();
  if (!endpointUrl) {
    console.warn("Push token sync skipped: missing endpoint URL.");
    return false;
  }

  try {
    const tokenToSend = tokens.nativePushToken || tokens.expoPushToken;
    if (!tokenToSend) {
      console.warn("Push token sync skipped: no token to send.");
      return false;
    }

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        token: tokenToSend,
      }),
    });

    if (!response.ok) {
      console.warn(`Push token sync failed with status ${response.status}.`);
      return false;
    }

    await AsyncStorage.setItem(STORAGE_PUSH_TOKEN_KEY, tokenToSend);
    console.log("[PushToken] Sync success:", endpointUrl);
    return true;
  } catch (error) {
    console.warn("Push token sync failed due to network/runtime error.", error);
    return false;
  }
};

export const unregisterPushTokenFromBackend = async (accessToken?: string | null) => {
  if (!accessToken) return false;

  const endpointUrl = buildEndpointUrl();
  if (!endpointUrl) return false;

  try {
    const savedToken = await AsyncStorage.getItem(STORAGE_PUSH_TOKEN_KEY);
    if (!savedToken) return true;

    const response = await fetch(endpointUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token: savedToken }),
    });

    if (!response.ok) {
      console.warn(`Push token delete failed with status ${response.status}.`);
      return false;
    }

    await AsyncStorage.removeItem(STORAGE_PUSH_TOKEN_KEY);
    return true;
  } catch (error) {
    console.warn("Push token delete failed.", error);
    return false;
  }
};
