// src/store/thunk/authThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '../slices/authSlice';
// Import our configured api instance INSTEAD of axios
import api from '../../utils/api';

// --- Interfaces (no changes needed here) ---
interface SignupUserArgs {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

interface LoginUserArgs {
    email: string;
    password: string;
}

interface ResetPasswordArgs {
    token: string;
    newPassword: string;
}
interface AuthResponse {
    token: string;
    user: User;
}

interface UpdateProfileArgs {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    language?: string;
    profileImage?: File | null;
}

interface ChangePasswordArgs {
    currentPassword: string;
    newPassword: string;
}

// --- signupUser Thunk (Updated) ---
export const signupUser = createAsyncThunk<
    { message: string }, // <-- Type for successful return
    SignupUserArgs
>('auth/signupUser', async (userData, { rejectWithValue }) => {
    try {
        const response = await api.post('/api/users/signup', userData);
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Registration failed.');
    }
});

// --- loginUser Thunk (Updated) ---
export const loginUser = createAsyncThunk('auth/loginUser', async (credentials: LoginUserArgs, { rejectWithValue }) => {
    try {
        // Use 'api' and a relative path. The token is added automatically!
        const response = await api.post('/api/users/login', credentials);
        const { token, user } = response.data.data;
        localStorage.setItem('authToken', token);
        localStorage.setItem('userId', user._id);
        return { token, user };
    } catch (error: any) {
        if (error.response && error.response.data.message) {
            return rejectWithValue(error.response.data.error);
        } else {
            return rejectWithValue(error.error);
        }
    }
});

// --- verifyEmail Thunk ---
export const verifyEmail = createAsyncThunk<{ message: string }, string>('auth/verifyEmail', async (token, { rejectWithValue }) => {
    try {
        const response = await api.get(`/api/users/verify-email/${token}`);
        return response.data; // Should return { message: 'Email verified successfully...' }
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Email verification failed.');
    }
});

// --- requestPasswordReset Thunk ---
export const requestPasswordReset = createAsyncThunk('auth/requestPasswordReset', async (email: string, { rejectWithValue }) => {
    try {
        // Use our configured 'api' instance to make the request
        const response = await api.post('/api/users/request-password-reset', { email });
        // The API should return a success message, which we pass to the fulfilled action
        return response.data.data;
    } catch (error: any) {
        // Use rejectWithValue to pass the API error message to the rejected action
        if (error.response && error.response.data.message) {
            return rejectWithValue(error.response.data.error);
        }
        return rejectWithValue(error.error);
    }
});

// --- verifyResetToken Thunk ---
export const verifyResetToken = createAsyncThunk('auth/verifyResetToken', async (token: string, { rejectWithValue }) => {
    try {
        // This is the new verification step
        const response = await api.get(`/api/users/verify-token/${token}`);
        // If the server responds with found: false, we can treat it as an error
        if (!response.data.found) {
            return rejectWithValue('Invalid or expired token.');
        }
        return response.data; // This will return { found: true, user: {...} }
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Token verification failed.');
    }
});

// --- resetPassword Thunk ---
export const resetPassword = createAsyncThunk('auth/resetPassword', async ({ token, newPassword }: ResetPasswordArgs, { rejectWithValue }) => {
    try {
        const response = await api.post('/api/users/reset-password', {
            resetToken: token,
            newPassword,
        });
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to reset password.');
    }
});

// --- Thunk to Update User Profile ---
export const updateUserProfile = createAsyncThunk('auth/updateProfile', async (profileData: UpdateProfileArgs, { rejectWithValue }) => {
    const formData = new FormData();

    Object.entries(profileData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            formData.append(key, value);
        }
    });

    try {
        const response = await api.put('/api/users/profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return { user: response.data.data };
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to update profile.');
    }
});

// --- Thunk to Change Password from Dashboard ---
export const changePassword = createAsyncThunk('auth/changePassword', async (passwordData: ChangePasswordArgs, { rejectWithValue }) => {
    try {
        const response = await api.put('/api/users/password', passwordData);
        return response.data; // Should just contain a success message
    } catch (error: any) {
        console.log(error);
        return rejectWithValue(error.response?.data?.error || 'Failed to change password.');
    }
});

// --- checkAuthStatus Thunk ---
// This thunk doesn't need arguments
export const checkAuthStatus = createAsyncThunk('auth/checkAuthStatus', async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('authToken');

    if (!token) {
        return rejectWithValue('No token found in storage.');
    }

    try {
        // The protected /profile route identifies the user via the token.
        const response = await api.get('/api/users/profile');

        return { user: response.data.data };
    } catch (error: any) {
        // If the request fails (e.g., 401 Unauthorized), the token is invalid.
        return rejectWithValue(error.response?.data?.error || 'Invalid session.');
    }
});

export const deleteAccount = createAsyncThunk('auth/deleteAccount', async (_, { rejectWithValue }) => {
    try {
        const response = await api.post('/api/users/delete-account');
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to request account deletion.');
    }
});

export const reactivateAccount = createAsyncThunk('auth/reactivateAccount', async (token: string, { rejectWithValue }) => {
    try {
        const response = await api.get(`/api/users/reactivate/${token}`);
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.error || 'Failed to reactivate account.');
    }
});
