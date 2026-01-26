import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BrowseDeals from '@/pages/investor/BrowseDeals';
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
      id: 'investor-1',
      email: 'investor@test.com',
      role: 'investor',
      verification_status: 'verified'
    },
    isAuthenticated: true
  })
}));

const mockDeals = [
  {
    id: 'deal-1',
    company_id: 'company-1',
    deal_status: 'active',
    amount_raising: 5000000,
    valuation: 50000000,
    equity_percentage: 10,
    minimum_investment: 500000,
    deal_terms: 'SAFE with 20% discount',
    posted_date: '2026-01-15T10:00:00Z',
    closing_date: '2026-02-15T23:59:59Z',
    company: {
      id: 'company-1',
      name: 'TechStartup AI',
      sector: 'Artificial Intelligence',
      stage: 'seed',
      description: 'AI-powered analytics platform for enterprises',
      logo_url: 'https://example.com/logo1.png'
    }
  },
  {
    id: 'deal-2',
    company_id: 'company-2',
    deal_status: 'active',
    amount_raising: 10000000,
    valuation: 80000000,
    equity_percentage: 12.5,
    minimum_investment: 1000000,
    deal_terms: 'Series A - Preferred Stock',
    posted_date: '2026-01-20T10:00:00Z',
    closing_date: '2026-03-20T23:59:59Z',
    company: {
      id: 'company-2',
      name: 'HealthTech Solutions',
      sector: 'Healthcare',
      stage: 'series-a',
      description: 'Telemedicine platform connecting doctors and patients',
      logo_url: 'https://example.com/logo2.png'
    }
  },
  {
    id: 'deal-3',
    company_id: 'company-3',
    deal_status: 'active',
    amount_raising: 2000000,
    valuation: 15000000,
    equity_percentage: 13.3,
    minimum_investment: 250000,
    deal_terms: 'Convertible Note',
    posted_date: '2026-01-10T10:00:00Z',
    closing_date: '2026-02-28T23:59:59Z',
    company: {
      id: 'company-3',
      name: 'FinTech Innovate',
      sector: 'Fintech',
      stage: 'pre-seed',
      description: 'Digital lending platform for SMEs',
      logo_url: 'https://example.com/logo3.png'
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

describe('US-INVESTOR-003: Browse Available Deals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Access', () => {
    it('should display deals page for verified investors', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/Available Deals/i)).toBeInTheDocument();
      });
    });

    it('should display page description', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/Browse active investment opportunities/i)).toBeInTheDocument();
      });
    });
  });

  describe('Display Deals', () => {
    it('should display list of active deals', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
        expect(screen.getByText('HealthTech Solutions')).toBeInTheDocument();
        expect(screen.getByText('FinTech Innovate')).toBeInTheDocument();
      });
    });

    it('should display company sector for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('Artificial Intelligence')).toBeInTheDocument();
        expect(screen.getByText('Healthcare')).toBeInTheDocument();
        expect(screen.getByText('Fintech')).toBeInTheDocument();
      });
    });

    it('should display company stage for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('Seed')).toBeInTheDocument();
        expect(screen.getByText(/Series A/i)).toBeInTheDocument();
        expect(screen.getByText(/Pre-Seed/i)).toBeInTheDocument();
      });
    });

    it('should display amount raising for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/₹50,00,000/)).toBeInTheDocument();
        expect(screen.getByText(/₹1,00,00,000/)).toBeInTheDocument();
        expect(screen.getByText(/₹20,00,000/)).toBeInTheDocument();
      });
    });

    it('should display valuation for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/₹5,00,00,000/)).toBeInTheDocument();
        expect(screen.getByText(/₹8,00,00,000/)).toBeInTheDocument();
      });
    });

    it('should display equity percentage for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/10%/)).toBeInTheDocument();
        expect(screen.getByText(/12.5%/)).toBeInTheDocument();
      });
    });

    it('should display minimum investment for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/Min: ₹5,00,000/)).toBeInTheDocument();
        expect(screen.getByText(/Min: ₹10,00,000/)).toBeInTheDocument();
        expect(screen.getByText(/Min: ₹2,50,000/)).toBeInTheDocument();
      });
    });

    it('should display brief description for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/AI-powered analytics platform/i)).toBeInTheDocument();
        expect(screen.getByText(/Telemedicine platform/i)).toBeInTheDocument();
        expect(screen.getByText(/Digital lending platform/i)).toBeInTheDocument();
      });
    });

    it('should display empty state when no deals available', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/No deals available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should display search input', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search by company name/i)).toBeInTheDocument();
      });
    });

    it('should filter deals by search term', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by company name/i);
      await user.type(searchInput, 'HealthTech');

      await waitFor(() => {
        expect(screen.getByText('HealthTech Solutions')).toBeInTheDocument();
        expect(screen.queryByText('TechStartup AI')).not.toBeInTheDocument();
      });
    });
  });

  describe('Filter by Sector', () => {
    it('should display sector filter dropdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Filter by Sector/i)).toBeInTheDocument();
      });
    });

    it('should filter deals by selected sector', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
      });

      const sectorFilter = screen.getByLabelText(/Filter by Sector/i);
      await user.click(sectorFilter);
      await user.click(screen.getByText('Healthcare'));

      await waitFor(() => {
        expect(screen.getByText('HealthTech Solutions')).toBeInTheDocument();
        expect(screen.queryByText('TechStartup AI')).not.toBeInTheDocument();
      });
    });
  });

  describe('Filter by Stage', () => {
    it('should display stage filter dropdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Filter by Stage/i)).toBeInTheDocument();
      });
    });

    it('should filter deals by selected stage', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
      });

      const stageFilter = screen.getByLabelText(/Filter by Stage/i);
      await user.click(stageFilter);
      await user.click(screen.getByText('Seed'));

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
        expect(screen.queryByText('HealthTech Solutions')).not.toBeInTheDocument();
      });
    });
  });

  describe('Filter by Check Size', () => {
    it('should display check size filter dropdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Filter by Check Size/i)).toBeInTheDocument();
      });
    });

    it('should filter deals by check size range', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
      });

      const checkSizeFilter = screen.getByLabelText(/Filter by Check Size/i);
      await user.click(checkSizeFilter);
      await user.click(screen.getByText(/Under ₹5 lakh/i));

      await waitFor(() => {
        expect(screen.getByText('FinTech Innovate')).toBeInTheDocument();
        expect(screen.queryByText('HealthTech Solutions')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sort Functionality', () => {
    it('should display sort dropdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Sort by/i)).toBeInTheDocument();
      });
    });

    it('should sort deals by date posted (newest first)', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
      });

      const sortSelect = screen.getByLabelText(/Sort by/i);
      await user.click(sortSelect);
      await user.click(screen.getByText(/Newest First/i));

      await waitFor(() => {
        const cards = screen.getAllByRole('article');
        expect(cards[0]).toHaveTextContent('HealthTech Solutions');
      });
    });

    it('should sort deals by amount raising (highest first)', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
      });

      const sortSelect = screen.getByLabelText(/Sort by/i);
      await user.click(sortSelect);
      await user.click(screen.getByText(/Amount Raising/i));

      await waitFor(() => {
        const cards = screen.getAllByRole('article');
        expect(cards[0]).toHaveTextContent('HealthTech Solutions');
      });
    });
  });

  describe('View Deal Details', () => {
    it('should show view details button for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText(/View Details/i);
        expect(viewButtons.length).toBe(3);
      });
    });

    it('should navigate to deal detail page when clicking view details', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText(/View Details/i);
      await user.click(viewButtons[0]);

      // Link should point to deal detail page
      expect(viewButtons[0].closest('a')).toHaveAttribute('href', '/deals/deal-1');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading deals/i)).toBeInTheDocument();
      });
    });
  });
});
