import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80";

const BUYER_PROFILE = {
  status: "Online now",
  accent: "#2D8C86",
  surface: "#EEF7F4",
  stats: [
    {
      icon: "bag-handle-outline" as const,
      title: "Order Frequency",
      value: "High",
      subtitle: "Recent order #ORD-2025",
    },
    {
      icon: "wallet-outline" as const,
      title: "Lifetime Spend",
      value: "$2,450",
      subtitle: "Average basket $110",
    },
  ],
  details: [
    { icon: "calendar", label: "Joined", value: "March 2023" },
    { icon: "activity", label: "Status", value: "Active customer" },
    { icon: "mail", label: "Email", value: "rokey.mahmud@email.com" },
    { icon: "phone", label: "Phone", value: "+1 555-010-9876" },
    { icon: "map-pin", label: "Address", value: "6381 Elgin St, Celina, Delaware 19299" },
  ],
  actions: ["Offer Discount"],
};

const VENDOR_PROFILE = {
  accent: "#1F7A8C",
  surface: "#EEF5FB",

  details: [
    { icon: "calendar", label: "Joined", value: "January 2022" },
    { icon: "activity", label: "Status", value: "Active" },
    { icon: "mail", label: "Email", value: "support@techhubelectronics.com" },
    { icon: "phone", label: "Phone", value: "+1 555-019-2244" },
    { icon: "map-pin", label: "Address", value: "245 Market Street, Wilmington, Delaware 19801" },
  ],
  actions: ["Order History"],
};


const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
}) => (
  <View style={styles.detailRow}>
    <Feather name={icon} size={16} color="#5D6F70" />
    <Text style={styles.detailText}>
      {label}: <Text style={styles.detailValue}>{value}</Text>
    </Text>
  </View>
);

export default function CustomerProfileScreen() {
  const params = useLocalSearchParams<{
    name?: string;
    avatar?: string;
    partnerId?: string;
    profileType?: string;
    profileBadge?: string;
  }>();

  const profileType = String(params.profileType || "").toLowerCase() === "vendor" ? "vendor" : "buyer";
  const profile = profileType === "vendor" ? VENDOR_PROFILE : BUYER_PROFILE;
  const displayName = params.name || (profileType === "vendor" ? "TechHub Electronics" : "Rokey Mahmud");
  const avatar = params.avatar || DEFAULT_AVATAR;
  const badge =
    params.profileBadge || (profileType === "vendor" ? "Vendor Profile" : "Buyer Profile");

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={profile.surface} />
      <View style={[styles.topBar, { backgroundColor: profile.surface }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios-new" size={20} color="#213233" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Profile</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: profile.surface }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.grabber} />

          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={[styles.onlineDot, { backgroundColor: profile.accent }]} />
          </View>

          <View style={[styles.badgePill, { backgroundColor: `${profile.accent}14` }]}>
            <Text style={[styles.badgeText, { color: profile.accent }]}>{badge}</Text>
          </View>

          <Text style={styles.name}>{displayName}</Text>



          <View style={styles.detailsCard}>
            {profile.details.map((item) => (
              <DetailRow key={item.label} icon={item.icon} label={item.label} value={item.value} />
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: profile.accent }]} activeOpacity={0.9}>
              <Text style={styles.primaryButtonText}>{profile.actions[0]}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF7F4",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#213233",
  },
  topBarSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 24,
    shadowColor: "#184A47",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  grabber: {
    alignSelf: "center",
    width: 68,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D7E2DE",
    marginBottom: 16,
  },
  avatarWrap: {
    alignSelf: "center",
    position: "relative",
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 4,
    borderColor: "#F4FBF8",
  },
  onlineDot: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgePill: {
    alignSelf: "center",
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  name: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "800",
    color: "#1D2E2F",
  },
  status: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E3ECE8",
    shadowColor: "#123B39",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#314445",
  },
  statValue: {
    marginTop: 10,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
  },
  statSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#3A4B4B",
    fontWeight: "500",
  },
  detailsCard: {
    marginTop: 18,
    paddingTop: 4,
    gap: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: "#4B5E5F",
  },
  detailValue: {
    color: "#213233",
    fontWeight: "700",
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
