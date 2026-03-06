import socketService from '../../services/socket';
import { apiSlice } from './apiSlice';

const normalizeId = (value: any): string | undefined => {
    if (value === undefined || value === null) return undefined;
    return String(value);
};

const resolveEntityId = (entity: any): string | undefined => {
    return normalizeId(
        entity?.userId ??
        entity?._id ??
        entity?.id ??
        entity?.user?.userId ??
        entity?.user?._id ??
        entity?.user?.id
    );
};

const resolveMessageSideId = (value: any): string | undefined => {
    if (value && typeof value === 'object') {
        return resolveEntityId(value);
    }
    return normalizeId(value);
};

const toEntityList = (value: any): any[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
};

const normalizeConversation = (conv: any, currentUserId?: string) => {
    const participantCandidates = [
        ...toEntityList(conv?.partner),
        ...toEntityList(conv?.participant),
        ...toEntityList(conv?.participants),
        ...toEntityList(conv?.users),
        ...toEntityList(conv?.members),
    ].filter(Boolean);

    const selectedPartner =
        participantCandidates.find((p: any) => {
            const id = resolveEntityId(p);
            return !!id && (!currentUserId || id !== currentUserId);
        }) ||
        participantCandidates[0] ||
        conv?.partner ||
        conv?.participant ||
        null;

    let partnerId =
        normalizeId(conv?.partnerId) ||
        resolveEntityId(selectedPartner) ||
        normalizeId(conv?.conversationPartnerId) ||
        resolveEntityId(conv?.vendorId) ||
        resolveEntityId(conv?.vendor) ||
        resolveEntityId(conv?.buyerId) ||
        resolveEntityId(conv?.buyer) ||
        resolveEntityId(conv?.userId) ||
        resolveEntityId(conv?.user);

    // If fallback resolved own id, try another participant.
    if (partnerId && currentUserId && partnerId === currentUserId) {
        const other = participantCandidates.find((p: any) => {
            const id = resolveEntityId(p);
            return !!id && id !== currentUserId;
        });
        const otherId = resolveEntityId(other);
        if (otherId) partnerId = otherId;
    }

    const lastMessage = conv?.lastMessage
        ? {
            ...conv.lastMessage,
            id: conv.lastMessage.id || conv.lastMessage._id,
            messageText: conv.lastMessage.messageText || conv.lastMessage.text || '',
        }
        : null;

    return {
        ...conv,
        id: conv?.id || conv?._id || partnerId,
        partnerId,
        partner: selectedPartner,
        participant: selectedPartner,
        lastMessage,
        unreadCount: Number(conv?.unreadCount || 0),
    };
};

export const chatApiSlice = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getConversations: builder.query<any, string | undefined>({
            query: () => '/messages/conversations',
            transformResponse: (response: { data: any[] }, _meta, currentUserId) => {
                const raw = Array.isArray(response?.data) ? response.data : [];
                return raw.map((conv: any) => normalizeConversation(conv, currentUserId));
            },
            providesTags: ['Chat'],
            async onCacheEntryAdded(
                arg,
                { dispatch, cacheDataLoaded, cacheEntryRemoved }
            ) {
                try {
                    await cacheDataLoaded;
                    const socket = socketService.getSocket();
                    if (!socket) return;

                    const listener = (event: any) => {
                        dispatch(apiSlice.util.invalidateTags(['Chat']));
                    };
                    socket.on('new_message', listener);
                    await cacheEntryRemoved;
                    socket.off('new_message', listener);
                } catch {
                }
            },
        }),
        getMessages: builder.query<any, string>({
            query: (partnerId) => `/messages/conversation/${partnerId}`,
            transformResponse: (response: { data: any[] }) => {
                const raw = Array.isArray(response?.data) ? response.data : [];
                return raw.map((msg: any) => ({
                    ...msg,
                    id: msg?.id || msg?._id,
                    messageText: msg?.messageText || msg?.text || '',
                }));
            },
            providesTags: (result, error, partnerId) => [{ type: 'Chat', id: partnerId }],
            async onCacheEntryAdded(
                partnerId,
                { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }
            ) {
                try {
                    await cacheDataLoaded;
                    const socket = socketService.getSocket();
                    if (!socket) return;

                    const listener = (newMessage: any) => {
                        console.log('New message received via socket:', newMessage.id || newMessage._id);
                        const senderId = resolveMessageSideId(newMessage.senderId ?? newMessage.sender);
                        const receiverIdFromMsg = resolveMessageSideId(newMessage.receiverId ?? newMessage.receiver);
                        const partnerKey = normalizeId(partnerId);
                        const state = getState() as any;
                        const myId = resolveEntityId(state?.auth?.user);

                        const isRelevant = !!partnerKey && (
                            myId
                                ? (
                                    (senderId === partnerKey && receiverIdFromMsg === myId) ||
                                    (senderId === myId && receiverIdFromMsg === partnerKey)
                                )
                                : (senderId === partnerKey || receiverIdFromMsg === partnerKey)
                        );

                        if (isRelevant) {
                            updateCachedData((draft) => {
                                // Check if message already exists to avoid duplicates (e.g. from optimistic updates)
                                const incomingId = normalizeId(newMessage._id || newMessage.id);
                                const exists = draft.some((m: any) => normalizeId(m._id || m.id) === incomingId);
                                if (!exists) {
                                    draft.push(newMessage);
                                }
                            });
                        }
                    };

                    socket.on('new_message', listener);

                    await cacheEntryRemoved;
                    socket.off('new_message', listener);
                } catch {
                }
            },
        }),
        sendMessage: builder.mutation<any, { receiverId: string; messageText: string }>({
            query: (body) => {
                console.log('Sending message body:', body);
                return {
                    url: '/messages',
                    method: 'POST',
                    body,
                };
            },
            async onQueryStarted({ receiverId, messageText }, { dispatch, queryFulfilled, getState }) {
                // Optimistic Update
                const state = getState() as any;
                const currentUser = state.auth.user;
                const currentUserId = resolveEntityId(currentUser) || '';
                console.log('SendMessage onQueryStarted - senderId:', currentUserId);
                const tempId = Date.now().toString();

                const optimisitcMessage = {
                    id: tempId,
                    _id: tempId,
                    receiverId,
                    messageText,
                    senderId: currentUserId,
                    sender: currentUserId,
                    createdAt: new Date().toISOString(),
                    isOptimistic: true,
                };

                const patchResult = dispatch(
                    chatApiSlice.util.updateQueryData('getMessages', receiverId, (draft) => {
                        draft.push(optimisitcMessage);
                    })
                );

                try {
                    await queryFulfilled;
                    // Invalidate to get the real message with server ID or let socket handle it
                    // dispatch(apiSlice.util.invalidateTags(['Chat']));
                } catch {
                    patchResult.undo();
                }
            },
            invalidatesTags: ['Chat'],
        }),
        markAsRead: builder.mutation<void, string>({
            query: (messageId) => ({
                url: `/messages/${messageId}/read`,
                method: 'PATCH',
            }),
        }),
    }),
});

export const {
    useGetConversationsQuery,
    useGetMessagesQuery,
    useSendMessageMutation,
    useMarkAsReadMutation,
} = chatApiSlice;
