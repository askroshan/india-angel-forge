import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import { AuthProvider, useAuth } from './AuthContext';

// Mock user data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  fullName: 'Test User',
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

describe('AuthContext', () => {
  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('AuthProvider', () => {
    it('should start with loading state and transition to loaded', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should restore session from storage on mount', async () => {
      localStorage.setItem('auth_token', 'stored-token');
      localStorage.setItem('auth_user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('stored-token');
    });

    it('should set loading to false when no session exists', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe('signIn', () => {
    it('should sign in user and store session', async () => {
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json({
            token: 'new-token',
            user: mockUser,
          });
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'password123');
        expect(response.error).toBeNull();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('new-token');
      expect(localStorage.getItem('auth_token')).toBe('new-token');
      expect(JSON.parse(localStorage.getItem('auth_user') || '{}')).toEqual(mockUser);
    });

    it('should return error for invalid credentials', async () => {
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          );
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'wrongpassword');
        expect(response.error?.message).toBe('Invalid credentials');
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe('signUp', () => {
    it('should sign up user and store session', async () => {
      server.use(
        http.post('/api/auth/signup', () => {
          return HttpResponse.json({
            token: 'new-token',
            user: mockUser,
          });
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.signUp('test@example.com', 'password123', 'Test User');
        expect(response.error).toBeNull();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('new-token');
    });

    it('should return error for existing user', async () => {
      server.use(
        http.post('/api/auth/signup', () => {
          return HttpResponse.json(
            { error: 'User already exists' },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.signUp('test@example.com', 'password123');
        expect(response.error?.message).toBe('User already exists');
      });
    });
  });

  describe('signOut', () => {
    it('should sign out user and clear session', async () => {
      localStorage.setItem('auth_token', 'stored-token');
      localStorage.setItem('auth_user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('auth_user')).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should call reset password API', async () => {
      server.use(
        http.post('/api/auth/reset-password', () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.resetPassword('test@example.com');
        expect(response.error).toBeNull();
      });
    });
  });

  describe('updatePassword', () => {
    it('should call update password API', async () => {
      localStorage.setItem('auth_token', 'stored-token');
      localStorage.setItem('auth_user', JSON.stringify(mockUser));

      server.use(
        http.post('/api/auth/update-password', () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        const response = await result.current.updatePassword('newPassword123');
        expect(response.error).toBeNull();
      });
    });
  });
});
