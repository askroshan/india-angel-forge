/**
 * US-INVESTOR-008: Create SPV
 * 
 * As a: Lead Investor
 * I want to: Create an SPV for a deal I'm leading
 * So that: I can pool investments with co-investors
 * 
 * Acceptance Criteria:
 * - GIVEN I have an accepted deal interest
 *   WHEN I navigate to create SPV
 *   THEN I see SPV creation form with deal details
 * 
 * - GIVEN I fill in SPV details
 *   WHEN I submit the form
 *   THEN SPV is created and linked to deal
 * 
 * - GIVEN SPV is created
 *   WHEN viewing SPV
 *   THEN I see SPV dashboard with target amount
 * 
 * - GIVEN SPV has carry percentage
 *   WHEN displaying details
 *   THEN carry terms are clearly shown
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

import CreateSPV from '@/pages/investor/CreateSPV';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-INVESTOR-008: Create SPV', () => {
  const investor = testUsers.standard_investor;
  const mockSession = createMockSession(investor);

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
  });

  describe('SPV Creation Form', () => {
    it('should display SPV creation form for accepted deal', async () => {
      const mockDeal = {
        id: 'deal-001',
        title: 'HealthTech Startup',
        company_name: 'HealthTech Inc',
        target_amount: 50000000
      };

      const mockInterest = {
        id: 'interest-001',
        deal_id: 'deal-001',
        status: 'accepted',
        commitment_amount: 5000000,
        deal: mockDeal
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockInterest,
              error: null,
            }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<CreateSPV />);

      await waitFor(() => {
        expect(screen.getByText(/create spv/i)).toBeInTheDocument();
        expect(screen.getByText(/HealthTech Inc/i)).toBeInTheDocument();
      });
    });

    it('should show deal details in form', async () => {
      const mockInterest = {
        id: 'interest-001',
        deal_id: 'deal-001',
        status: 'accepted',
        commitment_amount: 5000000,
        deal: {
          title: 'AI Startup',
          company_name: 'AI Corp',
          target_amount: 30000000
        }
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockInterest,
              error: null,
            }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<CreateSPV />);

      await waitFor(() => {
        expect(screen.getByText(/AI Corp/i)).toBeInTheDocument();
        expect(screen.getByText(/3\.00 Cr/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should require SPV name', async () => {
      const user = userEvent.setup();
      
      const mockInterest = {
        id: 'interest-001',
        deal_id: 'deal-001',
        status: 'accepted',
        commitment_amount: 5000000,
        deal: {
          title: 'Test Deal',
          company_name: 'Test Co',
          target_amount: 50000000
        }
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockInterest,
              error: null,
            }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<CreateSPV />);

      await waitFor(() => {
        expect(screen.getByText(/create spv/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /create spv/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('should validate target amount is positive', async () => {
      const user = userEvent.setup();
      
      const mockInterest = {
        id: 'interest-001',
        deal_id: 'deal-001',
        status: 'accepted',
        commitment_amount: 5000000,
        deal: {
          title: 'Test Deal',
          company_name: 'Test Co',
          target_amount: 50000000
        }
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockInterest,
              error: null,
            }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<CreateSPV />);

      await waitFor(() => {
        expect(screen.getByLabelText(/spv name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/spv name/i);
      await user.type(nameInput, 'Test SPV');

      const targetInput = screen.getByLabelText(/target amount/i);
      await user.clear(targetInput);
      await user.type(targetInput, '-1000');

      const submitButton = screen.getByRole('button', { name: /create spv/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
      });
    });

    it('should validate carry percentage range', async () => {
      const user = userEvent.setup();
      
      const mockInterest = {
        id: 'interest-001',
        deal_id: 'deal-001',
        status: 'accepted',
        commitment_amount: 5000000,
        deal: {
          title: 'Test Deal',
          company_name: 'Test Co',
          target_amount: 50000000
        }
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockInterest,
              error: null,
            }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<CreateSPV />);

      await waitFor(() => {
        expect(screen.getByLabelText(/carry percentage/i)).toBeInTheDocument();
      });

      const carryInput = screen.getByLabelText(/carry percentage/i);
      await user.clear(carryInput);
      await user.type(carryInput, '35');

      const submitButton = screen.getByRole('button', { name: /create spv/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/between 0 and 30/i)).toBeInTheDocument();
      });
    });
  });

  describe('SPV Creation', () => {
    it('should create SPV successfully', async () => {
      const user = userEvent.setup();
      
      const mockInterest = {
        id: 'interest-001',
        deal_id: 'deal-001',
        status: 'accepted',
        commitment_amount: 5000000,
        deal: {
          title: 'Test Deal',
          company_name: 'Test Co',
          target_amount: 50000000
        }
      };

      const mockCreatedSPV = {
        id: 'spv-001',
        name: 'Test SPV 2026',
        deal_id: 'deal-001',
        lead_investor_id: investor.id,
        target_amount: 50000000,
        carry_percentage: 20
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockInterest,
              error: null,
            }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
            insert: vi.fn().mockResolvedValue({
              data: mockCreatedSPV,
              error: null,
            }),
          } as any;
        } else if (table === 'deal_interests') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<CreateSPV />);

      await waitFor(() => {
        expect(screen.getByLabelText(/spv name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/spv name/i);
      await user.type(nameInput, 'Test SPV 2026');

      const targetInput = screen.getByLabelText(/target amount/i);
      await user.clear(targetInput);
      await user.type(targetInput, '50000000');

      const carryInput = screen.getByLabelText(/carry percentage/i);
      await user.clear(carryInput);
      await user.type(carryInput, '20');

      const submitButton = screen.getByRole('button', { name: /create spv/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/spv created successfully/i)).toBeInTheDocument();
      });
    });

    it('should update deal interest with SPV ID', async () => {
      const user = userEvent.setup();
      let updateCalled = false;
      
      const mockInterest = {
        id: 'interest-001',
        deal_id: 'deal-001',
        status: 'accepted',
        commitment_amount: 5000000,
        deal: {
          title: 'Test Deal',
          company_name: 'Test Co',
          target_amount: 50000000
        }
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockInterest,
              error: null,
            }),
            update: vi.fn().mockImplementation(() => {
              updateCalled = true;
              return {
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              };
            }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
            insert: vi.fn().mockResolvedValue({
              data: { id: 'spv-001' },
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<CreateSPV />);

      await waitFor(() => {
        expect(screen.getByLabelText(/spv name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/spv name/i);
      await user.type(nameInput, 'Test SPV');

      const submitButton = screen.getByRole('button', { name: /create spv/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(updateCalled).toBe(true);
      });
    });
  });

  describe('Existing SPV', () => {
    it('should show message if SPV already exists for deal', async () => {
      const mockInterest = {
        id: 'interest-001',
        deal_id: 'deal-001',
        status: 'accepted',
        commitment_amount: 5000000,
        spv_id: 'spv-001',
        deal: {
          title: 'Test Deal',
          company_name: 'Test Co',
          target_amount: 50000000
        }
      };

      const mockExistingSPV = {
        id: 'spv-001',
        name: 'Existing SPV',
        target_amount: 50000000,
        carry_percentage: 20
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockInterest,
              error: null,
            }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockExistingSPV,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<CreateSPV />);

      await waitFor(() => {
        expect(screen.getByText(/spv already exists/i)).toBeInTheDocument();
        expect(screen.getByText(/Existing SPV/i)).toBeInTheDocument();
      });
    });

    it('should show link to existing SPV dashboard', async () => {
      const mockInterest = {
        id: 'interest-001',
        deal_id: 'deal-001',
        status: 'accepted',
        spv_id: 'spv-001',
        deal: {
          title: 'Test Deal',
          company_name: 'Test Co'
        }
      };

      const mockExistingSPV = {
        id: 'spv-001',
        name: 'Existing SPV',
        target_amount: 50000000
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockInterest,
              error: null,
            }),
          } as any;
        } else if (table === 'spvs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockExistingSPV,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<CreateSPV />);

      await waitFor(() => {
        expect(screen.getByText(/view spv dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Access Control', () => {
    it('should deny access if interest not accepted', async () => {
      const mockInterest = {
        id: 'interest-001',
        deal_id: 'deal-001',
        status: 'pending',
        commitment_amount: 5000000,
        deal: {
          title: 'Test Deal',
          company_name: 'Test Co'
        }
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockInterest,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<CreateSPV />);

      await waitFor(() => {
        expect(screen.getByText(/interest must be accepted/i)).toBeInTheDocument();
      });
    });
  });
});
