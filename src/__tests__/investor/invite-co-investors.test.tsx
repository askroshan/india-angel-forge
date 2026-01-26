/**
 * US-INVESTOR-009: Invite Co-investors to SPV
 * 
 * As a: Lead Investor
 * I want to: Invite other investors to join my SPV
 * So that: I can pool capital and share the investment opportunity
 * 
 * Acceptance Criteria:
 * - GIVEN I created an SPV
 *   WHEN I view SPV dashboard
 *   THEN I see invite co-investors section
 * 
 * - GIVEN I enter investor emails
 *   WHEN I send invitations
 *   THEN invited investors receive email notifications
 * 
 * - GIVEN investor receives invitation
 *   WHEN they accept
 *   THEN they are added to SPV with allocation
 * 
 * - GIVEN SPV has members
 *   WHEN viewing member list
 *   THEN I see all co-investors with commitment amounts
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

import InviteCoInvestors from '@/pages/investor/InviteCoInvestors';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-INVESTOR-009: Invite Co-investors to SPV', () => {
  const leadInvestor = testUsers.standard_investor;
  const mockSession = createMockSession(leadInvestor);

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
  });

  describe('Invitation Form', () => {
    it('should display invite co-investors form', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV 2026',
        deal_id: 'deal-001',
        lead_investor_id: leadInvestor.id,
        target_amount: 50000000,
        carry_percentage: 20
      };

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
              data: [],
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText(/invite co-investors/i)).toBeInTheDocument();
        expect(screen.getByText(/Test SPV 2026/i)).toBeInTheDocument();
      });
    });

    it('should show SPV details in invitation form', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'HealthTech SPV',
        lead_investor_id: leadInvestor.id,
        target_amount: 30000000,
        carry_percentage: 20
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

      renderWithRouter(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText(/3\.00 Cr/i)).toBeInTheDocument();
        expect(screen.getByText(/20%/i)).toBeInTheDocument();
      });
    });
  });

  describe('Email Input', () => {
    it('should allow entering multiple email addresses', async () => {
      const user = userEvent.setup();
      
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

      renderWithRouter(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByLabelText(/investor email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/investor email/i);
      await user.type(emailInput, 'investor1@example.com');

      expect(emailInput).toHaveValue('investor1@example.com');
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      
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

      renderWithRouter(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByLabelText(/investor email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/investor email/i);
      await user.type(emailInput, 'invalid-email');

      const addButton = screen.getByRole('button', { name: /add investor/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sending Invitations', () => {
    it('should send invitations successfully', async () => {
      const user = userEvent.setup();
      
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
        } else if (table === 'spv_invitations') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByLabelText(/investor email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/investor email/i);
      await user.type(emailInput, 'investor@example.com');

      const addButton = screen.getByRole('button', { name: /add investor/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/investor@example.com/i)).toBeInTheDocument();
      });

      const sendButton = screen.getByRole('button', { name: /send invitations/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/invitations sent/i)).toBeInTheDocument();
      });
    });

    it('should show allocation amount input for each investor', async () => {
      const user = userEvent.setup();
      
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

      renderWithRouter(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByLabelText(/investor email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/investor email/i);
      await user.type(emailInput, 'investor@example.com');

      const addButton = screen.getByRole('button', { name: /add investor/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/allocation amount/i)).toBeInTheDocument();
      });
    });
  });

  describe('Member List', () => {
    it('should display existing SPV members', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        lead_investor_id: leadInvestor.id,
        target_amount: 50000000
      };

      const mockMembers = [
        {
          id: 'member-001',
          spv_id: 'spv-001',
          investor_id: 'investor-002',
          commitment_amount: 5000000,
          status: 'confirmed',
          investor: {
            email: 'investor1@example.com',
            full_name: 'John Investor'
          }
        },
        {
          id: 'member-002',
          spv_id: 'spv-001',
          investor_id: 'investor-003',
          commitment_amount: 3000000,
          status: 'pending',
          investor: {
            email: 'investor2@example.com',
            full_name: 'Jane Investor'
          }
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

      renderWithRouter(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText(/John Investor/i)).toBeInTheDocument();
        expect(screen.getByText(/Jane Investor/i)).toBeInTheDocument();
      });
    });

    it('should show member status badges', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        lead_investor_id: leadInvestor.id,
        target_amount: 50000000
      };

      const mockMembers = [
        {
          id: 'member-001',
          spv_id: 'spv-001',
          investor_id: 'investor-002',
          commitment_amount: 5000000,
          status: 'confirmed',
          investor: {
            email: 'investor1@example.com',
            full_name: 'John Investor'
          }
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

      renderWithRouter(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Access Control', () => {
    it('should only allow lead investor to invite', async () => {
      const otherInvestor = { ...testUsers.standard_investor, id: 'other-investor' };
      const otherSession = createMockSession(otherInvestor);
      
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: otherSession },
        error: null,
      } as any);

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
        }
        return {} as any;
      });

      renderWithRouter(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText(/only lead investor/i)).toBeInTheDocument();
      });
    });
  });
});
