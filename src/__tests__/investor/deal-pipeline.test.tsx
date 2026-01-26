/**
 * US-INVESTOR-005: Track Deal Pipeline
 * 
 * As an: Investor
 * I want to: Track my deal pipeline and interest status
 * So that: I can monitor my investments and next steps
 * 
 * Acceptance Criteria:
 * - GIVEN I have expressed interest in deals
 *   WHEN I navigate to pipeline page
 *   THEN I see all deals I'm interested in
 * 
 * - GIVEN deal interest has status
 *   WHEN viewing pipeline
 *   THEN I see status badges (pending, accepted, rejected)
 * 
 * - GIVEN I'm accepted to SPV
 *   WHEN viewing pipeline
 *   THEN I see SPV details and next steps
 * 
 * - GIVEN deal is closed
 *   WHEN viewing pipeline
 *   THEN deal is marked as closed with outcome
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

import DealPipeline from '@/pages/investor/DealPipeline';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-INVESTOR-005: Track Deal Pipeline', () => {
  const investor = testUsers.standard_investor;
  const mockSession = createMockSession(investor);

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
  });

  describe('Pipeline Display', () => {
    it('should display pipeline page for investor', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

      renderWithRouter(<DealPipeline />);

      await waitFor(() => {
        expect(screen.getByText(/My Deal Pipeline/i)).toBeInTheDocument();
      });
    });

    it('should show all deals with expressed interest', async () => {
      const mockInterests = [
        {
          id: 'interest-001',
          status: 'pending',
          commitment_amount: 1000000,
          created_at: new Date().toISOString(),
          deal: {
            id: 'deal-001',
            title: 'HealthTech Startup',
            company_name: 'HealthTech Inc',
            deal_status: 'open',
            deal_size: 50000000,
            closing_date: '2026-02-28'
          }
        },
        {
          id: 'interest-002',
          status: 'accepted',
          commitment_amount: 2000000,
          created_at: new Date().toISOString(),
          deal: {
            id: 'deal-002',
            title: 'AI Platform',
            company_name: 'AI Corp',
            deal_status: 'closing_soon',
            deal_size: 100000000,
            closing_date: '2026-01-31'
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockInterests,
          error: null,
        }),
      } as any);

      renderWithRouter(<DealPipeline />);

      await waitFor(() => {
        expect(screen.getByText(/HealthTech Startup/i)).toBeInTheDocument();
        expect(screen.getByText(/AI Platform/i)).toBeInTheDocument();
      });
    });
  });

  describe('Status Badges', () => {
    it('should show pending status badge', async () => {
      const mockInterests = [
        {
          id: 'interest-001',
          status: 'pending',
          commitment_amount: 1000000,
          deal: {
            title: 'Test Deal',
            company_name: 'Test Co',
            deal_status: 'open'
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockInterests,
          error: null,
        }),
      } as any);

      renderWithRouter(<DealPipeline />);

      await waitFor(() => {
        expect(screen.getByText(/pending/i)).toBeInTheDocument();
      });
    });

    it('should show accepted status badge', async () => {
      const mockInterests = [
        {
          id: 'interest-001',
          status: 'accepted',
          commitment_amount: 1000000,
          deal: {
            title: 'Test Deal',
            company_name: 'Test Co',
            deal_status: 'open'
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockInterests,
          error: null,
        }),
      } as any);

      renderWithRouter(<DealPipeline />);

      await waitFor(() => {
        expect(screen.getByText(/accepted/i)).toBeInTheDocument();
      });
    });

    it('should show rejected status badge', async () => {
      const mockInterests = [
        {
          id: 'interest-001',
          status: 'rejected',
          commitment_amount: 1000000,
          rejection_reason: 'SPV is full',
          deal: {
            title: 'Test Deal',
            company_name: 'Test Co',
            deal_status: 'closed'
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockInterests,
          error: null,
        }),
      } as any);

      renderWithRouter(<DealPipeline />);

      await waitFor(() => {
        expect(screen.getByText(/rejected/i)).toBeInTheDocument();
        expect(screen.getByText(/SPV is full/i)).toBeInTheDocument();
      });
    });
  });

  describe('SPV Details', () => {
    it('should show SPV details when accepted', async () => {
      const mockInterests = [
        {
          id: 'interest-001',
          status: 'accepted',
          commitment_amount: 1000000,
          spv_id: 'spv-001',
          deal: {
            title: 'Test Deal',
            company_name: 'Test Co',
            deal_status: 'open'
          }
        }
      ];

      const mockSPV = {
        id: 'spv-001',
        name: 'HealthTech SPV 2026',
        target_amount: 50000000,
        committed_amount: 25000000
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockInterests,
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

      renderWithRouter(<DealPipeline />);

      await waitFor(() => {
        expect(screen.getByText(/HealthTech SPV 2026/i)).toBeInTheDocument();
      });
    });

    it('should show next steps when accepted', async () => {
      const mockInterests = [
        {
          id: 'interest-001',
          status: 'accepted',
          commitment_amount: 1000000,
          spv_id: 'spv-001',
          deal: {
            title: 'Test Deal',
            company_name: 'Test Co',
            deal_status: 'open',
            closing_date: '2026-02-28'
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockInterests,
          error: null,
        }),
      } as any);

      renderWithRouter(<DealPipeline />);

      await waitFor(() => {
        expect(screen.getByText(/next steps/i)).toBeInTheDocument();
      });
    });
  });

  describe('Deal Status', () => {
    it('should show closed deals with outcome', async () => {
      const mockInterests = [
        {
          id: 'interest-001',
          status: 'accepted',
          commitment_amount: 1000000,
          deal: {
            title: 'Closed Deal',
            company_name: 'Closed Co',
            deal_status: 'closed',
            closing_date: '2026-01-15'
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockInterests,
          error: null,
        }),
      } as any);

      renderWithRouter(<DealPipeline />);

      await waitFor(() => {
        expect(screen.getByText(/Closed Deal/i)).toBeInTheDocument();
        expect(screen.getByText(/closed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Statistics', () => {
    it('should display pipeline statistics', async () => {
      const mockInterests = [
        {
          id: 'interest-001',
          status: 'pending',
          commitment_amount: 1000000,
          deal: { title: 'Deal 1', company_name: 'Co 1', deal_status: 'open' }
        },
        {
          id: 'interest-002',
          status: 'accepted',
          commitment_amount: 2000000,
          deal: { title: 'Deal 2', company_name: 'Co 2', deal_status: 'open' }
        },
        {
          id: 'interest-003',
          status: 'accepted',
          commitment_amount: 1500000,
          deal: { title: 'Deal 3', company_name: 'Co 3', deal_status: 'open' }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockInterests,
          error: null,
        }),
      } as any);

      renderWithRouter(<DealPipeline />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Total interests
        expect(screen.getByText('2')).toBeInTheDocument(); // Accepted
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by interest status', async () => {
      const user = userEvent.setup();
      
      const mockInterests = [
        {
          id: 'interest-001',
          status: 'pending',
          commitment_amount: 1000000,
          deal: { title: 'Pending Deal', company_name: 'Pending Co', deal_status: 'open' }
        },
        {
          id: 'interest-002',
          status: 'accepted',
          commitment_amount: 2000000,
          deal: { title: 'Accepted Deal', company_name: 'Accepted Co', deal_status: 'open' }
        }
      ];

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockInterests,
          error: null,
        }),
      } as any);

      renderWithRouter(<DealPipeline />);

      await waitFor(() => {
        expect(screen.getByText(/Pending Deal/i)).toBeInTheDocument();
        expect(screen.getByText(/Accepted Deal/i)).toBeInTheDocument();
      });

      const statusFilter = screen.getByRole('combobox', { name: /status/i });
      await user.click(statusFilter);
      
      const acceptedOption = screen.getByRole('option', { name: /accepted/i });
      await user.click(acceptedOption);

      await waitFor(() => {
        expect(screen.queryByText(/Pending Deal/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Accepted Deal/i)).toBeInTheDocument();
      });
    });
  });
});
