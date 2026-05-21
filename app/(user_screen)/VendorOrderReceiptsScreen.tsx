import { useTranslation } from "@/hooks/use-translation";
import { useGetOrdersQuery } from "@/store/api/orderApiSlice";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ReceiptSummary = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  subtotal?: number;
  itemCount?: number;
  customerNote?: string;
  termsAccepted?: boolean;
  vendor?: {
    id?: string;
    name?: string;
    logoUrl?: string;
  };
};

const formatMoney = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const getStatusColors = (status: string) => {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "processing" || normalized === "completed") {
    return { backgroundColor: "#E8F8EF", color: "#1E8E46" };
  }
  if (normalized === "shipped" || normalized === "delivered") {
    return { backgroundColor: "#EAF4FF", color: "#1666C5" };
  }
  if (normalized === "cancelled") {
    return { backgroundColor: "#FFF0F0", color: "#D83A3A" };
  }
  return { backgroundColor: "#FFF6E7", color: "#A86A00" };
};

const getVendorName = (order: any) =>
  String(
    order?.vendor?.storename ||
      order?.vendor?.businessName ||
      order?.vendor?.fullName ||
      order?.vendor?.name ||
      "Vendor",
  );

const getMergedReceipt = (fallback: ReceiptSummary, liveOrder: any): ReceiptSummary => {
  if (!liveOrder) return fallback;

  return {
    ...fallback,
    id: String(liveOrder?.id || fallback.id),
    orderNumber: String(liveOrder?.orderNumber || fallback.orderNumber),
    status: String(liveOrder?.status || fallback.status),
    totalAmount: Number(liveOrder?.totalAmount || fallback.totalAmount || 0),
    subtotal: Number(liveOrder?.subtotal || fallback.subtotal || 0),
    itemCount: Number(
      liveOrder?.orderItems?.reduce(
        (sum: number, item: any) => sum + Number(item?.quantity || 0),
        0,
      ) ||
        fallback.itemCount ||
        0,
    ),
    customerNote: String(
      liveOrder?.customerNote || fallback.customerNote || "",
    ).trim(),
    termsAccepted:
      liveOrder?.termsAccepted === true || fallback.termsAccepted === true,
    vendor: {
      id: String(liveOrder?.vendor?.id || fallback.vendor?.id || ""),
      name: getVendorName(liveOrder) || fallback.vendor?.name || "Vendor",
      logoUrl: String(
        liveOrder?.vendor?.logoUrl || fallback.vendor?.logoUrl || "",
      ),
    },
  };
};

export default function VendorOrderReceiptsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ orders?: string | string[]; notice?: string | string[] }>();
  const serializedOrders = Array.isArray(params.orders)
    ? params.orders[0]
    : params.orders;
  const notice = Array.isArray(params.notice) ? params.notice[0] : params.notice;

  const parsedOrders = useMemo<ReceiptSummary[]>(() => {
    if (!serializedOrders) return [];

    try {
      const decoded = decodeURIComponent(serializedOrders);
      const payload = JSON.parse(decoded);
      return Array.isArray(payload) ? payload : [];
    } catch {
      return [];
    }
  }, [serializedOrders]);

  const createdOrderIds = useMemo(
    () => parsedOrders.map((order) => order.id).filter(Boolean),
    [parsedOrders],
  );

  const { data: liveOrders = [] } = useGetOrdersQuery(undefined, {
    skip: createdOrderIds.length === 0,
  });

  const liveOrdersById = useMemo(() => {
    const entries: [string, any][] = (Array.isArray(liveOrders)
      ? liveOrders
      : []
    ).map((order) => [String(order?.id || ""), order]);
    return new Map<string, any>(entries);
  }, [liveOrders]);

  const receipts = useMemo(
    () =>
      parsedOrders.map((order) =>
        getMergedReceipt(order, liveOrdersById.get(order.id)),
      ),
    [parsedOrders, liveOrdersById],
  );

  const receiptTotal = receipts.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0,
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={24} color="#1C252B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("receipt_hub_title", "Vendor receipts")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>
            {t(
              "receipt_hub_heading",
              "Your vendor orders are ready",
            )}
          </Text>
          <Text style={styles.heroText}>
            {t(
              "receipt_hub_copy",
              "Each receipt below belongs to a separate vendor order. View it in-app, download the PDF, or pay that order independently.",
            )}
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{receipts.length}</Text>
              <Text style={styles.heroStatLabel}>
                {t("receipt_hub_receipts", "Receipts")}
              </Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{formatMoney(receiptTotal)}</Text>
              <Text style={styles.heroStatLabel}>
                {t("chat_total_label", "Total")}
              </Text>
            </View>
          </View>
        </View>

        {notice ? (
          <View style={styles.noticeCard}>
            <Ionicons name="alert-circle-outline" size={18} color="#A86A00" />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {receipts.map((receipt) => {
          const statusColors = getStatusColors(receipt.status);
          const normalizedStatus = String(receipt.status || "pending");

          return (
            <View key={receipt.id || receipt.orderNumber} style={styles.receiptCard}>
              <View style={styles.receiptHeader}>
                <View style={styles.receiptVendorWrap}>
                  <View style={styles.receiptVendorIcon}>
                    <Ionicons name="receipt-outline" size={18} color="#2A8383" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.receiptVendorName}>
                      {receipt.vendor?.name || t("info_vendor_fallback", "Vendor")}
                    </Text>
                    <Text style={styles.receiptOrderNumber}>
                      #{receipt.orderNumber || receipt.id}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColors.backgroundColor },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusColors.color }]}>
                    {normalizedStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>
                  {t("receipt_hub_items", "Items")}
                </Text>
                <Text style={styles.metaValue}>{receipt.itemCount || 0}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>
                  {t("order_details_subtotal", "Subtotal")}
                </Text>
                <Text style={styles.metaValue}>
                  {formatMoney(Number(receipt.subtotal || receipt.totalAmount || 0))}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>
                  {t("chat_total_label", "Total")}
                </Text>
                <Text style={styles.metaTotal}>
                  {formatMoney(Number(receipt.totalAmount || 0))}
                </Text>
              </View>

              {receipt.customerNote ? (
                <View style={styles.noteBlock}>
                  <Text style={styles.noteLabel}>
                    {t("info_vendor_note", "Note for this vendor")}
                  </Text>
                  <Text style={styles.noteText} numberOfLines={3}>
                    {receipt.customerNote}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.termsStatus}>
                {receipt.termsAccepted
                  ? t(
                      "receipt_hub_terms_accepted",
                      "Terms accepted for this vendor order",
                    )
                  : t(
                      "receipt_hub_terms_missing",
                      "Terms were not recorded for this order",
                    )}
              </Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryAction]}
                  onPress={() =>
                    router.push({
                      pathname: "/(user_screen)/OrderDetails",
                      params: { id: receipt.id },
                    })
                  }
                >
                  <Text style={styles.secondaryActionText}>
                    {t("receipt_hub_view_receipt", "View receipt")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryAction]}
                  onPress={() =>
                    router.push({
                      pathname: "/(user_screen)/ExportInvoiceScreen",
                      params: { id: receipt.id },
                    })
                  }
                >
                  <Text style={styles.secondaryActionText}>
                    {t("receipt_hub_download", "Download")}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() =>
                  router.push({
                    pathname: "/(user_screen)/stripePaymentScreen",
                    params: { orderId: receipt.id },
                  })
                }
              >
                <Text style={styles.primaryActionText}>
                  {String(receipt.status || "").toLowerCase() === "pending"
                    ? t("receipt_hub_pay_now", "Pay this order")
                    : t("receipt_hub_open_order", "Open payment details")}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {receipts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {t("receipt_hub_empty_title", "No receipts available")}
            </Text>
            <Text style={styles.emptyText}>
              {t(
                "receipt_hub_empty_copy",
                "We could not load the created vendor orders from this checkout.",
              )}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace("/(users)")}
        >
          <Text style={styles.homeButtonText}>
            {t("receipt_hub_back_home", "Back to home")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F8F7" },
  header: {
    direction: "ltr",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1C252B" },
  headerSpacer: { width: 34 },
  content: { paddingHorizontal: 14, paddingBottom: 24 },
  heroCard: {
    backgroundColor: "#103C39",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  heroTitle: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  heroText: {
    color: "#D8ECEA",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  heroStat: { flex: 1 },
  heroStatValue: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  heroStatLabel: { fontSize: 12, color: "#C7DFDD", marginTop: 2 },
  heroDivider: {
    width: 1,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginHorizontal: 12,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF6E7",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F2D7A6",
    marginBottom: 12,
  },
  noticeText: {
    flex: 1,
    marginLeft: 10,
    color: "#805400",
    fontSize: 13,
    lineHeight: 19,
  },
  receiptCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E1E8E7",
    padding: 14,
    marginBottom: 12,
  },
  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  receiptVendorWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  receiptVendorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F3F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  receiptVendorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#203130",
  },
  receiptOrderNumber: {
    fontSize: 12,
    color: "#70807E",
    marginTop: 3,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metaLabel: { fontSize: 13, color: "#697A78" },
  metaValue: { fontSize: 13, fontWeight: "600", color: "#203130" },
  metaTotal: { fontSize: 15, fontWeight: "700", color: "#203130" },
  noteBlock: {
    backgroundColor: "#F7FAF9",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  noteLabel: { fontSize: 12, fontWeight: "700", color: "#435655" },
  noteText: { fontSize: 13, color: "#516462", lineHeight: 19, marginTop: 6 },
  termsStatus: {
    fontSize: 12,
    color: "#5F7472",
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    minHeight: 42,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  secondaryAction: {
    backgroundColor: "#F4F7F7",
    borderWidth: 1,
    borderColor: "#DFE8E6",
  },
  secondaryActionText: {
    color: "#304140",
    fontSize: 13,
    fontWeight: "600",
  },
  primaryAction: {
    marginTop: 10,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#2A8383",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryActionText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E1E8E7",
    padding: 18,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#203130" },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#637573",
  },
  homeButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#123C39",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  homeButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
