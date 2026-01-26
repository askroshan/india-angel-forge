/**
 * US-INVESTOR-004: Express Interest in Deal
 * 
 * As an: Investor
 * I want to: Express interest in an investment deal
 * So that: Lead investors can consider me for SPV participation
 * 
 * Acceptance Criteria:
 * - GIVEN I am viewing a deal
 *   WHEN I click "Express Interest"
 *   THEN I see form to indicate investment amount and notes
 * 
 * - GIVEN I am accredited
 *   WHEN I submit interest
 *   THEN interest is recorded with pending status
 * 
 * - GIVEN I am not accredited
 *   WHEN I try to express interest
 *   THEN I see message to complete accreditation
 * 
 * - GIVEN I already expressed interest
 *   WHEN I view deal
 *   THEN button shows "Interest Submitted" (disabled)
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

import DealsPage from '@/pages/investor/DealsPage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-INVESTOR-004: Express Interest in Deal', () => {
  const investor = testUsers.standard_investor;
  const mockSession = createMockSession(investor);

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
  });

  describe('Interest Dialog', () => {
    it('should open interest dialog when clicking Express Interest', async () => {
      const user = userEvent.setup();
      
      const mockDeal = {
        id: 'deal-001',
        title: 'HealthTech Startup',
        description: 'Revolutionary healthcare solution',
        company_name: 'HealthTech Inc',
        sector: 'Healthcare',
        deal_status: 'open',
        deal_size: 50000000,
        min_investment: 500000,
        slug: 'healthtech-startup'
      };

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [mockDeal],
          error: null,
        }),
      } as any);

      renderWithRouter(<DealsPage />);

      await waitFor(() => {
        expect(screen.getByText(/HealthTech Startup/i)).toBeInTheDocument();
      });

      const expressButton = screen.getByRole('button', { name: /express interest/i });
      await user.click(expressButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/investment amount/i)).toBeInTheDocument();
      });
    });

    it('should show minimum investment requirement in dialog', async () => {
      const user = userEvent.setup();
      
      const mockDeal = {
        id: 'deal-001',
        title: 'HealthTech Startup',
        company_name: 'HealthTech Inc',
        sector: 'Healthcare',
        deal_status: 'open',
        deal_size: 50000000,
        min_investment: 500000,
        slug: 'healthtech-startup'
      };

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [mockDeal],
          error: null,
        }),
      } as any);

      renderWithRouter(<DealsPage />);

      await waitFor(() => {
        expect(screen.getByText(/HealthTech Startup/i)).toBeInTheDocument();
      });

      const expressButton = screen.getByRole('button', { name: /express interest/i });
      await user.click(expressButton);

      await waitFor(() => {
        expect(screen.getByText(/minimum.*5.*lakh/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accreditation Check', () => {
    it('should block non-accredited investors with message', async () => {
      const user = userEvent.setup();
      
      const mockDeal = {
        id: 'deal-001',
        title: 'HealthTech Startup',
        deal_status: 'open',
        slug: 'healthtech-startup'
      };

      let callCount = 0;
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deals') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockDeal],
              error: null,
            }),
          } as any;
        } else if (table === 'accreditation_verification') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null, // Not accredited
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<DealsPage />);

      await waitFor(() => {
        expect(screen.getByText(/HealthTech Startup/i)).toBeInTheDocument();
      });

      const expressButton = screen.getByRole('button', { name: /express interest/i });
      await user.click(expressButton);

      await waitFor(() => {
        expect(screen.getByText(/accreditation required/i)).toBeInTheDocument();
      });
    });

    it('should allow accredited investors to submit interest', async () => {
      const user = userEvent.setup();
      
      const mockDeal = {
        id: 'deal-001',
        title: 'HealthTech Startup',
        deal_status: 'open',
        min_investment: 500000,
        slug: 'healthtech-startup'
      };

      const mockAccreditation = {
        id: 'acc-001',
        status: 'verified',
        expiry_date: '2025-12-31'
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deals') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockDeal],
              error: null,
            }),
          } as any;
        } else if (table === 'accreditation_verification') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockAccreditation,
              error: null,
            }),
          } as any;
        } else if (table === 'deal_interests') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<DealsPage />);

      await waitFor(() => {
        expect(screen.getByText(/HealthTech Startup/i)).toBeInTheDocument();
      });

      const expressButton = screen.getByRole('button', { name: /express interest/i });
      await user.click(expressButton);

      const amountInput = await screen.findByLabelText(/investment amount/i);
      await user.type(amountInput, '1000000');

      const submitButton = screen.getByRole('button', { name: /submit interest/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/interest submitted successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Already Expressed Interest', () => {
    it('should show "Interest Submitted" for already interested deals', async () => {
      const mockDeal = {
        id: 'deal-001',
        title: 'HealthTech Startup',
        deal_status: 'open',
        slug: 'healthtech-startup'
      };

      const mockInterest = {
        id: 'interest-001',
        deal_id: 'deal-001',
        investor_id: investor.id,
        status: 'pending'
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deals') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockDeal],
              error: null,
            }),
          } as any;
        } else if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockInterest],
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<DealsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Interest Submitted/i)).toBeInTheDocument();
      });

      const submittedButton = screen.getByRole('button', { name: /Interest Submitted/i });
      expect(submittedButton).toBeDisabled();
    });
  });

  describe('Validation', () => {
    it('should require investment amount', async () => {
      const user = userEvent.setup();
      
      const mockDeal = {
        id: 'deal-001',
        title: 'HealthTech Startup',
        deal_status: 'open',
        min_investment: 500000,
        slug: 'healthtech-startup'
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deals') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockDeal],
              error: null,
            }),
          } as any;
        } else if (table === 'accreditation_verification') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: { status: 'verified' },
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<DealsPage />);

      await waitFor(() => {
        expect(screen.getByText(/HealthTech Startup/i)).toBeInTheDocument();
      });

      const expressButton = screen.getByRole('button', { name: /express interest/i });
      await user.click(expressButton);

      const submitButton = await screen.findByRole('button', { name: /submit interest/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/investment amount is required/i)).toBeInTheDocument();
      });
    });

    it('should enforce minimum investment amount', async () => {
      const user = userEvent.setup();
      
      const mockDeal = {
        id: 'deal-001',
        title: 'HealthTech Startup',
        deal_status: 'open',
        min_investment: 500000,
        slug: 'healthtech-startup'
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deals') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockDeal],
              error: null,
            }),
          } as any;
        } else if (table === 'accreditation_verification') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: { status: 'verified' },
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<DealsPage />);

      await waitFor(() => {
        expect(screen.getByText(/HealthTech Startup/i)).toBeInTheDocument();
      });

      const expressButton = screen.getByRole('button', { name: /express interest/i });
      await user.click(expressButton);

      const amountInput = await screen.findByLabelText(/investment amount/i);
      await user.type(amountInput, '100000'); // Below minimum

      const submitButton = screen.getByRole('button', { name: /submit interest/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/below minimum/i)).toBeInTheDocument();
      });
    });
  });
});
