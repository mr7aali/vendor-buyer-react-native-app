import { useGetOrderByIdQuery, useUpdateOrderStatusMutation } from '@/store/api/orderApiSlice';
import { useCreateReviewMutation } from '@/store/api/reviewApiSlice';
import { useTranslation } from '@/hooks/use-translation';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const IMAGE_FALLBACK = 'https://via.placeholder.com/100';

const toNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: any) => `$${toNumber(value).toFixed(2)}`;
const normalizeStatus = (value: any) => String(value || 'pending').toLowerCase();
const getItems = (order: any) => (Array.isArray(order?.orderItems) ? order.orderItems : []);
const getProductId = (item: any) => item?.product?.id || item?.product?._id || item?.productId?.id || item?.productId?._id || item?.productId;

const OrderDetails = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { data: order, isLoading, error, refetch } = useGetOrderByIdQuery(id as string, { skip: !id });
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const [createReview, { isLoading: isSubmittingReview }] = useCreateReviewMutation();

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  const status = normalizeStatus(order?.status);
  const items = useMemo(() => getItems(order), [order]);

  const subtotal = toNumber(order?.subtotal);
  const tax = toNumber(order?.taxAmount, 0);
  const shipping = toNumber(order?.shippingCost, 0);
  const discount = toNumber(order?.discountAmount);
  const total = toNumber(order?.totalAmount);

  const timeline = useMemo(() => {
    const created = order?.createdAt ? new Date(order.createdAt) : null;
    const updated = order?.updatedAt ? new Date(order.updatedAt) : created;
    return [
      { key: 'created', title: t('order_details_timeline_created', 'Order Created'), time: created },
      { key: 'processing', title: t('orders_filter_processing', 'Processing'), time: status === 'processing' || status === 'shipped' || status === 'delivered' || status === 'completed' ? updated : null },
      { key: 'shipped', title: t('orders_filter_shipped', 'Shipped'), time: status === 'shipped' || status === 'delivered' || status === 'completed' ? updated : null },
      { key: 'ready', title: t('order_details_timeline_ready_pickup', 'Ready For Pickup'), time: status === 'delivered' || status === 'completed' ? updated : null },
    ];
  }, [order, status, t]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2A8C8B" />
      </SafeAreaView>
    );
  }

  if (!order || error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ color: '#2A3035' }}>{t('order_details_not_found', 'Order not found')}</Text>
      </SafeAreaView>
    );
  }

  const handleConfirmPickup = async () => {
    try {
      await updateOrderStatus({ id: order?.id, status: 'completed' }).unwrap();
      await refetch();
      setShowFeedbackModal(true);
    } catch (err: any) {
      Alert.alert(t('error', 'Error'), err?.data?.message || t('order_details_failed_confirm_pickup', 'Failed to confirm pickup'));
    }
  };

  const handleSubmitFeedback = async () => {
    const comment = feedback.trim();
    if (!comment) {
      Alert.alert(t('error', 'Error'), t('product_details_enter_comment', 'Please enter a comment'));
      return;
    }

    const productIds: string[] = Array.from(
      new Set(
        items
          .map((item: any) => getProductId(item))
          .filter((value: unknown): value is string | number => typeof value === 'string' || typeof value === 'number')
          .map((value: string | number) => String(value)),
      ),
    );

    if (!productIds.length) {
      Alert.alert(t('error', 'Error'), t('product_details_not_found', 'Product not found'));
      return;
    }

    try {
      await Promise.all(
        productIds.map((productId) =>
          createReview({
            productId,
            rating,
            comment,
          }).unwrap(),
        ),
      );
      setShowFeedbackModal(false);
      setFeedback('');
      setRating(5);
      Alert.alert(t('success', 'Success'), t('product_details_review_success', 'Review submitted successfully!'));
    } catch (err: any) {
      Alert.alert(t('error', 'Error'), err?.data?.message || t('product_details_review_failed', 'Failed to submit review'));
    }
  };

  const canConfirmPickup = status === 'delivered';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1C252B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('orders_title', 'Orders')} #{order?.orderNumber || order?.id}</Text>
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => router.push({ pathname: '/(user_screen)/ExportInvoiceScreen', params: { id: order?.id } })}
        >
          <Ionicons name="download-outline" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.userRow}>
            <Image source={{ uri: order?.vendor?.logoUrl || IMAGE_FALLBACK }} style={styles.avatar} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.userName}>{order?.vendor?.fullName || order?.vendor?.storename || t('order_details_vendor_fallback', 'Vendor')}</Text>
              <Text style={styles.userId}>ID: {order?.vendor?.id || t('orders_na', 'N/A')}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() =>
              router.push({
                pathname: '/(screens)/chat_box',
                params: {
                  role: 'buyer',
                  partnerId: order?.vendor?.userId || order?.vendor?.id,
                  fullname: order?.vendor?.fullName || order?.vendor?.storename || t('order_details_vendor_fallback', 'Vendor'),
                },
              })
            }
          >
            <Ionicons name="chatbubble-outline" size={16} color="#2F3A41" />
            <Text style={styles.messageText}>{t('order_details_message', 'Message')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('order_details_order_items', 'Order items')}</Text>
          {items.map((item: any, index: number) => (
            <View key={item?.id || `${index}`} style={[styles.itemRow, index < items.length - 1 ? styles.itemBorder : null]}>
              <Image source={{ uri: item?.product?.images?.[0] || IMAGE_FALLBACK }} style={styles.itemImage} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.itemName}>#{order?.orderNumber}</Text>
                  <Text style={styles.itemPrice}>{formatMoney(item?.unitPrice || item?.totalPrice)}</Text>
                </View>
                <Text numberOfLines={2} style={styles.itemDesc}>{item?.product?.description || t('product_details_no_description', 'No description')}</Text>
                <Text style={styles.itemQty}>x{item?.quantity || 1}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('order_details_payment_details', 'Payment details')}</Text>
          <View style={styles.paymentRow}><Text style={styles.paymentLabel}>{t('order_details_subtotal', 'Subtotal')}</Text><Text style={styles.paymentValue}>{formatMoney(subtotal)}</Text></View>
          <View style={styles.paymentRow}><Text style={styles.paymentLabel}>{t('order_details_tax', 'Tax(7.5%)')}</Text><Text style={styles.paymentValue}>{formatMoney(tax)}</Text></View>
          <View style={styles.paymentRow}><Text style={styles.paymentLabel}>{t('order_details_shipping', 'Shipping')}</Text><Text style={styles.paymentValue}>{formatMoney(shipping)}</Text></View>
          <View style={styles.dashed} />
          <View style={styles.paymentRow}><Text style={styles.paymentLabel}>{t('order_details_discount', 'Discount')}</Text><Text style={styles.paymentValue}>{formatMoney(discount)}</Text></View>
          <View style={styles.paymentRow}><Text style={styles.totalLabel}>{t('chat_total_label', 'Total')}</Text><Text style={styles.totalValue}>{formatMoney(total)}</Text></View>
          <View style={styles.paidBadge}>
            <Text style={styles.paidTag}>{status === 'pending' ? t('order_details_unpaid', 'Unpaid') : t('order_details_paid', 'Paid')}</Text>
            <Text style={styles.paidText}>{t('order_details_via', 'Via')} {order?.payment?.paymentMethod || t('order_details_card_ending', 'Card ending 4242')}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('order_details_order_history', 'Order history')}</Text>
          {timeline.map((step, idx) => {
            const active = !!step.time;
            const isLast = idx === timeline.length - 1;
            return (
              <View key={step.key} style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <View style={[styles.dot, active ? styles.dotActive : null]}>
                    {active ? <Ionicons name="checkmark" size={8} color="#FFF" /> : null}
                  </View>
                  {!isLast ? <View style={[styles.line, active ? styles.lineActive : null]} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyTitle, active ? styles.historyTitleActive : null]}>{step.title}</Text>
                  <Text style={styles.historySub}>
                    {step.time ? step.time.toLocaleString() : t('order_details_waiting', 'Waiting...')}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirmPickup ? styles.confirmBtnDisabled : null]}
          onPress={handleConfirmPickup}
          disabled={!canConfirmPickup || isUpdating}
        >
          {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>{t('order_details_confirm_pickup', 'Confirm Pickup')}</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showFeedbackModal} transparent animationType="fade" onRequestClose={() => setShowFeedbackModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowFeedbackModal(false)}>
              <Ionicons name="close" size={18} color="#66737C" />
            </TouchableOpacity>

            <View style={styles.checkWrap}>
              <Ionicons name="checkmark" size={24} color="#2A8C8B" />
            </View>

            <Text style={styles.modalTitle}>{t('order_details_task_completed', 'Task Completed')}</Text>
            <Text style={styles.modalSub}>{t('order_details_avg_rating_feedback', 'Average Rating and Feedback')}</Text>

            <Text style={styles.ratingLabel}>{t('order_details_avg_rating', 'Avg. Rating')}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)} style={styles.starCell}>
                  <Ionicons name="star" size={20} color={s <= rating ? '#FF9D2E' : '#D9E1E5'} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.starTextRow}>
              {[t('order_details_bad', 'Bad'), t('order_details_average', 'Average'), t('order_details_good', 'Good'), t('order_details_great', 'Great'), t('order_details_amazing', 'Amazing')].map((label) => (
                <Text key={label} style={styles.starLabel}>{label}</Text>
              ))}
            </View>

            <Text style={[styles.ratingLabel, { marginTop: 10 }]}>{t('order_details_feedback_note', 'Feedback Note')}</Text>
            <TextInput
              value={feedback}
              onChangeText={setFeedback}
              placeholder={t('order_details_type_here', 'Type here...')}
              placeholderTextColor="#95A2AA"
              style={styles.feedbackInput}
              multiline
            />

            <TouchableOpacity style={[styles.doneBtn, isSubmittingReview ? { opacity: 0.7 } : null]} onPress={handleSubmitFeedback} disabled={isSubmittingReview}>
              {isSubmittingReview ? <ActivityIndicator color="#FFF" /> : <Text style={styles.doneText}>{t('order_details_done', 'Done')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F7F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F7F6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C252B', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  downloadBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2A8C8B', justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 14, paddingBottom: 18 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E1E8EB', marginBottom: 10 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8EEF1' },
  userName: { fontSize: 14, fontWeight: '700', color: '#1F2A30' },
  userId: { fontSize: 11, color: '#6D7A83', marginTop: 2 },
  messageBtn: { marginTop: 10, height: 34, borderRadius: 8, backgroundColor: '#F3F7F8', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: '#E2E9EC' },
  messageText: { fontSize: 12, fontWeight: '600', color: '#2F3A41' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1F2A30', marginBottom: 8 },
  itemRow: { flexDirection: 'row', paddingVertical: 8 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#ECF1F3' },
  itemImage: { width: 58, height: 58, borderRadius: 8, backgroundColor: '#E8EEF1' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 13, fontWeight: '600', color: '#1F2A30' },
  itemPrice: { fontSize: 13, fontWeight: '700', color: '#1F2A30' },
  itemDesc: { fontSize: 11, color: '#7C8991', marginTop: 2, marginRight: 30 },
  itemQty: { textAlign: 'right', fontSize: 11, color: '#6D7A83', marginTop: 2 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  paymentLabel: { fontSize: 13, color: '#6D7A83' },
  paymentValue: { fontSize: 13, color: '#1F2A30', fontWeight: '600' },
  dashed: { borderStyle: 'dashed', borderWidth: 1, borderColor: '#CFD9DE', marginVertical: 6 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#1F2A30' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#1F2A30' },
  paidBadge: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  paidTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#E5F8E9', color: '#1D9A49', fontWeight: '700', fontSize: 11 },
  paidText: { fontSize: 11, color: '#7C8991', marginLeft: 8 },
  historyRow: { flexDirection: 'row' },
  historyLeft: { width: 22, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#CCD7DC', justifyContent: 'center', alignItems: 'center' },
  dotActive: { backgroundColor: '#2A8C8B' },
  line: { width: 2, flex: 1, backgroundColor: '#D3DDE2', marginVertical: 2 },
  lineActive: { backgroundColor: '#2A8C8B' },
  historyTitle: { fontSize: 13, color: '#738089', fontWeight: '600' },
  historyTitleActive: { color: '#228887' },
  historySub: { fontSize: 11, color: '#8D9AA3', marginBottom: 10 },
  confirmBtn: { height: 44, borderRadius: 10, backgroundColor: '#2A8C8B', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  confirmBtnDisabled: { backgroundColor: '#AFC4C4' },
  confirmBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E0E8EB' },
  modalClose: { alignSelf: 'flex-end' },
  checkWrap: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: '#2A8C8B', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: -6 },
  modalTitle: { textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#1F2A30', marginTop: 10 },
  modalSub: { textAlign: 'center', color: '#718089', fontSize: 12, marginTop: 4 },
  ratingLabel: { fontSize: 12, color: '#4A5962', fontWeight: '700', marginTop: 8 },
  starsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  starCell: { width: 42, alignItems: 'center' },
  starTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  starLabel: { width: 42, textAlign: 'center', fontSize: 10, color: '#8B99A2' },
  feedbackInput: { borderWidth: 1, borderColor: '#CDD8DD', borderRadius: 8, minHeight: 80, marginTop: 6, padding: 10, textAlignVertical: 'top', color: '#243037' },
  doneBtn: { height: 40, borderRadius: 8, backgroundColor: '#2A8C8B', justifyContent: 'center', alignItems: 'center', marginTop: 14 },
  doneText: { color: '#FFF', fontWeight: '700' },
});

export default OrderDetails;
