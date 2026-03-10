import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OrderDetailScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resent Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.orderIdLabel}>Order #ORD-2025</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Processing</Text>
            </View>
          </View>
          <Text style={styles.orderDate}>
            Placed on: 24 Oct, 2025 • 10:30 AM
          </Text>
        </View>

        {/* Vendor Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Vendor Information</Text>
          <View style={styles.vendorRow}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
              }}
              style={styles.vendorImage}
            />
            <View style={styles.vendorText}>
              <Text style={styles.vendorName}>Alice Freeman Shop</Text>
              <Text style={styles.vendorAddress}>
                6391 Elgin St. Celina, Delaware
              </Text>
            </View>
            <TouchableOpacity style={styles.chatBtn}>
              <MaterialCommunityIcons
                name="chat-processing-outline"
                size={24}
                color="#2D8C8C"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          {[1, 2].map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemRow,
                index === 0 && {
                  borderBottomWidth: 1,
                  borderBottomColor: "#F0F0F0",
                  paddingBottom: 15,
                  marginBottom: 15,
                },
              ]}
            >
              <View>
                <Text style={styles.itemName}>Wireless Headphones G5</Text>
                <Text style={styles.itemQty}>Qty: 2 x $80.00</Text>
              </View>
              <Text style={styles.itemPrice}>$160.00</Text>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>$240.00</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>$19.00</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>$259.00</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAF9",
  },
  header: {
    direction: 'ltr',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: "#FFF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  backBtn: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: "#2D8C8C",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderIdLabel: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  orderDate: {
    color: "#E0F2F2",
    fontSize: 13,
  },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  vendorImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  vendorText: {
    flex: 1,
    marginLeft: 12,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  vendorAddress: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F9F9",
    justifyContent: "center",
    alignItems: "center",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  itemQty: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    color: "#777",
    fontSize: 14,
  },
  summaryValue: {
    color: "#333",
    fontWeight: "600",
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2D8C8C",
  },
  trackButton: {
    backgroundColor: "#2D8C8C",
    flexDirection: "row",
    height: 55,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  trackButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default OrderDetailScreen;
