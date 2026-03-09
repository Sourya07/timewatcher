import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from './api';

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Attach JWT token to every request ────────────────────────────────────────
apiClient.interceptors.request.use(async (config) => {
    // Try user token first, fall back to admin token
    const token =
        (await SecureStore.getItemAsync('usertoken')) ||
        (await SecureStore.getItemAsync('admintoken'));
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Global error handling ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const message =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            'Something went wrong';
        return Promise.reject(new Error(message));
    }
);

export default apiClient;
