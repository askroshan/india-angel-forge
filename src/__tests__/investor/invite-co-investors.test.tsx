import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import InviteCoInvestors from '@/pages/investor/InviteCoInvestors';

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

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

vi.mock('react-router-dom', () => ({
  useParams: () => ({ spvId: 'spv-1' }),
  useNavigate: () => vi.fn(),
}));

const mockSPV = {
  id: 'spv-1',
  spv_name: 'TechStartup SPV 2026',
  deal_id: 'deal-1',
  lead_investor_id: 'investor-1',
  target_raise_amount: 10000000,
  carry_percentage: 20,
  minimum_investment: 500000,
  status: 'OPEN',
  current_commitments: 2500000,
  deal: {
    company_name: 'TechStartup India',
    sector: 'Technology',
  },
};

const mockMembers = [
  {
    id: 'member-1',
    spv_id: 'spv-1',
    investor_id: 'investor-2',
    commitment_amount: 1000000,
    status: 'COMMITTED',
    joined_at: '2026-01-15T10:00:00Z',
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
    invited_at: '2026-01-18T14:00:00Z',
    investor: {
      full_name: 'Priya Sharma',
      email: 'priya@example.com',
    },
  },
];

describe('US-INVESTOR-008: Invite Co-Investors', () => {
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
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve([]);
        return Promise.resolve([]);
      });

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText(/Invite Co-Investors/i)).toBeInTheDocument();
      });
    });

    it('should display SPV details', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve([]);
        return Promise.resolve([]);
      });

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup SPV 2026')).toBeInTheDocument();
      });
    });
  });

  describe('Send Invitations', () => {
    it('should display invitation form', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve([]);
        return Promise.resolve([]);
      });

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Investor Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Commitment Deadline/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve([]);
        return Promise.resolve([]);
      });
      const postMock = vi.mocked(apiClient.post).mockResolvedValue({
        data: null,
        error: null,
      });

      renderWithProviders(<InviteCoInvestors />);

      const emailInput = await screen.findByLabelText(/Investor Email/i);
      // Use clear first, then type an invalid email
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');
      const deadlineInput = await screen.findByLabelText(/Commitment Deadline/i);
      fireEvent.change(deadlineInput, { target: { value: '2026-02-15' } });
      const submitButton = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(submitButton);

      // The post should not have been called because HTML5 validation prevents submission
      // or the form validation prevents it
      expect(postMock).not.toHaveBeenCalled();
    });

    it('should send invitation successfully', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve([]);
        return Promise.resolve([]);
      });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          id: 'invitation-1',
          spv_id: 'spv-1',
          investor_email: 'investor@example.com',
          status: 'PENDING',
        },
        error: null,
      });

      renderWithProviders(<InviteCoInvestors />);

      const emailInput = await screen.findByLabelText(/Investor Email/i);
      await user.type(emailInput, 'investor@example.com');
      const deadlineInput = await screen.findByLabelText(/Commitment Deadline/i);
      fireEvent.change(deadlineInput, { target: { value: '2026-02-15' } });
      const submitButton = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/api/spv-invitations', {
          spv_id: 'spv-1',
          investor_email: 'investor@example.com',
          commitment_deadline: '2026-02-15',
        });
      });
    });
  });

  describe('Member List', () => {
    it('should display existing SPV members', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      });
    });

    it('should display commitment status for each member', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText(/COMMITTED/i)).toBeInTheDocument();
        expect(screen.getAllByText(/PENDING/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading SPV fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to load SPV'));

      renderWithProviders(<InviteCoInvestors />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading SPV details/i)).toBeInTheDocument();
      });
    });

    it('should handle invitation error gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve([]);
        return Promise.resolve([]);
      });
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Invitation failed'));

      renderWithProviders(<InviteCoInvestors />);

      const emailInput = await screen.findByLabelText(/Investor Email/i);
      await user.type(emailInput, 'investor@example.com');
      const deadlineInput = await screen.findByLabelText(/Commitment Deadline/i);
      fireEvent.change(deadlineInput, { target: { value: '2026-02-15' } });
      const submitButton = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalled();
      });
    });
  });
});
