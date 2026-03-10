import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

const SupportRequestScreen = () => {
  const [issue, setIssue] = useState("");
  const [complaint, setComplaint] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const issueOptions = [
    "Vehicle not clean",
    "Driver behavior",
    "Late arrival",
    "Pricing issue",
    "Other",
  ];

  const handleSend = () => {
    if (!issue || !complaint) {
      Alert.alert("Error", "Please select an issue and write your complaint.");
      return;
    }

    console.log("Support Request:", { issue, complaint });
    Alert.alert("Success", "Your request has been sent to admin.");

    setIssue("");
    setComplaint("");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Text style={styles.logoText}>
                Link<Text style={styles.logoDot}>•</Text>To
              </Text>
            </View>
          </View>

          <Text style={styles.infoText}>
            If you face any kind of problem with our service feel free to
            contact us.
          </Text>

          {/* Dropdown Select Issue */}
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setIsModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dropdownText, !issue && { color: "#999" }]}>
              {issue || "Vehicle not clean"}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={24}
              color="#1E5D68"
            />
          </TouchableOpacity>

          {/* Complaint Text Area */}
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Write your complain here"
              placeholderTextColor="#999"
              multiline={true}
              numberOfLines={5}
              value={complaint}
              onChangeText={setComplaint}
              textAlignVertical="top"
            />
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            activeOpacity={0.9}
          >
            <Text style={styles.sendButtonText}>Send to admin</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={isModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setIsModalVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select an issue</Text>
            {issueOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.modalItem}
                onPress={() => {
                  setIssue(option);
                  setIsModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF9" },
  header: {
    direction: 'ltr',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  backBtn: { padding: 5 },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 40,
  },

  logoContainer: { marginBottom: 20 },
  logoWrapper: {
    width: 250,
    height: 130,
    backgroundColor: "#222",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: { color: "#FFF", fontSize: 38, fontWeight: "bold" },
  logoDot: { color: "#2D8282" },

  infoText: {
    textAlign: "center",
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 10,
  },

  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EBF2F0",
    borderRadius: 10,
    width: "100%",
    height: 55,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  dropdownText: { fontSize: 15, color: "#333" },

  textAreaContainer: {
    backgroundColor: "#EBF2F0",
    borderRadius: 15,
    width: "100%",
    paddingHorizontal: 15,
    paddingVertical: 12,
    minHeight: 150,
    marginBottom: 25,
  },
  textArea: { fontSize: 15, color: "#333", flex: 1 },

  sendButton: {
    backgroundColor: "#2D8282",
    width: "100%",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sendButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#2D8282",
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EEE",
  },
  modalItemText: { fontSize: 16, textAlign: "center", color: "#333" },
});

export default SupportRequestScreen;
