import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
    token: string | null;
    role: string | null;
    userId: string | null;
    userName: string | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
    updateUsername: (newName: string) => void;
}

interface CustomJwtPayload {
    nameid: string;
    role: string;
    exp: number;
    name: string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    token: localStorage.getItem('token'),
    // Теперь мы читаем просто decoded.role и decoded.nameid !
    role: localStorage.getItem('token') ? jwtDecode<CustomJwtPayload>(localStorage.getItem('token')!).role : null,
    userId: localStorage.getItem('token') ? jwtDecode<CustomJwtPayload>(localStorage.getItem('token')!).nameid : null,
    userName: localStorage.getItem('token') ? jwtDecode<CustomJwtPayload>(localStorage.getItem('token')!).name : null,
    updateUsername: (newName: string) => set({ userName: newName }),

    login: (token: string) => {
        localStorage.setItem('token', token);
        const decoded = jwtDecode<CustomJwtPayload>(token);

        // Красивое и понятное сохранение:
        set({
            token,
            role: decoded.role,
            userId: decoded.nameid,
            userName: decoded.name,
        });
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ token: null, role: null, userId: null, userName: null });
    },

    isAuthenticated: () => !!get().token
}));