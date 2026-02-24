import { apiSlice } from './apiSlice';

interface Review {
    _id: string;
    user: {
        _id: string;
        fullName: string;
        profilePhotoUrl?: string;
    };
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
}

interface ReviewsResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: {
        reviews: Review[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        ratingDistribution: {
            1: number;
            2: number;
            3: number;
            4: number;
            5: number;
        };
    };
}

export const reviewApiSlice = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getProductReviews: builder.query<ReviewsResponse, { productId: string; page?: number; limit?: number }>({
            query: ({ productId, page = 1, limit = 10 }) => `/reviews/product/${productId}?page=${page}&limit=${limit}`,
            providesTags: (result, error, { productId }) => [
                { type: 'Review', id: productId },
                { type: 'Review', id: 'LIST' }
            ],
        }),
        getBuyerReviews: builder.query<ReviewsResponse, void>({
            query: () => '/reviews/buyer/vendors',
            providesTags: [{ type: 'Review', id: 'BUYER_LIST' }],
        }),
        createReview: builder.mutation<any, { productId: string; rating: number; comment?: string }>({
            query: (body) => ({
                url: '/reviews/product',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { productId }) => [
                { type: 'Review', id: productId },
                { type: 'Review', id: 'LIST' },
                { type: 'Review', id: 'BUYER_LIST' }
            ],
        }),
        updateReview: builder.mutation<any, { reviewId: string; rating?: number; comment?: string }>({
            query: ({ reviewId, ...body }) => ({
                url: `/reviews/product/${reviewId}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (result, error, { reviewId }) => [
                { type: 'Review', id: reviewId },
                { type: 'Review', id: 'LIST' },
                { type: 'Review', id: 'BUYER_LIST' }
            ],
        }),
        deleteReview: builder.mutation<any, string>({
            query: (reviewId) => ({
                url: `/reviews/product/${reviewId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, reviewId) => [
                { type: 'Review', id: reviewId },
                { type: 'Review', id: 'LIST' },
                { type: 'Review', id: 'BUYER_LIST' }
            ],
        }),
    }),
});

export const {
    useGetProductReviewsQuery,
    useGetBuyerReviewsQuery,
    useCreateReviewMutation,
    useUpdateReviewMutation,
    useDeleteReviewMutation,
} = reviewApiSlice;
