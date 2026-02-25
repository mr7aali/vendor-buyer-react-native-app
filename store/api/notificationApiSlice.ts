import { apiSlice } from './apiSlice';

export type UserNotification = {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: 'system' | 'buyer' | 'vendor' | 'broadcast';
    broadcastId?: string | null;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
};

const normalizeNotification = (item: any): UserNotification => ({
    id: String(item?.id || item?._id || ''),
    userId: String(item?.userId || item?.user?.id || ''),
    title: String(item?.title || 'Notification'),
    message: String(item?.message || ''),
    type: item?.type || 'info',
    category: item?.category || 'system',
    broadcastId: item?.broadcastId ?? null,
    isRead: Boolean(item?.isRead),
    createdAt: String(item?.createdAt || new Date().toISOString()),
    updatedAt: String(item?.updatedAt || item?.createdAt || new Date().toISOString()),
});

const toArray = (response: any) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.notifications)) return response.notifications;
    return [];
};

export const notificationApiSlice = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getMyNotifications: builder.query<UserNotification[], void>({
            query: () => '/notifications/me',
            transformResponse: (response: any) => toArray(response).map(normalizeNotification),
            providesTags: (result) => {
                const base: any[] = [{ type: 'Notification', id: 'LIST' }];
                if (Array.isArray(result)) {
                    result.forEach((n) => {
                        if (n.id) base.push({ type: 'Notification', id: n.id });
                    });
                }
                return base;
            },
        }),
        getMyUnreadNotifications: builder.query<UserNotification[], void>({
            query: () => '/notifications/me/unread',
            transformResponse: (response: any) => toArray(response).map(normalizeNotification),
            providesTags: [{ type: 'Notification', id: 'UNREAD' }],
        }),
        markMyNotificationRead: builder.mutation<any, string>({
            query: (id) => ({
                url: `/notifications/me/${id}/read`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Notification', id },
                { type: 'Notification', id: 'LIST' },
                { type: 'Notification', id: 'UNREAD' },
            ],
        }),
        markAllMyNotificationsRead: builder.mutation<any, void>({
            query: () => ({
                url: '/notifications/me/read-all',
                method: 'PATCH',
            }),
            invalidatesTags: [
                { type: 'Notification', id: 'LIST' },
                { type: 'Notification', id: 'UNREAD' },
            ],
        }),
        deleteMyNotification: builder.mutation<any, string>({
            query: (id) => ({
                url: `/notifications/me/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Notification', id },
                { type: 'Notification', id: 'LIST' },
                { type: 'Notification', id: 'UNREAD' },
            ],
        }),
    }),
});

export const {
    useGetMyNotificationsQuery,
    useGetMyUnreadNotificationsQuery,
    useMarkMyNotificationReadMutation,
    useMarkAllMyNotificationsReadMutation,
    useDeleteMyNotificationMutation,
} = notificationApiSlice;
