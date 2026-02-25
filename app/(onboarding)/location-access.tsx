// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { StatusBar } from "expo-status-bar";
// import React from "react";
// import {
//   Dimensions,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// const { width } = Dimensions.get("window");

// export default function LocationAccess() {
//   const router = useRouter();

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar style="dark" />

//       <View style={styles.content}>
//         {/* Circle Icon Section */}
//         <View style={styles.iconCircle}>
//           <Ionicons name="location-sharp" size={width * 0.1} color="white" />
//         </View>

//         {/* Text Section */}
//         <Text style={styles.title}>Allow Location Access</Text>
//         <Text style={styles.subtitle}>
//           To help you find the best service providers near you, please share
//           your location.
//         </Text>

//         {/* Action Button */}
//         <TouchableOpacity
//           style={styles.button}
//           activeOpacity={0.8}
//           onPress={() => router.push("/(auth)/login")}
//         >
//           <Text style={styles.buttonText}>Allow location access</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F8FBFB",
//   },
//   content: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 30,
//   },
//   iconCircle: {
//     width: width * 0.2,
//     height: width * 0.2,
//     borderRadius: (width * 0.2) / 2,
//     backgroundColor: "#278687",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 30,

//     shadowColor: "#2A8383",
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.2,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#333",
//     marginBottom: 15,
//     textAlign: "center",
//   },
//   subtitle: {
//     fontSize: 16,
//     color: "#666",
//     textAlign: "center",
//     lineHeight: 24,
//     marginBottom: 40,
//     paddingHorizontal: 10,
//   },
//   button: {
//     backgroundColor: "#278687",
//     width: "100%",
//     paddingVertical: 18,
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   buttonText: {
//     color: "#FFFFFF",
//     fontSize: 18,
//     fontWeight: "600",
//   },
// });



import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "@/hooks/use-translation";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function LocationAccess() {
  const { language, t } = useTranslation();
  const router = useRouter();
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        allowLocationTitle: "אפשר גישה למיקום",
        allowLocationSubtitle: "כדי למצוא ספקים קרובים, אנא שתף את המיקום שלך.",
        allowLocationButton: "אפשר גישה למיקום",
        locationRequired: "נדרשת הרשאה למיקום כדי להמשיך",
        failedGetLocation: "לא ניתן לקבל מיקום",
      };
    }
    if (language === "hi") {
      return {
        allowLocationTitle: "लोकेशन एक्सेस दें",
        allowLocationSubtitle: "आपके पास के सर्विस प्रोवाइडर खोजने के लिए, कृपया अपनी लोकेशन शेयर करें।",
        allowLocationButton: "लोकेशन एक्सेस दें",
        locationRequired: "आगे बढ़ने के लिए लोकेशन अनुमति आवश्यक है",
        failedGetLocation: "लोकेशन प्राप्त नहीं हो सकी",
      };
    }
    return {
      allowLocationTitle: "Allow Location Access",
      allowLocationSubtitle: "To help you find the best service providers near you, please share your location.",
      allowLocationButton: "Allow location access",
      locationRequired: "Location permission is required to continue",
      failedGetLocation: "Failed to get location",
    };
  }, [language]);

  const handleAllowLocation = async () => {
    try {
      // 1️⃣ Ask permission
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          t("permission_required", "Permission required"),
          ui.locationRequired
        );
        return;
      }

      // 2️⃣ Get coordinates
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // 3️⃣ Reverse geocode → address
      const addressRes = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      let fullAddress = "";
      if (addressRes.length > 0) {
        const a = addressRes[0];
        fullAddress = `${a.name ?? ""} ${a.street ?? ""}, ${a.city ?? ""}, ${a.region ?? ""}, ${a.country ?? ""}`.trim();
      }

      // 4️⃣ Save for later signup use
      await AsyncStorage.setItem(
        "userLocation",
        JSON.stringify({
          latitude,
          longitude,
          address: fullAddress,
        })
      );
      await AsyncStorage.setItem("onboardingCompleted", "true");

      // 5️⃣ Go next
      router.replace("/(auth)/login");
    } catch (error) {
      console.log("Location error:", error);
      Alert.alert(t("error", "Error"), ui.failedGetLocation);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Ionicons
            name="location-sharp"
            size={width * 0.1}
            color="white"
          />
        </View>

        {/* Text */}
        <Text style={styles.title}>{ui.allowLocationTitle}</Text>
        <Text style={styles.subtitle}>
          {ui.allowLocationSubtitle}
        </Text>

        {/* Button */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={handleAllowLocation}
        >
          <Text style={styles.buttonText}>
            {ui.allowLocationButton}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFB",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  iconCircle: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: (width * 0.2) / 2,
    backgroundColor: "#278687",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#2A8383",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: "#278687",
    width: "100%",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
