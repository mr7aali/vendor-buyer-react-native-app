import { useSocket } from "@/context/SocketContext";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";
import {
  UserNotification,
  useDeleteMyNotificationMutation,
  useGetMyNotificationsQuery,
  useMarkAllMyNotificationsReadMutation,
  useMarkMyNotificationReadMutation,
} from "@/store/api/notificationApiSlice";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  BackHandler,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
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
  if (diff < day) return `${Math.floor(diff / hour)} ${t("notif_h_ago", "h ago")}`;
  return `${Math.floor(diff / day)} ${t("notif_d_ago", "d ago")}`;
};

const NotificationCardSkeleton = () => (
  <View
    style={{
      backgroundColor: "#FFF",
      flexDirection: "row",
      padding: 16,
      marginHorizontal: 1,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 1,
      alignItems: "flex-start",
      gap: 12,
    }}
  >
    <SkeletonBlock style={{ width: 50, height: 50, borderRadius: 25 }} />
    <View style={{ flex: 1, gap: 8 }}>
      <SkeletonBlock style={{ width: "55%", height: 15, borderRadius: 8 }} />
      <SkeletonBlock style={{ width: "95%", height: 14, borderRadius: 7 }} />
      <SkeletonBlock style={{ width: "70%", height: 14, borderRadius: 7 }} />
      <SkeletonBlock style={{ width: 64, height: 13, borderRadius: 7, marginTop: 4 }} />
    </View>
    <SkeletonBlock style={{ width: 18, height: 18, borderRadius: 9, marginTop: 6 }} />
  </View>
);

const Notifications = () => {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const { data: notifications = [], isLoading, isFetching, refetch } = useGetMyNotificationsQuery();
  const [markRead] = useMarkMyNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllMyNotificationsReadMutation();
  const [removeNotification] = useDeleteMyNotificationMutation();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UserNotification | null>(null);

  const ui = useMemo(
    () => ({
      deleteNotificationTitle: `${t("notif_delete", "Delete")} ${t("notif_notification", "Notification")}`,
      deleteNotificationText: "Are you sure you want to delete this notification?",
    }),
    [t]
  );

  const handleBackPress = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
    return true;
  }, []);

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

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );

    return () => subscription.remove();
  }, [handleBackPress]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const openItem = async (item: UserNotification) => {
    if (!item.isRead) {
      try {
        await markRead(item.id).unwrap();
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

  const confirmDelete = (item: UserNotification) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await removeNotification(selectedItem.id).unwrap();
    } catch (error: any) {
      Alert.alert(t("error", "Error"), error?.data?.message || t("notif_failed_delete", "Failed to delete notification"));
    } finally {
      setModalVisible(false);
      setSelectedItem(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ paddingLeft: 20, paddingRight: 20, flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 12,
            marginBottom: 10,
          }}
        >
          <TouchableOpacity onPress={handleBackPress}>
            <MaterialIcons name="arrow-back-ios-new" size={24} color="black" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "600" }}>{`${t("notif_notifications", "Notifications")} (${unreadCount})`}</Text>
          <TouchableOpacity
            disabled={!unreadCount || isMarkingAll}
            onPress={async () => {
              try {
                await markAllRead().unwrap();
              } catch (error: any) {
                Alert.alert(t("error", "Error"), error?.data?.message || t("notif_failed_mark_all_read", "Failed to mark all as read"));
              }
            }}
          >
            <Text style={{ color: !unreadCount || isMarkingAll ? "#9CBABA" : "#278687", fontWeight: "700" }}>
              {t("notif_mark_all", "Mark all")}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ gap: 12, paddingBottom: 20 }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <NotificationCardSkeleton key={`notification-skeleton-${index}`} />
              ))}
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          >
            <View style={{ gap: 12, paddingBottom: 20 }}>
              {notifications.map((notification) => (
                <TouchableOpacity
                  onPress={() => openItem(notification)}
                  style={{
                    backgroundColor: notification.isRead ? "#fff" : "#F7FFFE",
                    flexDirection: "row",
                    padding: 16,
                    marginHorizontal: 1,
                    borderRadius: 16,
                    borderWidth: notification.isRead ? 0 : 1,
                    borderColor: "#D2ECEB",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 1,
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                  key={notification.id}
                >
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "#EAF6F5",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <MaterialIcons name="notifications-none" size={24} color="#278687" />
                  </View>

                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#253038" }} numberOfLines={1}>
                      {notification.title || t("notif_notification", "Notification")}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#5E5E5E",
                        lineHeight: 20,
                      }}
                      numberOfLines={2}
                    >
                      {notification.message}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#5E5E5E",
                        marginTop: 2,
                      }}
                    >
                      {timeAgo(notification.createdAt, t)}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => confirmDelete(notification)}>
                    {!notification.isRead ? (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#1E8A8D",
                          position: "absolute",
                          right: 1,
                          top: -2,
                          zIndex: 1,
                        }}
                      />
                    ) : null}
                    <MaterialIcons name="more-vert" size={20} color="#8C8C8C" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              {!notifications.length ? (
                <Text style={{ textAlign: "center", color: "#6B7280", marginTop: 20 }}>{t("notif_no_notifications", "No notifications")}</Text>
              ) : null}
            </View>
          </ScrollView>
        )}
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              width: "80%",
              backgroundColor: "white",
              borderRadius: 20,
              padding: 20,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text
              style={{
                marginBottom: 15,
                textAlign: "center",
                fontSize: 18,
                fontWeight: "600",
              }}
            >{ui.deleteNotificationTitle}</Text>
            <Text
              style={{
                marginBottom: 20,
                textAlign: "center",
                color: "#666",
              }}
            >
              {ui.deleteNotificationText}
            </Text>
            <View style={{ flexDirection: "row", gap: 15 }}>
              <Pressable
                style={{
                  borderRadius: 10,
                  padding: 10,
                  elevation: 2,
                  backgroundColor: "#F0F0F0",
                  minWidth: 100,
                  alignItems: "center",
                }}
                onPress={() => setModalVisible(false)}
              >
                <Text
                  style={{
                    color: "black",
                    fontWeight: "600",
                  }}
                >
                  {t("cancel", "Cancel")}
                </Text>
              </Pressable>
              <Pressable
                style={{
                  borderRadius: 10,
                  padding: 10,
                  elevation: 2,
                  backgroundColor: "#278687",
                  minWidth: 100,
                  alignItems: "center",
                }}
                onPress={handleDelete}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  {t("confirm", "Confirm")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Notifications;

