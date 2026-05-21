import { useGetOrderByIdQuery } from "@/store/api/orderApiSlice";
import { useTranslation } from "@/hooks/use-translation";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const toNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: any) => `$${toNumber(value).toFixed(2)}`;
const getItems = (order: any) =>
  Array.isArray(order?.orderItems) ? order.orderItems : [];
const escapeHtml = (value: any) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export default function ExportInvoiceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { data: order, isLoading } = useGetOrderByIdQuery(id as string, {
    skip: !id,
  });

  const items = useMemo(() => getItems(order), [order]);
  const subtotal = toNumber(order?.subtotal);
  const tax = toNumber(order?.taxAmount, 0);
  const shipping = toNumber(order?.shippingCost, 0);
  const discount = toNumber(order?.discountAmount);
  const total = toNumber(order?.totalAmount);
  const showTax = tax > 0;
  const showShipping = shipping > 0;
  const showDiscount = discount > 0;
  const vendorName =
    order?.vendor?.storename || order?.vendor?.fullName || t("info_vendor_fallback", "Vendor");

  const labels = {
    title: t("invoice_title", "Export invoice"),
    store: t("invoice_store", "Store"),
    orderId: t("invoice_order_id", "Order ID"),
    invoiceTotal: t("invoice_total", "Invoice total"),
    orderItems: t("order_details_order_items", "Order items"),
    paymentDetails: t("order_details_payment_details", "Payment details"),
    subtotal: t("order_details_subtotal", "Subtotal"),
    tax: t("order_details_tax", "Tax"),
    shipping: t("order_details_shipping", "Shipping"),
    discount: t("order_details_discount", "Discount"),
    total: t("chat_total_label", "Total"),
    orderNotFound: t("order_details_not_found", "Order not found"),
    downloadReceipt: t("invoice_download", "Download Receipt"),
    dateIssued: t("invoice_date_issued", "Date issued"),
    from: t("invoice_from", "From"),
    billTo: t("invoice_bill_to", "Bill to"),
    paymentDate: t("invoice_payment_date", "Payment date"),
    customer: t("invoice_customer", "Customer"),
    addressUnavailable: t("invoice_address_unavailable", "Address unavailable"),
    product: t("invoice_product", "Product"),
    nA: t("orders_na", "N/A"),
    failedDownload: t("invoice_failed_download", "Unable to generate or download the receipt."),
    shippingAddress: t("order_details_shipping_address", "Shipping address"),
    vendorNote: t("info_vendor_note", "Note for this vendor"),
    termsStatus: t("order_details_terms_status", "Terms status"),
    termsAccepted: t("order_details_terms_accepted", "Accepted during checkout"),
    termsMissing: t("order_details_terms_missing", "Not recorded"),
  };

  const handleDownloadReceipt = async () => {
    if (!order) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1f2a30; }
            .card { border: 1px solid #dbe5e9; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 6px; gap: 12px; }
            .title { font-weight: 700; margin-bottom: 8px; }
            .text { color: #52616a; line-height: 1.5; }
            .dash { border-top: 1px dashed #cdd8dd; margin: 8px 0; }
          </style>
        </head>
        <body>
          <h2>${escapeHtml(labels.title)}</h2>
          <div class="card">
            <div class="row"><span>${escapeHtml(labels.store)}</span><span>${escapeHtml(vendorName)}</span></div>
            <div class="row"><span>${escapeHtml(labels.orderId)}</span><span>${escapeHtml(order?.orderNumber || order?.id)}</span></div>
            <div class="row"><span>${escapeHtml(labels.invoiceTotal)}</span><span>${formatMoney(total)}</span></div>
          </div>
          <div class="card">
            <div class="title">${escapeHtml(labels.orderItems)}</div>
            ${items
              .map(
                (item: any) => `
              <div class="row">
                <span>${escapeHtml(item?.product?.name || labels.product)} x${item?.quantity || 1}</span>
                <span>${formatMoney(item?.unitPrice || item?.totalPrice)}</span>
              </div>
            `,
              )
              .join("")}
          </div>
          <div class="card">
            <div class="title">${escapeHtml(labels.shippingAddress)}</div>
            <div class="text">${escapeHtml(order?.shippingAddress || labels.addressUnavailable)}</div>
            ${
              order?.customerNote
                ? `<div class="dash"></div><div class="title">${escapeHtml(
                    labels.vendorNote,
                  )}</div><div class="text">${escapeHtml(order.customerNote)}</div>`
                : ""
            }
            <div class="dash"></div>
            <div class="row"><span>${escapeHtml(labels.termsStatus)}</span><span>${escapeHtml(
              order?.termsAccepted ? labels.termsAccepted : labels.termsMissing,
            )}</span></div>
          </div>
          <div class="card">
            <div class="title">${escapeHtml(labels.paymentDetails)}</div>
            <div class="row"><span>${escapeHtml(labels.subtotal)}</span><span>${formatMoney(subtotal)}</span></div>
            ${showTax ? `<div class="row"><span>${escapeHtml(labels.tax)}</span><span>${formatMoney(tax)}</span></div>` : ""}
            ${showShipping ? `<div class="row"><span>${escapeHtml(labels.shipping)}</span><span>${formatMoney(shipping)}</span></div>` : ""}
            ${showDiscount ? `<div class="row"><span>${escapeHtml(labels.discount)}</span><span>${formatMoney(discount)}</span></div>` : ""}
            <div class="dash"></div>
            <div class="row"><strong>${escapeHtml(labels.total)}</strong><strong>${formatMoney(total)}</strong></div>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } catch (error) {
      Alert.alert(t("error", "Error"), labels.failedDownload);
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2A8C8B" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>{labels.orderNotFound}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1C252B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{labels.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorName}>{vendorName}</Text>
              <Text style={styles.smallText} numberOfLines={2}>
                {order?.vendor?.address || labels.addressUnavailable}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>{labels.invoiceTotal}</Text>
              <Text style={styles.invoiceTotal}>{formatMoney(total)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.label}>{labels.dateIssued}</Text>
              <Text style={styles.value}>
                {order?.createdAt
                  ? new Date(order.createdAt).toLocaleDateString()
                  : labels.nA}
              </Text>
              <Text style={styles.value}>
                {order?.createdAt
                  ? new Date(order.createdAt).toLocaleTimeString()
                  : ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>{labels.from}</Text>
              <Text style={styles.value}>{vendorName}</Text>
              <Text style={styles.smallText}>{order?.vendor?.country || ""}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.label}>{labels.billTo}</Text>
              <Text style={styles.value}>
                {order?.buyer?.fullName || labels.customer}
              </Text>
              <Text style={styles.smallText}>{order?.buyer?.phone || ""}</Text>
              <Text style={styles.smallText}>
                {order?.shippingAddress || labels.addressUnavailable}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>{labels.orderId}</Text>
              <Text style={styles.value}>{order?.orderNumber || order?.id}</Text>
              <Text style={styles.label}>{labels.paymentDate}</Text>
              <Text style={styles.smallText}>
                {order?.payment?.createdAt
                  ? new Date(order.payment.createdAt).toLocaleString()
                  : labels.nA}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>{labels.orderItems}</Text>
          {items.map((item: any) => (
            <View key={item?.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {item?.product?.name || labels.product}
                </Text>
                <Text style={styles.itemMeta}>x{item?.quantity || 1}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatMoney(item?.unitPrice || item?.totalPrice)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>{labels.shippingAddress}</Text>
          <Text style={styles.notesText}>
            {order?.shippingAddress || labels.addressUnavailable}
          </Text>

          {order?.customerNote ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>{labels.vendorNote}</Text>
              <Text style={styles.notesText}>{order.customerNote}</Text>
            </>
          ) : null}

          <View style={styles.divider} />
          <View style={styles.paymentRow}>
            <Text style={styles.label}>{labels.termsStatus}</Text>
            <Text style={styles.value}>
              {order?.termsAccepted ? labels.termsAccepted : labels.termsMissing}
            </Text>
          </View>

          <View style={styles.dashed} />

          <Text style={styles.sectionTitle}>{labels.paymentDetails}</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.label}>{labels.subtotal}</Text>
            <Text style={styles.value}>{formatMoney(subtotal)}</Text>
          </View>
          {showTax ? (
            <View style={styles.paymentRow}>
              <Text style={styles.label}>{labels.tax}</Text>
              <Text style={styles.value}>{formatMoney(tax)}</Text>
            </View>
          ) : null}
          {showShipping ? (
            <View style={styles.paymentRow}>
              <Text style={styles.label}>{labels.shipping}</Text>
              <Text style={styles.value}>{formatMoney(shipping)}</Text>
            </View>
          ) : null}
          {showDiscount ? (
            <View style={styles.paymentRow}>
              <Text style={styles.label}>{labels.discount}</Text>
              <Text style={styles.value}>{formatMoney(discount)}</Text>
            </View>
          ) : null}
          <View style={styles.dashed} />
          <View style={styles.paymentRow}>
            <Text style={styles.totalLabel}>{labels.total}</Text>
            <Text style={styles.totalLabel}>{formatMoney(total)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadReceipt}>
          <Ionicons name="download-outline" size={20} color="#FFF" />
          <Text style={styles.downloadButtonText}>{labels.downloadReceipt}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F7F6" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F7F6",
  },
  header: {
    direction: "ltr",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1C252B" },
  content: { paddingHorizontal: 14, paddingBottom: 24 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E8EB",
    padding: 12,
    marginBottom: 10,
  },
  vendorName: { fontSize: 14, fontWeight: "700", color: "#1F2A30" },
  smallText: { fontSize: 11, color: "#7A8891", marginTop: 2 },
  label: { fontSize: 11, color: "#6F7D86" },
  value: {
    fontSize: 12,
    color: "#1F2A30",
    fontWeight: "600",
    marginTop: 2,
  },
  invoiceTotal: { fontSize: 18, fontWeight: "700", color: "#1F2A30" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  divider: { height: 1, backgroundColor: "#E8EEF1", marginVertical: 10 },
  dashed: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#CDD8DD",
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2A30",
    marginBottom: 8,
  },
  notesText: { fontSize: 12, color: "#516068", lineHeight: 18 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemName: { fontSize: 13, color: "#1F2A30" },
  itemMeta: { fontSize: 11, color: "#7A8891" },
  itemPrice: { fontSize: 13, fontWeight: "700", color: "#1F2A30" },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalLabel: { fontSize: 15, fontWeight: "700", color: "#1F2A30" },
  downloadButton: {
    backgroundColor: "#2A8C8B",
    height: 46,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  downloadButtonText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
