import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InvestorProfiles from '@/pages/founder/InvestorProfiles';
import { apiClient } from '@/api/client';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'founder-1',
      email: 'founder@test.com',
      role: 'founder',
      status: 'approved'
    },
    isAuthenticated: true
  })
}));

const mockInvestors = [
  {
    id: 'investor-1',
    email: 'investor1@test.com',
    full_name: 'Rajesh Kumar',
    profile: {
      investment_focus: ['Artificial Intelligence', 'SaaS'],
      stages: ['seed', 'series-a'],
      check_size_min: 1000000,
      check_size_max: 5000000,
      notable_investments: 'Zomato, Razorpay, Byju\'s',
      operator_background: 'Former VP Engineering at Flipkart',
      bio: 'Angel investor focused on B2B SaaS and AI startups'
    }
  },
  {
    id: 'investor-2',
    email: 'investor2@test.com',
    full_name: 'Priya Sharma',
    profile: {
      investment_focus: ['Healthcare', 'Edtech'],
      stages: ['pre-seed', 'seed'],
      check_size_min: 500000,
      check_size_max: 2000000,
      notable_investments: 'PharmEasy, Unacademy',
      operator_background: null,
      bio: 'Healthcare and education sector specialist'
    }
  },
  {
    id: 'investor-3',
    email: 'investor3@test.com',
    full_name: 'Amit Patel',
    profile: {
      investment_focus: ['Fintech', 'E-commerce'],
      stages: ['seed', 'series-a'],
      check_size_min: 2000000,
      check_size_max: 10000000,
      notable_investments: 'Paytm, Meesho, CRED',
      operator_background: 'Co-founder of successful fintech startup',
      bio: 'Operator angel with deep fintech expertise'
    }
  }
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('US-FOUNDER-003: Access Investor Profiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Display', () => {
    it('should display investor directory for approved founders', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestors);

      renderWithProviders(<InvestorProfiles />);

      await waitFor(() => {
        expect(screen.getByText(/Investor Directory/i)).toBeInTheDocument();
      });
    });

    it('should display list of investors', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestors);

      renderWithProviders(<InvestorProfiles />);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
        expect(screen.getByText('Amit Patel')).toBeInTheDocument();
      });
    });
  });

  describe('Investor Information Display', () => {
    it('should display investment focus for each investor', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestors);

      renderWithProviders(<InvestorProfiles />);

      await waitFor(() => {
        const aiElements = screen.getAllByText(/Artificial Intelligence/i);
        expect(aiElements.length).toBeGreaterThan(0);
        const healthcareElements = screen.getAllByText(/Healthcare/i);
        expect(healthcareElements.length).toBeGreaterThan(0);
        const fintechElements = screen.getAllByText(/Fintech/i);
        expect(fintechElements.length).toBeGreaterThan(0);
      });
    });

    it('should display investment stages for each investor', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestors);

      renderWithProviders(<InvestorProfiles />);

      await waitFor(() => {
        const seedElements = screen.getAllByText(/Seed/i);
        expect(seedElements.length).toBeGreaterThan(0);
        const preSeedElements = screen.getAllByText(/Pre-Seed/i);
        expect(preSeedElements.length).toBeGreaterThan(0);
        const seriesAElements = screen.getAllByText(/Series A/i);
        expect(seriesAElements.length).toBeGreaterThan(0);
      });
    });

    it('should display check size range for each investor', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestors);

      renderWithProviders(<InvestorProfiles />);

      await waitFor(() => {
        expect(screen.getByText(/₹10,00,000 - ₹50,00,000/i)).toBeInTheDocument();
        expect(screen.getByText(/₹5,00,000 - ₹20,00,000/i)).toBeInTheDocument();
      });
    });

    it('should display notable investments', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestors);

      renderWithProviders(<InvestorProfiles />);

      await waitFor(() => {
        expect(screen.getByText(/Zomato, Razorpay/i)).toBeInTheDocument();
        expect(screen.getByText(/PharmEasy, Unacademy/i)).toBeInTheDocument();
      });
    });

    it('should display operator background when available', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestors);

      renderWithProviders(<InvestorProfiles />);

      await waitFor(() => {
        expect(screen.getByText(/Former VP Engineering at Flipkart/i)).toBeInTheDocument();
        expect(screen.getByText(/Co-founder of successful fintech startup/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filter Functionality', () => {
    it('should display filter by sector dropdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestors);

      renderWithProviders(<InvestorProfiles />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Filter by Sector/i)).toBeInTheDocument();
      });
    });

    it('should display filter by check size dropdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestors);

      renderWithProviders(<InvestorProfiles />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Filter by Check Size/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to load investors'));

      renderWithProviders(<InvestorProfiles />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading investors/i)).toBeInTheDocument();
      });
    });
  });
});
