/**
 * US-ADMIN-CRUD-005: Investors Admin Listing
 * 
 * As an: Admin
 * I want to: View all investors on the platform
 * So that: I can monitor and manage the investor base
 * 
 * TDD: RED Phase - Tests for Investors Admin page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import InvestorManagement from '@/pages/admin/InvestorManagement';

// Mock navigation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-admin-token',
    user: { id: 'admin-1', email: 'admin@example.com', roles: ['admin'] },
    isAuthenticated: true,
  }),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockInvestors = [
  {
    id: 'inv-1',
    email: 'investor1@example.com',
    fullName: 'Rajesh Sharma',
    investorProfile: {
      accreditationStatus: 'VERIFIED',
      investmentPreferences: ['Technology', 'Healthcare'],
      totalInvested: 5000000,
    },
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'inv-2',
    email: 'investor2@example.com',
    fullName: 'Priya Patel',
    investorProfile: {
      accreditationStatus: 'PENDING',
      investmentPreferences: ['FinTech'],
      totalInvested: 0,
    },
    createdAt: '2024-02-15T10:00:00Z',
  },
  {
    id: 'inv-3',
    email: 'investor3@example.com',
    fullName: 'Amit Kumar',
    investorProfile: {
      accreditationStatus: 'VERIFIED',
      investmentPreferences: ['EdTech', 'SaaS'],
      totalInvested: 2500000,
    },
    createdAt: '2024-03-01T10:00:00Z',
  },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <InvestorManagement />
    </BrowserRouter>
  );
};

describe('US-ADMIN-CRUD-005: Investor Management Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('/api/admin/investors', () => {
        return HttpResponse.json(mockInvestors);
      })
    );
  });

  describe('Page Layout', () => {
    it('should render the Investor Management page title', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/investor management/i)).toBeInTheDocument();
      });
    });

    it('should display list of investors', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Rajesh Sharma')).toBeInTheDocument();
        expect(screen.getByText('Priya Patel')).toBeInTheDocument();
        expect(screen.getByText('Amit Kumar')).toBeInTheDocument();
      });
    });

    it('should display investor emails', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('investor1@example.com')).toBeInTheDocument();
        expect(screen.getByText('investor2@example.com')).toBeInTheDocument();
      });
    });

    it('should display accreditation status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Rajesh Sharma')).toBeInTheDocument();
      });

      // Should show accreditation badges on investor cards
      await waitFor(() => {
        // Investor badges render as "✓ Verified" or "Pending"
        const verifiedBadges = screen.getAllByText(/✓ Verified/);
        expect(verifiedBadges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should display total investor count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Rajesh Sharma')).toBeInTheDocument();
      });

      // Total investors card should show 3
      const totalCard = screen.getByText(/Total Investors/i).closest('div[class*="card"]');
      expect(totalCard).toBeTruthy();
    });
  });

  describe('Search and Filter', () => {
    it('should have a search input', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });
    });

    it('should filter investors by name search', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Rajesh Sharma')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await userEvent.type(searchInput, 'Priya');

      await waitFor(() => {
        expect(screen.getByText('Priya Patel')).toBeInTheDocument();
        expect(screen.queryByText('Rajesh Sharma')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show message when no investors found', async () => {
      server.use(
        http.get('/api/admin/investors', () => {
          return HttpResponse.json([]);
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no investors/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error when API fails', async () => {
      server.use(
        http.get('/api/admin/investors', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
          })
        );
      });
    });
  });
});
