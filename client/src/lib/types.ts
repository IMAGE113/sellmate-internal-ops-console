/**
 * SellMate Internal Ops Console - Type Definitions
 * Aligned with Live Backend API Specification
 */

export type UserRole = "ADMIN" | "SUPER_ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  phone?: string;
  shop_id?: string;
  business_id?: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  // Flattened response fields as per directive
  id: string;
  email: string;
  role: UserRole;
}

export type MerchantStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "ARCHIVED";

export interface Merchant {
  id: number;
  shop_id: string;
  name: string;
  owner_name: string;
  phone: string;
  status: MerchantStatus;
  created_at: string;
  // Aligned with backend: uses 'requirements' field
  requirements?: string;
}

export interface SystemStats {
  total_merchants: number;
  active_merchants: number;
  suspended_merchants: number;
  total_orders: number;
  pending_tasks: number;
  failed_tasks: number;
}

export interface AuditLog {
  id: number;
  shop_id: string;
  event_type: string;
  actor_source: string;
  description: string;
  created_at: string;
  details?: Record<string, unknown>;
}

export interface HealthStatus {
  api_status: "healthy" | "warning" | "critical";
  database_status: "healthy" | "warning" | "critical";
  response_time: number;
  status?: string;
  database?: string;
  api?: string;
  timestamp?: string;
}

export interface ApiErrorResponse {
  error?: string;
  detail?: string;
  message?: string;
  correlation_id?: string;
}
