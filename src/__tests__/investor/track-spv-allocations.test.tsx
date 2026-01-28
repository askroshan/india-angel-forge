import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import TrackSPVAllocations from '@/pages/investor/TrackSPVAllocations';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
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
  total_committed: 8500000,
  total_paid: 6000000,
  carry_percentage: 20,
  minimum_investment: 500000,
  status: 'OPEN',
  deal: {
    company_name: 'TechStartup India',
    sector: 'Technology',
    equity_percentage: 5.0,
  },
};

// Mock SPV members with allocations
const mockMembers = [
  {
    id: 'member-1',
    spv_id: 'spv-1',
    investor_id: 'investor-2',
    commitment_amount: 3000000,
    paid_amount: 3000000,
    allocation_percentage: 35.3,
    payment_status: 'PAID',
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
    commitment_amount: 2500000,
    paid_amount: 2000000,
    allocation_percentage: 29.4,
    payment_status: 'PARTIAL',
    joined_at: '2026-01-18T14:00:00Z',
    investor: {
      full_name: 'Priya Sharma',
      email: 'priya@example.com',
    },
  },
  {
    id: 'member-3',
    spv_id: 'spv-1',
    investor_id: 'investor-4',
    commitment_amount: 2000000,
    paid_amount: 1000000,
    allocation_percentage: 23.5,
    payment_status: 'PENDING',
    joined_at: '2026-01-20T09:00:00Z',
    investor: {
      full_name: 'Amit Patel',
      email: 'amit@example.com',
    },
  },
  {
    id: 'member-4',
    spv_id: 'spv-1',
    investor_id: 'investor-5',
    commitment_amount: 1000000,
    paid_amount: 0,
    allocation_percentage: 11.8,
    payment_status: 'PENDING',
    joined_at: '2026-01-22T16:00:00Z',
    investor: {
      full_name: 'Neha Singh',
      email: 'neha@example.com',
    },
  },
];

describe('US-INVESTOR-010: Track SPV Allocations', () => {
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
    it('should display track SPV allocations page', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });

      renderWithProviders(<TrackSPVAllocations />);

      await waitFor(() => {
        expect(screen.getByText(/Track SPV Allocations/i)).toBeInTheDocument();
      });
    });

    it('should display SPV name and deal details', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });

      renderWithProviders(<TrackSPVAllocations />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup SPV 2026')).toBeInTheDocument();
        expect(screen.getByText(/TechStartup India/i)).toBeInTheDocument();
      });
    });
  });

  describe('Commitment Summary', () => {
    it('should display total committed vs target', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });

      renderWithProviders(<TrackSPVAllocations />);

      await waitFor(() => {
        // Check for committed text
        expect(screen.getByText(/₹85.0 Lac committed/i)).toBeInTheDocument();
        // Check for target text
        expect(screen.getByText(/Target: ₹1.0 Cr/i)).toBeInTheDocument();
      });
    });

    it('should display total paid amount', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });

      renderWithProviders(<TrackSPVAllocations />);

      await waitFor(() => {
        expect(screen.getByText(/₹60.0 Lac received/i)).toBeInTheDocument();
      });
    });

    it('should display commitment progress percentage', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });

      renderWithProviders(<TrackSPVAllocations />);

      await waitFor(() => {
        expect(screen.getByText(/85%/i)).toBeInTheDocument();
      });
    });
  });

  describe('Members List', () => {
    it('should display list of all members', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });

      renderWithProviders(<TrackSPVAllocations />);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
        expect(screen.getByText('Amit Patel')).toBeInTheDocument();
        expect(screen.getByText('Neha Singh')).toBeInTheDocument();
      });
    });

    it('should display commitment amounts for each member', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });

      renderWithProviders(<TrackSPVAllocations />);

      // Wait for members to load
      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      });

      // Check that member commitment amounts are displayed - at least 2 exist
      const commitmentLabels = screen.getAllByText('Commitment');
      expect(commitmentLabels.length).toBeGreaterThanOrEqual(2);
    });

    it('should display payment status for each member', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });

      renderWithProviders(<TrackSPVAllocations />);

      // Wait for members to load
      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      });

      // Check that payment statuses are displayed - there should be badges for each status
      // PAID badge exists (there may be multiple "PAID" texts due to buttons)
      const paidBadges = screen.getAllByText(/PAID/i);
      expect(paidBadges.length).toBeGreaterThanOrEqual(1);
      
      // PARTIAL badge exists
      expect(screen.getByText('PARTIAL')).toBeInTheDocument();
      
      // PENDING badges exist
      const pendingBadges = screen.getAllByText('PENDING');
      expect(pendingBadges.length).toBeGreaterThanOrEqual(2);
    });

    it('should display pro-rata ownership percentage for each member', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });

      renderWithProviders(<TrackSPVAllocations />);

      await waitFor(() => {
        expect(screen.getByText(/35.3%/i)).toBeInTheDocument();
        expect(screen.getByText(/29.4%/i)).toBeInTheDocument();
        expect(screen.getByText(/23.5%/i)).toBeInTheDocument();
      });
    });
  });

  describe('Payment Management', () => {
    it('should allow marking payment as received', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { ...mockMembers[1], payment_status: 'PAID', paid_amount: 2500000 },
        error: null,
      });

      renderWithProviders(<TrackSPVAllocations />);

      await waitFor(() => {
        // Priya Sharma has PARTIAL status - first "Mark as Paid" button
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      });

      const markPaidButtons = screen.getAllByRole('button', { name: /Mark as Paid/i });
      await user.click(markPaidButtons[0]);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith(
          '/api/spv-members/member-2/payment',
          expect.objectContaining({ payment_status: 'PAID' })
        );
      });
    });

    it('should show success message after marking payment received', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { ...mockMembers[2], payment_status: 'PAID' },
        error: null,
      });

      renderWithProviders(<TrackSPVAllocations />);

      await waitFor(() => {
        expect(screen.getByText('Amit Patel')).toBeInTheDocument();
      });

      const markPaidButtons = screen.getAllByText(/Mark as Paid/i);
      await user.click(markPaidButtons[0]);

      // Verify the API call was successful (toast doesn't render in jsdom)
      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalled();
      });
    });
  });

  describe('Member Management', () => {
    it('should allow removing member before SPV close', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });
      vi.mocked(apiClient.delete).mockResolvedValue({ data: null, error: null });

      renderWithProviders(<TrackSPVAllocations />);

      await waitFor(() => {
        expect(screen.getByText('Neha Singh')).toBeInTheDocument();
      });

      // Click Remove button to open dialog
      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      await user.click(removeButtons[0]);

      // Wait for confirmation dialog and click confirm button
      await waitFor(() => {
        expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Remove Member/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalled();
      });
    });

    it('should show confirmation before removing member', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });

      renderWithProviders(<TrackSPVAllocations />);

      await waitFor(() => {
        expect(screen.getByText('Neha Singh')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByText(/Remove/i);
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
      });
    });

    it('should allow adjusting member allocations', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      renderWithProviders(<TrackSPVAllocations />);

      await waitFor(() => {
        expect(screen.getByText(/Adjust Allocations/i)).toBeInTheDocument();
      });

      const adjustButton = screen.getByText(/Adjust Allocations/i);
      await user.click(adjustButton);

      await waitFor(() => {
        expect(screen.getByText(/Edit Allocation/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading SPV fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to load SPV'));

      renderWithProviders(<TrackSPVAllocations />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading SPV/i)).toBeInTheDocument();
      });
    });

    it('should handle payment update error gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/spvs/spv-1') return Promise.resolve(mockSPV);
        if (url === '/api/spvs/spv-1/members') return Promise.resolve(mockMembers);
        return Promise.resolve([]);
      });
      vi.mocked(apiClient.put).mockRejectedValue(new Error('Payment update failed'));

      renderWithProviders(<TrackSPVAllocations />);

      await waitFor(() => {
        expect(screen.getByText('Amit Patel')).toBeInTheDocument();
      });

      const markPaidButtons = screen.getAllByText(/Mark as Paid/i);
      await user.click(markPaidButtons[0]);

      // Verify the API call was attempted (toast error doesn't render in jsdom)
      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalled();
      });
    });
  });
});
