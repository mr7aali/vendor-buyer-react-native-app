import { useAppDispatch } from "@/store/hooks";
import { buildApiUrl } from "@/services/apiConfig";
import {
  clearPersistedAuthState,
  loadPersistedAuthState,
  persistAuthState,
} from "@/services/authStorage";
import { getBiometricLoginState } from "@/services/biometricAuth";
import { logOut, setCredentials } from "@/store/slices/authSlice";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

const parseJsonResponse = async (response: Response) => {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const extractAuthPayload = (payload: any) => payload?.data ?? payload;

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
        const biometricState = await getBiometricLoginState();

        if (
          biometricState.biometricSupported &&
          biometricState.biometricEnrolled &&
          biometricState.biometricEnabled &&
          biometricState.savedCredentials
        ) {
          if (isMounted) {
            router.replace("/(auth)/login");
          }
          return;
        }

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
        const fetchProfile = (accessToken: string) =>
          fetch(profileUrl, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          });
        const tryRefreshSession = async (refreshToken: string) => {
          const refreshUrl = buildApiUrl("/auth/refresh");
          if (!/^https?:\/\//i.test(refreshUrl)) {
            return null;
          }

          const refreshResponse = await fetch(refreshUrl, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (!refreshResponse.ok) {
            return null;
          }

          return extractAuthPayload(await parseJsonResponse(refreshResponse));
        };

        if (!canValidateSession) {
          if (isMounted) {
            router.replace(resolveRouteFromRole(persistedAuth.userRole) as any);
          }
          return;
        }

        let activeAccessToken = persistedAuth.accessToken;
        let activeRefreshToken = persistedAuth.refreshToken || null;
        let response = await fetchProfile(activeAccessToken);

        if (!response.ok && activeRefreshToken) {
          const refreshedSession = await tryRefreshSession(activeRefreshToken);

          if (refreshedSession?.accessToken) {
            activeAccessToken = refreshedSession.accessToken;
            activeRefreshToken =
              refreshedSession.refreshToken || activeRefreshToken;

            dispatch(
              setCredentials({
                user: null,
                accessToken: activeAccessToken,
                refreshToken: activeRefreshToken,
                availableProfiles: persistedAuth.availableProfiles,
              }),
            );

            response = await fetchProfile(activeAccessToken);
          }
        }

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
            accessToken: activeAccessToken,
            refreshToken: activeRefreshToken,
            availableProfiles: persistedAuth.availableProfiles,
          }),
        );

        await persistAuthState({
          accessToken: activeAccessToken,
          refreshToken: activeRefreshToken,
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
