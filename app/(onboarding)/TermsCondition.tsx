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

export default function TermsCondition() {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("terms_heading", "Terms & Condition")}</Text>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.welcomeText}>{t("terms_heading", "Terms of Service")}</Text>
            <Text style={styles.textBody}>{t("terms_intro", "Terms introduction")}</Text>

            <Text style={styles.sectionTitle}>{t("terms_section_1_title", "1. Use of the Service")}</Text>
            <Text style={styles.textBody}>{t("terms_section_1_body", "Terms section 1")}</Text>

            <Text style={styles.sectionTitle}>{t("terms_section_2_title", "2. User Responsibilities")}</Text>
            <Text style={styles.textBody}>{t("terms_section_2_body", "Terms section 2")}</Text>

            <Text style={styles.sectionTitle}>{t("terms_section_3_title", "3. Account & Access")}</Text>
            <Text style={styles.textBody}>{t("terms_section_3_body", "Terms section 3")}</Text>

            <Text style={styles.sectionTitle}>{t("terms_section_4_title", "4. Limitation of Liability")}</Text>
            <Text style={styles.textBody}>{t("terms_section_4_body", "Terms section 4")}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAccepted(!accepted)}
          >
            <View style={[styles.checkbox, accepted && styles.checked]}>
              {accepted && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={styles.checkboxText}>{`${t("confirm", "Confirm")} ${t("terms_heading", "Terms of Service")}`}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, !accepted && styles.disabledButton]}
            onPress={() =>
              accepted && router.replace("/(onboarding)/GetStarted")
            }
            disabled={!accepted}
          >
            <Text style={styles.nextText}>{t("info_continue", "Continue")}</Text>
          </TouchableOpacity>
        </View>
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
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  scrollContent: { marginBottom: 10 },
  welcomeText: { fontWeight: "bold", marginBottom: 10, fontSize: 16 },
  content: { marginBottom: 10 },
  textBody: { color: "#444", lineHeight: 20, marginBottom: 8 },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 15,
    marginBottom: 10,
    color: "#2D8C8C",
  },
  footer: { marginTop: 10 },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
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
