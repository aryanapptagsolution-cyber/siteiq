'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppUser {
    id: string;
    name: string;
    email: string;
    role: 'viewer' | 'analyst' | 'planner' | 'admin';
    avatarInitials: string;
}

interface AuthState {
    user: AppUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setAuth: (user: AppUser) => void;
    clearAuth: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            setAuth: (user) =>
                set({ user, isAuthenticated: true, isLoading: false }),
            clearAuth: () =>
                set({ user: null, isAuthenticated: false, isLoading: false }),
            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'siteiq-auth',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
