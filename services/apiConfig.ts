import Constants from "expo-constants";
import * as Device from "expo-device";

const DEFAULT_API_PORT = "3000";
const LOOPBACK_HOSTS = new Set(["10.0.2.2", "127.0.0.1", "localhost"]);

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");
const normalizePath = (value: string) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const getEmbeddedApiUrl = () => {
  const expoConfigValue = (Constants.expoConfig?.extra as { apiUrl?: unknown } | undefined)?.apiUrl;
  if (typeof expoConfigValue === "string" && expoConfigValue.trim()) {
    return expoConfigValue;
  }

  const legacyManifestValue = (Constants as any)?.manifest?.extra?.apiUrl;
  if (typeof legacyManifestValue === "string" && legacyManifestValue.trim()) {
    return legacyManifestValue;
  }

  return "";
};

const getConfiguredApiUrl = () => {
  const envValue = String(process.env.EXPO_PUBLIC_API_URL ?? "").trim();
  if (envValue) {
    return envValue;
  }

  return String(getEmbeddedApiUrl() || "").trim();
};

const rawConfiguredApiUrl = normalizeBaseUrl(getConfiguredApiUrl());

const shouldUseLocalDevFallbacks = () =>
  __DEV__ && (!rawConfiguredApiUrl || isLoopbackUrl(rawConfiguredApiUrl));

const getScheme = (value: string) =>
  /^https:\/\//i.test(value) ? "https" : "http";

const getPort = (value: string) => {
  const match = value.match(/:(\d+)(?:\/|$)/);
  return match?.[1] || DEFAULT_API_PORT;
};

const extractHost = (value: string) => {
  const normalized = value.replace(/^\w+:\/\//, "").split("/")[0];
  if (!normalized) return "";
  if (normalized.startsWith("[")) {
    const closingBracketIndex = normalized.indexOf("]");
    return closingBracketIndex >= 0
      ? normalized.slice(1, closingBracketIndex)
      : normalized;
  }

  const lastColonIndex = normalized.lastIndexOf(":");
  return lastColonIndex >= 0 ? normalized.slice(0, lastColonIndex) : normalized;
};

const isLoopbackUrl = (value: string) => LOOPBACK_HOSTS.has(extractHost(value));

const getExpoDevHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.expoGoConfig as { debuggerHost?: string } | null)?.debuggerHost ||
    "";

  return extractHost(hostUri);
};

const getResolvedApiBaseUrl = () => {
  const expoDevHost = getExpoDevHost();
  const fallbackProtocol = getScheme(rawConfiguredApiUrl || "http://");
  const fallbackPort = getPort(rawConfiguredApiUrl);

  if (__DEV__ && Device.isDevice && expoDevHost) {
    if (!rawConfiguredApiUrl || isLoopbackUrl(rawConfiguredApiUrl)) {
      return `${fallbackProtocol}://${expoDevHost}:${fallbackPort}`;
    }
  }

  if (rawConfiguredApiUrl) {
    return rawConfiguredApiUrl;
  }

  if (__DEV__ && expoDevHost) {
    return `${fallbackProtocol}://${expoDevHost}:${fallbackPort}`;
  }

  return "";
};

export const apiBaseUrl = normalizeBaseUrl(getResolvedApiBaseUrl());

export const buildApiUrl = (path: string) => {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath) return apiBaseUrl;
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
  if (!apiBaseUrl) return normalizedPath;
  return `${apiBaseUrl}${normalizedPath}`;
};

export const buildApiCandidateUrls = (path: string) => {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath) {
    return apiBaseUrl ? [apiBaseUrl] : [];
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return [normalizedPath];
  }

  const prefixedPaths =
    normalizedPath === "/api" || normalizedPath.startsWith("/api/")
      ? [normalizedPath, normalizedPath.replace(/^\/api(?=\/|$)/, "") || "/"]
      : [normalizedPath, `/api${normalizedPath}`];

  const localFallbackProtocol = "http";
  const fallbackPort = getPort(rawConfiguredApiUrl);
  const expoDevHost = getExpoDevHost();
  const includeLocalFallbacks = shouldUseLocalDevFallbacks();
  const candidateBases = [
    apiBaseUrl,
    includeLocalFallbacks && expoDevHost
      ? `${localFallbackProtocol}://${expoDevHost}:${fallbackPort}`
      : "",
    includeLocalFallbacks ? `${localFallbackProtocol}://10.0.2.2:${fallbackPort}` : "",
    includeLocalFallbacks ? `${localFallbackProtocol}://127.0.0.1:${fallbackPort}` : "",
    includeLocalFallbacks ? `${localFallbackProtocol}://localhost:${fallbackPort}` : "",
  ].filter(Boolean);

  return Array.from(
    new Set(
      candidateBases.flatMap((baseUrl) =>
        prefixedPaths.map((candidatePath) => `${normalizeBaseUrl(baseUrl)}${candidatePath}`),
      ),
    ),
  );
};

export const resolveAbsoluteUrl = (value: unknown) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("file://") ||
    raw.startsWith("content://") ||
    raw.startsWith("data:")
  ) {
    return raw;
  }
  if (raw.startsWith("/") && apiBaseUrl) {
    return `${apiBaseUrl}${raw}`;
  }
  return raw;
};

if (__DEV__ && rawConfiguredApiUrl && apiBaseUrl && rawConfiguredApiUrl !== apiBaseUrl) {
  console.log(
    `[apiConfig] Using device-friendly API URL ${apiBaseUrl} instead of ${rawConfiguredApiUrl}`,
  );
}
