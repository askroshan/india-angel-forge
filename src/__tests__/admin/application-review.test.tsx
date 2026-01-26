import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ApplicationReview from '@/pages/admin/ApplicationReview';
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
      id: 'admin-1',
      email: 'admin@indiaangelforum.com',
      role: 'admin'
    },
    isAuthenticated: true
  })
}));

const mockInvestorApplications = [
  {
    id: 'inv-app-1',
    user_id: 'user-1',
    application_type: 'investor',
    status: 'pending',
    full_name: 'Amit Verma',
    email: 'amit@example.com',
    phone: '+91-9876543210',
    investment_capacity: 5000000,
    investment_experience: 'angel_investor',
    linkedin_url: 'https://linkedin.com/in/amitverma',
    submitted_at: '2026-01-20T10:00:00Z'
  },
  {
    id: 'inv-app-2',
    user_id: 'user-2',
    application_type: 'investor',
    status: 'pending',
    full_name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91-9876543211',
    investment_capacity: 10000000,
    investment_experience: 'vc_fund',
    linkedin_url: 'https://linkedin.com/in/priyasharma',
    submitted_at: '2026-01-21T11:00:00Z'
  }
];

const mockFounderApplications = [
  {
    id: 'founder-app-1',
    user_id: 'user-3',
    application_type: 'founder',
    status: 'pending',
    full_name: 'Rahul Gupta',
    email: 'rahul@startup.com',
    phone: '+91-9876543212',
    company_name: 'TechStartup Inc',
    company_stage: 'seed',
    funding_amount: 2000000,
    pitch_deck_url: 'https://example.com/deck.pdf',
    submitted_at: '2026-01-22T09:00:00Z'
  },
  {
    id: 'founder-app-2',
    user_id: 'user-4',
    application_type: 'founder',
    status: 'pending',
    full_name: 'Neha Patel',
    email: 'neha@innovate.com',
    phone: '+91-9876543213',
    company_name: 'Innovate Solutions',
    company_stage: 'pre_seed',
    funding_amount: 1000000,
    pitch_deck_url: 'https://example.com/deck2.pdf',
    submitted_at: '2026-01-23T14:00:00Z'
  }
];

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

describe('US-ADMIN-004: Application Review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Access', () => {
    it('should display application review dashboard for admins', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText(/Application Review/i)).toBeInTheDocument();
      });
    });

    it('should display page description', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText(/Review and approve member applications/i)).toBeInTheDocument();
      });
    });
  });

  describe('Display Applications', () => {
    it('should display investor applications', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      });
    });

    it('should display founder applications', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFounderApplications);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Rahul Gupta')).toBeInTheDocument();
        expect(screen.getByText('Neha Patel')).toBeInTheDocument();
      });
    });

    it('should display application type badges', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([...mockInvestorApplications, ...mockFounderApplications]);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getAllByText('Investor').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Founder').length).toBeGreaterThan(0);
      });
    });

    it('should display investment capacity for investor applications', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText(/₹50,00,000/)).toBeInTheDocument();
        expect(screen.getByText(/₹1,00,00,000/)).toBeInTheDocument();
      });
    });

    it('should display company name for founder applications', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFounderApplications);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup Inc')).toBeInTheDocument();
        expect(screen.getByText('Innovate Solutions')).toBeInTheDocument();
      });
    });

    it('should display status badges', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
      });
    });

    it('should display empty state when no applications', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText(/No applications found/i)).toBeInTheDocument();
      });
    });
  });

  describe('View Application Details', () => {
    it('should open details dialog when viewing application', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText(/View Details/i);
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Application Details/i)).toBeInTheDocument();
      });
    });

    it('should display investor details in dialog', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText(/View Details/i);
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('amit@example.com')).toBeInTheDocument();
        expect(screen.getByText('+91-9876543210')).toBeInTheDocument();
      });
    });

    it('should display founder company details in dialog', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockFounderApplications);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Rahul Gupta')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText(/View Details/i);
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('TechStartup Inc')).toBeInTheDocument();
        expect(screen.getByText(/seed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Approve Application', () => {
    it('should show approve button for pending applications', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        const approveButtons = screen.getAllByText(/Approve/i);
        expect(approveButtons.length).toBeGreaterThan(0);
      });
    });

    it('should call API when approving application', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);
      vi.mocked(apiClient.patch).mockResolvedValue({ success: true });

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByText(/Approve/i);
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(apiClient.patch).toHaveBeenCalledWith(
          '/api/admin/applications/inv-app-1/approve',
          expect.anything()
        );
      });
    });

    it('should display success message after approval', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);
      vi.mocked(apiClient.patch).mockResolvedValue({ success: true });

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByText(/Approve/i);
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/approved successfully/i)).toBeInTheDocument();
      });
    });

    it('should update user status to approved', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);
      vi.mocked(apiClient.patch).mockResolvedValue({ 
        success: true,
        user_status: 'approved'
      });

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByText(/Approve/i);
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(apiClient.patch).toHaveBeenCalled();
      });
    });

    it('should send approval email notification', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);
      vi.mocked(apiClient.patch).mockResolvedValue({ 
        success: true,
        email_sent: true
      });

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByText(/Approve/i);
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/email sent/i)).toBeInTheDocument();
      });
    });
  });

  describe('Reject Application', () => {
    it('should show reject button for pending applications', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        const rejectButtons = screen.getAllByText(/Reject/i);
        expect(rejectButtons.length).toBeGreaterThan(0);
      });
    });

    it('should open rejection dialog with reason field', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      const rejectButtons = screen.getAllByText(/Reject/i);
      await user.click(rejectButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Reject Application/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Rejection Reason/i)).toBeInTheDocument();
      });
    });

    it('should call API with rejection reason', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);
      vi.mocked(apiClient.patch).mockResolvedValue({ success: true });

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      const rejectButtons = screen.getAllByText(/Reject/i);
      await user.click(rejectButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/Rejection Reason/i)).toBeInTheDocument();
      });

      const reasonInput = screen.getByLabelText(/Rejection Reason/i);
      await user.type(reasonInput, 'Insufficient investment experience');

      const submitButton = screen.getByRole('button', { name: /Reject/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiClient.patch).toHaveBeenCalledWith(
          '/api/admin/applications/inv-app-1/reject',
          { reason: 'Insufficient investment experience' }
        );
      });
    });

    it('should send rejection notification with feedback', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);
      vi.mocked(apiClient.patch).mockResolvedValue({ 
        success: true,
        notification_sent: true
      });

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      const rejectButtons = screen.getAllByText(/Reject/i);
      await user.click(rejectButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/Rejection Reason/i)).toBeInTheDocument();
      });

      const reasonInput = screen.getByLabelText(/Rejection Reason/i);
      await user.type(reasonInput, 'Insufficient investment experience');

      const submitButton = screen.getByRole('button', { name: /Reject/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/notified/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filter Applications', () => {
    it('should display filter dropdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Filter by Type/i)).toBeInTheDocument();
      });
    });

    it('should filter by investor applications', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue([...mockInvestorApplications, ...mockFounderApplications]);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
        expect(screen.getByText('Rahul Gupta')).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText(/Filter by Type/i);
      await user.click(filterSelect);
      await user.click(screen.getByText('Investor Applications'));

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
        expect(screen.queryByText('Rahul Gupta')).not.toBeInTheDocument();
      });
    });

    it('should filter by founder applications', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue([...mockInvestorApplications, ...mockFounderApplications]);

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
        expect(screen.getByText('Rahul Gupta')).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText(/Filter by Type/i);
      await user.click(filterSelect);
      await user.click(screen.getByText('Founder Applications'));

      await waitFor(() => {
        expect(screen.getByText('Rahul Gupta')).toBeInTheDocument();
        expect(screen.queryByText('Amit Verma')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading applications/i)).toBeInTheDocument();
      });
    });

    it('should handle approval failures', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue(mockInvestorApplications);
      vi.mocked(apiClient.patch).mockRejectedValue(new Error('Approval failed'));

      renderWithProviders(<ApplicationReview />);

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      const approveButtons = screen.getAllByText(/Approve/i);
      await user.click(approveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Failed to approve/i)).toBeInTheDocument();
      });
    });
  });
});
