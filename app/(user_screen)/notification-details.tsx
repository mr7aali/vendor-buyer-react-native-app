import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "@/hooks/use-translation";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationDetailsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const title = typeof params.title === "string" ? params.title : "";
  const message = typeof params.message === "string" ? params.message : "";
  const createdAt = typeof params.createdAt === "string" ? params.createdAt : "";
  const parsedDate = createdAt ? new Date(createdAt) : null;
  const formattedTime =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleString()
      : t("notif_just_now", "Just now");

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("notif_details_title", "Notification Details")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Image/Icon Section */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: "https://via.placeholder.com/100" }}
            style={styles.detailImage}
          />
        </View>

        {/* Message Card */}
        <View style={styles.infoCard}>
          <Text style={styles.statusBadge}>{t("notif_update_badge", "Delivery Update")}</Text>
          <Text style={styles.messageTitle}>
            {title || t("notif_default_title", "Your delivery has been successfully completed!!")}
          </Text>
          <Text style={styles.timeText}>
            <Ionicons name="time-outline" size={14} /> {formattedTime}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.description}>
            {message ||
              t(
                "notif_default_message",
                "Hello, your order has been delivered to your address. Thank you for choosing our service!"
              )}
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(users)")}
        >
          <Text style={styles.buttonText}>{t("notif_back_home", "Back to Home")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBF9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    padding: 20,
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  detailImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E0E0E0",
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statusBadge: {
    backgroundColor: "#E8F5E9",
    color: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    fontSize: 12,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    lineHeight: 28,
  },
  timeText: {
    fontSize: 14,
    color: "#999",
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 20,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
