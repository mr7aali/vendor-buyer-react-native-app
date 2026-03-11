import { useConnectToVendorMutation } from "@/store/api/connectionApiSlice";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface VendorModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConnect: (code: string) => void;
}

const normalizeVendorCode = (rawCode: string) => {
  const trimmed = String(rawCode || "").trim();
  if (!trimmed) return "";

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "string") {
      return normalizeVendorCode(parsed);
    }
    if (parsed?.vendorCode) {
      return normalizeVendorCode(parsed.vendorCode);
    }
    if (parsed?.code) {
      return normalizeVendorCode(parsed.code);
    }
    if (parsed?.url) {
      return normalizeVendorCode(parsed.url);
    }
  } catch {
    // Not JSON, continue with string parsing.
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

const VendorModal: React.FC<VendorModalProps> = ({
  isVisible,
  onClose,
  onConnect,
}) => {
  const [vendorCode, setVendorCode] = useState("");
  const [connectToVendor, { isLoading }] = useConnectToVendorMutation();

  const handleConnect = async () => {
    const vendorCodeCandidates = buildVendorCodeCandidates(vendorCode);

    if (!vendorCodeCandidates.length) {
      alert("Please enter a vendor code");
      return;
    }

    try {
      let res: any = null;
      let lastError: any = null;

      for (const candidate of vendorCodeCandidates) {
        try {
          res = await connectToVendor({ vendorCode: candidate }).unwrap();
          onConnect(candidate);
          break;
        } catch (error: any) {
          lastError = error;
          if (error?.status && error.status !== 404) {
            throw error;
          }
        }
      }

      if (!res) {
        throw lastError || new Error("Failed to connect to vendor");
      }

      // alert("Connected successfully!"); // Optional: Feedback is good
      onClose();
      // Navigate to ChatDetailsScreen with vendor details from response
      // Assuming res contains the vendor object or connection object with vendor details
      // Adjust based on actual API response. For now, assuming res.vendor
      const resolvedVendor = resolveChatVendor(res);
      if (!resolvedVendor.partnerId) {
        throw new Error("Failed to connect to vendor");
      }

      router.push({
        pathname: "/(screens)/chat_box",
        params: {
          role: "buyer",
          partnerId: resolvedVendor.partnerId,
          conversationId: resolvedVendor.partnerId,
          name: resolvedVendor.name || "Vendor"
        }
      });
    } catch (err: any) {
      console.error("Connection error:", err);
      alert(err?.data?.message || "Failed to connect to vendor");
    }
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Enter Code</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Enter your vendor code"
            placeholderTextColor="#A9A9A9"
            value={vendorCode}
            onChangeText={setVendorCode}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleConnect}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Connect to Vendor</Text>
            )}
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#F8FBF9",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    direction: 'ltr',
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4A4A4A",
  },
  closeIcon: {
    fontSize: 20,
    color: "#4A4A4A",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: "#F1F4F2",
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2D8686",
    height: 55,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
  },
});

export default VendorModal;
