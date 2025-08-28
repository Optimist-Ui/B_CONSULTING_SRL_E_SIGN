// signatureExtraReducers.ts
import { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { ParticipantState } from '../slices/participantSlice';
import { sendSignatureOtp, verifySignatureOtp, sendSignatureSmsOtp, verifySignatureSmsOtp } from '../thunk/signatureThunks';

export const buildSignatureExtraReducers = (builder: ActionReducerMapBuilder<ParticipantState>) => {
    builder
        // Email OTP - Send OTP states
        .addCase(sendSignatureOtp.pending, (state) => {
            state.uiState.signatureLoading = true;
            state.uiState.signatureError = null;
        })
        .addCase(sendSignatureOtp.fulfilled, (state) => {
            state.uiState.signatureLoading = false;
            state.uiState.signingStep = 'otp'; // Move to OTP entry step
        })
        .addCase(sendSignatureOtp.rejected, (state, action) => {
            state.uiState.signatureLoading = false;
            state.uiState.signatureError = action.payload as string;
        })

        // Email OTP - Verify OTP states
        .addCase(verifySignatureOtp.pending, (state) => {
            state.uiState.signatureLoading = true;
            state.uiState.signatureError = null;
        })
        .addCase(verifySignatureOtp.fulfilled, (state, action) => {
            state.uiState.signatureLoading = false;
            state.packageData = action.payload.package;
            const initialValues: { [key: string]: any } = {};
            action.payload.package.fields.forEach((field) => {
                if (field.value !== undefined) {
                    initialValues[field.id] = field.value;
                }
            });
            state.fieldValues = initialValues;
            state.uiState.signingStep = 'success';
            state.uiState.activeParticipantId = null; // Reset after success
        })
        .addCase(verifySignatureOtp.rejected, (state, action) => {
            state.uiState.signatureLoading = false;
            state.uiState.signatureError = action.payload as string;
        })

        // SMS OTP - Send SMS OTP states
        .addCase(sendSignatureSmsOtp.pending, (state) => {
            state.uiState.signatureLoading = true;
            state.uiState.signatureError = null;
        })
        .addCase(sendSignatureSmsOtp.fulfilled, (state) => {
            state.uiState.signatureLoading = false;
            state.uiState.signingStep = 'otp'; // Move to OTP entry step
        })
        .addCase(sendSignatureSmsOtp.rejected, (state, action) => {
            state.uiState.signatureLoading = false;
            state.uiState.signatureError = action.payload as string;
        })

        // SMS OTP - Verify SMS OTP states
        .addCase(verifySignatureSmsOtp.pending, (state) => {
            state.uiState.signatureLoading = true;
            state.uiState.signatureError = null;
        })
        .addCase(verifySignatureSmsOtp.fulfilled, (state, action) => {
            state.uiState.signatureLoading = false;
            state.packageData = action.payload.package;
            const initialValues: { [key: string]: any } = {};
            action.payload.package.fields.forEach((field) => {
                if (field.value !== undefined) {
                    initialValues[field.id] = field.value;
                }
            });
            state.fieldValues = initialValues;
            state.uiState.signingStep = 'success';
            state.uiState.activeParticipantId = null; // Reset after success
        })
        .addCase(verifySignatureSmsOtp.rejected, (state, action) => {
            state.uiState.signatureLoading = false;
            state.uiState.signatureError = action.payload as string;
        });
};
