// ===== 1. Updated subscriptionSlice.ts =====
import { createSlice } from '@reduxjs/toolkit';
import { buildSubscriptionExtraReducers } from '../extra-reducers/subscriptionExtraReducers';
import { logout } from './authSlice';

// Shape of the subscription status response
export interface SubscriptionStatus {
    hasActiveSubscription: boolean;
    canCreatePackages: boolean;
    reason: string;
    status: 'ACTIVE' | 'INACTIVE' | 'LIMIT_REACHED' | 'EXPIRED' | 'PENDING';
    documentsUsed?: number;
    documentLimit?: number;
}

// Shape of the user's active subscription
export interface Subscription {
    planName: string;
    documentLimit: number;
    documentsUsed: number;
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
    renewsAt: string;
    startDate: string;
    trialEndDate?: string | null;
    isTrialing: boolean;
    planInterval: 'year' | 'month';
    planPrice: number;
    cancelAtPeriodEnd: boolean;
}

// Shape of a single invoice record
export interface Invoice {
    id: string;
    createdAt: string;
    amount: string;
    currency: string;
    status: string;
    downloadUrl: string;
}

// Shape of the entire slice state
export interface SubscriptionState {
    subscription: Subscription | null;
    subscriptionStatus: SubscriptionStatus | null;
    invoices: Invoice[];
    loading: boolean;
    error: string | null;
    // Separate loading flags for granular UI feedback
    isFetchingDetails: boolean;
    isFetchingStatus: boolean;
    isCreating: boolean;
    isCancelling: boolean;
    isReactivating: boolean;
    isFetchingInvoices: boolean;
    isEndingTrial: boolean;
    // Cache control
    lastStatusFetch: number | null;
    lastDetailsFetch: number | null;
}

const initialState: SubscriptionState = {
    subscription: null,
    subscriptionStatus: null,
    invoices: [],
    loading: false,
    error: null,
    isFetchingDetails: false,
    isFetchingStatus: false,
    isCreating: false,
    isCancelling: false,
    isReactivating: false,
    isFetchingInvoices: false,
    isEndingTrial: false,
    lastStatusFetch: null,
    lastDetailsFetch: null,
};

const subscriptionSlice = createSlice({
    name: 'subscription',
    initialState,
    reducers: {
        clearSubscriptionError: (state) => {
            state.error = null;
        },
        resetSubscriptionState: () => initialState,
        // Manual cache invalidation
        invalidateStatusCache: (state) => {
            state.lastStatusFetch = null;
        },
        invalidateDetailsCache: (state) => {
            state.lastDetailsFetch = null;
        },
    },
    extraReducers: (builder) => {
        buildSubscriptionExtraReducers(builder);
        builder.addCase(logout, () => {
            // Return the initialState to completely reset the slice
            return initialState;
        });
    },
});

export const { clearSubscriptionError, resetSubscriptionState, invalidateStatusCache, invalidateDetailsCache } = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
