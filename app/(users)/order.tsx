import { useTranslation } from "@/hooks/use-translation";
import { useGetOrdersQuery } from "@/store/api/orderApiSlice";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const IMAGE_FALLBACK = "https://via.placeholder.com/60";

const toNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: any) => `$${toNumber(value).toFixed(2)}`;

const getOrderItems = (order: any) =>
  Array.isArray(order?.orderItems) ? order.orderItems : [];
const isProductPayload = (order: any) =>
  !!order &&
  !Array.isArray(order?.orderItems) &&
  (order?.name || order?.price || order?.images?.length);

const getPrimaryItem = (order: any) => getOrderItems(order)[0];

const getProductImage = (order: any) => {
  const item = getPrimaryItem(order);
  return (
    order?.images?.[0] ||
    order?.imageUrl ||
    item?.product?.images?.[0] ||
    item?.product?.imageUrl ||
    item?.imageUrl ||
    item?.image ||
    IMAGE_FALLBACK
  );
};

const getProductName = (order: any) => {
  const item = getPrimaryItem(order);
  return (
    order?.name ||
    order?.title ||
    item?.product?.name ||
    item?.productName ||
    item?.name ||
    item?.title ||
    ""
  );
};

const resolveEntityId = (value: any): string => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    if (typeof value.id === "string" || typeof value.id === "number") return String(value.id);
    if (typeof value._id === "string" || typeof value._id === "number") return String(value._id);
  }
  return "";
};

const getProductId = (order: any) => {
  const item = getPrimaryItem(order);
  return (
    resolveEntityId(order?.product) ||
    resolveEntityId(order?.productId) ||
    resolveEntityId(item?.product) ||
    resolveEntityId(item?.productId) ||
    ""
  );
};

const getOrderCode = (order: any) => {
  const rawId = String(order?._id || order?.id || "");
  return rawId ? `#${rawId.slice(-6)}` : "#------";
};

const getShippingAddress = (order: any) => {
  if (isProductPayload(order)) return order?.description || "";
  if (typeof order?.shippingAddress === "string" && order.shippingAddress.trim()) {
    return order.shippingAddress;
  }
  const addr = order?.shippingAddress;
  if (addr && typeof addr === "object") {
    return (
      [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.postalCode]
        .filter(Boolean)
        .join(", ") || ""
    );
  }
  return "";
};

const getOrderTotal = (order: any) => {
  if (order?.price != null) return toNumber(order.price);
  if (order?.totalPrice != null) return toNumber(order.totalPrice);
  if (order?.grandTotal != null) return toNumber(order.grandTotal);

  return getOrderItems(order).reduce((sum: number, item: any) => {
    const quantity = toNumber(item?.quantity, 1);
    const unitPrice = item?.price ?? item?.unitPrice ?? item?.product?.price ?? 0;
    return sum + toNumber(unitPrice) * quantity;
  }, 0);
};

const getBottomLabel = (
  order: any,
  t: (key: string, fallback?: string) => string,
) => {
  const items = getOrderItems(order);
  if (!items.length && isProductPayload(order)) {
    return `${t("orders_stock", "Stock")}: ${order?.stockQuantity ?? 0} • SKU: ${
      order?.sku || t("orders_na", "N/A")
    }`;
  }
  if (!items.length) return `0 ${t("orders_items_label", "items")}`;
  const firstName = getProductName(order) || t("orders_product_fallback", "Product");
  if (items.length === 1) return `1 ${t("orders_item_label", "item")} • ${firstName}`;
  return `${items.length} ${t("orders_items_label", "items")} • ${firstName} +${
    items.length - 1
  } ${t("orders_more", "more")}`;
};

const normalizeStatus = (status?: string) => {
  const raw = String(status || "").trim().toLowerCase();
  if (!raw) return "";

  // Unify backend variants to UI filter buckets
  if (raw === "delivered" || raw === "complete" || raw === "completed") return "Delivered";
  if (raw === "processing" || raw === "in_progress" || raw === "in progress") return "Processing";
  if (raw === "shipped" || raw === "shipping" || raw === "out_for_delivery" || raw === "out for delivery") return "Shipped";
  if (raw === "canceled" || raw === "cancelled") return "Canceled";
  if (raw === "pending") return "Pending";

  // Fallback: title case
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const OrderCardSkeleton = () => (
  <View style={styles.card}>
    <View style={styles.cardTop}>
      <SkeletonBlock style={styles.skeletonImg} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.row}>
          <SkeletonBlock style={styles.skeletonOrderNo} />
          <SkeletonBlock style={styles.skeletonBadge} />
        </View>
        <SkeletonBlock style={styles.skeletonAddress} />
        <View style={styles.row}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <SkeletonBlock style={styles.skeletonMetaIcon} />
            <SkeletonBlock style={styles.skeletonMetaText} />
          </View>
        </View>
      </View>
    </View>
    <View style={styles.cardBottom}>
      <View style={{ flex: 1, marginRight: 8 }}>
        <SkeletonBlock style={styles.skeletonCustomer} />
        <SkeletonBlock style={styles.skeletonSummary} />
      </View>
      <SkeletonBlock style={styles.skeletonPrice} />
    </View>
  </View>
);

const getDisplayStatus = (item: any) => {
  const normalized = normalizeStatus(item?.status);
  if (normalized) return normalized;
  if (item?.isAvailable === true) return "Processing";
  if (item?.isAvailable === false) return "Pending";
  return "Pending";
};

export default function OrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Delivered", "Processing", "Shipped", "Canceled"];

  const { data: ordersData, isLoading } = useGetOrdersQuery(undefined);
  const orders = ordersData || [];

  const filteredOrders =
    activeFilter === "All"
      ? orders
      : orders.filter((o: any) => normalizeStatus(getDisplayStatus(o)) === activeFilter);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Processing":
        return { bg: "#E8F2FF", text: "#2F80ED" };
      case "Delivered":
        return { bg: "#E8F9EE", text: "#27AE60" };
      case "Shipped":
        return { bg: "#F2E8FF", text: "#9B51E0" };
      case "Canceled":
        return { bg: "#FFE8E8", text: "#EB5757" };
      default:
        return { bg: "#FFF4E8", text: "#F2994A" };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("orders_title", "Orders")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          placeholder={t("orders_search", "Search......")}
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </View>

      <View style={{ height: 50, marginBottom: 10 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveFilter(item)}
              style={[styles.filterBtn, activeFilter === item && styles.filterBtnActive]}
            >
              <Text
                style={[styles.filterText, activeFilter === item && { color: "#FFF" }]}
              >
                {t(`orders_filter_${item.toLowerCase()}`, item)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={isLoading ? Array.from({ length: 5 }, (_, index) => ({ id: `skeleton-${index}` })) : filteredOrders}
        keyExtractor={(item, index) => String(item?._id || item?.id || index)}
        renderItem={({ item }) => isLoading ? (
          <OrderCardSkeleton />
        ) : (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/(user_screen)/OrderDetails",
                params: {
                  id: item._id || item.id,
                  status: item.status,
                  productId: getProductId(item),
                  productName: getProductName(item) || "",
                },
              })
            }
          >
            <View style={styles.cardTop}>
              <Image source={{ uri: getProductImage(item) }} style={styles.img} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.row}>
                  <Text style={styles.orderNo}>{getOrderCode(item)}</Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: getStatusStyle(getDisplayStatus(item)).bg },
                    ]}
                  >
                    <Text
                      style={{
                        color: getStatusStyle(getDisplayStatus(item)).text,
                        fontSize: 10,
                        fontWeight: "700",
                      }}
                    >
                      {t(
                        `orders_filter_${String(getDisplayStatus(item)).toLowerCase()}`,
                        getDisplayStatus(item),
                      )}
                    </Text>
                  </View>
                </View>
                <Text style={styles.address}>{getShippingAddress(item) || t("orders_na", "N/A")}</Text>
                <View style={styles.row}>
                  <Ionicons name="time-outline" size={14} color="#666" />
                  <Text style={styles.rating}>
                    {item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.cardBottom}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.customer}>
                  {item.vendor?.name || item.category?.name || item.storeName || t("orders_store_fallback", "Store")}
                </Text>
                <Text numberOfLines={1} style={{ color: "#2A8383", fontSize: 12, marginTop: 2 }}>
                  {getBottomLabel(item, t)}
                </Text>
              </View>
              <Text style={styles.price}>{formatMoney(getOrderTotal(item))}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              iconName="bag-handle-outline"
              message={t("orders_no_orders_found", "No Recent Orders Found")}
              subtitle={t("orders_empty_hint", "Your latest purchases and deliveries will show up here.")}
            />
          ) : null
        }
      />
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
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    margin: 15,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  searchInput: { marginLeft: 10, flex: 1, color: "#1F2937" },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FFF",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#EEE",
    justifyContent: "center",
  },
  filterBtnActive: { backgroundColor: "#2A8383", borderColor: "#2A8383" },
  filterText: { color: "#666", fontSize: 14 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  cardTop: { flexDirection: "row" },
  img: { width: 60, height: 60, borderRadius: 10 },
  skeletonImg: { width: 60, height: 60, borderRadius: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNo: { fontWeight: "bold", fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  address: { fontSize: 12, color: "#999", marginVertical: 4 },
  rating: { fontSize: 12, marginLeft: 4, color: "#666" },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  customer: { color: "#2A8383", fontWeight: "600" },
  price: { fontWeight: "bold", color: "#2A8383", fontSize: 16 },
  skeletonOrderNo: { width: 88, height: 18, borderRadius: 8 },
  skeletonBadge: { width: 74, height: 24, borderRadius: 8 },
  skeletonAddress: { width: "90%", height: 12, borderRadius: 6, marginVertical: 8 },
  skeletonMetaIcon: { width: 14, height: 14, borderRadius: 7 },
  skeletonMetaText: { width: 96, height: 12, borderRadius: 6, marginLeft: 6 },
  skeletonCustomer: { width: 110, height: 14, borderRadius: 7 },
  skeletonSummary: { width: "75%", height: 12, borderRadius: 6, marginTop: 6 },
  skeletonPrice: { width: 62, height: 18, borderRadius: 8 },
});
