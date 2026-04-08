import { useGetBuyerTransactionHistoryQuery } from "@/store/api/paymentApiSlice";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ArrowDownLeft } from "lucide-react-native";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const toNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: any) => `$${toNumber(value).toFixed(2)}`;

const formatTimeLabel = (value: any) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();

  if (isToday) return `Today at ${timePart}`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function BuyerTransactionHistoryScreen() {
  const user = useAppSelector(selectCurrentUser);
  const currentUserId =
    (user as any)?.userId ||
    (user as any)?.id ||
    (user as any)?._id ||
    (user as any)?.buyer?.userId;

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
    }),
    []
  );

  const { data: paymentsData, isLoading, isFetching, refetch } = useGetBuyerTransactionHistoryQuery(queryParams, {
    skip: !currentUserId,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const transactions = useMemo(() => {
    const raw = Array.isArray((paymentsData as any)?.items)
      ? (paymentsData as any).items
      : Array.isArray((paymentsData as any)?.data?.items)
      ? (paymentsData as any).data.items
      : [];

    return [...raw].sort((a: any, b: any) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [paymentsData]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#1C252B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>History</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#218B8D" style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item, index) => String(item?.id || item?._id || index)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            onRefresh={refetch}
            refreshing={isFetching && !isLoading}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.iconWrap}>
                  <ArrowDownLeft color="#1F948E" size={18} />
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.title}>Add in Wallet</Text>
                  <Text style={styles.time}>{formatTimeLabel(item?.createdAt)}</Text>
                </View>

                <Text style={styles.amount}>{formatMoney(item?.amount)}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No transaction history found.</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDF1EF",
  },
  header: {
    direction: 'ltr',
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#20282D",
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  sectionTitle: {
    fontSize: 38 / 2,
    fontWeight: "600",
    color: "#222A2F",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#F8F8F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DBDFE2",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "#1F948E",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2FAF8",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 32 / 2,
    color: "#1F252A",
    fontWeight: "500",
  },
  time: {
    marginTop: 4,
    fontSize: 13,
    color: "#6D7780",
  },
  amount: {
    fontSize: 36 / 2,
    color: "#1B8E90",
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    marginTop: 24,
  },
});
