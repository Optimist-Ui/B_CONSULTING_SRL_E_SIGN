import { ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { signupUser, loginUser, checkAuthStatus, requestPasswordReset, verifyResetToken, resetPassword, verifyEmail, updateUserProfile, changePassword } from '../thunk/authThunks';
import { AuthState } from '../slices/authSlice';

export const buildAuthExtraReducers = (builder: ActionReducerMapBuilder<AuthState>) => {
    builder
        // --- Signup Cases ---
        .addCase(signupUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(signupUser.fulfilled, (state) => {
            state.loading = false;
        })
        .addCase(signupUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // --- Login Cases (THIS IS THE NEW PART) ---
        .addCase(loginUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(loginUser.fulfilled, (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.error = null;
        })
        .addCase(loginUser.rejected, (state, action) => {
            state.loading = false;
            state.isAuthenticated = false;
            state.user = null;
            state.error = action.payload as string;
        })

        // --- Email Verification Cases ---
        .addCase(verifyEmail.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(verifyEmail.fulfilled, (state) => {
            state.loading = false;
        })
        .addCase(verifyEmail.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // --- Password Reset Request Cases ---
        .addCase(requestPasswordReset.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(requestPasswordReset.fulfilled, (state) => {
            state.loading = false;
        })
        .addCase(requestPasswordReset.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // --- Token Verification Cases ---
        .addCase(verifyResetToken.pending, (state) => {
            state.loading = true;
            state.isTokenVerified = false; // Reset on new verification attempt
            state.error = null;
        })
        .addCase(verifyResetToken.fulfilled, (state) => {
            state.loading = false;
            state.isTokenVerified = true;
        })
        .addCase(verifyResetToken.rejected, (state, action) => {
            state.loading = false;
            state.isTokenVerified = false;
            state.error = action.payload as string;
        })

        // --- Password Reset Cases ---
        .addCase(resetPassword.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(resetPassword.fulfilled, (state) => {
            state.loading = false;
            state.isTokenVerified = false; // Reset verification state after use
        })
        .addCase(resetPassword.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // ---  Cases for User Profile Update ---
        .addCase(updateUserProfile.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateUserProfile.fulfilled, (state, action) => {
            state.loading = false;
            // IMPORTANT: Update the user in the state with the fresh data from the API
            state.user = action.payload.user;
        })
        .addCase(updateUserProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // --- Cases for Password Change ---
        .addCase(changePassword.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(changePassword.fulfilled, (state) => {
            state.loading = false; // Just stop loading on success
        })
        .addCase(changePassword.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // --- Auth Check Cases ---
        .addCase(checkAuthStatus.pending, (state) => {
            state.loading = true;
        })
        .addCase(checkAuthStatus.fulfilled, (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
        })
        .addCase(checkAuthStatus.rejected, (state) => {
            state.loading = false;
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
        });
};
