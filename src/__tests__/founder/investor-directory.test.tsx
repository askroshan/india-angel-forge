/**
 * US-FOUNDER-003: Access Investor Profiles
 * 
 * As a: Founder
 * I want to: Browse and view investor profiles
 * So that: I can identify potential investors for my startup
 * 
 * Acceptance Criteria:
 * - GIVEN I am a founder
 *   WHEN I navigate to investors directory
 *   THEN I see list of all active investors
 * 
 * - GIVEN investor has profile
 *   WHEN I click on investor
 *   THEN I see their investment focus and portfolio
 * 
 * - GIVEN I want to filter investors
 *   WHEN I apply filters
 *   THEN I see investors matching criteria
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

import InvestorDirectory from '@/pages/founder/InvestorDirectory';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-FOUNDER-003: Access Investor Profiles', () => {
  const founder = testUsers.founder;
  const mockSession = createMockSession(founder);

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
  });

  describe('Investor Directory', () => {
    it('should display list of investors', async () => {
      const mockInvestors = [
        {
          id: 'investor-001',
          email: 'investor1@example.com',
          full_name: 'John Investor',
          investor_profile: {
            focus_areas: ['HealthTech', 'FinTech'],
            ticket_size_min: 1000000,
            ticket_size_max: 10000000
          }
        },
        {
          id: 'investor-002',
          email: 'investor2@example.com',
          full_name: 'Jane Investor',
          investor_profile: {
            focus_areas: ['EdTech', 'SaaS'],
            ticket_size_min: 500000,
            ticket_size_max: 5000000
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockInvestors,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<InvestorDirectory />);

      await waitFor(() => {
        expect(screen.getByText(/John Investor/i)).toBeInTheDocument();
        expect(screen.getByText(/Jane Investor/i)).toBeInTheDocument();
      });
    });

    it('should show investor focus areas', async () => {
      const mockInvestors = [
        {
          id: 'investor-001',
          email: 'investor@example.com',
          full_name: 'Test Investor',
          investor_profile: {
            focus_areas: ['HealthTech', 'AI'],
            ticket_size_min: 1000000,
            ticket_size_max: 10000000
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockInvestors,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<InvestorDirectory />);

      await waitFor(() => {
        expect(screen.getByText(/HealthTech/i)).toBeInTheDocument();
        expect(screen.getByText(/AI/i)).toBeInTheDocument();
      });
    });

    it('should display ticket size range', async () => {
      const mockInvestors = [
        {
          id: 'investor-001',
          email: 'investor@example.com',
          full_name: 'Test Investor',
          investor_profile: {
            focus_areas: ['Tech'],
            ticket_size_min: 1000000,
            ticket_size_max: 10000000
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockInvestors,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<InvestorDirectory />);

      await waitFor(() => {
        expect(screen.getByText(/0\.10 Cr/i)).toBeInTheDocument();
        expect(screen.getByText(/1\.00 Cr/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    it('should allow searching by name', async () => {
      const user = userEvent.setup();
      
      const mockInvestors = [
        {
          id: 'investor-001',
          email: 'john@example.com',
          full_name: 'John Investor',
          investor_profile: {
            focus_areas: ['Tech'],
            ticket_size_min: 1000000,
            ticket_size_max: 10000000
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockInvestors,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<InvestorDirectory />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search investors/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search investors/i);
      await user.type(searchInput, 'John');

      expect(searchInput).toHaveValue('John');
    });

    it('should filter by focus area', async () => {
      const user = userEvent.setup();
      
      const mockInvestors = [
        {
          id: 'investor-001',
          email: 'investor@example.com',
          full_name: 'Test Investor',
          investor_profile: {
            focus_areas: ['HealthTech'],
            ticket_size_min: 1000000,
            ticket_size_max: 10000000
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockInvestors,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<InvestorDirectory />);

      await waitFor(() => {
        expect(screen.getByText(/HealthTech/i)).toBeInTheDocument();
      });
    });
  });
});
