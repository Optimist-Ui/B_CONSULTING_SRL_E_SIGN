import { useState } from 'react';
import axios from 'axios';
import { useAuthContext } from '../context/AuthContext';

interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user: {
            _id: string;
            name: string;
            email: string;
            password: string;
            createdAt: string;
            updatedAt: string;
            __v: number;
        };
    };
}

interface AuthError {
    message: string;
}
const BASE_URL = `${import.meta.env.VITE_BASE_URL}`;

const useAuth = () => {
    const { setAuthStatus } = useAuthContext(); // Use AuthProvider's authentication state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [user, setUser] = useState<AuthResponse['data']['user'] | null>(null);

    const clearStates = () => {
        setError(null);
        setSuccess(null);
    };

    const signup = async (name: string, email: string, password: string) => {
        try {
            setLoading(true);
            clearStates();

            const response = await axios.post<AuthResponse>(`${BASE_URL}/api/users/signup`, { name, email, password });

            if (response.data.data.token && response.data.data.user._id) {
                localStorage.setItem('authToken', response.data.data.token);
                localStorage.setItem('userId', response.data.data.user._id);

                setSuccess('Registration successful!');
                setUser(response.data.data.user);
                setAuthStatus(true);
            }

            return response.data;
        } catch (err) {
            console.log(err);
            const error = err as AuthError;
            setError(error.message || 'Registration failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            clearStates();

            const response = await axios.post<AuthResponse>(`${BASE_URL}/api/users/login`, { email, password });
            if (response.data.data.token && response.data.data.user._id) {
                localStorage.setItem('authToken', response.data.data.token);
                localStorage.setItem('userId', response.data.data.user._id);

                setSuccess('Login successful!');
                setUser(response.data.data.user);
                setAuthStatus(true);
            }

            return response.data;
        } catch (err) {
            const error = err as AuthError;
            setError(error.message || 'Login failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const requestPasswordReset = async (email: string) => {
        try {
            setLoading(true);
            clearStates();

            const response = await axios.post<AuthResponse>(`${BASE_URL}/api/users/request-password-reset`, { email });

            setSuccess('Password reset instructions sent to your email!');
            return response.data;
        } catch (err) {
            const error = err as AuthError;
            setError(error.message || 'Password reset request failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (token: string, newPassword: string) => {
        try {
            setLoading(true);
            clearStates();

            const response = await axios.post(`${BASE_URL}/api/users/reset-password`, {
                resetToken: token,
                newPassword,
            });

            console.log(response)
            setSuccess('Password reset successful! You can now log in.');
            return response.data;
        } catch (err) {
            console.log(err);
            setError('Password reset failed. Invalid or expired token.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        setAuthStatus(false);
        setSuccess('Logged out successfully');
    };

    return {
        signup,
        login,
        logout,
        requestPasswordReset,
        resetPassword,
        loading,
        error,
        success,
        user,
    };
};

export default useAuth;
