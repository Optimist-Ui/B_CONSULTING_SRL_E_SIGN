// src/store/slices/paymentMethodSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { buildPaymentMethodExtraReducers } from '../extra-reducers/paymentMethodExtraReducers';

export interface PaymentMethod {
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    isDefault: boolean;
}

export interface PaymentMethodState {
    paymentMethods: PaymentMethod[];
    loading: boolean;
    error: string | null;
    isAttaching: boolean;
    isSettingDefault: boolean;
    isDeleting: string | null; // ID of the payment method being deleted
}

const initialState: PaymentMethodState = {
    paymentMethods: [],
    loading: false,
    error: null,
    isAttaching: false,
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