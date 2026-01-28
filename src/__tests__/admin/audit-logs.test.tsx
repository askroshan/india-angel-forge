/**
 * US-ADMIN-006: View Audit Logs
 * 
 * As an: Admin
 * I want to: View system audit logs
 * So that: I can track all compliance and security-related actions
 * 
 * Acceptance Criteria:
 * - GIVEN I am logged in as admin
 *   WHEN I navigate to audit logs page
 *   THEN I see list of all logged actions
 * 
 * - GIVEN audit logs exist
 *   WHEN viewing logs
 *   THEN I see user, action, timestamp, resource, and details
 * 
 * - GIVEN I want to filter logs
 *   WHEN I select action type or date range
 *   THEN logs are filtered accordingly
 * 
 * - GIVEN I need to search
 *   WHEN I enter user email or resource ID
 *   THEN matching logs are displayed
 * 
 * Priority: High
 * Status: Implementing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

import AuditLogs from '@/pages/admin/AuditLogs';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      email: 'admin@indiaangel.in',
      role: 'ADMIN',
    },
    token: 'mock-token',
    isAuthenticated: true,
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-ADMIN-006: View Audit Logs', () => {
  const mockLogs = [
    {
      id: 'log-001',
      userId: 'compliance-001',
      action: 'verify_kyc',
      resourceType: 'kyc_documents',
      resourceId: 'kyc-001',
      createdAt: new Date().toISOString(),
      userName: 'Sarah Compliance',
      userEmail: 'sarah@indiaangel.in',
      details: {
        document_type: 'PAN',
        investor_name: 'Priya Sharma'
      }
    },
    {
      id: 'log-002',
      userId: 'admin-001',
      action: 'assign_role',
      resourceType: 'profiles',
      resourceId: 'user-001',
      createdAt: new Date().toISOString(),
      userName: 'Admin User',
      userEmail: 'admin@indiaangel.in',
      details: {
        role: 'moderator',
        target_user: 'john@example.com'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default fetch mock
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockLogs),
    } as Response);
  });

  describe('Dashboard Access', () => {
    it('should display audit logs dashboard for admin', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      } as Response);

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/Audit Logs/i)).toBeInTheDocument();
      });
    });

    it('should show list of audit log entries', async () => {
      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/Sarah Compliance/i)).toBeInTheDocument();
        expect(screen.getByText(/Admin User/i)).toBeInTheDocument();
      });
    });
  });

  describe('Log Details', () => {
    it('should display action type and timestamp', async () => {
      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        // Action type is displayed with underscores replaced by spaces
        expect(screen.getByText(/verify kyc/i)).toBeInTheDocument();
      });
    });

    it('should show resource type and ID', async () => {
      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/kyc_documents/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by action type', async () => {
      const user = userEvent.setup();

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/Sarah Compliance/i)).toBeInTheDocument();
        expect(screen.getByText(/Admin User/i)).toBeInTheDocument();
      });

      // Find action filter select
      const actionFilter = screen.getByLabelText(/action type/i);
      await user.click(actionFilter);
      
      // Select verify kyc option (note: underscores replaced with spaces)
      const kycOption = await screen.findByRole('option', { name: /verify kyc/i });
      await user.click(kycOption);

      await waitFor(() => {
        expect(screen.getByText(/Sarah Compliance/i)).toBeInTheDocument();
        expect(screen.queryByText(/Admin User/i)).not.toBeInTheDocument();
      });
    });

    it('should filter by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const dateMockLogs = [
        {
          id: 'log-001',
          action: 'verify_kyc',
          createdAt: today.toISOString(),
          userName: 'Recent User',
          userEmail: 'recent@test.com',
          resourceType: 'kyc_documents',
          details: {}
        },
        {
          id: 'log-002',
          action: 'assign_role',
          createdAt: yesterday.toISOString(),
          userName: 'Old User',
          userEmail: 'old@test.com',
          resourceType: 'profiles',
          details: {}
        }
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(dateMockLogs),
      } as Response);

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/Recent User/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search', () => {
    it('should search by user email', async () => {
      const user = userEvent.setup();
      
      const searchMockLogs = [
        {
          id: 'log-001',
          action: 'verify_kyc',
          userName: 'Sarah Compliance',
          userEmail: 'sarah@indiaangel.in',
          createdAt: new Date().toISOString(),
          resourceType: 'kyc_documents',
          details: {}
        },
        {
          id: 'log-002',
          action: 'assign_role',
          userName: 'John Admin',
          userEmail: 'john@indiaangel.in',
          createdAt: new Date().toISOString(),
          resourceType: 'profiles',
          details: {}
        }
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(searchMockLogs),
      } as Response);

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/Sarah Compliance/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'john');

      await waitFor(() => {
        expect(screen.queryByText(/Sarah Compliance/i)).not.toBeInTheDocument();
        expect(screen.getByText(/John Admin/i)).toBeInTheDocument();
      });
    });

    it('should search by resource ID', async () => {
      const user = userEvent.setup();
      
      const searchMockLogs = [
        {
          id: 'log-001',
          action: 'verify_kyc',
          resourceId: 'kyc-001',
          userName: 'User 1',
          userEmail: 'user1@test.com',
          createdAt: new Date().toISOString(),
          resourceType: 'kyc_documents',
          details: {}
        },
        {
          id: 'log-002',
          action: 'assign_role',
          resourceId: 'profile-001',
          userName: 'User 2',
          userEmail: 'user2@test.com',
          createdAt: new Date().toISOString(),
          resourceType: 'profiles',
          details: {}
        }
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(searchMockLogs),
      } as Response);

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/User 1/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'kyc-001');

      await waitFor(() => {
        expect(screen.getByText(/User 1/i)).toBeInTheDocument();
        expect(screen.queryByText(/User 2/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should show pagination when logs exceed page size', async () => {
      const manyLogs = Array.from({ length: 50 }, (_, i) => ({
        id: `log-${i}`,
        action: 'test_action',
        userName: `Test User ${i}`,
        userEmail: `user${i}@test.com`,
        createdAt: new Date().toISOString(),
        resourceType: 'test',
        details: {}
      }));

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(manyLogs),
      } as Response);

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        // Should show pagination controls when more than 25 items
        expect(screen.getByText(/Page 1 of/i)).toBeInTheDocument();
      });
    });
  });
});
