import { useSocket } from "@/context/SocketContext";
import { useTranslation } from "@/hooks/use-translation";
import {
  UserNotification,
  useDeleteMyNotificationMutation,
  useGetMyNotificationsQuery,
  useMarkAllMyNotificationsReadMutation,
  useMarkMyNotificationReadMutation,
} from "@/store/api/notificationApiSlice";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const timeAgo = (value: string, t: (key: string, fallback?: string) => string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("notif_just_now", "Just now");
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return t("notif_just_now", "Just now");
  if (diff < hour) return `${Math.floor(diff / minute)} ${t("notif_min_ago", "min ago")}`;
  if (diff < day) return `${Math.floor(diff / hour)}${t("notif_h_ago", "h ago")}`;
  return `${Math.floor(diff / day)}${t("notif_d_ago", "d ago")}`;
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const {
    data: notifications = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetMyNotificationsQuery();
  const [markAsRead, { isLoading: isMarkingRead }] = useMarkMyNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllMyNotificationsReadMutation();
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteMyNotificationMutation();

  useEffect(() => {
    if (!socket) return;
    const onNotification = () => {
      refetch();
    };
    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, [socket, refetch]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const onPressItem = async (item: UserNotification) => {
    if (!item.isRead) {
      try {
        await markAsRead(item.id).unwrap();
      } catch {
      }
    }
    router.push({
      pathname: "/(user_screen)/notification-details",
      params: {
        title: item.title,
        message: item.message,
        createdAt: item.createdAt,
      },
    });
  };

  const showOptions = (item: UserNotification) => {
    Alert.alert(t("notif_options", "Options"), t("notif_choose_action", "Choose an action"), [
      !item.isRead
        ? {
            text: t("notif_mark_as_read", "Mark as read"),
            onPress: async () => {
              try {
                await markAsRead(item.id).unwrap();
              } catch (error: any) {
                Alert.alert(t("error", "Error"), error?.data?.message || t("notif_failed_mark_read", "Failed to mark as read"));
              }
            },
          }
        : { text: t("notif_read", "Read"), style: "cancel" },
      {
        text: t("notif_delete", "Delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteNotification(item.id).unwrap();
          } catch (error: any) {
            Alert.alert(t("error", "Error"), error?.data?.message || t("notif_failed_delete", "Failed to delete notification"));
          }
        },
      },
      { text: t("notif_close", "Close"), style: "cancel" },
    ]);
  };

  const renderItem: ListRenderItem<UserNotification> = ({ item }) => (
    <TouchableOpacity style={[styles.card, !item.isRead && styles.unreadCard]} onPress={() => onPressItem(item)}>
      <View style={styles.avatar}>
        <Ionicons name="notifications-outline" size={22} color="#278687" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.titleText} numberOfLines={1}>
          {item.title || t("notif_notification", "Notification")}
        </Text>
        <Text style={styles.messageText} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.timeText}>{timeAgo(item.createdAt, t)}</Text>
      </View>

      <TouchableOpacity style={styles.moreButton} onPress={() => showOptions(item)}>
        {!item.isRead ? <View style={styles.unreadDot} /> : null}
        <Entypo name="dots-three-vertical" size={16} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(users)")}>
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("notif_notifications", "Notifications")} ({unreadCount})</Text>
        <TouchableOpacity
          disabled={!unreadCount || isMarkingAllRead}
          onPress={async () => {
            try {
              await markAllRead().unwrap();
            } catch (error: any) {
              Alert.alert(t("error", "Error"), error?.data?.message || t("notif_failed_mark_all_read", "Failed to mark all as read"));
            }
          }}
        >
          <Text style={[styles.markAllText, (!unreadCount || isMarkingAllRead) && styles.markAllDisabled]}>
            {t("notif_mark_all", "Mark all")}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#278687" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          ListEmptyComponent={<Text style={styles.emptyText}>{t("notif_no_notifications", "No notifications")}</Text>}
        />
      )}

      {(isMarkingRead || isDeleting) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#FFF" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FBF9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  markAllText: { color: "#278687", fontWeight: "700", fontSize: 13 },
  markAllDisabled: { color: "#9CBABA" },
  listContent: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 16 },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { textAlign: "center", marginTop: 20, color: "#6B7280" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  unreadCard: {
    borderWidth: 1,
    borderColor: "#D2ECEB",
    backgroundColor: "#F7FFFE",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EAF6F5",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: { flex: 1, marginLeft: 15, marginRight: 10 },
  titleText: { fontSize: 14, color: "#1F2937", fontWeight: "700" },
  messageText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    fontWeight: "500",
    marginTop: 2,
  },
  timeText: { fontSize: 13, color: "#999", marginTop: 8 },
  moreButton: { padding: 10, position: "relative" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1E8A8D",
    position: "absolute",
    top: 7,
    right: 7,
    zIndex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});
