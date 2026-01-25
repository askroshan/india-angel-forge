import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient } from './client';
import type { ApiResponse, Session, User } from './types';

describe('ApiClient', () => {
  let client: ApiClient;
  const baseUrl = 'http://localhost:3000/api';

  beforeEach(() => {
    client = new ApiClient(baseUrl);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance with base URL', () => {
      expect(client).toBeInstanceOf(ApiClient);
      expect(client.getBaseUrl()).toBe(baseUrl);
    });

    it('should throw error if base URL is empty', () => {
      expect(() => new ApiClient('')).toThrow('Base URL is required');
    });
  });

  describe('signUp', () => {
    it('should call POST /auth/signup with correct payload', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        fullName: 'Test User',
        createdAt: '2026-01-25T00:00:00Z',
        updatedAt: '2026-01-25T00:00:00Z',
      };
      const mockSession: Session = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        user: mockUser,
      };
      const mockResponse: ApiResponse<Session> = { data: mockSession, error: null };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.signUp('test@example.com', 'password123', 'Test User');

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User',
        }),
      });
      expect(result.data).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it('should return error for invalid email', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          data: null,
          error: { message: 'Invalid email address', code: 'INVALID_EMAIL' },
        }),
      });

      const result = await client.signUp('invalid-email', 'password123', 'Test User');

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Invalid email address');
    });
  });

  describe('signIn', () => {
    it('should call POST /auth/signin with credentials', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        fullName: 'Test User',
        createdAt: '2026-01-25T00:00:00Z',
        updatedAt: '2026-01-25T00:00:00Z',
      };
      const mockSession: Session = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        user: mockUser,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockSession, error: null }),
      });

      const result = await client.signIn('test@example.com', 'password123');

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });
      expect(result.data).toEqual(mockSession);
    });

    it('should return error for invalid credentials', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          data: null,
          error: { message: 'Invalid login credentials', code: 'INVALID_CREDENTIALS' },
        }),
      });

      const result = await client.signIn('test@example.com', 'wrongpassword');

      expect(result.error?.message).toBe('Invalid login credentials');
    });
  });

  describe('signOut', () => {
    it('should call POST /auth/signout', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: null, error: null }),
      });

      const result = await client.signOut();

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/auth/signout`, {
        method: 'POST',
        headers: expect.any(Object),
      });
      expect(result.error).toBeNull();
    });
  });

  describe('get', () => {
    it('should call GET /table/:id', async () => {
      const mockData = { id: '123', name: 'Test' };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData, error: null }),
      });

      const result = await client.get('users', '123');

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/users/123`, {
        method: 'GET',
        headers: expect.any(Object),
      });
      expect(result.data).toEqual(mockData);
    });

    it('should return error for non-existent record', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          data: null,
          error: { message: 'Record not found', code: 'NOT_FOUND' },
        }),
      });

      const result = await client.get('users', 'nonexistent');

      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('list', () => {
    it('should call GET /table with pagination', async () => {
      const mockData = {
        data: [{ id: '1' }, { id: '2' }],
        total: 10,
        page: 1,
        pageSize: 2,
        hasMore: true,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData, error: null }),
      });

      const result = await client.list('users', { page: 1, pageSize: 2 });

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/users?page=1&pageSize=2`,
        expect.any(Object)
      );
      expect(result.data?.data).toHaveLength(2);
      expect(result.data?.hasMore).toBe(true);
    });

    it('should include filters in query string', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { data: [], total: 0, page: 1, pageSize: 10, hasMore: false }, error: null }),
      });

      await client.list('users', { filters: { status: 'active', role: 'admin' } });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=active'),
        expect.any(Object)
      );
    });
  });

  describe('create', () => {
    it('should call POST /table with data', async () => {
      const createData = { name: 'New User', email: 'new@example.com' };
      const mockData = { id: '123', ...createData };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData, error: null }),
      });

      const result = await client.create('users', createData);

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData),
      });
      expect(result.data).toEqual(mockData);
    });
  });

  describe('update', () => {
    it('should call PATCH /table/:id with data', async () => {
      const updateData = { name: 'Updated Name' };
      const mockData = { id: '123', name: 'Updated Name', email: 'test@example.com' };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData, error: null }),
      });

      const result = await client.update('users', '123', updateData);

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/users/123`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      expect(result.data?.name).toBe('Updated Name');
    });
  });

  describe('delete', () => {
    it('should call DELETE /table/:id', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: null, error: null }),
      });

      const result = await client.delete('users', '123');

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/users/123`, {
        method: 'DELETE',
        headers: expect.any(Object),
      });
      expect(result.error).toBeNull();
    });
  });

  describe('rpc', () => {
    it('should call POST /rpc/:functionName with params', async () => {
      const mockResult = { hasRole: true };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockResult, error: null }),
      });

      const result = await client.rpc('has_role', { userId: '123', role: 'admin' });

      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/rpc/has_role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: '123', role: 'admin' }),
      });
      expect(result.data).toEqual(mockResult);
    });
  });

  describe('authentication headers', () => {
    it('should include auth token in requests when session exists', async () => {
      client.setAccessToken('my-token');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {}, error: null }),
      });

      await client.get('users', '123');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await client.get('users', '123');

      expect(result.error?.message).toBe('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await client.get('users', '123');

      expect(result.error).not.toBeNull();
    });
  });
});
