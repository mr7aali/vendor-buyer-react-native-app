import { images } from "@/constants/import_images";
import { useTranslation } from "@/hooks/use-translation";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Dimensions,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height } = Dimensions.get("window");

export default function GetStarted() {
  const { language } = useTranslation();
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        welcome: "ברוכים הבאים ל-Inkooto",
        subtitle: "מחברים אותך לשירותים הטובים ביותר בכל זמן ובכל מקום.",
        getStarted: "התחל",
        alreadyHave: "כבר יש לך חשבון?",
        login: "התחברות",
      };
    }
    if (language === "hi") {
      return {
        welcome: "Inkooto में आपका स्वागत है",
        subtitle: "आपको बेहतरीन सेवाओं से जोड़ते हैं, कभी भी और कहीं भी।",
        getStarted: "शुरू करें",
        alreadyHave: "क्या आपका अकाउंट पहले से है?",
        login: "लॉगिन",
      };
    }
    return {
      welcome: "Welcome to Inkooto",
      subtitle: "Connecting you with the best services, anytime, anywhere. Experience seamless support tailored just for you.",
      getStarted: "Get Started",
      alreadyHave: "Already have an account?",
      login: "Login",
    };
  }, [language]);

  const handleGetStarted = () => {
    router.push({
      pathname: "/(onboarding)/location-access",
      params: role ? { role: String(role) } : undefined,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="light" backgroundColor="#2A8B8B" translucent={false} />

      {/* Top Container */}
      <View style={{ height: height * 0.62 }}>
        <ImageBackground
          source={images.getstart_image}
          style={{ flex: 1, width: "100%", height: "120%" }}
          resizeMode="cover"
        />
      </View>

      {/* Content Container */}
      <View
        style={{
          flex: 1,
          marginTop: -40,
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          paddingHorizontal: 30,
          paddingTop: 45,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#1F1F1F",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            {ui.welcome}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: "#707070",
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 45,
            }}
          >
            {ui.subtitle}
          </Text>

          {/* Get Started Button */}
          <TouchableOpacity
            style={{
              backgroundColor: "#2A8B8B",
              width: "100%",
              paddingVertical: 18,
              borderRadius: 15,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              shadowColor: "#2A8B8B",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
              elevation: 8,
            }}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Feather
              name="arrow-right"
              size={20}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>
              {ui.getStarted}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View
            style={{
              flexDirection: "row",
              marginTop: 25,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#707070", fontSize: 15 }}>
              {`${ui.alreadyHave} `}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Feather
                name="log-in"
                size={16}
                color="#2A8B8B"
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  color: "#2A8B8B",
                  fontSize: 15,
                  fontWeight: "bold",
                }}
              >
                {ui.login}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
