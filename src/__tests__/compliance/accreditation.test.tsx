/**
 * US-COMPLIANCE-003: Verify Accredited Investor Status
 * 
 * As a: Compliance Officer
 * I want to: Verify investor's accredited status
 * So that: Only qualified investors can participate in deals
 * 
 * Acceptance Criteria:
 * - GIVEN investor submits accreditation proof
 *   WHEN compliance reviews documents
 *   THEN can mark as accredited with expiry date
 * 
 * - GIVEN investor is accredited
 *   WHEN viewing investor list
 *   THEN see badge indicating status and expiry
 * 
 * - GIVEN accreditation expires soon (30 days)
 *   WHEN viewing dashboard
 *   THEN see warning notification
 * 
 * - GIVEN investor is not accredited
 *   WHEN they try to express interest in deal
 *   THEN blocked with message to complete accreditation
 * 
 * Priority: Critical
 * Status: Implementing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

import AccreditationVerification from '@/pages/compliance/AccreditationVerification';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'compliance-officer-001',
      email: 'compliance@example.com',
      role: 'compliance_officer'
    },
    token: 'mock-token',
    isAuthenticated: true
  })
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('US-COMPLIANCE-003: Verify Accredited Investor Status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Access', () => {
    it('should display accreditation verification dashboard for compliance officer', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      renderWithProviders(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Accreditation Verification/i)).toBeInTheDocument();
      });
    });

    it('should show list of pending accreditation reviews', async () => {
      const mockAccreditations = [
        {
          id: 'acc-001',
          investor_id: 'investor-001',
          verification_method: 'income',
          verification_status: 'pending',
          annual_income: 5000000,
          documents: [],
          submitted_at: '2026-01-20T10:00:00Z',
          investor: {
            id: 'investor-001',
            full_name: 'Priya Sharma',
            email: 'priya@example.com'
          }
        }
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockAccreditations);

      renderWithProviders(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no applications exist', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      renderWithProviders(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/No accreditation applications found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Verification Actions', () => {
    it('should allow marking investor as accredited', async () => {
      const user = userEvent.setup();
      
      const mockAccreditation = {
        id: 'acc-001',
        investor_id: 'investor-001',
        verification_method: 'income',
        verification_status: 'pending',
        annual_income: 5000000,
        documents: [],
        submitted_at: '2026-01-20T10:00:00Z',
        investor: {
          id: 'investor-001',
          full_name: 'Priya Sharma',
          email: 'priya@example.com'
        }
      };

      vi.mocked(apiClient.get).mockResolvedValue([mockAccreditation]);

      renderWithProviders(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
      });

      // Click the Approve button to open the dialog
      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      // Dialog should open with expiry date field
      await waitFor(() => {
        expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
      });
    });

    it('should submit approval with expiry date', async () => {
      const user = userEvent.setup();
      
      const mockAccreditation = {
        id: 'acc-001',
        investor_id: 'investor-001',
        verification_method: 'income',
        verification_status: 'pending',
        annual_income: 5000000,
        documents: [],
        submitted_at: '2026-01-20T10:00:00Z',
        investor: {
          id: 'investor-001',
          full_name: 'Priya Sharma',
          email: 'priya@example.com'
        }
      };

      vi.mocked(apiClient.get).mockResolvedValue([mockAccreditation]);
      vi.mocked(apiClient.patch).mockResolvedValue({ success: true });

      renderWithProviders(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
      });

      // Click the Approve button in the card
      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await user.click(approveButtons[0]);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
      });

      // Click the Approve button in the dialog to submit
      const dialogApproveButton = screen.getAllByRole('button', { name: /approve/i }).slice(-1)[0];
      await user.click(dialogApproveButton);

      await waitFor(() => {
        expect(apiClient.patch).toHaveBeenCalledWith(
          expect.stringContaining('/api/compliance/accreditation/acc-001/approve'),
          expect.objectContaining({ expiry_date: expect.any(String) })
        );
      });
    });
  });

  describe('Status Display', () => {
    it('should display approved status for verified applications', async () => {
      const mockAccreditations = [
        {
          id: 'acc-001',
          investor_id: 'investor-001',
          verification_method: 'income',
          verification_status: 'approved',
          annual_income: 5000000,
          expiry_date: '2027-01-20T00:00:00Z',
          documents: [],
          submitted_at: '2026-01-15T10:00:00Z',
          investor: {
            id: 'investor-001',
            full_name: 'Priya Sharma',
            email: 'priya@example.com'
          }
        }
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockAccreditations);

      renderWithProviders(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Approved/i)).toBeInTheDocument();
      });
    });

    it('should display expired status for past expiry dates', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 5);

      const mockAccreditations = [
        {
          id: 'acc-001',
          investor_id: 'investor-001',
          verification_method: 'income',
          verification_status: 'expired',
          annual_income: 5000000,
          expiry_date: expiredDate.toISOString(),
          documents: [],
          submitted_at: '2026-01-15T10:00:00Z',
          investor: {
            id: 'investor-001',
            full_name: 'Priya Sharma',
            email: 'priya@example.com'
          }
        }
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockAccreditations);

      renderWithProviders(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Expired/i)).toBeInTheDocument();
      });
    });

    it('should display rejected status for rejected applications', async () => {
      const mockAccreditations = [
        {
          id: 'acc-001',
          investor_id: 'investor-001',
          verification_method: 'income',
          verification_status: 'rejected',
          annual_income: 5000000,
          rejection_reason: 'Income proof invalid',
          documents: [],
          submitted_at: '2026-01-15T10:00:00Z',
          investor: {
            id: 'investor-001',
            full_name: 'Priya Sharma',
            email: 'priya@example.com'
          }
        }
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockAccreditations);

      renderWithProviders(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Rejected/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filter & Search', () => {
    it('should filter by verification status', async () => {
      const user = userEvent.setup();
      
      const mockAccreditations = [
        {
          id: 'acc-001',
          investor_id: 'investor-001',
          verification_method: 'income',
          verification_status: 'pending',
          annual_income: 5000000,
          documents: [],
          submitted_at: '2026-01-20T10:00:00Z',
          investor: {
            id: 'investor-001',
            full_name: 'Priya Sharma',
            email: 'priya@example.com'
          }
        },
        {
          id: 'acc-002',
          investor_id: 'investor-002',
          verification_method: 'net_worth',
          verification_status: 'approved',
          net_worth: 25000000,
          documents: [],
          submitted_at: '2026-01-20T10:00:00Z',
          investor: {
            id: 'investor-002',
            full_name: 'Rahul Gupta',
            email: 'rahul@example.com'
          }
        }
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockAccreditations);

      renderWithProviders(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
        expect(screen.getByText(/Rahul Gupta/i)).toBeInTheDocument();
      });

      // Click the status filter dropdown
      const statusFilter = screen.getByRole('combobox');
      await user.click(statusFilter);
      
      // Select pending option
      const pendingOption = await screen.findByRole('option', { name: /pending/i });
      await user.click(pendingOption);

      await waitFor(() => {
        expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
        expect(screen.queryByText(/Rahul Gupta/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Rejection Flow', () => {
    it('should allow rejecting application with reason', async () => {
      const user = userEvent.setup();
      
      const mockAccreditation = {
        id: 'acc-001',
        investor_id: 'investor-001',
        verification_method: 'income',
        verification_status: 'pending',
        annual_income: 5000000,
        documents: [],
        submitted_at: '2026-01-20T10:00:00Z',
        investor: {
          id: 'investor-001',
          full_name: 'Priya Sharma',
          email: 'priya@example.com'
        }
      };

      vi.mocked(apiClient.get).mockResolvedValue([mockAccreditation]);
      vi.mocked(apiClient.patch).mockResolvedValue({ success: true });

      renderWithProviders(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
      });

      // Click the Reject button
      const rejectButton = screen.getByRole('button', { name: /reject/i });
      await user.click(rejectButton);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByLabelText(/rejection reason/i)).toBeInTheDocument();
      });

      // Enter rejection reason
      const reasonField = screen.getByLabelText(/rejection reason/i);
      await user.type(reasonField, 'Income documents are not valid');

      // Submit rejection
      const dialogRejectButton = screen.getAllByRole('button', { name: /reject/i }).slice(-1)[0];
      await user.click(dialogRejectButton);

      await waitFor(() => {
        expect(apiClient.patch).toHaveBeenCalledWith(
          expect.stringContaining('/api/compliance/accreditation/acc-001/reject'),
          expect.objectContaining({ reason: 'Income documents are not valid' })
        );
      });
    });
  });

  describe('View Documents', () => {
    it('should allow viewing application documents', async () => {
      const user = userEvent.setup();
      
      const mockAccreditation = {
        id: 'acc-001',
        investor_id: 'investor-001',
        verification_method: 'income',
        verification_status: 'pending',
        annual_income: 5000000,
        documents: [
          { id: 'doc-1', type: 'income_proof', url: 'https://example.com/doc1.pdf' }
        ],
        submitted_at: '2026-01-20T10:00:00Z',
        investor: {
          id: 'investor-001',
          full_name: 'Priya Sharma',
          email: 'priya@example.com'
        }
      };

      vi.mocked(apiClient.get).mockResolvedValue([mockAccreditation]);

      renderWithProviders(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
      });

      // Click the View Documents button
      const viewDocsButton = screen.getByRole('button', { name: /view documents/i });
      await user.click(viewDocsButton);

      // Dialog should open with documents
      await waitFor(() => {
        expect(screen.getByText(/Application Documents/i)).toBeInTheDocument();
        expect(screen.getByText(/income_proof/i)).toBeInTheDocument();
      });
    });
  });
});
