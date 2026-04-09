import { supportTickets } from "@/constants/common";
import { useTranslation } from "@/hooks/use-translation";
import {
  useGetConversationsQuery,
  useMarkAsReadMutation,
} from "@/store/api/chatApiSlice";
import { RootState } from "@/store/store";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

const normalizeId = (value: any) =>
  value === undefined || value === null ? "" : String(value);
const resolveChatUserId = (entity: any) =>
  normalizeId(
    entity?.userId ??
      entity?.buyer?.userId ??
      entity?.vendor?.userId ??
      entity?.user?.userId ??
      entity?.id ??
      entity?._id ??
      entity,
  );

const resolveDisplayName = (partner: any, fallback: string) => {
  return (
    partner?.fullName ||
    partner?.buyer?.fullName ||
    partner?.vendor?.businessName ||
    partner?.businessName ||
    partner?.vendor?.storename ||
    partner?.storename ||
    partner?.vendor?.fullName ||
    partner?.displayName ||
    partner?.user?.displayName ||
    partner?.email ||
    fallback
  );
};

const resolveConversationPartner = (
  conversation: any,
  currentUserId: string,
) => {
  const directPartner = conversation?.partner || conversation?.participant;
  if (
    directPartner?.fullName ||
    directPartner?.buyer?.fullName ||
    directPartner?.vendor?.businessName ||
    directPartner?.businessName ||
    directPartner?.vendor?.storename ||
    directPartner?.storename ||
    directPartner?.vendor?.fullName
  ) {
    return directPartner;
  }

  const sender = conversation?.lastMessage?.sender;
  const receiver = conversation?.lastMessage?.receiver;
  const senderId = resolveChatUserId(sender);
  const receiverId = resolveChatUserId(receiver);

  if (sender && senderId && senderId !== currentUserId) {
    return sender;
  }

  if (receiver && receiverId && receiverId !== currentUserId) {
    return receiver;
  }

  return directPartner || sender || receiver || {};
};

const resolveConversationAvatar = (partner: any) =>
  partner?.avatar ||
  partner?.profilePhotoUrl ||
  partner?.buyer?.profilePhotoUrl ||
  partner?.vendor?.logoUrl ||
  partner?.logoUrl ||
  partner?.avatarUrl ||
  "https://via.placeholder.com/48";

const formatTime = (value: any) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    .toLowerCase();
};

export default function ChatTabs() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.auth.user);
  const currentUserId = resolveChatUserId(user);

  const [activeTab, setActiveTab] = useState<"chat" | "support">("chat");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: conversationsData = [], isLoading: isConversationsLoading } =
    useGetConversationsQuery(currentUserId, {
      skip: !currentUserId,
      refetchOnMountOrArgChange: true,
    });
  const [markAsRead] = useMarkAsReadMutation();

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const rows = Array.isArray(conversationsData) ? conversationsData : [];
    if (!q) return rows;
    return rows.filter((row: any) => {
      const partner = resolveConversationPartner(row, currentUserId);
      const name = resolveDisplayName(partner, t("chat_user_fallback", "User"));
      const text = row?.lastMessage?.messageText || "";
      return (
        String(name).toLowerCase().includes(q) ||
        String(text).toLowerCase().includes(q)
      );
    });
  }, [conversationsData, currentUserId, searchQuery, t]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return supportTickets.filter(
      (ticket) =>
        ticket.title.toLowerCase().includes(q) ||
        ticket.customer.name.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios-new" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("chat_title", "Chat")}</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={22} color="#111827" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("chat_search_by_name", "Search by name")}
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "chat" && styles.tabActive]}
          onPress={() => setActiveTab("chat")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "chat" && styles.tabTextActive,
            ]}
          >
            {t("chat_tab_chat", "Chat")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "support" && styles.tabActive]}
          onPress={() => setActiveTab("support")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "support" && styles.tabTextActive,
            ]}
          >
            {t("chat_tab_support", "Support")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "chat" ? (
          <View style={styles.listWrap}>
            {isConversationsLoading ? (
              <Text style={styles.emptyText}>
                {t("chat_loading_conversations", "Loading conversations...")}
              </Text>
            ) : filteredConversations.length ? (
              filteredConversations.map((conversation: any, index: number) => {
                const partner = resolveConversationPartner(
                  conversation,
                  currentUserId,
                );
                const partnerId =
                  resolveChatUserId(partner?.userId ? partner : null) ||
                  resolveChatUserId(partner) ||
                  resolveChatUserId(conversation?.partner) ||
                  normalizeId(conversation?.partnerId);
                const displayName = resolveDisplayName(
                  partner,
                  t("chat_user_fallback", "User"),
                );
                const avatar = resolveConversationAvatar(partner);
                const lastText =
                  conversation?.lastMessage?.messageText ||
                  t("chat_no_messages_yet", "No messages yet");
                const unreadCount = Number(conversation?.unreadCount || 0);
                const messageId =
                  conversation?.lastMessage?.id ||
                  conversation?.lastMessage?._id;

                return (
                  <TouchableOpacity
                    key={normalizeId(
                      conversation?.id ||
                        conversation?._id ||
                        `${partnerId}-${index}`,
                    )}
                    style={styles.row}
                    onPress={async () => {
                      if (unreadCount > 0 && messageId) {
                        try {
                          await markAsRead(messageId).unwrap();
                        } catch {}
                      }

                      if (!partnerId) return;
                      router.push({
                        pathname: "/(screens)/chat_box",
                        params: {
                          role: "vendor",
                          partnerId,
                          conversationId: normalizeId(
                            conversation?.id || conversation?._id || partnerId,
                          ),
                          fullname: displayName,
                        },
                      });
                    }}
                  >
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                    <View style={styles.middle}>
                      {/* 1px solid red */}
                      <Text
                        style={styles.name}
                        onPress={() => {
                          console.log(
                            displayName,
                            avatar,
                            partner,
                            conversation,
                          );
                        }}
                      >
                        {displayName}
                      </Text>
                      <Text style={styles.preview} numberOfLines={1}>
                        {lastText}
                      </Text>
                    </View>
                    <View style={styles.right}>
                      <Text
                        style={[
                          styles.time,
                          unreadCount > 0 && styles.timeActive,
                        ]}
                      >
                        {formatTime(conversation?.lastMessage?.createdAt)}
                      </Text>
                      {unreadCount > 0 ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.emptyText}>
                {t("chat_no_conversations_found", "No conversations found.")}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.listWrap}>
            {filteredTickets.map((ticket) => (
              <View key={ticket.id} style={styles.supportCard}>
                <Text style={styles.supportTitle}>{ticket.title}</Text>
                <Text style={styles.supportDesc} numberOfLines={2}>
                  {ticket.description}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F6F5", direction: "ltr" },
  header: {
    direction: "ltr",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  searchWrap: {
    marginHorizontal: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D9E1E7",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    backgroundColor: "#FAFAFB",
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#111827" },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#DCE5E5",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 12,
  },
  tabActive: { backgroundColor: "#2A8B8A" },
  tabText: { color: "#374151", fontSize: 16, fontWeight: "500" },
  tabTextActive: { color: "#FFFFFF" },
  listWrap: { paddingHorizontal: 20, paddingTop: 12 },
  row: {
    direction: "ltr",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DEE5EA",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#CCEFDB",
  },
  middle: { flex: 1, marginLeft: 12, marginRight: 8, direction: "ltr" },
  name: {
    fontSize: 31 / 2,
    fontWeight: "600",
    color: "#263238",
    textAlign: "left",
  },
  preview: {
    fontSize: 29 / 2,
    color: "#4B5563",
    marginTop: 2,
    textAlign: "left",
  },
  right: { alignItems: "flex-start", minWidth: 64, direction: "ltr" },
  time: { fontSize: 14, color: "#4B5563", textAlign: "left" },
  timeActive: { color: "#1E8A8D" },
  badge: {
    marginTop: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1E8A8D",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 24,
    fontSize: 14,
  },
  supportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 10,
  },
  supportTitle: { fontSize: 15, fontWeight: "700", color: "#1F2937" },
  supportDesc: { fontSize: 13, color: "#6B7280", marginTop: 6 },
});
