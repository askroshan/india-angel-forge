import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DealAnalytics from '@/pages/investor/DealAnalytics';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('DealAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth session
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: { id: 'investor-1' },
        },
      },
    });
  });

  describe('Analytics Dashboard', () => {
    it('should display deal analytics page', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <DealAnalytics />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Deal Analytics')).toBeInTheDocument();
      });
    });

    it('should display analytics summary cards', async () => {
      const mockDeals = [
        {
          id: 'deal-1',
          company_name: 'TechStartup Inc',
          valuation: 50000000,
          amount: 5000000,
          status: 'active',
          industry: 'Technology',
          stage: 'Series A',
        },
        {
          id: 'deal-2',
          company_name: 'FinTech Co',
          valuation: 30000000,
          amount: 3000000,
          status: 'active',
          industry: 'FinTech',
          stage: 'Seed',
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockDeals,
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <DealAnalytics />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should show total deals count
        expect(screen.getByText('2')).toBeInTheDocument();
        // Should show total investment
        expect(screen.getByText(/₹8Cr/i)).toBeInTheDocument();
      });
    });
  });

  describe('Industry Distribution', () => {
    it('should display deals by industry', async () => {
      const mockDeals = [
        {
          id: 'deal-1',
          company_name: 'TechCo',
          industry: 'Technology',
          valuation: 50000000,
          amount: 5000000,
        },
        {
          id: 'deal-2',
          company_name: 'FinTechCo',
          industry: 'FinTech',
          valuation: 30000000,
          amount: 3000000,
        },
        {
          id: 'deal-3',
          company_name: 'TechCo2',
          industry: 'Technology',
          valuation: 40000000,
          amount: 4000000,
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockDeals,
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <DealAnalytics />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Technology')).toBeInTheDocument();
        expect(screen.getByText('FinTech')).toBeInTheDocument();
        // Technology should have 2 deals
        expect(screen.getByText(/2 deals/i)).toBeInTheDocument();
      });
    });

    it('should display deal count by industry', async () => {
      const mockDeals = [
        { id: '1', industry: 'Technology', amount: 5000000 },
        { id: '2', industry: 'Technology', amount: 4000000 },
        { id: '3', industry: 'FinTech', amount: 3000000 },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockDeals,
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <DealAnalytics />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Count occurrences
        const technologyElements = screen.getAllByText(/Technology/);
        expect(technologyElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Stage Distribution', () => {
    it('should display deals by funding stage', async () => {
      const mockDeals = [
        {
          id: 'deal-1',
          stage: 'Seed',
          amount: 3000000,
        },
        {
          id: 'deal-2',
          stage: 'Series A',
          amount: 5000000,
        },
        {
          id: 'deal-3',
          stage: 'Seed',
          amount: 2000000,
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockDeals,
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <DealAnalytics />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Seed')).toBeInTheDocument();
        expect(screen.getByText('Series A')).toBeInTheDocument();
      });
    });

    it('should display investment amount by stage', async () => {
      const mockDeals = [
        {
          id: 'deal-1',
          stage: 'Seed',
          amount: 3000000,
        },
        {
          id: 'deal-2',
          stage: 'Series A',
          amount: 5000000,
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockDeals,
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <DealAnalytics />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Check for formatted amounts
        expect(screen.getByText(/₹3Cr/i)).toBeInTheDocument();
        expect(screen.getByText(/₹5Cr/i)).toBeInTheDocument();
      });
    });
  });

  describe('Average Metrics', () => {
    it('should display average deal size', async () => {
      const mockDeals = [
        { id: '1', amount: 4000000 },
        { id: '2', amount: 6000000 },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockDeals,
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <DealAnalytics />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Average of 4Cr and 6Cr = 5Cr
        expect(screen.getByText(/₹5Cr/i)).toBeInTheDocument();
      });
    });

    it('should display average valuation', async () => {
      const mockDeals = [
        { id: '1', valuation: 40000000, amount: 4000000 },
        { id: '2', valuation: 60000000, amount: 6000000 },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockDeals,
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <DealAnalytics />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Average of 40Cr and 60Cr = 50Cr
        expect(screen.getByText(/₹50Cr/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no deals exist', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <DealAnalytics />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/no deal data available/i)).toBeInTheDocument();
      });
    });
  });
});
