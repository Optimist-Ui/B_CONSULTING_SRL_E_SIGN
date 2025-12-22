// src/store/slices/subscriptionSlice.ts - UPDATED WITH INVOICE URL

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
    planPrice: number | string;
    cancelAtPeriodEnd: boolean;
}

// ✅ UPDATED: Viva Wallet invoice structure WITH invoiceUrl
export interface Invoice {
    id: string; // Viva Wallet transaction ID
    date: string; // Transaction date
    amount: string; // Formatted amount (e.g., "9.99")
    currency: string; // "EUR"
    status: 'paid' | 'failed' | 'pending' | 'open' | 'void' | 'uncollectible';
    description: string; // Transaction description
    transactionType: 'new_subscription' | 'renewal' | 'trial_conversion' | 'plan_change' | 'payment';
    cardLast4: string; // Last 4 digits of card used
    invoiceUrl?: string; // ✅ NEW: URL to view/download invoice from Viva Wallet
}

// Shape of the entire slice state
export interface SubscriptionState {
    subscription: Subscription | null;
    subscriptionStatus: SubscriptionStatus | null;
    invoices: Invoice[];
    currentInvoice: InvoiceDetail | null;
    loading: boolean;
    error: string | null;
    // Separate loading flags for granular UI feedback
    isFetchingDetails: boolean;
    isFetchingStatus: boolean;
    isCreating: boolean;
    isCancelling: boolean;
    isReactivating: boolean;
    isFetchingInvoices: boolean;
    isFetchingInvoiceDetail: boolean;
    isEndingTrial: boolean;
    // Cache control
    lastStatusFetch: number | null;
    lastDetailsFetch: number | null;
}

const initialState: SubscriptionState = {
    subscription: null,
    subscriptionStatus: null,
    invoices: [],
    currentInvoice: null,
    loading: false,
    error: null,
    isFetchingDetails: false,
    isFetchingStatus: false,
    isCreating: false,
    isCancelling: false,
    isReactivating: false,
    isFetchingInvoices: false,
    isFetchingInvoiceDetail: false, // ✅ NEW
    isEndingTrial: false,
    lastStatusFetch: null,
    lastDetailsFetch: null,
};

// ✅ NEW: Detailed invoice structure
export interface InvoiceDetail {
    // Transaction Details
    id: string;
    date: string;
    amount: string;
    currency: string;
    status: 'paid' | 'failed' | 'pending' | 'open' | 'void' | 'uncollectible';
    description: string;
    transactionType: 'new_subscription' | 'renewal' | 'trial_conversion' | 'plan_change' | 'payment';

    // Payment Details
    cardLast4: string;
    cardType: string;

    // Customer Details
    customerName: string;
    customerEmail: string;

    // Subscription Details
    planName: string;
    documentLimit: number;

    // Billing Details
    billingAddress?: {
        country: string;
        city: string;
    };

    // Additional metadata
    orderCode?: string;
    invoiceNumber: string;

    // Full transaction details (optional)
    fullDetails?: any;
}

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
        clearCurrentInvoice: (state) => {
            state.currentInvoice = null;
        },
    },
    extraReducers: (builder) => {
        buildSubscriptionExtraReducers(builder);
        builder.addCase(logout, () => {
            return initialState;
        });
    },
});

export const { clearSubscriptionError, resetSubscriptionState, invalidateStatusCache, invalidateDetailsCache, clearCurrentInvoice } = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
