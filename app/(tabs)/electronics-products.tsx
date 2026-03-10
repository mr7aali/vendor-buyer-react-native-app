import { useGetProfileQuery } from '@/store/api/authApiSlice';
import { useGetProductsByVendorQuery } from '@/store/api/product_api_slice';
import { useTranslation } from '@/hooks/use-translation';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FALLBACK = 'https://via.placeholder.com/150';

const money = (value: any) => `$${Number(value || 0).toFixed(2)}`;

export default function ElectronicsProducts() {
  const { language, t } = useTranslation();
  const { categoryId: routeCategoryId, categoryName } = useLocalSearchParams();
  const user = useAppSelector(selectCurrentUser);
  const { data: profileData } = useGetProfileQuery({});

  const vendorId =
    profileData?.data?.vendor?.id ||
    profileData?.data?.vendor?._id ||
    (user as any)?.vendor?.id ||
    (user as any)?.vendor?._id ||
    user?.id ||
    (user as any)?._id;

  const categoryId = routeCategoryId ? String(routeCategoryId) : undefined;
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'drafts' | 'low_stock'>('all');

  const ui = useMemo(() => {
    if (language === 'he') {
      return {
        totalValue: 'ערך כולל',
        lowStockItems: 'פריטים במלאי נמוך',
        drafts: 'טיוטות',
        lowStock: 'מלאי נמוך',
        inventoryItems: 'פריטי מלאי',
        failedLoadProducts: 'טעינת המוצרים נכשלה.',
        active: 'פעיל',
        unpublish: 'לא פורסם',
        inStock: (count: number) => `${count} במלאי`,
      };
    }
    if (language === 'hi') {
      return {
        totalValue: 'कुल मूल्य',
        lowStockItems: 'कम स्टॉक आइटम्स',
        drafts: 'ड्राफ्ट्स',
        lowStock: 'कम स्टॉक',
        inventoryItems: 'इन्वेंटरी आइटम्स',
        failedLoadProducts: 'प्रोडक्ट लोड करना विफल रहा।',
        active: 'सक्रिय',
        unpublish: 'अप्रकाशित',
        inStock: (count: number) => `${count} स्टॉक में`,
      };
    }
    return {
      totalValue: 'Total value',
      lowStockItems: 'Low stock items',
      drafts: 'Drafts',
      lowStock: 'Low Stock',
      inventoryItems: 'Inventory Items',
      failedLoadProducts: 'Failed to load products.',
      active: 'Active',
      unpublish: 'Unpublish',
      inStock: (count: number) => `${count} in stock`,
    };
  }, [language]);

  const statusMeta = useMemo(
    () => (product: any) => {
      const low = Number(product?.stockQuantity || 0) < 10;
      if (!product?.isAvailable) return { label: ui.unpublish, bg: '#FFF4D9', text: '#A56700', dot: '#A56700' };
      if (low) return { label: ui.inStock(Number(product.stockQuantity || 0)), bg: '#FDEEEE', text: '#D54444', dot: '#D54444' };
      return { label: ui.inStock(Number(product.stockQuantity || 0)), bg: '#E8F8EE', text: '#248D5A', dot: '#248D5A' };
    },
    [ui]
  );

  const {
    data: products = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetProductsByVendorQuery(
    { vendorId: String(vendorId || ''), ...(categoryId ? { categoryId } : {}) },
    { skip: !vendorId }
  );

  const totalValue = useMemo(() => {
    const sum = products.reduce((acc: number, p: any) => acc + (Number(p.price || 0) * Number(p.stockQuantity || 0)), 0);
    return sum.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
  }, [products]);

  const lowCount = useMemo(() => products.filter((p: any) => Number(p.stockQuantity || 0) < 10).length, [products]);

  const filtered = useMemo(() => {
    return products.filter((p: any) => {
      const nameMatch = String(p.name || '').toLowerCase().includes(search.toLowerCase());
      if (!nameMatch) return false;
      if (activeFilter === 'active') return !!p.isAvailable;
      if (activeFilter === 'drafts') return !p.isAvailable;
      if (activeFilter === 'low_stock') return Number(p.stockQuantity || 0) < 10;
      return true;
    });
  }, [products, search, activeFilter]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios-new" size={22} color="#1F2A30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{(categoryName as string) || t('electronics_title', 'Electronics')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#6E7B84" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('electronics_search_placeholder', 'Search Product..')}
            placeholderTextColor="#8A969D"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{ui.totalValue}</Text>
            <Text style={styles.statValue}>{totalValue}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.lowHeader}>
              <Text style={styles.statLabel}>{ui.lowStockItems}</Text>
              <Ionicons name="alert-circle-outline" size={18} color="#F15B63" />
            </View>
            <Text style={styles.statValue}>{lowCount}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {[
            { key: 'all', label: t('orders_filter_all', 'All') },
            { key: 'active', label: ui.active },
            { key: 'drafts', label: ui.drafts },
            { key: 'low_stock', label: ui.lowStock },
          ].map((f) => {
            const active = activeFilter === (f.key as any);
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
                onPress={() => setActiveFilter(f.key as any)}
              >
                <Text style={[styles.filterText, active ? styles.filterTextActive : null]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>{ui.inventoryItems}</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#278687" style={{ marginTop: 24 }} />
        ) : isError ? (
          <Text style={styles.emptyText}>{ui.failedLoadProducts}</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>{t('electronics_no_products', 'No products found')}</Text>
        ) : (
          filtered.map((product: any) => {
            const status = statusMeta(product);
            return (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => router.push({ pathname: '/(screens)/product_details', params: { id: product.id } })}
              >
                <Image source={{ uri: product.images?.[0] || FALLBACK }} style={styles.productImage} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productSku}>{`${t('product_details_sku', 'Sku')}: ${product.sku || t('orders_na', 'N/A')}`}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={13} color="#F0B429" />
                    <Text style={styles.ratingText}>{Number(product.averageRating || 0).toFixed(1)} ({product.totalReviews || 0})</Text>
                  </View>
                  <View style={styles.cardBottom}>
                    <Text style={styles.priceText}>{money(product.price)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
                      <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({ pathname: '/(screens)/EditProduct', params: { ...(categoryId ? { categoryId } : {}) } })}
      >
        <MaterialIcons name="add" size={26} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F6F5' },
  header: { direction: 'ltr', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1F2A30' },
  content: { paddingHorizontal: 14, paddingBottom: 20 },
  searchBox: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#DCE4E8', backgroundColor: '#FFF', paddingHorizontal: 12, alignItems: 'center', flexDirection: 'row', marginBottom: 12 },
  searchInput: { marginLeft: 8, flex: 1, fontSize: 15, color: '#223037' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#DEE6E9', padding: 12 },
  statLabel: { color: '#6A7881', fontSize: 13 },
  statValue: { color: '#1F2A30', fontSize: 24, fontWeight: '700', marginTop: 4 },
  lowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterChip: { height: 34, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#D4DEE2', backgroundColor: '#EAF0EF', justifyContent: 'center', marginRight: 8 },
  filterChipActive: { backgroundColor: '#278687', borderColor: '#278687' },
  filterText: { fontSize: 14, color: '#314148' },
  filterTextActive: { color: '#FFF', fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1F2A30', marginBottom: 10 },
  productCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDE6EA', borderRadius: 12, padding: 10, flexDirection: 'row', marginBottom: 10 },
  productImage: { width: 70, height: 70, borderRadius: 10, marginRight: 10, backgroundColor: '#E8EEF1' },
  productName: { fontSize: 16, fontWeight: '700', color: '#1F2A30' },
  productSku: { fontSize: 12, color: '#7C8991', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 12, color: '#4F5D66', marginLeft: 6 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  priceText: { fontSize: 16, fontWeight: '700', color: '#278687' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#6A7881', marginTop: 24, fontSize: 15 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#278687', justifyContent: 'center', alignItems: 'center', elevation: 5 },
});
