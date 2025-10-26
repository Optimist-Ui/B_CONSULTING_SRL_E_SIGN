// ===== 2. Updated subscriptionThunks.ts =====
import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { Subscription, Invoice, SubscriptionStatus } from '../slices/subscriptionSlice';
import { IRootState } from '../index';

// Cache duration constants (in milliseconds)
const CACHE_DURATION = {
    STATUS: 5 * 60 * 1000, // 5 minutes
    DETAILS: 10 * 60 * 1000, // 10 minutes
    INVOICES: 30 * 60 * 1000, // 30 minutes
};

// --- Type Definitions for Thunk Arguments ---
interface CreateSubscriptionArgs {
    priceId: string;
    paymentMethodId: string;
}

interface StripeSubscriptionResponse {
    id: string;
    status: string;
    latest_invoice: {
        payment_intent?: {
            client_secret: string;
            status: string;
        };
    };
}

interface FetchSubscriptionStatusOptions {
    forceRefresh?: boolean;
}

interface FetchSubscriptionOptions {
    forceRefresh?: boolean;
}

// --- Helper Functions ---
const isCacheValid = (lastFetch: number | null, cacheDuration: number): boolean => {
    if (!lastFetch) return false;
    return Date.now() - lastFetch < cacheDuration;
};

// --- Thunks ---

/**
 Fetches subscription status with caching
 */
export const fetchSubscriptionStatus = createAsyncThunk<SubscriptionStatus, FetchSubscriptionStatusOptions | undefined, { state: IRootState }>(
    'subscription/fetchStatus',
    async (options = {}, { getState, rejectWithValue }) => {
        const state = getState();
        const { lastStatusFetch } = state.subscription;

        // Check cache validity unless force refresh is requested
        if (!options.forceRefresh && isCacheValid(lastStatusFetch, CACHE_DURATION.STATUS)) {
            // Return cached data by throwing a special error that we handle in extraReducers
            throw new Error('CACHE_HIT');
        }

        try {
            const response = await api.get('/api/plans/status');
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch subscription status.');
        }
    }
);

/**
 Creates a new subscription
 */
export const createSubscription = createAsyncThunk<StripeSubscriptionResponse, CreateSubscriptionArgs>('subscription/create', async ({ priceId, paymentMethodId }, { rejectWithValue }) => {
    try {
        const response = await api.post('/api/plans/create', { priceId, paymentMethodId });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to create subscription.');
    }
});

/**
 Fetches the user's current active subscription details with caching
 */
export const fetchSubscription = createAsyncThunk<Subscription, FetchSubscriptionOptions | undefined, { state: IRootState }>(
    'subscription/fetchCurrent',
    async (options = {}, { getState, rejectWithValue }) => {
        const state = getState();
        const { lastDetailsFetch } = state.subscription;

        // Check cache validity unless force refresh is requested
        if (!options.forceRefresh && isCacheValid(lastDetailsFetch, CACHE_DURATION.DETAILS)) {
            throw new Error('CACHE_HIT');
        }

        try {
            const response = await api.get('/api/plans/my-subscription');
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'No active subscription found.');
        }
    }
);

/**
 Cancels the user's subscription at the end of the current billing period
 */
export const cancelSubscription = createAsyncThunk('subscription/cancel', async (_, { rejectWithValue }) => {
    try {
        const response = await api.patch('/api/plans/cancel');
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to cancel subscription.');
    }
});

/**
 Reactivates a previously cancelled subscription
 */
export const reactivateSubscription = createAsyncThunk('subscription/reactivate', async (_, { rejectWithValue }) => {
    try {
        const response = await api.patch('/api/plans/reactivate');
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to reactivate subscription.');
    }
});

/**
 Fetches the user's invoice history
 */
export const fetchInvoices = createAsyncThunk<Invoice[]>('subscription/fetchInvoices', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/api/plans/invoices');
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch invoices.');
    }
});

/**
 Creates a new subscription WITH a 14-day free trial.
 */
export const createTrialSubscription = createAsyncThunk<StripeSubscriptionResponse, CreateSubscriptionArgs>('subscription/createTrial', async ({ priceId, paymentMethodId }, { rejectWithValue }) => {
    try {
        const response = await api.post('/api/plans/create-trial', { priceId, paymentMethodId });
        return response.data.data;
    } catch (error: any) {
        // The backend sends a clear error message for trial abuse, so we pass it on.
        return rejectWithValue(error.response?.data?.message || 'Failed to start free trial.');
    }
});

/**
 Ends the user's trial period immediately, converting it to a paid plan.
 */
export const endTrialEarly = createAsyncThunk('subscription/endTrial', async (_, { rejectWithValue }) => {
    try {
        const response = await api.patch('/api/plans/end-trial');
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to activate your subscription.');
    }
});
