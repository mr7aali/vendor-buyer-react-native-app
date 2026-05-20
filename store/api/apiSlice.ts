import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { apiBaseUrl } from '@/services/apiConfig';
import { Mutex } from 'async-mutex';
import { clearPersistedAuthState } from '../../services/authStorage';
import { logOut, setCredentials } from '../slices/authSlice';

const mutex = new Mutex();
const extractAuthPayload = (payload: any) => payload?.data ?? payload;

if (!apiBaseUrl) {
    console.error('EXPO_PUBLIC_API_URL is missing. Auth requests will fail until it is set.');
}

const baseQuery = fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: async (headers, { getState, endpoint }) => {
        const publicAuthEndpoints = new Set([
            'register',
            'login',
            'googleAuth',
            'appleAuth',
            'ForgotPasswordScreen',
            'OTPVerification',
            'SetNewPasswordScreen',
        ]);

        if (publicAuthEndpoints.has(String(endpoint || ''))) {
            headers.delete('Authorization');
            return headers;
        }

        const state = getState() as any;
        const token = state.auth?.accessToken;
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
    await mutex.waitForUnlock();
    let result = await baseQuery(args, api, extraOptions);

    // Log query results to debug the map error
    if (args?.url?.includes('coupons')) {
        console.log('Coupon API Raw Result status:', result?.error?.status || 'success');
        if (result?.error) {
            console.log('Coupon API Error details keys:', Object.keys(result.error));
        }
    }

    if (result.error && result.error.status === 401) {
        if (!mutex.isLocked()) {
            const release = await mutex.acquire();
            try {
                const refreshToken = (api.getState() as any).auth.refreshToken;
                if (!refreshToken) {
                    await clearPersistedAuthState();
                    api.dispatch(logOut());
                    return result;
                }

                const refreshResult = await baseQuery(
                    {
                        url: '/auth/refresh',
                        method: 'POST',
                        body: { refreshToken },
                    },
                    api,
                    extraOptions
                );

                if (refreshResult.data) {
                    const data = extractAuthPayload(refreshResult.data);
                    const user = (api.getState() as any).auth.user;

                    // Sync with AsyncStorage for persistence
                    if (data.accessToken) {
                        AsyncStorage.setItem('accessToken', data.accessToken);
                    }
                    if (data.refreshToken) {
                        AsyncStorage.setItem('refreshToken', data.refreshToken);
                    }

                    api.dispatch(setCredentials({
                        user,
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken,
                        availableProfiles: (api.getState() as any).auth.availableProfiles ?? null,
                    }));

                    result = await baseQuery(args, api, extraOptions);
                } else {
                    await clearPersistedAuthState();
                    api.dispatch(logOut());
                }
            } finally {
                release();
            }
        } else {
            await mutex.waitForUnlock();
            result = await baseQuery(args, api, extraOptions);
        }
    }
    return result;
};

// Define a service using a base URL and expected endpoints
export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Category', 'Product', 'Order', 'Cart', 'User', 'Review', 'Chat', 'Coupon', 'Payment', 'Connection', 'Notification'], // Define tag types for invalidation here if needed
    endpoints: (builder) => ({}),
});

export const { } = apiSlice;
