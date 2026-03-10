import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CardDetailsScreen: React.FC = () => {
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState("card");

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Choose a Payment Method</Text>

        {/* Payment Icons Row */}
        <View style={styles.methodRow}>
          <TouchableOpacity
            style={[
              styles.methodBox,
              selectedCard === "card" && styles.activeMethod,
            ]}
            onPress={() => setSelectedCard("card")}
          >
            <Ionicons
              name="card"
              size={24}
              color={selectedCard === "card" ? "#2A8383" : "#666"}
            />
            <Text
              style={[
                styles.methodText,
                selectedCard === "card" && styles.activeText,
              ]}
            >
              Card
            </Text>
          </TouchableOpacity>

          <View style={styles.methodBox}>
            <Text style={styles.methodText}>iDEAL</Text>
          </View>

          <View style={styles.methodBox}>
            <Text style={styles.methodText}>bancontact</Text>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Card number</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="43 837 8398 787"
              keyboardType="numeric"
            />
            <View style={styles.cardLogos}>
              <Text style={styles.visaText}>VISA</Text>
              <View style={styles.masterCircle} />
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Expiration Date</Text>
          <TextInput
            style={styles.input}
            placeholder="MM/YY"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Security Code</Text>
          <TextInput
            style={styles.input}
            placeholder="CVC"
            keyboardType="numeric"
            secureTextEntry
          />
        </View>

        {/* Confirm Button */}
        <TouchableOpacity style={styles.confirmBtn}>
          <Text style={styles.confirmBtnText}>Confirm</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FBF9" },
  header: {
    direction: 'ltr',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  content: { padding: 20 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 15, color: "#444" },
  methodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  methodBox: {
    width: "30%",
    height: 60,
    backgroundColor: "#FFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeMethod: { borderColor: "#2A8383", backgroundColor: "#F0F9F9" },
  methodText: { fontSize: 12, color: "#666", marginTop: 4 },
  activeText: { color: "#2A8383", fontWeight: "bold" },
  formGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
  },
  inputWrapper: { position: "relative", justifyContent: "center" },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
  },
  cardLogos: {
    position: "absolute",
    right: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  visaText: { color: "#1A1F71", fontWeight: "bold", marginRight: 5 },
  masterCircle: {
    width: 20,
    height: 20,
    backgroundColor: "#EB001B",
    borderRadius: 10,
    opacity: 0.8,
  },
  confirmBtn: {
    backgroundColor: "#00796B",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  confirmBtnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});

export default CardDetailsScreen;
