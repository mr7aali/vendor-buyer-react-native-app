import { useTranslation } from "@/hooks/use-translation";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { resolveAbsoluteUrl } from "@/services/apiConfig";
import {
  useConnectToVendorMutation,
  useGetExploreVendorsQuery,
} from "@/store/api/connectionApiSlice";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 52) / 2;

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

const ExploreGridSkeleton = () => (
  <View style={styles.grid}>
    {Array.from({ length: 6 }).map((_, index) => (
      <View key={`explore-skeleton-${index}`} style={styles.card}>
        <SkeletonBlock style={styles.cardImage} />
        <SkeletonBlock style={styles.skeletonTitle} />
        <SkeletonBlock style={styles.skeletonSubtitlePrimary} />
        <SkeletonBlock style={styles.skeletonSubtitleSecondary} />

        <View style={styles.metaRow}>
          <SkeletonBlock style={styles.skeletonMetaBadge} />
          <SkeletonBlock style={styles.skeletonMetaBadge} />
          <SkeletonBlock style={styles.skeletonMetaBadge} />
        </View>

        <SkeletonBlock style={styles.skeletonButton} />
      </View>
    ))}
  </View>
);

export default function ExploreScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = React.useState("");
  const [connectingVendorId, setConnectingVendorId] = React.useState("");
  const trimmedSearch = search.trim();

  const {
    data: exploreData,
    isLoading,
    isFetching,
    refetch,
  } = useGetExploreVendorsQuery(
    trimmedSearch ? { search: trimmedSearch } : undefined,
    { refetchOnMountOrArgChange: true },
  );
  const [connectToVendor] = useConnectToVendorMutation();

  const vendors = Array.isArray(exploreData)
    ? exploreData
    : Array.isArray((exploreData as any)?.items)
      ? (exploreData as any).items
      : [];

  const handleOpenChat = React.useCallback(
    (vendorLike: any) => {
      const target = resolveChatTargetFromVendor(vendorLike);
      if (!target.partnerId) {
        Alert.alert(
          t("error", "Error"),
          t("scan_failed_connect_qr", "Failed to connect via QR code"),
        );
        return;
      }

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
        if (
          /already connected/i.test(message) ||
          /buyer reconnected/i.test(message)
        ) {
          handleOpenChat(vendor);
          return;
        }

        console.error("Explore connect failed:", error);
        Alert.alert(
          t("error", "Error"),
          error?.data?.message ||
            t("scan_failed_connect_qr", "Failed to connect via QR code"),
        );
      } finally {
        setConnectingVendorId("");
      }
    },
    [connectToVendor, handleOpenChat, t],
  );

  const renderVendorCard = (vendor: any) => {
    const cardKey = normalizeId(vendor?.id || vendor?.vendorCode);
    const name = getVendorDisplayName(vendor);
    const subtitle = getVendorSubtitle(vendor);
    const imageUri = resolveAbsoluteUrl(vendor?.logoUrl);
    const rating = Number(vendor?.averageRating || 0).toFixed(1);
    const productsCount = Number(vendor?.counts?.products || 0);
    const categoriesCount = Number(vendor?.counts?.categories || 0);
    const isThisVendorConnecting = connectingVendorId === cardKey;

    return (
      <View key={cardKey} style={styles.card}>
        <Image
          source={{
            uri:
              imageUri ||
              "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
          }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        <Text style={styles.cardTitle} numberOfLines={2}>
          {name}
        </Text>

        <Text style={styles.cardSubtitle} numberOfLines={3}>
          {subtitle || t("explore_vendor_ready", "Ready to connect and chat")}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Ionicons name="star" size={13} color="#E4A11B" />
            <Text style={styles.metaBadgeText}>{rating}</Text>
          </View>
          <View style={styles.metaBadge}>
            <Ionicons name="cube-outline" size={13} color="#2B6E6F" />
            <Text style={styles.metaBadgeText}>{productsCount}</Text>
          </View>
          <View style={styles.metaBadge}>
            <Ionicons name="grid-outline" size={13} color="#2B6E6F" />
            <Text style={styles.metaBadgeText}>{categoriesCount}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.cardButton,
            vendor?.isConnected && styles.cardButtonConnected,
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
                styles.cardButtonText,
                vendor?.isConnected && styles.cardButtonTextConnected,
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={30} color="#333333" />
        </Pressable>
        <Text style={styles.title}>{t("explore", "Explore")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={20} color="#667085" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("manual_search_placeholder", "Search by name or vendor code")}
          placeholderTextColor="#98A2B3"
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading || isFetching ? (
          <ExploreGridSkeleton />
        ) : vendors.length ? (
          <View style={styles.grid}>{vendors.map(renderVendorCard)}</View>
        ) : (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              {t("explore_no_vendors", "No vendors found.")}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryText}>{t("retry", "Retry")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAF9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: "#F8FAF9",
  },
  backButton: {
    width: 36,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
  },
  headerSpacer: {
    width: 36,
  },
  searchWrap: {
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 4,
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E7E5",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
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
  cardImage: {
    width: "100%",
    height: 138,
    borderRadius: 18,
    backgroundColor: "#D9E8E6",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#101010",
    textAlign: "center",
    minHeight: 42,
    paddingHorizontal: 4,
  },
  skeletonTitle: {
    width: "76%",
    height: 16,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: "#667085",
    textAlign: "center",
    minHeight: 5,
    marginTop: 0,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  skeletonSubtitlePrimary: {
    width: "92%",
    height: 12,
    borderRadius: 6,
    alignSelf: "center",
    marginTop: 10,
  },
  skeletonSubtitleSecondary: {
    width: "72%",
    height: 12,
    borderRadius: 6,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 10,
  },
  skeletonMetaBadge: {
    flex: 1,
    minHeight: 30,
    borderRadius: 12,
  },
  metaBadge: {
    flex: 1,
    minHeight: 30,
    borderRadius: 12,
    backgroundColor: "#F4FBFA",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2B6E6F",
  },
  cardButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#6DA8A4",
    backgroundColor: "#ECFBF9",
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonButton: {
    minHeight: 48,
    borderRadius: 16,
  },
  cardButtonConnected: {
    backgroundColor: "#2B6E6F",
    borderColor: "#2B6E6F",
  },
  cardButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2B6E6F",
  },
  cardButtonTextConnected: {
    color: "#FFFFFF",
  },
  centerState: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateText: {
    color: "#667085",
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    minWidth: 110,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#ECFBF9",
    borderWidth: 1,
    borderColor: "#6DA8A4",
    justifyContent: "center",
    alignItems: "center",
  },
  retryText: {
    color: "#2B6E6F",
    fontWeight: "600",
  },
});
