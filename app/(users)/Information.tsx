// import { useGetCartQuery, useRemoveFromCartMutation } from "@/store/api/cartApiSlice";
// import { useCreateOrderMutation } from "@/store/api/orderApiSlice";
// import { RootState } from "@/store/store";
// import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { Dropdown } from "react-native-element-dropdown";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useSelector } from "react-redux";

// const stateData = [
//   { label: "New York", value: "NY" },
//   { label: "California", value: "CA" },
//   { label: "Texas", value: "TX" },
//   { label: "Florida", value: "FL" },
//   { label: "New Jersey", value: "NJ" },
//   { label: "Washington", value: "WA" },
// ];

// export default function InformationScreen() {
//   const router = useRouter();
//   const user = useSelector((state: RootState) => state.auth.user);
//   const { data: cartData, isLoading: isCartLoading } = useGetCartQuery();
//   const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
//   const [removeFromCart] = useRemoveFromCartMutation();

//   const [fullName, setFullName] = useState(user?.name || "");
//   const [email, setEmail] = useState(user?.email || "");
//   const [phone, setPhone] = useState(user?.phone || "");
//   const [address, setAddress] = useState("");
//   const [zipCode, setZipCode] = useState("");
//   const [stateValue, setStateValue] = useState<string | null>(null);
//   const [isFocus, setIsFocus] = useState(false);

//   useEffect(() => {
//     if (user) {
//       if (user.name) setFullName(user.name);
//       if (user.email) setEmail(user.email);
//       if (user.phone) setPhone(user.phone);
//     }
//   }, [user]);

//   const handleContinue = async () => {
//     // Validation
//     if (!fullName.trim()) {
//       Alert.alert("Error", "Please enter your full name");
//       return;
//     }
//     if (!email.trim()) {
//       Alert.alert("Error", "Please enter your email");
//       return;
//     }
//     if (!phone.trim()) {
//       Alert.alert("Error", "Please enter your phone number");
//       return;
//     }
//     if (!address.trim()) {
//       Alert.alert("Error", "Please enter your address");
//       return;
//     }
//     if (!stateValue) {
//       Alert.alert("Error", "Please select a state");
//       return;
//     }
//     if (!zipCode.trim()) {
//       Alert.alert("Error", "Please enter your zip code");
//       return;
//     }

//     // Get cart items
//     const rawItems = cartData?.data?.items || cartData?.items || (Array.isArray(cartData) ? cartData : []);

//     if (rawItems.length === 0) {
//       Alert.alert("Error", "Your cart is empty");
//       return;
//     }

//     // Construct shipping address
//     const shippingAddress = `${address}, ${stateValue} ${zipCode}`;

//     try {
//       // Group items by vendor
//       const vendorGroups: { [key: string]: any[] } = {};
//       rawItems.forEach((item: any) => {
//         const vendorId = item.product?.vendorId || item.product?.vendor?.id || item.productId?.vendorId || item.productId?.vendor?._id || item.productId?.vendor;
//         if (!vendorId) {
//           console.warn('Item missing vendorId:', item);
//           return;
//         }
//         if (!vendorGroups[vendorId]) {
//           vendorGroups[vendorId] = [];
//         }
//         vendorGroups[vendorId].push(item);
//       });

//       const vendors = Object.keys(vendorGroups);
//       if (vendors.length === 0) {
//         Alert.alert("Error", "Unable to process order. Products missing vendor information.");
//         return;
//       }

//       // Create orders for each vendor
//       for (const vendorId of vendors) {
//         const vendorItems = vendorGroups[vendorId];
//         const orderData = {
//           vendorId,
//           shippingAddress,
//         };

//         console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
//         await createOrder(orderData).unwrap();

//         // Remove items from cart after successful order
//         // for (const item of vendorItems) {
//         //   await removeFromCart(item._id || item.id).unwrap();
//         // }
//       }

//       Alert.alert(
//         "Success",
//         `Order${vendors.length > 1 ? 's' : ''} placed successfully!`,
//         [{ text: "OK", onPress: () => router.replace("/(user_screen)/OrderAcceptedScreen") }]
//       );
//     } catch (err: any) {
//       console.error('Order creation error:', err);
//       Alert.alert("Error", err?.data?.message || "Failed to place order");
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()}>
//           <Ionicons name="chevron-back" size={28} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Information</Text>
//         <View style={{ width: 28 }} />
//       </View>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={{ flex: 1 }}
//       >
//         <ScrollView
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.scrollContent}
//           keyboardShouldPersistTaps="handled"
//         >
//           {/* Scan Button */}
//           <TouchableOpacity
//             style={styles.scanButton}
//             onPress={() => router.push("/(user_screen)/ScanQRCode")}
//           >
//             <MaterialCommunityIcons name="qrcode-scan" size={20} color="#666" />
//             <Text style={styles.scanButtonText}>Autofill by scanning</Text>
//           </TouchableOpacity>

//           {/* Full Name Field */}
//           <View style={styles.formGroup}>
//             <Text style={styles.label}>Full Name</Text>
//             <TextInput
//               style={styles.input}
//               value={fullName}
//               onChangeText={setFullName}
//               placeholder="Enter your full name"
//             />
//           </View>

//           {/* Email Field */}
//           <View style={styles.formGroup}>
//             <Text style={styles.label}>Email</Text>
//             <TextInput
//               style={styles.input}
//               value={email}
//               onChangeText={setEmail}
//               placeholder="example@email.com"
//               keyboardType="email-address"
//               autoCapitalize="none"
//             />
//           </View>

//           {/* Phone Field */}
//           <View style={styles.formGroup}>
//             <Text style={styles.label}>Phone</Text>
//             <TextInput
//               style={styles.input}
//               value={phone}
//               onChangeText={setPhone}
//               placeholder="+1 9999999999"
//               keyboardType="phone-pad"
//             />
//           </View>

//           <View style={styles.formGroup}>
//             <Text style={styles.label}>Address</Text>
//             <View style={styles.addressInputContainer}>
//               <Ionicons
//                 name="location-outline"
//                 size={20}
//                 color="#888"
//                 style={styles.locationIcon}
//               />
//               <TextInput
//                 style={[styles.input, styles.autoGrowInput]}
//                 value={address}
//                 onChangeText={setAddress}
//                 placeholder="123 Main Street, Jersey City, New Jersey 07302, USA"
//                 multiline={true}
//                 scrollEnabled={false}
//                 textAlignVertical="top"
//               />
//             </View>
//           </View>

//           <View style={styles.row}>
//             <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
//               <Text style={styles.label}>City</Text>
//               <TextInput style={styles.input} placeholder="City" />
//             </View>

//             <View style={[styles.formGroup, { flex: 1.2, marginRight: 8 }]}>
//               <Text style={styles.label}>State</Text>
//               <Dropdown
//                 style={[styles.dropdown, isFocus && { borderColor: "#2A8383" }]}
//                 placeholderStyle={styles.placeholderStyle}
//                 selectedTextStyle={styles.selectedTextStyle}
//                 data={stateData}
//                 maxHeight={300}
//                 labelField="label"
//                 valueField="value"
//                 placeholder={!isFocus ? "Select" : "..."}
//                 value={stateValue}
//                 onFocus={() => setIsFocus(true)}
//                 onBlur={() => setIsFocus(false)}
//                 onChange={(item) => {
//                   setStateValue(item.value);
//                   setIsFocus(false);
//                 }}
//                 renderRightIcon={() => (
//                   <Ionicons
//                     name={isFocus ? "chevron-up" : "chevron-down"}
//                     size={18}
//                     color={isFocus ? "#2A8383" : "#666"}
//                   />
//                 )}
//               />
//             </View>

//             <View style={[styles.formGroup, { flex: 0.8 }]}>
//               <Text style={styles.label}>Zip Code</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="00000"
//                 keyboardType="numeric"
//                 maxLength={5}
//                 value={zipCode}
//                 onChangeText={setZipCode}
//               />
//             </View>
//           </View>

//           {/* Continue Button */}
//           <TouchableOpacity
//             style={[styles.continueButton, (isCreatingOrder || isCartLoading) && { opacity: 0.7 }]}
//             onPress={handleContinue}
//             disabled={isCreatingOrder || isCartLoading}
//           >
//             {isCreatingOrder ? (
//               <ActivityIndicator color="#FFF" />
//             ) : (
//               <Text style={styles.continueButtonText}>Continue</Text>
//             )}
//           </TouchableOpacity>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F8FBF9" },
//   header: {
//     direction: 'ltr',
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   headerTitle: { fontSize: 20, fontWeight: "700", color: "#333" },
//   scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
//   scanButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#FFF",
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     borderRadius: 12,
//     paddingVertical: 12,
//     marginBottom: 25,
//     marginTop: 10,
//   },
//   scanButtonText: {
//     marginLeft: 10,
//     color: "#666",
//     fontSize: 15,
//     fontWeight: "500",
//   },
//   formGroup: { marginBottom: 20 },
//   label: { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 8 },
//   input: {
//     backgroundColor: "#FFF",
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     minHeight: 50,
//     fontSize: 14,
//     color: "#333",
//   },
//   autoGrowInput: {
//     paddingTop: 15,
//     paddingBottom: 15,
//     paddingLeft: 40,
//     minHeight: 60,
//   },
//   addressInputContainer: { position: "relative" },
//   locationIcon: { position: "absolute", left: 12, top: 15, zIndex: 1 },
//   row: { flexDirection: "row", justifyContent: "space-between" },
//   dropdown: {
//     height: 50,
//     backgroundColor: "white",
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//   },
//   placeholderStyle: { fontSize: 14, color: "#888" },
//   selectedTextStyle: { fontSize: 14, color: "#333" },
//   continueButton: {
//     backgroundColor: "#2A8383",
//     borderRadius: 10,
//     height: 55,
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 20,
//   },
//   continueButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
// });



import { useGetCartQuery } from "@/store/api/cartApiSlice";
import { useTranslation } from "@/hooks/use-translation";
import { useCreateOrderMutation } from "@/store/api/orderApiSlice";
import { RootState } from "@/store/store";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

export default function InformationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { promoCode: promoCodeParam } = useLocalSearchParams();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: cartData } = useGetCartQuery();
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  const appliedPromoCode = String(promoCodeParam || "").trim();

  // Form States
  const [fullName, setFullName] = useState((user as any)?.buyer?.fullName || user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState((user as any)?.buyer?.phone || user?.phone || "");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [stateValue, setStateValue] = useState<string>("");

  // Country Picker States
  const [countryCode, setCountryCode] = useState<CountryCode>('US');
  const [countryName, setCountryName] = useState<string>('United States');
  const [isCountryPickerVisible, setIsCountryPickerVisible] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      const b = (user as any)?.buyer;
      if (b?.fullName || user.name) setFullName(b?.fullName || user.name);
      if (user.email) setEmail(user.email);
      if (b?.phone || user.phone) setPhone(b?.phone || user.phone);
      if (b?.phone || user.phone) setPhone(b?.phone || user.phone);
    }
  }, [user]);

  const onSelectCountry = (country: Country) => {
    setCountryCode(country.cca2);
    setCountryName(country.name as string);
    setIsCountryPickerVisible(false);
  };

  const handleContinue = async () => {
    if (!fullName.trim() || !email.trim() || !address1.trim() || !address2.trim() || !city.trim() || !stateValue || !zipCode.trim()) {
      Alert.alert(t("error", "Error"), t("info_fill_required_fields", "Please fill all required fields (including Address 2)"));
      return;
    }

    const rawItems = cartData?.items || cartData?.data?.items || (Array.isArray(cartData) ? cartData : []);

    if (rawItems.length === 0) {
      Alert.alert(t("error", "Error"), t("info_cart_empty", "Your cart is empty"));
      return;
    }

    // Construct shipping address
    const shippingAddress = `${address1}${address2 ? ', ' + address2 : ''}, ${city}, ${stateValue} ${zipCode}, ${countryName}`;

    try {
      // Group items by vendor
      const vendorGroups: { [key: string]: any[] } = {};
      rawItems.forEach((item: any) => {
        const product = item.product || item.productId;
        const vendorId = product?.vendorId || product?.vendor?._id || product?.vendor?.id || product?.vendor;

        if (!vendorId) {
          console.warn('Item missing vendorId:', item);
          return;
        }
        if (!vendorGroups[vendorId]) {
          vendorGroups[vendorId] = [];
        }
        vendorGroups[vendorId].push(item);
      });

      const vendors = Object.keys(vendorGroups);
      if (vendors.length === 0) {
        Alert.alert(t("error", "Error"), t("info_vendor_missing", "Unable to process order. Products missing vendor information."));
        return;
      }

      // Create orders for each vendor
      let firstOrderId = null;
      for (const vendorId of vendors) {
        const orderData = {
          vendorId,
          shippingAddress,
          optionalAddress: address2.trim(),
          country: countryName,
          ...(appliedPromoCode ? { couponCode: appliedPromoCode } : {}),
        };

        console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
        const response = await createOrder(orderData).unwrap();
        if (!firstOrderId) {
          // Assuming response contains the created order object or ID
          firstOrderId = response?.id || response?._id || response?.data?.id || response?.data?._id;
        }
      }

      if (firstOrderId) {
        router.replace({
          pathname: "/(user_screen)/stripePaymentScreen",
          params: { orderId: firstOrderId }
        });
      } else {
        // Fallback if no ID found (should typically not happen if successful)
        Alert.alert(
          t("success", "Success"),
          `${t("info_order_word", "Order")}${vendors.length > 1 ? 's' : ''} ${t("info_placed_successfully", "placed successfully!")}`,
          [{ text: t("ok", "OK"), onPress: () => router.replace("/(user_screen)/OrderAcceptedScreen") }]
        );
      }

    } catch (err: any) {
      console.error('Order creation error:', err);
      Alert.alert(t("error", "Error"), err?.data?.message || t("info_failed_place_order", "Failed to place order"));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("info_title", "Information")}</Text>
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
          {/* Autofill Banner */}
          <View style={styles.autofillBanner}>
            <Text style={styles.autofillText}>{t("info_autofill_hint", "Save time, Autofill your current location")}</Text>
            <TouchableOpacity style={styles.autofillButton}>
              <Text style={styles.autofillButtonText}>{t("info_autofill", "Autofill")}</Text>
            </TouchableOpacity>
          </View>

          {/* Country/Region Selector with Search */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t("info_country_region", "Country/Region")}</Text>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setIsCountryPickerVisible(true)}
            >
              <Text style={styles.inputText}>{countryName}</Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            <CountryPicker
              {...{
                countryCode,
                withFilter: true, // এটিই সার্চ বার দেখাবে
                withFlag: true,
                withCountryNameButton: false,
                withAlphaFilter: true,
                onSelect: onSelectCountry,
                modalProps: { visible: isCountryPickerVisible }
              }}
              visible={isCountryPickerVisible}
              onClose={() => setIsCountryPickerVisible(false)}
            />
          </View>

          {/* Full Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t("info_full_name", "Full Name")}</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("info_full_name_placeholder", "Rokey Mahmud")}
              placeholderTextColor="#999"
            />
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t("info_email", "Email")}</Text>
            <TextInput
              style={[styles.input, { opacity: 0.6 }]}
              value={email}
              editable={false}
              placeholder={t("info_email_placeholder", "example@email.com")}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t("info_phone", "Phone")}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={t("info_phone_placeholder", "+1 9999999999")}
              keyboardType="phone-pad"
            />
          </View>

          {/* Address 1 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t("info_address_1", "Address 1")}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address1}
              onChangeText={setAddress1}
              placeholder={t("info_address_placeholder", "123 Main Street, Jersey City, New Jersey 07302, USA")}
              multiline
            />
          </View>

          {/* Address 2 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t("info_address_2_optional", "Address 2 (optional)")}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address2}
              onChangeText={setAddress2}
              placeholder={t("info_address_placeholder", "123 Main Street, Jersey City, New Jersey 07302, USA")}
              multiline
            />
          </View>

          {/* City, State, Zip Code Row */}
          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>{t("info_city", "City")}</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder=""
              />
            </View>

            <View style={[styles.formGroup, { flex: 1.2, marginRight: 8 }]}>
              <Text style={styles.label}>{t("info_state", "State")}</Text>
              <TextInput
                style={styles.input}
                value={stateValue}
                onChangeText={setStateValue}
                placeholder={t("info_state", "State")}
              />
            </View>
            <View style={[styles.formGroup, { flex: 0.8 }]}>
              <Text style={styles.label}>{t("info_zip_code", "Zip Code")}</Text>
              <TextInput
                style={styles.input}
                value={zipCode}
                onChangeText={setZipCode}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>


          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={isCreatingOrder}
          >
            {isCreatingOrder ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.continueButtonText}>{t("info_continue", "Continue")}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    direction: 'ltr',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#333" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  autofillBanner: {
    flexDirection: "row",
    backgroundColor: "#F0F9F9",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  autofillText: { flex: 1, fontSize: 14, color: "#444", fontWeight: "500", marginRight: 10 },
  autofillButton: { backgroundColor: "#D1EAEA", paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  autofillButtonText: { color: "#333", fontWeight: "600", fontSize: 13 },

  formGroup: { marginBottom: 15 },
  label: { fontSize: 15, fontWeight: "500", color: "#444", marginBottom: 8 },
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
    textAlignVertical: 'top'
  },
  countrySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "#F5F7F6",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  inputText: { fontSize: 14, color: "#333" },
  row: { flexDirection: "row" },
  continueButton: {
    backgroundColor: "#2A8383",
    borderRadius: 15,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  continueButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
