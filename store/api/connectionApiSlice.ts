import { apiSlice } from './apiSlice';

export const connectionApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        connectToVendor: builder.mutation<any, { vendorCode: string }>({
            query: (data) => ({
                url: '/connections/connect',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Connection', 'Chat', 'Product', 'Category'],
        }),
        getMyConnections: builder.query<any, string | undefined>({
            query: (_userId) => ({
                url: '/connections',
                method: 'GET',
            }),
            providesTags: ['Connection'],
        }),
        getExploreVendors: builder.query<any, { search?: string } | void>({
            query: (params) => ({
                url: '/connections/vendors',
                method: 'GET',
                params,
            }),
            transformResponse: (response: any) => response?.data || response,
            providesTags: ['Connection'],
        }),
        disconnectFromVendor: builder.mutation<any, string>({
            query: (vendorId) => ({
                url: `/connections/disconnect/${vendorId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Connection', 'Chat', 'Product', 'Category'],
        }),
        getVendorQr: builder.query<any, string>({
            query: (vendorId) => ({
                url: `/connections/qr/${vendorId}`,
                method: 'GET',
            }),
            transformResponse: (response: any) => response?.data || response,
        }),
    }),
    overrideExisting: true,
});

export const {
    useConnectToVendorMutation,
    useGetMyConnectionsQuery,
    useGetExploreVendorsQuery,
    useDisconnectFromVendorMutation,
    useGetVendorQrQuery,
} = connectionApiSlice;
