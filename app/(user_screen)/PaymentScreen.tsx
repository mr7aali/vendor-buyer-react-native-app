import { useGetCartQuery, useRemoveFromCartMutation } from "@/store/api/cartApiSlice";
import { useCreateOrderMutation } from "@/store/api/orderApiSlice";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CardDetailsScreen: React.FC = () => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("card");
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();
  const { data: cartData } = useGetCartQuery();
  const [removeFromCart] = useRemoveFromCartMutation();

  const handleConfirm = async () => {
    const rawItems = cartData?.data?.items || cartData?.items || (Array.isArray(cartData) ? cartData : []);
    if (rawItems.length === 0) {
      Alert.alert("Error", "Your cart is empty");
      return;
    }

    try {
      // Group items by vendorId
      const vendors = [...new Set(rawItems.map((item: any) => item.productId?.vendorId || item.productId?.vendor))];

      for (const vendorId of vendors) {
        if (!vendorId) continue;

        const vendorItems = rawItems.filter((item: any) => (item.productId?.vendorId || item.productId?.vendor) === vendorId);
        const orderData = {
          vendorId,
          orderItems: vendorItems.map((item: any) => ({
            product: item.productId?._id || item.productId?.id || item.productId,
            quantity: item.quantity,
            price: item.productId?.price || item.price || 0
          })),
          shippingAddress: "Default Shipping Address", // This should ideally come from Information.tsx
          totalPrice: vendorItems.reduce((acc: number, item: any) => acc + (item.productId?.price || item.price || 0) * item.quantity, 0),
        };
        await createOrder(orderData).unwrap();

        // Remove items from cart after successful order
        for (const item of vendorItems) {
          await removeFromCart(item._id || item.id).unwrap();
        }
      }

      router.replace("/(user_screen)/OrderAcceptedScreen");
    } catch (err: any) {
      Alert.alert("Error", err?.data?.message || "Failed to place order");
    }
  };

  // ১. Card Form Content
  const renderCardForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Card number</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="43 837 8398 787"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <View style={styles.cardLogos}>
            <FontAwesome5
              name="cc-visa"
              size={20}
              color="#1A1F71"
              style={{ marginRight: 5 }}
            />
            <FontAwesome5 name="cc-mastercard" size={20} color="#EB001B" />
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Expiration Date</Text>
        <TextInput
          style={styles.input}
          placeholder="MM/YY"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Security Code</Text>
        <TextInput
          style={styles.input}
          placeholder="CVC"
          keyboardType="numeric"
          secureTextEntry
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );

  const renderIdealContent = () => (
    <View style={styles.infoBox}>
      <MaterialCommunityIcons name="bank" size={40} color="#2A8383" />
      <Text style={styles.infoTitle}>Pay with iDEAL</Text>
      <Text style={styles.infoSubtitle}>
        You will be redirected to your bank s website to complete the payment
        safely.
      </Text>
      <TouchableOpacity style={styles.bankSelector}>
        <Text style={styles.bankSelectorText}>Select Your Bank</Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderBancontactContent = () => (
    <View style={styles.infoBox}>
      <Ionicons name="qr-code-outline" size={40} color="#2A8383" />
      <Text style={styles.infoTitle}>Bancontact Mobile</Text>
      <Text style={styles.infoSubtitle}>
        Open your Bancontact or banking app to scan the QR code and confirm the
        payment.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionLabel}>Choose a Payment Method</Text>

          {/* Dynamic Tabs Row */}
          <View style={styles.tabRow}>
            {/* Card Tab */}
            <TouchableOpacity
              style={[styles.tabBox, activeTab === "card" && styles.activeTab]}
              onPress={() => setActiveTab("card")}
            >
              <Ionicons
                name="card"
                size={22}
                color={activeTab === "card" ? "#2A8383" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "card" && styles.activeTabText,
                ]}
              >
                Card
              </Text>
            </TouchableOpacity>

            {/* iDEAL Tab */}
            <TouchableOpacity
              style={[styles.tabBox, activeTab === "ideal" && styles.activeTab]}
              onPress={() => setActiveTab("ideal")}
            >
              <MaterialCommunityIcons
                name="alpha-i-circle"
                size={22}
                color={activeTab === "ideal" ? "#2A8383" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "ideal" && styles.activeTabText,
                ]}
              >
                iDEAL
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBox,
                activeTab === "bancontact" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("bancontact")}
            >
              <MaterialCommunityIcons
                name="alpha-b-circle"
                size={22}
                color={activeTab === "bancontact" ? "#2A8383" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "bancontact" && styles.activeTabText,
                ]}
              >
                bancontact
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dynamicContent}>
            {activeTab === "card" && renderCardForm()}
            {activeTab === "ideal" && renderIdealContent()}
            {activeTab === "bancontact" && renderBancontactContent()}
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, isCreating && { opacity: 0.7 }]}
            onPress={handleConfirm}
            disabled={isCreating}
          >
            {isCreating ? <ActivityIndicator color="white" /> : <Text style={styles.confirmBtnText}>Confirm</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FBF9" },
  header: {
    direction: 'ltr',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  content: { padding: 20 },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 15,
    color: "#444",
  },

  tabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  tabBox: {
    width: "31%",
    height: 65,
    backgroundColor: "#FFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeTab: {
    borderColor: "#2A8383",
    backgroundColor: "#F0F9F9",
    elevation: 2,
  },
  tabText: { fontSize: 11, color: "#666", marginTop: 4, fontWeight: "500" },
  activeTabText: { color: "#2A8383", fontWeight: "bold" },

  dynamicContent: { minHeight: 250 },
  formContainer: { marginTop: 10 },
  formGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
  },
  inputWrapper: { position: "relative", justifyContent: "center" },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: "#333",
  },
  cardLogos: { position: "absolute", right: 15, flexDirection: "row" },

  infoBox: {
    backgroundColor: "#FFF",
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  infoTitle: { fontSize: 18, fontWeight: "bold", marginTop: 15, color: "#333" },
  infoSubtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  bankSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
    marginTop: 25,
    paddingBottom: 10,
  },
  bankSelectorText: { color: "#444", fontSize: 14 },

  confirmBtn: {
    backgroundColor: "#00796B",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
  },
  confirmBtnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});

export default CardDetailsScreen;
