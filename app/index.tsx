import { useAppDispatch } from "@/store/hooks";
import { buildApiUrl } from "@/services/apiConfig";
import {
  clearPersistedAuthState,
  loadPersistedAuthState,
  persistAuthState,
} from "@/services/authStorage";
import { logOut, setCredentials } from "@/store/slices/authSlice";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

const resolveRouteFromRole = (role: unknown) => {
  const normalizedRole = String(role || "").toLowerCase();

  if (normalizedRole === "vendor") return "/(tabs)";
  if (normalizedRole === "buyer") return "/(users)";
  return "/(onboarding)";
};

export default function AppIndex() {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    let isMounted = true;

    const bootstrapApp = async () => {
      try {
        const persistedAuth = await loadPersistedAuthState();

        if (!persistedAuth?.accessToken) {
          if (isMounted) {
            router.replace("/(onboarding)");
          }
          return;
        }

        dispatch(
          setCredentials({
            user: null,
            accessToken: persistedAuth.accessToken,
            refreshToken: persistedAuth.refreshToken || "",
            availableProfiles: persistedAuth.availableProfiles,
          }),
        );

        const profileUrl = buildApiUrl("/auth/me?profile=true");
        const canValidateSession = /^https?:\/\//i.test(profileUrl);

        if (!canValidateSession) {
          if (isMounted) {
            router.replace(resolveRouteFromRole(persistedAuth.userRole) as any);
          }
          return;
        }

        const response = await fetch(profileUrl, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${persistedAuth.accessToken}`,
          },
        });

        if (!response.ok) {
          await clearPersistedAuthState();
          dispatch(logOut());

          if (isMounted) {
            router.replace("/(onboarding)");
          }
          return;
        }

        const payload = await response.json();
        const profile = payload?.data ?? payload;
        const resolvedRole =
          profile?.userType || profile?.role || persistedAuth.userRole || "";

        dispatch(
          setCredentials({
            user: profile,
            accessToken: persistedAuth.accessToken,
            refreshToken: persistedAuth.refreshToken || "",
            availableProfiles: persistedAuth.availableProfiles,
          }),
        );

        await persistAuthState({
          accessToken: persistedAuth.accessToken,
          refreshToken: persistedAuth.refreshToken,
          user: profile,
          availableProfiles: persistedAuth.availableProfiles,
        });

        if (isMounted) {
          router.replace(resolveRouteFromRole(resolvedRole) as any);
        }
      } catch (error) {
        console.error("App bootstrap failed:", error);
        await clearPersistedAuthState();
        dispatch(logOut());

        if (isMounted) {
          router.replace("/(onboarding)");
        }
      }
    };

    bootstrapApp();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAF9",
      }}
    >
      <ActivityIndicator size="large" color="#2A8B8B" />
    </View>
  );
}
