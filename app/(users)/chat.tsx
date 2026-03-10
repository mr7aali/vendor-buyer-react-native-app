import { supportTickets } from '@/constants/common';
import { useTranslation } from '@/hooks/use-translation';
import { useGetConversationsQuery, useMarkAsReadMutation } from '@/store/api/chatApiSlice';
import { useGetMyConnectionsQuery } from '@/store/api/connectionApiSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

const normalizeId = (value: any) => (value === undefined || value === null ? '' : String(value));
const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
const resolveEntityId = (entity: any) =>
  normalizeId(
    entity?.userId ??
      entity?._id ??
      entity?.id ??
      entity?.user?.userId ??
      entity?.user?._id ??
      entity?.user?.id ??
      entity,
  );
const toAbsoluteImageUri = (value: any) => {
  const raw = normalizeId(value).trim();
  if (!raw) return '';
  if (
    raw.startsWith('http://') ||
    raw.startsWith('https://') ||
    raw.startsWith('file://') ||
    raw.startsWith('content://') ||
    raw.startsWith('data:')
  ) {
    return raw;
  }
  if (raw.startsWith('/') && apiBaseUrl) {
    return `${apiBaseUrl}${raw}`;
  }
  return raw;
};
const resolveAvatarUri = (partner: any) =>
  toAbsoluteImageUri(
    partner?.buyer?.profilePhotoUrl ||
      partner?.buyer?.avatar ||
      partner?.vendor?.logoUrl ||
      partner?.vendor?.logo ||
      partner?.profilePhotoUrl ||
      partner?.avatar ||
      partner?.logoUrl ||
      partner?.logo ||
      partner?.image ||
      partner?.photoUrl ||
      partner?.profileImage ||
      '',
  ) || 'https://via.placeholder.com/48';
const formatTime = (value: any) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
};

export default function ChatScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.auth.user);
  const currentUserId = normalizeId(user?.userId || user?.id || (user as any)?._id);
  const [activeTab, setActiveTab] = useState<'chat' | 'support'>('chat');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversationsData = [], isLoading } = useGetConversationsQuery(currentUserId, {
    skip: !currentUserId,
    refetchOnMountOrArgChange: true,
  });
  const { data: connectionsData = [] } = useGetMyConnectionsQuery(currentUserId, {
    skip: !currentUserId,
    refetchOnMountOrArgChange: true,
  });
  const [markAsRead] = useMarkAsReadMutation();

  const mergedRows = useMemo(() => {
    const conversationRows = Array.isArray(conversationsData) ? conversationsData : [];
    const rawConnections = Array.isArray((connectionsData as any)?.data)
      ? (connectionsData as any).data
      : Array.isArray(connectionsData)
        ? (connectionsData as any)
        : [];

    const byPartnerId = new Map<string, any>();

    conversationRows.forEach((row: any) => {
      const partner = row?.partner || row?.participant || {};
      const partnerId = normalizeId(
        row?.partnerId ||
        resolveEntityId(partner) ||
        resolveEntityId(row?.participant) ||
        resolveEntityId(row?.vendorId) ||
        resolveEntityId(row?.vendor),
      );
      if (partnerId) byPartnerId.set(partnerId, row);
    });

    rawConnections.forEach((conn: any) => {
      const vendor = conn?.vendor || conn?.vendorId || {};
      const partnerId = normalizeId(
        resolveEntityId(vendor) ||
        resolveEntityId(conn?.vendorId) ||
        conn?.vendorUserId ||
        conn?.vendorId,
      );
      if (!partnerId || byPartnerId.has(partnerId)) return;

      byPartnerId.set(partnerId, {
        id: normalizeId(conn?._id || conn?.id || partnerId),
        partnerId,
        partner: vendor,
        participant: vendor,
        unreadCount: 0,
        // Connected vendor with no chat yet should still appear in list.
        lastMessage: {
          id: '',
          messageText: t('chat_no_messages_yet', 'No messages yet'),
          createdAt: conn?.createdAt || conn?.updatedAt || null,
        },
      });
    });

    return Array.from(byPartnerId.values());
  }, [conversationsData, connectionsData, t]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const rows = Array.isArray(mergedRows) ? mergedRows : [];
    if (!q) return rows;
    return rows.filter((row: any) => {
      const partner = row?.partner || {};
      const name = partner?.fullName || partner?.businessName || partner?.storename || partner?.email || '';
      const preview = row?.lastMessage?.messageText || '';
      return String(name).toLowerCase().includes(q) || String(preview).toLowerCase().includes(q);
    });
  }, [mergedRows, searchQuery]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return supportTickets.filter((ticket) =>
      ticket.title.toLowerCase().includes(q) || ticket.customer.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('chat_title', 'Chat')}</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={22} color="#111827" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('chat_search_by_name', 'Search by name')}
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'chat' && styles.tabActive]} onPress={() => setActiveTab('chat')}>
          <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>{t('chat_tab_chat', 'Chat')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'support' && styles.tabActive]} onPress={() => setActiveTab('support')}>
          <Text style={[styles.tabText, activeTab === 'support' && styles.tabTextActive]}>{t('chat_tab_support', 'Support')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {activeTab === 'chat' ? (
          <View style={styles.listWrap}>
            {isLoading ? (
              <Text style={styles.emptyText}>{t('chat_loading_conversations', 'Loading conversations...')}</Text>
            ) : filteredRows.length ? (
              filteredRows.map((conversation: any, index: number) => {
                const partner = conversation?.partner || conversation?.participant || conversation?.vendor || conversation?.buyer || {};
                const participantList = Array.isArray(conversation?.participants)
                  ? conversation.participants
                  : Array.isArray(conversation?.users)
                    ? conversation.users
                    : [];
                const participantOther = participantList.find((p: any) => resolveEntityId(p) && resolveEntityId(p) !== currentUserId);
                const lastSenderId = resolveEntityId(conversation?.lastMessage?.senderId || conversation?.lastMessage?.sender);
                const lastReceiverId = resolveEntityId(conversation?.lastMessage?.receiverId || conversation?.lastMessage?.receiver);
                const lastMessageOtherId =
                  lastSenderId && lastSenderId !== currentUserId
                    ? lastSenderId
                    : lastReceiverId && lastReceiverId !== currentUserId
                      ? lastReceiverId
                      : '';
                const partnerId = normalizeId(
                  conversation?.partnerId ||
                    resolveEntityId(partner) ||
                    resolveEntityId(conversation?.participant) ||
                    resolveEntityId(participantOther) ||
                    lastMessageOtherId ||
                    resolveEntityId(conversation?.vendorId) ||
                    resolveEntityId(conversation?.vendor) ||
                    resolveEntityId(conversation?.buyerId) ||
                    resolveEntityId(conversation?.buyer),
                );
                const displayName = partner?.fullName || partner?.businessName || partner?.storename || partner?.email || t('chat_user_fallback', 'User');
                const avatar = resolveAvatarUri(partner);
                const unreadCount = Number(conversation?.unreadCount || 0);
                const messageId = conversation?.lastMessage?.id || conversation?.lastMessage?._id;

                return (
                  <TouchableOpacity
                    key={normalizeId(conversation?.id || conversation?._id || `${partnerId}-${index}`)}
                    style={styles.row}
                    onPress={async () => {
                      if (unreadCount > 0 && messageId) {
                        try {
                          await markAsRead(messageId).unwrap();
                        } catch {
                        }
                      }
                      router.push({
                        pathname: '/(screens)/chat_box',
                        params: {
                          role: 'buyer',
                          partnerId,
                          conversationId: normalizeId(conversation?.id || conversation?._id || partnerId),
                          fullname: displayName,
                        },
                      });
                    }}
                  >
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                    <View style={styles.middle}>
                      <Text style={styles.name}>{displayName}</Text>
                      <Text style={styles.preview} numberOfLines={1}>
                        {conversation?.lastMessage?.messageText || t('chat_no_messages_yet', 'No messages yet')}
                      </Text>
                    </View>
                    <View style={styles.right}>
                      <Text style={[styles.time, unreadCount > 0 && styles.timeActive]}>
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
              <Text style={styles.emptyText}>{t('chat_no_conversations_found', 'No conversations found.')}</Text>
            )}
          </View>
        ) : (
          <View style={styles.listWrap}>
            {filteredTickets.map((ticket) => (
              <View key={ticket.id} style={styles.supportCard}>
                <Text style={styles.supportTitle}>{ticket.title}</Text>
                <Text style={styles.supportDesc} numberOfLines={2}>{ticket.description}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F6F5', direction: 'ltr' },
  header: { direction: 'ltr', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 34 / 2, fontWeight: '600', color: '#20272C' },
  searchWrap: {
    marginHorizontal: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D9E1E7',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    backgroundColor: '#FAFAFB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#111827' },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, gap: 10 },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#DCE5E5',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
  },
  tabActive: { backgroundColor: '#2A8B8A' },
  tabText: { color: '#374151', fontSize: 16, fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF' },
  listWrap: { paddingHorizontal: 20, paddingTop: 12 },
  row: {
    direction: 'ltr',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DEE5EA',
  },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#CCEFDB' },
  middle: { flex: 1, marginLeft: 12, marginRight: 8, direction: 'ltr' },
  name: { fontSize: 31 / 2, fontWeight: '600', color: '#263238', textAlign: 'left' },
  preview: { fontSize: 29 / 2, color: '#4B5563', marginTop: 2, textAlign: 'left' },
  right: { alignItems: 'flex-start', minWidth: 64, direction: 'ltr' },
  time: { fontSize: 14, color: '#4B5563', textAlign: 'left' },
  timeActive: { color: '#1E8A8D' },
  badge: {
    marginTop: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1E8A8D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 24, fontSize: 14 },
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
  },
  supportTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  supportDesc: { fontSize: 13, color: '#6B7280', marginTop: 6 },
});
