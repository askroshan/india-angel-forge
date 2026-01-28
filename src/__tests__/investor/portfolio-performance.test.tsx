import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import PortfolioPerformance from '@/pages/investor/PortfolioPerformance';

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
}));

// Mock performance data
const mockPerformanceData = {
  overview: {
    total_deployed_capital: 26000000,
    total_current_value: 44000000,
    unrealized_gains: 15000000,
    realized_returns: 3000000,
    portfolio_irr: 42.5,
    total_companies: 4,
    active_companies: 3,
    exited_companies: 1,
  },
  by_sector: [
    { sector: 'Technology', deployed: 15000000, current_value: 21500000, return_percentage: 43.3 },
    { sector: 'Healthcare', deployed: 8000000, current_value: 15000000, return_percentage: 87.5 },
    { sector: 'Finance', deployed: 3000000, current_value: 7500000, return_percentage: 150.0 },
  ],
  by_stage: [
    { stage: 'SEED', deployed: 8000000, current_value: 9000000, return_percentage: 12.5 },
    { stage: 'SERIES_A', deployed: 10000000, current_value: 15000000, return_percentage: 50.0 },
    { stage: 'SERIES_B', deployed: 8000000, current_value: 20000000, return_percentage: 150.0 },
  ],
  performance_over_time: [
    { month: '2024-08', portfolio_value: 26000000 },
    { month: '2024-09', portfolio_value: 27500000 },
    { month: '2024-10', portfolio_value: 29000000 },
    { month: '2024-11', portfolio_value: 28500000 },
    { month: '2024-12', portfolio_value: 32000000 },
    { month: '2025-01', portfolio_value: 35000000 },
    { month: '2025-02', portfolio_value: 38000000 },
    { month: '2025-03', portfolio_value: 40000000 },
    { month: '2025-04', portfolio_value: 41000000 },
    { month: '2025-05', portfolio_value: 42500000 },
    { month: '2025-06', portfolio_value: 44000000 },
  ],
};

describe('US-INVESTOR-012: Track Portfolio Performance', () => {
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
    it('should display portfolio performance page', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPerformanceData);

      renderWithProviders(<PortfolioPerformance />);

      await waitFor(() => {
        expect(screen.getByText(/Portfolio Performance/i)).toBeInTheDocument();
      });
    });

    it('should display empty state when no performance data', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        overview: {
          total_deployed_capital: 0,
          total_current_value: 0,
          unrealized_gains: 0,
          realized_returns: 0,
          portfolio_irr: 0,
          total_companies: 0,
          active_companies: 0,
          exited_companies: 0,
        },
        by_sector: [],
        by_stage: [],
        performance_over_time: [],
      });

      renderWithProviders(<PortfolioPerformance />);

      await waitFor(() => {
        expect(screen.getByText(/No performance data available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Overview Metrics', () => {
    it('should display total deployed capital', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPerformanceData);

      renderWithProviders(<PortfolioPerformance />);

      await waitFor(() => {
        expect(screen.getByText(/Total Deployed Capital/i)).toBeInTheDocument();
        expect(screen.getByText(/₹2.6 Cr/i)).toBeInTheDocument();
      });
    });

    it('should display total current value', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPerformanceData);

      renderWithProviders(<PortfolioPerformance />);

      await waitFor(() => {
        expect(screen.getByText(/Total Current Value/i)).toBeInTheDocument();
        expect(screen.getByText(/₹4.4 Cr/i)).toBeInTheDocument();
      });
    });

    it('should display unrealized gains', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPerformanceData);

      renderWithProviders(<PortfolioPerformance />);

      await waitFor(() => {
        const labels = screen.getAllByText(/Unrealized Gains/i);
        expect(labels.length).toBeGreaterThan(0);
        const values = screen.getAllByText(/₹1.5 Cr/i);
        expect(values.length).toBeGreaterThan(0);
      });
    });

    it('should display realized returns', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPerformanceData);

      renderWithProviders(<PortfolioPerformance />);

      await waitFor(() => {
        const labels = screen.getAllByText(/Realized Returns/i);
        expect(labels.length).toBeGreaterThan(0);
        const values = screen.getAllByText(/₹30.0 Lac/i);
        expect(values.length).toBeGreaterThan(0);
      });
    });

    it('should display portfolio IRR', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPerformanceData);

      renderWithProviders(<PortfolioPerformance />);

      await waitFor(() => {
        const irrLabels = screen.getAllByText(/Portfolio IRR/i);
        expect(irrLabels.length).toBeGreaterThan(0);
        const irrValues = screen.getAllByText(/42.5%/i);
        expect(irrValues.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance by Sector', () => {
    it('should display performance breakdown by sector', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPerformanceData);

      renderWithProviders(<PortfolioPerformance />);

      await waitFor(() => {
        expect(screen.getByText(/Performance by Sector/i)).toBeInTheDocument();
        expect(screen.getByText('Technology')).toBeInTheDocument();
        expect(screen.getByText('Healthcare')).toBeInTheDocument();
        expect(screen.getByText('Finance')).toBeInTheDocument();
      });
    });

    it('should display sector-wise deployed capital', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPerformanceData);

      renderWithProviders(<PortfolioPerformance />);

      await waitFor(() => {
        const capital1 = screen.getAllByText(/₹1.5 Cr/i);
        expect(capital1.length).toBeGreaterThan(0);
        const capital2 = screen.getAllByText(/₹80.0 Lac/i);
        expect(capital2.length).toBeGreaterThan(0);
      });
    });

    it('should display sector-wise return percentages', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPerformanceData);

      renderWithProviders(<PortfolioPerformance />);

      await waitFor(() => {
        expect(screen.getByText(/43.3%/i)).toBeInTheDocument();
        expect(screen.getByText(/87.5%/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance by Stage', () => {
    it('should display performance breakdown by funding stage', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPerformanceData);

      renderWithProviders(<PortfolioPerformance />);

      await waitFor(() => {
        expect(screen.getByText(/Performance by Stage/i)).toBeInTheDocument();
        expect(screen.getByText(/Seed/i)).toBeInTheDocument();
        expect(screen.getByText(/Series A/i)).toBeInTheDocument();
        expect(screen.getByText(/Series B/i)).toBeInTheDocument();
      });
    });

    it('should display stage-wise return percentages', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockPerformanceData);

      renderWithProviders(<PortfolioPerformance />);

      await waitFor(() => {
        const percent1 = screen.getAllByText(/12.5%/i);
        expect(percent1.length).toBeGreaterThan(0);
        const percent2 = screen.getAllByText(/50.0%/i);
        expect(percent2.length).toBeGreaterThan(0);
        const percent3 = screen.getAllByText(/150.0%/i);
        expect(percent3.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading performance fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to load performance'));

      renderWithProviders(<PortfolioPerformance />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading performance data/i)).toBeInTheDocument();
      });
    });
  });
});
