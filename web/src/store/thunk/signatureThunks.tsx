// signatureThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { ParticipantPackageView } from '../slices/participantSlice';
import { IRootState } from '../../store';

interface OtpRequestParams {
    packageId: string;
    participantId: string;
    fieldId: string;
    email: string;
}

interface SmsOtpRequestParams {
    packageId: string;
    participantId: string;
    fieldId: string;
    phone: string;
}

interface OtpVerifyParams {
    packageId: string;
    participantId: string;
    fieldId: string;
    otp: string;
}

interface OtpVerifyResponse {
    message: string;
    package: ParticipantPackageView;
}

// Email OTP thunks (existing)
export const sendSignatureOtp = createAsyncThunk<void, Omit<OtpRequestParams, 'participantId'>, { state: IRootState }>(
    'participant/sendSignatureOtp',
    async ({ packageId, fieldId, email }, { getState, rejectWithValue }) => {
        const state = getState();
        const participantId = state.participant.uiState.activeParticipantId;
        if (!participantId) {
            return rejectWithValue('Participant ID not found.');
        }
        try {
            await api.post(`/api/packages/participant/${packageId}/${participantId}/send-otp`, { fieldId, email });
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to send OTP.');
        }
    }
);

export const verifySignatureOtp = createAsyncThunk<OtpVerifyResponse, Omit<OtpVerifyParams, 'participantId'>, { state: IRootState }>(
    'participant/verifySignatureOtp',
    async ({ packageId, fieldId, otp }, { getState, rejectWithValue }) => {
        const state = getState();
        const participantId = state.participant.uiState.activeParticipantId;
        if (!participantId) {
            return rejectWithValue('Participant ID not found.');
        }
        try {
            const response = await api.post(`/api/packages/participant/${packageId}/${participantId}/verify-otp`, { fieldId, otp });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to verify OTP.');
        }
    }
);

// SMS OTP thunks (new)
export const sendSignatureSmsOtp = createAsyncThunk<void, Omit<SmsOtpRequestParams, 'participantId'>, { state: IRootState }>(
    'participant/sendSignatureSmsOtp',
    async ({ packageId, fieldId, phone }, { getState, rejectWithValue }) => {
        const state = getState();
        const participantId = state.participant.uiState.activeParticipantId;
        if (!participantId) {
            return rejectWithValue('Participant ID not found.');
        }
        try {
            await api.post(`/api/packages/participant/${packageId}/${participantId}/send-sms-otp`, { fieldId, phone });
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to send SMS OTP.');
        }
    }
);

export const verifySignatureSmsOtp = createAsyncThunk<OtpVerifyResponse, Omit<OtpVerifyParams, 'participantId'>, { state: IRootState }>(
    'participant/verifySignatureSmsOtp',
    async ({ packageId, fieldId, otp }, { getState, rejectWithValue }) => {
        const state = getState();
        const participantId = state.participant.uiState.activeParticipantId;
        if (!participantId) {
            return rejectWithValue('Participant ID not found.');
        }
        try {
            const response = await api.post(`/api/packages/participant/${packageId}/${participantId}/verify-sms-otp`, { fieldId, otp });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to verify SMS OTP.');
        }
    }
);
