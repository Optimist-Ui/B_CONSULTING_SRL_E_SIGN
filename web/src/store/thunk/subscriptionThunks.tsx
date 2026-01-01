// src/store/thunk/subscriptionThunks.ts - VIVA WALLET VERSION
import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { Subscription, Invoice, SubscriptionStatus, InvoiceDetail } from '../slices/subscriptionSlice';
import { IRootState } from '../index';

// Cache duration constants (in milliseconds)
const CACHE_DURATION = {
    STATUS: 5 * 60 * 1000, // 5 minutes
    DETAILS: 10 * 60 * 1000, // 10 minutes
    INVOICES: 30 * 60 * 1000, // 30 minutes
};

// --- Type Definitions for Thunk Arguments ---
interface CreateSubscriptionArgs {
    planId: string; // Changed from priceId to planId
    billingInterval?: 'month' | 'year';
    paymentMethodId: string;
}

interface CreateTrialSubscriptionArgs {
    planId: string;
    paymentMethodId: string; // Viva Wallet payment source ID
}

interface FetchSubscriptionStatusOptions {
    forceRefresh?: boolean;
}

interface FetchSubscriptionOptions {
    forceRefresh?: boolean;
}

interface VivaWalletSubscriptionResponse {
    id: string;
    status: string;
    effectiveLimit?: number;
    message?: string;
}

// --- Helper Functions ---
const isCacheValid = (lastFetch: number | null, cacheDuration: number): boolean => {
    if (!lastFetch) return false;
    return Date.now() - lastFetch < cacheDuration;
};

// --- Thunks ---

/**
 * Fetches subscription status with caching
 */
export const fetchSubscriptionStatus = createAsyncThunk<SubscriptionStatus, FetchSubscriptionStatusOptions | undefined, { state: IRootState }>(
    'subscription/fetchStatus',
    async (options = {}, { getState, rejectWithValue }) => {
        const state = getState();
        const { lastStatusFetch } = state.subscription;

        // Check cache validity unless force refresh is requested
        if (!options.forceRefresh && isCacheValid(lastStatusFetch, CACHE_DURATION.STATUS)) {
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
 * Creates a new subscription with Viva Wallet
 */
export const createSubscription = createAsyncThunk<VivaWalletSubscriptionResponse, CreateSubscriptionArgs>(
    'subscription/create',
    async ({ planId, billingInterval = 'month', paymentMethodId }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/plans/create', {
                planId,
                billingInterval,
                paymentMethodId,
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to create subscription.');
        }
    }
);

/**
 * Creates a trial subscription with Viva Wallet
 */
export const createTrialSubscription = createAsyncThunk<VivaWalletSubscriptionResponse, CreateTrialSubscriptionArgs>(
    'subscription/createTrial',
    async ({ planId, paymentMethodId }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/plans/create-trial', {
                planId,
                paymentMethodId,
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to start free trial.');
        }
    }
);

/**
 * Ends trial early and converts to paid subscription
 */
export const endTrialEarly = createAsyncThunk('subscription/endTrial', async (_, { rejectWithValue }) => {
    try {
        const response = await api.patch('/api/plans/end-trial');
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to activate your subscription.');
    }
});

/**
 * Fetches the user's current active subscription details with caching
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
 * Cancels the user's subscription at the end of the current billing period
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
 * Reactivates a previously cancelled subscription
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
 * Fetches the user's invoice history from Viva Wallet
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
 * ✅ NEW: Fetches detailed information for a specific invoice
 */
export const fetchInvoiceDetail = createAsyncThunk<InvoiceDetail, string>('subscription/fetchInvoiceDetail', async (invoiceId: string, { rejectWithValue }) => {
    try {
        const response = await api.get(`/api/plans/invoices/${invoiceId}`);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch invoice details.');
    }
});
