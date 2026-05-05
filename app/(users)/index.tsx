

import { useGetProfileQuery, useGetUserVendorStatisticsQuery } from "@/store/api/authApiSlice";
import { SkeletonBlock } from "@/components/ui/skeleton";
import {
  useConnectToVendorMutation,
  useGetExploreVendorsQuery,
} from "@/store/api/connectionApiSlice";
import { useAppSelector } from "@/store/hooks";
import { resolveAbsoluteUrl } from "@/services/apiConfig";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useTranslation } from "@/hooks/use-translation";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Bell, QrCode, TrendingUp, Zap } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
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
const normalizeId = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);
const getVendorDisplayName = (vendor: any) =>
  String(
    vendor?.storename ||
      vendor?.businessName ||
      vendor?.fullName ||
      vendor?.name ||
      "Vendor",
  );
const getVendorSubtitle = (vendor: any) =>
  String(
    vendor?.businessDescription ||
      vendor?.storeDescription ||
      vendor?.address ||
      vendor?.vendorCode ||
      "",
  );
const resolveChatTargetFromVendor = (vendor: any) => ({
  partnerId: normalizeId(vendor?.userId || vendor?.vendor?.userId),
  vendorId: normalizeId(vendor?.id || vendor?.vendor?.id),
  name: getVendorDisplayName(vendor),
});

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
  const [connectingVendorId, setConnectingVendorId] = React.useState("");
  const {
    data: exploreData,
    isLoading: isExploreLoading,
    isFetching: isExploreFetching,
  } = useGetExploreVendorsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  });
  const [connectToVendor] = useConnectToVendorMutation();

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

  const previewVendors = React.useMemo(() => {
    const vendors = Array.isArray(exploreData)
      ? exploreData
      : Array.isArray((exploreData as any)?.items)
        ? (exploreData as any).items
        : [];
    return vendors.slice(0, 4);
  }, [exploreData]);

  const handleOpenChat = React.useCallback(
    (vendorLike: any) => {
      const target = resolveChatTargetFromVendor(vendorLike);
      if (!target.partnerId) return;

      router.push({
        pathname: "/(screens)/chat_box",
        params: {
          role: "buyer",
          partnerId: target.partnerId,
          vendorId: target.vendorId,
          conversationId: target.partnerId,
          fullname: target.name || t("scan_vendor", "Vendor"),
          name: target.name || t("scan_vendor", "Vendor"),
        },
      });
    },
    [t],
  );

  const handleConnect = React.useCallback(
    async (vendor: any) => {
      if (vendor?.isConnected) {
        handleOpenChat(vendor);
        return;
      }

      try {
        setConnectingVendorId(normalizeId(vendor?.id || vendor?.vendorCode));
        const response = await connectToVendor({
          vendorCode: String(vendor?.vendorCode || ""),
        }).unwrap();

        const connectedVendor =
          response?.data?.vendor ||
          response?.vendor ||
          response?.connection?.vendor ||
          response?.data?.vendorId ||
          response?.connection?.vendorId ||
          vendor;

        handleOpenChat({
          ...vendor,
          ...connectedVendor,
          isConnected: true,
        });
      } catch (error: any) {
        const message = String(error?.data?.message || "");
        if (/already connected/i.test(message) || /buyer reconnected/i.test(message)) {
          handleOpenChat(vendor);
        }
      } finally {
        setConnectingVendorId("");
      }
    },
    [connectToVendor, handleOpenChat],
  );

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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleMain}>{t("explore", "Explore")}</Text>
          <TouchableOpacity
            onPress={() => router.push("/(users)/explore")}
            activeOpacity={0.8}
          >
            <Text style={styles.viewAllText}>{t("view_all", "View All")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.previewGrid}>
          {(isExploreLoading || isExploreFetching
            ? Array.from({ length: 4 }).map((_, index) => (
                <View key={`preview-skeleton-${index}`} style={styles.previewCard}>
                  <SkeletonBlock style={styles.previewImage} />
                  <SkeletonBlock style={styles.previewTitle} />
                  <SkeletonBlock style={styles.previewSubtitlePrimary} />
                  <SkeletonBlock style={styles.previewSubtitleSecondary} />
                  <View style={styles.previewMetaRow}>
                    <SkeletonBlock style={styles.previewMetaBadge} />
                    <SkeletonBlock style={styles.previewMetaBadge} />
                  </View>
                  <SkeletonBlock style={styles.previewButtonSkeleton} />
                </View>
              ))
            : previewVendors.map((vendor: any) => {
                const cardKey = normalizeId(vendor?.id || vendor?.vendorCode);
                const name = getVendorDisplayName(vendor);
                const subtitle = getVendorSubtitle(vendor);
                const imageUri = resolveAbsoluteUrl(vendor?.logoUrl);
                const productsCount = Number(vendor?.counts?.products || 0);
                const categoriesCount = Number(vendor?.counts?.categories || 0);
                const isThisVendorConnecting = connectingVendorId === cardKey;

                return (
                  <View key={cardKey} style={styles.previewCard}>
                    <Image
                      source={{
                        uri:
                          imageUri ||
                          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
                      }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.previewCardTitle} numberOfLines={2}>
                      {name}
                    </Text>
                    <Text style={styles.previewCardSubtitle} numberOfLines={3}>
                      {subtitle || t("explore_vendor_ready", "Ready to connect and chat")}
                    </Text>
                    <View style={styles.previewMetaRow}>
                      <View style={styles.previewMetaBadgeSolid}>
                        <Text style={styles.previewMetaText}>{productsCount} Products</Text>
                      </View>
                      <View style={styles.previewMetaBadgeSolid}>
                        <Text style={styles.previewMetaText}>{categoriesCount} Categories</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.previewButton,
                        vendor?.isConnected && styles.previewButtonConnected,
                      ]}
                      activeOpacity={0.85}
                      disabled={isThisVendorConnecting}
                      onPress={() => handleConnect(vendor)}
                    >
                      {isThisVendorConnecting ? (
                        <ActivityIndicator
                          size="small"
                          color={vendor?.isConnected ? "#FFFFFF" : "#2B6E6F"}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.previewButtonText,
                            vendor?.isConnected && styles.previewButtonTextConnected,
                          ]}
                        >
                          {vendor?.isConnected
                            ? t("chat_title", "Chat")
                            : t("connect", "Connect")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }))}
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D8C8C",
  },
  sectionTitleMain: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D8C8C",
  },
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  previewCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: "#DDEBE8",
    shadowColor: "#6AA8A1",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  previewImage: {
    width: "100%",
    height: 138,
    borderRadius: 18,
    backgroundColor: "#D9E8E6",
    marginBottom: 14,
  },
  previewCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#101010",
    textAlign: "center",
    minHeight: 42,
    paddingHorizontal: 4,
  },
  previewCardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: "#667085",
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  previewMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 10,
  },
  previewMetaBadgeSolid: {
    flex: 1,
    minHeight: 30,
    borderRadius: 12,
    backgroundColor: "#F4FBFA",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  previewMetaText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2B6E6F",
  },
  previewButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#6DA8A4",
    backgroundColor: "#ECFBF9",
    justifyContent: "center",
    alignItems: "center",
  },
  previewButtonConnected: {
    backgroundColor: "#2B6E6F",
    borderColor: "#2B6E6F",
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2B6E6F",
  },
  previewButtonTextConnected: {
    color: "#FFFFFF",
  },
  previewTitle: {
    width: "76%",
    height: 16,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 2,
  },
  previewSubtitlePrimary: {
    width: "92%",
    height: 12,
    borderRadius: 6,
    alignSelf: "center",
    marginTop: 10,
  },
  previewSubtitleSecondary: {
    width: "72%",
    height: 12,
    borderRadius: 6,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  previewMetaBadge: {
    flex: 1,
    minHeight: 30,
    borderRadius: 12,
  },
  previewButtonSkeleton: {
    minHeight: 48,
    borderRadius: 16,
  },
});

export default Dashboard;
