import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PrivacyPolicyScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.mainTitle}>Privacy & Policy</Text>

        <Text style={styles.description}>
          We collect personal information that you voluntarily provide to us
          when you register on the [app/service], express an interest in
          obtaining information about us or our products and services,
        </Text>

        <Text style={styles.description}>
          The personal information that we collect depends on the context of
          your interactions with us and the [app/service], the choices you make,
          and the products and features you use.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information we collect</Text>
          <Text style={styles.description}>
            The personal information that we collect depends on the context of
            your interactions with us and the [app/service], the choices you
            make, and the products and features you use.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information use collect</Text>
          <Text style={styles.description}>
            We process your personal information for these purposes in reliance
            on our legitimate business interests, in order to enter into or
            perform a contract with you,
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAF9",
  },
  header: {
    direction: 'ltr',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  backBtn: {
    padding: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 24,
    marginBottom: 15,
    textAlign: "left",
  },
});

export default PrivacyPolicyScreen;
