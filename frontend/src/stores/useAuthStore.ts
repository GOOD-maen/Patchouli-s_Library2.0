import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id?: number;
  username?: string;
  email?: string;
  createdAt?: string;
  uuid?: string;
  avatar?: string;
  backgroundImage?: string;
  signature?: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, user: User) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,

      setAuth: (accessToken, user) => set({ accessToken, user }),

      updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),

      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    }
  )
);