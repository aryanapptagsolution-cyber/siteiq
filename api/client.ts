import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on every request
apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle errors
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig & { _retryCount?: number };

        if (error.response?.status === 401) {
            useAuthStore.getState().clearAuth();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        if (error.response?.status === 429) {
            config._retryCount = (config._retryCount ?? 0) + 1;
            if (config._retryCount <= 3) {
                const delay = Math.pow(2, config._retryCount) * 1000;
                await new Promise((resolve) => setTimeout(resolve, delay));
                return apiClient(config);
            }
        }

        return Promise.reject(error);
    }
);
