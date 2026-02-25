import { useGetOrdersQuery } from '@/store/api/orderApiSlice';
import { useTranslation } from '@/hooks/use-translation';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const IMAGE_FALLBACK = 'https://via.placeholder.com/80';

const toNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: any) => `$${toNumber(value).toFixed(2)}`;

const getStatus = (order: any) => String(order?.status || 'pending').toLowerCase();
const getItems = (order: any) => (Array.isArray(order?.orderItems) ? order.orderItems : []);

const getCoverImage = (order: any) => {
  const item = getItems(order)[0];
  return item?.product?.images?.[0] || item?.product?.imageUrl || IMAGE_FALLBACK;
};

const getDisplayAddress = (order: any) => {
  if (typeof order?.shippingAddress === 'string' && order.shippingAddress.trim()) return order.shippingAddress;
  return '';
};

const getTitleName = (order: any) => {
  return order?.vendor?.fullName || order?.vendor?.storename || order?.buyer?.fullName || '';
};

const getItemSummary = (order: any, t: (key: string, fallback?: string) => string) => {
  const items = getItems(order);
  if (!items.length) return `0 ${t('orders_items_label', 'items')}`;
  const firstName = items[0]?.product?.name || t('orders_item_label', 'Item');
  return `${items.length} ${t('orders_items_label', 'items')} - ${firstName}`;
};

const statusPillStyle = (status: string) => {
  const map: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#FFF4E5', text: '#CC7A00' },
    processing: { bg: '#E8F1FF', text: '#2764C2' },
    shipped: { bg: '#F2EFFF', text: '#6A3DBB' },
    delivered: { bg: '#E8F8EC', text: '#1E8D4C' },
    completed: { bg: '#E8F8EC', text: '#1E8D4C' },
    cancelled: { bg: '#FDEBEC', text: '#D43C49' },
  };
  return map[status] || { bg: '#EEF1F2', text: '#5E6870' };
};

const FILTERS = ['all', 'delivered', 'processing', 'shipped', 'cancelled'];

export default function OrderTabs() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: ordersData = [], isLoading } = useGetOrdersQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const filteredOrders = useMemo(() => {
    return ordersData.filter((order: any) => {
      const status = getStatus(order);
      const statusMatch = activeFilter === 'all' || status === activeFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return statusMatch;
      const orderNumber = String(order?.orderNumber || order?.id || '').toLowerCase();
      const customer = String(getTitleName(order)).toLowerCase();
      return statusMatch && (orderNumber.includes(q) || customer.includes(q));
    });
  }, [ordersData, activeFilter, searchQuery]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#278687" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios-new" size={22} color="#202427" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('orders_title', 'Orders')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={20} color="#66737D" />
        <TextInput
          placeholder={t('orders_search_by_name', 'Search by name')}
          placeholderTextColor="#8A949B"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                  {t(`orders_filter_${f}`, f.charAt(0).toUpperCase() + f.slice(1))}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredOrders.map((order: any) => {
          const status = getStatus(order);
          const pill = statusPillStyle(status);
          return (
            <TouchableOpacity
              key={order?.id || order?._id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/(screens)/order_details',
                  params: { id: order?.id || order?._id },
                })
              }
            >
              <View style={styles.cardTop}>
                <Image source={{ uri: getCoverImage(order) }} style={styles.cover} />
                <View style={{ flex: 1 }}>
                  <View style={styles.orderTopRow}>
                    <Text style={styles.orderNumber}>#{order?.orderNumber || order?.id}</Text>
                    <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                      <Text style={[styles.statusPillText, { color: pill.text }]}>
                        {t(`orders_filter_${status}`, status.charAt(0).toUpperCase() + status.slice(1))}
                      </Text>
                    </View>
                  </View>
                  <Text numberOfLines={1} style={styles.addressText}>
                    {getDisplayAddress(order) || t('orders_address_unavailable', 'Address unavailable')}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F0B429" />
                    <Text style={styles.ratingText}>4.8 ({t('orders_rating_sample', '1.2k')})</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{getTitleName(order) || t('orders_customer_fallback', 'Customer')}</Text>
                  <Text numberOfLines={1} style={styles.summaryText}>{getItemSummary(order, t)}</Text>
                </View>
                <Text style={styles.priceText}>{formatMoney(order?.totalAmount || order?.totalPrice)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {!filteredOrders.length && (
          <Text style={styles.emptyText}>{t('orders_no_orders_found', 'No orders found.')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F6F5', paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F6F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1F2A30' },
  searchWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE4E8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 52,
  },
  searchInput: { marginLeft: 8, flex: 1, fontSize: 15, color: '#1F2A30' },
  filterWrap: { marginTop: 12, height: 44 },
  filterChip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9E0E4',
    backgroundColor: '#EEF2F3',
    justifyContent: 'center',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#278687', borderColor: '#278687' },
  filterChipText: { fontSize: 14, color: '#34434C', fontWeight: '500' },
  filterChipTextActive: { color: '#FFFFFF' },
  listContent: { paddingTop: 12, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8EB',
  },
  cardTop: { flexDirection: 'row' },
  cover: { width: 72, height: 72, borderRadius: 10, marginRight: 12, backgroundColor: '#E7EDF0' },
  orderTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: 18, color: '#2A3237', fontWeight: '600', flex: 1, paddingRight: 8 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: 12, fontWeight: '600' },
  addressText: { color: '#7B868D', fontSize: 13, marginTop: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  ratingText: { fontSize: 13, color: '#495860', marginLeft: 6 },
  cardBottom: {
    marginTop: 10,
    backgroundColor: '#EAF2F1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: { fontSize: 18, color: '#278687', fontWeight: '500' },
  summaryText: { fontSize: 13, color: '#278687', marginTop: 2 },
  priceText: { marginLeft: 8, fontSize: 30, color: '#278687', fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#7B868D', marginTop: 32, fontSize: 15 },
});
