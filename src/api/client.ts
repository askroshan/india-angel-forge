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
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
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
      
      return json;
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
  async get<T>(table: string, id: string): Promise<ApiResponse<T>> {
    return this.request<T>(`${this.baseUrl}/${table}/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
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
