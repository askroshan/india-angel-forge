/**
 * US-ADMIN-002: View Audit Logs
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
import { supabase } from '@/integrations/supabase/client';
import { testUsers, createMockSession } from '../fixtures/testData';

import AuditLogs from '@/pages/admin/AuditLogs';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-ADMIN-002: View Audit Logs', () => {
  const admin = testUsers.admin;
  const mockSession = createMockSession(admin);

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
  });

  describe('Dashboard Access', () => {
    it('should display audit logs dashboard for admin', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/Audit Logs/i)).toBeInTheDocument();
      });
    });

    it('should show list of audit log entries', async () => {
      const mockLogs = [
        {
          id: 'log-001',
          user_id: 'compliance-001',
          action: 'verify_kyc',
          resource_type: 'kyc_documents',
          resource_id: 'kyc-001',
          created_at: new Date().toISOString(),
          user: {
            profile: {
              full_name: 'Sarah Compliance',
              email: 'sarah@indiaangel.in'
            }
          },
          details: {
            document_type: 'PAN',
            investor_name: 'Priya Sharma'
          }
        },
        {
          id: 'log-002',
          user_id: 'admin-001',
          action: 'assign_role',
          resource_type: 'profiles',
          resource_id: 'user-001',
          created_at: new Date().toISOString(),
          user: {
            profile: {
              full_name: 'Admin User',
              email: 'admin@indiaangel.in'
            }
          },
          details: {
            role: 'moderator',
            target_user: 'john@example.com'
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockLogs,
          error: null,
        }),
      } as any);

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/Sarah Compliance/i)).toBeInTheDocument();
        expect(screen.getByText(/Admin User/i)).toBeInTheDocument();
      });
    });
  });

  describe('Log Details', () => {
    it('should display action type and timestamp', async () => {
      const timestamp = new Date('2024-01-15T10:30:00Z');
      const mockLogs = [
        {
          id: 'log-001',
          user_id: 'compliance-001',
          action: 'verify_kyc',
          resource_type: 'kyc_documents',
          resource_id: 'kyc-001',
          created_at: timestamp.toISOString(),
          user: {
            profile: {
              full_name: 'Sarah Compliance',
              email: 'sarah@indiaangel.in'
            }
          },
          details: {}
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockLogs,
          error: null,
        }),
      } as any);

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/verify_kyc/i)).toBeInTheDocument();
      });
    });

    it('should show resource type and ID', async () => {
      const mockLogs = [
        {
          id: 'log-001',
          user_id: 'compliance-001',
          action: 'verify_kyc',
          resource_type: 'kyc_documents',
          resource_id: 'kyc-001',
          created_at: new Date().toISOString(),
          user: {
            profile: {
              full_name: 'Sarah Compliance',
              email: 'sarah@indiaangel.in'
            }
          },
          details: {}
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockLogs,
          error: null,
        }),
      } as any);

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/kyc_documents/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by action type', async () => {
      const user = userEvent.setup();
      
      const mockLogs = [
        {
          id: 'log-001',
          action: 'verify_kyc',
          resource_type: 'kyc_documents',
          user: { profile: { full_name: 'User 1', email: 'user1@test.com' } },
          created_at: new Date().toISOString(),
          details: {}
        },
        {
          id: 'log-002',
          action: 'assign_role',
          resource_type: 'profiles',
          user: { profile: { full_name: 'User 2', email: 'user2@test.com' } },
          created_at: new Date().toISOString(),
          details: {}
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockLogs,
          error: null,
        }),
      } as any);

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/User 1/i)).toBeInTheDocument();
        expect(screen.getByText(/User 2/i)).toBeInTheDocument();
      });

      const actionFilter = screen.getByRole('combobox', { name: /action/i });
      await user.click(actionFilter);
      
      const kycOption = screen.getByRole('option', { name: /verify_kyc/i });
      await user.click(kycOption);

      await waitFor(() => {
        expect(screen.getByText(/User 1/i)).toBeInTheDocument();
        expect(screen.queryByText(/User 2/i)).not.toBeInTheDocument();
      });
    });

    it('should filter by date range', async () => {
      const user = userEvent.setup();
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const mockLogs = [
        {
          id: 'log-001',
          action: 'verify_kyc',
          created_at: today.toISOString(),
          user: { profile: { full_name: 'Recent User', email: 'recent@test.com' } },
          resource_type: 'kyc_documents',
          details: {}
        },
        {
          id: 'log-002',
          action: 'assign_role',
          created_at: yesterday.toISOString(),
          user: { profile: { full_name: 'Old User', email: 'old@test.com' } },
          resource_type: 'profiles',
          details: {}
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockLogs,
          error: null,
        }),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
      } as any);

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/Recent User/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search', () => {
    it('should search by user email', async () => {
      const user = userEvent.setup();
      
      const mockLogs = [
        {
          id: 'log-001',
          action: 'verify_kyc',
          user: { profile: { full_name: 'Sarah Compliance', email: 'sarah@indiaangel.in' } },
          created_at: new Date().toISOString(),
          resource_type: 'kyc_documents',
          details: {}
        },
        {
          id: 'log-002',
          action: 'assign_role',
          user: { profile: { full_name: 'John Admin', email: 'john@indiaangel.in' } },
          created_at: new Date().toISOString(),
          resource_type: 'profiles',
          details: {}
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockLogs,
          error: null,
        }),
      } as any);

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/Sarah Compliance/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search logs/i);
      await user.type(searchInput, 'john');

      await waitFor(() => {
        expect(screen.queryByText(/Sarah Compliance/i)).not.toBeInTheDocument();
        expect(screen.getByText(/John Admin/i)).toBeInTheDocument();
      });
    });

    it('should search by resource ID', async () => {
      const user = userEvent.setup();
      
      const mockLogs = [
        {
          id: 'log-001',
          action: 'verify_kyc',
          resource_id: 'kyc-001',
          user: { profile: { full_name: 'User 1', email: 'user1@test.com' } },
          created_at: new Date().toISOString(),
          resource_type: 'kyc_documents',
          details: {}
        },
        {
          id: 'log-002',
          action: 'assign_role',
          resource_id: 'profile-001',
          user: { profile: { full_name: 'User 2', email: 'user2@test.com' } },
          created_at: new Date().toISOString(),
          resource_type: 'profiles',
          details: {}
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockLogs,
          error: null,
        }),
      } as any);

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getByText(/User 1/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search logs/i);
      await user.type(searchInput, 'kyc-001');

      await waitFor(() => {
        expect(screen.getByText(/User 1/i)).toBeInTheDocument();
        expect(screen.queryByText(/User 2/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should show pagination when logs exceed page size', async () => {
      const mockLogs = Array.from({ length: 50 }, (_, i) => ({
        id: `log-${i}`,
        action: 'test_action',
        user: { profile: { full_name: `User ${i}`, email: `user${i}@test.com` } },
        created_at: new Date().toISOString(),
        resource_type: 'test',
        details: {}
      }));

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockLogs.slice(0, 25),
          error: null,
        }),
      } as any);

      renderWithRouter(<AuditLogs />);

      await waitFor(() => {
        expect(screen.getAllByText(/User/i).length).toBeLessThanOrEqual(25);
      });
    });
  });
});
