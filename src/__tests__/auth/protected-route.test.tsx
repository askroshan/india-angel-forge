/**
 * Unit Tests for ProtectedRoute Component (US-AUTH-001)
 * 
 * TDD RED Phase: These tests define expected behavior BEFORE implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock the useAuth hook
const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

// Mock the AccessDenied component
vi.mock('@/pages/AccessDenied', () => ({
  default: ({ requiredRoles }: { requiredRoles?: string[] }) => (
    <div data-testid="access-denied">
      Access Denied
      {requiredRoles && <span>Required: {requiredRoles.join(', ')}</span>}
    </div>
  ),
}));

// Test component
const TestComponent = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;

// Helper to render with router
const renderWithRouter = (
  ui: React.ReactElement,
  { route = '/' } = {}
) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
};

describe('US-AUTH-001: ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Check', () => {
    it('shows loading spinner while auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('redirects to /auth when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<LoginPage />} />
        </Routes>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('renders children when user is authenticated and no roles required', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@test.com', roles: ['user'] },
        loading: false,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Role-Based Authorization', () => {
    it('renders children when user has required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', roles: ['admin'] },
        loading: false,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('shows access denied when user lacks required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'investor@test.com', roles: ['investor'] },
        loading: false,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      );

      expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    });

    it('allows access when user has one of multiple allowed roles', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'compliance@test.com', roles: ['compliance_officer'] },
        loading: false,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['admin', 'compliance_officer']}>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('allows admin access to all routes regardless of allowedRoles', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', roles: ['admin'] },
        loading: false,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['founder']}>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('handles users with multiple roles correctly', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'operator@test.com', roles: ['investor', 'operator_angel'] },
        loading: false,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['operator_angel']}>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Investor Role Variations', () => {
    it('allows standard investor access to investor routes', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'investor@test.com', roles: ['investor'] },
        loading: false,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['investor', 'operator_angel', 'family_office']}>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('allows operator_angel access to investor routes', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'operator@test.com', roles: ['operator_angel'] },
        loading: false,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['investor', 'operator_angel', 'family_office']}>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('allows family_office access to investor routes', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'family@test.com', roles: ['family_office'] },
        loading: false,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['investor', 'operator_angel', 'family_office']}>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Legacy requireAdmin prop support', () => {
    it('supports requireAdmin=true for backward compatibility', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', roles: ['admin'] },
        loading: false,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requireAdmin>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('denies access with requireAdmin=true when user is not admin', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'investor@test.com', roles: ['investor'] },
        loading: false,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requireAdmin>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      );

      expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    });
  });
});
