// import { router } from "expo-router";
// import {
//   Bell,
//   Package,
//   QrCode,
//   TrendingUp,
//   Truck,
//   Zap,
// } from "lucide-react-native";
// import React from "react";
// import {
//   Dimensions,
//   Image,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// const { width } = Dimensions.get("window");

// const Dashboard: React.FC = () => {
//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <View style={styles.userInfo}>
//           <TouchableOpacity
//             onPress={() => router.push("/(user_screen)/ProfileInfoScreen")}
//             activeOpacity={0.7}
//           >
//             <Image
//               source={{
//                 uri: "https://xsgames.co/randomusers/assets/avatars/male/74.jpg",
//               }}
//               style={styles.avatar}
//             />
//           </TouchableOpacity>
//           <View style={styles.userText}>
//             <Text style={styles.welcomeTitle}>Welcome Back</Text>
//             <Text style={styles.userName}>{user?.name || user?.fullName || user?.fulllName || "User"}</Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.notificationBtn}>
//           <Bell
//             color="#2D8C8C"
//             size={24}
//             onPress={() => router.replace("/(user_screen)/Notification")}
//           />
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* Stats Grid */}
//         <View style={styles.statsGrid}>
//           <View style={styles.statCard}>
//             <View
//               style={[styles.statIconCircle, { backgroundColor: "#F0F9F9" }]}
//             >
//               <TrendingUp color="#2D8C8C" size={20} />
//             </View>
//             <Text style={styles.statNumber}>56</Text>
//             <Text style={styles.statLabel}>Completed Order</Text>
//           </View>

//           <View style={styles.statCard}>
//             <View
//               style={[styles.statIconCircle, { backgroundColor: "#F0F9F9" }]}
//             >
//               <Zap color="#2D8C8C" size={20} />
//             </View>
//             <Text style={styles.statNumber}>85</Text>
//             <Text style={styles.statLabel}>Active Orders</Text>
//           </View>
//         </View>

//         {/* QR Scan Section */}
//         <TouchableOpacity style={styles.qrSection}>
//           <View style={styles.qrTextContent}>
//             <Text style={styles.qrTitle}>Scan Vendor QR Code</Text>
//             <Text style={styles.qrSubtitle}>
//               Connect with local vendors instantly
//             </Text>
//           </View>
//           <TouchableOpacity
//             style={styles.qrIconBox}
//             onPress={() => router.push("/(user_screen)/ScanQRCode")}
//             activeOpacity={0.7}
//           >
//             <QrCode color="#FFFFFF" size={32} />
//           </TouchableOpacity>
//         </TouchableOpacity>

//         {/* How It Works Section */}
//         <View style={styles.howItWorksCard}>
//           <Text style={styles.sectionTitleWhite}>How It Works</Text>
//           <View style={styles.stepsList}>
//             <Text style={styles.stepItem}>
//               1. Scan a vendor s QR code or barcode
//             </Text>
//             <Text style={styles.stepItem}>
//               2. Browse their catalog and chat directly
//             </Text>
//             <Text style={styles.stepItem}>
//               3. Negotiate prices and place orders
//             </Text>
//             <Text style={styles.stepItem}>4. Track delivery in real-time</Text>
//           </View>
//         </View>

//         {/* Recent Tracking Section */}
//         <Text style={styles.sectionTitleMain}>Recent Tracking order</Text>
//         <View style={styles.trackingCard}>
//           <Text style={styles.orderId}>Order id : 1923838</Text>

//           <View style={styles.trackingStatusRow}>
//             <View style={styles.statusItem}>
//               <Truck color="#2D8C8C" size={24} />
//               <Text style={styles.statusLabel}>Pickup</Text>
//             </View>
//             <View style={styles.statusItem}>
//               <Truck color="#2D8C8C" size={24} />
//               <Text style={styles.statusLabel}>On going</Text>
//             </View>
//             <View style={styles.statusItem}>
//               <Package color="#999" size={24} />
//               <Text style={styles.statusLabel}>Delivery</Text>
//             </View>
//           </View>

//           {/* Progress Bar */}
//           <View style={styles.progressBarBg}>
//             <View style={styles.progressBarFill} />
//           </View>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F8FAF9",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//   },
//   userInfo: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginRight: 12,
//   },
//   userText: {
//     justifyContent: "center",
//   },
//   welcomeTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#2D8C8C",
//   },
//   userName: {
//     fontSize: 14,
//     color: "#7C7C7C",
//   },
//   notificationBtn: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: "#FFFFFF",
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 5,
//   },
//   scrollContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 30,
//   },
//   statsGrid: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginVertical: 20,
//   },
//   statCard: {
//     width: (width - 55) / 2,
//     backgroundColor: "#FFFFFF",
//     borderRadius: 16,
//     padding: 16,
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 5,
//   },
//   statIconCircle: {
//     width: 40,
//     height: 40,
//     borderRadius: 10,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: "#2D8C8C",
//   },
//   statLabel: {
//     fontSize: 13,
//     color: "#7C7C7C",
//     marginTop: 4,
//   },
//   qrSection: {
//     flexDirection: "row",
//     backgroundColor: "#FFFFFF",
//     borderRadius: 16,
//     padding: 20,
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 20,
//     elevation: 2,
//   },
//   qrTextContent: {
//     flex: 1,
//   },
//   qrTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#2D8C8C",
//   },
//   qrSubtitle: {
//     fontSize: 13,
//     color: "#7C7C7C",
//     marginTop: 5,
//   },
//   qrIconBox: {
//     width: 56,
//     height: 56,
//     backgroundColor: "#2D8C8C",
//     borderRadius: 12,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   howItWorksCard: {
//     backgroundColor: "#2D8C8C",
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 25,
//   },
//   sectionTitleWhite: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#FFFFFF",
//     marginBottom: 15,
//   },
//   stepsList: {
//     gap: 10,
//   },
//   stepItem: {
//     color: "#E0F2F2",
//     fontSize: 14,
//     lineHeight: 20,
//   },
//   sectionTitleMain: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#2D8C8C",
//     marginBottom: 15,
//   },
//   trackingCard: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 16,
//     padding: 20,
//     elevation: 2,
//   },
//   orderId: {
//     fontSize: 14,
//     color: "#4A4A4A",
//     marginBottom: 20,
//   },
//   trackingStatusRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 20,
//   },
//   statusItem: {
//     alignItems: "center",
//     gap: 8,
//   },
//   statusLabel: {
//     fontSize: 12,
//     color: "#4A4A4A",
//   },
//   progressBarBg: {
//     height: 8,
//     backgroundColor: "#E8E8E8",
//     borderRadius: 4,
//     width: "100%",
//   },
//   progressBarFill: {
//     height: "100%",
//     backgroundColor: "#2D8C8C",
//     borderRadius: 4,
//     width: "45%", // Dynamic width based on order progress
//   },
// });

// export default Dashboard;

import { useGetUserVendorStatisticsQuery } from "@/store/api/authApiSlice";
import { useGetOrdersQuery } from "@/store/api/orderApiSlice";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useTranslation } from "@/hooks/use-translation";
import { router } from "expo-router";
import { Bell, QrCode, Star, TrendingUp, Zap } from "lucide-react-native";
import React from "react";
import {
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
  const { data: ordersData = [] } = useGetOrdersQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

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

    return "User";
  }, [user]);

  const avatarUri =
    (user as any)?.buyer?.profilePhotoUrl ||
    (user as any)?.vendor?.logoUrl ||
    (user as any)?.vendor?.logo ||
    (user as any)?.avatar ||
    (user as any)?.image ||
    (user as any)?.logo ||
    "https://xsgames.co/randomusers/assets/avatars/male/74.jpg";

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

  return (
    <SafeAreaView style={styles.container}>
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
                    <Text style={styles.orderIdText}>{order?.orderNumber || `#${orderId}`}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
                      <Text style={[styles.statusText, { color: statusTheme.text }]}>{toTitle(status)}</Text>
                    </View>
                  </View>

                  <Text style={styles.orderAddress} numberOfLines={1}>
                    {order?.shippingAddress || t("address_unavailable", "Address unavailable")}
                  </Text>

                  <View style={styles.ratingRow}>
                    <Star color="#FFD700" size={16} fill="#FFD700" />
                    <Text style={styles.ratingText}>
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
            <Text style={{ fontSize: 13, color: "#6B7280" }}>{t("no_recent_orders_found", "No recent orders found.")}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF9" },
  header: {
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
    marginBottom: 25,
  },
  sectionTitleWhite: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  stepsList: { gap: 10 },
  stepItem: { color: "#E0F2F2", fontSize: 14, lineHeight: 20 },
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
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  statusBadge: {
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
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
