import socketService from '../../services/socket';
import { apiSlice } from './apiSlice';
import { buildApiCandidateUrls } from '@/services/apiConfig';

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

const normalizePartner = (partner: any) => {
    if (!partner) return null;

    const buyer = partner?.buyer ?? null;
    const vendor = partner?.vendor ?? null;

    return {
        ...partner,
        id: normalizeId(partner?.id ?? partner?._id ?? partner?.userId),
        userId: normalizeId(
            partner?.userId ??
            buyer?.userId ??
            vendor?.userId ??
            partner?.id ??
            partner?._id
        ),
        fullName:
            partner?.fullName ??
            buyer?.fullName ??
            vendor?.businessName ??
            partner?.businessName ??
            vendor?.storename ??
            partner?.storename ??
            vendor?.fullName ??
            partner?.displayName ??
            partner?.user?.displayName ??
            null,
        businessName: partner?.businessName ?? vendor?.businessName ?? null,
        storename: partner?.storename ?? vendor?.storename ?? null,
        profilePhotoUrl: partner?.profilePhotoUrl ?? buyer?.profilePhotoUrl ?? null,
        logoUrl: partner?.logoUrl ?? vendor?.logoUrl ?? null,
        avatar:
            partner?.avatar ??
            partner?.profilePhotoUrl ??
            buyer?.profilePhotoUrl ??
            partner?.logoUrl ??
            vendor?.logoUrl ??
            partner?.avatarUrl ??
            null,
        buyer,
        vendor,
    };
};

const hasPartnerProfile = (partner: any) =>
    !!(
        partner?.fullName ||
        partner?.buyer?.fullName ||
        partner?.vendor?.businessName ||
        partner?.businessName ||
        partner?.vendor?.storename ||
        partner?.storename ||
        partner?.vendor?.fullName
    );

const resolvePartnerFromMessage = (conv: any, currentUserId?: string) => {
    const sender = conv?.lastMessage?.sender;
    const receiver = conv?.lastMessage?.receiver;
    const senderId = resolveChatUserId(sender);
    const receiverId = resolveChatUserId(receiver);

    if (currentUserId) {
        if (senderId && senderId !== currentUserId) return sender;
        if (receiverId && receiverId !== currentUserId) return receiver;
    }

    return sender ?? receiver ?? null;
};

const normalizeMessage = (msg: any) => ({
    ...msg,
    id: msg?.id || msg?._id,
    _id: msg?._id || msg?.id,
    messageText: msg?.messageText || msg?.text || '',
    type: msg?.type || 'TEXT',
    conversationId: normalizeId(msg?.conversationId ?? msg?.conversation?.id ?? msg?.conversation?._id),
    orderId: normalizeId(msg?.orderId) || null,
    metadata: msg?.metadata ?? null,
});

const parseJsonResponse = async (response: Response) => {
    const text = await response.text();
    if (!text.trim()) return null;

    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
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
            const id = resolveChatUserId(p);
            return !!id && (!currentUserId || id !== currentUserId);
        }) ||
        participantCandidates[0] ||
        conv?.partner ||
        conv?.participant ||
        null;

    const messagePartner = resolvePartnerFromMessage(conv, currentUserId);
    const partnerSource = hasPartnerProfile(selectedPartner) ? selectedPartner : (messagePartner ?? selectedPartner);
    const partner = normalizePartner(partnerSource);

    let partnerId =
        resolveChatUserId(partner) ||
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
        partner,
        participant: partner,
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

                    const readListener = ({ messageId }: { messageId: string }) => {
                        if (!messageId) return;
                        updateCachedData((draft) => {
                            const msg = draft.find((item: any) =>
                                normalizeId(item?.id || item?._id) === normalizeId(messageId)
                            );
                            if (msg) {
                                msg.isRead = true;
                            }
                        });
                    };

                    socket.on('new_message', listener);
                    socket.on('message_read', readListener);

                    await cacheEntryRemoved;
                    socket.off('new_message', listener);
                    socket.off('message_read', readListener);
                } catch {
                }
            },
        }),
        getPinnedMessage: builder.query<any, string>({
            query: (conversationId) => `/conversations/${conversationId}/pinned`,
            transformResponse: (response: any) => {
                const payload = response?.data ?? response ?? null;
                return payload ? normalizeMessage(payload) : null;
            },
            providesTags: (result, error, conversationId) => [{ type: 'Chat', id: `pinned-${conversationId}` }],
        }),
        uploadChatImage: builder.mutation<{ url: string; publicId?: string }, FormData>({
            async queryFn(formData, api) {
                const candidateUrls = buildApiCandidateUrls('/messages/upload-image');
                const accessToken = (api.getState() as any)?.auth?.accessToken;
                let lastError: any = null;

                for (const url of candidateUrls) {
                    try {
                        const response = await fetch(url, {
                            method: 'POST',
                            headers: {
                                Accept: 'application/json',
                                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                            },
                            body: formData,
                        });

                        const payload = await parseJsonResponse(response);

                        if (response.ok) {
                            const data = (payload?.data ?? payload) as { url?: string; publicId?: string } | null;
                            if (data?.url) {
                                return { data: data as { url: string; publicId?: string } };
                            }

                            lastError = {
                                status: 'PARSING_ERROR',
                                data: payload,
                                error: `Image upload succeeded but no url was returned from ${url}`,
                            };
                            continue;
                        }

                        lastError = {
                            status: response.status,
                            data: payload || { message: response.statusText || 'Request failed' },
                        };

                        if (response.status !== 404) {
                            return { error: lastError };
                        }
                    } catch (error: any) {
                        lastError = {
                            status: 'FETCH_ERROR',
                            error: error?.message || 'Network request failed',
                            data: { url },
                        };
                    }
                }

                return {
                    error: lastError ?? {
                        status: 'FETCH_ERROR',
                        error: 'Unable to reach any chat image upload endpoint',
                    },
                };
            },
        }),
        sendMessage: builder.mutation<any, { receiverId: string; messageText: string }>({
            async queryFn(body, _api, _extraOptions, baseQuery) {
                const result = await baseQuery({
                    url: '/messages',
                    method: 'POST',
                    body,
                });
                if (result.error) return { error: result.error as any };
                return { data: result.data };
            },
            async onQueryStarted({ receiverId, messageText }, { dispatch, queryFulfilled, getState }) {
                // Optimistic Update
                const state = getState() as any;
                const currentUser = state.auth.user;
                const currentUserId = resolveChatUserId(currentUser) || '';
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
                    const { data } = await queryFulfilled;
                    const persistedMessage = normalizeMessage(data?.data ?? data);

                    dispatch(
                        chatApiSlice.util.updateQueryData('getMessages', receiverId, (draft) => {
                            const optimisticIndex = draft.findIndex(
                                (m: any) => normalizeId(m?._id || m?.id) === tempId,
                            );

                            if (optimisticIndex >= 0) {
                                draft[optimisticIndex] = {
                                    ...draft[optimisticIndex],
                                    ...persistedMessage,
                                    isOptimistic: false,
                                };
                            }
                        }),
                    );
                } catch {
                    patchResult.undo();
                }
            },
        }),
        markAsRead: builder.mutation<null, string>({
            async queryFn(messageId, _api, _extraOptions, baseQuery) {
                const socket = socketService.getSocket();

                if (socket?.connected) {
                    socket.emit('mark_read', messageId);
                    return { data: null };
                }

                const result = await baseQuery({
                    url: `/messages/${messageId}/read`,
                    method: 'PATCH',
                });
                if (result.error) return { error: result.error as any };
                return { data: null };
            },
        }),
    }),
});

export const {
    useGetConversationsQuery,
    useGetMessagesQuery,
    useGetPinnedMessageQuery,
    useUploadChatImageMutation,
    useSendMessageMutation,
    useMarkAsReadMutation,
} = chatApiSlice;
