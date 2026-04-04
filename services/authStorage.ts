import AsyncStorage from "@react-native-async-storage/async-storage";

type AvailableProfiles = {
  buyer?: boolean;
  vendor?: boolean;
} | null | undefined;

type PersistAuthPayload = {
  accessToken: string;
  refreshToken?: string | null;
  user?: any;
  availableProfiles?: AvailableProfiles;
};

const AVAILABLE_PROFILES_KEY = "availableProfiles";
const AUTH_KEYS = ["accessToken", "refreshToken", "user", "userRole", AVAILABLE_PROFILES_KEY] as const;

export const persistAuthState = async ({
  accessToken,
  refreshToken,
  user,
  availableProfiles,
}: PersistAuthPayload) => {
  const userRole = String(user?.userType || user?.role || "").toLowerCase();
  const writes: [string, string][] = [
    ["accessToken", accessToken],
  ];

  if (refreshToken) {
    writes.push(["refreshToken", refreshToken]);
  }

  if (userRole) {
    writes.push(["userRole", userRole]);
  }

  if (availableProfiles) {
    writes.push([AVAILABLE_PROFILES_KEY, JSON.stringify(availableProfiles)]);
  }

  await AsyncStorage.multiSet(writes);

  if (!refreshToken) {
    await AsyncStorage.removeItem("refreshToken");
  }

  if (!availableProfiles) {
    await AsyncStorage.removeItem(AVAILABLE_PROFILES_KEY);
  }

  // We intentionally do not persist the full user object anymore.
  await AsyncStorage.removeItem("user");
};

export const loadPersistedAuthState = async () => {
  const [[, accessToken], [, refreshToken], [, userRole]] = await AsyncStorage.multiGet([
    "accessToken",
    "refreshToken",
    "userRole",
  ]);
  const availableProfiles = await loadAvailableProfiles();

  if (!accessToken) {
    await clearPersistedAuthState();
    return null;
  }

  return {
    accessToken,
    refreshToken: refreshToken || null,
    userRole: userRole || "",
    availableProfiles,
  };
};

export const clearPersistedAuthState = async () => {
  await AsyncStorage.multiRemove([...AUTH_KEYS]);
};

export const loadAvailableProfiles = async () => {
  const raw = await AsyncStorage.getItem(AVAILABLE_PROFILES_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      buyer: !!parsed.buyer,
      vendor: !!parsed.vendor,
    };
  } catch {
    return null;
  }
};
