import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';
import authReducer from './slices/authSlice';
import languageReducer from './slices/languageSlice';
import registrationReducer from './slices/registrationSlice';

const combinedReducer = combineReducers({
    [apiSlice.reducerPath]: apiSlice.reducer,
    registration: registrationReducer,
    auth: authReducer,
    language: languageReducer,
});

const resolveUserId = (user: any) =>
    user?.userId || user?.id || user?._id || user?.buyer?.userId || user?.vendor?.userId;

const rootReducer = (state: any, action: any) => {
    if (action.type === 'auth/logOut') {
        // Keep non-auth app preferences (e.g. language) while clearing auth/session state.
        const preservedLanguage = state?.language;
        state = preservedLanguage ? { language: preservedLanguage } : undefined;
    }

    // If credentials switch to another account, clear RTK Query cache to avoid data bleed.
    if (action.type === 'auth/setCredentials') {
        const prevUserId = resolveUserId(state?.auth?.user);
        const nextUserId = resolveUserId(action?.payload?.user);
        if (prevUserId && nextUserId && String(prevUserId) !== String(nextUserId)) {
            state = {
                ...state,
                [apiSlice.reducerPath]: undefined,
            };
        }
    }
    return combinedReducer(state, action);
};

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
