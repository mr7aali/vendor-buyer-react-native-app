import { useCreateCouponMutation } from "@/store/api/couponApiSlice";
import { useTranslation } from "@/hooks/use-translation";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MakeNewCoupon: React.FC = () => {
  const { language, t } = useTranslation();
  const router = useRouter();
  const [createCoupon, { isLoading: isCreating }] = useCreateCouponMutation();

  // State for form fields
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minTransaction, setMinTransaction] = useState("");
  const [validFrom, setValidFrom] = useState(new Date());
  const [validUntil, setValidUntil] = useState(new Date());
  const [usageLimit, setUsageLimit] = useState("");
  const [showDatePicker, setShowDatePicker] = useState<"from" | "until" | null>(null);

  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        makeNewCoupon: "צור קופון חדש",
        couponName: "שם קופון (לדוגמה: Summer Sale)",
        couponCode: "קוד קופון (לדוגמה: SAVE10)",
        percentage: "אחוזים",
        fixedAmount: "סכום קבוע",
        discountPercentage: "הנחה % (לדוגמה: 10)",
        discountAmount: "סכום הנחה (לדוגמה: 50)",
        minPurchase: "סכום רכישה מינימלי (אופציונלי)",
        usageLimit: "מגבלת שימוש (אופציונלי)",
        validFrom: "בתוקף מתאריך",
        validUntil: "בתוקף עד",
        createCoupon: "צור קופון",
        pleaseEnterName: "נא להזין שם קופון",
        pleaseEnterCode: "נא להזין קוד קופון",
        pleaseEnterValidDiscount: "נא להזין ערך הנחה תקין",
        couponCreated: "הקופון נוצר בהצלחה!",
        failedCreateCoupon: "יצירת הקופון נכשלה. נסה שוב.",
      };
    }
    if (language === "hi") {
      return {
        makeNewCoupon: "नया कूपन बनाएं",
        couponName: "कूपन नाम (जैसे, Summer Sale)",
        couponCode: "कूपन कोड (जैसे, SAVE10)",
        percentage: "प्रतिशत",
        fixedAmount: "फिक्स्ड राशि",
        discountPercentage: "डिस्काउंट % (जैसे, 10)",
        discountAmount: "डिस्काउंट राशि (जैसे, 50)",
        minPurchase: "न्यूनतम खरीद राशि (वैकल्पिक)",
        usageLimit: "उपयोग सीमा (वैकल्पिक)",
        validFrom: "वैध प्रारंभ",
        validUntil: "वैध समाप्ति",
        createCoupon: "कूपन बनाएं",
        pleaseEnterName: "कृपया कूपन नाम दर्ज करें",
        pleaseEnterCode: "कृपया कूपन कोड दर्ज करें",
        pleaseEnterValidDiscount: "कृपया मान्य डिस्काउंट दर्ज करें",
        couponCreated: "कूपन सफलतापूर्वक बन गया!",
        failedCreateCoupon: "कूपन बनाना विफल रहा। कृपया फिर से प्रयास करें।",
      };
    }
    return {
      makeNewCoupon: "Make a New Coupon",
      couponName: "Coupon Name (e.g., Summer Sale)",
      couponCode: "Coupon Code (e.g., SAVE10)",
      percentage: "Percentage",
      fixedAmount: "Fixed Amount",
      discountPercentage: "Discount % (e.g., 10)",
      discountAmount: "Discount Amount (e.g., 50)",
      minPurchase: "Min. Purchase Amount (optional)",
      usageLimit: "Usage Limit (optional)",
      validFrom: "Valid From",
      validUntil: "Valid Until",
      createCoupon: "Create a coupon",
      pleaseEnterName: "Please enter a coupon name",
      pleaseEnterCode: "Please enter a coupon code",
      pleaseEnterValidDiscount: "Please enter a valid discount value",
      couponCreated: "Coupon created successfully!",
      failedCreateCoupon: "Failed to create coupon. Please try again.",
    };
  }, [language]);

  // Date format korar function
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentField = showDatePicker;
    setShowDatePicker(null);
    if (selectedDate && currentField) {
      if (currentField === "from") {
        setValidFrom(selectedDate);
      } else {
        setValidUntil(selectedDate);
      }
    }
  };

  const handleCreateCoupon = async () => {
    const normalizedValidFrom = new Date(validFrom);
    normalizedValidFrom.setHours(0, 0, 0, 0);

    const normalizedValidUntil = new Date(validUntil);
    normalizedValidUntil.setHours(23, 59, 59, 999);

    // Validation
    if (!name.trim()) {
      Alert.alert(t("error", "Error"), ui.pleaseEnterName);
      return;
    }
    if (!discountValue || parseFloat(discountValue) <= 0) {
      Alert.alert(t("error", "Error"), ui.pleaseEnterValidDiscount);
      return;
    }
    if (normalizedValidUntil < normalizedValidFrom) {
      Alert.alert(t("error", "Error"), "Valid until date must be after the valid from date");
      return;
    }

    try {
      await createCoupon({
        name: name.trim(),
        discountType,
        discountValue: parseFloat(discountValue),
        validFrom: normalizedValidFrom.toISOString(),
        validUntil: normalizedValidUntil.toISOString(),
        minPurchaseAmount: minTransaction ? parseFloat(minTransaction) : undefined,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : undefined,
      }).unwrap();

      Alert.alert(t("success", "Success"), ui.couponCreated);
      router.replace("/(screens)/MakeCoupon");
    } catch (error: any) {
      console.error("Failed to create coupon:", error);
      Alert.alert(t("error", "Error"), error?.data?.message || ui.failedCreateCoupon);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{ui.makeNewCoupon}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Form Fields */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={ui.couponName}
              value={name}
              onChangeText={setName}
              placeholderTextColor="#99ABB3"
            />
          </View>

          {/* Discount Type Selector */}
          <View style={styles.inputContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <TouchableOpacity
                style={[styles.typeBtn, discountType === 'percentage' && styles.typeBtnActive]}
                onPress={() => setDiscountType('percentage')}
              >
                <Text style={[styles.typeBtnText, discountType === 'percentage' && styles.typeBtnTextActive]}>{ui.percentage}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, discountType === 'fixed' && styles.typeBtnActive]}
                onPress={() => setDiscountType('fixed')}
              >
                <Text style={[styles.typeBtnText, discountType === 'fixed' && styles.typeBtnTextActive]}>{ui.fixedAmount}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={discountType === 'percentage' ? ui.discountPercentage : ui.discountAmount}
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="numeric"
              placeholderTextColor="#99ABB3"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={ui.minPurchase}
              value={minTransaction}
              onChangeText={setMinTransaction}
              keyboardType="numeric"
              placeholderTextColor="#99ABB3"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={ui.usageLimit}
              value={usageLimit}
              onChangeText={setUsageLimit}
              keyboardType="numeric"
              placeholderTextColor="#99ABB3"
            />
          </View>

          {/* Valid From Date Picker */}
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowDatePicker("from")}
          >
            <Text
              style={[
                styles.input,
                {
                  color: "#333",
                  textAlignVertical: "center",
                  paddingTop: 12,
                },
              ]}
            >
              {`${ui.validFrom}: ${formatDate(validFrom)}`}
            </Text>
          </TouchableOpacity>

          {/* Valid Until Date Picker */}
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowDatePicker("until")}
          >
            <Text
              style={[
                styles.input,
                {
                  color: "#333",
                  textAlignVertical: "center",
                  paddingTop: 12,
                },
              ]}
            >
              {`${ui.validUntil}: ${formatDate(validUntil)}`}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={showDatePicker === "from" ? validFrom : validUntil}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={showDatePicker === "until" ? validFrom : new Date()}
            />
          )}
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.createBtn, isCreating && styles.createBtnDisabled]}
            onPress={handleCreateCoupon}
            disabled={isCreating}
          >
            <Text style={styles.createBtnText}>
              {isCreating ? t("loading", "Loading...") : ui.createCoupon}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFB",
  },
  header: {
    direction: 'ltr',
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 60,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4B5563",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  inputContainer: {
    backgroundColor: "#E8F1F1",
    borderRadius: 12,
    height: 55,
    marginBottom: 16,
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  input: {
    fontSize: 16,
    color: "#333",
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#349488",
    backgroundColor: "#FFF",
    alignItems: "center",
  },
  typeBtnActive: {
    backgroundColor: "#349488",
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#349488",
  },
  typeBtnTextActive: {
    color: "#FFF",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  createBtn: {
    backgroundColor: "#349488",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  createBtnDisabled: {
    opacity: 0.7,
  },
  createBtnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default MakeNewCoupon;
