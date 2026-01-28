import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DealAnalytics from '@/pages/investor/DealAnalytics';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'investor-1', email: 'investor@example.com', role: 'INVESTOR' },
    token: 'mock-token',
    isAuthenticated: true,
  }),
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
  });

  describe('Analytics Dashboard', () => {
    it('should display deal analytics page', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

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
          companyName: 'TechStartup Inc',
          valuation: 50000000,
          investmentAmount: 5000000,
          status: 'active',
          industry: 'Technology',
          stage: 'Series A',
        },
        {
          id: 'deal-2',
          companyName: 'FinTech Co',
          valuation: 30000000,
          investmentAmount: 3000000,
          status: 'active',
          industry: 'FinTech',
          stage: 'Seed',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDeals),
      });

      render(
        <BrowserRouter>
          <DealAnalytics />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should show total deals count
        expect(screen.getByText('2')).toBeInTheDocument();
        // Should show total investment - 5M + 3M = 8M = 80 Lakhs
        // formatAmount: 8000000 >= 100000 → ₹80.0L
        expect(screen.getByText(/₹80\.0L/i)).toBeInTheDocument();
      });
    });
  });

  describe('Industry Distribution', () => {
    it('should display deals by industry', async () => {
      const mockDeals = [
        {
          id: 'deal-1',
          companyName: 'TechCo',
          industry: 'Technology',
          valuation: 50000000,
          investmentAmount: 5000000,
        },
        {
          id: 'deal-2',
          companyName: 'FinTechCo',
          industry: 'FinTech',
          valuation: 30000000,
          investmentAmount: 3000000,
        },
        {
          id: 'deal-3',
          companyName: 'TechCo2',
          industry: 'Technology',
          valuation: 40000000,
          investmentAmount: 4000000,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDeals),
      });

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
        { id: '1', industry: 'Technology', investmentAmount: 5000000 },
        { id: '2', industry: 'Technology', investmentAmount: 4000000 },
        { id: '3', industry: 'FinTech', investmentAmount: 3000000 },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDeals),
      });

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
          investmentAmount: 3000000,
        },
        {
          id: 'deal-2',
          stage: 'Series A',
          investmentAmount: 5000000,
        },
        {
          id: 'deal-3',
          stage: 'Seed',
          investmentAmount: 2000000,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDeals),
      });

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
          investmentAmount: 3000000,
        },
        {
          id: 'deal-2',
          stage: 'Series A',
          investmentAmount: 5000000,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDeals),
      });

      render(
        <BrowserRouter>
          <DealAnalytics />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Check for formatted amounts - 3000000 = 30L, 5000000 = 50L
        expect(screen.getByText(/₹30\.0L/i)).toBeInTheDocument();
        expect(screen.getByText(/₹50\.0L/i)).toBeInTheDocument();
      });
    });
  });

  describe('Average Metrics', () => {
    it('should display average deal size', async () => {
      const mockDeals = [
        { id: '1', investmentAmount: 4000000 },
        { id: '2', investmentAmount: 6000000 },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDeals),
      });

      render(
        <BrowserRouter>
          <DealAnalytics />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Average of 4M and 6M = 5M = 50L - component uses formatAmount with decimal
        expect(screen.getByText(/₹50\.0L/i)).toBeInTheDocument();
      });
    });

    it('should display average valuation', async () => {
      const mockDeals = [
        { id: '1', valuation: 40000000, investmentAmount: 4000000 },
        { id: '2', valuation: 60000000, investmentAmount: 6000000 },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDeals),
      });

      render(
        <BrowserRouter>
          <DealAnalytics />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Average valuation: (40M + 60M)/2 = 50M = 5Cr - component uses formatAmount with decimal
        expect(screen.getByText(/₹5\.0Cr/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no deals exist', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

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
