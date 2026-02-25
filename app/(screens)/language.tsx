import { useTranslation } from "@/hooks/use-translation";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LanguageScreen = () => {
  const { language, setAppLanguage, t } = useTranslation();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios-new" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>{t("select_language", "Select Language")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
        <TouchableOpacity
          onPress={async () => setAppLanguage("en")}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 20,
          }}
        >
          <Text style={{ fontSize: 16, color: "#1F2937", fontWeight: "500" }}>{t("english", "English")}</Text>
          {language === "en" ? <Entypo name="check" size={18} color="#2D8A8A" /> : null}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => setAppLanguage("he")}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 20,
          }}
        >
          <Text style={{ fontSize: 16, color: "#1F2937", fontWeight: "500" }}>{t("hebrew", "Hebrew")}</Text>
          {language === "he" ? <Entypo name="check" size={18} color="#2D8A8A" /> : null}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => setAppLanguage("hi")}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 20,
          }}
        >
          <Text style={{ fontSize: 16, color: "#1F2937", fontWeight: "500" }}>{t("hindi", "Hindi")}</Text>
          {language === "hi" ? <Entypo name="check" size={18} color="#2D8A8A" /> : null}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LanguageScreen;
