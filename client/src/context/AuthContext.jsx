/**
 * Auth Context — JWT authentication state management
 */

import { createContext, useContext, useState, useCallback } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("cc_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!user;

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", { email, password });
      const { user: userData, accessToken, refreshToken } = res.data;

      localStorage.setItem("cc_token", accessToken);
      localStorage.setItem("cc_refresh_token", refreshToken);
      localStorage.setItem("cc_user", JSON.stringify(userData));
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed.",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/register", data);
      const { user: userData, accessToken, refreshToken } = res.data;

      localStorage.setItem("cc_token", accessToken);
      localStorage.setItem("cc_refresh_token", refreshToken);
      localStorage.setItem("cc_user", JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed.",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch { /* ignore */ }

    localStorage.removeItem("cc_token");
    localStorage.removeItem("cc_refresh_token");
    localStorage.removeItem("cc_user");
    setUser(null);
  }, []);

  const updateProfile = useCallback((data) => {
    setUser((prev) => {
      const updated = { ...prev, ...data };
      localStorage.setItem("cc_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, loading,
      login, register, logout, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export default AuthContext;
