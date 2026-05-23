import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const api = axios.create({
    baseURL:  'http://localhost:5070/api', // ПОРТ ASP.NET СЕРВЕРА
    headers: { 'Content-Type': 'application/json' }
});

// Перехватчик: перед каждым запросом берем токен из Zustand
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (!error.response) {
            console.error('Network error:', error.message);
            // Можно показать пользователю более понятное сообщение
        }
        return Promise.reject(error);
    });

