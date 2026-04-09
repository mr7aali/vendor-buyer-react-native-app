

import { useGetProfileQuery, useGetUserVendorStatisticsQuery } from "@/store/api/authApiSlice";
import { useGetOrdersQuery } from "@/store/api/orderApiSlice";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppSelector } from "@/store/hooks";
import { resolveAbsoluteUrl } from "@/services/apiConfig";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useTranslation } from "@/hooks/use-translation";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Bell, Compass, QrCode, Star, TrendingUp, Zap } from "lucide-react-native";
import React from "react";
import {
  BackHandler,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const toNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: any) => `$${toNumber(value).toFixed(2)}`;
const normalizeStatus = (value: any) => String(value || "pending").toLowerCase();
const toTitle = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const user = useAppSelector(selectCurrentUser);
  const { data: statsData } = useGetUserVendorStatisticsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const { data: profileData } = useGetProfileQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const { data: ordersData = [] } = useGetOrdersQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const buyerProfile = React.useMemo(() => {
    const profileRoot = (profileData as any)?.data;
    const reduxRoot = user as any;
    return (
      profileRoot?.buyer ||
      (String(profileRoot?.userType || "").toLowerCase() === "buyer" ? profileRoot : null) ||
      reduxRoot?.buyer ||
      (String(reduxRoot?.userType || "").toLowerCase() === "buyer" ? reduxRoot : null) ||
      null
    );
  }, [profileData, user]);

  const userName = React.useMemo(() => {
    const displayName =
      (buyerProfile as any)?.fullName ||
      (buyerProfile as any)?.fulllName ||
      (buyerProfile as any)?.name ||
      (user as any)?.fullName ||
      (user as any)?.fulllName ||
      (user as any)?.name;

    if (displayName && String(displayName).trim()) return String(displayName).trim();

    const email = (buyerProfile as any)?.email || (user as any)?.email;
    if (email && String(email).includes("@")) return String(email).split("@")[0];

    return "User";
  }, [buyerProfile, user]);

  const avatarUri = React.useMemo(
    () =>
      resolveAbsoluteUrl(
        (buyerProfile as any)?.profilePhotoUrl ||
          (buyerProfile as any)?.avatar ||
          (buyerProfile as any)?.image ||
          (buyerProfile as any)?.photoUrl ||
          (user as any)?.profilePhotoUrl ||
          (user as any)?.avatar ||
          (user as any)?.image,
      ) ,
    [buyerProfile, user],
  );

  const statsCards = React.useMemo(() => {
    const role = String(statsData?.role || "").toLowerCase();
    if (role === "vendor") {
      return [
        { key: "sales", label: t("total_sales", "Total Sales"), value: formatMoney(statsData?.totalSales?.value), Icon: TrendingUp },
        { key: "active", label: t("active_orders", "Active Orders"), value: String(toNumber(statsData?.activeOrders?.value)), Icon: Zap },
      ];
    }
    return [
      { key: "completed", label: t("completed_order", "Completed Order"), value: String(toNumber(statsData?.completedOrders)), Icon: TrendingUp },
      { key: "active", label: t("active_orders", "Active Orders"), value: String(toNumber(statsData?.activeOrders)), Icon: Zap },
    ];
  }, [statsData, t]);

  const recentOrders = React.useMemo(() => {
    const sorted = [...ordersData].sort((a: any, b: any) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    return sorted.slice(0, 3);
  }, [ordersData]);

  const getStatusTheme = (statusValue: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      pending: { bg: "#FFF3E0", text: "#E65100" },
      processing: { bg: "#E3F2FD", text: "#0D47A1" },
      shipped: { bg: "#E1F5FE", text: "#01579B" },
      delivered: { bg: "#F3E5F5", text: "#4A148C" },
      completed: { bg: "#E3F9E7", text: "#1B5E20" },
      cancelled: { bg: "#FDEBEC", text: "#D43C49" },
    };
    return map[statusValue] || { bg: "#E8F0FE", text: "#3B82F6" };
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, []),
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        style="dark"
        backgroundColor={styles.container.backgroundColor}
        translucent={false}
      />
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            onPress={() => router.push("/(user_screen)/ProfileInfoScreen")}
            activeOpacity={0.7}
          >
            <Image
              source={{
                uri: avatarUri,
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View style={styles.userText}>
            <Text style={styles.welcomeTitle}>{t("welcome_back", "Welcome back")}</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Bell
            color="#2D8C8C"
            size={24}
            onPress={() => router.replace("/(user_screen)/Notification")}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statsCards.map((item) => (
            <View key={item.key} style={styles.statCard}>
              <View
                style={[styles.statIconCircle, { backgroundColor: "#F0F9F9" }]}
              >
                <item.Icon color="#2D8C8C" size={20} />
              </View>
              <Text style={styles.statNumber}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* QR Scan Section */}
        <View style={styles.qrSection}>
          <View style={styles.qrTextContent}>
            <Text style={styles.qrTitle}>{t("scan_vendor_qr_code", "Scan Vendor QR Code")}</Text>
            <Text style={styles.qrSubtitle}>
              {t("connect_local_vendors", "Connect with local vendors instantly")}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.qrIconBox}
            onPress={() => router.push("/(user_screen)/ScanQRCode")}
            activeOpacity={0.7}
          >
            <QrCode color="#FFFFFF" size={32} />
          </TouchableOpacity>
        </View>

        {/* How It Works Section */}
        <View style={styles.howItWorksCard}>
          <Text style={styles.sectionTitleWhite}>{t("how_it_works", "How It Works")}</Text>
          <View style={styles.stepsList}>
            <Text style={styles.stepItem}>
              {t("how_step_1", "1. Scan a vendor s QR code or barcode")}
            </Text>
            <Text style={styles.stepItem}>
              {t("how_step_2", "2. Browse their catalog and chat directly")}
            </Text>
            <Text style={styles.stepItem}>
              {t("how_step_3", "3. Negotiate prices and place orders")}
            </Text>
            <Text style={styles.stepItem}>{t("how_step_4", "4. Track delivery in real-time")}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push("/(users)/explore")}
          activeOpacity={0.85}
        >
          <Compass size={22} color="#E9F7F5" />
          <Text style={styles.exploreButtonText}>{t("explore", "Explore")}</Text>
        </TouchableOpacity>

        {/* Recent Order Section (Updated) */}
        <Text style={styles.sectionTitleMain}>{t("recent_order", "Recent order")}</Text>

        <View style={{ gap: 15 }}>
          {recentOrders.length ? (
            recentOrders.map((order: any) => {
              const orderId = order?.id || order?._id;
              const status = normalizeStatus(order?.status);
              const statusTheme = getStatusTheme(status);
              const firstItem = Array.isArray(order?.orderItems) ? order.orderItems[0] : null;
              const coverImage =
                firstItem?.product?.images?.[0] ||
                firstItem?.product?.imageUrl ||
                "https://via.placeholder.com/150";
              const partyName =
                order?.vendor?.fullName ||
                order?.vendor?.storename ||
                order?.buyer?.fullName ||
                t("customer", "Customer");
              const itemTitle =
                firstItem?.product?.name ||
                firstItem?.product?.title ||
                `${Array.isArray(order?.orderItems) ? order.orderItems.length : 0} items`;
              return (
            <TouchableOpacity
              key={orderId}
              style={styles.orderCard}
              onPress={() =>
                router.push({
                  pathname: "/(user_screen)/OrderDetails",
                  params: { status, id: orderId },
                })
              }
              activeOpacity={0.9}
            >
              <View style={styles.orderTopRow}>
                <Image
                  source={{
                    uri: coverImage,
                  }}
                  style={styles.orderImage}
                />
                <View style={styles.orderInfoContainer}>
                  <View style={styles.orderHeaderRow}>
                    <Text style={styles.orderIdText} numberOfLines={1} ellipsizeMode="tail">
                      {order?.orderNumber || `#${orderId}`}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
                      <Text style={[styles.statusText, { color: statusTheme.text }]}>{toTitle(status)}</Text>
                    </View>
                  </View>

                  <Text style={styles.orderAddress} numberOfLines={1}>
                    {order?.shippingAddress || t("address_unavailable", "Address unavailable")}
                  </Text>

                  <View style={styles.ratingRow}>
                    <Star color="#FFD700" size={16} fill="#FFD700" />
                    <Text style={styles.ratingText} numberOfLines={2} ellipsizeMode="tail">
                      {" 4.5 "}
                      <Text style={styles.reviewCount}>({order?.buyer?.id || order?.vendor?.id || "N/A"})</Text>
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.orderBottomRow}>
                <View>
                  <Text style={styles.customerName}>{partyName}</Text>
                  <Text style={styles.itemDetail}>
                    {itemTitle}
                  </Text>
                </View>
                <Text style={styles.orderPrice}>{formatMoney(order?.totalAmount || order?.totalPrice)}</Text>
              </View>
            </TouchableOpacity>
              );
            })
          ) : (
            <EmptyState
              iconName="time-outline"
              message={t("no_recent_orders_found", "No Recent Orders Found")}
              subtitle={t("recent_orders_empty_hint", "Once you place orders, your latest activity will show up here.")}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF9" },
  header: {
    direction: 'ltr',
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  userInfo: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  userText: { justifyContent: "center" },
  welcomeTitle: { fontSize: 18, fontWeight: "700", color: "#2D8C8C" },
  userName: { fontSize: 14, color: "#7C7C7C" },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  statCard: {
    width: (width - 55) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statNumber: { fontSize: 24, fontWeight: "700", color: "#2D8C8C" },
  statLabel: { fontSize: 13, color: "#7C7C7C", marginTop: 4 },
  qrSection: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    elevation: 2,
  },
  qrTextContent: { flex: 1 },
  qrTitle: { fontSize: 18, fontWeight: "700", color: "#2D8C8C" },
  qrSubtitle: { fontSize: 13, color: "#7C7C7C", marginTop: 5 },
  qrIconBox: {
    width: 56,
    height: 56,
    backgroundColor: "#2D8C8C",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  howItWorksCard: {
    backgroundColor: "#2D8C8C",
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },
  sectionTitleWhite: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  stepsList: { gap: 10 },
  stepItem: { color: "#E0F2F2", fontSize: 14, lineHeight: 20 },
  exploreButton: {
    backgroundColor: "#2D8C8C",
    borderRadius: 16,
    minHeight: 58,
    marginBottom: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#1D6C6D",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  exploreButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5FFFE",
  },
  sectionTitleMain: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D8C8C",
    marginBottom: 15,
  },

  // New Order Card Styles
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  orderTopRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  orderImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  orderInfoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  orderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    color: "#3B82F6",
    fontWeight: "600",
  },
  orderAddress: {
    fontSize: 12,
    color: "#888",
    marginVertical: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    flexShrink: 1,
  },
  reviewCount: {
    fontWeight: "400",
    color: "#888",
  },
  orderBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7FBF9",
    padding: 12,
    borderRadius: 12,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D8C8C",
  },
  itemDetail: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D8C8C",
  },
});

export default Dashboard;
