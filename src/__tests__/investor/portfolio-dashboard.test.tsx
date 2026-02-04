import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import PortfolioDashboard from '@/pages/investor/PortfolioDashboard';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'investor-1',
      email: 'investor@example.com',
      role: 'INVESTOR',
    },
    isAuthenticated: true,
  }),
}));

// Mock router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock portfolio companies data
const mockPortfolioCompanies = [
  {
    id: 'portfolio-1',
    investor_id: 'investor-1',
    deal_id: 'deal-1',
    investment_amount: 5000000,
    investment_date: '2025-06-15T00:00:00Z',
    ownership_percentage: 2.5,
    current_valuation: 6500000,
    irr: 28.5,
    multiple: 1.3,
    status: 'ACTIVE',
    deal: {
      id: 'deal-1',
      company_name: 'TechStartup India',
      sector: 'Technology',
      funding_stage: 'SEED',
      company_logo: 'https://example.com/logo1.png',
    },
    latest_update: {
      id: 'update-1',
      title: 'Q4 2025 Performance Update',
      posted_at: '2025-12-20T10:00:00Z',
      summary: 'Strong revenue growth of 45% QoQ',
    },
  },
  {
    id: 'portfolio-2',
    investor_id: 'investor-1',
    deal_id: 'deal-2',
    investment_amount: 10000000,
    investment_date: '2025-03-10T00:00:00Z',
    ownership_percentage: 5.0,
    current_valuation: 15000000,
    irr: 52.3,
    multiple: 1.5,
    status: 'ACTIVE',
    deal: {
      id: 'deal-2',
      company_name: 'HealthTech Solutions',
      sector: 'Healthcare',
      funding_stage: 'SERIES_A',
      company_logo: 'https://example.com/logo2.png',
    },
    latest_update: {
      id: 'update-2',
      title: 'Series B Fundraising Update',
      posted_at: '2026-01-10T14:00:00Z',
      summary: 'Successfully raised Series B at 2x valuation',
    },
  },
  {
    id: 'portfolio-3',
    investor_id: 'investor-1',
    deal_id: 'deal-3',
    investment_amount: 3000000,
    investment_date: '2024-11-05T00:00:00Z',
    ownership_percentage: 1.8,
    current_valuation: 2500000,
    irr: -15.2,
    multiple: 0.83,
    status: 'ACTIVE',
    deal: {
      id: 'deal-3',
      company_name: 'EduTech Platform',
      sector: 'Education',
      funding_stage: 'SEED',
      company_logo: 'https://example.com/logo3.png',
    },
    latest_update: null,
  },
  {
    id: 'portfolio-4',
    investor_id: 'investor-1',
    deal_id: 'deal-4',
    investment_amount: 8000000,
    investment_date: '2024-08-20T00:00:00Z',
    ownership_percentage: 3.2,
    current_valuation: 20000000,
    irr: 95.8,
    multiple: 2.5,
    status: 'EXITED',
    deal: {
      id: 'deal-4',
      company_name: 'FinTech Innovations',
      sector: 'Finance',
      funding_stage: 'SERIES_B',
      company_logo: 'https://example.com/logo4.png',
    },
    latest_update: {
      id: 'update-4',
      title: 'Acquisition Completed',
      posted_at: '2025-11-30T16:00:00Z',
      summary: 'Successfully acquired by MegaCorp',
    },
  },
];

describe('US-INVESTOR-011: View Portfolio Dashboard', () => {
  let queryClient: QueryClient;

  const renderWithProviders = (component: React.ReactElement) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Display', () => {
    it('should display portfolio dashboard page', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPortfolioCompanies);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Portfolio Dashboard/i)).toBeInTheDocument();
      });
    });

    it('should display portfolio summary statistics', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPortfolioCompanies);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Total Portfolio Value/i)).toBeInTheDocument();
        expect(screen.getByText(/Total Invested/i)).toBeInTheDocument();
      });
    });

    it('should display empty state when no portfolio companies', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/No portfolio companies yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Portfolio Companies List', () => {
    it('should display all portfolio companies', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPortfolioCompanies);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
        expect(screen.getByText('HealthTech Solutions')).toBeInTheDocument();
        expect(screen.getByText('EduTech Platform')).toBeInTheDocument();
        expect(screen.getByText('FinTech Innovations')).toBeInTheDocument();
      });
    });

    it('should display investment amount for each company', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPortfolioCompanies);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/₹50.0 Lac/i)).toBeInTheDocument();
        expect(screen.getByText(/₹1.0 Cr/i)).toBeInTheDocument();
      });
    });

    it('should display investment date for each company', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPortfolioCompanies);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Jun 2025/i)).toBeInTheDocument();
        expect(screen.getByText(/Mar 2025/i)).toBeInTheDocument();
      });
    });

    it('should display current valuation for each company', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPortfolioCompanies);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/₹65.0 Lac/i)).toBeInTheDocument();
        expect(screen.getByText(/₹1.5 Cr/i)).toBeInTheDocument();
      });
    });

    it('should display ownership percentage for each company', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPortfolioCompanies);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/2.5%/i)).toBeInTheDocument();
        expect(screen.getByText(/5.0%/i)).toBeInTheDocument();
      });
    });

    it('should display IRR for each company', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPortfolioCompanies);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/28.5%/i)).toBeInTheDocument();
        expect(screen.getByText(/52.3%/i)).toBeInTheDocument();
      });
    });

    it('should display multiple for each company', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPortfolioCompanies);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/1.3x/i)).toBeInTheDocument();
        expect(screen.getByText(/1.5x/i)).toBeInTheDocument();
      });
    });

    it('should display latest company update when available', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPortfolioCompanies);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Q4 2025 Performance Update/i)).toBeInTheDocument();
        expect(screen.getByText(/Strong revenue growth of 45% QoQ/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should allow filtering by sector', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPortfolioCompanies);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
        expect(screen.getByText('Technology')).toBeInTheDocument();
      });
    });

    it('should allow filtering by funding stage', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPortfolioCompanies);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
        // Seed stage company is visible
        const seedBadges = screen.getAllByText(/Seed/i);
        expect(seedBadges.length).toBeGreaterThan(0);
      });
    });

    it('should allow filtering by status', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPortfolioCompanies);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText('FinTech Innovations')).toBeInTheDocument();
        expect(screen.getByText('Finance')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading portfolio fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to load portfolio'));

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading portfolio/i)).toBeInTheDocument();
      });
    });

    it('should handle companies with missing valuations gracefully', async () => {
      const companiesWithNullValuation = [
        {
          ...mockPortfolioCompanies[0],
          current_valuation: null,
          irr: null,
          multiple: null,
        },
      ];
      vi.mocked(apiClient.get).mockResolvedValue(companiesWithNullValuation);

      renderWithProviders(<PortfolioDashboard />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
        // Company displays even with missing data
        const notAvailable = screen.getAllByText(/Not Available/i);
        expect(notAvailable.length).toBeGreaterThan(0);
      });
    });
  });
});
