// src/store/thunk/paymentMethodThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { PaymentMethod } from '../slices/paymentMethodSlice';

// Interfaces
interface CreatePaymentOrderArgs {
    name: string;
    email: string;
    returnUrl: string;
}

interface CreatePaymentOrderResponse {
    orderCode: string;
    checkoutUrl: string;
}

interface SetDefaultPaymentMethodArgs {
    paymentSourceId: string;
}

interface DeletePaymentMethodArgs {
    paymentSourceId: string;
}

// --- Fetch Payment Methods Thunk ---
export const fetchPaymentMethods = createAsyncThunk<PaymentMethod[], void>('paymentMethods/fetchPaymentMethods', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/api/payment-methods');
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch payment methods.');
    }
});

// --- Create Payment Order Thunk (Viva Wallet) ---
export const createPaymentOrder = createAsyncThunk<CreatePaymentOrderResponse, CreatePaymentOrderArgs>('paymentMethods/createPaymentOrder', async ({ name, email, returnUrl }, { rejectWithValue }) => {
    try {
        const response = await api.post('/api/payment-methods/create-order', {
            name,
            email,
            returnUrl,
        });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to create payment order.');
    }
});

// --- Set Default Payment Method Thunk ---
export const setDefaultPaymentMethod = createAsyncThunk<{ message: string }, SetDefaultPaymentMethodArgs>(
    'paymentMethods/setDefaultPaymentMethod',
    async ({ paymentSourceId }, { rejectWithValue }) => {
        try {
            const response = await api.patch('/api/payment-methods/set-default', { paymentSourceId });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to set default payment method.');
        }
    }
);

// --- Delete Payment Method Thunk ---
export const deletePaymentMethod = createAsyncThunk<{ message: string }, DeletePaymentMethodArgs>('paymentMethods/deletePaymentMethod', async ({ paymentSourceId }, { rejectWithValue }) => {
    try {
        const response = await api.delete(`/api/payment-methods/${paymentSourceId}`);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to delete payment method.');
    }
});
