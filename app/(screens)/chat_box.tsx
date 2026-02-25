import { useTranslation } from "@/hooks/use-translation";
import { useGetCategoriesByVendorQuery } from "@/store/api/categoryApiSlice";
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useMarkAsReadMutation,
  useSendMessageMutation,
} from "@/store/api/chatApiSlice";
import {
  useAssignCouponMutation,
  useGetCouponsByVendorQuery,
} from "@/store/api/couponApiSlice";
import { useGetOrdersQuery } from "@/store/api/orderApiSlice";
import { RootState } from "@/store/store";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useSelector } from "react-redux";

interface CouponData {
  id: string;
  code: string;
  type: string;
  discount: string;
  color: string;
  desc: string;
}

interface CustomChatMessage {
  id: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  type: "text" | "image" | "file" | "coupon";
  couponDetails?: CouponData;
}

const normalizeId = (value: any): string => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  return "";
};

const resolveEntityId = (entity: any): string => {
  if (entity === undefined || entity === null) return "";
  if (typeof entity === "string" || typeof entity === "number")
    return String(entity);
  if (typeof entity !== "object") return "";
  return normalizeId(
    entity?.userId ??
      entity?._id ??
      entity?.id ??
      entity?.user?.userId ??
      entity?.user?._id ??
      entity?.user?.id,
  );
};

// Removed hardcoded coupons - now fetched from API

// --- HELPER COMPONENTS ---

const AttachmentBtn = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.attachBtn} onPress={onPress}>
    <View style={styles.attachIconCircle}>
      <MaterialIcons name={icon} size={24} color="#2A8383" />
    </View>
    <Text style={styles.attachLabel}>{label}</Text>
  </TouchableOpacity>
);

const ChatCouponCard = ({
  coupon,
  isOwn,
  labels,
  onCopyCode,
}: {
  coupon: any;
  isOwn: boolean;
  labels: {
    code: string;
    limitedTime: string;
    minSpend: string;
    offer: string;
    defaultDiscount: string;
  };
  onCopyCode: (code?: string) => void;
}) => {
  if (!coupon) return null;
  return (
    <View
      style={[
        styles.chatCouponContainer,
        isOwn ? styles.chatCouponOwn : styles.chatCouponOther,
      ]}
    >
      <View
        style={[
          styles.chatCouponSide,
          { backgroundColor: coupon.color || "#FF9100" },
        ]}
      >
        <Text style={styles.chatCouponVerticalText}>
          {coupon.type || labels.offer}
        </Text>
        <View style={styles.chatCouponDotContainer}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={styles.chatCouponDot} />
          ))}
        </View>
      </View>
      <View style={styles.chatCouponBody}>
        <View style={styles.chatCouponTop}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              flexShrink: 1,
            }}
          >
            <Text style={styles.chatCouponCode}>
              {labels.code}:{coupon.code}
            </Text>
            <TouchableOpacity
              onPress={() => onCopyCode(coupon?.code)}
              style={{ padding: 2 }}
            >
              <MaterialIcons name="content-copy" size={18} color="#374151" />
            </TouchableOpacity>
          </View>
          <Text style={styles.chatCouponDiscount}>
            {coupon.discount || labels.defaultDiscount}
          </Text>
        </View>
        <Text style={styles.chatCouponDesc} numberOfLines={2}>
          {coupon.desc || coupon.description}
        </Text>
        <View style={styles.chatCouponFooter}>
          <View style={styles.chatCouponInfo}>
            <Ionicons name="time-outline" size={12} color="#666" />
            <Text style={styles.chatCouponInfoText}>{labels.limitedTime}</Text>
          </View>
          <View style={styles.chatCouponInfo}>
            <Ionicons name="bag-handle-outline" size={12} color="#666" />
            <Text style={styles.chatCouponInfoText}>{labels.minSpend}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const CouponModal = ({ visible, onClose, onSelect, coupons, labels }: any) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{labels.selectCoupon}</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ padding: 15 }}>
          {coupons && coupons.length > 0 ? (
            coupons.map((coupon: CouponData) => (
              <TouchableOpacity
                key={coupon.id}
                style={[styles.couponItem, { borderColor: coupon.color }]}
                onPress={() => {
                  onSelect(coupon);
                  onClose();
                }}
              >
                <View
                  style={[styles.couponSide, { backgroundColor: coupon.color }]}
                >
                  <Text style={styles.couponTypeText}>{coupon.type}</Text>
                  <View style={styles.chatCouponDotContainer}>
                    {[...Array(4)].map((_, i) => (
                      <View key={i} style={styles.chatCouponDot} />
                    ))}
                  </View>
                </View>
                <View style={styles.couponBody}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.couponCode}>
                      {labels.code}: {coupon.code}
                    </Text>
                    <Text style={styles.couponDiscountMain}>
                      {coupon.discount}
                    </Text>
                  </View>
                  <Text style={styles.couponDesc}>{coupon.desc}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ color: "#666", fontSize: 16 }}>
                {labels.noActiveCoupons}
              </Text>
              <Text style={{ color: "#999", fontSize: 14, marginTop: 8 }}>
                {labels.createCouponsHint}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const ChatBox: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useSelector((state: RootState) => state.auth.user);
  const currentUserId = resolveEntityId(user);
  const router = useRouter();
  const {
    conversationId,
    name,
    fullname,
    partnerId: partnerIdParam,
    role: roleParam,
  } = useLocalSearchParams();
  const paramConversationId = (conversationId as string) || "";
  const paramPartnerId = (partnerIdParam as string) || "";

  // Resolve partner ID first; don't use conversation ID as receiver ID.
  const [activePartnerId, setActivePartnerId] = useState(paramPartnerId);

  const { data: conversationsData } = useGetConversationsQuery(currentUserId, {
    skip: !currentUserId,
    refetchOnMountOrArgChange: true,
  });

  // If we only have a conversationId, try to find the partner ID from conversations
  React.useEffect(() => {
    if (paramConversationId && !paramPartnerId && conversationsData) {
      const conv = conversationsData.find(
        (c: any) => (c._id || c.id) === paramConversationId,
      );
      const p =
        conv?.participant ||
        conv?.participants?.find(
          (p: any) => (p.userId || p._id || p.id) !== currentUserId,
        );
      const pId = p?.userId || p?._id || p?.id;
      if (pId && pId !== activePartnerId) {
        console.log("ChatBox - Resolved partner ID from conversation:", pId);
        setActivePartnerId(pId);
      }
    }
  }, [
    paramConversationId,
    paramPartnerId,
    conversationsData,
    currentUserId,
    activePartnerId,
  ]);

  const partnerData = useMemo(() => {
    const fromParams = {
      name: (fullname || name) as string,
      id: activePartnerId || paramPartnerId,
      avatar: "https://via.placeholder.com/44",
    };

    if (conversationsData) {
      const conv = conversationsData.find((c: any) => {
        const p =
          c.participant ||
          c.participants?.find(
            (p: any) => (p._id || p.id || p.userId) === activePartnerId,
          );
        return p || (c._id || c.id) === paramConversationId;
      });
      const p =
        conv?.participant ||
        conv?.participants?.find(
          (p: any) => (p._id || p.id || p.userId) !== currentUserId,
        );
      if (p) {
        return {
          name:
            p.storename ||
            p.name ||
            p.fullName ||
            p.fulllName ||
            fromParams.name,
          id: p.userId || p._id || p.id,
          avatar: p.avatar || p.logoUrl || fromParams.avatar,
        };
      }
    }
    return fromParams;
  }, [
    conversationsData,
    activePartnerId,
    paramPartnerId,
    fullname,
    name,
    paramConversationId,
    currentUserId,
  ]);

  const displayName = partnerData.name || t("chat_partner_fallback", "Partner");
  const partnerAvatar = partnerData.avatar;

  const [messageText, setMessageText] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "chat" | "categories" | "order_history"
  >("chat");
  const [storedRole, setStoredRole] = useState<string | null>(null);
  const [assignCoupon] = useAssignCouponMutation();
  const [markAsRead] = useMarkAsReadMutation();
  const flatListRef = useRef<FlatList>(null);

  // Load role from AsyncStorage on mount
  React.useEffect(() => {
    const loadRole = async () => {
      try {
        const role = await AsyncStorage.getItem("userRole");
        if (role) {
          setStoredRole(role);
        }
      } catch (error) {
        console.error("Error loading role from storage:", error);
      }
    };
    loadRole();
  }, []);

  // 1. Detect role from global state & storage (strictly vendor/buyer only)
  const normalizedRoleParam = String(roleParam || "").toLowerCase();
  const normalizedUserType = String(user?.userType || "").toLowerCase();
  const normalizedStoredRole = String(storedRole || "").toLowerCase();
  // Priority: current authenticated user role > stored fallback role
  const role: "vendor" | "buyer" =
    normalizedRoleParam === "vendor" || normalizedRoleParam === "buyer"
      ? (normalizedRoleParam as "vendor" | "buyer")
      : normalizedUserType === "vendor" || normalizedUserType === "buyer"
        ? (normalizedUserType as "vendor" | "buyer")
        : normalizedStoredRole === "vendor"
          ? "vendor"
          : "buyer";
  const isVendorSide = role === "vendor";
  const couponPrefix = t("chat_coupon_message_prefix", "Sent a coupon");
  const legacyCouponPrefix = "Sent a coupon";

  // 2. Define Tab Configuration dynamically - SWAPPED as per user request
  const tabs = isVendorSide
    ? [
        {
          key: "chat" as const,
          label: t("chat_tab_chat", "Chat"),
          action: () => setActiveTab("chat"),
        },
        {
          key: "order_history" as const,
          label: t("chat_tab_order_history", "Order History"),
          action: () => setActiveTab("order_history"),
        },
      ]
    : [
        {
          key: "chat" as const,
          label: t("chat_tab_chat", "Chat"),
          action: () => setActiveTab("chat"),
        },
        {
          key: "categories" as const,
          label: t("chat_tab_categories", "Categories"),
          action: () => router.push("/(users)/categoriesScreen"),
        },
        {
          key: "order_history" as const,
          label: t("chat_tab_order_history", "Order History"),
          action: () => router.push("/(user_screen)/OrderHistoryScreen"),
        },
      ];

  // API Queries
  const { data: messagesData, isLoading: messagesLoading } =
    useGetMessagesQuery(activePartnerId, {
      skip: !activePartnerId,
    });
  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetCategoriesByVendorQuery(activePartnerId, {
      skip: isVendorSide || !activePartnerId || activeTab !== "categories",
    });
  const { data: ordersData, isLoading: ordersLoading } = useGetOrdersQuery(
    undefined,
    {
      skip: activeTab !== "order_history",
    },
  );

  const [sendMessage] = useSendMessageMutation();

  // Fetch vendor's coupons for the coupon modal - Use the VENDOR'S ID, not the partner ID!
  const currentVendorId = user?.userId || user?.id || "";
  const { data: vendorCouponsData } = useGetCouponsByVendorQuery(
    currentVendorId,
    {
      skip: !isVendorSide || !currentVendorId,
    },
  );

  // Map API coupons to component format
  const availableCoupons = React.useMemo(() => {
    if (!vendorCouponsData || !Array.isArray(vendorCouponsData)) {
      console.log(
        "ChatBox - vendorCouponsData is not an array:",
        vendorCouponsData,
      );
      return [];
    }
    return vendorCouponsData
      .filter((coupon) => coupon.isActive)
      .map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        type: coupon.discountType === "percentage" ? "DISCOUNT" : "CASHBACK",
        discount: `${coupon.discountValue}${coupon.discountType === "percentage" ? "%" : "$"}`,
        color: coupon.discountType === "percentage" ? "#FF9100" : "#FF4D67",
        desc: `${coupon.discountType === "percentage" ? "DISCOUNT" : "CASHBACK"} on Orders Over $${coupon.minPurchaseAmount || 0}`,
      }));
  }, [vendorCouponsData]);

  const chatMessages = useMemo(() => {
    if (!Array.isArray(messagesData)) {
      return [];
    }
    const myId = normalizeId(currentUserId);
    const partnerId = normalizeId(activePartnerId);
    return messagesData.map((msg: any) => ({
      id: msg._id || msg.id,
      text: msg.messageText || msg.text || "",
      timestamp: msg.createdAt,
      isOwn: (() => {
        const senderId = normalizeId(
          resolveEntityId(msg?.senderId) || resolveEntityId(msg?.sender),
        );
        const receiverId = normalizeId(
          resolveEntityId(msg?.receiverId) || resolveEntityId(msg?.receiver),
        );

        // Strong signal for 1:1 chat: if message receiver is partner, it's mine.
        if (partnerId && receiverId && receiverId === partnerId) return true;
        if (partnerId && senderId && senderId === partnerId) return false;

        // Fallback to current user id match.
        return !!myId && senderId === myId;
      })(),
      type: msg.type || "text",
      couponDetails: msg.couponDetails,
    }));
  }, [messagesData, currentUserId, activePartnerId]);

  React.useEffect(() => {
    if (!Array.isArray(messagesData) || !currentUserId) return;

    const unreadIncoming = messagesData.filter((msg: any) => {
      const receiverId = resolveEntityId(msg?.receiverId);
      const senderId = resolveEntityId(msg?.senderId);
      return (
        normalizeId(receiverId) === normalizeId(currentUserId) &&
        normalizeId(senderId) === normalizeId(activePartnerId) &&
        !msg?.isRead
      );
    });

    if (!unreadIncoming.length) return;

    unreadIncoming.forEach((msg: any) => {
      const messageId = msg?.id || msg?._id;
      if (messageId) {
        markAsRead(String(messageId));
      }
    });
  }, [messagesData, currentUserId, activePartnerId, markAsRead]);

  const filteredOrders = useMemo(() => {
    return (ordersData || []).filter((order: any) => {
      const vendorId =
        order.vendorId?.userId ||
        order.vendor?.userId ||
        order.vendorId?._id ||
        order.vendorId?.id ||
        order.vendor?._id ||
        order.vendor?.id ||
        order.vendorId;
      const buyerId =
        order.buyer?.userId ||
        order.user?.userId ||
        order.user?._id ||
        order.userId?._id ||
        order.userId?.id ||
        order.userId;
      return vendorId === activePartnerId || buyerId === activePartnerId;
    });
  }, [ordersData, activePartnerId]);

  const handleSendMessage = async (
    text: string,
    type: string = "text",
    coupon?: CouponData,
  ) => {
    if (!text.trim() && type === "text") return;
    if (!activePartnerId) return;
    if (type === "coupon" && !isVendorSide) {
      return;
    }
    try {
      // If sending a coupon, assign it to the buyer first
      if (type === "coupon" && coupon) {
        // Try to find the actual buyer profile ID from messages if possible
        const buyerProfileId = messagesData?.find(
          (m: any) => m.buyerId,
        )?.buyerId;
        const targetBuyerId = buyerProfileId || activePartnerId;

        console.log("ChatBox.handleSendMessage - Triggered with type:", type);
        console.log("ChatBox.handleSendMessage - Coupon:", coupon?.id);
        console.log(
          "ChatBox.handleSendMessage - Target Buyer ID:",
          targetBuyerId,
        );

        // Validation: Ensure we don't send conversationId as buyerId
        if (targetBuyerId === paramConversationId) {
          console.error(
            "ChatBox.handleSendMessage - ERROR: Target Buyer ID is same as Conversation ID! Aborting assignment.",
          );
          alert(
            t(
              "chat_coupon_assign_error",
              "Error: Cannot assign coupon. Buyer ID not resolved.",
            ),
          );
          return;
        }

        console.log(
          "ChatBox - Assigning coupon:",
          coupon.id,
          "to buyer:",
          targetBuyerId,
          buyerProfileId ? "(Resolved Profile ID)" : "(Using Partner User ID)",
        );
        try {
          await assignCoupon({
            id: coupon.id,
            buyerId: targetBuyerId,
          }).unwrap();
        } catch (assignErr: any) {
          console.error("Failed to assign coupon:", assignErr);
          // If 403, it might mean the buyer isn't connected. We can still try to send the message but the coupon won't be usable.
          if (assignErr?.status === 403) {
            console.warn(
              "Assignment forbidden - likely buyer not connected to vendor",
            );
          }
        }
      }

      const msgText =
        type === "coupon"
          ? `${couponPrefix}: ${coupon?.code} - ${coupon?.desc}`
          : text;

      await sendMessage({
        receiverId: activePartnerId,
        messageText: msgText,
      }).unwrap();

      setMessageText("");
      setShowOptions(false);
    } catch (error) {
      console.error("Failed to send", error);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleCopyCouponCode = async (code?: string) => {
    if (!code) return;
    try {
      await Clipboard.setStringAsync(String(code));
      Alert.alert("Copied", "Coupon code copied");
    } catch {
      Alert.alert("Copy failed", "Could not copy coupon code");
    }
  };

  const renderMessage = ({ item: msg }: { item: CustomChatMessage }) => {
    const isCoupon =
      msg.type === "coupon" ||
      msg.text?.startsWith(`${couponPrefix}:`) ||
      msg.text?.startsWith(`${legacyCouponPrefix}:`);

    return (
      <View style={[styles.messageRow, msg.isOwn ? styles.rowReverse : {}]}>
        {!msg.isOwn && (
          <Image source={{ uri: partnerAvatar }} style={styles.msgAvatar} />
        )}
        <View
          style={[
            styles.bubbleWrapper,
            msg.isOwn ? styles.alignEnd : styles.alignStart,
          ]}
        >
          {isCoupon ? (
            <ChatCouponCard
              coupon={msg.couponDetails || parseCouponFromText(msg.text)}
              isOwn={msg.isOwn}
              onCopyCode={handleCopyCouponCode}
              labels={{
                code: t("chat_coupon_code", "Code"),
                limitedTime: t("chat_coupon_limited_time", "Limited Time"),
                minSpend: t("chat_coupon_min_spend", "Min. Spend"),
                offer: t("chat_coupon_offer", "OFFER"),
                defaultDiscount: t("chat_coupon_default_discount", "10%"),
              }}
            />
          ) : (
            <View
              style={[
                styles.bubble,
                msg.isOwn ? styles.myBubble : styles.otherBubble,
              ]}
            >
              <Text
                style={[
                  styles.msgText,
                  msg.isOwn ? styles.myMsgText : styles.otherMsgText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          )}
          <Text style={styles.timeText}>{formatTime(msg.timestamp)}</Text>
        </View>
      </View>
    );
  };

  // Helper to parse coupon info from text fallback
  const parseCouponFromText = (text: string) => {
    const activePrefix = `${couponPrefix}:`;
    const legacyPrefixWithColon = `${legacyCouponPrefix}:`;
    if (
      !text ||
      (!text.includes(activePrefix) && !text.includes(legacyPrefixWithColon))
    )
      return null;
    try {
      // Format: "<prefix>: CODE - DESC"
      const normalized = text.startsWith(legacyPrefixWithColon)
        ? text.replace(legacyPrefixWithColon, activePrefix)
        : text;
      const parts = normalized.split(":");
      if (parts.length < 2) return null;
      const details = parts[1].split("-");
      return {
        code: details[0]?.trim() || t("chat_coupon_fallback_code", "COUPON"),
        desc:
          details[1]?.trim() || t("chat_coupon_fallback_desc", "Special Offer"),
        type: details[1]?.includes("CASHBACK")
          ? t("chat_coupon_cashback", "CASHBACK")
          : t("chat_coupon_discount", "DISCOUNT"),
        color: details[1]?.includes("CASHBACK") ? "#FF4D67" : "#FF9100",
        discount:
          details[1]?.match(/\d+[%$]/)?.[0] ||
          t("chat_coupon_default_discount", "10%"),
      };
    } catch {
      return null;
    }
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios-new" size={20} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerPartnerContainer}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: partnerAvatar }}
              style={styles.headerAvatar}
            />
            <View
              style={[styles.onlineDotOverlay, { backgroundColor: "#4CAF50" }]}
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName}>{displayName}</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {isVendorSide && (
                <Text style={styles.headerId}>
                  {t("chat_id_fallback", "ID")}: #
                  {(activePartnerId || "").slice(-6).toUpperCase()} -{" "}
                </Text>
              )}
              <Text style={styles.headerStatus}>
                {t("chat_online", "Online")}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <MaterialIcons name="more-horiz" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };
  // 3. Map Dynamically
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={tab.action}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "categories":
        return (
          <View style={{ flex: 1, padding: 16 }}>
            {categoriesLoading ? (
              <ActivityIndicator color="#2A8383" />
            ) : (
              <FlatList
                data={Array.isArray(categoriesData) ? categoriesData : []}
                numColumns={2}
                keyExtractor={(item) => item._id || item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.categoryCard}>
                    <Image
                      source={{
                        uri: item.catImage || "https://via.placeholder.com/80",
                      }}
                      style={styles.categoryImg}
                    />
                    <Text style={styles.categoryLabel}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    {t("chat_no_categories_found", "No categories found")}
                  </Text>
                }
              />
            )}
          </View>
        );
      case "order_history":
        return (
          <View style={{ flex: 1, padding: 16 }}>
            {ordersLoading ? (
              <ActivityIndicator color="#2A8383" />
            ) : (
              <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item._id || item.id}
                renderItem={({ item }) => (
                  <View style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderNo}>
                        {t("chat_order_label", "Order")} #
                        {(item._id || item.id)?.slice(-6)?.toUpperCase() ||
                          t("chat_id_fallback", "ID")}
                      </Text>
                      <Text
                        style={[
                          styles.orderStatus,
                          {
                            color:
                              item.status === "DELIVERED"
                                ? "#4CAF50"
                                : "#FF9800",
                          },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                    <Text style={styles.orderDate}>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : t("chat_date_na", "Date N/A")}
                    </Text>
                    <Text style={styles.orderTotal}>
                      {t("chat_total_label", "Total")}: $
                      {item.totalAmount || "0.00"}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    {t(
                      "chat_no_orders_between_you",
                      "No orders found between you",
                    )}
                  </Text>
                }
              />
            )}
          </View>
        );
      default:
        return messagesLoading ? (
          <ActivityIndicator color="#2A8383" />
        ) : (
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatList}
            renderItem={renderMessage}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {renderHeader()}
      {renderTabs()}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <View style={{ flex: 1 }}>
          {renderContent()}

          {activeTab === "chat" && (
            <>
              {showOptions && (
                <View style={styles.attachmentMenu}>
                  <View style={styles.attachmentRow}>
                    <AttachmentBtn
                      icon="image"
                      label={t("chat_attachment_photo", "Photo")}
                      onPress={() => {}}
                    />
                    <AttachmentBtn
                      icon="camera-alt"
                      label={t("chat_attachment_camera", "camera")}
                      onPress={() => {}}
                    />
                    <AttachmentBtn
                      icon="location-on"
                      label={t("chat_attachment_location", "Location")}
                      onPress={() => {}}
                    />
                    {isVendorSide && (
                      <AttachmentBtn
                        icon="confirmation-number"
                        label={t("chat_attachment_coupon", "Coupon")}
                        onPress={() => setShowCouponModal(true)}
                      />
                    )}
                  </View>
                </View>
              )}

              <View
                style={[
                  styles.inputArea,
                  { paddingBottom: Math.max(insets.bottom, 8) },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setShowOptions(!showOptions)}
                  style={styles.plusBtn}
                >
                  <Feather
                    name={showOptions ? "x" : "plus"}
                    size={28}
                    color="#2A8383"
                  />
                </TouchableOpacity>
                <TextInput
                  placeholder={t("chat_type_message", "Type a message...")}
                  style={styles.textInput}
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  onPress={() => handleSendMessage(messageText)}
                >
                  <View
                    style={[
                      styles.sendBtn,
                      !messageText.trim() && { backgroundColor: "#DDD" },
                    ]}
                  >
                    <Ionicons name="send" size={18} color="white" />
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <CouponModal
        visible={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        onSelect={(c: CouponData) => handleSendMessage("", "coupon", c)}
        coupons={availableCoupons}
        labels={{
          selectCoupon: t("chat_select_coupon", "Select Coupon"),
          code: t("chat_coupon_code", "Code"),
          noActiveCoupons: t("chat_no_active_coupons", "No active coupons"),
          createCouponsHint: t(
            "chat_create_coupons_hint",
            "Create coupons to send to buyers",
          ),
        }}
      />
    </SafeAreaView>
  );
};

// Helpers moved to top

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    backgroundColor: "#fff",
  },
  backBtn: { padding: 4 },
  headerPartnerContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  avatarContainer: { position: "relative" },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E1E4E8",
  },
  onlineDotOverlay: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#4CAF50",
  },
  headerTextContainer: { marginLeft: 12 },
  headerName: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  headerStatus: { fontSize: 12, color: "#9CA3AF" },
  headerId: { fontSize: 12, color: "#9CA3AF" },
  moreBtn: { padding: 4 },

  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: "#F9FAFB",
  },
  tab: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#BFDCDD",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  activeTab: { backgroundColor: "#2A8383", borderColor: "#2A8383" },
  tabText: { fontSize: 17, color: "#2F3437", fontWeight: "500" },
  activeTabText: { color: "#FFF" },

  chatList: { padding: 16, flexGrow: 1, backgroundColor: "#F9FAFB" },
  messageRow: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  rowReverse: { flexDirection: "row-reverse" },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E1E4E8",
    marginHorizontal: 8,
  },
  bubbleWrapper: { maxWidth: "75%" },
  alignEnd: { alignItems: "flex-end" },
  alignStart: { alignItems: "flex-start" },
  bubble: {
    padding: 12,
    borderRadius: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  myBubble: { backgroundColor: "#2A8383", borderBottomRightRadius: 2 },
  otherBubble: { backgroundColor: "#fff", borderBottomLeftRadius: 2 },
  msgText: { fontSize: 14, lineHeight: 20 },
  myMsgText: { color: "#FFF" },
  otherMsgText: { color: "#374151" },
  timeText: { fontSize: 10, color: "#9CA3AF", marginTop: 4 },

  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#fff",
  },
  plusBtn: { padding: 8 },
  textInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 120,
    marginHorizontal: 8,
    color: "#1F2937",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A8383",
    justifyContent: "center",
    alignItems: "center",
  },

  attachmentMenu: {
    paddingVertical: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  attachmentRow: { flexDirection: "row", justifyContent: "space-around" },
  attachBtn: { alignItems: "center" },
  attachIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3FDFB",
    justifyContent: "center",
    alignItems: "center",
  },
  attachLabel: { fontSize: 12, color: "#4B5563", marginTop: 8 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "65%",
  },
  modalHeader: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  couponItem: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    overflow: "hidden",
    minHeight: 80,
  },
  couponSide: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  couponTypeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    transform: [{ rotate: "-90deg" }],
    width: 60,
    textAlign: "center",
  },
  couponBody: { flex: 1, padding: 12, justifyContent: "center" },
  couponCode: { fontSize: 14, fontWeight: "bold", color: "#1F2937" },
  couponDesc: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  couponDiscountMain: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  couponDiscount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2A8383",
    marginTop: 4,
  },
  categoryCard: {
    width: 140,
    margin: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryImg: { width: "100%", height: 90, borderRadius: 8, marginBottom: 8 },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2A8383",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderNo: { fontSize: 15, fontWeight: "700", color: "#111827" },
  orderStatus: { fontSize: 12, fontWeight: "700" },
  orderDate: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  orderTotal: { fontSize: 15, fontWeight: "700", color: "#2A8383" },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#9CA3AF",
    fontSize: 15,
  },

  // Chat Coupon Card Styles
  chatCouponContainer: {
    flexDirection: "row",
    width: 260,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  chatCouponOwn: { borderBottomRightRadius: 2 },
  chatCouponOther: { borderBottomLeftRadius: 2 },
  chatCouponSide: {
    width: 36,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  chatCouponVerticalText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 10,
    width: 80,
    textAlign: "center",
    transform: [{ rotate: "-90deg" }],
  },
  chatCouponDotContainer: {
    position: "absolute",
    left: -4,
    height: "100%",
    justifyContent: "space-around",
  },
  chatCouponDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F9FAFB",
  },
  chatCouponBody: {
    flex: 1,
    padding: 10,
  },
  chatCouponTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatCouponCode: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#111827",
  },
  chatCouponDiscount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  chatCouponDesc: {
    fontSize: 11,
    color: "#4B5563",
    marginTop: 4,
  },
  chatCouponFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  chatCouponInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatCouponInfoText: {
    fontSize: 9,
    color: "#9CA3AF",
    marginLeft: 4,
  },
});

export default ChatBox;
