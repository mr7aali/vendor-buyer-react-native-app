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

const VendorModal: React.FC<VendorModalProps> = ({
  isVisible,
  onClose,
  onConnect,
}) => {
  const [vendorCode, setVendorCode] = useState("");
  const [connectToVendor, { isLoading }] = useConnectToVendorMutation();

  const handleConnect = async () => {
    if (!vendorCode) {
      alert("Please enter a vendor code");
      return;
    }

    try {
      const res = await connectToVendor({ vendorCode }).unwrap();
      // alert("Connected successfully!"); // Optional: Feedback is good
      onConnect(vendorCode);
      onClose();
      // Navigate to ChatDetailsScreen with vendor details from response
      // Assuming res contains the vendor object or connection object with vendor details
      // Adjust based on actual API response. For now, assuming res.vendor
      const vendor = res.vendor || res.connection?.vendor || {};

      router.push({
        pathname: "/(screens)/chat_box",
        params: {
          role: "buyer",
          partnerId: vendor.userId || vendor.id || res.id,
          conversationId: vendor.userId || vendor.id || res.id,
          name: vendor.businessName || vendor.name || 'Vendor'
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
