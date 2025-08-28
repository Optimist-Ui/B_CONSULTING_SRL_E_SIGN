// src/store/slices/authSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { buildAuthExtraReducers } from '../extra-reducers/authExtraReducers'; // Import the builder function

// Define and EXPORT the shape of the user data and the auth state
export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    language?: string;
    profileImage?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    isTokenVerified: boolean;
}

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('authToken'),
    isAuthenticated: !!localStorage.getItem('authToken'),
    loading: false,
    error: null,
    isTokenVerified: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('authToken');
        },
    },
    // Use the external function to build the extra reducers
    extraReducers: (builder) => {
        buildAuthExtraReducers(builder);
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
