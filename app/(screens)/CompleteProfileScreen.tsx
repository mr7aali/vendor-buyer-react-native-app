// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import React, { useState } from "react";
// import {
//   Alert,
//   Dimensions,
//   KeyboardAvoidingView,
//   Modal,
//   Platform,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useDispatch } from "react-redux";
// import { updateVendorRegistration } from "../../store/slices/registrationSlice";

// const { width } = Dimensions.get("window");

// interface ProfileFormData {
//   fullName: string;
//   phone: string;
//   email: string;
//   address: string;
//   storename: string;
//   storeDescription: string;
//   gender: string;
// }

// const CompleteProfileScreen: React.FC = () => {
//   const router = useRouter();
//   const dispatch = useDispatch();
//   const [isModalVisible, setIsModalVisible] = useState(false);

//   const [formData, setFormData] = useState<ProfileFormData>({
//     fullName: "",
//     phone: "",
//     email: "",
//     address: "",
//     storename: "",
//     storeDescription: "",
//     gender: "",
//   });

//   const genderOptions = [
//     { label: "Male", value: "Male" },
//     { label: "Female", value: "Female" },
//     { label: "Other", value: "Other" },
//   ];

//   const selectGender = (value: string) => {
//     setFormData(prev => ({ ...prev, gender: value }));
//     setIsModalVisible(false);
//   };

//   const handleInputChange = (key: keyof ProfileFormData, value: string) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleSubmit = () => {
//     if (!formData.gender) {
//       Alert.alert("Required", "Please select your gender.");
//       return;
//     }
//     dispatch(updateVendorRegistration(formData));
//     router.push("/(screens)/LogoUploadScreen");
//   };

//   const renderField = (
//     label: string,
//     placeholder: string,
//     key: keyof ProfileFormData,
//     multiline: boolean = false,
//     keyboardType: "default" | "email-address" | "phone-pad" = "default"
//   ) => (
//     <View style={styles.fieldContainer}>
//       <Text style={styles.label}>{label}</Text>
//       <TextInput
//         style={[styles.input, multiline && styles.textArea]}
//         placeholder={placeholder}
//         placeholderTextColor="#999"
//         value={formData[key]}
//         onChangeText={(text) => handleInputChange(key, text)}
//         multiline={multiline}
//         keyboardType={keyboardType}
//         textAlignVertical={multiline ? "top" : "center"}
//       />
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="dark-content" />
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={{ flex: 1 }}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollContainer}
//           showsVerticalScrollIndicator={false}
//         >
//           <View style={styles.header}>
//             <Text style={styles.title}>Complete your profile</Text>
//             <Text style={styles.subTitle}>
//               Fill in the details below to complete your business profile on
//               LlinkTo.
//             </Text>
//           </View>

//           <View style={styles.form}>
//             {renderField("Enter Your Full Name", "e.g. John Doe", "fullName")}
//             {renderField(
//               "Enter Your Phone Number",
//               "Enter phone number",
//               "phone",
//               false,
//               "phone-pad"
//             )}
//             {renderField(
//               "Enter Email Address",
//               "Enter email address",
//               "email",
//               false,
//               "email-address"
//             )}
//             {renderField(
//               "Enter Your Address",
//               "Enter your full address",
//               "address"
//             )}
//             {renderField(
//               "Enter Your Store Name",
//               "Enter Your Store Name",
//               "storename"
//             )}
//             {renderField(
//               "About Your Store",
//               "Briefly describe your products or services",
//               "storeDescription",
//               true
//             )}

//             {/* Gender Field */}
//             <View style={styles.fieldContainer}>
//               <Text style={styles.label}>Enter Your Gender</Text>
//               <TouchableOpacity
//                 style={styles.dropdown}
//                 onPress={() => setIsModalVisible(true)}
//                 activeOpacity={0.8}
//               >
//                 <Text style={[styles.dropdownText, formData.gender && { color: "#111" }]}>
//                   {formData.gender || "Select Gender"}
//                 </Text>
//                 <Ionicons name="chevron-down" size={20} color="#666" />
//               </TouchableOpacity>
//             </View>

//             <TouchableOpacity
//               style={styles.submitButton}
//               onPress={handleSubmit}
//               activeOpacity={0.8}
//             >
//               <Text style={styles.submitButtonText}>Submit</Text>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>

//       <Modal
//         visible={isModalVisible}
//         transparent={true}
//         animationType="slide"
//         onRequestClose={() => setIsModalVisible(false)}
//       >
//         <TouchableOpacity
//           style={styles.modalOverlay}
//           activeOpacity={1}
//           onPress={() => setIsModalVisible(false)}
//         >
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Select Gender</Text>
//               <TouchableOpacity onPress={() => setIsModalVisible(false)}>
//                 <Ionicons name="close" size={24} color="#181725" />
//               </TouchableOpacity>
//             </View>

//             {genderOptions.map((item) => (
//               <TouchableOpacity
//                 key={item.value}
//                 style={styles.optionItem}
//                 onPress={() => selectGender(item.value)}
//               >
//                 <Text
//                   style={[
//                     styles.optionText,
//                     formData.gender === item.value && styles.selectedOptionText,
//                   ]}
//                 >
//                   {item.label}
//                 </Text>
//                 {formData.gender === item.value && (
//                   <Ionicons name="checkmark-circle" size={20} color="#3B8C8C" />
//                 )}
//               </TouchableOpacity>
//             ))}
//           </View>
//         </TouchableOpacity>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#FFFFFF",
//   },
//   scrollContainer: {
//     paddingHorizontal: 24,
//     paddingBottom: 40,
//   },
//   header: {
//     direction: 'ltr',
//     marginTop: 40,
//     marginBottom: 30,
//     alignItems: "center",
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: "bold",
//     color: "#000",
//     marginBottom: 10,
//   },
//   subTitle: {
//     fontSize: 14,
//     color: "#666",
//     textAlign: "center",
//     lineHeight: 20,
//   },
//   form: {
//     width: "100%",
//   },
//   fieldContainer: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 15,
//     fontWeight: "600",
//     color: "#333",
//     marginBottom: 8,
//   },
//   input: {
//     backgroundColor: "#F9FAFB",
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: Platform.OS === "ios" ? 14 : 10,
//     fontSize: 15,
//     color: "#111",
//   },
//   textArea: {
//     height: 100,
//     paddingTop: 12,
//   },
//   submitButton: {
//     backgroundColor: "#20A1A1",
//     borderRadius: 12,
//     paddingVertical: 16,
//     alignItems: "center",
//     marginTop: 10,
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   submitButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   dropdown: {
//     backgroundColor: "#F9FAFB",
//     height: 55,
//     borderRadius: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   modalContent: {
//     backgroundColor: "#FFFFFF",
//     borderTopLeftRadius: 25,
//     borderTopRightRadius: 25,
//     padding: 25,
//     paddingBottom: 40,
//   },
//   modalHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#000",
//   },
//   optionItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F3F4F6",
//   },
//   optionText: {
//     fontSize: 16,
//     color: "#333",
//   },
//   selectedOptionText: {
//     color: "#3B8C8C",
//     fontWeight: "bold",
//   },
// });

// export default CompleteProfileScreen;


import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/use-translation";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { updateVendorRegistration } from "../../store/slices/registrationSlice";
import { RootState } from "../../store/store";

interface ProfileFormData {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  storename: string;
  storeDescription: string;
  country: string;
  countryCode: CountryCode;
  gender: string;
}

const CompleteProfileScreen: React.FC = () => {
  const { language } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const vendorRegistration = useSelector((state: RootState) => state.registration.vendor);

  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: "",
    phone: "",
    email: user?.email || vendorRegistration?.email || "",
    address: "",
    storename: "",
    storeDescription: "",
    country: "United States",
    countryCode: "US",
    gender: "",
  });

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isGenderModalVisible, setIsGenderModalVisible] = useState(false);

  useEffect(() => {
    const currentEmail = user?.email || vendorRegistration?.email || "";
    setFormData((prev) => (
      prev.email === currentEmail ? prev : { ...prev, email: currentEmail }
    ));
  }, [user?.email, vendorRegistration?.email]);

  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        completeProfile: "השלם את הפרופיל שלך",
        subtitle: "מלא את הפרטים למטה כדי להשלים את פרופיל העסק שלך.",
        enterFullName: "הזן את שמך המלא",
        enterPhone: "הזן מספר טלפון",
        enterEmail: "הזן כתובת אימייל",
        countryRegion: "מדינה/אזור",
        enterAddress: "הזן כתובת",
        enterStoreName: "הזן שם חנות",
        aboutStore: "על החנות שלך",
        describeStore: "תיאור קצר של המוצרים או השירותים שלך",
        enterGender: "הזן מגדר",
        selectGender: "בחר מגדר",
        selectGenderTitle: "בחירת מגדר",
        submit: "שלח",
        required: "נדרש",
        pleaseSelectGender: "נא לבחור מגדר.",
        male: "זכר",
        female: "נקבה",
        other: "אחר",
      };
    }
    if (language === "hi") {
      return {
        completeProfile: "अपना प्रोफाइल पूरा करें",
        subtitle: "अपना व्यवसाय प्रोफाइल पूरा करने के लिए नीचे विवरण भरें।",
        enterFullName: "अपना पूरा नाम दर्ज करें",
        enterPhone: "अपना फोन नंबर दर्ज करें",
        enterEmail: "ईमेल पता दर्ज करें",
        countryRegion: "देश/क्षेत्र",
        enterAddress: "अपना पता दर्ज करें",
        enterStoreName: "अपनी दुकान का नाम दर्ज करें",
        aboutStore: "अपने स्टोर के बारे में",
        describeStore: "अपने उत्पादों या सेवाओं का संक्षिप्त विवरण दें",
        enterGender: "अपना जेंडर चुनें",
        selectGender: "जेंडर चुनें",
        selectGenderTitle: "जेंडर चुनें",
        submit: "सबमिट करें",
        required: "आवश्यक",
        pleaseSelectGender: "कृपया अपना जेंडर चुनें।",
        male: "पुरुष",
        female: "महिला",
        other: "अन्य",
      };
    }
    return {
      completeProfile: "Complete your profile",
      subtitle: "Fill in the details below to complete your business profile.",
      enterFullName: "Enter Your Full Name",
      enterPhone: "Enter Your Phone Number",
      enterEmail: "Enter Email Address",
      countryRegion: "Country/Region",
      enterAddress: "Enter Your Address",
      enterStoreName: "Enter Your Store Name",
      aboutStore: "About Your Store",
      describeStore: "Briefly describe your products or services",
      enterGender: "Enter Your Gender",
      selectGender: "Select Gender",
      selectGenderTitle: "Select Gender",
      submit: "Submit",
      required: "Required",
      pleaseSelectGender: "Please select your gender.",
      male: "Male",
      female: "Female",
      other: "Other",
    };
  }, [language]);
  const genderOptions = [
    { label: ui.male, value: "Male" },
    { label: ui.female, value: "Female" },
    { label: ui.other, value: "Other" },
  ];

  const onSelectCountry = (country: Country) => {
    setFormData(prev => ({
      ...prev,
      country: country.name as string,
      countryCode: country.cca2
    }));
  };

  const selectGender = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }));
    setIsGenderModalVisible(false);
  };

  const handleInputChange = (key: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!formData.gender) {
      Alert.alert(ui.required, ui.pleaseSelectGender);
      return;
    }
    dispatch(updateVendorRegistration(formData));
    router.push("/(screens)/LogoUploadScreen");
  };

  const renderField = (
    label: string,
    placeholder: string,
    key: keyof ProfileFormData,
    multiline: boolean = false,
    keyboardType: "default" | "email-address" | "phone-pad" = "default",
    editable: boolean = true
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea, !editable && { opacity: 0.6 }]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={formData[key] as string}
        onChangeText={(text) => handleInputChange(key, text)}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? "top" : "center"}
        editable={editable}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{ui.completeProfile}</Text>
            <Text style={styles.subTitle}>
              {ui.subtitle}
            </Text>
          </View>

          <View style={styles.form}>
            {renderField(ui.enterFullName, ui.enterFullName, "fullName")}
            {renderField(ui.enterPhone, ui.enterPhone, "phone", false, "phone-pad")}
            {renderField(ui.enterEmail, ui.enterEmail, "email", false, "email-address", false)}

            {/* Country/Region Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>{ui.countryRegion}</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowCountryPicker(true)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CountryPicker
                    countryCode={formData.countryCode}
                    withFilter
                    withFlag
                    withCountryNameButton
                    withAlphaFilter
                    onSelect={onSelectCountry}
                    visible={showCountryPicker}
                    onClose={() => setShowCountryPicker(false)}
                    containerButtonStyle={{ marginRight: 5 }}
                  />
                </View>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {renderField(ui.enterAddress, ui.enterAddress, "address")}
            {renderField(ui.enterStoreName, ui.enterStoreName, "storename")}
            {renderField(ui.aboutStore, ui.describeStore, "storeDescription", true)}

            {/* Gender Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>{ui.enterGender}</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setIsGenderModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dropdownText, formData.gender && { color: "#111" }]}>
                  {formData.gender || ui.selectGender}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>{ui.submit}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={isGenderModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsGenderModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsGenderModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{ui.selectGenderTitle}</Text>
              <TouchableOpacity onPress={() => setIsGenderModalVisible(false)}>
                <Ionicons name="close" size={24} color="#181725" />
              </TouchableOpacity>
            </View>

            {genderOptions.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.optionItem}
                onPress={() => selectGender(item.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.gender === item.value && styles.selectedOptionText,
                  ]}
                >
                  {item.label}
                </Text>
                {formData.gender === item.value && (
                  <Ionicons name="checkmark-circle" size={20} color="#3B8C8C" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAF9", // Light mint background from image
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    direction: 'ltr',
    marginTop: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  form: {
    width: "100%",
  },
  fieldContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: "#111",
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: "#2D8C8C", // The teal color from your image
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    height: 52,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dropdownText: {
    color: "#666",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedOptionText: {
    color: "#3B8C8C",
    fontWeight: "bold",
  },
});

export default CompleteProfileScreen;
