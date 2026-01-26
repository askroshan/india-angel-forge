import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PortfolioDashboard from '@/pages/investor/PortfolioDashboard';
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

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('PortfolioDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock authenticated session
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: { id: 'investor-123' },
        },
      },
    });
  });

  describe('Portfolio Dashboard', () => {
    it('should display portfolio dashboard', async () => {
      // Mock portfolio query
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Portfolio Dashboard/i)).toBeInTheDocument();
      });
    });

    it('should display portfolio overview statistics', async () => {
      const mockData = {
        portfolio_companies: [
          {
            id: 'company-1',
            company_name: 'TechStartup Inc',
            investment_amount: 5000000,
            current_valuation: 7500000,
            status: 'active',
          },
        ],
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockData.portfolio_companies[0]],
            error: null,
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Total Invested/i)).toBeInTheDocument();
        expect(screen.getByText(/Portfolio Value/i)).toBeInTheDocument();
      });
    });
  });

  describe('Portfolio Composition', () => {
    it('should display portfolio breakdown by sector', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'TechStartup Inc',
          investment_amount: 5000000,
          current_valuation: 7500000,
          sector: 'Technology',
          status: 'active',
        },
        {
          id: 'company-2',
          company_name: 'FinTech Solutions',
          investment_amount: 3000000,
          current_valuation: 3600000,
          sector: 'FinTech',
          status: 'active',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockCompanies,
            error: null,
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Technology')).toBeInTheDocument();
        expect(screen.getByText('FinTech')).toBeInTheDocument();
      });
    });

    it('should display portfolio breakdown by stage', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'TechStartup Inc',
          investment_amount: 5000000,
          current_valuation: 7500000,
          stage: 'Series A',
          status: 'active',
        },
        {
          id: 'company-2',
          company_name: 'FinTech Solutions',
          investment_amount: 3000000,
          current_valuation: 3600000,
          stage: 'Seed',
          status: 'active',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockCompanies,
            error: null,
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Series A')).toBeInTheDocument();
        expect(screen.getByText('Seed')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Activity', () => {
    it('should display recent investments', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'TechStartup Inc',
          investment_amount: 5000000,
          investment_date: '2024-01-15',
          current_valuation: 7500000,
          status: 'active',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockCompanies,
            error: null,
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('TechStartup Inc')).toBeInTheDocument();
      });
    });

    it('should display link to detailed performance page', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/View Detailed Performance/i) || screen.getByText(/View Performance/i)).toBeInTheDocument();
      });
    });
  });

  describe('Top Performers', () => {
    it('should highlight top performing investments', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'Top Performer',
          investment_amount: 5000000,
          current_valuation: 15000000, // 200% ROI
          investment_date: '2023-01-15',
          status: 'active',
        },
        {
          id: 'company-2',
          company_name: 'Average Performer',
          investment_amount: 3000000,
          current_valuation: 3600000, // 20% ROI
          investment_date: '2023-06-20',
          status: 'active',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockCompanies,
            error: null,
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Top Performer')).toBeInTheDocument();
        expect(screen.getByText('Average Performer')).toBeInTheDocument();
      });
    });
  });
});
