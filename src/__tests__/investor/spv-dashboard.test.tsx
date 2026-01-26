/**
 * US-INVESTOR-010: Track SPV Allocations
 * 
 * As a: Lead Investor
 * I want to: Track all SPV allocations and commitments
 * So that: I can monitor fundraising progress and manage the SPV
 * 
 * Acceptance Criteria:
 * - GIVEN I am lead investor of an SPV
 *   WHEN I view SPV dashboard
 *   THEN I see all members and their commitments
 * 
 * - GIVEN SPV has target amount
 *   WHEN viewing progress
 *   THEN I see percentage of target raised
 * 
 * - GIVEN member commitments change
 *   WHEN viewing dashboard
 *   THEN I see updated totals in real-time
 * 
 * - GIVEN SPV is ready to close
 *   WHEN all commitments confirmed
 *   THEN I see option to finalize SPV
 * 
 * Priority: High
 * Status: Implementing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { testUsers, createMockSession } from '../fixtures/testData';

import SPVDashboard from '@/pages/investor/SPVDashboard';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-INVESTOR-010: Track SPV Allocations', () => {
  const leadInvestor = testUsers.standard_investor;
  const mockSession = createMockSession(leadInvestor);

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
  });

  describe('SPV Dashboard', () => {
    it('should display SPV dashboard with allocations', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV 2026',
        lead_investor_id: leadInvestor.id,
        target_amount: 50000000,
        carry_percentage: 20,
        status: 'forming'
      };

      const mockMembers = [
        {
          id: 'member-001',
          commitment_amount: 5000000,
          status: 'confirmed',
          investor: { full_name: 'John Investor', email: 'john@example.com' }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockSPV,
              error: null,
            }),
            single: vi.fn().mockResolvedValue({
              data: mockSPV,
              error: null,
            }),
          } as any;
        } else if (table === 'spv_members') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockMembers,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<SPVDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Test SPV 2026/i)).toBeInTheDocument();
        expect(screen.getByText(/John Investor/i)).toBeInTheDocument();
      });
    });

    it('should show progress percentage', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        lead_investor_id: leadInvestor.id,
        target_amount: 50000000,
        carry_percentage: 20
      };

      const mockMembers = [
        {
          id: 'member-001',
          commitment_amount: 25000000,
          status: 'confirmed',
          investor: { full_name: 'Investor 1', email: 'inv1@example.com' }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockSPV,
              error: null,
            }),
          } as any;
        } else if (table === 'spv_members') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockMembers,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<SPVDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/50%/i)).toBeInTheDocument();
      });
    });

    it('should display total committed amount', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        lead_investor_id: leadInvestor.id,
        target_amount: 50000000
      };

      const mockMembers = [
        {
          id: 'member-001',
          commitment_amount: 10000000,
          status: 'confirmed',
          investor: { full_name: 'Investor 1', email: 'inv1@example.com' }
        },
        {
          id: 'member-002',
          commitment_amount: 5000000,
          status: 'confirmed',
          investor: { full_name: 'Investor 2', email: 'inv2@example.com' }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockSPV,
              error: null,
            }),
          } as any;
        } else if (table === 'spv_members') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockMembers,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<SPVDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/1\.50 Cr/i)).toBeInTheDocument();
      });
    });

    it('should show member count', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        lead_investor_id: leadInvestor.id,
        target_amount: 50000000
      };

      const mockMembers = [
        { id: 'member-001', commitment_amount: 5000000, status: 'confirmed', investor: { full_name: 'Inv 1', email: 'inv1@example.com' } },
        { id: 'member-002', commitment_amount: 5000000, status: 'confirmed', investor: { full_name: 'Inv 2', email: 'inv2@example.com' } },
        { id: 'member-003', commitment_amount: 5000000, status: 'confirmed', investor: { full_name: 'Inv 3', email: 'inv3@example.com' } }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockSPV,
              error: null,
            }),
          } as any;
        } else if (table === 'spv_members') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockMembers,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<SPVDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/3/)).toBeInTheDocument();
      });
    });
  });

  describe('Member Status', () => {
    it('should show confirmed members separately', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        lead_investor_id: leadInvestor.id,
        target_amount: 50000000
      };

      const mockMembers = [
        {
          id: 'member-001',
          commitment_amount: 5000000,
          status: 'confirmed',
          investor: { full_name: 'Confirmed Investor', email: 'confirmed@example.com' }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockSPV,
              error: null,
            }),
          } as any;
        } else if (table === 'spv_members') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockMembers,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<SPVDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
      });
    });
  });

  describe('SPV Actions', () => {
    it('should show invite button for lead investor', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        lead_investor_id: leadInvestor.id,
        target_amount: 50000000
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockSPV,
              error: null,
            }),
          } as any;
        } else if (table === 'spv_members') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<SPVDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/invite co-investors/i)).toBeInTheDocument();
      });
    });
  });
});
