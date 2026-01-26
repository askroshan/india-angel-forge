import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PortfolioPerformance from '@/pages/investor/PortfolioPerformance';
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

describe('PortfolioPerformance', () => {
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

  describe('Portfolio Performance Dashboard', () => {
    it('should display portfolio performance dashboard', async () => {
      // Mock portfolio companies query
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioPerformance />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Portfolio Performance/i)).toBeInTheDocument();
      });
    });

    it('should display portfolio companies', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'TechStartup Inc',
          investment_amount: 5000000,
          investment_date: '2023-01-15',
          current_valuation: 7500000,
          ownership_percentage: 5.0,
          status: 'active',
        },
        {
          id: 'company-2',
          company_name: 'FinTech Solutions',
          investment_amount: 3000000,
          investment_date: '2023-06-20',
          current_valuation: 3600000,
          ownership_percentage: 3.5,
          status: 'active',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockCompanies,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioPerformance />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('TechStartup Inc')).toBeInTheDocument();
        expect(screen.getByText('FinTech Solutions')).toBeInTheDocument();
      });
    });
  });

  describe('Investment Returns', () => {
    it('should calculate and display ROI', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'TechStartup Inc',
          investment_amount: 5000000,
          investment_date: '2023-01-15',
          current_valuation: 7500000, // 50% ROI
          ownership_percentage: 5.0,
          status: 'active',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockCompanies,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioPerformance />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/50%/)).toBeInTheDocument();
      });
    });

    it('should display unrealized gains', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'TechStartup Inc',
          investment_amount: 5000000,
          investment_date: '2023-01-15',
          current_valuation: 7500000,
          ownership_percentage: 5.0,
          status: 'active',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockCompanies,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioPerformance />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Unrealized gain = 7.5M - 5M = 2.5M
        expect(screen.getByText(/2.5/)).toBeInTheDocument();
      });
    });

    it('should show realized gains separately', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'TechStartup Inc',
          investment_amount: 5000000,
          investment_date: '2023-01-15',
          current_valuation: 7500000,
          ownership_percentage: 5.0,
          status: 'active',
        },
        {
          id: 'company-2',
          company_name: 'Exited Startup',
          investment_amount: 2000000,
          investment_date: '2022-01-15',
          exit_valuation: 3000000,
          ownership_percentage: 4.0,
          status: 'exited',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockCompanies,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioPerformance />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Realized/i)).toBeInTheDocument();
        expect(screen.getByText(/Unrealized/i)).toBeInTheDocument();
      });
    });
  });

  describe('Portfolio Statistics', () => {
    it('should display total invested amount', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'TechStartup Inc',
          investment_amount: 5000000,
          investment_date: '2023-01-15',
          current_valuation: 7500000,
          ownership_percentage: 5.0,
          status: 'active',
        },
        {
          id: 'company-2',
          company_name: 'FinTech Solutions',
          investment_amount: 3000000,
          investment_date: '2023-06-20',
          current_valuation: 3600000,
          ownership_percentage: 3.5,
          status: 'active',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockCompanies,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioPerformance />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Total invested = 5M + 3M = 8M
        expect(screen.getByText(/8.0/)).toBeInTheDocument();
      });
    });

    it('should display current portfolio value', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'TechStartup Inc',
          investment_amount: 5000000,
          investment_date: '2023-01-15',
          current_valuation: 7500000,
          ownership_percentage: 5.0,
          status: 'active',
        },
        {
          id: 'company-2',
          company_name: 'FinTech Solutions',
          investment_amount: 3000000,
          investment_date: '2023-06-20',
          current_valuation: 3600000,
          ownership_percentage: 3.5,
          status: 'active',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockCompanies,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioPerformance />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Current value = 7.5M + 3.6M = 11.1M
        expect(screen.getByText(/11.1/)).toBeInTheDocument();
      });
    });

    it('should display number of investments', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'TechStartup Inc',
          investment_amount: 5000000,
          investment_date: '2023-01-15',
          current_valuation: 7500000,
          ownership_percentage: 5.0,
          status: 'active',
        },
        {
          id: 'company-2',
          company_name: 'FinTech Solutions',
          investment_amount: 3000000,
          investment_date: '2023-06-20',
          current_valuation: 3600000,
          ownership_percentage: 3.5,
          status: 'active',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockCompanies,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioPerformance />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/2/)).toBeInTheDocument();
      });
    });
  });

  describe('Company Status', () => {
    it('should display different status badges', async () => {
      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'Active Company',
          investment_amount: 5000000,
          investment_date: '2023-01-15',
          current_valuation: 7500000,
          ownership_percentage: 5.0,
          status: 'active',
        },
        {
          id: 'company-2',
          company_name: 'Exited Company',
          investment_amount: 2000000,
          investment_date: '2022-01-15',
          exit_valuation: 3000000,
          ownership_percentage: 4.0,
          status: 'exited',
        },
        {
          id: 'company-3',
          company_name: 'Closed Company',
          investment_amount: 1000000,
          investment_date: '2021-01-15',
          current_valuation: 0,
          ownership_percentage: 2.0,
          status: 'closed',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockCompanies,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioPerformance />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Active Company')).toBeInTheDocument();
        expect(screen.getByText('Exited Company')).toBeInTheDocument();
        expect(screen.getByText('Closed Company')).toBeInTheDocument();
      });
    });
  });
});
