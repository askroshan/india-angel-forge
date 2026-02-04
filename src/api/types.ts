/**
 * Core API client types for India Angel Forum
 * Replaces Supabase with generic PostgreSQL-compatible API layer
 */

// Base response types
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Query options
export interface QueryOptions {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

// Auth types
export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

// User roles
export type AppRole = 'admin' | 'moderator' | 'user' | 'compliance_officer';

export interface UserRole {
  id: string;
  userId: string;
  role: AppRole;
  createdAt: string;
}

// API client interface
export interface IApiClient {
  // Auth
  signUp(email: string, password: string, fullName: string): Promise<ApiResponse<Session>>;
  signIn(email: string, password: string): Promise<ApiResponse<Session>>;
  signOut(): Promise<ApiResponse<void>>;
  getSession(): Promise<ApiResponse<Session>>;
  resetPassword(email: string): Promise<ApiResponse<void>>;
  updatePassword(newPassword: string): Promise<ApiResponse<void>>;
  
  // Generic CRUD
  get<T>(table: string, id: string): Promise<ApiResponse<T>>;
  list<T>(table: string, options?: QueryOptions): Promise<ApiResponse<PaginatedResponse<T>>>;
  create<T>(table: string, data: Partial<T>): Promise<ApiResponse<T>>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<ApiResponse<T>>;
  delete(table: string, id: string): Promise<ApiResponse<void>>;
  
  // RPC/Functions
  rpc<T>(functionName: string, params?: Record<string, unknown>): Promise<ApiResponse<T>>;
}
