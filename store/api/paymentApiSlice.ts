import { apiSlice } from './apiSlice';

const normalizePayload = (response: any) => response?.data || response;

const normalizeTransactionHistory = (response: any) => {
    const payload = normalizePayload(response);
    const items =
        (Array.isArray(payload?.items) && payload.items) ||
        (Array.isArray(payload?.payments) && payload.payments) ||
        (Array.isArray(payload?.history) && payload.history) ||
        (Array.isArray(payload) && payload) ||
        [];

    return {
        ...payload,
        items,
    };
};

export const paymentApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createPaymentIntent: builder.mutation({
            query: (data) => ({
                url: '/payments/create-intent',
                method: 'POST',
                body: data,
            }),
            transformResponse: normalizePayload,
        }),
        getPaymentStatus: builder.query({
            query: (sessionId) => `/payments/status/${sessionId}`,
            transformResponse: normalizePayload,
        }),
        getPaymentByOrderId: builder.query({
            query: (orderId) => `/payments/order/${orderId}`,
            transformResponse: normalizePayload,
        }),
        getAllPayments: builder.query({
            // Keep cache user-scoped and send userId so backend can filter if supported.
            query: (userId?: string) => ({
                url: '/payments',
                ...(userId ? { params: { userId } } : {}),
            }),
            transformResponse: normalizeTransactionHistory,
            providesTags: ['Payment']
        }),
        getBuyerTransactionHistory: builder.query({
            query: (params?: {
                page?: number;
                limit?: number;
                sortBy?: string;
                sortOrder?: 'asc' | 'desc';
            }) => ({
                url: '/transaction-history/buyer',
                params: {
                    page: params?.page ?? 1,
                    limit: params?.limit ?? 10,
                    sortBy: params?.sortBy ?? 'createdAt',
                    sortOrder: params?.sortOrder ?? 'desc',
                },
            }),
            transformResponse: normalizeTransactionHistory,
            providesTags: ['Payment'],
        }),
        getVendorTransactionHistory: builder.query({
            query: (params?: {
                page?: number;
                limit?: number;
                search?: string;
                status?: string;
                sortBy?: string;
                sortOrder?: 'asc' | 'desc';
            }) => ({
                url: '/transaction-history/vendor',
                params: {
                    page: params?.page ?? 1,
                    limit: params?.limit ?? 10,
                    ...(params?.search ? { search: params.search } : {}),
                    ...(params?.status ? { status: params.status } : {}),
                    sortBy: params?.sortBy ?? 'createdAt',
                    sortOrder: params?.sortOrder ?? 'desc',
                },
            }),
            transformResponse: normalizeTransactionHistory,
            providesTags: ['Payment'],
        }),
        // Vendor Endpoints
        createVendorAccount: builder.mutation({
            query: () => ({
                url: '/payments/vendor/stripe/account',
                method: 'POST',
            }),
            transformResponse: normalizePayload,
        }),
        createAccountLink: builder.mutation({
            query: () => ({
                url: '/payments/vendor/stripe/account-link',
                method: 'POST',
            }),
            transformResponse: normalizePayload,
        }),
        getVendorAccountStatus: builder.query({
            query: () => '/payments/vendor/stripe/status',
            transformResponse: normalizePayload,
        }),
    }),
    overrideExisting: true,
});

export const {
    useCreatePaymentIntentMutation,
    useGetPaymentStatusQuery,
    useGetPaymentByOrderIdQuery,
    useGetAllPaymentsQuery,
    useGetBuyerTransactionHistoryQuery,
    useGetVendorTransactionHistoryQuery,
    useCreateVendorAccountMutation,
    useCreateAccountLinkMutation,
    useGetVendorAccountStatusQuery,
} = paymentApiSlice;
