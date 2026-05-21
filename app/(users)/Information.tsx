import { useTranslation } from "@/hooks/use-translation";
import { useCreateOrderMutation } from "@/store/api/orderApiSlice";
import { useGetCartQuery } from "@/store/api/cartApiSlice";
import { RootState } from "@/store/store";
import { groupCartItemsByVendor, VendorCartGroup } from "@/utils/vendor-cart";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

const INPUT_PLACEHOLDER_COLOR = "#8A969D";

type VendorCheckoutPreferences = Record<
  string,
  {
    note: string;
    termsAccepted: boolean;
  }
>;

const formatMoney = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const getOrderSummaryPayload = (order: any, fallbackGroup: VendorCartGroup) => ({
  id: String(order?.id || order?._id || ""),
  orderNumber: String(order?.orderNumber || ""),
  status: String(order?.status || "pending"),
  totalAmount: Number(order?.totalAmount || fallbackGroup.subtotal || 0),
  subtotal: Number(order?.subtotal || fallbackGroup.subtotal || 0),
  itemCount: Number(
    order?.orderItems?.reduce(
      (sum: number, item: any) => sum + Number(item?.quantity || 0),
      0,
    ) || fallbackGroup.itemCount,
  ),
  customerNote: String(order?.customerNote || "").trim(),
  termsAccepted: order?.termsAccepted === true,
  vendor: {
    id: String(order?.vendor?.id || fallbackGroup.vendorId || ""),
    name: String(
      order?.vendor?.storename ||
        order?.vendor?.businessName ||
        order?.vendor?.fullName ||
        fallbackGroup.vendorName,
    ),
    logoUrl: String(order?.vendor?.logoUrl || fallbackGroup.vendorLogo || ""),
  },
});

export default function InformationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { promoCode: promoCodeParam } = useLocalSearchParams();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: cartData } = useGetCartQuery();
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  const appliedPromoCode = String(promoCodeParam || "").trim();

  const [fullName, setFullName] = useState(
    (user as any)?.buyer?.fullName || user?.name || "",
  );
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(
    (user as any)?.buyer?.phone || user?.phone || "",
  );
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [stateValue, setStateValue] = useState<string>("");
  const [countryCode, setCountryCode] = useState<CountryCode>("US");
  const [countryName, setCountryName] = useState<string>("United States");
  const [isCountryPickerVisible, setIsCountryPickerVisible] =
    useState<boolean>(false);
  const [vendorPreferences, setVendorPreferences] =
    useState<VendorCheckoutPreferences>({});

  useEffect(() => {
    if (!user) return;
    const buyer = (user as any)?.buyer;
    if (buyer?.fullName || user.name) setFullName(buyer?.fullName || user.name);
    if (user.email) setEmail(user.email);
    if (buyer?.phone || user.phone) setPhone(buyer?.phone || user.phone);
  }, [user]);

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

  useEffect(() => {
    setVendorPreferences((current) => {
      const next: VendorCheckoutPreferences = {};

      vendorGroups.forEach((group) => {
        next[group.vendorId] = current[group.vendorId] || {
          note: "",
          termsAccepted: false,
        };
      });

      return next;
    });
  }, [vendorGroups]);

  const totalVendorOrders = vendorGroups.length;
  const grandTotal = vendorGroups.reduce(
    (sum, group) => sum + Number(group.subtotal || 0),
    0,
  );

  const onSelectCountry = (country: Country) => {
    setCountryCode(country.cca2);
    setCountryName(String(country.name || "United States"));
    setIsCountryPickerVisible(false);
  };

  const updateVendorPreference = (
    vendorId: string,
    patch: Partial<VendorCheckoutPreferences[string]>,
  ) => {
    setVendorPreferences((current) => ({
      ...current,
      [vendorId]: {
        ...(current[vendorId] || { note: "", termsAccepted: false }),
        ...patch,
      },
    }));
  };

  const routeToReceipts = (orders: any[], notice?: string) => {
    const serializedOrders = encodeURIComponent(JSON.stringify(orders));

    router.replace({
      pathname: "/(user_screen)/VendorOrderReceiptsScreen" as any,
      params: notice
        ? { orders: serializedOrders, notice }
        : { orders: serializedOrders },
    });
  };

  const handleContinue = async () => {
    if (
      !fullName.trim() ||
      !email.trim() ||
      !address1.trim() ||
      !city.trim() ||
      !stateValue.trim() ||
      !zipCode.trim()
    ) {
      Alert.alert(
        t("error", "Error"),
        t(
          "info_fill_required_fields",
          "Please fill all required shipping fields before continuing.",
        ),
      );
      return;
    }

    if (vendorGroups.length === 0) {
      Alert.alert(
        t("error", "Error"),
        t("info_cart_empty", "Your cart is empty"),
      );
      return;
    }

    const invalidVendorGroup = vendorGroups.find((group) => !group.vendorId);
    if (invalidVendorGroup) {
      Alert.alert(
        t("error", "Error"),
        t(
          "info_vendor_missing",
          "Unable to process some cart items because vendor information is missing.",
        ),
      );
      return;
    }

    const groupWithoutTerms = vendorGroups.find(
      (group) => !vendorPreferences[group.vendorId]?.termsAccepted,
    );
    if (groupWithoutTerms) {
      Alert.alert(
        t("error", "Error"),
        `${groupWithoutTerms.vendorName}: ${t(
          "info_accept_terms_required",
          "Please accept the terms before creating this vendor order.",
        )}`,
      );
      return;
    }

    const shippingAddress = `${address1.trim()}${
      address2.trim() ? `, ${address2.trim()}` : ""
    }, ${city.trim()}, ${stateValue.trim()} ${zipCode.trim()}, ${countryName}`;

    const createdOrders: any[] = [];
    let failedGroup: VendorCartGroup | null = null;
    let failedMessage = "";

    for (const group of vendorGroups) {
      try {
        const payload = {
          vendorId: group.vendorId,
          shippingAddress,
          optionalAddress: address2.trim(),
          country: countryName,
          customerNote: vendorPreferences[group.vendorId]?.note?.trim() || "",
          termsAccepted:
            vendorPreferences[group.vendorId]?.termsAccepted === true,
          ...(appliedPromoCode && totalVendorOrders === 1
            ? { couponCode: appliedPromoCode }
            : {}),
        };

        const order = await createOrder(payload).unwrap();
        createdOrders.push(getOrderSummaryPayload(order, group));
      } catch (error: any) {
        failedGroup = group;
        failedMessage =
          error?.data?.message ||
          t("info_failed_place_order", "Failed to place order");
        break;
      }
    }

    if (createdOrders.length > 0) {
      const partialNotice = failedGroup
        ? `${failedGroup.vendorName}: ${failedMessage}`
        : undefined;
      routeToReceipts(createdOrders, partialNotice);
      return;
    }

    Alert.alert(t("error", "Error"), failedMessage);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("info_title", "Information")}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>
              {t("info_multi_vendor_checkout", "Multi-vendor checkout")}
            </Text>
            <Text style={styles.introText}>
              {t(
                "info_multi_vendor_checkout_copy",
                "Each vendor will become its own order and receipt. Add any vendor-specific notes below, then review or pay each receipt separately after checkout.",
              )}
            </Text>
            <View style={styles.introStatsRow}>
              <View style={styles.introStat}>
                <Text style={styles.introStatValue}>{totalVendorOrders}</Text>
                <Text style={styles.introStatLabel}>
                  {t("info_vendors", "Vendors")}
                </Text>
              </View>
              <View style={styles.introStatDivider} />
              <View style={styles.introStat}>
                <Text style={styles.introStatValue}>{formatMoney(grandTotal)}</Text>
                <Text style={styles.introStatLabel}>
                  {t("chat_total_label", "Total")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t("info_country_region", "Country/Region")}
            </Text>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setIsCountryPickerVisible(true)}
            >
              <View style={styles.countryValueWrap}>
                <Text style={styles.inputText}>{countryName}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t("info_full_name", "Full Name")}</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("info_full_name_placeholder", "Rokey Mahmud")}
              placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t("info_email", "Email")}</Text>
            <TextInput
              style={[styles.input, { opacity: 0.6 }]}
              value={email}
              editable={false}
              placeholder={t("info_email_placeholder", "example@email.com")}
              placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t("info_phone", "Phone")}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={t("info_phone_placeholder", "+1 9999999999")}
              placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t("info_address_1", "Address 1")}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address1}
              onChangeText={setAddress1}
              placeholder={t(
                "info_address_placeholder",
                "123 Main Street, Jersey City, New Jersey 07302, USA",
              )}
              placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t("info_address_2_optional", "Address 2 (optional)")}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address2}
              onChangeText={setAddress2}
              placeholder={t(
                "info_address_placeholder",
                "Apartment, suite, company, or delivery landmark",
              )}
              placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
              multiline
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>{t("info_city", "City")}</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1.2, marginRight: 8 }]}>
              <Text style={styles.label}>{t("info_state", "State")}</Text>
              <TextInput
                style={styles.input}
                value={stateValue}
                onChangeText={setStateValue}
                placeholder={t("info_state", "State")}
                placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
              />
            </View>

            <View style={[styles.formGroup, { flex: 0.8 }]}>
              <Text style={styles.label}>{t("info_zip_code", "Zip Code")}</Text>
              <TextInput
                style={styles.input}
                value={zipCode}
                onChangeText={setZipCode}
                placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.vendorOrdersCard}>
            <Text style={styles.vendorOrdersTitle}>
              {t("info_vendor_orders", "Vendor orders")}
            </Text>
            {appliedPromoCode && totalVendorOrders === 1 ? (
              <View style={styles.promoBadge}>
                <Ionicons name="pricetag-outline" size={16} color="#2A8383" />
                <Text style={styles.promoBadgeText}>
                  {t("info_promo_applied", "Promo applied")}: {appliedPromoCode}
                </Text>
              </View>
            ) : null}

            {vendorGroups.map((group) => {
              const vendorState = vendorPreferences[group.vendorId] || {
                note: "",
                termsAccepted: false,
              };

              return (
                <View
                  key={group.vendorId || group.vendorName}
                  style={styles.vendorOrderSection}
                >
                  <View style={styles.vendorOrderHeader}>
                    <View style={styles.vendorOrderIdentity}>
                      <View style={styles.vendorLogo}>
                        <Ionicons
                          name="storefront-outline"
                          size={18}
                          color="#2A8383"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.vendorOrderName}>
                          {group.vendorName}
                        </Text>
                        <Text style={styles.vendorOrderMeta}>
                          {group.items.length}{" "}
                          {t("order_details_order_items", "items")} •{" "}
                          {formatMoney(group.subtotal)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {group.items.map((item) => (
                    <View key={item.id} style={styles.vendorItemRow}>
                      <View style={styles.vendorItemBullet} />
                      <Text style={styles.vendorItemText}>
                        {item.name} x{item.quantity}
                      </Text>
                    </View>
                  ))}

                  <Text style={styles.vendorFieldLabel}>
                    {t("info_vendor_note", "Note for this vendor")}
                  </Text>
                  <TextInput
                    style={styles.vendorNoteInput}
                    value={vendorState.note}
                    onChangeText={(value) =>
                      updateVendorPreference(group.vendorId, { note: value })
                    }
                    placeholder={t(
                      "info_vendor_note_placeholder",
                      "Add delivery instructions, packaging notes, or other vendor-specific terms.",
                    )}
                    placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
                    multiline
                  />

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.termsRow}
                    onPress={() =>
                      updateVendorPreference(group.vendorId, {
                        termsAccepted: !vendorState.termsAccepted,
                      })
                    }
                  >
                    <View
                      style={[
                        styles.checkbox,
                        vendorState.termsAccepted && styles.checkboxChecked,
                      ]}
                    >
                      {vendorState.termsAccepted ? (
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      ) : null}
                    </View>
                    <Text style={styles.termsText}>
                      {t(
                        "info_terms_copy",
                        "I confirm the shipping details and accept the terms for this vendor order.",
                      )}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.continueButton,
              (isCreatingOrder || totalVendorOrders === 0) &&
                styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={isCreatingOrder || totalVendorOrders === 0}
          >
            {isCreatingOrder ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.continueButtonText}>
                {totalVendorOrders > 1
                  ? `${t(
                      "info_create_vendor_orders",
                      "Create vendor orders",
                    )} (${totalVendorOrders})`
                  : t("info_continue", "Continue")}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {isCountryPickerVisible ? (
        <CountryPicker
          countryCode={countryCode}
          withFilter
          withFlag
          withCountryNameButton
          withAlphaFilter
          withCloseButton
          visible
          onSelect={onSelectCountry}
          onClose={() => setIsCountryPickerVisible(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    direction: "ltr",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#333" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  introCard: {
    backgroundColor: "#F2FBFA",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D7ECE8",
    padding: 16,
    marginBottom: 20,
  },
  introTitle: { fontSize: 18, fontWeight: "700", color: "#123B39" },
  introText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#45615F",
    marginTop: 8,
  },
  introStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  introStat: { flex: 1 },
  introStatValue: { fontSize: 18, fontWeight: "700", color: "#123B39" },
  introStatLabel: { fontSize: 12, color: "#5E7774", marginTop: 2 },
  introStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#CDE3DF",
    marginHorizontal: 12,
  },
  formGroup: { marginBottom: 15 },
  label: {
    fontSize: 17,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F5F7F6",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 14,
    color: "#333",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  textArea: {
    height: 70,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  countrySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F7F6",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  countryValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  inputText: { fontSize: 14, color: "#333" },
  row: { flexDirection: "row" },
  vendorOrdersCard: {
    backgroundColor: "#FBFCFC",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E4ECEB",
    padding: 16,
    marginTop: 8,
  },
  vendorOrdersTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F3130",
    marginBottom: 12,
  },
  promoBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E9F8F5",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  promoBadgeText: {
    color: "#2A8383",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  vendorOrderSection: {
    borderWidth: 1,
    borderColor: "#E5ECEA",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    backgroundColor: "#FFF",
  },
  vendorOrderHeader: {
    marginBottom: 10,
  },
  vendorOrderIdentity: {
    flexDirection: "row",
    alignItems: "center",
  },
  vendorLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E7F3F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  vendorOrderName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#203231",
  },
  vendorOrderMeta: {
    fontSize: 12,
    color: "#6A7D7B",
    marginTop: 2,
  },
  vendorItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  vendorItemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2A8383",
    marginRight: 10,
  },
  vendorItemText: {
    flex: 1,
    fontSize: 13,
    color: "#445654",
  },
  vendorFieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#203231",
    marginTop: 6,
    marginBottom: 8,
  },
  vendorNoteInput: {
    borderWidth: 1,
    borderColor: "#DBE5E3",
    borderRadius: 12,
    minHeight: 88,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#243332",
    textAlignVertical: "top",
    backgroundColor: "#F9FBFB",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#BDD2CF",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#2A8383",
    borderColor: "#2A8383",
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "#4F6462",
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: "#2A8383",
    borderRadius: 15,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  continueButtonDisabled: {
    opacity: 0.65,
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
