import { useGetCartQuery, useRemoveFromCartMutation, useUpdateCartItemMutation } from "@/store/api/cartApiSlice";
import { useGetCouponsByVendorQuery } from "@/store/api/couponApiSlice";
import { useTranslation } from "@/hooks/use-translation";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MyCart: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: cartData, isLoading, isError, refetch } = useGetCartQuery();
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const rawItems = useMemo(() => {
    return cartData?.data?.items || cartData?.items || (Array.isArray(cartData) ? cartData : []);
  }, [cartData]);

  const activeVendorId = useMemo(() => {
    const vendorIds = rawItems
      .map((item: any) =>
        item?.vendorId?.id ||
        item?.vendorId?._id ||
        item?.vendorId ||
        item?.product?.vendorId?.id ||
        item?.product?.vendorId?._id ||
        item?.product?.vendorId ||
        item?.product?.vendor?.id ||
        item?.product?.vendor?._id ||
        item?.productId?.vendorId?.id ||
        item?.productId?.vendorId?._id ||
        item?.productId?.vendorId ||
        item?.productId?.vendor?.id ||
        item?.productId?.vendor?._id
      )
      .filter(Boolean)
      .map((id: any) => String(id));

    return vendorIds.length ? vendorIds[0] : "";
  }, [rawItems]);

  const { data: vendorCoupons = [] } = useGetCouponsByVendorQuery(activeVendorId, {
    skip: !activeVendorId,
  });

  const cartItems = useMemo(() => {
    return rawItems.map((item: any) => ({
      id: item.id || item._id,
      name: item.product?.name || item.product?.title || item.productId?.title || item.productId?.name || item.title || item.name || t("cart_unknown_product", "Unknown Product"),
      price: parseFloat(item.product?.price || item.productId?.price || item.price || 0),
      quantity: item.quantity,
      image: item.product?.images?.[0] || item.product?.imageUrl || item.productId?.images?.[0] || item.productId?.image || item.image || "https://via.placeholder.com/150",
    }));
  }, [rawItems, t]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const TAX_RATE: number = 0.075;
  const SHIPPING_FEE: number = 0.6;

  const updateQuantity = async (id: string, type: "inc" | "dec") => {
    const item = cartItems.find((i: any) => i.id === id);
    if (!item) return;

    const newQty = type === "inc" ? item.quantity + 1 : Math.max(1, item.quantity - 1);
    if (newQty === item.quantity) return;

    try {
      await updateCartItem({ itemId: id, quantity: newQty }).unwrap();
    } catch (err: any) {
      Alert.alert(t("error", "Error"), err?.data?.message || t("cart_failed_update_quantity", "Failed to update quantity"));
    }
  };

  const removeItem = async (id: string) => {
    try {
      await removeFromCart(id).unwrap();
    } catch (err: any) {
      Alert.alert(t("error", "Error"), err?.data?.message || t("cart_failed_remove_item", "Failed to remove item"));
    }
  };

  const subtotal: number = cartItems.reduce(
    (acc: number, item: any) => acc + item.price * item.quantity,
    0
  );

  const handleApplyPromo = () => {
    const code = promoCode.trim();
    setPromoError("");

    if (!code) {
      setPromoError(t("cart_enter_promo_code", "Please enter a promo code"));
      return;
    }

    if (!activeVendorId) {
      setPromoError(t("cart_promo_vendor_missing", "Promo cannot be applied for this cart"));
      return;
    }

    const coupons = Array.isArray(vendorCoupons) ? vendorCoupons : [];
    const match = coupons.find(
      (coupon: any) => String(coupon?.code || "").trim().toLowerCase() === code.toLowerCase()
    );

    if (!match) {
      setPromoError(t("cart_promo_invalid", "Invalid promo code"));
      return;
    }

    if (match.isActive === false) {
      setPromoError(t("cart_promo_inactive", "This promo code is inactive"));
      return;
    }

    const now = new Date();
    const validFromRaw = match.validFrom || match.startDate || match.fromDate;
    const validUntilRaw = match.validUntil || match.endDate || match.toDate;
    const validFrom = validFromRaw ? new Date(validFromRaw) : null;
    const validUntil = validUntilRaw ? new Date(validUntilRaw) : null;

    if ((validFrom && !Number.isNaN(validFrom.getTime()) && now < validFrom) || (validUntil && !Number.isNaN(validUntil.getTime()) && now > validUntil)) {
      setPromoError(t("cart_promo_expired", "This promo code is expired"));
      return;
    }

    const minPurchase = Number(match.minPurchaseAmount || match.minimumPurchase || 0);
    if (subtotal < minPurchase) {
      setPromoError(t("cart_promo_min_purchase", `Minimum purchase amount is $${minPurchase.toFixed(2)}`));
      return;
    }

    const discountType = String(match.discountType || match.type || "").toLowerCase();
    const discountValue = Number(match.discountValue || match.value || 0);
    const rawDiscount =
      discountType === "percentage" || discountType === "%"
        ? (subtotal * discountValue) / 100
        : discountValue;

    const discount = Math.max(0, Math.min(rawDiscount, subtotal));

    setAppliedPromoCode(match.code);
    setAppliedDiscount(discount);
    setPromoError("");
  };

  const clearAppliedPromo = () => {
    setAppliedPromoCode("");
    setAppliedDiscount(0);
    setPromoCode("");
    setPromoError("");
  };

  const tax: number = subtotal * TAX_RATE;
  const total: number = Math.max(0, subtotal + tax + SHIPPING_FEE - appliedDiscount);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#349488" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("cart_title", "My Cart")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {isError ? (
          <Text style={styles.errorText}>{t("cart_failed_load", "Failed to load cart")}</Text>
        ) : null}

        {cartItems.map((item: any) => (
          <View key={item.id} style={styles.cartCard}>
            <View style={styles.itemMainRow}>
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.productImg}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                <View style={styles.actionRow}>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, "dec")}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, "inc")}
                      style={styles.stepBtn}
                    >
                      <Text style={[styles.stepText, { fontSize: 22 }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    style={styles.deleteBtn}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={22}
                      color="#FF6B6B"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.summaryCard}>
          <View style={styles.promoBox}>
            <TextInput
              style={styles.promoInput}
              value={promoCode}
              onChangeText={setPromoCode}
              placeholder={t("cart_enter_promo", "Enter promo code")}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              selectTextOnFocus
              onFocus={() => setPromoError("")}
              returnKeyType="done"
              placeholderTextColor="#94A3B8"
            />
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyPromo}>
              <Text style={styles.applyBtnText}>{t("product_details_apply", "Apply")}</Text>
            </TouchableOpacity>
          </View>

          {promoError ? <Text style={styles.promoErrorText}>{promoError}</Text> : null}

          {appliedPromoCode ? (
            <View style={styles.promoAppliedRow}>
              <View style={styles.promoApplied}>
                <Text style={styles.promoText}>{appliedPromoCode}</Text>
                <Ionicons name="checkmark-circle" size={18} color="#349488" />
                <Text style={styles.appliedText}>{t("cart_promo_applied", "Promo code applied")}</Text>
              </View>
              <TouchableOpacity onPress={clearAppliedPromo}>
                <Text style={styles.clearPromoText}>{t("cart_remove_promo", "Remove")}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>{t("order_details_payment_details", "Payment details")}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("order_details_subtotal", "Subtotal")}</Text>
            <Text style={styles.detailValue}>${subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("order_details_tax", "Tax(7.5%)")}</Text>
            <Text style={styles.detailValue}>${tax.toFixed(2)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("order_details_shipping", "Shipping")}</Text>
            <Text style={styles.detailValue}>${SHIPPING_FEE.toFixed(2)}</Text>
          </View>

          {appliedDiscount > 0 ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t("order_details_discount", "Discount")}</Text>
              <Text style={[styles.detailValue, { color: "#349488" }]}>-${appliedDiscount.toFixed(2)}</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("chat_total_label", "Total")}</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => router.push("/(users)/Information" as any)}
          >
            <Text style={styles.checkoutBtnText}>
              {t("cart_checkout", "Checkout")} (${total.toFixed(2)})
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FBFB" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 60,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  scrollContent: { padding: 16 },
  errorText: { color: "#EF4444", marginBottom: 10, textAlign: "center" },
  cartCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  itemMainRow: { flexDirection: "row" },
  imageWrapper: {
    width: 90,
    height: 90,
    backgroundColor: "#E8F3F2",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  productImg: { width: "80%", height: "80%" },
  itemDetails: { flex: 1, marginLeft: 15, justifyContent: "space-between" },
  itemName: { fontSize: 16, fontWeight: "600", color: "#333" },
  itemPrice: { fontSize: 16, fontWeight: "bold", color: "#349488" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F6F5",
    borderRadius: 10,
    paddingHorizontal: 4,
    height: 38,
  },
  stepBtn: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  stepText: { color: "#349488", fontSize: 18, fontWeight: "600" },
  qtyText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  deleteBtn: { backgroundColor: "#FFF0F0", padding: 8, borderRadius: 8 },
  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  promoBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  promoInput: {
    flex: 1,
    height: 42,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#0F172A",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  applyBtn: {
    height: 42,
    borderRadius: 10,
    backgroundColor: "#349488",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  applyBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  promoText: { fontSize: 16, color: "#333", fontWeight: "500", marginRight: 6 },
  promoApplied: { flexDirection: "row", alignItems: "center" },
  appliedText: { color: "#349488", fontSize: 13, marginLeft: 6 },
  promoAppliedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  promoErrorText: { color: "#EF4444", fontSize: 12, marginBottom: 10 },
  clearPromoText: { color: "#EF4444", fontSize: 13, fontWeight: "600" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: { fontSize: 15, color: "#666" },
  detailValue: { fontSize: 15, fontWeight: "bold", color: "#333" },
  divider: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#DDD",
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  totalLabel: { fontSize: 18, fontWeight: "bold", color: "#333" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "#333" },
  checkoutBtn: {
    backgroundColor: "#349488",
    borderRadius: 15,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  checkoutBtnText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },

});

export default MyCart;
