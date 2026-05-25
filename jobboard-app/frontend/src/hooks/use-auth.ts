import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/axios";
import type { LoginCredentials, RegisterCredentials, AuthResponse } from "@/types";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

export function useAuth() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, setUser, setAccessToken, logout: clearAuth } =
    useAuthStore();

  // Login
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const { data } = await api.post<{
        success: boolean;
        message: string;
        data: AuthResponse;
      }>("/auth/login", credentials);

      setUser(data.data.user);
      setAccessToken(data.data.accessToken);
      toast.success(`Welcome back, ${data.data.user.name.split(" ")[0]}!`);

      // Redirect based on role
      const role = data.data.user.role;
      if (role === "employer") navigate("/employer/dashboard");
      else if (role === "admin") navigate("/admin/dashboard");
      else navigate("/jobs");
    },
    [navigate, setUser, setAccessToken]
  );

  // Register
  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const { data } = await api.post<{
        success: boolean;
        message: string;
        data: AuthResponse;
      }>("/auth/register", credentials);

      setUser(data.data.user);
      setAccessToken(data.data.accessToken);
      toast.success("Account created! Welcome to JobBoard.");

      const role = data.data.user.role;
      if (role === "employer") navigate("/employer/dashboard");
      else navigate("/jobs");
    },
    [navigate, setUser, setAccessToken]
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
      toast.success("You've been signed out.");
    } catch {
      // Even if the server call fails, clear local state
    } finally {
      clearAuth();
      navigate("/login");
    }
  }, [clearAuth, navigate]);

  // Extract field errors from API validation errors
  const extractErrors = useCallback(
    (error: unknown): Record<string, string> => {
      if (error instanceof AxiosError && error.response?.data?.errors) {
        return error.response.data.errors;
      }
      if (error instanceof AxiosError && error.response?.data?.message) {
        return { root: error.response.data.message };
      }
      return { root: "Something went wrong. Please try again." };
    },
    []
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    extractErrors,
  };
}