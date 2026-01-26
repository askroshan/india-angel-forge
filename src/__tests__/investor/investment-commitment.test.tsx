/**
 * US-INVESTOR-007: Submit Investment Commitment
 * 
 * As an: Investor
 * I want to: Submit formal investment commitment
 * So that: I can proceed with fund transfer and SPV membership
 * 
 * Acceptance Criteria:
 * - GIVEN my interest is accepted
 *   WHEN I navigate to commitment page
 *   THEN I see commitment form with SPV details
 * 
 * - GIVEN I fill commitment form
 *   WHEN I submit
 *   THEN commitment is recorded in database
 * 
 * - GIVEN commitment is submitted
 *   WHEN viewing status
 *   THEN I see pending payment status
 * 
 * - GIVEN payment is confirmed
 *   WHEN viewing commitment
 *   THEN status shows paid with receipt
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

import InvestmentCommitment from '@/pages/investor/InvestmentCommitment';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-INVESTOR-007: Submit Investment Commitment', () => {
  const investor = testUsers.standard_investor;
  const mockSession = createMockSession(investor);

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
  });

  describe('Commitment Form', () => {
    it('should display commitment form for accepted interest', async () => {
      const mockInterest = {
        id: 'interest-001',
        deal_id: 'deal-001',
        status: 'accepted',
        commitment_amount: 1000000,
        spv_id: 'spv-001',
        deal: {
          title: 'HealthTech Startup',
          company_name: 'HealthTech Inc'
        }
      };

      const mockSPV = {
        id: 'spv-001',
        name: 'HealthTech SPV 2026',
        target_amount: 50000000
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockInterest,
              error: null,
            }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockSPV,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<InvestmentCommitment />);

      await waitFor(() => {
        expect(screen.getByText(/Investment Commitment/i)).toBeInTheDocument();
        expect(screen.getByText(/HealthTech SPV 2026/i)).toBeInTheDocument();
      });
    });

    it('should show SPV details in form', async () => {
      const mockInterest = {
        id: 'interest-001',
        status: 'accepted',
        commitment_amount: 1000000,
        spv_id: 'spv-001',
        deal: { title: 'Test Deal', company_name: 'Test Co' }
      };

      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        target_amount: 50000000,
        carry_percentage: 20
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockInterest, error: null }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockSPV, error: null }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<InvestmentCommitment />);

      await waitFor(() => {
        expect(screen.getByText(/Test SPV/i)).toBeInTheDocument();
        expect(screen.getByText(/20%/i)).toBeInTheDocument();
      });
    });
  });

  describe('Commitment Submission', () => {
    it('should allow submitting commitment', async () => {
      const user = userEvent.setup();
      
      const mockInterest = {
        id: 'interest-001',
        status: 'accepted',
        commitment_amount: 1000000,
        spv_id: 'spv-001',
        deal: { title: 'Test Deal', company_name: 'Test Co' }
      };

      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        target_amount: 50000000
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockInterest, error: null }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockSPV, error: null }),
          } as any;
        } else if (table === 'investment_commitments') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<InvestmentCommitment />);

      await waitFor(() => {
        expect(screen.getByText(/Investment Commitment/i)).toBeInTheDocument();
      });

      const confirmCheckbox = screen.getByRole('checkbox', { name: /confirm commitment/i });
      await user.click(confirmCheckbox);

      const submitButton = screen.getByRole('button', { name: /submit commitment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/commitment submitted/i)).toBeInTheDocument();
      });
    });

    it('should require confirmation checkbox', async () => {
      const user = userEvent.setup();
      
      const mockInterest = {
        id: 'interest-001',
        status: 'accepted',
        commitment_amount: 1000000,
        spv_id: 'spv-001',
        deal: { title: 'Test Deal', company_name: 'Test Co' }
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockInterest, error: null }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: { id: 'spv-001', name: 'Test SPV' }, error: null }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<InvestmentCommitment />);

      await waitFor(() => {
        expect(screen.getByText(/Investment Commitment/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /submit commitment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must confirm/i)).toBeInTheDocument();
      });
    });
  });

  describe('Payment Status', () => {
    it('should show pending payment status after submission', async () => {
      const mockInterest = {
        id: 'interest-001',
        status: 'accepted',
        commitment_amount: 1000000,
        spv_id: 'spv-001',
        deal: { title: 'Test Deal', company_name: 'Test Co' }
      };

      const mockCommitment = {
        id: 'commitment-001',
        status: 'pending_payment',
        amount: 1000000
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockInterest, error: null }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: { id: 'spv-001', name: 'Test SPV' }, error: null }),
          } as any;
        } else if (table === 'investment_commitments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockCommitment, error: null }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<InvestmentCommitment />);

      await waitFor(() => {
        expect(screen.getByText(/pending payment/i)).toBeInTheDocument();
      });
    });

    it('should show paid status with confirmation', async () => {
      const mockInterest = {
        id: 'interest-001',
        status: 'accepted',
        commitment_amount: 1000000,
        spv_id: 'spv-001',
        deal: { title: 'Test Deal', company_name: 'Test Co' }
      };

      const mockCommitment = {
        id: 'commitment-001',
        status: 'paid',
        amount: 1000000,
        payment_reference: 'PAY-123456'
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockInterest, error: null }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: { id: 'spv-001', name: 'Test SPV' }, error: null }),
          } as any;
        } else if (table === 'investment_commitments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockCommitment, error: null }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<InvestmentCommitment />);

      await waitFor(() => {
        expect(screen.getByText(/paid/i)).toBeInTheDocument();
        expect(screen.getByText(/PAY-123456/i)).toBeInTheDocument();
      });
    });
  });

  describe('Access Control', () => {
    it('should deny access if interest not accepted', async () => {
      const mockInterest = {
        id: 'interest-001',
        status: 'pending', // Not accepted
        commitment_amount: 1000000,
        deal: { title: 'Test Deal', company_name: 'Test Co' }
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockInterest, error: null }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<InvestmentCommitment />);

      await waitFor(() => {
        expect(screen.getByText(/not yet accepted/i)).toBeInTheDocument();
      });
    });
  });
});
