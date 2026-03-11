/**
 * US-INDUSTRY-003: Industry-based Deal Filtering
 *
 * As an: Investor
 * I want to: Filter deals by industry sector
 * So that: I can find relevant opportunities
 *
 * TDD: RED Phase
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import DealsPage from '@/pages/investor/DealsPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-investor-token',
    user: { id: 'inv-1', email: 'investor@example.com', roles: ['investor'] },
    isAuthenticated: true,
  }),
}));

const mockDeals = [
  { id: 'd-1', title: 'TechCo Deal', companyName: 'TechCo', industrySector: 'Technology', stage: 'Seed', dealSize: 5000000, minInvestment: 100000, dealStatus: 'open', hasExpressedInterest: false, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'd-2', title: 'HealthMed Deal', companyName: 'HealthMed', industrySector: 'Healthcare', stage: 'Series A', dealSize: 20000000, minInvestment: 500000, dealStatus: 'open', hasExpressedInterest: false, createdAt: '2024-02-01T00:00:00Z' },
  { id: 'd-3', title: 'AgriTech Deal', companyName: 'AgriTech', industrySector: 'Agriculture', stage: 'Pre-Seed', dealSize: 1000000, minInvestment: 50000, dealStatus: 'open', hasExpressedInterest: false, createdAt: '2024-03-01T00:00:00Z' },
];

const mockIndustries = [
  { id: 'ind-1', name: 'Technology', code: 'TECH', isActive: true },
  { id: 'ind-2', name: 'Healthcare', code: 'HEALTH', isActive: true },
  { id: 'ind-3', name: 'Agriculture', code: 'AGRI', isActive: true },
];

const renderComponent = () =>
  render(<BrowserRouter><DealsPage /></BrowserRouter>);

describe('US-INDUSTRY-003: Deal Industry Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      // Mock the investor application check so DealsPage can load
      http.get('/api/applications/investor-application', () =>
        HttpResponse.json({ status: 'approved' })
      ),
      http.get('/api/compliance/accreditation', () =>
        HttpResponse.json({ expiryDate: '2027-01-01T00:00:00Z' })
      ),
      http.get('/api/deals', ({ request }) => {
        const url = new URL(request.url);
        const industry = url.searchParams.get('industry');
        const filtered = industry
          ? mockDeals.filter(d => d.industrySector.toLowerCase() === industry.toLowerCase())
          : mockDeals;
        return HttpResponse.json(filtered);
      }),
      http.get('/api/industries', () => HttpResponse.json(mockIndustries)),
    );
  });

  describe('Filter UI', () => {
    it('should display industry filter on deals page', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('TechCo Deal')).toBeInTheDocument();
      });
      expect(screen.getByRole('combobox', { name: /industry/i })).toBeInTheDocument();
    });

    it('should show all deals initially', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('TechCo Deal')).toBeInTheDocument();
        expect(screen.getByText('HealthMed Deal')).toBeInTheDocument();
        expect(screen.getByText('AgriTech Deal')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should return only Technology deals when Technology filter is selected', async () => {
      let requestedIndustry: string | null = null;
      server.use(
        http.get('/api/applications/investor-application', () =>
          HttpResponse.json({ status: 'approved' })
        ),
        http.get('/api/compliance/accreditation', () =>
          HttpResponse.json({ expiryDate: '2027-01-01T00:00:00Z' })
        ),
        http.get('/api/deals', ({ request }) => {
          const url = new URL(request.url);
          requestedIndustry = url.searchParams.get('industry');
          const filtered = requestedIndustry
            ? mockDeals.filter(d => d.industrySector.toLowerCase() === requestedIndustry!.toLowerCase())
            : mockDeals;
          return HttpResponse.json(filtered);
        }),
      );
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('TechCo Deal')).toBeInTheDocument();
      });
      const filter = screen.getByRole('combobox', { name: /industry/i });
      await userEvent.selectOptions(filter, 'Technology');
      await waitFor(() => {
        expect(requestedIndustry).toBe('Technology');
      });
    });

    it('should show clear filter option after selecting an industry', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('TechCo Deal')).toBeInTheDocument();
      });
      const filter = screen.getByRole('combobox', { name: /industry/i });
      await userEvent.selectOptions(filter, 'Healthcare');
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear.*filter/i })).toBeInTheDocument();
      });
    });

    it('should restore all deals when filter is cleared', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('TechCo Deal')).toBeInTheDocument();
      });
      const filter = screen.getByRole('combobox', { name: /industry/i });
      await userEvent.selectOptions(filter, 'Technology');
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear.*filter/i })).toBeInTheDocument();
      });
      await userEvent.click(screen.getByRole('button', { name: /clear.*filter/i }));
      await waitFor(() => {
        expect(screen.getByText('TechCo Deal')).toBeInTheDocument();
        expect(screen.getByText('HealthMed Deal')).toBeInTheDocument();
        expect(screen.getByText('AgriTech Deal')).toBeInTheDocument();
      });
    });
  });
});
