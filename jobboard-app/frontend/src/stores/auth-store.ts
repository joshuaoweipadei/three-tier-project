import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";
import { api } from "@/lib/axios";

interface AuthStore {
  // State
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      // Set user after login/register
      setUser: (user: User) =>
        set({ user, isAuthenticated: true }),

      // Update access token after refresh
      setAccessToken: (token: string) =>
        set({ accessToken: token }),

      // Clear all auth state on logout
      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),

      // Called on app startup to restore session
      // If we have a stored token, verify it's still valid by hitting /auth/me
      // If it fails, the axios interceptor will try to refresh automatically
      initializeAuth: async () => {
        const { accessToken } = get();

        if (!accessToken) {
          set({ isLoading: false });
          return;
        }

        try {
          const { data } = await api.get<{
            success: boolean;
            data: { user: User };
          }>("/auth/me");

          set({
            user: data.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Token invalid — clear everything
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "jobboard-auth",           // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields — never persist isLoading
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);