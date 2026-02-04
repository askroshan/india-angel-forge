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
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/Available Deals/i)).toBeInTheDocument();
      });
    });

    it('should display page description', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/Browse active investment opportunities/i)).toBeInTheDocument();
      });
    });
  });

  describe('Display Deals', () => {
    it('should display list of active deals', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
        expect(screen.getByText('HealthTech Solutions')).toBeInTheDocument();
        expect(screen.getByText('FinTech Innovate')).toBeInTheDocument();
      });
    });

    it('should display company sector for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('Artificial Intelligence')).toBeInTheDocument();
        expect(screen.getByText('Healthcare')).toBeInTheDocument();
        expect(screen.getByText('Fintech')).toBeInTheDocument();
      });
    });

    it('should display company stage for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('Seed')).toBeInTheDocument();
        expect(screen.getByText(/Series A/i)).toBeInTheDocument();
        expect(screen.getByText(/Pre-Seed/i)).toBeInTheDocument();
      });
    });

    it('should display amount raising for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/₹50,00,000/)).toBeInTheDocument();
        expect(screen.getByText(/₹1,00,00,000/)).toBeInTheDocument();
        expect(screen.getByText(/₹20,00,000/)).toBeInTheDocument();
      });
    });

    it('should display valuation for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/₹5,00,00,000/)).toBeInTheDocument();
        expect(screen.getByText(/₹8,00,00,000/)).toBeInTheDocument();
      });
    });

    it('should display equity percentage for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/10%/)).toBeInTheDocument();
        expect(screen.getByText(/12.5%/)).toBeInTheDocument();
      });
    });

    it('should display minimum investment for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        // Component shows "Min. Investment" label with value below it
        const minInvestmentLabels = screen.getAllByText(/Min\. Investment/i);
        expect(minInvestmentLabels.length).toBe(3);
      });
    });

    it('should display brief description for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

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
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search by company name/i)).toBeInTheDocument();
      });
    });

    it('should filter deals by search term', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

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
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        // Use the label's for attribute to find the sector filter
        expect(screen.getByLabelText(/^Sector$/i)).toBeInTheDocument();
      });
    });

    it('should filter deals by selected sector', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
      });

      // Use trigger ID to find the correct select
      const sectorTrigger = screen.getByRole('combobox', { name: /^Sector$/i });
      await user.click(sectorTrigger);
      await user.click(screen.getByRole('option', { name: 'Healthcare' }));

      await waitFor(() => {
        expect(screen.getByText('HealthTech Solutions')).toBeInTheDocument();
        expect(screen.queryByText('TechStartup AI')).not.toBeInTheDocument();
      });
    });
  });

  describe('Filter by Stage', () => {
    it('should display stage filter dropdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        // Use the label's for attribute to find the stage filter
        expect(screen.getByLabelText(/^Stage$/i)).toBeInTheDocument();
      });
    });

    it('should filter deals by selected stage', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
      });

      // Use trigger ID to find the correct select
      const stageTrigger = screen.getByRole('combobox', { name: /^Stage$/i });
      await user.click(stageTrigger);
      await user.click(screen.getByRole('option', { name: 'Seed' }));

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
        expect(screen.queryByText('HealthTech Solutions')).not.toBeInTheDocument();
      });
    });
  });

  describe('Filter by Check Size', () => {
    it('should display check size filter dropdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText(/Check Size/i)).toBeInTheDocument();
      });
    });

    it('should filter deals by check size range', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
      });

      const checkSizeTrigger = screen.getByRole('combobox', { name: /Check Size/i });
      await user.click(checkSizeTrigger);
      await user.click(screen.getByRole('option', { name: /Under ₹5L/i }));

      await waitFor(() => {
        expect(screen.getByText('FinTech Innovate')).toBeInTheDocument();
        expect(screen.queryByText('HealthTech Solutions')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sort Functionality', () => {
    it('should display sort dropdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Sort by/i)).toBeInTheDocument();
      });
    });

    it('should sort deals by date posted (newest first)', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
      });

      const sortSelect = screen.getByRole('combobox', { name: /Sort by/i });
      await user.click(sortSelect);
      await user.click(screen.getByRole('option', { name: /Newest First/i }));

      await waitFor(() => {
        // After sorting by newest, HealthTech (posted 2026-01-20) should appear first
        const companyNames = screen.getAllByRole('heading', { level: 3 });
        expect(companyNames[0]).toHaveTextContent('HealthTech Solutions');
      });
    });

    it('should sort deals by amount raising (highest first)', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
      });

      const sortSelect = screen.getByRole('combobox', { name: /Sort by/i });
      await user.click(sortSelect);
      await user.click(screen.getByRole('option', { name: /Highest Amount/i }));

      await waitFor(() => {
        // After sorting by highest amount, HealthTech (10M) should appear first
        const companyNames = screen.getAllByRole('heading', { level: 3 });
        expect(companyNames[0]).toHaveTextContent('HealthTech Solutions');
      });
    });
  });

  describe('View Deal Details', () => {
    it('should show view details button for each deal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText(/View Deal Details/i);
        expect(viewButtons.length).toBe(3);
      });
    });

    it('should navigate to deal detail page when clicking view details', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeals);

      renderWithProviders(<BrowseDeals />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
      });

      // Check that deal-1 link exists and points to the correct URL
      const viewLinks = screen.getAllByRole('link', { name: /View Deal Details/i });
      const dealUrls = viewLinks.map(link => link.getAttribute('href'));
      
      expect(dealUrls).toContain('/deals/deal-1');
      expect(dealUrls).toContain('/deals/deal-2');
      expect(dealUrls).toContain('/deals/deal-3');
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
