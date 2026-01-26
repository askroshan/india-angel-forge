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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { testUsers, createMockSession } from '../fixtures/testData';

import AccreditationVerification from '@/pages/compliance/AccreditationVerification';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-COMPLIANCE-003: Verify Accredited Investor Status', () => {
  const complianceOfficer = testUsers.compliance_officer;
  const mockSession = createMockSession(complianceOfficer);

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
  });

  describe('Dashboard Access', () => {
    it('should display accreditation verification dashboard for compliance officer', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

      renderWithRouter(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Accreditation Verification/i)).toBeInTheDocument();
      });
    });

    it('should show list of pending accreditation reviews', async () => {
      const mockAccreditations = [
        {
          id: 'acc-001',
          investor_id: 'investor-001',
          verification_type: 'income_based',
          status: 'pending',
          investor: {
            profile: {
              full_name: 'Priya Sharma'
            }
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockAccreditations,
          error: null,
        }),
      } as any);

      renderWithRouter(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
      });
    });
  });

  describe('Verification Actions', () => {
    it('should allow marking investor as accredited', async () => {
      const user = userEvent.setup();
      
      const mockAccreditation = {
        id: 'acc-001',
        investor_id: 'investor-001',
        verification_type: 'income_based',
        status: 'pending',
        investor: {
          profile: { full_name: 'Priya Sharma' }
        }
      };

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [mockAccreditation],
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: null,
        error: null,
      } as any);

      renderWithRouter(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
      });

      const verifyButtons = screen.getAllByRole('button', { name: /verify/i });
      await user.click(verifyButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
      });
    });

    it('should require expiry date when verifying', async () => {
      const user = userEvent.setup();
      
      const mockAccreditation = {
        id: 'acc-001',
        investor_id: 'investor-001',
        verification_type: 'income_based',
        status: 'pending',
        investor: {
          profile: { full_name: 'Priya Sharma' }
        }
      };

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [mockAccreditation],
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      } as any);

      renderWithRouter(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
      });

      const verifyButtons = screen.getAllByRole('button', { name: /verify/i });
      await user.click(verifyButtons[0]);

      const confirmButton = await screen.findByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/expiry date is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Expiry Warnings', () => {
    it('should show warning for expiring accreditations (within 30 days)', async () => {
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 20);

      const mockAccreditations = [
        {
          id: 'acc-001',
          investor_id: 'investor-001',
          verification_type: 'income_based',
          status: 'verified',
          expiry_date: expiringDate.toISOString(),
          investor: {
            profile: { full_name: 'Priya Sharma' }
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockAccreditations,
          error: null,
        }),
      } as any);

      renderWithRouter(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/expiring soon/i)).toBeInTheDocument();
      });
    });

    it('should show expired status for past expiry dates', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 5);

      const mockAccreditations = [
        {
          id: 'acc-001',
          investor_id: 'investor-001',
          verification_type: 'income_based',
          status: 'verified',
          expiry_date: expiredDate.toISOString(),
          investor: {
            profile: { full_name: 'Priya Sharma' }
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockAccreditations,
          error: null,
        }),
      } as any);

      renderWithRouter(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/expired/i)).toBeInTheDocument();
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
          verification_type: 'income_based',
          status: 'pending',
          investor: {
            profile: { full_name: 'Priya Sharma' }
          }
        },
        {
          id: 'acc-002',
          investor_id: 'investor-002',
          verification_type: 'net_worth_based',
          status: 'verified',
          investor: {
            profile: { full_name: 'Rahul Gupta' }
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockAccreditations,
          error: null,
        }),
      } as any);

      renderWithRouter(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
        expect(screen.getByText(/Rahul Gupta/i)).toBeInTheDocument();
      });

      const statusFilter = screen.getByRole('combobox', { name: /status/i });
      await user.click(statusFilter);
      
      const pendingOption = screen.getByRole('option', { name: /pending/i });
      await user.click(pendingOption);

      await waitFor(() => {
        expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
        expect(screen.queryByText(/Rahul Gupta/i)).not.toBeInTheDocument();
      });
    });

    it('should search investors by name', async () => {
      const user = userEvent.setup();
      
      const mockAccreditations = [
        {
          id: 'acc-001',
          investor_id: 'investor-001',
          verification_type: 'income_based',
          status: 'pending',
          investor: {
            profile: { full_name: 'Priya Sharma' }
          }
        },
        {
          id: 'acc-002',
          investor_id: 'investor-002',
          verification_type: 'net_worth_based',
          status: 'verified',
          investor: {
            profile: { full_name: 'Rahul Gupta' }
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockAccreditations,
          error: null,
        }),
      } as any);

      renderWithRouter(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search investors/i);
      await user.type(searchInput, 'Rahul');

      await waitFor(() => {
        expect(screen.queryByText(/Priya Sharma/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Rahul Gupta/i)).toBeInTheDocument();
      });
    });
  });

  describe('Statistics', () => {
    it('should display accreditation statistics', async () => {
      const mockAccreditations = [
        {
          id: 'acc-001',
          status: 'pending',
          investor: { profile: { full_name: 'User 1' } }
        },
        {
          id: 'acc-002',
          status: 'verified',
          investor: { profile: { full_name: 'User 2' } }
        },
        {
          id: 'acc-003',
          status: 'verified',
          investor: { profile: { full_name: 'User 3' } }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockAccreditations,
          error: null,
        }),
      } as any);

      renderWithRouter(<AccreditationVerification />);

      await waitFor(() => {
        expect(screen.getByText(/3/)).toBeInTheDocument(); // Total
        expect(screen.getByText(/2/)).toBeInTheDocument(); // Verified
        expect(screen.getByText(/1/)).toBeInTheDocument(); // Pending
      });
    });
  });
});
