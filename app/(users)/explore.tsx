import { useTranslation } from "@/hooks/use-translation";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 52) / 2;

const DUMMY_VENDOR_CARDS = [
  {
    id: "elite-electronics",
    name: "Elite Electronics",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "nova-gadgets",
    name: "Nova Gadgets",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "pixel-house",
    name: "Pixel House",
    image:
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "smart-zone",
    name: "Smart Zone",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
  },
];


export default function ExploreScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={30} color="#333333" />
        </Pressable>
        <Text style={styles.title}>{t("explore", "Explore")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {DUMMY_VENDOR_CARDS.map((vendor) => (
            <View key={vendor.id} style={styles.card}>
              <Image
                source={{ uri: vendor.image }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <Text style={styles.cardTitle} numberOfLines={2}>
                {vendor.name}
              </Text>
              <TouchableOpacity
                style={styles.cardButton}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/(user_screen)/ElectronicsScreen",
                    params: {
                      vendorId: vendor.id,
                      categoryName: vendor.name,
                    },
                  })
                }
              >
                <Text style={styles.cardButtonText}>
                  {t("connect", "Connect")}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAF9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: "#F8FAF9",
  },
  backButton: {
    width: 36,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: "#DDEBE8",
    shadowColor: "#6AA8A1",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardImage: {
    width: "100%",
    height: 138,
    borderRadius: 18,
    backgroundColor: "#D9E8E6",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#101010",
    textAlign: "center",
    minHeight: 48,

    paddingHorizontal: 4,
  },
  cardButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#6DA8A4",
    backgroundColor: "#ECFBF9",
    justifyContent: "center",
    alignItems: "center",
  },
  cardButtonText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#2B6E6F",
  },
});
