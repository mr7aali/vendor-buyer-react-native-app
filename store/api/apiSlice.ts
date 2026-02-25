import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { logOut, setCredentials } from '../slices/authSlice';

const mutex = new Mutex();
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
const apiUrl = rawApiUrl.trim().replace(/\/+$/, '');

if (!apiUrl) {
    console.error('EXPO_PUBLIC_API_URL is missing. Auth requests will fail until it is set.');
}

const baseQuery = fetchBaseQuery({
    baseUrl: apiUrl,
    prepareHeaders: async (headers, { getState }) => {
        const state = getState() as any;
        const reduxToken = state.auth?.accessToken;
        const persistedToken = await AsyncStorage.getItem('accessToken');
        const token = reduxToken || persistedToken;
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
                    api.dispatch(logOut());
                    return result;
                }

                const refreshResult = await baseQuery(
                    {
                        url: '/auth/refresh-token',
                        method: 'POST',
                        body: { refreshToken },
                    },
                    api,
                    extraOptions
                );

                if (refreshResult.data) {
                    const data = refreshResult.data as any;
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
                        refreshToken: data.refreshToken
                    }));

                    result = await baseQuery(args, api, extraOptions);
                } else {
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
