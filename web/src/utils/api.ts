// src/utils/api.ts
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { IRootState } from '../store';
import { logout } from '../store/slices/authSlice'; // Import the logout action

// We need the store type, but we will pass the store itself to avoid circular deps
type AppStore = ReturnType<typeof import('../store').default.getState>;

const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// This is the key part: a function to set up the interceptors
// We will call this function in our main store file, passing the store instance
export const setupInterceptors = (store: any) => {
    
    // Request Interceptor: Injects the auth token into every request
    api.interceptors.request.use(
        (config) => {
            // Get the token from the Redux state
            const token = store.getState().auth.token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response Interceptor: Handles global errors, like 401 for auto-logout
    api.interceptors.response.use(
        (response) => {
            // If the response is successful, just return it
            return response;
        },
        async (error) => {
            const originalRequest = error.config;

            // Check for 401 Unauthorized error
            if (error.response.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true; // Mark that we've retried this request
                
                // Dispatch the logout action to clear the stale token and user data
                console.error("Unauthorized request. Logging out.");
                store.dispatch(logout());

                // Optionally, redirect to login page
                // window.location.href = '/login';
            }

            // For all other errors, just reject the promise
            return Promise.reject(error);
        }
    );
};

export default api;