/**
 * Axios API Client with JWT interceptor
 */

import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Request interceptor — attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("cc_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (token expired)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("cc_refresh_token");
        if (refreshToken) {
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL || "/api"}/auth/refresh-token`,
            { refreshToken }
          );

          if (res.data.success) {
            localStorage.setItem("cc_token", res.data.accessToken);
            localStorage.setItem("cc_refresh_token", res.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed — clear tokens and redirect to login
        localStorage.removeItem("cc_token");
        localStorage.removeItem("cc_refresh_token");
        localStorage.removeItem("cc_user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
