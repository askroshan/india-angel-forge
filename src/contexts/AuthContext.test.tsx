import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { getApiClient, type ApiClient } from '@/api';
import type { Session, User } from '@/api/types';

// Mock the API client
vi.mock('@/api', () => ({
  getApiClient: vi.fn(),
}));

describe('AuthContext', () => {
  let mockApiClient: {
    signIn: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
    resetPassword: ReturnType<typeof vi.fn>;
    updatePassword: ReturnType<typeof vi.fn>;
    setAccessToken: ReturnType<typeof vi.fn>;
  };

  const mockUser: User = {
    id: 'user-123',
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

  beforeEach(() => {
    mockApiClient = {
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
      setAccessToken: vi.fn(),
    };

    vi.mocked(getApiClient).mockReturnValue(mockApiClient as unknown as ApiClient);

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress React error boundary console output for this test
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

      // After initial render, loading should be true
      // Then it transitions to false once session check completes
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should restore session from storage on mount', async () => {
      localStorage.setItem('auth_session', JSON.stringify(mockSession));
      mockApiClient.getSession.mockResolvedValue({ data: mockSession, error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    it('should set loading to false when no session exists', async () => {
      mockApiClient.getSession.mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('signIn', () => {
    it('should sign in user and store session', async () => {
      mockApiClient.getSession.mockResolvedValue({ data: null, error: null });
      mockApiClient.signIn.mockResolvedValue({ data: mockSession, error: null });

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
      expect(result.current.session).toEqual(mockSession);
      expect(localStorage.getItem('auth_session')).toBe(JSON.stringify(mockSession));
      expect(mockApiClient.setAccessToken).toHaveBeenCalledWith('access-token');
    });

    it('should return error for invalid credentials', async () => {
      mockApiClient.getSession.mockResolvedValue({ data: null, error: null });
      mockApiClient.signIn.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
      });

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
    });
  });

  describe('signUp', () => {
    it('should sign up user and store session', async () => {
      mockApiClient.getSession.mockResolvedValue({ data: null, error: null });
      mockApiClient.signUp.mockResolvedValue({ data: mockSession, error: null });

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
      expect(mockApiClient.signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
    });

    it('should return error for existing user', async () => {
      mockApiClient.getSession.mockResolvedValue({ data: null, error: null });
      mockApiClient.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already exists', code: 'USER_EXISTS' },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const response = await result.current.signUp('existing@example.com', 'password123', 'Test User');
        expect(response.error?.message).toBe('User already exists');
      });
    });
  });

  describe('signOut', () => {
    it('should sign out user and clear session', async () => {
      localStorage.setItem('auth_session', JSON.stringify(mockSession));
      mockApiClient.getSession.mockResolvedValue({ data: mockSession, error: null });
      mockApiClient.signOut.mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(localStorage.getItem('auth_session')).toBeNull();
      expect(mockApiClient.setAccessToken).toHaveBeenCalledWith(null);
    });
  });

  describe('resetPassword', () => {
    it('should call reset password API', async () => {
      mockApiClient.getSession.mockResolvedValue({ data: null, error: null });
      mockApiClient.resetPassword.mockResolvedValue({ data: null, error: null });

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

      expect(mockApiClient.resetPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('updatePassword', () => {
    it('should call update password API', async () => {
      localStorage.setItem('auth_session', JSON.stringify(mockSession));
      mockApiClient.getSession.mockResolvedValue({ data: mockSession, error: null });
      mockApiClient.updatePassword.mockResolvedValue({ data: null, error: null });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        const response = await result.current.updatePassword('newpassword123');
        expect(response.error).toBeNull();
      });

      expect(mockApiClient.updatePassword).toHaveBeenCalledWith('newpassword123');
    });
  });
});
