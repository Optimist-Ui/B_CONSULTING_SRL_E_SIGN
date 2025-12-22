// src/store/slices/paymentMethodSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { buildPaymentMethodExtraReducers } from '../extra-reducers/paymentMethodExtraReducers';

export interface PaymentMethod {
    id: string; // Viva Wallet payment source ID (e.g., "viva_abc123")
    cardType: string; // "Visa", "Mastercard", "Amex", etc.
    last4: string; // Last 4 digits of card
    exp_month: string; // Expiry month
    exp_year: string; // Expiry year
    isDefault: boolean; // Whether this is the default payment method
}

export interface PaymentMethodState {
    paymentMethods: PaymentMethod[];
    loading: boolean;
    error: string | null;
    isCreatingOrder: boolean; // For creating Viva Wallet payment order
    isSettingDefault: boolean;
    isDeleting: string | null; // ID of the payment method being deleted
}

const initialState: PaymentMethodState = {
    paymentMethods: [],
    loading: false,
    error: null,
    isCreatingOrder: false,
    isSettingDefault: false,
    isDeleting: null,
};

const paymentMethodSlice = createSlice({
    name: 'paymentMethods',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setDeleting: (state, action) => {
            state.isDeleting = action.payload;
        },
    },
    extraReducers: (builder) => {
        buildPaymentMethodExtraReducers(builder);
    },
});

export const { clearError, setDeleting } = paymentMethodSlice.actions;
export default paymentMethodSlice.reducer;
