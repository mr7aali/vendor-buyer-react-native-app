import { useConnectToVendorMutation } from "@/store/api/connectionApiSlice";
import { useTranslation } from "@/hooks/use-translation";
import { router } from "expo-router";
import { ChevronLeft, Search } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const normalizeVendorCode = (rawCode: string) => {
  const trimmed = String(rawCode || "").trim();
  if (!trimmed) return "";

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "string") return normalizeVendorCode(parsed);
    if (parsed?.vendorCode) return normalizeVendorCode(parsed.vendorCode);
    if (parsed?.code) return normalizeVendorCode(parsed.code);
    if (parsed?.url) return normalizeVendorCode(parsed.url);
  } catch {
    // Continue as plain text.
  }

  const withoutQuery = trimmed.split("?")[0].split("#")[0];
  const normalized = withoutQuery
    .replace(/^https?:\/\/[^/]+\/v\//i, "")
    .replace(/^https?:\/\/[^/]+\/v\./i, "")
    .replace(/^yozietranceapp:\/\/v\//i, "")
    .replace(/^v\//i, "")
    .replace(/^v\./i, "")
    .replace(/^[./]+/, "");

  return normalized.split("/").filter(Boolean).pop() || normalized;
};

const buildVendorCodeCandidates = (rawCode: string) => {
  const raw = String(rawCode || "").trim();
  const normalized = normalizeVendorCode(raw);
  const decoded = normalized ? decodeURIComponent(normalized) : "";

  return Array.from(
    new Set(
      [normalized, decoded, raw, raw.toUpperCase(), raw.toLowerCase(), decoded.toUpperCase(), decoded.toLowerCase()]
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
};

const resolveChatVendor = (response: any) => {
  const vendor =
    response?.data?.vendor ||
    response?.vendor ||
    response?.connection?.vendor ||
    response?.data?.vendorId ||
    response?.connection?.vendorId ||
    {};

  const partnerId =
    vendor?.userId ||
    vendor?.vendor?.userId ||
    vendor?._id ||
    vendor?.id ||
    response?.data?.vendorUserId ||
    response?.data?.vendorId?.userId ||
    response?.data?.vendorId?._id ||
    response?.data?.vendorId?.id ||
    "";

  const name =
    vendor?.storename ||
    vendor?.businessName ||
    vendor?.fullName ||
    vendor?.name ||
    "";

  return {
    partnerId: String(partnerId || ""),
    name,
  };
};

export default function ManualVendorSearchScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");
  const [connectToVendor, { isLoading }] = useConnectToVendorMutation();

  const handleSearch = async () => {
    const candidates = buildVendorCodeCandidates(query);

    if (!candidates.length) {
      Alert.alert(
        t("error", "Error"),
        t("manual_search_enter_vendor_code", "Please enter a vendor code or name."),
      );
      return;
    }

    try {
      let response: any = null;
      let lastError: any = null;

      for (const candidate of candidates) {
        try {
          response = await connectToVendor({ vendorCode: candidate }).unwrap();
          break;
        } catch (error: any) {
          lastError = error;
          if (error?.status && error.status !== 404) {
            throw error;
          }
        }
      }

      if (!response) {
        throw lastError || new Error(t("scan_failed_connect_qr", "Failed to connect via QR code"));
      }

      const resolvedVendor = resolveChatVendor(response);
      if (!resolvedVendor.partnerId) {
        throw new Error(t("scan_failed_connect_qr", "Failed to connect via QR code"));
      }

      router.replace({
        pathname: "/(screens)/chat_box",
        params: {
          role: "buyer",
          partnerId: resolvedVendor.partnerId,
          conversationId: resolvedVendor.partnerId,
          name: resolvedVendor.name || t("scan_vendor", "Vendor"),
        },
      });
    } catch (error: any) {
      console.error("Manual vendor search failed:", error);
      Alert.alert(
        t("error", "Error"),
        error?.data?.message || t("scan_failed_connect_qr", "Failed to connect via QR code"),
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#2D2D2D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("search", "Search")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchBox}>
        <Search size={22} color="#2E2E2E" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={t("manual_search_placeholder", "Search by name or vendor code")}
          placeholderTextColor="#9B9B9B"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color="#2A8B8B" />
          <Text style={styles.loadingText}>{t("search", "Search")}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAF8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backButton: {
    width: 32,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D2D2D",
  },
  headerSpacer: {
    width: 32,
  },
  searchBox: {
    marginHorizontal: 18,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E4E4",
    minHeight: 54,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1F1F1F",
  },
  loadingState: {
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: "#6F6F6F",
  },
});
