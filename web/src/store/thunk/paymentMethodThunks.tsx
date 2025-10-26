// src/store/thunk/paymentMethodThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { PaymentMethod } from '../slices/paymentMethodSlice';

// Interfaces
interface AttachPaymentMethodArgs {
    paymentMethodId: string;
}

interface SetDefaultPaymentMethodArgs {
    paymentMethodId: string;
}

interface DeletePaymentMethodArgs {
    paymentMethodId: string;
}

// --- Fetch Payment Methods Thunk ---
export const fetchPaymentMethods = createAsyncThunk<
    PaymentMethod[],
    void
>('paymentMethods/fetchPaymentMethods', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/api/payment-methods');
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch payment methods.');
    }
});

// --- Attach Payment Method Thunk ---
export const attachPaymentMethod = createAsyncThunk<
    { message: string },
    AttachPaymentMethodArgs
>('paymentMethods/attachPaymentMethod', async ({ paymentMethodId }, { rejectWithValue }) => {
    try {
        const response = await api.post('/api/payment-methods/attach', { paymentMethodId });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to attach payment method.');
    }
});

// --- Set Default Payment Method Thunk ---
export const setDefaultPaymentMethod = createAsyncThunk<
    { message: string },
    SetDefaultPaymentMethodArgs
>('paymentMethods/setDefaultPaymentMethod', async ({ paymentMethodId }, { rejectWithValue }) => {
    try {
        const response = await api.patch('/api/payment-methods/set-default', { paymentMethodId });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to set default payment method.');
    }
});

// --- Delete Payment Method Thunk ---
export const deletePaymentMethod = createAsyncThunk<
    { message: string },
    DeletePaymentMethodArgs
>('paymentMethods/deletePaymentMethod', async ({ paymentMethodId }, { rejectWithValue }) => {
    try {
        const response = await api.delete(`/api/payment-methods/${paymentMethodId}`);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to delete payment method.');
    }
});