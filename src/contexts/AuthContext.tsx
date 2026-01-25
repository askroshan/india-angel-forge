import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getApiClient } from '@/api';
import type { User, Session, ApiError } from '@/api/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: ApiError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: ApiError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: ApiError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: ApiError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'auth_session';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const apiClient = getApiClient();

  // Load session from storage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);
        
        if (storedSession) {
          const parsedSession: Session = JSON.parse(storedSession);
          
          // Check if session is expired
          if (parsedSession.expiresAt > Date.now()) {
            setSession(parsedSession);
            setUser(parsedSession.user);
            apiClient.setAccessToken(parsedSession.accessToken);
          } else {
            // Session expired, clear it
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [apiClient]);

  const saveSession = useCallback((newSession: Session | null) => {
    if (newSession) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newSession));
      apiClient.setAccessToken(newSession.accessToken);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      apiClient.setAccessToken(null);
    }
    setSession(newSession);
    setUser(newSession?.user ?? null);
  }, [apiClient]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const response = await apiClient.signUp(email, password, fullName);
    
    if (response.data) {
      saveSession(response.data);
    }
    
    return { error: response.error };
  };

  const signIn = async (email: string, password: string) => {
    const response = await apiClient.signIn(email, password);
    
    if (response.data) {
      saveSession(response.data);
    }
    
    return { error: response.error };
  };

  const signOut = async () => {
    await apiClient.signOut();
    saveSession(null);
  };

  const resetPassword = async (email: string) => {
    const response = await apiClient.resetPassword(email);
    return { error: response.error };
  };

  const updatePassword = async (newPassword: string) => {
    const response = await apiClient.updatePassword(newPassword);
    return { error: response.error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
