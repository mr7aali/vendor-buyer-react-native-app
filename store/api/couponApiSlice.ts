import { apiSlice } from './apiSlice';

const hasCouponShape = (item: any) =>
    item &&
    typeof item === 'object' &&
    (typeof item.code === 'string' || typeof item.couponCode === 'string') &&
    (
        item.discountValue !== undefined ||
        item.discount !== undefined ||
        item.value !== undefined
    );

const findCouponArrayDeep = (input: any): any[] => {
    if (!input) return [];
    if (Array.isArray(input)) {
        if (input.some(hasCouponShape)) return input;
        for (const entry of input) {
            const nested = findCouponArrayDeep(entry);
            if (nested.length) return nested;
        }
        return [];
    }
    if (typeof input === 'object') {
        for (const key of Object.keys(input)) {
            const nested = findCouponArrayDeep((input as any)[key]);
            if (nested.length) return nested;
        }
    }
    return [];
};

const normalizeCoupon = (coupon: any) => ({
    ...coupon,
    id: coupon?.id || coupon?._id || coupon?.couponId || '',
    code: coupon?.code || coupon?.couponCode || '',
    discountType: coupon?.discountType || coupon?.discount_type || coupon?.type || 'fixed',
    discountValue: Number(coupon?.discountValue ?? coupon?.discount ?? coupon?.value ?? 0),
    minPurchaseAmount: Number(coupon?.minPurchaseAmount ?? coupon?.minimumPurchase ?? coupon?.min_purchase_amount ?? 0),
    validFrom: coupon?.validFrom || coupon?.startDate || coupon?.fromDate || coupon?.createdAt,
    validUntil: coupon?.validUntil || coupon?.endDate || coupon?.toDate || coupon?.expiresAt,
    isActive: coupon?.isActive !== undefined ? coupon.isActive : coupon?.active !== undefined ? coupon.active : true,
});

export interface Coupon {
    id: string;
    name: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    validFrom: string;
    validUntil: string;
    minPurchaseAmount?: number;
    usageLimit?: number;
    usedCount?: number;
    isActive: boolean;
    vendorId: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCouponRequest {
    name: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    validFrom: string;
    validUntil: string;
    minPurchaseAmount?: number;
    usageLimit?: number;
}

export interface AssignCouponRequest {
    buyerId: string;
}

export const couponApiSlice = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        // Get all coupons for a vendor
        getCouponsByVendor: builder.query({
            query: (vendorId) => {
                console.log('Coupon API - Query string:', `/coupons?vendorId=${vendorId}`);
                return `/coupons?vendorId=${vendorId}`;
            },
            async onQueryStarted(arg, { queryFulfilled }) {
                console.log('Coupon API - Query started for vendorId:', arg);
                try {
                    const { data } = await queryFulfilled;
                    console.log('Coupon API - Query fulfilled with data length:', Array.isArray(data) ? data.length : 'not an array');
                } catch (err) {
                    console.error('Coupon API - Query failed:', err);
                }
            },
            transformResponse: (response: any) => {
                try {
                    console.log('Coupon API - transformResponse called');
                    if (!response) return [];
                    if (Array.isArray(response)) return response;
                    if (response.data && Array.isArray(response.data)) return response.data;
                    if (response.data?.coupons && Array.isArray(response.data.coupons)) return response.data.coupons;
                    if (response.data?.items && Array.isArray(response.data.items)) return response.data.items;
                    if (response.coupons && Array.isArray(response.coupons)) return response.coupons;
                    if (response.items && Array.isArray(response.items)) return response.items;
                    const deepFound = findCouponArrayDeep(response);
                    if (deepFound.length) {
                        return deepFound.map(normalizeCoupon);
                    }
                    return [];
                } catch (error) {
                    console.error('Coupon API - transformResponse error:', error);
                    return [];
                }
            },
            providesTags: (result) => {
                console.log('Coupon API - providesTags called with result count:', Array.isArray(result) ? result.length : 'not an array');
                const tags: any[] = [{ type: 'Coupon', id: 'LIST' }];
                if (Array.isArray(result)) {
                    result.forEach((item: any) => {
                        if (item && item.id) tags.push({ type: 'Coupon' as const, id: item.id });
                    });
                }
                return tags;
            },
        }),

        // Get coupon by ID
        getCouponById: builder.query<Coupon, string>({
            query: (id) => `/coupons/${id}`,
            providesTags: (result, error, id) => [{ type: 'Coupon', id }],
        }),

        // Create a new coupon
        createCoupon: builder.mutation<Coupon, CreateCouponRequest>({
            query: (couponData) => ({
                url: '/coupons',
                method: 'POST',
                body: couponData,
            }),
            invalidatesTags: [{ type: 'Coupon', id: 'LIST' }],
        }),

        // Assign coupon to buyer
        assignCoupon: builder.mutation<any, { id: string; buyerId: string }>({
            query: ({ id, buyerId }) => {
                console.log(`Assigning coupon ${id} to buyer ${buyerId}`);
                return {
                    url: `/coupons/${id}/assign`,
                    method: 'POST',
                    body: { buyerId },
                };
            },
            invalidatesTags: (result, error, { id }) => [{ type: 'Coupon', id }],
        }),

        // Deactivate coupon
        deactivateCoupon: builder.mutation<Coupon, string>({
            query: (id) => ({
                url: `/coupons/${id}/deactivate`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Coupon', id },
                { type: 'Coupon', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetCouponsByVendorQuery,
    useGetCouponByIdQuery,
    useCreateCouponMutation,
    useAssignCouponMutation,
    useDeactivateCouponMutation,
} = couponApiSlice;
