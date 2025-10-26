// ===== 3. Updated subscriptionExtraReducers.ts =====
import { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import {
    createSubscription,
    fetchSubscription,
    fetchSubscriptionStatus,
    cancelSubscription,
    reactivateSubscription,
    fetchInvoices,
    createTrialSubscription,
    endTrialEarly,
} from '../thunk/subscriptionThunks'; // --- Import new thunk
import { SubscriptionState } from '../slices/subscriptionSlice';

export const buildSubscriptionExtraReducers = (builder: ActionReducerMapBuilder<SubscriptionState>) => {
    builder
        // --- Fetch Subscription Status Cases ---
        .addCase(fetchSubscriptionStatus.pending, (state) => {
            state.isFetchingStatus = true;
            state.error = null;
        })
        .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
            state.isFetchingStatus = false;
            state.subscriptionStatus = action.payload;
            state.lastStatusFetch = Date.now();
        })
        .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
            state.isFetchingStatus = false;
            if (action.error.message !== 'CACHE_HIT') {
                state.error = action.payload as string;
            }
        })

        // --- Create Subscription & Trial Cases ---
        .addCase(createSubscription.pending, (state) => {
            state.isCreating = true;
            state.error = null;
        })
        .addCase(createSubscription.fulfilled, (state) => {
            state.isCreating = false;
            state.lastStatusFetch = null;
            state.lastDetailsFetch = null;
        })
        .addCase(createSubscription.rejected, (state, action) => {
            state.isCreating = false;
            state.error = action.payload as string;
        })
        .addCase(createTrialSubscription.pending, (state) => {
            state.isCreating = true;
            state.error = null;
        })
        .addCase(createTrialSubscription.fulfilled, (state) => {
            state.isCreating = false;
            state.lastStatusFetch = null;
            state.lastDetailsFetch = null;
        })
        .addCase(createTrialSubscription.rejected, (state, action) => {
            state.isCreating = false;
            state.error = action.payload as string;
        })

        // --- Fetch Current Subscription Cases ---
        .addCase(fetchSubscription.pending, (state) => {
            state.isFetchingDetails = true;
            state.error = null;
        })
        .addCase(fetchSubscription.fulfilled, (state, action) => {
            state.isFetchingDetails = false;
            state.subscription = action.payload;
            state.lastDetailsFetch = Date.now();
        })
        .addCase(fetchSubscription.rejected, (state, action) => {
            state.isFetchingDetails = false;
            if (action.error.message !== 'CACHE_HIT') {
                state.subscription = null;
                state.error = action.payload as string;
            }
        })

        // --- Cancel Subscription Cases ---
        .addCase(cancelSubscription.pending, (state) => {
            state.isCancelling = true;
            state.error = null;
        })
        .addCase(cancelSubscription.fulfilled, (state, action) => {
            state.isCancelling = false;
            if (state.subscription) {
                state.subscription.cancelAtPeriodEnd = action.payload.cancelAtPeriodEnd;
            }
            state.lastStatusFetch = null;
        })
        .addCase(cancelSubscription.rejected, (state, action) => {
            state.isCancelling = false;
            state.error = action.payload as string;
        })

        // --- Reactivate Subscription Cases ---
        .addCase(reactivateSubscription.pending, (state) => {
            state.isReactivating = true;
            state.error = null;
        })
        .addCase(reactivateSubscription.fulfilled, (state, action) => {
            state.isReactivating = false;
            if (state.subscription) {
                state.subscription.cancelAtPeriodEnd = action.payload.cancelAtPeriodEnd;
            }
            state.lastStatusFetch = null;
        })
        .addCase(reactivateSubscription.rejected, (state, action) => {
            state.isReactivating = false;
            state.error = action.payload as string;
        })

        // --- NEW CASES for End Trial ---
        .addCase(endTrialEarly.pending, (state) => {
            state.isEndingTrial = true;
            state.error = null;
        })
        .addCase(endTrialEarly.fulfilled, (state) => {
            state.isEndingTrial = false;
            // CRITICAL: Invalidate both caches so the UI fetches the
            // new 'active' status and details immediately.
            state.lastStatusFetch = null;
            state.lastDetailsFetch = null;
        })
        .addCase(endTrialEarly.rejected, (state, action) => {
            state.isEndingTrial = false;
            state.error = action.payload as string;
        })

        // --- Fetch Invoices Cases ---
        .addCase(fetchInvoices.pending, (state) => {
            state.isFetchingInvoices = true;
            state.error = null;
        })
        .addCase(fetchInvoices.fulfilled, (state, action) => {
            state.isFetchingInvoices = false;
            state.invoices = action.payload;
        })
        .addCase(fetchInvoices.rejected, (state, action) => {
            state.isFetchingInvoices = false;
            state.error = action.payload as string;
        });
};
