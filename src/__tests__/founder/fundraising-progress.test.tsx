import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import FundraisingProgress from '@/pages/founder/FundraisingProgress';

// Mock AuthContext for authentication
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'founder-1',
      email: 'founder@example.com',
      role: 'founder',
    },
    isAuthenticated: true,
    token: 'test-token',
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

describe('FundraisingProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fundraising Dashboard', () => {
    it('should display fundraising progress page', async () => {
      server.use(
        http.get('/api/company/fundraising-rounds', () => {
          return HttpResponse.json([]);
        }),
      );

      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Fundraising Progress')).toBeInTheDocument();
      });
    });

    it('should display active fundraising rounds', async () => {
      const mockRounds = [
        {
          id: 'round-1',
          roundName: 'Seed Round',
          targetAmount: 1000000,
          raisedAmount: 750000,
          status: 'active',
          startDate: '2024-01-01',
          targetCloseDate: '2024-06-30',
        },
        {
          id: 'round-2',
          roundName: 'Series A',
          targetAmount: 5000000,
          raisedAmount: 0,
          status: 'planning',
          startDate: null,
          targetCloseDate: '2024-12-31',
        },
      ];

      server.use(
        http.get('/api/company/fundraising-rounds', () => {
          return HttpResponse.json(mockRounds);
        }),
      );

      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Seed Round')).toBeInTheDocument();
        expect(screen.getByText('Series A')).toBeInTheDocument();
      });
    });
  });

  describe('Add Fundraising Round', () => {
    it('should show add round button', async () => {
      server.use(
        http.get('/api/company/fundraising-rounds', () => {
          return HttpResponse.json([]);
        }),
      );

      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add round/i })).toBeInTheDocument();
      });
    });

    it('should allow adding new fundraising round', async () => {
      server.use(
        http.get('/api/company/fundraising-rounds', () => {
          return HttpResponse.json([]);
        }),
        http.post('/api/company/fundraising-rounds', () => {
          return HttpResponse.json({
            id: 'round-1',
            roundName: 'Seed Round',
            targetAmount: 1000000,
            raisedAmount: 0,
            status: 'planning',
          });
        }),
      );

      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add round/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add round/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/round name/i)).toBeInTheDocument();
      });

      const roundNameInput = screen.getByLabelText(/round name/i);
      const targetAmountInput = screen.getByLabelText(/target amount/i);

      await user.type(roundNameInput, 'Seed Round');
      await user.type(targetAmountInput, '1000000');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
    });
  });

  describe('Progress Visualization', () => {
    it('should display fundraising progress bar', async () => {
      const mockRounds = [
        {
          id: 'round-1',
          roundName: 'Seed Round',
          targetAmount: 1000000,
          raisedAmount: 750000,
          status: 'active',
        },
      ];

      server.use(
        http.get('/api/company/fundraising-rounds', () => {
          return HttpResponse.json(mockRounds);
        }),
      );

      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Check for percentage display (75% progress)
        expect(screen.getByText(/75%/)).toBeInTheDocument();
      });
    });

    it('should display target and raised amounts', async () => {
      const mockRounds = [
        {
          id: 'round-1',
          roundName: 'Seed Round',
          targetAmount: 1000000,
          raisedAmount: 750000,
          status: 'active',
        },
      ];

      server.use(
        http.get('/api/company/fundraising-rounds', () => {
          return HttpResponse.json(mockRounds);
        }),
      );

      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Check for formatted amounts
        expect(screen.getByText(/₹7.5L/)).toBeInTheDocument();
        expect(screen.getByText(/₹10\.0L/)).toBeInTheDocument();
      });
    });

    it('should display round status', async () => {
      const mockRounds = [
        {
          id: 'round-1',
          roundName: 'Seed Round',
          targetAmount: 1000000,
          raisedAmount: 750000,
          status: 'active',
        },
        {
          id: 'round-2',
          roundName: 'Series A',
          targetAmount: 5000000,
          raisedAmount: 0,
          status: 'planning',
        },
      ];

      server.use(
        http.get('/api/company/fundraising-rounds', () => {
          return HttpResponse.json(mockRounds);
        }),
      );

      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/active/i)).toBeInTheDocument();
        expect(screen.getByText(/planning/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no rounds exist', async () => {
      server.use(
        http.get('/api/company/fundraising-rounds', () => {
          return HttpResponse.json([]);
        }),
      );

      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/no fundraising rounds yet/i) || screen.getByText(/add round/i)).toBeInTheDocument();
      });
    });
  });
});
