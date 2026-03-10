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

const TermsAndConditionScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/(users)/profile")}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Condition</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.mainTitle}>Terms & Condition</Text>

        <View style={styles.section}>
          <Text style={styles.subTitle}>Welcome to Services App !</Text>
          <Text style={styles.description}>
            Accessing or using our services, you agree to be bound by these
            Terms of Service. If you do not agree with any part of the terms,
            you must not use our services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. User Responsibilities As a user, you agree to:
          </Text>
          <View style={styles.bulletPointContainer}>
            <Text style={styles.bulletItem}>
              • Use the service only for lawful purposes.
            </Text>
            <Text style={styles.bulletItem}>
              • Provide accurate and complete information when required.
            </Text>
            <Text style={styles.bulletItem}>
              • Maintain the confidentiality of your account password.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Intellectual Property</Text>
          <Text style={styles.description}>
            All content, trademarks, and data on this service, including but not
            limited to text, graphics, logos, and images, are the property of
            [Your Company Name]
          </Text>
        </View>

        {[4, 5, 6].map((num) => (
          <View key={num} style={styles.section}>
            <Text style={styles.sectionTitle}>{num}. Disclaimers</Text>
            <Text style={styles.description}>
              The service is provided on an as is and as available basis. [Your
              Company Name] makes no warranties, expressed or implied, regarding
              the operation.
            </Text>
          </View>
        ))}
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
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#444",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 10,
  },
  bulletPointContainer: {
    paddingLeft: 10,
  },
  bulletItem: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    marginBottom: 5,
  },
});

export default TermsAndConditionScreen;
