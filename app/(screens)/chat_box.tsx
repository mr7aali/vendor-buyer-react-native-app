import { useTranslation } from "@/hooks/use-translation";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { useSocket } from "@/context/SocketContext";
import socketService from "@/services/socket";
import { useGetCategoriesByVendorQuery } from "@/store/api/categoryApiSlice";
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useGetPinnedMessageQuery,
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
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Alert,
  Easing,
  FlatList,
  Image,
  Keyboard,
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
  type:
    | "TEXT"
    | "ORDER_PLACED"
    | "ORDER_UPDATED"
    | "text"
    | "image"
    | "file"
    | "coupon";
  couponDetails?: CouponData;
  conversationId?: string;
  orderId?: string | null;
  metadata?: any;
}

interface OrderItemSummary {
  productName?: string;
  quantity?: number;
  price?: number;
}

interface OrderMessageMetadata {
  orderId?: string;
  orderNumber?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  items?: OrderItemSummary[];
  totalAmount?: number;
  status?: string;
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

const resolveChatUserId = (entity: any): string =>
  normalizeId(
    entity?.userId ??
      entity?.buyer?.userId ??
      entity?.vendor?.userId ??
      entity?.user?.userId ??
      entity?.id ??
      entity?._id ??
      entity,
  );
const resolveVendorProfileId = (entity: any): string =>
  normalizeId(
    entity?.vendor?.id ??
      entity?.vendor?._id ??
      entity?.id ??
      entity?._id ??
      '',
  );

const resolveBuyerProfileId = (entity: any): string =>
  normalizeId(
    entity?.buyer?.id ??
      entity?.buyer?._id ??
      entity?.buyerId?.id ??
      entity?.buyerId?._id ??
      '',
  );

const normalizeMessageType = (value: any): CustomChatMessage["type"] => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "TEXT") return "TEXT";
  if (normalized === "ORDER_PLACED") return "ORDER_PLACED";
  if (normalized === "ORDER_UPDATED") return "ORDER_UPDATED";
  return (value as CustomChatMessage["type"]) || "text";
};

const normalizeOrderStatus = (value: any) => String(value || "").trim().toLowerCase();

const isOrderMessageType = (type: CustomChatMessage["type"]) =>
  type === "ORDER_PLACED" || type === "ORDER_UPDATED";

const isPinEligibleOrderStatus = (status: any) => {
  const normalized = normalizeOrderStatus(status);
  return normalized !== "completed" && normalized !== "cancelled" && normalized !== "delivered";
};

const formatCurrency = (value: any) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return `$${amount.toFixed(2)}`;
};

const resolveOrderId = (message: any) =>
  normalizeId(message?.orderId || message?.metadata?.orderId);

const resolveOrderNumber = (message: any) =>
  normalizeId(message?.metadata?.orderNumber);

const resolveMessageBody = (message: any) =>
  String(message?.messageText || message?.text || "").trim();

const hasTerminalOrderUpdate = (messages: CustomChatMessage[], target: any) => {
  const targetOrderId = resolveOrderId(target);
  const targetOrderNumber = resolveOrderNumber(target);
  const targetMessageId = normalizeId(target?.id || target?._id);
  const targetText = resolveMessageBody(target);

  if (!targetOrderId && !targetOrderNumber && !targetMessageId && !targetText) {
    return false;
  }

  return messages.some((message) => {
    if (message.type !== "ORDER_UPDATED") return false;
    const status = normalizeOrderStatus(message.metadata?.status);
    const sameOrder =
      (!!targetOrderId && resolveOrderId(message) === targetOrderId) ||
      (!!targetOrderNumber && resolveOrderNumber(message) === targetOrderNumber) ||
      (!!targetMessageId && normalizeId(message.id) === targetMessageId) ||
      (!!targetText && resolveMessageBody(message) === targetText);

    return sameOrder && (status === "delivered" || status === "cancelled");
  });
};

const areMessagesEquivalent = (left: any, right: any) => {
  if (!left || !right) return false;

  const leftId = normalizeId(left?.id || left?._id);
  const rightId = normalizeId(right?.id || right?._id);
  const leftOrderId = resolveOrderId(left);
  const rightOrderId = resolveOrderId(right);
  const leftOrderNumber = resolveOrderNumber(left);
  const rightOrderNumber = resolveOrderNumber(right);
  const leftText = resolveMessageBody(left);
  const rightText = resolveMessageBody(right);

  return (
    (!!leftId && !!rightId && leftId === rightId) ||
    (!!leftOrderId && !!rightOrderId && leftOrderId === rightOrderId) ||
    (!!leftOrderNumber && !!rightOrderNumber && leftOrderNumber === rightOrderNumber) ||
    (!!leftText && !!rightText && leftText === rightText)
  );
};

const resolvePinnedBannerLines = (message: CustomChatMessage) => {
  const metadata = (message.metadata || {}) as OrderMessageMetadata;
  const type = normalizeMessageType(message.type);

  if (type === "ORDER_PLACED") {
    const title = metadata.orderNumber
      ? `Pinned order ${metadata.orderNumber}`
      : "Pinned order";
    const subtitleParts = [
      metadata.productName,
      metadata.quantity ? `Qty ${metadata.quantity}` : "",
      formatCurrency(metadata.totalAmount),
    ].filter(Boolean);

    return {
      title,
      subtitle: subtitleParts.join(" • ") || message.text || "Order placed",
    };
  }

  if (type === "ORDER_UPDATED") {
    const title = metadata.orderNumber
      ? `Pinned update ${metadata.orderNumber}`
      : "Pinned update";
    const status = String(metadata.status || "").trim().toLowerCase();

    return {
      title,
      subtitle: status
        ? `Status ${status}`
        : message.text || "Order status updated",
    };
  }

  return {
    title: "Pinned message",
    subtitle: message.text || "Pinned message",
  };
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

const ChatThreadSkeleton = () => (
  <View style={styles.chatList}>
    {Array.from({ length: 6 }).map((_, index) => {
      const isOwn = index % 2 === 1;
      return (
        <View
          key={`chat-thread-skeleton-${index}`}
          style={[styles.messageRow, isOwn ? styles.rowReverse : {}]}
        >
          {!isOwn && <SkeletonBlock style={styles.skeletonMsgAvatar} />}
          <View style={[styles.bubbleWrapper, isOwn ? styles.alignEnd : styles.alignStart]}>
            <SkeletonBlock
              style={[
                styles.skeletonBubble,
                isOwn ? styles.skeletonBubbleOwn : styles.skeletonBubbleOther,
                index % 3 === 0 && styles.skeletonBubbleShort,
              ]}
            />
            <SkeletonBlock
              style={[
                styles.skeletonTimestamp,
                isOwn ? styles.skeletonTimestampOwn : styles.skeletonTimestampOther,
              ]}
            />
          </View>
        </View>
      );
    })}
  </View>
);

const CategoryGridSkeleton = () => (
  <ScrollView contentContainerStyle={styles.skeletonPanelContent} showsVerticalScrollIndicator={false}>
    <View style={styles.skeletonCategoryGrid}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={`category-skeleton-${index}`} style={styles.categoryCard}>
          <SkeletonBlock style={styles.skeletonCategoryImage} />
          <SkeletonBlock style={styles.skeletonCategoryLabel} />
        </View>
      ))}
    </View>
  </ScrollView>
);

const OrderHistorySkeleton = () => (
  <ScrollView contentContainerStyle={styles.skeletonPanelContent} showsVerticalScrollIndicator={false}>
    {Array.from({ length: 4 }).map((_, index) => (
      <View key={`order-skeleton-${index}`} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <SkeletonBlock style={styles.skeletonOrderNo} />
          <SkeletonBlock style={styles.skeletonOrderStatus} />
        </View>
        <SkeletonBlock style={styles.skeletonOrderDate} />
        <SkeletonBlock style={styles.skeletonOrderTotal} />
      </View>
    ))}
  </ScrollView>
);

const ChatBox: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const closedComposerInset = Math.max(insets.bottom, 12);
  const openComposerInset = Math.max(insets.bottom, 12);
  const composerBottomInset = isKeyboardVisible ? openComposerInset : closedComposerInset;
  const { socket } = useSocket();
  const user = useSelector((state: RootState) => state.auth.user);
  const currentUserId = resolveChatUserId(user);
  const router = useRouter();
  const {
    conversationId,
    name,
    fullname,
    partnerId: partnerIdParam,
    vendorId: vendorIdParam,
    role: roleParam,
  } = useLocalSearchParams();
  const paramConversationId = (conversationId as string) || "";
  const paramPartnerId = (partnerIdParam as string) || "";
  const explicitPartnerId = resolveChatUserId(paramPartnerId);
  const explicitVendorProfileId = normalizeId(vendorIdParam);

  // Resolve partner ID first; don't use conversation ID as receiver ID.
  const [activePartnerId, setActivePartnerId] = useState(
    explicitPartnerId,
  );

  const { data: conversationsData, isLoading: isConversationsLoading } =
    useGetConversationsQuery(currentUserId, {
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
      const pId = resolveChatUserId(p);
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
      id: resolveChatUserId(activePartnerId) || explicitPartnerId,
      vendorProfileId: explicitVendorProfileId,
      buyerProfileId: "",
      avatar: "https://via.placeholder.com/44",
    };

    if (conversationsData) {
      const conv = conversationsData.find((c: any) => {
        const conversationKey = normalizeId(c._id || c.id);
        const candidateIds = [
          resolveChatUserId(c.partner),
          resolveChatUserId(c.participant),
          ...(Array.isArray(c.participants)
            ? c.participants.map((p: any) => resolveChatUserId(p))
            : []),
        ].filter(Boolean);

        return (
          (paramConversationId && conversationKey === paramConversationId) ||
          (!!explicitPartnerId && candidateIds.includes(explicitPartnerId)) ||
          (!!activePartnerId && candidateIds.includes(activePartnerId))
        );
      });
      const p =
        conv?.partner ||
        conv?.participant ||
        conv?.participants?.find(
          (p: any) => resolveChatUserId(p) !== currentUserId,
        );
      if (p) {
        return {
          name:
            p.storename ||
            p.name ||
            p.fullName ||
            p.fulllName ||
            fromParams.name,
          id: resolveChatUserId(p),
          vendorProfileId:
            resolveVendorProfileId(p) || fromParams.vendorProfileId,
          buyerProfileId:
            resolveBuyerProfileId(p) || fromParams.buyerProfileId,
          avatar: p.avatar || p.logoUrl || fromParams.avatar,
        };
      }
    }
    return fromParams;
  }, [
    conversationsData,
    activePartnerId,
    explicitPartnerId,
    fullname,
    name,
    paramConversationId,
    currentUserId,
    explicitVendorProfileId,
  ]);

  const canonicalPartnerId = useMemo(() => {
    if (explicitPartnerId) {
      return explicitPartnerId;
    }

    const matchedConversation = Array.isArray(conversationsData)
      ? conversationsData.find((conversation: any) => {
          const conversationKey = normalizeId(conversation?._id || conversation?.id);
          const candidateIds = [
            resolveChatUserId(conversation?.partner),
            resolveChatUserId(conversation?.participant),
            ...(Array.isArray(conversation?.participants)
              ? conversation.participants.map((p: any) => resolveChatUserId(p))
              : []),
          ].filter(Boolean);

          return (
            (paramConversationId && conversationKey === paramConversationId) ||
            (!!activePartnerId && candidateIds.includes(activePartnerId))
          );
        })
      : null;

    return (
      resolveChatUserId(matchedConversation?.partner) ||
      resolveChatUserId(matchedConversation?.participant) ||
      resolveChatUserId(partnerData) ||
      resolveChatUserId(activePartnerId)
    );
  }, [
    conversationsData,
    paramConversationId,
    activePartnerId,
    partnerData,
    explicitPartnerId,
  ]);

  React.useEffect(() => {
    if (canonicalPartnerId && canonicalPartnerId !== activePartnerId) {
      setActivePartnerId(canonicalPartnerId);
    }
  }, [canonicalPartnerId, activePartnerId]);

  const baseConversationId = useMemo(() => {
    const matchedConversation = Array.isArray(conversationsData)
      ? conversationsData.find((conversation: any) => {
          const conversationKey = normalizeId(conversation?._id || conversation?.id);
          const candidateIds = [
            resolveChatUserId(conversation?.partner),
            resolveChatUserId(conversation?.participant),
            ...(Array.isArray(conversation?.participants)
              ? conversation.participants.map((p: any) => resolveChatUserId(p))
              : []),
          ].filter(Boolean);

          return (
            (!!activePartnerId && candidateIds.includes(activePartnerId)) ||
            (!!explicitPartnerId && candidateIds.includes(explicitPartnerId)) ||
            (!!conversationKey && conversationKey === paramConversationId)
          );
        })
      : null;

    const matchedConversationId = normalizeId(
      matchedConversation?.id || matchedConversation?._id,
    );

    if (paramConversationId) {
      if (!Array.isArray(conversationsData)) {
        return "";
      }

      if (!conversationsData.length) {
        return paramConversationId;
      }

      const paramMatchesConversation = conversationsData.some(
        (conversation: any) =>
          normalizeId(conversation?.id || conversation?._id) === paramConversationId,
      );

      return paramMatchesConversation ? paramConversationId : matchedConversationId;
    }

    return matchedConversationId;
  }, [
    paramConversationId,
    conversationsData,
    activePartnerId,
    explicitPartnerId,
  ]);

  const displayName = partnerData.name || t("chat_partner_fallback", "Partner");
  const partnerAvatar = partnerData.avatar;
  const shouldShowHeaderSkeleton =
    isConversationsLoading && !String(fullname || name || "").trim();
  const buyerVendorProfileId =
    normalizeId((partnerData as any)?.vendorProfileId) || explicitVendorProfileId;

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
  const autoPinnedMessageKeyRef = useRef("");
  const [highlightedMessageId, setHighlightedMessageId] = useState("");
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const [composerHeight, setComposerHeight] = useState(88);

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

  React.useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const animateComposer = (toValue: number, duration?: number) => {
      Animated.timing(keyboardOffset, {
        toValue,
        duration: duration ?? 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    };

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setIsKeyboardVisible(true);
      const keyboardHeight = Math.max(
        0,
        (event.endCoordinates?.height || 0) -
          (Platform.OS === "ios" ? openComposerInset : 0),
      );
      animateComposer(-keyboardHeight, event.duration);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, (event) => {
      setIsKeyboardVisible(false);
      animateComposer(0, event.duration);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardOffset, openComposerInset]);

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
          action: () =>
            router.push({
              pathname: "/(users)/categoriesScreen",
              params: {
                vendorId: buyerVendorProfileId,
                vendorName: displayName,
              },
            }),
        },
        {
          key: "order_history" as const,
          label: t("chat_tab_order_history", "Order History"),
          action: () => router.push("/(user_screen)/OrderHistoryScreen"),
        },
      ];

  // API Queries
  const { data: messagesData, isLoading: messagesLoading } =
    useGetMessagesQuery(canonicalPartnerId || activePartnerId, {
      skip: !(canonicalPartnerId || activePartnerId),
    });
  const effectiveConversationId = useMemo(() => {
    const messageConversationId = Array.isArray(messagesData)
      ? normalizeId(
          messagesData.find((message: any) => normalizeId(message?.conversationId))
            ?.conversationId,
        )
      : "";

    return messageConversationId || baseConversationId;
  }, [messagesData, baseConversationId]);

  const { data: initialPinnedMessage } = useGetPinnedMessageQuery(effectiveConversationId, {
    skip: !effectiveConversationId,
    refetchOnMountOrArgChange: true,
  });
  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetCategoriesByVendorQuery(canonicalPartnerId || activePartnerId, {
      skip: isVendorSide || !(canonicalPartnerId || activePartnerId) || activeTab !== "categories",
    });
  const { data: ordersData, isLoading: ordersLoading } = useGetOrdersQuery(
    undefined,
    {
      skip: activeTab !== "order_history",
    },
  );

  const [sendMessage] = useSendMessageMutation();
  const [pinnedMessage, setPinnedMessage] = useState<any | null>(null);

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

  const chatMessages = useMemo<CustomChatMessage[]>(() => {
    if (!Array.isArray(messagesData)) {
      return [];
    }
    const myId = normalizeId(currentUserId);
    const partnerId = normalizeId(canonicalPartnerId || activePartnerId);
    return messagesData.map((msg: any): CustomChatMessage => ({
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
      type: (() => {
        const normalizedType = normalizeMessageType(msg.type);
        if (normalizedType === "TEXT") {
          return String(msg.messageText || msg.text || "").startsWith("data:image/") ||
            String(msg.messageText || msg.text || "").startsWith("file://")
            ? "image"
            : "TEXT";
        }
        return normalizedType;
      })() as CustomChatMessage["type"],
      couponDetails: msg.couponDetails,
      conversationId: normalizeId(msg.conversationId) || effectiveConversationId,
      orderId: normalizeId(msg.orderId || msg.metadata?.orderId) || null,
      metadata: msg.metadata ?? null,
    }));
  }, [messagesData, currentUserId, canonicalPartnerId, activePartnerId, effectiveConversationId]);

  React.useEffect(() => {
    setPinnedMessage(initialPinnedMessage ?? null);
  }, [initialPinnedMessage]);

  React.useEffect(() => {
    if (!Array.isArray(messagesData) || !currentUserId) return;

    const unreadIncoming = messagesData.filter((msg: any) => {
      const receiverId = resolveEntityId(msg?.receiverId);
      const senderId = resolveEntityId(msg?.senderId);
      return (
        normalizeId(receiverId) === normalizeId(currentUserId) &&
        normalizeId(senderId) === normalizeId(canonicalPartnerId || activePartnerId) &&
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
  }, [messagesData, currentUserId, canonicalPartnerId, activePartnerId, markAsRead]);

  React.useEffect(() => {
    if (!socket) return;

    const handlePinnedMessage = (payload: any) => {
      if (normalizeId(payload?.conversationId) !== effectiveConversationId) return;
      setPinnedMessage(payload?.pinnedMessage ?? null);
    };

    socket.on("message_pinned", handlePinnedMessage);

    return () => {
      socket.off("message_pinned", handlePinnedMessage);
    };
  }, [socket, effectiveConversationId]);

  React.useEffect(() => {
    if (!pinnedMessage || !Array.isArray(chatMessages) || !chatMessages.length) {
      return;
    }

    if (hasTerminalOrderUpdate(chatMessages, pinnedMessage)) {
      setPinnedMessage(null);
    }
  }, [pinnedMessage, chatMessages]);

  const autoPinnedOrderMessage = useMemo<CustomChatMessage | null>(() => {
    if (!Array.isArray(chatMessages) || !chatMessages.length) {
      return null;
    }

    const openPlacedMessages = chatMessages.filter((message) => {
      if (message.type !== "ORDER_PLACED") return false;
      return !hasTerminalOrderUpdate(chatMessages, message);
    });

    return openPlacedMessages.length
      ? openPlacedMessages[openPlacedMessages.length - 1]
      : null;
  }, [chatMessages]);

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
      const targetPartnerId = normalizeId(canonicalPartnerId || activePartnerId);
      return normalizeId(vendorId) === targetPartnerId || normalizeId(buyerId) === targetPartnerId;
    });
  }, [ordersData, canonicalPartnerId, activePartnerId]);

  const handleSendMessage = async (
    text: string,
    type: string = "text",
    coupon?: CouponData,
  ) => {
    if (!text.trim() && type === "text") return;
    const targetPartnerId = canonicalPartnerId || activePartnerId;
    if (!targetPartnerId) return;
    if (type === "coupon" && !isVendorSide) {
      return;
    }
    try {
      // If sending a coupon, assign it to the buyer first
      if (type === "coupon" && coupon) {
        // Try to find the actual buyer profile ID from messages if possible
        const buyerProfileId =
          normalizeId((partnerData as any)?.buyerProfileId) ||
          normalizeId(
            messagesData?.find((m: any) => normalizeId(m?.buyerId))?.buyerId,
          );
        const targetBuyerId = buyerProfileId || targetPartnerId;

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
          const assignMessage =
            assignErr?.data?.message ||
            assignErr?.error ||
            "Coupon assignment failed";
          const alreadyAssigned =
            typeof assignMessage === "string" &&
            assignMessage.toLowerCase().includes("already assigned");

          if (!alreadyAssigned) {
            Alert.alert(
              t("error", "Error"),
              typeof assignMessage === "string"
                ? assignMessage
                : t(
                    "chat_coupon_assign_error",
                    "Error: Cannot assign coupon. Buyer ID not resolved.",
                  ),
            );
            return;
          }
        }
      }

      const msgText =
        type === "coupon"
          ? `${couponPrefix}: ${coupon?.code} - ${coupon?.desc}`
          : text;

      await sendMessage({
        receiverId: targetPartnerId,
        messageText: msgText,
      }).unwrap();

      setMessageText("");
      setShowOptions(false);
    } catch (error) {
      console.error("Failed to send", error);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("permission_required", "Permission Required"),
          t("need_photos_permission", "Please grant photo library permission."),
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.35,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const mimeType = asset.mimeType || "image/jpeg";
      const imagePayload = asset.base64
        ? `data:${mimeType};base64,${asset.base64}`
        : asset.uri || "";

      if (!imagePayload) return;
      await handleSendMessage(imagePayload, "image");
    } catch (error) {
      console.error("Photo pick/send failed", error);
      Alert.alert(t("error", "Error"), t("failed_pick_image", "Failed to pick image."));
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

  const handlePinMessage = (message: CustomChatMessage) => {
    const targetConversationId = normalizeId(message.conversationId) || effectiveConversationId;

    if (!targetConversationId) {
      Alert.alert("Pin unavailable", "Conversation ID is not ready yet.");
      return;
    }

    const activeSocket = socket || socketService.getSocket();
    if (!activeSocket?.connected) {
      Alert.alert("Pin unavailable", "Realtime connection is not available.");
      return;
    }

    activeSocket.emit("pin_message", {
      conversationId: targetConversationId,
      messageId: message.id,
    });
  };

  const renderOrderCard = (msg: CustomChatMessage, compact = false) => {
    const metadata = (msg.metadata || {}) as OrderMessageMetadata;
    const items = Array.isArray(metadata.items) ? metadata.items : [];
    const isPlaced = msg.type === "ORDER_PLACED";
    const normalizedStatus = normalizeOrderStatus(metadata.status);
    const summaryPrice = formatCurrency(metadata.price);
    const totalAmount = formatCurrency(metadata.totalAmount);
    const canPin =
      isOrderMessageType(msg.type) &&
      (!normalizedStatus || isPinEligibleOrderStatus(normalizedStatus));

    return (
      <View
        style={[
          styles.orderMessageCard,
          compact && styles.orderMessageCardCompact,
          msg.isOwn ? styles.orderMessageCardOwn : styles.orderMessageCardOther,
        ]}
      >
        <View style={styles.orderMessageTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderMessageEyebrow}>
              {isPlaced ? "Order placed" : "Order update"}
            </Text>
            <Text style={styles.orderMessageTitle}>
              {metadata.orderNumber || `#${(msg.orderId || "").slice(-6).toUpperCase()}`}
            </Text>
          </View>
          {!compact && canPin ? (
            <TouchableOpacity
              onPress={() => handlePinMessage(msg)}
              style={styles.pinButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pin-outline" size={16} color="#1F2937" />
              <Text style={styles.pinButtonText}>Pin</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.orderMessageBodyText}>
          {msg.text || (isPlaced ? "A new order was placed." : "Order status was updated.")}
        </Text>

        {isPlaced ? (
          <View style={styles.orderMessageSection}>
            {metadata.productName ? (
              <Text style={styles.orderMessageLine}>
                {metadata.productName}
                {metadata.quantity ? ` x${metadata.quantity}` : ""}
                {summaryPrice ? ` • ${summaryPrice}` : ""}
              </Text>
            ) : null}
            {items.slice(0, compact ? 1 : 3).map((item, index) => (
              <Text key={`${item.productName || "item"}-${index}`} style={styles.orderMessageSubline}>
                {item.productName || "Item"}
                {item.quantity ? ` x${item.quantity}` : ""}
                {formatCurrency(item.price) ? ` • ${formatCurrency(item.price)}` : ""}
              </Text>
            ))}
            {totalAmount ? (
              <Text style={styles.orderMessageTotal}>
                Total {totalAmount}
              </Text>
            ) : null}
          </View>
        ) : normalizedStatus ? (
          <View style={styles.orderMessageStatusPill}>
            <Text style={styles.orderMessageStatusText}>{normalizedStatus}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const resolvedPinnedMessage = useMemo<CustomChatMessage | null>(() => {
    const pinnedSource = autoPinnedOrderMessage || pinnedMessage;

    if (!pinnedSource) return null;

    const pinnedId = normalizeId(pinnedSource?.id || pinnedSource?._id);
    const pinnedOrderId = resolveOrderId(pinnedSource);
    const pinnedOrderNumber = resolveOrderNumber(pinnedSource);
    const pinnedText = resolveMessageBody(pinnedSource);
    const liveMessage = Array.isArray(chatMessages)
      ? chatMessages.find((message) => {
          const messageId = normalizeId(message.id);
          const messageOrderId = resolveOrderId(message);
          const messageOrderNumber = resolveOrderNumber(message);
          const messageText = resolveMessageBody(message);

          return (
            (!!pinnedId && messageId === pinnedId) ||
            (!!pinnedOrderId && messageOrderId === pinnedOrderId) ||
            (!!pinnedOrderNumber && messageOrderNumber === pinnedOrderNumber) ||
            (!!pinnedText && messageText === pinnedText)
          );
        })
      : null;

    if (liveMessage) {
      return liveMessage;
    }

    if (autoPinnedOrderMessage && areMessagesEquivalent(autoPinnedOrderMessage, pinnedSource)) {
      return autoPinnedOrderMessage;
    }

    return null;
  }, [pinnedMessage, autoPinnedOrderMessage, chatMessages]);

  const shouldHidePinnedBanner = useMemo(() => {
    if (!resolvedPinnedMessage || !Array.isArray(chatMessages) || !chatMessages.length) {
      return false;
    }

    return hasTerminalOrderUpdate(chatMessages, resolvedPinnedMessage);
  }, [resolvedPinnedMessage, chatMessages]);

  React.useEffect(() => {
    if (!autoPinnedOrderMessage) {
      autoPinnedMessageKeyRef.current = "";
      return;
    }

    const autoPinnedKey =
      normalizeId(autoPinnedOrderMessage.id) ||
      resolveOrderId(autoPinnedOrderMessage) ||
      resolveOrderNumber(autoPinnedOrderMessage);

    if (!autoPinnedKey || autoPinnedMessageKeyRef.current === autoPinnedKey) {
      return;
    }

    autoPinnedMessageKeyRef.current = autoPinnedKey;
    setPinnedMessage((current: any) =>
      areMessagesEquivalent(current, autoPinnedOrderMessage)
        ? current
        : autoPinnedOrderMessage,
    );

    const activeSocket = socket || socketService.getSocket();
    if (
      activeSocket?.connected &&
      effectiveConversationId &&
      !areMessagesEquivalent(pinnedMessage, autoPinnedOrderMessage)
    ) {
      activeSocket.emit("pin_message", {
        conversationId: effectiveConversationId,
        messageId: autoPinnedOrderMessage.id,
      });
    }
  }, [autoPinnedOrderMessage, socket, effectiveConversationId, pinnedMessage]);

  React.useEffect(() => {
    if (!highlightedMessageId) return;

    const timer = setTimeout(() => {
      setHighlightedMessageId("");
    }, 2200);

    return () => clearTimeout(timer);
  }, [highlightedMessageId]);

  const jumpToPinnedMessage = React.useCallback(() => {
    if (!resolvedPinnedMessage || !chatMessages.length) return;

    const targetIndex = chatMessages.findIndex((message) =>
      areMessagesEquivalent(message, resolvedPinnedMessage),
    );

    if (targetIndex < 0) {
      Alert.alert("Pinned message", "Pinned message was not found in the loaded chat.");
      return;
    }

    setHighlightedMessageId(normalizeId(chatMessages[targetIndex]?.id));

    flatListRef.current?.scrollToIndex({
      index: targetIndex,
      animated: true,
      viewPosition: 0.35,
    });
  }, [resolvedPinnedMessage, chatMessages]);

  const renderPinnedBanner = () => {
    if (messagesLoading) {
      return (
        <View style={styles.pinnedBanner}>
          <View style={styles.pinnedBannerInner}>
            <SkeletonBlock style={styles.skeletonPinnedIcon} />
            <View style={styles.pinnedBannerContent}>
              <SkeletonBlock style={styles.skeletonPinnedTitle} />
              <SkeletonBlock style={styles.skeletonPinnedText} />
            </View>
          </View>
        </View>
      );
    }
    if (!resolvedPinnedMessage || shouldHidePinnedBanner) return null;
    const pinnedBanner = resolvePinnedBannerLines(resolvedPinnedMessage);

    return (
      <TouchableOpacity
        style={styles.pinnedBanner}
        activeOpacity={0.85}
        onPress={jumpToPinnedMessage}
      >
        <View style={styles.pinnedBannerInner}>
          <View style={styles.pinnedIconWrap}>
            <Ionicons name="pin" size={14} color="#0F766E" />
          </View>
          <View style={styles.pinnedBannerContent}>
            <Text style={styles.pinnedBadgeText} numberOfLines={1}>
              {pinnedBanner.title}
            </Text>
            <Text style={styles.pinnedBannerText} numberOfLines={1}>
              {pinnedBanner.subtitle}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
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
            highlightedMessageId && highlightedMessageId === normalizeId(msg.id)
              ? styles.highlightedBubbleWrapper
              : null,
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
          ) : isOrderMessageType(msg.type) ? (
            renderOrderCard(msg)
          ) : msg.type === "image" ? (
            <View
              style={[
                styles.bubble,
                msg.isOwn ? styles.myBubble : styles.otherBubble,
                styles.imageBubble,
              ]}
            >
              <Image
                source={{ uri: msg.text }}
                style={styles.chatImage}
                resizeMode="cover"
              />
            </View>
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
            {shouldShowHeaderSkeleton ? (
              <SkeletonBlock style={styles.headerAvatar} />
            ) : (
              <>
                <Image
                  source={{ uri: partnerAvatar }}
                  style={styles.headerAvatar}
                />
                <View
                  style={[styles.onlineDotOverlay, { backgroundColor: "#4CAF50" }]}
                />
              </>
            )}
          </View>
          <View style={styles.headerTextContainer}>
            {shouldShowHeaderSkeleton ? (
              <>
                <SkeletonBlock style={styles.skeletonHeaderName} />
                <SkeletonBlock style={styles.skeletonHeaderMeta} />
              </>
            ) : (
              <>
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
              </>
            )}
          </View>
        </View>
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
              <CategoryGridSkeleton />
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
              <OrderHistorySkeleton />
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
          <ChatThreadSkeleton />
        ) : (
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.chatList,
              { paddingBottom: composerHeight + insets.bottom + 15 },
            ]}
            renderItem={renderMessage}
            onScrollToIndexFailed={(info) => {
              const fallbackIndex = Math.max(0, info.index - 1);
              flatListRef.current?.scrollToOffset({
                offset: info.averageItemLength * fallbackIndex,
                animated: true,
              });

              setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.35,
                });
              }, 250);
            }}
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

      <View style={styles.contentShell}>
        {activeTab === "chat" ? renderPinnedBanner() : null}
        {renderContent()}

        {activeTab === "chat" && (
          <Animated.View
            style={[
              styles.composerDock,
              { transform: [{ translateY: keyboardOffset }] },
            ]}
            onLayout={(event) => {
              const nextHeight = Math.ceil(event.nativeEvent.layout.height);
              if (nextHeight && nextHeight !== composerHeight) {
                setComposerHeight(nextHeight);
              }
            }}
          >
            {showOptions && (
              <View style={styles.attachmentMenu}>
                <View style={styles.attachmentRow}>
                  <AttachmentBtn
                    icon="image"
                    label={t("chat_attachment_photo", "Photo")}
                    onPress={handlePickPhoto}
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
                isKeyboardVisible
                  ? styles.inputAreaKeyboardOpen
                  : styles.inputAreaKeyboardClosed,
                { paddingBottom: composerBottomInset, paddingHorizontal: 14 },
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
                style={[
                  styles.textInput,
                  isKeyboardVisible
                    ? styles.textInputKeyboardOpen
                    : styles.textInputKeyboardClosed,
                ]}
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
                    isKeyboardVisible
                      ? styles.sendBtnKeyboardOpen
                      : styles.sendBtnKeyboardClosed,
                    !messageText.trim() && { backgroundColor: "#DDD" },
                  ]}
                >
                  <Ionicons name="send" size={18} color="white" />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>

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
  safeArea: { flex: 1, backgroundColor: "#fff", direction: "ltr" },
  contentShell: { flex: 1, position: "relative" },
  header: {
    direction: 'ltr',
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
  skeletonHeaderName: {
    width: 120,
    height: 14,
    borderRadius: 7,
  },
  skeletonHeaderMeta: {
    width: 92,
    height: 10,
    borderRadius: 5,
    marginTop: 7,
  },

  tabsContainer: {
    direction: "ltr",
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
  tabText: { fontSize: 13, color: "#2F3437", fontWeight: "500" },
  activeTabText: { color: "#FFF" },

  pinnedBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  pinnedBannerInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  pinnedIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  pinnedBannerContent: { flex: 1 },
  pinnedBadgeText: { fontSize: 12, fontWeight: "700", color: "#115E59" },
  pinnedBannerText: { fontSize: 12, lineHeight: 17, color: "#134E4A", marginTop: 1 },
  skeletonPinnedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
  skeletonPinnedTitle: {
    width: 110,
    height: 10,
    borderRadius: 5,
  },
  skeletonPinnedText: {
    width: 180,
    maxWidth: "90%",
    height: 12,
    borderRadius: 6,
    marginTop: 7,
  },

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
  highlightedBubbleWrapper: {
    borderRadius: 20,
    shadowColor: "#14B8A6",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
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
  imageBubble: { padding: 4, overflow: "hidden" },
  chatImage: { width: 180, height: 180, borderRadius: 12, backgroundColor: "#E5E7EB" },
  msgText: { fontSize: 14, lineHeight: 20 },
  myMsgText: { color: "#FFF" },
  otherMsgText: { color: "#374151" },
  timeText: { fontSize: 10, color: "#9CA3AF", marginTop: 4 },
  skeletonMsgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  skeletonBubble: {
    height: 54,
    borderRadius: 18,
    width: 220,
    maxWidth: "100%",
  },
  skeletonBubbleOwn: {
    borderBottomRightRadius: 4,
  },
  skeletonBubbleOther: {
    borderBottomLeftRadius: 4,
  },
  skeletonBubbleShort: {
    width: 168,
    height: 46,
  },
  skeletonTimestamp: {
    width: 54,
    height: 10,
    borderRadius: 5,
    marginTop: 8,
  },
  skeletonTimestampOwn: {
    alignSelf: "flex-end",
  },
  skeletonTimestampOther: {
    alignSelf: "flex-start",
  },
  orderMessageCard: {
    minWidth: 220,
    maxWidth: 280,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  orderMessageCardCompact: {
    minWidth: 0,
    maxWidth: "100%",
  },
  orderMessageCardOwn: {
    backgroundColor: "#D7F6F5",
    borderColor: "#84E1DD",
  },
  orderMessageCardOther: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
  },
  orderMessageTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  orderMessageEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "#0F766E",
  },
  orderMessageTitle: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  orderMessageBodyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: "#374151",
  },
  orderMessageSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  orderMessageLine: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  orderMessageSubline: {
    marginTop: 4,
    fontSize: 12,
    color: "#4B5563",
  },
  orderMessageTotal: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F766E",
  },
  orderMessageStatusPill: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E0F2FE",
  },
  orderMessageStatusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#075985",
    textTransform: "capitalize",
  },
  pinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  pinButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
  },

  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#fff",
  },
  inputAreaKeyboardClosed: {
    paddingTop: 7,

  },
  inputAreaKeyboardOpen: {
    paddingTop: 7,
  },
  composerDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  plusBtn: { padding: 8 },
  textInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 25,
    paddingHorizontal: 16,
    fontSize: 14,
    maxHeight: 120,
    marginHorizontal: 8,
    color: "#1F2937",
  },
  textInputKeyboardClosed: {
    minHeight: 40,
    paddingVertical: 10,
  },
  textInputKeyboardOpen: {
    minHeight: 44,
    paddingVertical: 10,
  },
  sendBtn: {
    borderRadius: 20,
    backgroundColor: "#2A8383",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnKeyboardClosed: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  sendBtnKeyboardOpen: {
    width: 40,
    height: 40,
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
  skeletonPanelContent: {
    paddingBottom: 8,
  },
  skeletonCategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 20,
  },
  skeletonCategoryImage: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonCategoryLabel: {
    width: "80%",
    height: 12,
    borderRadius: 6,
  },
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
  skeletonOrderNo: {
    width: 116,
    height: 12,
    borderRadius: 6,
  },
  skeletonOrderStatus: {
    width: 68,
    height: 12,
    borderRadius: 6,
  },
  skeletonOrderDate: {
    width: 90,
    height: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  skeletonOrderTotal: {
    width: 124,
    height: 14,
    borderRadius: 7,
  },
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
