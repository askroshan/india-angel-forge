import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import InviteCoInvestors from '@/pages/investor/InviteCoInvestors';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'investor-1',
      email: 'lead@example.com',
      role: 'INVESTOR',
    },
    isAuthenticated: true,
  }),
}));

// Mock router params
vi.mock('react-router-dom', () => ({
  useParams: () => ({ spvId: 'spv-1' }),
  useNavigate: () => vi.fn(),
}));

// Mock SPV data
const mockSPV = {
  id: 'spv-1',
  spv_name: 'TechStartup SPV 2026',
  deal_id: 'deal-1',
  lead_investor_id: 'investor-1',
  target_raise_amount: 10000000,
  carry_percentage: 20,
  minimum_investment: 500000,
  status: 'OPEN',
  current_commitments: 2000000,
  deal: {
    company_name: 'TechStartup India',
    sector: 'Technology',
  },
};

// Mock existing members
const mockMembers = [
  {
    id: 'member-1',
    spv_id: 'spv-1',
    investor_id: 'investor-2',
    commitment_amount: 1000000,
    status: 'COMMITTED',
    joined_at: '2026-01-20T10:00:00Z',
    investor: {
      full_name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
    },
  },
  {
    id: 'member-2',
    spv_id: 'spv-1',
    investor_id: 'investor-3',
    commitment_amount: 1000000,
    status: 'PENDING',
    invited_at: '2026-01-24T14:00:00Z',
    investor: {
      full_name: 'Priya Sharma',
      email: 'priya@example.com',
    },
  },
];

describe('US-INVESTOR-009: Invite Co-Investors to SPV', () => {
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
    it('should display invite co-investors page', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: mockSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText(/Invite Co-Investors/i)).toBeInTheDocument();
      });
    });

    it('should display SPV details', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: mockSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup SPV 2026')).toBeInTheDocument();
        expect(screen.getByText(/TechStartup India/i)).toBeInTheDocument();
      });
    });

    it('should display current commitment progress', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: mockSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText(/₹20.0 Lac/i)).toBeInTheDocument();
        expect(screen.getByText(/₹1.0 Cr/i)).toBeInTheDocument();
      });
    });
  });

  describe('Invite Form', () => {
    it('should display invite form with email input', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: mockSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Investor Email/i)).toBeInTheDocument();
      });
    });

    it('should allow entering investor email', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: mockSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      renderWithProviders(<InviteCoInvestors />);

      const emailInput = await screen.findByLabelText(/Investor Email/i);
      await user.type(emailInput, 'investor@example.com');

      expect(emailInput).toHaveValue('investor@example.com');
    });

    it('should allow setting commitment deadline', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: mockSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      renderWithProviders(<InviteCoInvestors />);

      const deadlineInput = await screen.findByLabelText(/Commitment Deadline/i);
      await user.type(deadlineInput, '2026-02-15');

      expect(deadlineInput).toHaveValue('2026-02-15');
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: mockSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });

      renderWithProviders(<InviteCoInvestors />);

      const emailInput = await screen.findByLabelText(/Investor Email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Send Invitations', () => {
    it('should send invitation successfully', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: mockSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          id: 'invitation-1',
          spv_id: 'spv-1',
          investor_email: 'investor@example.com',
          status: 'PENDING',
        },
      });

      renderWithProviders(<InviteCoInvestors />);

      const emailInput = await screen.findByLabelText(/Investor Email/i);
      await user.type(emailInput, 'investor@example.com');

      const submitButton = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/api/spv-invitations', {
          spv_id: 'spv-1',
          investor_email: 'investor@example.com',
          commitment_deadline: expect.any(String),
        });
      });
    });

    it('should show success message after sending invitation', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: mockSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          id: 'invitation-1',
          spv_id: 'spv-1',
          investor_email: 'investor@example.com',
        },
      });

      renderWithProviders(<InviteCoInvestors />);

      const emailInput = await screen.findByLabelText(/Investor Email/i);
      await user.type(emailInput, 'investor@example.com');

      const submitButton = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invitation sent successfully/i)).toBeInTheDocument();
      });
    });

    it('should mention SPV details are included in invitation', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: mockSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { id: 'invitation-1' },
      });

      renderWithProviders(<InviteCoInvestors />);

      const emailInput = await screen.findByLabelText(/Investor Email/i);
      await user.type(emailInput, 'investor@example.com');

      const submitButton = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Investor will receive email with SPV details/i)).toBeInTheDocument();
      });
    });
  });

  describe('Member List', () => {
    it('should display list of existing members', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: mockSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: mockMembers });
        return Promise.resolve({ data: [] });
      });

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      });
    });

    it('should display commitment status for each member', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: mockSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: mockMembers });
        return Promise.resolve({ data: [] });
      });

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText(/COMMITTED/i)).toBeInTheDocument();
        expect(screen.getByText(/PENDING/i)).toBeInTheDocument();
      });
    });

    it('should display commitment amounts', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: mockSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: mockMembers });
        return Promise.resolve({ data: [] });
      });

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        const amounts = screen.getAllByText(/₹10.0 Lac/i);
        expect(amounts.length).toBeGreaterThan(0);
      });
    });

    it('should allow adjusting allocations if oversubscribed', async () => {
      const oversubscribedSPV = {
        ...mockSPV,
        current_commitments: 12000000, // More than target
      };

      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: oversubscribedSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: mockMembers });
        return Promise.resolve({ data: [] });
      });

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText(/Oversubscribed/i)).toBeInTheDocument();
        expect(screen.getByText(/Adjust Allocations/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading SPV fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to load SPV'));

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading SPV/i)).toBeInTheDocument();
      });
    });

    it('should handle invitation error gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve({ data: mockSPV });
        if (url === '/api/spvs/spv-1/members') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: [] });
      });
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Invitation failed'));

      renderWithProviders(<InviteCoInvestors />);

      const emailInput = await screen.findByLabelText(/Investor Email/i);
      await user.type(emailInput, 'investor@example.com');

      const submitButton = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to send invitation/i)).toBeInTheDocument();
      });
    });
  });
});
