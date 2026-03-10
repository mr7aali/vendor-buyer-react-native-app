import { useGetOrdersQuery } from "@/store/api/orderApiSlice";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DUMMY_ORDERS = [
  {
    id: "1",
    orderNo: "#ORD-2025",
    status: "Processing",
    price: 259.0,
    address: "6391 Elgin St. Celina, Delaware 10299",
    rating: "4.8 (1.2k)",
    customer: "Alice freeman",
    itemsInfo: "4 items • Wireless Headphones 3x...",
  },
  {
    id: "2",
    orderNo: "#ORD-2025",
    status: "Pending",
    price: 259.0,
    address: "6391 Elgin St. Celina, Delaware 10299",
    rating: "4.8 (1.2k)",
    customer: "Alice freeman",
    itemsInfo: "4 items • Wireless Headphones 3x...",
  },
];

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { data: ordersData, isLoading } = useGetOrdersQuery(undefined);

  const [activeTab, setActiveTab] = useState("Order History");

  const orders = ordersData || [];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Processing":
        return { bg: "#E8F2FF", text: "#2F80ED" };
      case "Pending":
        return { bg: "#FFF4E8", text: "#F2994A" };
      case "Delivered":
        return { bg: "#E8F9EE", text: "#27AE60" };
      case "Shipped":
        return { bg: "#F2E8FF", text: "#9B51E0" };
      case "Canceled":
        return { bg: "#FFE8E8", text: "#EB5757" };
      default:
        return { bg: "#F0F0F0", text: "#666" };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.topTabs}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "Catalog" && styles.tabActive]}
          onPress={() => {
            setActiveTab("Catalog");
            router.push("/(users)/categoriesScreen");
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Catalog" && styles.textActive,
            ]}
          >
            📦 View Catalog
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "Vendor Info" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("Vendor Info")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Vendor Info" && styles.textActive,
            ]}
          >
            Vendor Info
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "Order History" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("Order History")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Order History" && styles.textActive,
            ]}
          >
            Order History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <TextInput
          placeholder="Search order history..."
          style={styles.searchInput}
        />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2A8383" />
        </View>
      ) : (
        /* Orders List */
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() =>
                router.push({
                  pathname: "/(user_screen)/OrderDetails",
                  params: { id: item._id || item.id, status: item.status },
                })
              }
            >
              <View style={styles.cardHeader}>
                <Image
                  source={{
                    uri: item.orderItems?.[0]?.product?.images?.[0] || "https://via.placeholder.com/80",
                  }}
                  style={styles.productImg}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.orderNo}>#{item._id?.slice(-6) || item.id?.slice(-6)}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusStyle(item.status).bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusStyle(item.status).text },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.addressText} numberOfLines={1}>
                    {item.shippingAddress || "Default Shipping Address"}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FFB400" />
                    <Text style={styles.ratingText}>{item.vendor?.rating || "4.5"}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.customerName}>{item.vendor?.name || item.vendorId || "Vendor"}</Text>
                  <Text style={styles.itemDetailText}>{item.orderItems?.length || 0} item{item.orderItems?.length > 1 ? 's' : ''} • {item.orderItems?.[0]?.product?.title || "Product"}</Text>
                </View>
                <Text style={styles.priceText}>${(item.totalPrice || 0).toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FBF9" },
  header: {
    direction: 'ltr',
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },

  topTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  tabActive: { backgroundColor: "#2A8383", borderColor: "#2A8383" },
  tabText: { fontSize: 13, color: "#666", fontWeight: "500" },
  textActive: { color: "#FFF" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    margin: 15,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  searchInput: { marginLeft: 10, flex: 1 },

  orderCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 1,
  },
  cardHeader: { flexDirection: "row" },
  productImg: { width: 60, height: 60, borderRadius: 10 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNo: { fontWeight: "bold", fontSize: 15 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "700" },
  addressText: { fontSize: 12, color: "#999", marginVertical: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingText: { fontSize: 12, marginLeft: 4, color: "#666" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  customerName: { color: "#2A8383", fontWeight: "600", fontSize: 14 },
  itemDetailText: { fontSize: 11, color: "#999", marginTop: 2 },
  priceText: { fontSize: 18, fontWeight: "bold", color: "#2A8383" },
});
