/**
 * US-ADMIN-001: Admin Dashboard – Comprehensive Management Hub
 *
 * As an: Admin
 * I want to: Access all management sections from the dashboard
 * So that: I can efficiently manage every aspect of the platform
 *
 * Acceptance Criteria:
 * - Dashboard renders with admin sidebar/navigation links
 * - Links to User/Role Management (/admin/users)
 * - Links to Event Management (/admin/events)
 * - Links to Application Review (/admin/applications)
 * - Links to CMS / Public Content Management (/admin/cms)
 * - Links to Membership Management (/admin/membership)
 * - Links to System Statistics (/admin/statistics)
 * - Links to Audit Logs (/admin/audit-logs)
 * - Links to Attendance Statistics (/admin/events/statistics)
 * - Links to Financial Statements (/financial-statements)
 * - Links to Transaction History (/transaction-history)
 * - Links to Activity Timeline (/activity)
 * - Links to Certificates (/certificates)
 * - Links to Messages (/investor/messages)
 * - Shows overview stats (founder apps, investor apps, pending, approved)
 *
 * TDD: RED Phase - Writing failing tests first
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminDashboard from '@/pages/AdminDashboard';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockToken = 'admin-test-token';
vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockToken);

// Admin user mock
const mockAdminUser = {
  id: 'admin-001',
  email: 'admin@indiaangelforum.test',
  roles: ['admin'],
};

let mockAuthState: { user: typeof mockAdminUser | null; loading: boolean; isAuthenticated: boolean; token: string; signOut: ReturnType<typeof vi.fn> } = {
  user: mockAdminUser,
  loading: false,
  isAuthenticated: true,
  token: mockToken,
  signOut: vi.fn(),
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the EventManagement component to keep tests focused
vi.mock('@/components/admin/EventManagement', () => ({
  EventManagement: () => <div data-testid="event-management">Event Management Component</div>,
}));

const renderDashboard = () => {
  // Reset fetch mock to return empty arrays for applications
  // fetch can receive either a string URL or a Request object
  mockFetch.mockImplementation((input: string | Request | URL) => {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
    if (url.includes('/api/applications/founders')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: 'f1', company_name: 'Acme', founder_name: 'A', founder_email: 'a@test.com', stage: 'seed', status: 'submitted', created_at: '2024-01-01' },
        ]),
      });
    }
    if (url.includes('/api/applications/investors')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: 'i1', full_name: 'Bob', email: 'b@test.com', membership_type: 'angel', status: 'submitted', created_at: '2024-01-01' },
        ]),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdminDashboard – Management Hub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: mockAdminUser,
      loading: false,
      isAuthenticated: true,
      token: mockToken,
      signOut: vi.fn(),
    };
  });

  describe('Navigation Links to All Management Sections', () => {
    it('should have a link to User / Role Management', async () => {
      renderDashboard();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /user.*management|team.*management|role.*management/i });
        expect(link).toHaveAttribute('href', '/admin/users');
      });
    });

    it('should have a link to Event Management', async () => {
      renderDashboard();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /event management/i });
        expect(link).toHaveAttribute('href', '/admin/events');
      });
    });

    it('should have a link to Application Review', async () => {
      renderDashboard();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /application.*review|applications/i });
        expect(link).toHaveAttribute('href', '/admin/applications');
      });
    });

    it('should have a link to CMS / Public Content Management', async () => {
      renderDashboard();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /cms|content.*management|public.*content/i });
        expect(link).toHaveAttribute('href', '/admin/cms');
      });
    });

    it('should have a link to Membership Management', async () => {
      renderDashboard();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /membership.*management/i });
        expect(link).toHaveAttribute('href', '/admin/membership');
      });
    });

    it('should have a link to System Statistics', async () => {
      renderDashboard();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /system.*statistics|system.*stats/i });
        expect(link).toHaveAttribute('href', '/admin/statistics');
      });
    });

    it('should have a link to Audit Logs', async () => {
      renderDashboard();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /audit.*log/i });
        expect(link).toHaveAttribute('href', '/admin/audit-logs');
      });
    });

    it('should have a link to Attendance Statistics', async () => {
      renderDashboard();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /attendance.*statistic/i });
        expect(link).toHaveAttribute('href', '/admin/events/statistics');
      });
    });

    it('should have a link to Financial Statements', async () => {
      renderDashboard();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /financial.*statement/i });
        expect(link).toHaveAttribute('href', '/financial-statements');
      });
    });

    it('should have a link to Transaction History', async () => {
      renderDashboard();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /transaction.*history/i });
        expect(link).toHaveAttribute('href', '/transaction-history');
      });
    });

    it('should have a link to Activity Timeline', async () => {
      renderDashboard();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /activity.*timeline/i });
        expect(link).toHaveAttribute('href', '/activity');
      });
    });

    it('should have a link to Certificates', async () => {
      renderDashboard();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /certificate/i });
        expect(link).toHaveAttribute('href', '/certificates');
      });
    });

    it('should have a link to Messages', async () => {
      renderDashboard();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /message/i });
        expect(link).toHaveAttribute('href', '/investor/messages');
      });
    });
  });

  describe('Overview Stats', () => {
    it('should display founder application count', async () => {
      renderDashboard();
      await waitFor(() => {
        const elements = screen.getAllByText('Founder Applications');
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('should display investor application count', async () => {
      renderDashboard();
      await waitFor(() => {
        const elements = screen.getAllByText('Investor Applications');
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Access Control', () => {
    it('should show access denied for non-admin users', async () => {
      mockAuthState = {
        user: { id: 'user-1', email: 'user@test.com', roles: ['user'] },
        loading: false,
        isAuthenticated: true,
        token: 'user-token',
        signOut: vi.fn(),
      };

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      });
    });

    it('should show loading state while auth is loading', () => {
      mockAuthState = {
        user: null,
        loading: true,
        isAuthenticated: false,
        token: '',
        signOut: vi.fn(),
      };

      renderDashboard();

      // Should show spinner, not admin content
      expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
    });
  });
});
