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

const normalizeCoupon = (coupon: any) => {
    const source = coupon?.coupon && typeof coupon.coupon === 'object'
        ? { ...coupon, ...coupon.coupon, assignment: coupon }
        : coupon;

    return {
        ...source,
        id: source?.id || source?._id || source?.couponId || source?.coupon?.id || source?.coupon?._id || '',
        assignmentId: coupon?.coupon ? coupon?.id || coupon?._id || '' : undefined,
        code: source?.code || source?.couponCode || source?.coupon?.code || source?.coupon?.couponCode || '',
        discountType: source?.discountType || source?.discount_type || source?.type || source?.coupon?.discountType || 'fixed',
        discountValue: Number(source?.discountValue ?? source?.discount ?? source?.value ?? source?.coupon?.discountValue ?? 0),
        minPurchaseAmount: Number(source?.minPurchaseAmount ?? source?.minimumPurchase ?? source?.min_purchase_amount ?? source?.coupon?.minPurchaseAmount ?? 0),
        validFrom: source?.validFrom || source?.startDate || source?.fromDate || source?.coupon?.validFrom || source?.createdAt,
        validUntil: source?.validUntil || source?.endDate || source?.toDate || source?.expiresAt || source?.coupon?.validUntil,
        isActive: source?.isActive !== undefined ? source.isActive : source?.active !== undefined ? source.active : true,
        vendorId: source?.vendorId || source?.coupon?.vendorId || '',
        isUsed: coupon?.isUsed ?? source?.isUsed ?? false,
    };
};

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
        getMyCoupons: builder.query({
            query: () => '/coupons',
            transformResponse: (response: any) => {
                try {
                    console.log('Coupon API - getMyCoupons transformResponse called');
                    if (!response) return [];
                    if (Array.isArray(response)) return response.map(normalizeCoupon);
                    if (response.data && Array.isArray(response.data)) return response.data.map(normalizeCoupon);
                    if (response.data?.coupons && Array.isArray(response.data.coupons)) return response.data.coupons.map(normalizeCoupon);
                    if (response.data?.items && Array.isArray(response.data.items)) return response.data.items.map(normalizeCoupon);
                    if (response.coupons && Array.isArray(response.coupons)) return response.coupons.map(normalizeCoupon);
                    if (response.items && Array.isArray(response.items)) return response.items.map(normalizeCoupon);
                    const deepFound = findCouponArrayDeep(response);
                    if (deepFound.length) {
                        return deepFound.map(normalizeCoupon);
                    }
                    return [];
                } catch (error) {
                    console.error('Coupon API - getMyCoupons transformResponse error:', error);
                    return [];
                }
            },
            providesTags: (result) => {
                const tags: any[] = [{ type: 'Coupon', id: 'LIST' }];
                if (Array.isArray(result)) {
                    result.forEach((item: any) => {
                        if (item && item.id) tags.push({ type: 'Coupon' as const, id: item.id });
                    });
                }
                return tags;
            },
        }),

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
                    if (Array.isArray(response)) return response.map(normalizeCoupon);
                    if (response.data && Array.isArray(response.data)) return response.data.map(normalizeCoupon);
                    if (response.data?.coupons && Array.isArray(response.data.coupons)) return response.data.coupons.map(normalizeCoupon);
                    if (response.data?.items && Array.isArray(response.data.items)) return response.data.items.map(normalizeCoupon);
                    if (response.coupons && Array.isArray(response.coupons)) return response.coupons.map(normalizeCoupon);
                    if (response.items && Array.isArray(response.items)) return response.items.map(normalizeCoupon);
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
    useGetMyCouponsQuery,
    useGetCouponsByVendorQuery,
    useGetCouponByIdQuery,
    useCreateCouponMutation,
    useAssignCouponMutation,
    useDeactivateCouponMutation,
} = couponApiSlice;
