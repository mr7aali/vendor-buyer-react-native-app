import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VendorProfileScreen = () => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [storeName, setStoreName] = useState("");
  const [aboutStore, setAboutStore] = useState("");

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
            <Text style={styles.title}>Complete your profile</Text>
            <Text style={styles.subtitle}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed.
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter Your Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address or number"
                placeholderTextColor="#C7C7CD"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter Your Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#C7C7CD"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                placeholderTextColor="#C7C7CD"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter Your Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your address"
                placeholderTextColor="#C7C7CD"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            {/* Store Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter Your Store Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Your Store Name"
                placeholderTextColor="#C7C7CD"
                value={storeName}
                onChangeText={setStoreName}
              />
            </View>

            {/* About Store (Multiline) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>About Your Store</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Briefly describe your products or services"
                placeholderTextColor="#C7C7CD"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                value={aboutStore}
                onChangeText={setAboutStore}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => console.log("Form Submitted")}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    marginBottom: 35,
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
    paddingHorizontal: 15,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#181725",
    marginBottom: 8,
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
  textArea: {
    height: 120,
    paddingTop: 15,
  },
  submitButton: {
    backgroundColor: "#3B8C8C",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default VendorProfileScreen;
