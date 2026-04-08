import { useTranslation } from '@/hooks/use-translation';
import { useGetOrderByIdQuery, useUpdateOrderStatusMutation } from '@/store/api/orderApiSlice';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, I18nManager, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const IMAGE_FALLBACK = 'https://via.placeholder.com/72';

const toNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: any) => `$${toNumber(value).toFixed(2)}`;
const getItems = (order: any) => (Array.isArray(order?.orderItems) ? order.orderItems : []);
const normalizeStatus = (value: any) => String(value || 'pending').toLowerCase();

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const statusTheme = (status: string) => {
  const map: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#FFF4E5', text: '#C27A22' },
    processing: { bg: '#E8F1FF', text: '#2A66BF' },
    shipped: { bg: '#F1EDFF', text: '#6D49B8' },
    delivered: { bg: '#E7F8ED', text: '#1F9254' },
    completed: { bg: '#E7F8ED', text: '#1F9254' },
    cancelled: { bg: '#FDEBED', text: '#D34550' },
  };
  return map[status] || { bg: '#EEF2F4', text: '#56636B' };
};

export default function OrderDetails() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const { data: order, isLoading, error, refetch } = useGetOrderByIdQuery(id as string, { skip: !id });
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const items = useMemo(() => getItems(order), [order]);
  const status = normalizeStatus(order?.status);
  const theme = statusTheme(status);

  const subtotal = toNumber(order?.subtotal);
  const discount = toNumber(order?.discountAmount);
  const total = toNumber(order?.totalAmount);
  const shipping = toNumber(order?.shippingCost, 0);
  const tax = toNumber(order?.taxAmount, 0);

  const timeline = useMemo(() => {
    const created = order?.createdAt ? new Date(order.createdAt) : null;
    return [
      { title: t('order_details_timeline_created', 'Order Created'), time: created },
      { title: t(`orders_filter_${status}`, status.charAt(0).toUpperCase() + status.slice(1)), time: order?.updatedAt ? new Date(order.updatedAt) : created },
    ];
  }, [order, status, t]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#278687" />
      </SafeAreaView>
    );
  }

  if (!order || error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ color: '#2B3439' }}>{t('order_details_not_found', 'Order not found')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 10 }}>
          <Text style={{ color: '#278687' }}>{t('product_details_go_back', 'Go Back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleStatusUpdate = async (nextStatus: string) => {
    try {
      await updateStatus({ id: id as string, status: nextStatus }).unwrap();
      await refetch();
      setShowUpdateStatusModal(false);
      setShowCancelModal(false);
      Alert.alert(t('success', 'Success'), t('order_details_status_updated', 'Order status updated'));
    } catch (err: any) {
      Alert.alert(t('error', 'Error'), err?.data?.message || t('order_details_failed_update_status', 'Failed to update status'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios-new" size={20} color="#202427" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('orders_title', 'Orders')} #{order?.orderNumber || order?.id}</Text>
        <TouchableOpacity
          style={styles.downloadFab}
          onPress={() => router.push({ pathname: '/(screens)/export_invoice', params: { id: order?.id || order?._id } })}
        >
          <Feather name="download" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.customerCard}>
          <View style={styles.customerRow}>
            <Image source={{ uri: order?.buyer?.profilePhotoUrl || IMAGE_FALLBACK }} style={styles.customerAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{order?.buyer?.fullName || t('orders_customer_fallback', 'Customer')}</Text>
              <Text style={styles.customerId}>ID: {order?.buyer?.id || t('orders_na', 'N/A')}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() =>
              router.push({
                pathname: '/(screens)/chat_box',
                params: {
                  role: 'vendor',
                  partnerId: order?.buyer?.userId || order?.buyer?.id,
                  fullname: order?.buyer?.fullName || t('orders_customer_fallback', 'Customer'),
                },
              })
            }
          >
            <AntDesign name="message" size={14} color="#2C3338" />
            <Text style={styles.messageText}>{t('order_details_message', 'Message')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('order_details_order_items', 'Order items')}</Text>
          {items.map((item: any, idx: number) => (
            <View key={item?.id || `${idx}`} style={[styles.itemRow, idx < items.length - 1 ? { marginBottom: 10 } : null]}>
              <Image source={{ uri: item?.product?.images?.[0] || IMAGE_FALLBACK }} style={styles.itemImage} />
              <View style={{ flex: 1 }}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemName} numberOfLines={1}>#{order?.orderNumber}</Text>
                  <Text style={styles.itemPrice}>{formatMoney(item?.unitPrice || item?.price)}</Text>
                </View>
                <Text style={styles.itemDesc} numberOfLines={2}>{item?.product?.description || t('order_details_product_details_unavailable', 'Product details unavailable')}</Text>
                <Text style={styles.itemQty}>x{item?.quantity || 1}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('order_details_payment_details', 'Payment details')}</Text>
          <View style={styles.paymentRow}><Text style={styles.paymentLabel}>{t('order_details_subtotal', 'Subtotal')}</Text><Text style={styles.paymentValue}>{formatMoney(subtotal)}</Text></View>
          <View style={styles.paymentRow}><Text style={styles.paymentLabel}>{t('order_details_tax_plain', 'Tax')}</Text><Text style={styles.paymentValue}>{formatMoney(tax)}</Text></View>
          <View style={styles.paymentRow}><Text style={styles.paymentLabel}>{t('order_details_shipping', 'Shipping')}</Text><Text style={styles.paymentValue}>{formatMoney(shipping)}</Text></View>
          <View style={styles.dashed} />
          <View style={styles.paymentRow}><Text style={styles.paymentLabel}>{t('order_details_discount', 'Discount')}</Text><Text style={styles.paymentValue}>{formatMoney(discount)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>{t('chat_total_label', 'Total')}</Text><Text style={styles.totalValue}>{formatMoney(total)}</Text></View>
          <View style={styles.paidRow}>
            <Text style={[styles.statusBadge, { backgroundColor: theme.bg, color: theme.text }]}>
              {t(`orders_filter_${status}`, status.charAt(0).toUpperCase() + status.slice(1))}
            </Text>
            <Text style={styles.paidMethod}>{order?.payment?.paymentMethod || t('order_details_card_payment', 'Card payment')}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('order_details_order_history', 'Order history')}</Text>
          {timeline.map((step, idx) => (
            <View key={`${step.title}-${idx}`} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.dot, idx === timeline.length - 1 ? styles.dotActive : null]} />
                {idx < timeline.length - 1 && <View style={styles.line} />}
              </View>
              <View>
                <Text style={styles.timelineTitle}>{step.title}</Text>
                <Text style={styles.timelineTime}>
                  {step.time ? step.time.toLocaleString() : t('orders_na', 'N/A')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCancelModal(true)}>
          <Text style={styles.cancelBtnText}>{t('order_details_cancel_order', 'Cancel order')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.updateBtn}
          onPress={() => {
            setSelectedStatus(status);
            setShowUpdateStatusModal(true);
          }}
        >
          <Text style={styles.updateBtnText}>{t('order_details_update_status', 'Update Status')}</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={showCancelModal} animationType="fade" onRequestClose={() => setShowCancelModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('order_details_update_status_confirm_q', 'Are you sure you want to update the order status?')}</Text>
            <Text style={styles.modalSub}>{t('order_details_cancelled_mark_note', 'This will mark this order as cancelled.')}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalGhost} onPress={() => setShowCancelModal(false)}>
                <Text style={styles.modalGhostText}>{t('cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSolid} onPress={() => handleStatusUpdate('cancelled')} disabled={isUpdating}>
                {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSolidText}>{t('order_details_yes', 'Yes')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showUpdateStatusModal} animationType="fade" onRequestClose={() => setShowUpdateStatusModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.statusModal}>
            <Text style={styles.modalTitle}>{t('order_details_update_status', 'Update Status')}</Text>
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity key={option.value} style={styles.statusOption} onPress={() => setSelectedStatus(option.value)}>
                <Text style={[styles.statusOptionText, selectedStatus === option.value ? { color: '#278687', fontWeight: '700' } : null]}>
                  {t(`orders_filter_${option.value}`, option.label)}
                </Text>
                {selectedStatus === option.value ? <Feather name="check" size={18} color="#278687" /> : null}
              </TouchableOpacity>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalGhost} onPress={() => setShowUpdateStatusModal(false)}>
                <Text style={styles.modalGhostText}>{t('cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSolid}
                onPress={() => selectedStatus && handleStatusUpdate(selectedStatus)}
                disabled={isUpdating}
              >
                {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSolidText}>{t('order_details_update', 'Update')}</Text>}
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#202427', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  downloadFab: { backgroundColor: '#278687', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 14, paddingBottom: 20 },
  customerCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E3E9EC', padding: 12, marginBottom: 10 },
  customerRow: { flexDirection: 'row', alignItems: 'center' },
  customerAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 10, backgroundColor: '#E7EDF0' },
  customerName: { fontSize: 15, fontWeight: '700', color: '#222C31' },
  customerId: { fontSize: 12, color: '#6F7C84', marginTop: 2 },
  messageButton: { marginTop: 10, backgroundColor: '#F3F7F8', borderRadius: 8, borderWidth: 1, borderColor: '#E1E7EA', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingVertical: 10, gap: 8 },
  messageText: { color: '#2C3338', fontWeight: '500', fontSize: 13 },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E3E9EC', padding: 12, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#212A30', marginBottom: 10 },
  itemRow: { borderWidth: 1, borderColor: '#E9EFF2', borderRadius: 10, padding: 8, flexDirection: 'row' },
  itemImage: { width: 62, height: 62, borderRadius: 8, marginRight: 10, backgroundColor: '#E7EDF0' },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#222C31', flex: 1, paddingRight: 8 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#222C31' },
  itemDesc: { fontSize: 11, color: '#7B868D', marginTop: 2 },
  itemQty: { textAlign: I18nManager.isRTL ? 'left' : 'right', marginTop: 5, fontSize: 11, color: '#65727A' },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  paymentLabel: { color: '#66737C', fontSize: 13 },
  paymentValue: { color: '#222C31', fontSize: 13, fontWeight: '600' },
  dashed: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#D5DEE2', marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#212A30' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#212A30' },
  paidRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontSize: 12, fontWeight: '700' },
  paidMethod: { marginLeft: 8, color: '#6E7B83', fontSize: 12 },
  timelineRow: { flexDirection: 'row' },
  timelineLeft: { width: 22, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#B8C4CB', marginTop: 2 },
  dotActive: { backgroundColor: '#278687' },
  line: { width: 1, flex: 1, backgroundColor: '#CED8DD', marginVertical: 2 },
  timelineTitle: { fontSize: 13, fontWeight: '600', color: '#2A343A' },
  timelineTime: { fontSize: 11, color: '#7A868E', marginBottom: 10 },
  bottomActions: { paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', backgroundColor: '#F2F6F5' },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#F09AA0', borderRadius: 12, alignItems: 'center', justifyContent: 'center', height: 44, marginRight: 8 },
  cancelBtnText: { color: '#E36570', fontWeight: '600' },
  updateBtn: { flex: 1, backgroundColor: '#278687', borderRadius: 12, alignItems: 'center', justifyContent: 'center', height: 44, marginLeft: 8 },
  updateBtnText: { color: '#FFFFFF', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18 },
  statusModal: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#202A30', textAlign: 'center', marginBottom: 8 },
  modalSub: { fontSize: 13, color: '#63707A', textAlign: 'center', marginBottom: 12 },
  modalActions: { flexDirection: 'row', marginTop: 12, gap: 10 },
  modalGhost: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1.3, borderColor: '#D7E0E4', justifyContent: 'center', alignItems: 'center' },
  modalGhostText: { color: '#4E5B64', fontWeight: '600' },
  modalSolid: { flex: 1, height: 40, borderRadius: 10, backgroundColor: '#278687', justifyContent: 'center', alignItems: 'center' },
  modalSolidText: { color: '#FFFFFF', fontWeight: '700' },
  statusOption: { height: 42, borderBottomWidth: 1, borderBottomColor: '#EDF2F4', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusOptionText: { fontSize: 15, color: '#2A343A' },
});
