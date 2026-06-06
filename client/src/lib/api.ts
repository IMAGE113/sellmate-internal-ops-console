import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { secureStorage } from "./security";
import { LoginResponse, Merchant, SystemStats, AuditLog, HealthStatus } from "./types";

const API_BASE_URL = "https://sellmate-ai-backend.onrender.com";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor: Auth & Correlation Tracking
 */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = secureStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response Interceptor: Error Handling, Retry Logic, and Correlation ID
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
    
    // Read backend's native Request ID / Correlation ID
    const correlationId = error.response?.headers["x-request-id"] || 
                          (error.response?.data as any)?.correlation_id;
    
    if (correlationId) {
      console.error(`[API Error] Correlation ID: ${correlationId}`);
      // Attach to error object for component-level display
      (error as any).correlationId = correlationId;
    }

    // Exponential Backoff Retry Mechanism (up to 3 retries)
    if (
      error.response && 
      error.response.status >= 500 && 
      (!config._retryCount || config._retryCount < 3)
    ) {
      config._retryCount = (config._retryCount || 0) + 1;
      const backoffDelay = Math.pow(2, config._retryCount) * 1000;
      
      console.warn(`Retrying request (${config._retryCount}/3) in ${backoffDelay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      return apiClient(config);
    }

    // Handle Auth Expiration
    if (error.response?.status === 401) {
      secureStorage.removeItem("auth_token");
      secureStorage.removeItem("auth_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (phone: string, password: string) =>
    apiClient.post<LoginResponse>("/api/auth/login", { phone, password }),
  verifyToken: () =>
    apiClient.post("/api/auth/verify-token", {}),
};

export const opsAPI = {
  getStats: () =>
    apiClient.get<SystemStats>("/api/ops/stats"),
  getMerchants: (status?: string) =>
    apiClient.get<Merchant[]>("/api/ops/merchants", { params: { status } }),
  activateMerchant: (shopId: string) =>
    apiClient.post(`/api/ops/merchants/${shopId}/activate`, {}),
  suspendMerchant: (shopId: string) =>
    apiClient.post(`/api/ops/merchants/${shopId}/suspend`, {}),
  getAuditLogs: (limit?: number) =>
    apiClient.get<AuditLog[]>("/api/ops/audit-logs", { params: { limit } }),
};

export const healthAPI = {
  checkHealth: () =>
    apiClient.get<HealthStatus>("/health"),
};

export default apiClient;
