import type {
  ApiResponse,
  ApiError,
  IApiClient,
  PaginatedResponse,
  QueryOptions,
  Session,
} from './types';

/**
 * API Client for India Angel Forum
 * Provides a generic interface for PostgreSQL backend communication
 */
export class ApiClient implements IApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    if (!baseUrl) {
      throw new Error('Base URL is required');
    }
    this.baseUrl = baseUrl;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  private getHeaders(includeContentType = false): Record<string, string> {
    const headers: Record<string, string> = {};
    
    const token = this.accessToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  }

  private async request<T>(
    url: string,
    options: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, options);
      const json = await response.json();
      
      if (!response.ok) {
        return {
          data: null,
          error: json.error || { message: 'Request failed', code: String(response.status) },
        };
      }
      
      // Handle both wrapped { data, error } and unwrapped responses
      if (json && typeof json === 'object' && 'data' in json) {
        // Response is already in { data, error } format
        return json;
      } else {
        // Response is raw data - wrap it
        return {
          data: json as T,
          error: null,
        };
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  // Auth methods
  async signUp(
    email: string,
    password: string,
    fullName: string
  ): Promise<ApiResponse<Session>> {
    return this.request<Session>(`${this.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName }),
    });
  }

  async signIn(email: string, password: string): Promise<ApiResponse<Session>> {
    return this.request<Session>(`${this.baseUrl}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
  }

  async signOut(): Promise<ApiResponse<void>> {
    return this.request<void>(`${this.baseUrl}/auth/signout`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  async getSession(): Promise<ApiResponse<Session>> {
    return this.request<Session>(`${this.baseUrl}/auth/session`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
  }

  async resetPassword(email: string): Promise<ApiResponse<void>> {
    return this.request<void>(`${this.baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
  }

  async updatePassword(newPassword: string): Promise<ApiResponse<void>> {
    return this.request<void>(`${this.baseUrl}/auth/update-password`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword }),
    });
  }

  // Generic CRUD methods
  async get<T>(tableOrUrl: string, id?: string): Promise<T> {
    let url: string;
    
    if (id !== undefined) {
      // Traditional (table, id) usage
      url = `${this.baseUrl}/${tableOrUrl}/${id}`;
    } else if (tableOrUrl.startsWith('/api/')) {
      // URL path that already includes /api prefix - don't add baseUrl
      url = tableOrUrl;
    } else if (tableOrUrl.startsWith('/')) {
      // URL path starting with / - prepend baseUrl
      url = `${this.baseUrl}${tableOrUrl}`;
    } else {
      // Table name without id - use list behavior
      url = `${this.baseUrl}/${tableOrUrl}`;
    }
    
    const response = await this.request<T>(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    // Return data directly for compatibility with existing usage
    if (response.error) {
      throw new Error(response.error.message);
    }
    return response.data as T;
  }

  async patch<T>(url: string, data: unknown): Promise<T> {
    // If URL already includes /api prefix, don't add baseUrl
    const fullUrl = url.startsWith('/api/') ? url : `${this.baseUrl}${url}`;
    
    const response = await this.request<T>(fullUrl, {
      method: 'PATCH',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    return response.data as T;
  }

  async list<T>(
    table: string,
    options?: QueryOptions
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    const params = new URLSearchParams();
    
    if (options?.page) params.set('page', String(options.page));
    if (options?.pageSize) params.set('pageSize', String(options.pageSize));
    if (options?.orderBy) params.set('orderBy', options.orderBy);
    if (options?.orderDirection) params.set('orderDirection', options.orderDirection);
    
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        params.set(key, String(value));
      });
    }
    
    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/${table}?${queryString}` : `${this.baseUrl}/${table}`;
    
    return this.request<PaginatedResponse<T>>(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
  }

  async create<T>(table: string, data: Partial<T>): Promise<ApiResponse<T>> {
    return this.request<T>(`${this.baseUrl}/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async update<T>(
    table: string,
    id: string,
    data: Partial<T>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(`${this.baseUrl}/${table}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async delete(table: string, id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`${this.baseUrl}/${table}/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  async post<T>(url: string, data: unknown): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = this.getHeaders();
    const isFormData = data instanceof FormData;
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    // If URL already includes /api prefix, don't add baseUrl
    const fullUrl = url.startsWith('/api/') ? url : `${this.baseUrl}${url}`;

    return this.request<T>(fullUrl, {
      method: 'POST',
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  async put<T>(url: string, data: unknown): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = this.getHeaders();
    const isFormData = data instanceof FormData;
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    // If URL already includes /api prefix, don't add baseUrl
    const fullUrl = url.startsWith('/api/') ? url : `${this.baseUrl}${url}`;

    return this.request<T>(fullUrl, {
      method: 'PUT',
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  // RPC methods
  async rpc<T>(
    functionName: string,
    params?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(`${this.baseUrl}/rpc/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params || {}),
    });
  }
}

// Singleton instance
let apiClientInstance: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!apiClientInstance) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    apiClientInstance = new ApiClient(baseUrl);
  }
  return apiClientInstance;
}

export function setApiClient(client: ApiClient): void {
  apiClientInstance = client;
}

// Export singleton instance for backward compatibility
export const apiClient = getApiClient();

// System Statistics API
export interface SystemStatistics {
  users: {
    total: number;
    byRole: Record<string, number>;
  };
  deals: {
    total: number;
    totalInvestment: number;
  };
  events: {
    total: number;
    totalAttendees: number;
  };
  growth: Array<{
    month: string;
    users: number;
  }>;
}

export async function getSystemStatistics(): Promise<SystemStatistics> {
  const client = getApiClient();
  return await client.get<SystemStatistics>('/api/admin/statistics');
}

// Founder Documents API
export interface FounderDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface DocumentViewer {
  investorName: string;
  viewedAt: string;
}

export async function getFounderDocuments(): Promise<FounderDocument[]> {
  const client = getApiClient();
  const response = await client.list<FounderDocument>('founder/documents');
  return response.data?.data || [];
}

export async function uploadDocument(data: { file: File; type: string }): Promise<FounderDocument> {
  const client = getApiClient();
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('type', data.type);
  
  const response = await client.post<FounderDocument>('/founder/documents', formData);
  return response.data;
}

export async function deleteDocument(id: string): Promise<{ success: boolean }> {
  const client = getApiClient();
  const response = await client.delete('founder/documents', id);
  return { success: !response.error };
}

export async function getDocumentViewers(documentId: string): Promise<DocumentViewer[]> {
  const client = getApiClient();
  const response = await client.list<DocumentViewer>(`founder/documents/${documentId}/viewers`);
  return response.data?.data || [];
}

