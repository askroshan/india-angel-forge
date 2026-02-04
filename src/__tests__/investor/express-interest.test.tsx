import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ExpressInterest from '@/pages/investor/ExpressInterest';
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

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ dealId: 'deal-1' })
  };
});

const mockDeal = {
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
};

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

describe('US-INVESTOR-004: Express Interest in Deal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Display', () => {
    it('should display deal details on the page', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeal);

      renderWithProviders(<ExpressInterest />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup AI')).toBeInTheDocument();
        expect(screen.getByText(/Artificial Intelligence/i)).toBeInTheDocument();
      });
    });

    it('should display express interest form', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeal);

      renderWithProviders(<ExpressInterest />);

      await waitFor(() => {
        expect(screen.getByText(/Express Interest/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Investment Amount/i)).toBeInTheDocument();
      });
    });

    it('should display minimum investment requirement', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDeal);

      renderWithProviders(<ExpressInterest />);

      await waitFor(() => {
        expect(screen.getByText(/Minimum: ₹5,00,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('Investment Amount Input', () => {
    it('should allow user to enter investment amount', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeal);

      renderWithProviders(<ExpressInterest />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Investment Amount/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/Investment Amount/i);
      await user.clear(input);
      await user.type(input, '1000000');

      expect(input).toHaveValue(1000000);
    });

    it('should validate amount is not below minimum', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeal);

      renderWithProviders(<ExpressInterest />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Investment Amount/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/Investment Amount/i);
      await user.clear(input);
      await user.type(input, '100000');

      // Submit the form using fireEvent
      const form = input.closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      // The client-side validation should show the error
      await waitFor(() => {
        expect(screen.getByText(/Investment amount below minimum/i)).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // API should not have been called due to client-side validation
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('should validate amount is required', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeal);

      renderWithProviders(<ExpressInterest />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Investment Amount/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Submit Interest/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Investment amount is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Submit Interest', () => {
    it('should submit interest with valid amount', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeal);
      vi.mocked(apiClient.post).mockResolvedValue({ 
        data: { 
          id: 'interest-1',
          deal_id: 'deal-1',
          investor_id: 'investor-1',
          investment_amount: 1000000,
          status: 'interested'
        },
        error: null
      });

      renderWithProviders(<ExpressInterest />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Investment Amount/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/Investment Amount/i);
      await user.clear(input);
      await user.type(input, '1000000');

      const submitButton = screen.getByRole('button', { name: /Submit Interest/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/api/deal-interests', {
          deal_id: 'deal-1',
          investment_amount: 1000000
        });
      });
    });

    it('should show success message after submission', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeal);
      vi.mocked(apiClient.post).mockResolvedValue({ 
        data: { 
          id: 'interest-1',
          deal_id: 'deal-1',
          investor_id: 'investor-1',
          investment_amount: 1000000,
          status: 'interested'
        },
        error: null
      });

      renderWithProviders(<ExpressInterest />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Investment Amount/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/Investment Amount/i);
      await user.clear(input);
      await user.type(input, '1000000');

      const submitButton = screen.getByRole('button', { name: /Submit Interest/i });
      await user.click(submitButton);

      await waitFor(() => {
        const successMessages = screen.getAllByText(/Interest submitted successfully/i);
        expect(successMessages.length).toBeGreaterThan(0);
      });
    });

    it('should notify deal sponsor', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeal);
      vi.mocked(apiClient.post).mockResolvedValue({ 
        data: { 
          id: 'interest-1',
          deal_id: 'deal-1',
          investor_id: 'investor-1',
          investment_amount: 1000000,
          status: 'interested',
          sponsor_notified: true
        },
        error: null
      });

      renderWithProviders(<ExpressInterest />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Investment Amount/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/Investment Amount/i);
      await user.clear(input);
      await user.type(input, '1000000');

      const submitButton = screen.getByRole('button', { name: /Submit Interest/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Deal sponsor has been notified/i)).toBeInTheDocument();
      });
    });

    it('should mention data room access', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeal);
      vi.mocked(apiClient.post).mockResolvedValue({ 
        data: { 
          id: 'interest-1',
          deal_id: 'deal-1',
          investor_id: 'investor-1',
          investment_amount: 1000000,
          status: 'interested',
          data_room_access: true
        },
        error: null
      });

      renderWithProviders(<ExpressInterest />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Investment Amount/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/Investment Amount/i);
      await user.clear(input);
      await user.type(input, '1000000');

      const submitButton = screen.getByRole('button', { name: /Submit Interest/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/You now have access to the data room/i)).toBeInTheDocument();
      });
    });

    it('should mention deal added to pipeline', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeal);
      vi.mocked(apiClient.post).mockResolvedValue({ 
        data: { 
          id: 'interest-1',
          deal_id: 'deal-1',
          investor_id: 'investor-1',
          investment_amount: 1000000,
          status: 'interested'
        },
        error: null
      });

      renderWithProviders(<ExpressInterest />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Investment Amount/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/Investment Amount/i);
      await user.clear(input);
      await user.type(input, '1000000');

      const submitButton = screen.getByRole('button', { name: /Submit Interest/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Deal added to your pipeline/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to load deal'));

      renderWithProviders(<ExpressInterest />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading deal/i)).toBeInTheDocument();
      });
    });

    it('should handle submission error gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockDeal);
      vi.mocked(apiClient.post).mockRejectedValue({
        response: { data: { message: 'Failed to submit interest' } }
      });

      renderWithProviders(<ExpressInterest />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Investment Amount/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/Investment Amount/i);
      await user.clear(input);
      await user.type(input, '1000000');

      const submitButton = screen.getByRole('button', { name: /Submit Interest/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to submit interest/i)).toBeInTheDocument();
      });
    });
  });
});
