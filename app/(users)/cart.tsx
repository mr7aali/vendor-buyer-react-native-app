import { SkeletonBlock } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";
import {
  useGetCouponsByVendorQuery,
  useGetMyCouponsQuery,
} from "@/store/api/couponApiSlice";
import {
  useGetCartQuery,
  useRemoveFromCartMutation,
  useUpdateCartItemMutation,
} from "@/store/api/cartApiSlice";
import { VendorCartGroup, groupCartItemsByVendor } from "@/utils/vendor-cart";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VENDOR_THEMES = [
  {
    accent: "#0F766E",
    accentSoft: "#CCFBF1",
    border: "#99F6E4",
    surface: "#F0FDFA",
    chipBg: "#ECFDF5",
    chipText: "#115E59",
  },
  {
    accent: "#0F4C81",
    accentSoft: "#DBEAFE",
    border: "#BFDBFE",
    surface: "#F8FBFF",
    chipBg: "#EFF6FF",
    chipText: "#1D4ED8",
  },
  {
    accent: "#8A4B14",
    accentSoft: "#FDE68A",
    border: "#FCD34D",
    surface: "#FFF9ED",
    chipBg: "#FFFBEB",
    chipText: "#B45309",
  },
  {
    accent: "#7C2D6A",
    accentSoft: "#F5D0FE",
    border: "#E9D5FF",
    surface: "#FDF4FF",
    chipBg: "#FAF5FF",
    chipText: "#A21CAF",
  },
];

const normalizePromoCode = (value: string): string => {
  const raw = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "";

  const withoutPrefix = raw
    .replace(/^code\s*:\s*/i, "")
    .replace(/^coupon\s*code\s*:\s*/i, "")
    .replace(/^promo\s*code\s*:\s*/i, "")
    .replace(/^sent a coupon\s*:\s*/i, "");

  const firstToken = withoutPrefix.split(/\s+-\s+|\s/)[0] || withoutPrefix;
  return firstToken
    .replace(/^[`"']+|[`"']+$/g, "")
    .trim()
    .toLowerCase();
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getVendorTheme = (group: VendorCartGroup, index: number) =>
  VENDOR_THEMES[
    (group.vendorId ? hashString(group.vendorId) : index) % VENDOR_THEMES.length
  ];

const getInitials = (value: string): string => {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "VN";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
};

const buildVendorMetaLine = (group: VendorCartGroup): string => {
  const parts = [
    group.vendorCode ? `Code ${group.vendorCode}` : "",
    group.vendorBusinessName &&
    group.vendorBusinessName !== group.vendorName &&
    group.vendorBusinessName !== group.vendorStoreName
      ? group.vendorBusinessName
      : "",
    group.vendorCountry || "",
  ].filter(Boolean);

  return parts.join(" | ");
};

const formatMoney = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const CartItemSkeleton = () => (
  <View style={styles.vendorSection}>
    <SkeletonBlock style={styles.skeletonVendorBanner} />
    <View style={styles.cartCard}>
      <View style={styles.itemMainRow}>
        <SkeletonBlock style={styles.skeletonImageWrapper} />
        <View style={styles.itemDetails}>
          <SkeletonBlock style={styles.skeletonItemName} />
          <SkeletonBlock style={styles.skeletonItemPrice} />
          <View style={styles.actionRow}>
            <SkeletonBlock style={styles.skeletonStepper} />
            <SkeletonBlock style={styles.skeletonDeleteBtn} />
          </View>
        </View>
      </View>
    </View>
  </View>
);

const CartSummarySkeleton = () => (
  <View style={styles.summaryCard}>
    <SkeletonBlock style={styles.skeletonSectionTitle} />
    <View style={styles.detailRow}>
      <SkeletonBlock style={styles.skeletonDetailLabel} />
      <SkeletonBlock style={styles.skeletonDetailValue} />
    </View>
    <View style={styles.detailRow}>
      <SkeletonBlock style={styles.skeletonDetailLabel} />
      <SkeletonBlock style={styles.skeletonDetailValue} />
    </View>
    <View style={styles.detailRow}>
      <SkeletonBlock style={styles.skeletonDetailLabel} />
      <SkeletonBlock style={styles.skeletonDetailValue} />
    </View>
    <View style={styles.divider} />
    <View style={styles.totalRow}>
      <SkeletonBlock style={styles.skeletonTotalLabel} />
      <SkeletonBlock style={styles.skeletonTotalValue} />
    </View>
    <SkeletonBlock style={styles.skeletonCheckoutBtn} />
  </View>
);

const MyCart: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: cartData, isLoading, isError, refetch } = useGetCartQuery();
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState("");

  const rawItems = useMemo(
    () =>
      cartData?.data?.items ||
      cartData?.items ||
      (Array.isArray(cartData) ? cartData : []),
    [cartData],
  );

  const vendorGroups = useMemo(
    () =>
      groupCartItemsByVendor(rawItems, {
        fallbackVendorName: t("info_vendor_fallback", "Vendor"),
        fallbackProductName: t("cart_unknown_product", "Unknown Product"),
      }),
    [rawItems, t],
  );

  const cartItems = useMemo(
    () => vendorGroups.flatMap((group) => group.items),
    [vendorGroups],
  );
  const cartVendorIds = useMemo(
    () => vendorGroups.map((group) => group.vendorId).filter(Boolean),
    [vendorGroups],
  );
  const activeVendorId = cartVendorIds[0] || "";
  const hasMultipleVendors = cartVendorIds.length > 1;
  const itemCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  const productLineCount = cartItems.length;
  const subtotal = vendorGroups.reduce(
    (sum, group) => sum + Number(group.subtotal || 0),
    0,
  );

  const { data: buyerCoupons = [] } = useGetMyCouponsQuery(undefined);
  const { data: vendorCoupons = [] } = useGetCouponsByVendorQuery(
    activeVendorId,
    {
      skip: !activeVendorId,
    },
  );

  const availableCoupons = useMemo(() => {
    const combinedCoupons = [
      ...(Array.isArray(vendorCoupons) ? vendorCoupons : []),
      ...(Array.isArray(buyerCoupons) ? buyerCoupons : []),
    ];

    const uniqueCoupons = new Map<string, any>();
    combinedCoupons.forEach((coupon: any) => {
      const normalized = normalizePromoCode(coupon?.code || "");
      if (normalized && !uniqueCoupons.has(normalized)) {
        uniqueCoupons.set(normalized, coupon);
      }
    });

    return Array.from(uniqueCoupons.values());
  }, [vendorCoupons, buyerCoupons]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const updateQuantity = async (id: string, type: "inc" | "dec") => {
    const item = cartItems.find((entry: any) => entry.id === id);
    if (!item) return;

    const newQty =
      type === "inc" ? item.quantity + 1 : Math.max(1, item.quantity - 1);
    if (newQty === item.quantity) return;

    try {
      await updateCartItem({ itemId: id, quantity: newQty }).unwrap();
    } catch (err: any) {
      Alert.alert(
        t("error", "Error"),
        err?.data?.message ||
          t("cart_failed_update_quantity", "Failed to update quantity"),
      );
    }
  };

  const removeItem = async (id: string) => {
    try {
      await removeFromCart(id).unwrap();
    } catch (err: any) {
      Alert.alert(
        t("error", "Error"),
        err?.data?.message ||
          t("cart_failed_remove_item", "Failed to remove item"),
      );
    }
  };

  const getPromoValidationError = useCallback(
    (coupon: any) => {
      if (!coupon) {
        return t("cart_promo_invalid", "Invalid promo code");
      }

      if (coupon.isActive === false) {
        return t("cart_promo_inactive", "This promo code is inactive");
      }

      const now = new Date();
      const validFromRaw =
        coupon.validFrom || coupon.startDate || coupon.fromDate;
      const validUntilRaw =
        coupon.validUntil || coupon.endDate || coupon.toDate;
      const validFrom = validFromRaw ? new Date(validFromRaw) : null;
      const validUntil = validUntilRaw ? new Date(validUntilRaw) : null;

      if (
        (validFrom && !Number.isNaN(validFrom.getTime()) && now < validFrom) ||
        (validUntil && !Number.isNaN(validUntil.getTime()) && now > validUntil)
      ) {
        return t("cart_promo_expired", "This promo code is expired");
      }

      const minPurchase = Number(
        coupon.minPurchaseAmount || coupon.minimumPurchase || 0,
      );
      if (subtotal < minPurchase) {
        return t(
          "cart_promo_min_purchase",
          `Minimum purchase amount is $${minPurchase.toFixed(2)}`,
        );
      }

      return "";
    },
    [subtotal, t],
  );

  const calculateDiscountAmount = useCallback(
    (coupon: any) => {
      if (!coupon) return 0;

      const discountType = String(
        coupon.discountType || coupon.type || "",
      ).toLowerCase();
      const discountValue = Number(coupon.discountValue || coupon.value || 0);
      const rawDiscount =
        discountType === "percentage" || discountType === "%"
          ? (subtotal * discountValue) / 100
          : discountValue;

      return Math.max(0, Math.min(rawDiscount, subtotal));
    },
    [subtotal],
  );

  const appliedCoupon = useMemo(() => {
    if (!appliedPromoCode) return null;
    const coupons = Array.isArray(availableCoupons) ? availableCoupons : [];
    return (
      coupons.find(
        (coupon: any) =>
          normalizePromoCode(coupon?.code || "") ===
          normalizePromoCode(appliedPromoCode),
      ) || null
    );
  }, [appliedPromoCode, availableCoupons]);

  const appliedDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (getPromoValidationError(appliedCoupon)) return 0;
    return calculateDiscountAmount(appliedCoupon);
  }, [appliedCoupon, calculateDiscountAmount, getPromoValidationError]);

  React.useEffect(() => {
    if (!appliedPromoCode) return;

    if (hasMultipleVendors) {
      setAppliedPromoCode("");
      setPromoError(
        t(
          "cart_promo_multiple_vendors",
          "Promo codes can only be applied when all cart items are from the same vendor",
        ),
      );
      return;
    }

    if (!appliedCoupon) {
      setAppliedPromoCode("");
      setPromoError(t("cart_promo_invalid", "Invalid promo code"));
      return;
    }

    const validationError = getPromoValidationError(appliedCoupon);
    if (validationError) {
      setAppliedPromoCode("");
      setPromoError(validationError);
    }
  }, [
    appliedPromoCode,
    appliedCoupon,
    getPromoValidationError,
    hasMultipleVendors,
    t,
  ]);

  const handleApplyPromo = () => {
    const normalizedCode = normalizePromoCode(promoCode);
    setPromoError("");

    if (!normalizedCode) {
      setPromoError(t("cart_enter_promo_code", "Please enter a promo code"));
      return;
    }

    if (hasMultipleVendors) {
      setPromoError(
        t(
          "cart_promo_multiple_vendors",
          "Promo codes can only be applied when all cart items are from the same vendor",
        ),
      );
      return;
    }

    if (!activeVendorId) {
      setPromoError(
        t("cart_promo_vendor_missing", "Promo cannot be applied for this cart"),
      );
      return;
    }

    const coupons = Array.isArray(availableCoupons) ? availableCoupons : [];
    const match = coupons.find(
      (coupon: any) =>
        normalizePromoCode(coupon?.code || "") === normalizedCode,
    );

    if (!match) {
      setPromoError(t("cart_promo_invalid", "Invalid promo code"));
      return;
    }

    const validationError = getPromoValidationError(match);
    if (validationError) {
      setPromoError(validationError);
      return;
    }

    setAppliedPromoCode(match.code);
    setPromoCode(match.code);
    setPromoError("");
  };

  const clearAppliedPromo = () => {
    setAppliedPromoCode("");
    setPromoCode("");
    setPromoError("");
  };

  const total = Math.max(0, subtotal - appliedDiscount);
  const hasCartItems = cartItems.length > 0;

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
        {/* <View style={styles.heroCard}>
          {vendorGroups.length ? (
            <View style={styles.heroVendorList}>
              {vendorGroups.map((group, index) => {
                const theme = getVendorTheme(group, index);
                return (
                  <View
                    key={`hero-${group.vendorId || index}`}
                    style={[
                      styles.heroVendorChip,
                      {
                        backgroundColor: theme.chipBg,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.heroVendorDot,
                        { backgroundColor: theme.accent },
                      ]}
                    />
                    <Text style={styles.heroVendorText} numberOfLines={1}>
                      {group.vendorName}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View> */}

        {isError && !isLoading ? (
          <Text style={styles.errorText}>
            {t("cart_failed_load", "Failed to load cart")}
          </Text>
        ) : null}

        {isLoading ? (
          <>
            {Array.from({ length: 2 }).map((_, index) => (
              <CartItemSkeleton key={`cart-skeleton-${index}`} />
            ))}
            <CartSummarySkeleton />
          </>
        ) : !hasCartItems ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cart-outline" size={32} color="#2A8383" />
            </View>
            <Text style={styles.emptyTitle}>
              {t("cart_empty_title", "Your cart is empty")}
            </Text>
            <Text style={styles.emptyText}>
              {t(
                "cart_empty_copy",
                "Add products from connected vendors to start building separate vendor orders here.",
              )}
            </Text>
          </View>
        ) : (
          <>
            {vendorGroups.map((group, index) => {
              const theme = getVendorTheme(group, index);
              const vendorMeta = buildVendorMetaLine(group);

              return (
                <View
                  key={group.vendorId || group.vendorName}
                  style={[
                    styles.vendorSection,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.vendorAccentBar,
                      { backgroundColor: theme.accent },
                    ]}
                  />

                  <View style={styles.vendorHeader}>
                    <View style={styles.vendorIdentity}>
                      {group.vendorLogo ? (
                        <Image
                          source={{ uri: group.vendorLogo }}
                          style={[
                            styles.vendorAvatar,
                            { borderColor: theme.border },
                          ]}
                        />
                      ) : (
                        <View
                          style={[
                            styles.vendorAvatarFallback,
                            { backgroundColor: theme.accentSoft },
                          ]}
                        >
                          <Text
                            style={[
                              styles.vendorAvatarText,
                              { color: theme.accent },
                            ]}
                          >
                            {getInitials(group.vendorName)}
                          </Text>
                        </View>
                      )}

                      <View style={{ flex: 1 }}>
                        <View style={styles.vendorNameRow}>
                          <Text style={styles.vendorName}>
                            {group.vendorName}
                          </Text>
                          <View
                            style={[
                              styles.vendorOrderBadge,
                              { backgroundColor: theme.chipBg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.vendorOrderBadgeText,
                                { color: theme.chipText },
                              ]}
                            >
                              {hasMultipleVendors
                                ? `${t("cart_order_label", "Order")} ${
                                    index + 1
                                  }`
                                : t("cart_sub_cart", "Sub-cart")}
                            </Text>
                          </View>
                        </View>

                        {vendorMeta ? (
                          <Text style={styles.vendorMeta} numberOfLines={1}>
                            {vendorMeta}
                          </Text>
                        ) : null}

                        {group.vendorAddress ? (
                          <Text style={styles.vendorAddress} numberOfLines={1}>
                            {group.vendorAddress}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  <View style={styles.vendorMetricsRow}>
                    <View
                      style={[
                        styles.vendorMetricCard,
                        { backgroundColor: "#FFFFFFCC" },
                      ]}
                    >
                      <Text style={styles.vendorMetricLabel}>
                        {t("cart_items_count", "Items")}
                      </Text>
                      <Text style={styles.vendorMetricValue}>
                        {group.itemCount}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.vendorMetricCard,
                        { backgroundColor: "#FFFFFFCC" },
                      ]}
                    >
                      <Text style={styles.vendorMetricLabel}>
                        {t("cart_product_lines", "Products")}
                      </Text>
                      <Text style={styles.vendorMetricValue}>
                        {group.items.length}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.vendorMetricCard,
                        { backgroundColor: "#FFFFFFCC" },
                      ]}
                    >
                      <Text style={styles.vendorMetricLabel}>
                        {t("order_details_subtotal", "Subtotal")}
                      </Text>
                      <Text
                        style={[
                          styles.vendorMetricValue,
                          { color: theme.accent },
                        ]}
                      >
                        {formatMoney(group.subtotal)}
                      </Text>
                    </View>
                  </View>

                  {group.items.map((item: any) => (
                    <View
                      key={item.id}
                      style={[
                        styles.cartCard,
                        {
                          borderColor: theme.border,
                          backgroundColor: "#FFFFFF",
                        },
                      ]}
                    >
                      <View style={styles.itemMainRow}>
                        <View
                          style={[
                            styles.imageWrapper,
                            { backgroundColor: theme.chipBg },
                          ]}
                        >
                          <Image
                            source={{ uri: item.image }}
                            style={styles.productImg}
                            resizeMode="contain"
                          />
                        </View>
                        <View style={styles.itemDetails}>
                          <View>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemVendorHint}>
                              {group.vendorCode
                                ? `Vendor ${group.vendorCode}`
                                : group.vendorName}
                            </Text>
                          </View>

                          <View style={styles.itemFooterRow}>
                            <View>
                              <Text style={styles.itemPrice}>
                                {formatMoney(item.price)}
                              </Text>
                              <Text style={styles.itemLineTotal}>
                                {formatMoney(item.price * item.quantity)} total
                              </Text>
                            </View>

                            <View style={styles.itemActions}>
                              <View style={styles.stepper}>
                                <TouchableOpacity
                                  onPress={() => updateQuantity(item.id, "dec")}
                                  style={styles.stepBtn}
                                >
                                  <Text style={styles.stepText}>-</Text>
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>
                                  {item.quantity}
                                </Text>
                                <TouchableOpacity
                                  onPress={() => updateQuantity(item.id, "inc")}
                                  style={styles.stepBtn}
                                >
                                  <Text
                                    style={[styles.stepText, { fontSize: 22 }]}
                                  >
                                    +
                                  </Text>
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
                    </View>
                  ))}

                  <View
                    style={[
                      styles.vendorFooter,
                      { borderTopColor: theme.border },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vendorFooterTitle}>
                        {t(
                          "cart_separate_receipt",
                          "Separate receipt at checkout",
                        )}
                      </Text>
                      <Text style={styles.vendorFooterText}>
                        {t(
                          "cart_vendor_footer_copy",
                          "You will review this vendor order independently before payment.",
                        )}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.vendorFooterTotal,
                        { color: theme.accent },
                      ]}
                    >
                      {formatMoney(group.subtotal)}
                    </Text>
                  </View>
                </View>
              );
            })}

            <View style={styles.summaryCard}>
              {hasMultipleVendors ? (
                <View style={styles.noticeBox}>
                  <Ionicons
                    name="git-compare-outline"
                    size={18}
                    color="#2A8383"
                  />
                  <Text style={styles.noticeText}>
                    {t(
                      "cart_multi_vendor_copy",
                      "Your cart is split into separate vendor orders. You can add different notes and accept terms for each vendor during checkout.",
                    )}
                  </Text>
                </View>
              ) : (
                <>
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
                      onFocus={() => {
                        if (!appliedPromoCode) setPromoError("");
                      }}
                      returnKeyType="done"
                      onSubmitEditing={handleApplyPromo}
                      placeholderTextColor="#94A3B8"
                    />
                    <TouchableOpacity
                      style={[
                        styles.applyBtn,
                        (isLoading || !promoCode.trim()) &&
                          styles.applyBtnDisabled,
                      ]}
                      onPress={handleApplyPromo}
                      disabled={isLoading || !promoCode.trim()}
                    >
                      <Text style={styles.applyBtnText}>
                        {t("product_details_apply", "Apply")}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {promoError ? (
                    <Text style={styles.promoErrorText}>{promoError}</Text>
                  ) : null}

                  {appliedPromoCode ? (
                    <View style={styles.promoAppliedRow}>
                      <View style={styles.promoApplied}>
                        <Text style={styles.promoText}>{appliedPromoCode}</Text>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#349488"
                        />
                        <Text style={styles.appliedText}>
                          {t("cart_promo_applied", "Promo code applied")}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={clearAppliedPromo}>
                        <Text style={styles.clearPromoText}>
                          {t("cart_remove_promo", "Remove")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </>
              )}

              <Text style={styles.sectionTitle}>
                {t("cart_vendor_split", "Vendor split")}
              </Text>

              <View style={styles.splitList}>
                {vendorGroups.map((group, index) => {
                  const theme = getVendorTheme(group, index);
                  return (
                    <View
                      key={`summary-${group.vendorId || group.vendorName}`}
                      style={[
                        styles.splitCard,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <View style={styles.splitCardLeft}>
                        <View
                          style={[
                            styles.splitDot,
                            { backgroundColor: theme.accent },
                          ]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.splitCardTitle} numberOfLines={1}>
                            {group.vendorName}
                          </Text>
                          <Text style={styles.splitCardMeta}>
                            {group.items.length} products | {group.itemCount}{" "}
                            items
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.splitCardValue}>
                        {formatMoney(group.subtotal)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>
                {t("order_details_payment_details", "Payment details")}
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {t("cart_vendors_count", "Vendors")}
                </Text>
                <Text style={styles.detailValue}>{vendorGroups.length}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {t("cart_items_count", "Items")}
                </Text>
                <Text style={styles.detailValue}>{itemCount}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {t("order_details_subtotal", "Subtotal")}
                </Text>
                <Text style={styles.detailValue}>{formatMoney(subtotal)}</Text>
              </View>

              {appliedDiscount > 0 ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t("order_details_discount", "Discount")}
                  </Text>
                  <Text style={[styles.detailValue, { color: "#349488" }]}>
                    -{formatMoney(appliedDiscount)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  {t("chat_total_label", "Total")}
                </Text>
                <Text style={styles.totalValue}>{formatMoney(total)}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.checkoutBtn,
                  !hasCartItems && styles.checkoutBtnDisabled,
                ]}
                disabled={!hasCartItems}
                onPress={() => {
                  if (!hasCartItems) return;

                  router.push({
                    pathname: "/(users)/Information" as any,
                    params: appliedPromoCode
                      ? { promoCode: appliedPromoCode }
                      : undefined,
                  });
                }}
              >
                <Text style={styles.checkoutBtnText}>
                  {hasMultipleVendors
                    ? `${t(
                        "cart_checkout_vendor_orders",
                        "Checkout vendor orders",
                      )} (${vendorGroups.length})`
                    : `${t("cart_checkout", "Checkout")} (${formatMoney(total)})`}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F8F7" },
  header: {
    direction: "ltr",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 60,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#173332" },
  scrollContent: { padding: 16, paddingBottom: 30 },
  heroCard: {
    backgroundColor: "#123C39",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.14)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  heroTitle: { fontSize: 20, fontWeight: "700", color: "#F7FFFE" },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#CBE3E0",
    marginTop: 6,
  },
  heroStatsRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  heroStatValue: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  heroStatLabel: { fontSize: 12, color: "#D8ECE9", marginTop: 3 },
  heroVendorList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
  },
  heroVendorChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
    maxWidth: "100%",
  },
  heroVendorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  heroVendorText: {
    color: "#143735",
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
  },
  errorText: { color: "#EF4444", marginBottom: 10, textAlign: "center" },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 26,
    borderWidth: 1,
    borderColor: "#E2ECEA",
    alignItems: "center",
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EAF6F3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#193433" },
  emptyText: {
    marginTop: 8,
    textAlign: "center",
    color: "#6C807E",
    fontSize: 14,
    lineHeight: 21,
  },
  vendorSection: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  vendorAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  vendorHeader: {
    marginTop: 6,
    marginBottom: 14,
  },
  vendorIdentity: {
    flexDirection: "row",
    alignItems: "center",
  },
  vendorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    marginRight: 12,
    backgroundColor: "#FFFFFF",
  },
  vendorAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  vendorAvatarText: { fontSize: 18, fontWeight: "700" },
  vendorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vendorName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#173332",
    marginRight: 10,
  },
  vendorOrderBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  vendorOrderBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  vendorMeta: {
    fontSize: 12,
    color: "#5E7472",
    marginTop: 4,
  },
  vendorAddress: {
    fontSize: 12,
    color: "#7A8C8A",
    marginTop: 4,
  },
  vendorMetricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  vendorMetricCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#FFFFFF90",
  },
  vendorMetricLabel: { fontSize: 11, color: "#6C817F" },
  vendorMetricValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "700",
    color: "#163432",
  },
  cartCard: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  itemMainRow: { flexDirection: "row" },
  imageWrapper: {
    width: 96,
    height: 96,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  productImg: { width: "78%", height: "78%" },
  skeletonVendorBanner: {
    width: "100%",
    height: 96,
    borderRadius: 18,
    marginBottom: 14,
  },
  skeletonImageWrapper: {
    width: 96,
    height: 96,
    borderRadius: 16,
  },
  itemDetails: { flex: 1, marginLeft: 14, justifyContent: "space-between" },
  itemName: { fontSize: 16, fontWeight: "700", color: "#1C2C2B" },
  itemVendorHint: { fontSize: 12, color: "#6E8280", marginTop: 4 },
  itemFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  itemActions: {
    alignItems: "flex-end",
  },
  itemPrice: { fontSize: 17, fontWeight: "700", color: "#173432" },
  itemLineTotal: { fontSize: 12, color: "#69807D", marginTop: 4 },
  skeletonItemName: { width: "78%", height: 16, borderRadius: 8 },
  skeletonItemPrice: { width: 70, height: 16, borderRadius: 8, marginTop: 8 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F6F5",
    borderRadius: 12,
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
    fontWeight: "700",
    color: "#333",
  },
  deleteBtn: {
    backgroundColor: "#FFF0F0",
    padding: 8,
    borderRadius: 10,
    marginTop: 8,
  },
  vendorFooter: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    marginTop: 2,
    paddingTop: 14,
  },
  vendorFooterTitle: { fontSize: 13, fontWeight: "700", color: "#183231" },
  vendorFooterText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#647978",
    marginTop: 4,
  },
  vendorFooterTotal: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
  skeletonStepper: { width: 120, height: 38, borderRadius: 10 },
  skeletonDeleteBtn: { width: 38, height: 38, borderRadius: 8 },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E2ECEA",
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EEF9F6",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    marginLeft: 10,
    color: "#486260",
    fontSize: 13,
    lineHeight: 19,
  },
  promoBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5EBEF",
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#FAFCFC",
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
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  skeletonSectionTitle: {
    width: 150,
    height: 20,
    borderRadius: 10,
    marginBottom: 18,
  },
  skeletonDetailLabel: { width: 110, height: 14, borderRadius: 7 },
  skeletonDetailValue: { width: 54, height: 14, borderRadius: 7 },
  skeletonTotalLabel: { width: 68, height: 18, borderRadius: 9 },
  skeletonTotalValue: { width: 82, height: 18, borderRadius: 9 },
  skeletonCheckoutBtn: { height: 55, borderRadius: 15, marginTop: 8 },
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
    fontWeight: "700",
    color: "#173332",
    marginBottom: 15,
  },
  splitList: { marginBottom: 6 },
  splitCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  splitCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  splitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  splitCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#173332",
  },
  splitCardMeta: { fontSize: 12, color: "#6C807E", marginTop: 3 },
  splitCardValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#173332",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: { fontSize: 15, color: "#667976", flex: 1, marginRight: 12 },
  detailValue: { fontSize: 15, fontWeight: "700", color: "#173332" },
  divider: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#D6DEDD",
    marginVertical: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  totalLabel: { fontSize: 18, fontWeight: "700", color: "#173332" },
  totalValue: { fontSize: 18, fontWeight: "700", color: "#173332" },
  checkoutBtn: {
    backgroundColor: "#349488",
    borderRadius: 16,
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  checkoutBtnDisabled: {
    backgroundColor: "#B8D8D3",
  },
  checkoutBtnText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default MyCart;
