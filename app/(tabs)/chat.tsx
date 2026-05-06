import { supportTickets } from "@/constants/common";
import { getLayoutDirection } from "@/constants/rtl";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";
import { formatRoleLabel, resolveConversationRole, resolveCurrentRole } from "@/services/chatRole";
import {
  useGetConversationsQuery,
  useMarkAsReadMutation,
} from "@/store/api/chatApiSlice";
import { RootState } from "@/store/store";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  FlatList,
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

const isImageLikeMessageText = (value: any) => {
  const text = String(value || "").trim();
  if (!text) return false;

  return (
    /^data:image\//i.test(text) ||
    /^file:\/\//i.test(text) ||
    /^https?:\/\/.+\.(png|jpe?g|webp|gif|bmp)(\?.*)?$/i.test(text) ||
    /res\.cloudinary\.com\/.+\/image\/upload\//i.test(text)
  );
};

const buildMessagePreview = (value: any, t: any) => {
  const text = String(value || "").trim();
  if (!text) return t("chat_no_messages_yet", "No messages yet");
  if (isImageLikeMessageText(text)) {
    return t("chat_attachment_photo", "Photo");
  }
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
};

const formatTime = (value: any) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    .toLowerCase();
};

const ChatListSkeleton = () => (
  <View style={styles.listWrap}>
    {Array.from({ length: 7 }).map((_, index) => (
      <View key={`chat-skeleton-${index}`} style={styles.row}>
        <View style={styles.right}>
          <SkeletonBlock style={styles.skeletonTime} />
          <SkeletonBlock style={styles.skeletonBadge} />
        </View>
        <View style={styles.rowMain}>
          <SkeletonBlock style={styles.skeletonAvatar} />
          <View style={styles.middle}>
            <SkeletonBlock style={styles.skeletonName} />
            <SkeletonBlock style={styles.skeletonPreview} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

export default function ChatTabs() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const user = useSelector((state: RootState) => state.auth.user);
  const currentUserId = resolveChatUserId(user);
  const currentRole = resolveCurrentRole(user);
  const isRTL = getLayoutDirection(language) === "rtl";

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
    const rows = Array.isArray(conversationsData)
      ? conversationsData.map((row: any) => ({
          ...row,
          lastMessagePreview: buildMessagePreview(
            row?.lastMessage?.messageText || row?.lastMessage?.text,
            t,
          ),
        }))
      : [];
    if (!q) return rows;
    return rows.filter((row: any) => {
      const partner = resolveConversationPartner(row, currentUserId);
      const name = resolveDisplayName(partner, t("chat_user_fallback", "User"));
      const text = row?.lastMessagePreview || "";
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

  const renderConversationRow = ({
    item: conversation,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const partner = resolveConversationPartner(conversation, currentUserId);
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
      conversation?.lastMessagePreview ||
      t("chat_no_messages_yet", "No messages yet");
    const unreadCount = Number(conversation?.unreadCount || 0);
    const conversationRole =
      resolveConversationRole(conversation, user) || "vendor";
    const isRoleMismatch = conversationRole !== currentRole;
    const messageId =
      conversation?.lastMessage?.id || conversation?.lastMessage?._id;
    const timeBlock = (
      <View style={[styles.right, isRTL && styles.rightRtl]}>
        <Text
          style={[
            styles.time,
            unreadCount > 0 && styles.timeActive,
            isRTL && styles.timeRtl,
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
    );
    const contentBlock = (
      <View style={styles.rowMain}>
        {isRTL ? (
          <>
            <View style={[styles.middle, styles.middleRtl]}>
              <View style={[styles.nameRow, styles.nameRowRtl]}>
                <Text style={[styles.name, styles.nameRtl]}>{displayName}</Text>
                <View
                  style={[
                    styles.roleBadge,
                    isRoleMismatch && styles.roleBadgeMuted,
                  ]}
                >
                  <Text style={styles.roleBadgeText}>
                    {formatRoleLabel(conversationRole)} Chat
                  </Text>
                </View>
              </View>
              <Text style={[styles.preview, styles.previewRtl]} numberOfLines={1}>
                {isRoleMismatch
                  ? `This conversation belongs to your ${formatRoleLabel(conversationRole)} role.`
                  : lastText}
              </Text>
            </View>
            <Image source={{ uri: avatar }} style={styles.avatar} />
          </>
        ) : (
          <>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={styles.middle}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{displayName}</Text>
                <View
                  style={[
                    styles.roleBadge,
                    isRoleMismatch && styles.roleBadgeMuted,
                  ]}
                >
                  <Text style={styles.roleBadgeText}>
                    {formatRoleLabel(conversationRole)} Chat
                  </Text>
                </View>
              </View>
              <Text style={styles.preview} numberOfLines={1}>
                {isRoleMismatch
                  ? `This conversation belongs to your ${formatRoleLabel(conversationRole)} role.`
                  : lastText}
              </Text>
            </View>
          </>
        )}
      </View>
    );

    return (
      <TouchableOpacity
        key={normalizeId(
          conversation?.id || conversation?._id || `${partnerId}-${index}`,
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
              role: conversationRole,
              partnerId,
              conversationId: normalizeId(
                conversation?.id || conversation?._id || partnerId,
              ),
              fullname: displayName,
            },
          });
        }}
      >
        {isRTL ? timeBlock : contentBlock}
        {isRTL ? contentBlock : timeBlock}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isRTL && styles.containerRtl]}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      <View style={[styles.header, isRTL && styles.headerRtl]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios-new" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("chat_title", "Chat")}</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={[styles.searchWrap, isRTL && styles.searchWrapRtl]}>
        <Ionicons name="search-outline" size={22} color="#111827" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("chat_search_by_name", "Search by name")}
          placeholderTextColor="#9CA3AF"
          style={[styles.searchInput, isRTL && styles.searchInputRtl]}
        />
      </View>

      <View style={[styles.tabRow, isRTL && styles.tabRowRtl]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "chat" && styles.tabActive, isRTL && styles.tabRtl]}
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
          style={[styles.tab, activeTab === "support" && styles.tabActive, isRTL && styles.tabRtl]}
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

      {activeTab === "chat" ? (
        isConversationsLoading ? (
          <ChatListSkeleton />
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(conversation, index) =>
              normalizeId(
                conversation?.id || conversation?._id || conversation?.partnerId,
              ) || `conversation-${index}`
            }
            renderItem={renderConversationRow}
            contentContainerStyle={[
              styles.listWrap,
              !filteredConversations.length && styles.emptyListWrap,
              { paddingBottom: 20 },
            ]}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {t("chat_no_conversations_found", "No conversations found.")}
              </Text>
            }
          />
        )
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F6F5", direction: "ltr" },
  containerRtl: { direction: "rtl" },
  header: {
    direction: "ltr",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerRtl: { direction: "rtl", flexDirection: "row-reverse" },
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
  searchWrapRtl: { flexDirection: "row-reverse" },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#111827" },
  searchInputRtl: { marginLeft: 0, marginRight: 10, textAlign: "right" },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  tabRowRtl: { flexDirection: "row-reverse" },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#DCE5E5",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 12,
  },
  tabRtl: { alignItems: "flex-end" },
  tabActive: { backgroundColor: "#2A8B8A" },
  tabText: { color: "#374151", fontSize: 16, fontWeight: "500" },
  tabTextActive: { color: "#FFFFFF" },
  listWrap: { paddingHorizontal: 20, paddingTop: 12 },
  row: {
    direction: "ltr",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DEE5EA",
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#CCEFDB",
  },
  middle: { flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 },
  middleRtl: { marginLeft: 8, marginRight: 12, alignItems: "flex-end" },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameRowRtl: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
    alignSelf: "flex-end",
  },
  name: {
    fontSize: 31 / 2,
    fontWeight: "600",
    color: "#263238",
    textAlign: "left",
  },
  nameRtl: { textAlign: "right", alignSelf: "flex-end" },
  preview: {
    fontSize: 29 / 2,
    color: "#4B5563",
    marginTop: 2,
    textAlign: "left",
  },
  previewRtl: { textAlign: "right", alignSelf: "stretch" },
  roleBadge: {
    backgroundColor: "#DDF2F0",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleBadgeMuted: {
    backgroundColor: "#FDECEC",
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#206C69",
  },
  right: { alignItems: "flex-end", minWidth: 64, marginLeft: 12 },
  rightRtl: { alignItems: "flex-start", marginLeft: 0, marginRight: 12 },
  time: { fontSize: 14, color: "#4B5563", textAlign: "left" },
  timeRtl: { textAlign: "left" },
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
  skeletonAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  skeletonName: {
    width: "62%",
    height: 14,
    borderRadius: 7,
  },
  skeletonPreview: {
    width: "88%",
    height: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  skeletonTime: {
    width: 38,
    height: 10,
    borderRadius: 5,
    alignSelf: "flex-end",
  },
  skeletonBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: "flex-end",
  },
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
  emptyListWrap: { flexGrow: 1 },
});
