// import { Ionicons } from "@expo/vector-icons";
// import { router } from "expo-router";
// import React, { useState } from "react";
// import {
//   KeyboardAvoidingView,
//   Modal,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// import { useDispatch } from "react-redux";
// import { updateBuyerRegistration } from "../../store/slices/registrationSlice";

// const CompleteProfileScreen = () => {
//   const dispatch = useDispatch();
//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhoneNumber] = useState("");
//   const [country, setCountry] = useState("");
//   const [gender, setGender] = useState("");
//   const [isModalVisible, setIsModalVisible] = useState(false);

//   const genderOptions = [
//     { label: "Male", value: "Male" },
//     { label: "Female", value: "Female" },
//     { label: "Other", value: "Other" },
//   ];

//   const selectGender = (value: string) => {
//     setGender(value);
//     setIsModalVisible(false);
//   };

//   const handleNext = () => {
//     dispatch(
//       updateBuyerRegistration({
//         fullName,
//         email,
//         phone,
//         gender,
//       })
//     );
//     router.push("/(user_screen)/IDUploadScreen");
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={{ flex: 1 }}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Header Section */}
//           <View style={styles.header}>
//             <Text style={styles.title}>Complete your profile</Text>
//             <Text style={styles.subtitle}>
//               Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed.
//             </Text>
//           </View>

//           {/* Form Section */}
//           <View style={styles.form}>
//             {/* Full Name */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Enter Your Full Name</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter your full name"
//                 placeholderTextColor="#C7C7CD"
//                 value={fullName}
//                 onChangeText={setFullName}
//               />
//             </View>

//             {/* Email Address */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Enter Email Address</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter email address"
//                 placeholderTextColor="#C7C7CD"
//                 keyboardType="email-address"
//                 value={email}
//                 onChangeText={setEmail}
//               />
//             </View>

//             {/* Phone Number */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Enter Your Phone Number</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter phone number"
//                 placeholderTextColor="#C7C7CD"
//                 keyboardType="phone-pad"
//                 value={phone}
//                 onChangeText={setPhoneNumber}
//               />
//             </View>

//             {/* Gender Dropdown */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Enter Your Gender</Text>
//               <TouchableOpacity
//                 style={styles.dropdown}
//                 onPress={() => setIsModalVisible(true)}
//                 activeOpacity={0.8}
//               >
//                 <View style={styles.dropdownLeft}>
//                   <Ionicons
//                     name="male-female-outline"
//                     size={20}
//                     color={gender ? "#181725" : "#C7C7CD"}
//                   />
//                   <Text
//                     style={[
//                       styles.dropdownText,
//                       gender && { color: "#181725" },
//                     ]}
//                   >
//                     {gender || "Select Gender"}
//                   </Text>
//                 </View>
//                 <Ionicons name="chevron-down" size={20} color="#181725" />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Next Button */}
//           <TouchableOpacity
//             style={styles.nextButton}
//             onPress={handleNext}
//           >
//             <Text style={styles.nextButtonText}>Next</Text>
//           </TouchableOpacity>
//         </ScrollView>
//       </KeyboardAvoidingView>

//       {/* Gender Selection Modal */}
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
//                     gender === item.value && styles.selectedOptionText,
//                   ]}
//                 >
//                   {item.label}
//                 </Text>
//                 {gender === item.value && (
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
//   container: {
//     flex: 1,
//     backgroundColor: "#F7FAF9",
//   },
//   scrollContent: {
//     paddingHorizontal: 25,
//     paddingTop: 40,
//     paddingBottom: 20,
//     flexGrow: 1,
//   },
//   header: {
//     direction: 'ltr',
//     alignItems: "center",
//     marginBottom: 40,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: "700",
//     color: "#181725",
//     marginBottom: 10,
//     textAlign: "center",
//   },
//   subtitle: {
//     fontSize: 14,
//     color: "#7C7C7C",
//     textAlign: "center",
//     lineHeight: 20,
//     paddingHorizontal: 20,
//   },
//   form: {
//     marginBottom: 30,
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 15,
//     fontWeight: "600",
//     color: "#181725",
//     marginBottom: 10,
//   },
//   input: {
//     backgroundColor: "#FFFFFF",
//     height: 55,
//     borderRadius: 12,
//     paddingHorizontal: 15,
//     fontSize: 14,
//     color: "#181725",
//     borderWidth: 1,
//     borderColor: "#F0F0F0",
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//   },
//   dropdown: {
//     backgroundColor: "#FFFFFF",
//     height: 55,
//     borderRadius: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 15,
//     borderWidth: 1,
//     borderColor: "#F0F0F0",
//     elevation: 2,
//   },
//   dropdownLeft: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   dropdownText: {
//     marginLeft: 10,
//     color: "#C7C7CD",
//     fontSize: 14,
//   },
//   nextButton: {
//     backgroundColor: "#3B8C8C",
//     height: 55,
//     borderRadius: 15,
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: "auto",
//     marginBottom: 10,
//   },
//   nextButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "flex-end",
//   },
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
//     fontWeight: "700",
//     color: "#181725",
//   },
//   optionItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F0F0F0",
//   },
//   optionText: {
//     fontSize: 16,
//     color: "#181725",
//   },
//   selectedOptionText: {
//     color: "#3B8C8C",
//     fontWeight: "600",
//   },
// });

// export default CompleteProfileScreen;



import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/use-translation";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 1. Import the Country Picker
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';

import { useDispatch, useSelector } from "react-redux";
import { updateBuyerRegistration } from "../../store/slices/registrationSlice";
import { RootState } from "../../store/store";

const CompleteProfileScreen = () => {
  const { language } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [fullName, setFullName] = useState("");
  const email = user?.email || "";
  const [phone, setPhoneNumber] = useState("");

  // Updated Country States
  const [country, setCountry] = useState("United States");
  const [countryCode, setCountryCode] = useState<CountryCode>('US');
  const [isCountryPickerVisible, setIsCountryPickerVisible] = useState(false);

  const [gender, setGender] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        completeProfile: "השלם את הפרופיל שלך",
        subtitle: "מלא את הפרטים למטה כדי להשלים את הפרופיל שלך.",
        enterFullName: "הזן את שמך המלא",
        enterEmail: "הזן כתובת אימייל",
        enterPhone: "הזן מספר טלפון",
        countryRegion: "מדינה/אזור",
        enterGender: "הזן מגדר",
        selectGender: "בחר מגדר",
        selectGenderTitle: "בחירת מגדר",
        next: "הבא",
        male: "זכר",
        female: "נקבה",
        other: "אחר",
      };
    }
    if (language === "hi") {
      return {
        completeProfile: "अपना प्रोफाइल पूरा करें",
        subtitle: "अपना प्रोफाइल पूरा करने के लिए नीचे विवरण भरें।",
        enterFullName: "अपना पूरा नाम दर्ज करें",
        enterEmail: "ईमेल पता दर्ज करें",
        enterPhone: "अपना फोन नंबर दर्ज करें",
        countryRegion: "देश/क्षेत्र",
        enterGender: "अपना जेंडर चुनें",
        selectGender: "जेंडर चुनें",
        selectGenderTitle: "जेंडर चुनें",
        next: "आगे",
        male: "पुरुष",
        female: "महिला",
        other: "अन्य",
      };
    }
    return {
      completeProfile: "Complete your profile",
      subtitle: "Fill in the details below to complete your profile.",
      enterFullName: "Enter Your Full Name",
      enterEmail: "Enter Email Address",
      enterPhone: "Enter Your Phone Number",
      countryRegion: "Country/Region",
      enterGender: "Enter Your Gender",
      selectGender: "Select Gender",
      selectGenderTitle: "Select Gender",
      next: "Next",
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

  const selectGender = (value: string) => {
    setGender(value);
    setIsModalVisible(false);
  };

  // Handle Country Selection
  const onSelectCountry = (country: Country) => {
    setCountryCode(country.cca2);
    setCountry(country.name as string);
  };

  const handleNext = () => {
    dispatch(
      updateBuyerRegistration({
        fullName,
        email,
        phone,
        gender,
        country, // Added country to dispatch
      })
    );
    router.push("/(user_screen)/IDUploadScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.title}>{ui.completeProfile}</Text>
            <Text style={styles.subtitle}>
              {ui.subtitle}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{ui.enterFullName}</Text>
              <TextInput
                style={styles.input}
                placeholder={ui.enterFullName}
                placeholderTextColor="#C7C7CD"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{ui.enterEmail}</Text>
              <TextInput
                style={[styles.input, { opacity: 0.6 }]}
                placeholder={ui.enterEmail}
                placeholderTextColor="#C7C7CD"
                keyboardType="email-address"
                value={email}
                editable={false}
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{ui.enterPhone}</Text>
              <TextInput
                style={styles.input}
                placeholder={ui.enterPhone}
                placeholderTextColor="#C7C7CD"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhoneNumber}
              />
            </View>

            {/* Country/Region Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{ui.countryRegion}</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setIsCountryPickerVisible(true)}
              >
                <View style={styles.dropdownLeft}>
                  <CountryPicker
                    countryCode={countryCode}
                    withFilter
                    withFlag
                    withCountryNameButton={false}
                    withAlphaFilter
                    onSelect={onSelectCountry}
                    visible={isCountryPickerVisible}
                    onClose={() => setIsCountryPickerVisible(false)}
                  />
                  <Text style={[styles.dropdownText, { color: "#181725", marginLeft: 5 }]}>
                    {country}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#181725" />
              </TouchableOpacity>
            </View>

            {/* Gender Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{ui.enterGender}</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setIsModalVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.dropdownLeft}>
                  <Ionicons
                    name="male-female-outline"
                    size={20}
                    color={gender ? "#181725" : "#C7C7CD"}
                  />
                  <Text
                    style={[
                      styles.dropdownText,
                      gender && { color: "#181725" },
                    ]}
                  >
                    {gender || ui.selectGender}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#181725" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>{ui.next}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Gender Selection Modal (Your existing modal remains the same) */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{ui.selectGenderTitle}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
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
                    gender === item.value && styles.selectedOptionText,
                  ]}
                >
                  {item.label}
                </Text>
                {gender === item.value && (
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

// Styles remain identical to your original code
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAF9",
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 40,
    paddingBottom: 20,
    flexGrow: 1,
  },
  header: {
    direction: 'ltr',
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#181725",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#7C7C7C",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#181725",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    height: 55,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#181725",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    height: 55,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    elevation: 2,
  },
  dropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownText: {
    marginLeft: 10,
    color: "#C7C7CD",
    fontSize: 14,
  },
  nextButton: {
    backgroundColor: "#3B8C8C",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 10,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
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
    fontWeight: "700",
    color: "#181725",
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  optionText: {
    fontSize: 16,
    color: "#181725",
  },
  selectedOptionText: {
    color: "#3B8C8C",
    fontWeight: "600",
  },
});

export default CompleteProfileScreen;
