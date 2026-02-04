/**
 * US-FOUNDER-003: Access Investor Profiles
 * 
 * As a: Founder
 * I want to: Browse and view investor profiles
 * So that: I can identify potential investors for my startup
 * 
 * Acceptance Criteria:
 * - GIVEN I am a founder
 *   WHEN I navigate to investors directory
 *   THEN I see list of all active investors
 * 
 * - GIVEN investor has profile
 *   WHEN I click on investor
 *   THEN I see their investment focus and portfolio
 * 
 * - GIVEN I want to filter investors
 *   WHEN I apply filters
 *   THEN I see investors matching criteria
 * 
 * Priority: High
 * Status: Implementing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';

import InvestorDirectory from '@/pages/founder/InvestorDirectory';

// Mock AuthContext for authentication
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'founder-123',
      email: 'founder@example.com',
      role: 'founder',
    },
    isAuthenticated: true,
    token: 'test-token',
  }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-FOUNDER-003: Access Investor Profiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Investor Directory', () => {
    it('should display list of investors', async () => {
      const mockInvestors = [
        {
          id: 'investor-001',
          email: 'investor1@example.com',
          fullName: 'John Investor',
          createdAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'investor-002',
          email: 'investor2@example.com',
          fullName: 'Jane Investor',
          createdAt: '2024-01-16T10:00:00Z',
        }
      ];

      server.use(
        http.get('/api/admin/investors', () => {
          return HttpResponse.json(mockInvestors);
        }),
      );

      renderWithRouter(<InvestorDirectory />);

      await waitFor(() => {
        expect(screen.getByText(/John Investor/i)).toBeInTheDocument();
        expect(screen.getByText(/Jane Investor/i)).toBeInTheDocument();
      });
    });

    it('should show investor email', async () => {
      const mockInvestors = [
        {
          id: 'investor-001',
          email: 'investor@example.com',
          fullName: 'Test Investor',
          createdAt: '2024-01-15T10:00:00Z',
        }
      ];

      server.use(
        http.get('/api/admin/investors', () => {
          return HttpResponse.json(mockInvestors);
        }),
      );

      renderWithRouter(<InvestorDirectory />);

      await waitFor(() => {
        expect(screen.getByText(/investor@example.com/i)).toBeInTheDocument();
      });
    });

    it('should display empty state when no investors', async () => {
      server.use(
        http.get('/api/admin/investors', () => {
          return HttpResponse.json([]);
        }),
      );

      renderWithRouter(<InvestorDirectory />);

      await waitFor(() => {
        expect(screen.getByText(/No investors available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Investors', () => {
    it('should filter investors by search query', async () => {
      const user = userEvent.setup();
      
      const mockInvestors = [
        {
          id: 'investor-001',
          fullName: 'John Investor',
          email: 'john@example.com',
          createdAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'investor-002',
          fullName: 'Jane Smith',
          email: 'jane@example.com',
          createdAt: '2024-01-16T10:00:00Z',
        }
      ];

      server.use(
        http.get('/api/admin/investors', () => {
          return HttpResponse.json(mockInvestors);
        }),
      );

      renderWithRouter(<InvestorDirectory />);

      await waitFor(() => {
        expect(screen.getByText(/John Investor/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search investors/i);
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByText(/John Investor/i)).toBeInTheDocument();
        expect(screen.queryByText(/Jane Smith/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Investor Details', () => {
    it('should show investor member since date', async () => {
      const mockInvestors = [
        {
          id: 'investor-001',
          fullName: 'Test Investor',
          email: 'test@investor.com',
          createdAt: '2024-01-15T10:00:00Z',
        }
      ];

      server.use(
        http.get('/api/admin/investors', () => {
          return HttpResponse.json(mockInvestors);
        }),
      );

      renderWithRouter(<InvestorDirectory />);

      await waitFor(() => {
        expect(screen.getByText(/Test Investor/i)).toBeInTheDocument();
        expect(screen.getByText(/Member since/i)).toBeInTheDocument();
      });
    });
  });
});
