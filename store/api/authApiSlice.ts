import { buildApiUrl } from '@/services/apiConfig';
import { apiSlice } from './apiSlice';

const AUTH_FETCH_RETRY_DELAYS_MS = [1500, 4000, 8000];

const parseJsonResponse = async (response: Response) => {
    const text = await response.text();
    if (!text.trim()) return null;

    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
};

const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const buildFetchHeaders = (requiresAuth: boolean, accessToken?: string | null) => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(requiresAuth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
});

const createJsonMutationWithFallback = (
    url: string,
    method: "POST" | "PATCH" = "POST",
    requiresAuth = false,
    logLabel?: string,
    mapBody?: (data: any) => any,
) => ({
    async queryFn(data: any, api: any, extraOptions: any, baseQuery: any) {
        if (logLabel) {
            console.log(`${logLabel}:`, JSON.stringify(data));
        }

        const requestBody = mapBody ? mapBody(data) : data;
        const request = {
            url,
            method,
            body: requestBody,
        };

        const result = await baseQuery(request, api, extraOptions);
        const isFetchError = result?.error?.status === "FETCH_ERROR";
        const isMultipartBody =
            typeof FormData !== "undefined" && requestBody instanceof FormData;

        if (!isFetchError || isMultipartBody) {
            return result;
        }

        const absoluteUrl = buildApiUrl(url);
        if (!absoluteUrl) {
            return result;
        }

        const accessToken = (api.getState() as any)?.auth?.accessToken;
        const headers = buildFetchHeaders(requiresAuth, accessToken);
        let lastNetworkError: unknown = null;

        for (let attempt = 0; attempt <= AUTH_FETCH_RETRY_DELAYS_MS.length; attempt += 1) {
            try {
                console.warn(
                    `Retrying auth request with direct fetch (attempt ${attempt + 1}): ${absoluteUrl}`,
                );

                const fallbackResponse = await fetch(absoluteUrl, {
                    method,
                    headers,
                    body: JSON.stringify(requestBody ?? {}),
                });

                const fallbackJson = await parseJsonResponse(fallbackResponse);

                if (!fallbackResponse.ok) {
                    return {
                        error: {
                            status: fallbackResponse.status,
                            data:
                                fallbackJson ||
                                { message: fallbackResponse.statusText || "Request failed" },
                        },
                    };
                }

                return { data: fallbackJson };
            } catch (attemptError: any) {
                lastNetworkError = attemptError;
                const retryDelay = AUTH_FETCH_RETRY_DELAYS_MS[attempt];
                if (retryDelay === undefined) {
                    break;
                }

                console.warn(
                    `Auth fetch attempt ${attempt + 1} failed. Waiting ${retryDelay}ms before retry.`,
                );
                await delay(retryDelay);
            }
        }

        console.error(`Fallback auth request failed for ${absoluteUrl}:`, lastNetworkError);
        return result;
    },
});

const normalizeUpdateProfilePayload = (data: any) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;

    // Send only role-based profile objects and never send user/email for this route.
    const payload: any = {};
    if (data.buyer && typeof data.buyer === 'object' && !Array.isArray(data.buyer)) {
        payload.buyer = { ...data.buyer };
    }
    if (data.vendor && typeof data.vendor === 'object' && !Array.isArray(data.vendor)) {
        payload.vendor = { ...data.vendor };
    }

    return payload;
};

export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        registerBuyer: builder.mutation({
            query: (data) => ({
                url: '/auth/register/buyer',
                method: 'POST',
                body: data,
            }),
        }),
        register: builder.mutation(createJsonMutationWithFallback('/auth/register')),

        registerVendor: builder.mutation({
            query: (data) => ({
                url: '/auth/register/vendor',
                method: 'POST',
                body: data,
            }),
        }),
        login: builder.mutation(createJsonMutationWithFallback('/auth/login', 'POST', false, 'Login mutation called with')),
        googleAuth: builder.mutation(createJsonMutationWithFallback('/auth/google')),
        appleAuth: builder.mutation(createJsonMutationWithFallback('/auth/apple')),
        ForgotPasswordScreen: builder.mutation(createJsonMutationWithFallback('/auth/forgot-password')),
        OTPVerification: builder.mutation(createJsonMutationWithFallback('/auth/verify-otp')),
        SetNewPasswordScreen: builder.mutation(createJsonMutationWithFallback('/auth/reset-password')),
        getProfile: builder.query({
            query: () => '/auth/me?profile=true',
            providesTags: ['User'],
        }),
        getPartnerProfile: builder.query({
            query: (partnerUserId: string) => `/auth/partner/${partnerUserId}`,
        }),
        getUserVendorStatistics: builder.query({
            query: (_userId?: string) => '/auth/user-vendor-statistics',
            transformResponse: (response: any) => response?.data || response,
        }),
        updateProfile: builder.mutation({
            query: (data) => ({
                url: '/auth/me',
                method: 'PATCH',
                body: normalizeUpdateProfilePayload(data),
            }),
            invalidatesTags: ['User'],
        }),
        changePassword: builder.mutation(
            createJsonMutationWithFallback(
                '/auth/change-password',
                'PATCH',
                true,
                undefined,
                (data: any) => ({
                    currentPassword: data?.currentPassword || data?.oldPassword || '',
                    newPassword: data?.newPassword || '',
                    confirmPassword: data?.confirmPassword || data?.newPassword || '',
                }),
            ),
        ),
        switchProfile: builder.mutation(
            createJsonMutationWithFallback(
                '/auth/switch-profile',
                'POST',
                true,
                undefined,
                (targetRole: "buyer" | "vendor") => ({ targetRole }),
            ),
        ),
    }),
    overrideExisting: true,
});

export const {
    useRegisterMutation,
    useRegisterBuyerMutation,
    useRegisterVendorMutation,
    useLoginMutation,
    useGoogleAuthMutation,
    useAppleAuthMutation,
    useForgotPasswordScreenMutation,
    useOTPVerificationMutation,
    useSetNewPasswordScreenMutation,
    useGetProfileQuery,
    useGetPartnerProfileQuery,
    useGetUserVendorStatisticsQuery,
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useSwitchProfileMutation,
} = authApiSlice;
