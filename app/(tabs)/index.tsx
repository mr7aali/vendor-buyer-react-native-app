import { useGetUserVendorStatisticsQuery } from "@/store/api/authApiSlice";
import { useGetOrdersQuery } from "@/store/api/orderApiSlice";
import { useTranslation } from "@/hooks/use-translation";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { Feather } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { quickActions } from "../../constants/common";

const toNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: any) => `$${toNumber(value).toFixed(2)}`;
const normalizeStatus = (value: any) => String(value || "pending").toLowerCase();

const getStatusTheme = (status: string) => {
  const map: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#FFF3E0", text: "#E65100" },
    processing: { bg: "#E3F2FD", text: "#0D47A1" },
    shipped: { bg: "#E1F5FE", text: "#01579B" },
    delivered: { bg: "#F3E5F5", text: "#4A148C" },
    completed: { bg: "#E3F9E7", text: "#1B5E20" },
    cancelled: { bg: "#FDEBEC", text: "#D43C49" },
  };
  return map[status] || { bg: "#EEF2F4", text: "#56636B" };
};

const toTitle = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default function HomeScreen() {
  const { language, t } = useTranslation();
  const user = useAppSelector(selectCurrentUser);
  const currentUserId =
    (user as any)?.userId ||
    (user as any)?.id ||
    (user as any)?._id ||
    (user as any)?.buyer?.userId ||
    (user as any)?.vendor?.userId;
  const { data: statsData, isLoading: isStatsLoading, isError: isStatsError } = useGetUserVendorStatisticsQuery(currentUserId, {
    skip: !currentUserId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const { data: ordersData = [], isLoading: isOrdersLoading } = useGetOrdersQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const localizedText = React.useMemo(() => {
    if (language === "he") {
      return {
        thisMonth: "החודש",
        quickActions: "פעולות מהירות",
        recentOrders: "הזמנות אחרונות",
        viewAll: "הצג הכל",
        products: "מוצרים",
        newClients: "לקוחות חדשים",
        noItems: "אין פריטים",
        statsFallback: "לא ניתן לרענן נתונים. מוצגים ערכי ברירת מחדל.",
        addProduct: "הוסף מוצר",
        orders: "הזמנות",
        payments: "תשלומים",
        myQrCode: "קוד ה-QR שלי",
      };
    }
    if (language === "hi") {
      return {
        thisMonth: "इस महीने",
        quickActions: "त्वरित कार्य",
        recentOrders: "हाल के ऑर्डर",
        viewAll: "सभी देखें",
        products: "प्रोडक्ट्स",
        newClients: "नए ग्राहक",
        noItems: "कोई आइटम नहीं",
        statsFallback: "आंकड़े रीफ्रेश नहीं हो सके। डिफ़ॉल्ट मान दिखाए जा रहे हैं।",
        addProduct: "प्रोडक्ट जोड़ें",
        orders: "ऑर्डर",
        payments: "पेमेंट्स",
        myQrCode: "मेरा QR कोड",
      };
    }
    return {
      thisMonth: "This Month",
      quickActions: "Quick Actions",
      recentOrders: "Recent Orders",
      viewAll: "View All",
      products: "Products",
      newClients: "New Clients",
      noItems: "No items",
      statsFallback: "Could not refresh stats. Showing fallback values.",
      addProduct: "Add Product",
      orders: "Orders",
      payments: "Payments",
      myQrCode: "My QR Code",
    };
  }, [language]);

  const metricLabel = React.useCallback(
    (metric: string) => {
      const key = metric.toLowerCase();
      if (key === "sales") return t("total_sales", "Sales");
      if (key === "active orders") return t("active_orders", "Active Orders");
      if (key === "completed orders") return t("completed_order", "Completed Orders");
      if (key === "products") return localizedText.products;
      if (key === "new clients") return localizedText.newClients;
      return metric;
    },
    [localizedText.newClients, localizedText.products, t]
  );

  const statusLabel = React.useCallback(
    (status: string) => {
      const map: Record<string, string> = {
        pending: t("orders_filter_pending", "Pending"),
        processing: t("orders_filter_processing", "Processing"),
        shipped: t("orders_filter_shipped", "Shipped"),
        delivered: t("orders_filter_delivered", "Delivered"),
        completed: t("orders_filter_completed", "Completed"),
        cancelled: t("orders_filter_cancelled", "Cancelled"),
      };
      return map[status] || toTitle(status);
    },
    [t]
  );

  const getQuickActionLabel = React.useCallback(
    (id: number, fallback: string) => {
      const map: Record<number, string> = {
        1: localizedText.addProduct,
        2: localizedText.orders,
        3: localizedText.payments,
        4: localizedText.myQrCode,
      };
      return map[id] || fallback;
    },
    [localizedText]
  );

  const userName = React.useMemo(() => {
    const displayName =
      (user as any)?.fullName ||
      (user as any)?.fulllName ||
      (user as any)?.name ||
      (user as any)?.buyer?.fullName ||
      (user as any)?.vendor?.fullName ||
      (user as any)?.storename ||
      (user as any)?.businessName;

    if (displayName && String(displayName).trim()) return String(displayName).trim();

    const email = (user as any)?.email;
    if (email && String(email).includes("@")) return String(email).split("@")[0];

    return t("chat_user_fallback", "User");
  }, [t, user]);

  const statCards = React.useMemo(() => {
    const payload = (statsData as any)?.data || statsData || {};
    const role = String(payload?.role || "").toLowerCase();
    if (role === "vendor") {
      return [
        {
          metric: "Sales",
          value: formatMoney(payload?.totalSales?.value),
          growth: toNumber(payload?.totalSales?.growth),
        },
        {
          metric: "Active Orders",
          value: String(toNumber(payload?.activeOrders?.value)),
          growth: toNumber(payload?.activeOrders?.growth),
        },
        {
          metric: "Products",
          value: String(toNumber(payload?.products?.value)),
          growth: toNumber(payload?.products?.growth),
        },
        {
          metric: "New Clients",
          value: String(toNumber(payload?.newClients?.value)),
          growth: toNumber(payload?.newClients?.growth),
        },
      ];
    }

    return [
      {
        metric: "Active Orders",
        value: String(toNumber(payload?.activeOrders)),
        growth: null,
      },
      {
        metric: "Completed Orders",
        value: String(toNumber(payload?.completedOrders)),
        growth: null,
      },
    ];
  }, [statsData]);

  const recentOrders = React.useMemo(() => {
    const sorted = [...ordersData].sort((a: any, b: any) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    return sorted.slice(0, 3);
  }, [ordersData]);

  const locale = language === "he" ? "he-IL" : language === "hi" ? "hi-IN" : "en-US";
  const today = new Date().toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View>
        {/* THIS IS FOR HOME HEADER */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 20,
            paddingRight: 20,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
              }}
            >
              {t("welcome_back", "Welcome back")}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: "#1A1A1A",
                marginTop: 2,
              }}
            >
              {userName}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "#5f6470",
              }}
            >
              {today}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: "white",
                padding: 12,
                borderRadius: "100%",
                borderWidth: 0.5,
                borderColor: "#E3E6F0",
              }}
            >
              <Feather name="headphones" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              style={{
                backgroundColor: "white",
                padding: 12,
                borderRadius: "100%",
                borderWidth: 0.5,
                borderColor: "#E3E6F0",
              }}
            >
              <Ionicons name="notifications-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>
        {/* THIS IS FOR THIS MONTHS INFO PART */}
        <ScrollView>
          <View
            style={{
              paddingLeft: 20,
              paddingRight: 20,
              paddingBottom: 140,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 16,
              }}
            >
              {localizedText.thisMonth}
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 12,
              }}
            >
              {statCards.map((item, index) => {
                const growth = typeof item.growth === "number" ? item.growth : null;
                const isUp = growth === null ? true : growth >= 0;
                return (
                  <TouchableOpacity
                    key={`${item.metric}-${index}`}
                    style={{
                      backgroundColor: "white",
                      borderRadius: 16,
                      padding: 16,
                      width: "48%",
                      gap: 6,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        marginBottom: 4,
                        fontWeight: "500",
                      }}
                    >
                      {metricLabel(item.metric)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "500",
                      }}
                    >
                      {item.value}
                    </Text>
                    {growth !== null ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 12,
                        }}
                      >
                        <Feather
                          name={isUp ? "trending-up" : "trending-down"}
                          size={12}
                          color={isUp ? "#088738" : "#E83808"}
                          style={{ marginRight: 2 }}
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            color: isUp ? "#088738" : "#E83808",
                            fontWeight: "500",
                          }}
                        >
                          {`${isUp ? "+" : "-"}${Math.abs(growth)}%`}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ height: 16 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
              {isStatsLoading ? (
                <ActivityIndicator size="small" color="#278687" style={{ marginTop: 8, marginLeft: 4 }} />
              ) : null}
              {isStatsError ? (
                <Text style={{ fontSize: 12, color: "#B45309", marginTop: 4 }}>
                  {localizedText.statsFallback}
                </Text>
              ) : null}
            </View>
            {/* THIS IS FOR Quick Actions */}
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "500",
                }}
              >
                {localizedText.quickActions}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 10,
                  marginBottom: 10,
                  justifyContent: "space-between",
                }}
              >
                {quickActions.map((action: any) => (
                  <View
                    key={action.id}
                    style={{
                      alignItems: "center",
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        backgroundColor: "white",
                        padding: 10,
                        borderRadius: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      onPress={action.onPress}
                    >
                      <Image
                        source={action.icon}
                        style={{ width: 24, height: 24 }}
                      />
                    </TouchableOpacity>
                    <Text
                      style={{
                        fontSize: 10,
                        textAlign: "center",
                        marginTop: 6,
                      }}
                    >
                      {getQuickActionLabel(action.id, action.name)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            {/* THIS IS FOR Recent Orders */}
            <View
              style={{
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                  }}
                >
                  {localizedText.recentOrders}
                </Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/order")}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#278687",
                      fontWeight: "500",
                    }}
                  >
                    {localizedText.viewAll}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 12, gap: 12 }}>
                {isOrdersLoading ? (
                  <ActivityIndicator size="small" color="#278687" style={{ marginTop: 8 }} />
                ) : recentOrders.length ? (
                  recentOrders.map((order: any) => {
                    const orderId = order?.id || order?._id;
                    const status = normalizeStatus(order?.status);
                    const statusTheme = getStatusTheme(status);
                    const firstItem = Array.isArray(order?.orderItems) ? order.orderItems[0] : null;
                    const coverImage =
                      firstItem?.product?.images?.[0] ||
                      firstItem?.product?.imageUrl ||
                      "https://via.placeholder.com/80";
                    const customerName =
                      order?.buyer?.fullName ||
                      order?.vendor?.fullName ||
                      order?.vendor?.storename ||
                      t("customer", "Customer");
                    const customerId = order?.buyer?.id || order?.vendor?.id || "N/A";
                    const itemSummary = Array.isArray(order?.orderItems) && order.orderItems.length
                      ? `${order.orderItems.length} ${t("orders_items_label", "items")}`
                      : localizedText.noItems;

                    return (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(screens)/order_details",
                        params: { id: orderId },
                      })
                    }
                    key={orderId}
                    style={{
                      backgroundColor: "white",
                      borderRadius: 12,
                      padding: 12,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                  >
                    <View style={{ flexDirection: "row", marginBottom: 8 }}>
                      <Image
                        source={{ uri: coverImage }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 8,
                          marginRight: 12,
                        }}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <Text style={{ color: "#2B2B2B", fontSize: 16 }}>
                            {order?.orderNumber || `#${orderId}`}
                          </Text>
                          <View
                            style={{
                              backgroundColor: statusTheme.bg,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 12,
                            }}
                          >
                            <Text
                              style={{
                                color: statusTheme.text,
                                fontSize: 10,
                                fontWeight: "500",
                              }}
                            >
                              {statusLabel(status)}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#4D4D4D",
                            marginBottom: 8,
                          }}
                        >
                          {order?.shippingAddress || t("address_unavailable", "Address unavailable")}
                        </Text>
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Ionicons name="star" size={12} color="#FFC107" />
                          <Text style={{ fontSize: 12, marginLeft: 4 }}>
                            {customerId}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "#eaf2f2",
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingBottom: 10,
                        paddingTop: 10,
                        borderRadius: 6,
                        marginTop: 8,
                      }}
                    >
                      <View>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "500",
                            color: "#278687",
                          }}
                        >
                          {customerName}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#278687" }}>
                          {itemSummary}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#278687",
                        }}
                      >
                        {formatMoney(order?.totalAmount || order?.totalPrice)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={{ color: "#6B7280", fontSize: 13 }}>{t("no_recent_orders_found", "No recent orders found.")}</Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
