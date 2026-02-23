import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/use-translation";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("privacy_heading", "Privacy & Policy")}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            {/* <Ionicons name="close" size={24} color="#333" /> */}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          <Text style={styles.updateDate}>Last updated on 23 August 2025</Text>
          <Text style={styles.textBody}>
            {t("privacy_intro", "Privacy policy")}
          </Text>
          <Text style={styles.sectionTitle}>{t("privacy_section_1_title", "1. Information we collect")}</Text>
          <Text style={styles.textBody}>
            {t("privacy_section_1_body", "Details about collected information.")}
          </Text>
          <Text style={styles.sectionTitle}>{t("privacy_section_2_title", "2. How We Use Your Information")}</Text>
          <Text style={styles.textBody}>
            {t("privacy_section_2_body", "Details about data usage.")}
          </Text>
          <Text style={styles.sectionTitle}>{t("privacy_section_3_title", "3. Information Sharing")}</Text>
          <Text style={styles.textBody}>
            {t("privacy_section_3_body", "Details about sharing information.")}
          </Text>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAccepted(!accepted)}
          >
            <View style={[styles.checkbox, accepted && styles.checked]}>
              {accepted && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={styles.checkboxText}>{`${t("confirm", "Confirm")} ${t("privacy_heading", "Privacy & Policy")}`}</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity
          style={[styles.nextButton, !accepted && styles.disabledButton]}
          onPress={() =>
            accepted && router.push("/(onboarding)/TermsCondition")
          }
          disabled={!accepted}
        >
          <Text style={styles.nextText}>{t("info_continue", "Continue")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  updateDate: { color: "#777", marginBottom: 15 },
  content: { marginBottom: 20 },
  textBody: { color: "#444", lineHeight: 20, marginBottom: 15 },
  sectionTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 10 },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#2D8C8C",
    borderRadius: 4,
    marginRight: 10,
  },
  checked: { backgroundColor: "#2D8C8C" },
  checkboxText: { color: "#2D8C8C", fontWeight: "600" },
  nextButton: {
    backgroundColor: "#2D8C8C",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: { backgroundColor: "#ccc" },
  nextText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});
