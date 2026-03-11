import socketService from '../../services/socket';
import { apiSlice } from './apiSlice';

const normalizeId = (value: any): string | undefined => {
    if (value === undefined || value === null) return undefined;
    return String(value);
};

const resolveChatUserId = (entity: any): string | undefined => {
    return normalizeId(
        entity?.userId ??
        entity?.buyer?.userId ??
        entity?.vendor?.userId ??
        entity?.user?.userId ??
        entity?.id ??
        entity?._id ??
        entity
    );
};

const resolveEntityId = (entity: any): string | undefined => {
    return resolveChatUserId(entity);
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

const normalizeMessage = (msg: any) => ({
    ...msg,
    id: msg?.id || msg?._id,
    _id: msg?._id || msg?.id,
    messageText: msg?.messageText || msg?.text || '',
});

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
            const id = resolveChatUserId(p);
            return !!id && (!currentUserId || id !== currentUserId);
        }) ||
        participantCandidates[0] ||
        conv?.partner ||
        conv?.participant ||
        null;

    let partnerId =
        resolveChatUserId(selectedPartner) ||
        normalizeId(conv?.partnerId) ||
        normalizeId(conv?.conversationPartnerId) ||
        resolveChatUserId(conv?.vendorId) ||
        resolveChatUserId(conv?.vendor) ||
        resolveChatUserId(conv?.buyerId) ||
        resolveChatUserId(conv?.buyer) ||
        resolveChatUserId(conv?.userId) ||
        resolveChatUserId(conv?.user);

    // If fallback resolved own id, try another participant.
    if (partnerId && currentUserId && partnerId === currentUserId) {
        const other = participantCandidates.find((p: any) => {
            const id = resolveChatUserId(p);
            return !!id && id !== currentUserId;
        });
        const otherId = resolveChatUserId(other);
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
                return raw.map(normalizeMessage);
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
                        const normalizedMessage = normalizeMessage(newMessage);
                        console.log('New message received via socket:', normalizedMessage.id || normalizedMessage._id);
                        const senderId = resolveMessageSideId(normalizedMessage.senderId ?? normalizedMessage.sender);
                        const receiverIdFromMsg = resolveMessageSideId(normalizedMessage.receiverId ?? normalizedMessage.receiver);
                        const partnerKey = normalizeId(partnerId);
                        const state = getState() as any;
                        const myId = resolveChatUserId(state?.auth?.user);

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
                                const incomingId = normalizeId(normalizedMessage._id || normalizedMessage.id);
                                const optimisticIndex = draft.findIndex((m: any) =>
                                    m?.isOptimistic &&
                                    normalizeId(m?.senderId || m?.sender) === senderId &&
                                    normalizeId(m?.receiverId || m?.receiver) === receiverIdFromMsg &&
                                    String(m?.messageText || m?.text || '') === normalizedMessage.messageText
                                );
                                const exists = draft.some((m: any) => normalizeId(m._id || m.id) === incomingId);
                                if (optimisticIndex >= 0) {
                                    draft[optimisticIndex] = normalizedMessage;
                                } else if (!exists) {
                                    draft.push(normalizedMessage);
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
                const currentUserId = resolveChatUserId(currentUser) || '';
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
                    dispatch(apiSlice.util.invalidateTags(['Chat']));
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
