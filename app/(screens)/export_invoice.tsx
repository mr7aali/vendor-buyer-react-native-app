import { useGetOrderByIdQuery } from '@/store/api/orderApiSlice';
import { useTranslation } from '@/hooks/use-translation';
import { MaterialIcons } from '@expo/vector-icons';
import { printToFileAsync } from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import { shareAsync } from 'expo-sharing';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const IMAGE_FALLBACK = 'https://via.placeholder.com/64';

const toNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: any) => `$${toNumber(value).toFixed(2)}`;
const getItems = (order: any) => (Array.isArray(order?.orderItems) ? order.orderItems : []);

export default function ExportInvoice() {
  const { language, t } = useTranslation();
  const { id } = useLocalSearchParams();
  const { data: order, isLoading } = useGetOrderByIdQuery(id as string, { skip: !id });
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const items = useMemo(() => getItems(order), [order]);
  const subtotal = toNumber(order?.subtotal);
  const tax = toNumber(order?.taxAmount, 0);
  const shipping = toNumber(order?.shippingCost, 0);
  const discount = toNumber(order?.discountAmount);
  const total = toNumber(order?.totalAmount);
  const ui = useMemo(() => {
    if (language === "he") {
      return {
        exportInvoice: "ייצוא חשבונית",
        vendor: "ספק",
        addressUnavailable: "כתובת לא זמינה",
        addressNotAvailable: "כתובת לא זמינה",
        invoiceId: "מזהה חשבונית",
        orderId: "מזהה הזמנה",
        orderItems: "פריטי הזמנה",
        paymentDetails: "פרטי תשלום",
        subtotal: "סכום ביניים",
        tax: "מס",
        shipping: "משלוח",
        discount: "הנחה",
        total: "סה\"כ",
        invoiceTotal: "סה\"כ חשבונית",
        dateIssued: "תאריך הנפקה",
        from: "מאת",
        billTo: "חיוב אל",
        paymentDate: "תאריך תשלום",
        customer: "לקוח",
        product: "מוצר",
        orderNotFound: "ההזמנה לא נמצאה",
        downloadInvoice: "הורד חשבונית",
        downloadInvoiceQ: "להוריד חשבונית?",
        generatePdfNow: "צור PDF ושתף את החשבונית עכשיו.",
        nA: "לא זמין",
      };
    }
    if (language === "hi") {
      return {
        exportInvoice: "इनवॉइस एक्सपोर्ट",
        vendor: "वेंडर",
        addressUnavailable: "पता उपलब्ध नहीं",
        addressNotAvailable: "पता उपलब्ध नहीं",
        invoiceId: "इनवॉइस आईडी",
        orderId: "ऑर्डर आईडी",
        orderItems: "ऑर्डर आइटम्स",
        paymentDetails: "भुगतान विवरण",
        subtotal: "उपकुल",
        tax: "टैक्स",
        shipping: "शिपिंग",
        discount: "छूट",
        total: "कुल",
        invoiceTotal: "इनवॉइस कुल",
        dateIssued: "जारी तिथि",
        from: "से",
        billTo: "बिल टू",
        paymentDate: "भुगतान तिथि",
        customer: "ग्राहक",
        product: "प्रोडक्ट",
        orderNotFound: "ऑर्डर नहीं मिला",
        downloadInvoice: "इनवॉइस डाउनलोड करें",
        downloadInvoiceQ: "इनवॉइस डाउनलोड करें?",
        generatePdfNow: "PDF बनाकर अभी यह इनवॉइस शेयर करें।",
        nA: "N/A",
      };
    }
    return {
      exportInvoice: "Export invoice",
      vendor: "Vendor",
      addressUnavailable: "Address unavailable",
      addressNotAvailable: "Address not available",
      invoiceId: "Invoice ID",
      orderId: "Order ID",
      orderItems: "Order items",
      paymentDetails: "Payment details",
      subtotal: "Subtotal",
      tax: "Tax",
      shipping: "Shipping",
      discount: "Discount",
      total: "Total",
      invoiceTotal: "Invoice Total",
      dateIssued: "Date Issued",
      from: "From",
      billTo: "Bill to",
      paymentDate: "Payment Date",
      customer: "Customer",
      product: "Product",
      orderNotFound: "Order not found",
      downloadInvoice: "Download Invoice",
      downloadInvoiceQ: "Download Invoice?",
      generatePdfNow: "Generate PDF and share this invoice now.",
      nA: "N/A",
    };
  }, [language]);

  const invoiceId = `INV-${String(order?.id || '').slice(-6).toUpperCase() || '000001'}`;

  const makeHtml = () => {
    const itemRows = items
      .map((item: any) => {
        const name = item?.product?.name || ui.product;
        const price = formatMoney(item?.unitPrice || item?.totalPrice);
        const qty = item?.quantity || 1;
        return `
          <tr>
            <td style="padding:8px 0;">${name}<br/><span style="font-size:11px;color:#6f7d86;">x${qty}</span></td>
            <td style="text-align:right;padding:8px 0;">${price}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #1f2a30; }
          .card { border: 1px solid #dfe7ea; border-radius: 10px; padding: 14px; margin-bottom: 12px; }
          .title { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
          .muted { color: #6d7a83; font-size: 12px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 7px; }
          table { width: 100%; border-collapse: collapse; }
          .total { font-size: 16px; font-weight: 700; border-top: 1px dashed #cfd8dd; padding-top: 8px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="title">${ui.exportInvoice}</div>
        <div class="card">
          <div style="font-weight:700;">${order?.vendor?.storename || order?.vendor?.fullName || ui.vendor}</div>
          <div class="muted">${order?.shippingAddress || ui.addressNotAvailable}</div>
          <div class="row" style="margin-top:10px;"><span class="muted">${ui.invoiceId}</span><span>${invoiceId}</span></div>
          <div class="row"><span class="muted">${ui.orderId}</span><span>${order?.orderNumber || order?.id}</span></div>
        </div>
        <div class="card">
          <div style="font-weight:700;margin-bottom:8px;">${ui.orderItems}</div>
          <table>${itemRows}</table>
        </div>
        <div class="card">
          <div style="font-weight:700;margin-bottom:8px;">${ui.paymentDetails}</div>
          <div class="row"><span>${ui.subtotal}</span><span>${formatMoney(subtotal)}</span></div>
          <div class="row"><span>${ui.tax}</span><span>${formatMoney(tax)}</span></div>
          <div class="row"><span>${ui.shipping}</span><span>${formatMoney(shipping)}</span></div>
          <div class="row"><span>${ui.discount}</span><span>${formatMoney(discount)}</span></div>
          <div class="row total"><span>${ui.total}</span><span>${formatMoney(total)}</span></div>
        </div>
      </body>
      </html>
    `;
  };

  const onConfirmDownload = async () => {
    try {
      setIsGenerating(true);
      const html = makeHtml();
      const { uri } = await printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      setShowDownloadModal(false);
    } catch (error) {
      console.error('Invoice generation failed', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#278687" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>{ui.orderNotFound}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios-new" size={20} color="#1f2a30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{ui.exportInvoice}</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.vendorCard}>
          <Image source={{ uri: order?.vendor?.logoUrl || IMAGE_FALLBACK }} style={styles.vendorLogo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.vendorTitle}>{order?.vendor?.storename || order?.vendor?.fullName || ui.vendor}</Text>
            <Text style={styles.vendorSub}>{order?.shippingAddress || ui.addressUnavailable}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.smallMuted}>{ui.invoiceTotal}</Text>
            <Text style={styles.totalStrong}>{formatMoney(total)}</Text>
          </View>
        </View>

        <View style={styles.metaCard}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>{ui.dateIssued}</Text>
            <Text style={styles.metaValue}>{order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : ui.nA}</Text>
            <Text style={styles.metaValue}>{order?.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ''}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>{ui.from}</Text>
            <Text style={styles.metaValue}>{order?.vendor?.storename || order?.vendor?.fullName || ui.vendor}</Text>
            <Text style={styles.metaValue} numberOfLines={2}>{order?.vendor?.address || ui.nA}</Text>
          </View>
        </View>

        <View style={styles.metaCard}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>{ui.billTo}</Text>
            <Text style={styles.metaValue}>{order?.buyer?.fullName || ui.customer}</Text>
            <Text style={styles.metaValue}>{order?.buyer?.phone || ''}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>{ui.orderId}</Text>
            <Text style={styles.metaValue}>{order?.orderNumber || order?.id}</Text>
            <Text style={styles.metaLabel}>{ui.paymentDate}</Text>
            <Text style={styles.metaValue}>{order?.payment?.createdAt ? new Date(order.payment.createdAt).toLocaleString() : ui.nA}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{ui.orderItems}</Text>
          {items.map((item: any) => (
            <View key={item?.id} style={styles.lineItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item?.product?.name || ui.product}</Text>
                <Text style={styles.itemMeta}>x{item?.quantity || 1}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatMoney(item?.unitPrice || item?.totalPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{ui.paymentDetails}</Text>
          <View style={styles.paymentRow}><Text style={styles.paymentLabel}>{ui.subtotal}</Text><Text style={styles.paymentValue}>{formatMoney(subtotal)}</Text></View>
          <View style={styles.paymentRow}><Text style={styles.paymentLabel}>{ui.tax}</Text><Text style={styles.paymentValue}>{formatMoney(tax)}</Text></View>
          <View style={styles.paymentRow}><Text style={styles.paymentLabel}>{ui.shipping}</Text><Text style={styles.paymentValue}>{formatMoney(shipping)}</Text></View>
          <View style={styles.paymentRow}><Text style={styles.paymentLabel}>{ui.discount}</Text><Text style={styles.paymentValue}>{formatMoney(discount)}</Text></View>
          <View style={styles.dashed} />
          <View style={styles.paymentRow}><Text style={styles.totalLabel}>{ui.total}</Text><Text style={styles.totalLabel}>{formatMoney(total)}</Text></View>
        </View>

        <TouchableOpacity style={styles.downloadBtn} onPress={() => setShowDownloadModal(true)}>
          <MaterialIcons name="download" size={18} color="#FFFFFF" />
          <Text style={styles.downloadBtnText}>{ui.downloadInvoice}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showDownloadModal} transparent animationType="fade" onRequestClose={() => setShowDownloadModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{ui.downloadInvoiceQ}</Text>
            <Text style={styles.modalSub}>{ui.generatePdfNow}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalGhost} onPress={() => setShowDownloadModal(false)}>
                <Text style={styles.modalGhostText}>{t("cancel", "Cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSolid} onPress={onConfirmDownload} disabled={isGenerating}>
                {isGenerating ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSolidText}>{t("confirm", "Confirm")}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F6F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F6F5' },
  header: { direction: 'ltr', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1f2a30' },
  content: { paddingHorizontal: 14, paddingBottom: 24 },
  vendorCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E8EB', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  vendorLogo: { width: 44, height: 44, borderRadius: 22, marginRight: 10, backgroundColor: '#E7EDF0' },
  vendorTitle: { fontSize: 14, fontWeight: '700', color: '#1f2a30' },
  vendorSub: { fontSize: 11, color: '#6f7d86', marginTop: 2 },
  smallMuted: { fontSize: 10, color: '#7f8b93' },
  totalStrong: { fontSize: 16, fontWeight: '800', color: '#1f2a30' },
  metaCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E8EB', borderRadius: 12, padding: 12, flexDirection: 'row', marginBottom: 10 },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 11, color: '#6f7d86', marginBottom: 2 },
  metaValue: { fontSize: 12, color: '#1f2a30', marginBottom: 2 },
  sectionCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E8EB', borderRadius: 12, padding: 12, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2a30', marginBottom: 8 },
  lineItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  itemName: { fontSize: 13, color: '#1f2a30', fontWeight: '600' },
  itemMeta: { fontSize: 11, color: '#6f7d86', marginTop: 1 },
  itemPrice: { fontSize: 13, color: '#1f2a30', fontWeight: '700' },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  paymentLabel: { fontSize: 13, color: '#6f7d86' },
  paymentValue: { fontSize: 13, color: '#1f2a30', fontWeight: '600' },
  dashed: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD6DB', marginVertical: 6 },
  totalLabel: { fontSize: 15, color: '#1f2a30', fontWeight: '700' },
  downloadBtn: { height: 46, borderRadius: 12, backgroundColor: '#278687', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 6 },
  downloadBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#202A30', textAlign: 'center' },
  modalSub: { fontSize: 13, color: '#64717A', textAlign: 'center', marginTop: 6 },
  modalActions: { flexDirection: 'row', marginTop: 14, gap: 10 },
  modalGhost: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1.3, borderColor: '#D7E0E4', justifyContent: 'center', alignItems: 'center' },
  modalGhostText: { color: '#4E5B64', fontWeight: '600' },
  modalSolid: { flex: 1, height: 40, borderRadius: 10, backgroundColor: '#278687', justifyContent: 'center', alignItems: 'center' },
  modalSolidText: { color: '#fff', fontWeight: '700' },
});
