import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo-modules-core";

const LOGIN_CREDENTIALS_KEY = "savedLoginCredentials";
const LOGIN_PREFERENCES_KEY = "savedLoginPreferences";

const AUTHENTICATION_TYPE_FINGERPRINT = 1;
const AUTHENTICATION_TYPE_FACIAL_RECOGNITION = 2;
const AUTHENTICATION_TYPE_IRIS = 3;

type LocalAuthenticationNativeModule = {
  hasHardwareAsync?: () => Promise<boolean>;
  isEnrolledAsync?: () => Promise<boolean>;
  supportedAuthenticationTypesAsync?: () => Promise<number[]>;
  authenticateAsync?: (options: {
    promptMessage: string;
    cancelLabel: string;
    disableDeviceFallback: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
};

type SecureStoreNativeModule = {
  getValueWithKeyAsync?: (key: string, options?: Record<string, unknown>) => Promise<string | null>;
  setValueWithKeyAsync?: (
    value: string,
    key: string,
    options?: Record<string, unknown>,
  ) => Promise<void>;
  deleteValueWithKeyAsync?: (key: string, options?: Record<string, unknown>) => Promise<void>;
};

export type SavedLoginCredentials = {
  identifier: string;
  password: string;
};

export type BiometricLoginState = {
  biometricSupported: boolean;
  biometricEnrolled: boolean;
  biometricTypeLabel: string;
  biometricEnabled: boolean;
  savedCredentials: SavedLoginCredentials | null;
};

export type BiometricPromptResult =
  | { success: true; credentials: SavedLoginCredentials }
  | {
      success: false;
      reason:
        | "not_supported"
        | "not_enrolled"
        | "authentication_failed"
        | "user_cancelled"
        | "credentials_missing";
    };

export type EnableBiometricResult =
  | { success: true }
  | {
      success: false;
      reason: "not_supported" | "not_enrolled" | "credentials_missing";
    };

const getLocalAuthenticationModule = (): LocalAuthenticationNativeModule | null => {
  try {
    return requireOptionalNativeModule<LocalAuthenticationNativeModule>("ExpoLocalAuthentication");
  } catch {
    return null;
  }
};

const getSecureStoreModule = (): SecureStoreNativeModule | null => {
  try {
    return requireOptionalNativeModule<SecureStoreNativeModule>("ExpoSecureStore");
  } catch {
    return null;
  }
};

const SECURE_STORE_OPTIONS: Record<string, unknown> = {};

const parseSavedCredentials = (raw: string | null): SavedLoginCredentials | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.identifier || !parsed?.password) return null;

    return {
      identifier: String(parsed.identifier),
      password: String(parsed.password),
    };
  } catch {
    return null;
  }
};

const parseBiometricEnabled = (raw: string | null) => {
  if (!raw) return false;

  try {
    return !!JSON.parse(raw)?.biometricEnabled;
  } catch {
    return false;
  }
};

const getBiometricTypeLabel = async (localAuth: LocalAuthenticationNativeModule | null) => {
  if (!localAuth?.supportedAuthenticationTypesAsync) {
    return "Fingerprint";
  }

  const supportedTypes = await localAuth.supportedAuthenticationTypesAsync();

  if (supportedTypes.includes(AUTHENTICATION_TYPE_FINGERPRINT)) {
    return "Fingerprint";
  }

  if (supportedTypes.includes(AUTHENTICATION_TYPE_FACIAL_RECOGNITION)) {
    return "Face ID";
  }

  if (supportedTypes.includes(AUTHENTICATION_TYPE_IRIS)) {
    return "Iris";
  }

  return "Biometric";
};

export const maskLoginIdentifier = (identifier: string) => {
  const value = String(identifier || "").trim();
  if (!value) return "";

  if (value.includes("@")) {
    const [name, domain] = value.split("@");
    const visible =
      name.length <= 2 ? name : `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 1))}`;
    return `${visible}@${domain}`;
  }

  if (value.length <= 4) {
    return "*".repeat(value.length);
  }

  return `${value.slice(0, 2)}${"*".repeat(Math.max(value.length - 4, 1))}${value.slice(-2)}`;
};

export const getBiometricLoginState = async (): Promise<BiometricLoginState> => {
  const localAuth = getLocalAuthenticationModule();
  const secureStore = getSecureStoreModule();

  const [storedPreferences, storedCredentials] = await Promise.all([
    AsyncStorage.getItem(LOGIN_PREFERENCES_KEY),
    secureStore?.getValueWithKeyAsync
      ? secureStore.getValueWithKeyAsync(LOGIN_CREDENTIALS_KEY, SECURE_STORE_OPTIONS)
      : Promise.resolve(null),
  ]);

  const savedCredentials = parseSavedCredentials(storedCredentials);
  const biometricEnabled = parseBiometricEnabled(storedPreferences);

  if (!localAuth?.hasHardwareAsync || !localAuth.isEnrolledAsync) {
    return {
      biometricSupported: false,
      biometricEnrolled: false,
      biometricTypeLabel: "Fingerprint",
      biometricEnabled: false,
      savedCredentials,
    };
  }

  const [biometricSupported, biometricEnrolled, biometricTypeLabel] = await Promise.all([
    localAuth.hasHardwareAsync(),
    localAuth.isEnrolledAsync(),
    getBiometricTypeLabel(localAuth),
  ]);

  return {
    biometricSupported,
    biometricEnrolled,
    biometricTypeLabel,
    biometricEnabled: biometricEnabled && biometricSupported && biometricEnrolled,
    savedCredentials,
  };
};

export const saveRememberedLogin = async ({
  identifier,
  password,
  biometricEnabled,
}: {
  identifier: string;
  password: string;
  biometricEnabled: boolean;
}) => {
  const secureStore = getSecureStoreModule();

  await AsyncStorage.setItem(
    LOGIN_PREFERENCES_KEY,
    JSON.stringify({
      biometricEnabled,
    }),
  );

  if (!secureStore?.setValueWithKeyAsync) {
    return;
  }

  await secureStore.setValueWithKeyAsync(
    JSON.stringify({
      identifier: String(identifier || "").trim(),
      password: String(password || ""),
    }),
    LOGIN_CREDENTIALS_KEY,
    SECURE_STORE_OPTIONS,
  );
};

export const disableBiometricLogin = async () => {
  await AsyncStorage.setItem(
    LOGIN_PREFERENCES_KEY,
    JSON.stringify({
      biometricEnabled: false,
    }),
  );
};

export const enableBiometricLogin = async (): Promise<EnableBiometricResult> => {
  const localAuth = getLocalAuthenticationModule();
  const secureStore = getSecureStoreModule();

  if (
    !localAuth?.hasHardwareAsync ||
    !localAuth.isEnrolledAsync ||
    !secureStore?.getValueWithKeyAsync
  ) {
    return { success: false, reason: "not_supported" };
  }

  const [biometricSupported, biometricEnrolled, storedCredentials] = await Promise.all([
    localAuth.hasHardwareAsync(),
    localAuth.isEnrolledAsync(),
    secureStore.getValueWithKeyAsync(LOGIN_CREDENTIALS_KEY, SECURE_STORE_OPTIONS),
  ]);

  if (!biometricSupported) {
    return { success: false, reason: "not_supported" };
  }

  if (!biometricEnrolled) {
    return { success: false, reason: "not_enrolled" };
  }

  if (!parseSavedCredentials(storedCredentials)) {
    return { success: false, reason: "credentials_missing" };
  }

  await AsyncStorage.setItem(
    LOGIN_PREFERENCES_KEY,
    JSON.stringify({
      biometricEnabled: true,
    }),
  );

  return { success: true };
};

export const clearRememberedLogin = async () => {
  const secureStore = getSecureStoreModule();

  await AsyncStorage.removeItem(LOGIN_PREFERENCES_KEY);

  if (!secureStore?.deleteValueWithKeyAsync) {
    return;
  }

  await secureStore.deleteValueWithKeyAsync(
    LOGIN_CREDENTIALS_KEY,
    SECURE_STORE_OPTIONS,
  );
};

export const promptBiometricUnlock = async (
  promptMessage?: string,
): Promise<BiometricPromptResult> => {
  const localAuth = getLocalAuthenticationModule();
  const secureStore = getSecureStoreModule();

  if (
    !localAuth?.hasHardwareAsync ||
    !localAuth.isEnrolledAsync ||
    !localAuth.authenticateAsync ||
    !secureStore?.getValueWithKeyAsync
  ) {
    return { success: false, reason: "not_supported" };
  }

  const [biometricSupported, biometricEnrolled] = await Promise.all([
    localAuth.hasHardwareAsync(),
    localAuth.isEnrolledAsync(),
  ]);

  if (!biometricSupported) {
    return { success: false, reason: "not_supported" };
  }

  if (!biometricEnrolled) {
    return { success: false, reason: "not_enrolled" };
  }

  const result = await localAuth.authenticateAsync({
    promptMessage: promptMessage || "Authenticate to continue",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });

  if (!result.success) {
    const error = String(result?.error || "").toLowerCase();
    const userCancelledErrors = ["user_cancel", "app_cancel", "system_cancel", "user_fallback"];

    if (userCancelledErrors.some((value) => error.includes(value))) {
      return { success: false, reason: "user_cancelled" };
    }

    return { success: false, reason: "authentication_failed" };
  }

  const credentials = parseSavedCredentials(
    await secureStore.getValueWithKeyAsync(
      LOGIN_CREDENTIALS_KEY,
      SECURE_STORE_OPTIONS,
    ),
  );

  if (!credentials) {
    return { success: false, reason: "credentials_missing" };
  }

  return {
    success: true,
    credentials,
  };
};
