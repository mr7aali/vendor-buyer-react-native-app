import { useGetOrderByIdQuery } from '@/store/api/orderApiSlice';
import { useCreatePaymentIntentMutation } from '@/store/api/paymentApiSlice';
import { useTranslation } from '@/hooks/use-translation';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const toNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: any) => `$${toNumber(value).toFixed(2)}`;

const getOrderItemName = (items: any[]) => {
  const first = items?.[0];
  return (
    first?.product?.title ||
    first?.product?.name ||
    first?.title ||
    first?.name ||
    ''
  );
};

export default function StripePaymentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const params = useLocalSearchParams<{ orderId?: string | string[] }>();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const stripePublishableKey = (process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').trim();

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'stripe'>('stripe');

  const { data: orderData, isLoading: isOrderLoading, error: orderError } = useGetOrderByIdQuery(orderId, {
    skip: !orderId,
  });
  const [createPaymentIntent, { isLoading: isCreatingPayment }] = useCreatePaymentIntentMutation();

  const order = useMemo(() => {
    if (!orderData) return null;
    return (orderData as any)?.data || orderData;
  }, [orderData]);

  const items = useMemo(() => (Array.isArray(order?.orderItems) ? order.orderItems : []), [order]);
  const itemName = getOrderItemName(items);
  const quantity = useMemo(() => {
    if (!items.length) return 1;
    return items.reduce((sum: number, item: any) => sum + toNumber(item?.quantity, 1), 0);
  }, [items]);

  const subtotal = toNumber(order?.subtotal ?? order?.totalAmount);
  const discount = toNumber(order?.discountAmount);
  const couponAmount = toNumber(order?.couponDiscountAmount ?? 0);
  const totalPayable = toNumber(order?.totalAmount ?? subtotal);

  const startWebCheckout = (checkoutUrl: string) => {
    router.push({
      pathname: '/(screens)/stripe_webview',
      params: {
        url: encodeURIComponent(checkoutUrl),
        flow: 'payment',
        title: t('stripe_title', 'Stripe Payment'),
      },
    });
  };

  const handleContinue = async () => {
    if (!orderId) {
      Alert.alert(t('error', 'Error'), t('stripe_order_id_missing', 'Order ID is missing.'));
      return;
    }

    if (selectedMethod !== 'stripe') return;

    try {
      setIsProcessing(true);
      const response = await createPaymentIntent({ orderId }).unwrap();
      const payload = response?.data || response;

      const clientSecret =
        payload?.paymentIntentClientSecret ||
        payload?.clientSecret ||
        payload?.paymentIntent?.client_secret;
      const customerId = payload?.customerId;
      const customerEphemeralKeySecret =
        payload?.customerEphemeralKeySecret || payload?.ephemeralKeySecret;

      if (clientSecret && stripePublishableKey) {
        const initResult = await initPaymentSheet({
          merchantDisplayName: 'Yozietrance',
          paymentIntentClientSecret: clientSecret,
          ...(customerId && customerEphemeralKeySecret
            ? { customerId, customerEphemeralKeySecret }
            : {}),
          returnURL: 'yozietranceapp://stripe-redirect',
        });

        if (initResult.error) {
          Alert.alert(t('error', 'Error'), initResult.error.message);
          return;
        }

        const presentResult = await presentPaymentSheet();
        if (presentResult.error) {
          if (presentResult.error.code !== 'Canceled') {
            Alert.alert(t('error', 'Error'), presentResult.error.message);
          }
          return;
        }

        router.replace('/(user_screen)/OrderAcceptedScreen');
        return;
      }

      const paymentLink =
        payload?.paymentLink ||
        payload?.checkoutUrl ||
        payload?.checkoutURL ||
        payload?.url ||
        payload?.sessionUrl;
      const stripeSessionId =
        payload?.stripePaymentId || payload?.checkoutSessionId || payload?.sessionId;
      const fallbackCheckoutUrl =
        typeof stripeSessionId === 'string' && stripeSessionId.startsWith('cs_')
          ? `https://checkout.stripe.com/c/pay/${stripeSessionId}`
          : '';

      if (paymentLink || fallbackCheckoutUrl) {
        startWebCheckout(paymentLink || fallbackCheckoutUrl);
        return;
      }

      Alert.alert(t('error', 'Error'), payload?.message || t('stripe_unable_start_checkout', 'Unable to start Stripe checkout.'));
    } catch (error: any) {
      Alert.alert(t('error', 'Error'), error?.data?.message || t('stripe_failed_initiate_payment', 'Failed to initiate payment.'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isOrderLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00797C" />
      </SafeAreaView>
    );
  }

  if (orderError || !order) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{t('stripe_failed_load_payment_details', 'Failed to load payment details.')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>{t('product_details_go_back', 'Go Back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backTap}>
          <MaterialIcons name="arrow-back-ios-new" size={22} color="#1F2933" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('stripe_payment', 'Payment')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('stripe_booking_summary', 'Booking Summary:')}</Text>
        <View style={styles.summaryCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{itemName || t('stripe_order_item', 'Order item')}</Text>
            <Text style={styles.rowValue}>{formatMoney(subtotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('product_details_quantity', 'Quantity')}</Text>
            <Text style={styles.rowValue}>{quantity}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('order_details_discount', 'Discount')}</Text>
            <Text style={styles.rowValue}>-{formatMoney(discount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('stripe_coupon', 'Coupon')}</Text>
            <Text style={styles.rowValue}>-{formatMoney(couponAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('chat_total_label', 'Total')}</Text>
            <Text style={styles.totalValue}>{formatMoney(totalPayable)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('stripe_payment_method', 'Payment Method')}</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.paymentMethodCard}
          onPress={() => setSelectedMethod('stripe')}
        >
          <View style={styles.paymentMethodLeft}>
            <Feather name="credit-card" size={20} color="#0093A3" />
            <Text style={styles.paymentMethodText}>{t('stripe_payment_stripe', 'Payment Stripe')}</Text>
          </View>
          <View style={styles.radioOuter}>
            {selectedMethod === 'stripe' ? <View style={styles.radioInner} /> : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={isProcessing || isCreatingPayment}
        >
          {isProcessing || isCreatingPayment ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueText}>{t('info_continue', 'Continue')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F1',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backTap: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 33 / 2,
    fontWeight: '700',
    color: '#2B2F31',
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 33 / 2,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 14,
  },
  summaryCard: {
    backgroundColor: '#F7F7F8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#1F2937',
        shadowOpacity: 0.03,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  rowLabel: {
    color: '#1F2937',
    fontSize: 28 / 2,
    flexShrink: 1,
    paddingRight: 10,
  },
  rowValue: {
    color: '#1F2937',
    fontSize: 28 / 2,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 36 / 2,
    color: '#111827',
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 36 / 2,
    color: '#111827',
    fontWeight: '700',
  },
  paymentMethodCard: {
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C1C8D0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentMethodText: {
    fontSize: 34 / 2,
    fontWeight: '500',
    color: '#1F2937',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C5CDD6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00797C',
  },
  continueButton: {
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00797C',
    marginTop: 14,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryText: {
    color: '#1F2937',
    fontWeight: '600',
  },
});
