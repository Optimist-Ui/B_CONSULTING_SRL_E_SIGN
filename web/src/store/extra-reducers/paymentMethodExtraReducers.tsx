// src/store/extra-reducers/paymentMethodExtraReducers.ts
import { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { fetchPaymentMethods, createPaymentOrder, setDefaultPaymentMethod, deletePaymentMethod } from '../thunk/paymentMethodThunks';
import { PaymentMethodState } from '../slices/paymentMethodSlice';

export const buildPaymentMethodExtraReducers = (builder: ActionReducerMapBuilder<PaymentMethodState>) => {
    builder
        // --- Fetch Payment Methods Cases ---
        .addCase(fetchPaymentMethods.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
            state.loading = false;
            state.paymentMethods = action.payload;
            state.error = null;
        })
        .addCase(fetchPaymentMethods.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // --- Create Payment Order Cases (Viva Wallet) ---
        .addCase(createPaymentOrder.pending, (state) => {
            state.isCreatingOrder = true;
            state.error = null;
        })
        .addCase(createPaymentOrder.fulfilled, (state) => {
            state.isCreatingOrder = false;
            state.error = null;
            // User will be redirected to Viva Wallet checkout
        })
        .addCase(createPaymentOrder.rejected, (state, action) => {
            state.isCreatingOrder = false;
            state.error = action.payload as string;
        })

        // --- Set Default Payment Method Cases ---
        .addCase(setDefaultPaymentMethod.pending, (state) => {
            state.isSettingDefault = true;
            state.error = null;
        })
        .addCase(setDefaultPaymentMethod.fulfilled, (state) => {
            state.isSettingDefault = false;
            state.error = null;
            // Note: We'll refetch payment methods after successful default change
        })
        .addCase(setDefaultPaymentMethod.rejected, (state, action) => {
            state.isSettingDefault = false;
            state.error = action.payload as string;
        })

        // --- Delete Payment Method Cases ---
        .addCase(deletePaymentMethod.pending, (state, action) => {
            // Track which payment method is being deleted
            state.isDeleting = action.meta.arg.paymentSourceId;
            state.error = null;
        })
        .addCase(deletePaymentMethod.fulfilled, (state, action) => {
            state.isDeleting = null;
            state.error = null;
            // Remove the deleted payment method from the state
            const deletedId = action.meta.arg.paymentSourceId;
            state.paymentMethods = state.paymentMethods.filter((pm) => pm.id !== deletedId);
        })
        .addCase(deletePaymentMethod.rejected, (state, action) => {
            state.isDeleting = null;
            state.error = action.payload as string;
        });
};
