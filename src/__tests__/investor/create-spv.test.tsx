import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import CreateSPV from '@/pages/investor/CreateSPV';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
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

// Mock available deals
const mockDeals = [
  {
    id: 'deal-1',
    company_name: 'TechStartup India',
    sector: 'Technology',
    funding_stage: 'SEED',
    target_amount: 50000000,
  },
  {
    id: 'deal-2',
    company_name: 'HealthTech Solutions',
    sector: 'Healthcare',
    funding_stage: 'SERIES_A',
    target_amount: 100000000,
  },
];

describe('US-INVESTOR-008: Create SPV', () => {
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
    it('should display create SPV page', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<CreateSPV />);

      expect(screen.getByText(/Create Special Purpose Vehicle/i)).toBeInTheDocument();
    });

    it('should display SPV form fields', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<CreateSPV />);

      await waitFor(() => {
        expect(screen.getByLabelText(/SPV Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Select Deal/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Target Raise Amount/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Carry Percentage/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Hurdle Rate/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Minimum Investment/i)).toBeInTheDocument();
      });
    });

    it('should display information about SPV structure', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<CreateSPV />);

      await waitFor(() => {
        expect(screen.getByText(/pool investments from multiple investors/i)).toBeInTheDocument();
      });
    });
  });

  describe('Deal Selection', () => {
    it('should load available deals', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<CreateSPV />);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/deals');
      });
    });

    it('should allow selecting a deal', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<CreateSPV />);

      const dealSelect = await screen.findByLabelText(/Select Deal/i);
      await user.click(dealSelect);

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
      });
    });

    it('should display deal details when selected', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<CreateSPV />);

      const dealSelect = await screen.findByLabelText(/Select Deal/i);
      await user.click(dealSelect);
      
      const dealOption = await screen.findByText('TechStartup India');
      await user.click(dealOption);

      await waitFor(() => {
        expect(screen.getByText(/Technology/i)).toBeInTheDocument();
        expect(screen.getByText(/₹5.0 Cr/i)).toBeInTheDocument();
      });
    });
  });

  describe('SPV Configuration', () => {
    it('should allow entering SPV name', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<CreateSPV />);

      const nameInput = await screen.findByLabelText(/SPV Name/i);
      await user.type(nameInput, 'TechStartup SPV 2026');

      expect(nameInput).toHaveValue('TechStartup SPV 2026');
    });

    it('should allow entering target raise amount', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<CreateSPV />);

      const amountInput = await screen.findByLabelText(/Target Raise Amount/i);
      await user.type(amountInput, '10000000');

      expect(amountInput).toHaveValue(10000000);
    });

    it('should allow entering carry percentage', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<CreateSPV />);

      const carryInput = await screen.findByLabelText(/Carry Percentage/i);
      await user.type(carryInput, '20');

      expect(carryInput).toHaveValue(20);
    });

    it('should allow entering hurdle rate', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<CreateSPV />);

      const hurdleInput = await screen.findByLabelText(/Hurdle Rate/i);
      await user.type(hurdleInput, '15');

      expect(hurdleInput).toHaveValue(15);
    });

    it('should allow entering minimum investment amount', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<CreateSPV />);

      const minInvestmentInput = await screen.findByLabelText(/Minimum Investment/i);
      await user.type(minInvestmentInput, '500000');

      expect(minInvestmentInput).toHaveValue(500000);
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<CreateSPV />);

      const submitButton = screen.getByRole('button', { name: /Create SPV/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('should validate carry percentage range (0-100)', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<CreateSPV />);

      const carryInput = await screen.findByLabelText(/Carry Percentage/i);
      await user.type(carryInput, '150');

      await waitFor(() => {
        expect(screen.getByText(/between 0 and 100/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum investment is positive', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });

      renderWithProviders(<CreateSPV />);

      const minInvestmentInput = await screen.findByLabelText(/Minimum Investment/i);
      await user.type(minInvestmentInput, '-1000');

      await waitFor(() => {
        expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
      });
    });
  });

  describe('Create SPV Submission', () => {
    it('should submit SPV creation successfully', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          id: 'spv-1',
          spv_name: 'TechStartup SPV 2026',
          deal_id: 'deal-1',
          lead_investor_id: 'investor-1',
          target_raise_amount: 10000000,
          carry_percentage: 20,
          hurdle_rate: 15,
          minimum_investment: 500000,
          status: 'OPEN',
        },
      });

      renderWithProviders(<CreateSPV />);

      // Fill form
      const nameInput = await screen.findByLabelText(/SPV Name/i);
      await user.type(nameInput, 'TechStartup SPV 2026');

      const dealSelect = await screen.findByLabelText(/Select Deal/i);
      await user.click(dealSelect);
      const dealOption = await screen.findByText('TechStartup India');
      await user.click(dealOption);

      const amountInput = await screen.findByLabelText(/Target Raise Amount/i);
      await user.type(amountInput, '10000000');

      const carryInput = await screen.findByLabelText(/Carry Percentage/i);
      await user.type(carryInput, '20');

      const hurdleInput = await screen.findByLabelText(/Hurdle Rate/i);
      await user.type(hurdleInput, '15');

      const minInvestmentInput = await screen.findByLabelText(/Minimum Investment/i);
      await user.type(minInvestmentInput, '500000');

      const submitButton = screen.getByRole('button', { name: /Create SPV/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/api/spvs', {
          spv_name: 'TechStartup SPV 2026',
          deal_id: 'deal-1',
          target_raise_amount: 10000000,
          carry_percentage: 20,
          hurdle_rate: 15,
          minimum_investment: 500000,
        });
      });
    });

    it('should show success message after SPV creation', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          id: 'spv-1',
          spv_name: 'TechStartup SPV 2026',
        },
      });

      renderWithProviders(<CreateSPV />);

      // Fill form
      const nameInput = await screen.findByLabelText(/SPV Name/i);
      await user.type(nameInput, 'TechStartup SPV 2026');

      const dealSelect = await screen.findByLabelText(/Select Deal/i);
      await user.click(dealSelect);
      const dealOption = await screen.findByText('TechStartup India');
      await user.click(dealOption);

      const amountInput = await screen.findByLabelText(/Target Raise Amount/i);
      await user.type(amountInput, '10000000');

      const carryInput = await screen.findByLabelText(/Carry Percentage/i);
      await user.type(carryInput, '20');

      const hurdleInput = await screen.findByLabelText(/Hurdle Rate/i);
      await user.type(hurdleInput, '15');

      const minInvestmentInput = await screen.findByLabelText(/Minimum Investment/i);
      await user.type(minInvestmentInput, '500000');

      const submitButton = screen.getByRole('button', { name: /Create SPV/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/SPV created successfully/i)).toBeInTheDocument();
      });
    });

    it('should mention ability to invite co-investors after creation', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          id: 'spv-1',
          spv_name: 'TechStartup SPV 2026',
        },
      });

      renderWithProviders(<CreateSPV />);

      // Fill form
      const nameInput = await screen.findByLabelText(/SPV Name/i);
      await user.type(nameInput, 'TechStartup SPV 2026');

      const dealSelect = await screen.findByLabelText(/Select Deal/i);
      await user.click(dealSelect);
      const dealOption = await screen.findByText('TechStartup India');
      await user.click(dealOption);

      const amountInput = await screen.findByLabelText(/Target Raise Amount/i);
      await user.type(amountInput, '10000000');

      const carryInput = await screen.findByLabelText(/Carry Percentage/i);
      await user.type(carryInput, '20');

      const hurdleInput = await screen.findByLabelText(/Hurdle Rate/i);
      await user.type(hurdleInput, '15');

      const minInvestmentInput = await screen.findByLabelText(/Minimum Investment/i);
      await user.type(minInvestmentInput, '500000');

      const submitButton = screen.getByRole('button', { name: /Create SPV/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invite co-investors/i)).toBeInTheDocument();
      });
    });

    it('should mention allocation status tracking', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          id: 'spv-1',
          spv_name: 'TechStartup SPV 2026',
        },
      });

      renderWithProviders(<CreateSPV />);

      // Fill form
      const nameInput = await screen.findByLabelText(/SPV Name/i);
      await user.type(nameInput, 'TechStartup SPV 2026');

      const dealSelect = await screen.findByLabelText(/Select Deal/i);
      await user.click(dealSelect);
      const dealOption = await screen.findByText('TechStartup India');
      await user.click(dealOption);

      const amountInput = await screen.findByLabelText(/Target Raise Amount/i);
      await user.type(amountInput, '10000000');

      const carryInput = await screen.findByLabelText(/Carry Percentage/i);
      await user.type(carryInput, '20');

      const hurdleInput = await screen.findByLabelText(/Hurdle Rate/i);
      await user.type(hurdleInput, '15');

      const minInvestmentInput = await screen.findByLabelText(/Minimum Investment/i);
      await user.type(minInvestmentInput, '500000');

      const submitButton = screen.getByRole('button', { name: /Create SPV/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/track allocation status/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading deals fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to load deals'));

      renderWithProviders(<CreateSPV />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading deals/i)).toBeInTheDocument();
      });
    });

    it('should handle SPV creation error gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDeals });
      vi.mocked(apiClient.post).mockRejectedValue(new Error('SPV creation failed'));

      renderWithProviders(<CreateSPV />);

      // Fill form
      const nameInput = await screen.findByLabelText(/SPV Name/i);
      await user.type(nameInput, 'TechStartup SPV 2026');

      const dealSelect = await screen.findByLabelText(/Select Deal/i);
      await user.click(dealSelect);
      const dealOption = await screen.findByText('TechStartup India');
      await user.click(dealOption);

      const amountInput = await screen.findByLabelText(/Target Raise Amount/i);
      await user.type(amountInput, '10000000');

      const carryInput = await screen.findByLabelText(/Carry Percentage/i);
      await user.type(carryInput, '20');

      const hurdleInput = await screen.findByLabelText(/Hurdle Rate/i);
      await user.type(hurdleInput, '15');

      const minInvestmentInput = await screen.findByLabelText(/Minimum Investment/i);
      await user.type(minInvestmentInput, '500000');

      const submitButton = screen.getByRole('button', { name: /Create SPV/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to create SPV/i)).toBeInTheDocument();
      });
    });
  });
});
