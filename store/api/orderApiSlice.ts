import { apiSlice } from './apiSlice';

const toArray = (value: any) => (Array.isArray(value) ? value : []);

const normalizeOrder = (order: any) => {
    if (!order || typeof order !== 'object') return order;
    return {
        ...order,
        orderItems: toArray(order.orderItems).length ? order.orderItems : toArray(order.items),
        payment: order.payment || order.payments || null,
    };
};

export const orderApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createOrder: builder.mutation({
            query: (orderData) => ({
                url: '/orders',
                method: 'POST',
                body: orderData,
            }),
            transformResponse: (response: any) => {
                const payload = response?.data || response;
                return normalizeOrder(payload);
            },
            invalidatesTags: [{ type: 'Order', id: 'LIST' }, { type: 'Cart', id: 'LIST' }],
        }),
        getOrderById: builder.query({
            query: (id) => `/orders/${id}`,
            transformResponse: (response: any) => {
                const payload = response?.data || response;
                return normalizeOrder(payload);
            },
            providesTags: (result, error, id) => [{ type: 'Order', id }],
        }),
        getOrders: builder.query({
            query: () => '/orders',
            transformResponse: (response: any) => {
                const raw =
                    (Array.isArray(response) && response) ||
                    (Array.isArray(response?.data) && response.data) ||
                    (Array.isArray(response?.orders) && response.orders) ||
                    [];
                return raw.map(normalizeOrder);
            },
            providesTags: [{ type: 'Order', id: 'LIST' }],
        }),
        updateOrderStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/orders/${id}/status`,
                method: 'PATCH',
                body: { status: String(status || '').toLowerCase() },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Order', id },
                { type: 'Order', id: 'LIST' }
            ],
        }),
    }),
    overrideExisting: true,
});

export const {
    useCreateOrderMutation,
    useGetOrderByIdQuery,
    useGetOrdersQuery,
    useUpdateOrderStatusMutation,
} = orderApiSlice;
