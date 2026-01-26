import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SchedulePitch from '@/pages/founder/SchedulePitch';
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
      id: 'founder-1',
      email: 'founder@test.com',
      role: 'founder',
      status: 'approved'
    },
    isAuthenticated: true
  })
}));

const mockInterestedInvestors = [
  {
    id: 'investor-1',
    full_name: 'Rajesh Kumar',
    email: 'rajesh@test.com',
    deal_interest: {
      id: 'interest-1',
      investment_amount: 1000000,
      status: 'interested',
      created_at: '2026-01-20T10:00:00Z'
    }
  },
  {
    id: 'investor-2',
    full_name: 'Priya Sharma',
    email: 'priya@test.com',
    deal_interest: {
      id: 'interest-2',
      investment_amount: 2000000,
      status: 'interested',
      created_at: '2026-01-22T10:00:00Z'
    }
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

describe('US-FOUNDER-004: Schedule Pitch Sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Display', () => {
    it('should display schedule pitch sessions page', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInterestedInvestors });

      renderWithProviders(<SchedulePitch />);

      await waitFor(() => {
        expect(screen.getByText(/Schedule Pitch Sessions/i)).toBeInTheDocument();
      });
    });

    it('should display list of interested investors', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInterestedInvestors });

      renderWithProviders(<SchedulePitch />);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      });
    });

    it('should display investment amounts for each investor', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInterestedInvestors });

      renderWithProviders(<SchedulePitch />);

      await waitFor(() => {
        expect(screen.getByText(/₹10,00,000/i)).toBeInTheDocument();
        expect(screen.getByText(/₹20,00,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('Propose Meeting Times', () => {
    it('should display schedule meeting button for each investor', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInterestedInvestors });

      renderWithProviders(<SchedulePitch />);

      await waitFor(() => {
        const scheduleButtons = screen.getAllByRole('button', { name: /Schedule Meeting/i });
        expect(scheduleButtons.length).toBe(2);
      });
    });

    it('should open meeting dialog when schedule button clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInterestedInvestors });

      renderWithProviders(<SchedulePitch />);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText(/Schedule Meeting/i);
      await user.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/Meeting Date/i)).toBeInTheDocument();
      });
    });

    it('should allow entering meeting date and time', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInterestedInvestors });

      renderWithProviders(<SchedulePitch />);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText(/Schedule Meeting/i);
      await user.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/Meeting Date/i)).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/Meeting Date/i);
      await user.type(dateInput, '2026-02-01');

      expect(dateInput).toHaveValue('2026-02-01');
    });

    it('should allow entering pitch deck link', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInterestedInvestors });

      renderWithProviders(<SchedulePitch />);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText(/Schedule Meeting/i);
      await user.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/Pitch Deck Link/i)).toBeInTheDocument();
      });

      const deckInput = screen.getByLabelText(/Pitch Deck Link/i);
      await user.type(deckInput, 'https://example.com/pitch-deck.pdf');

      expect(deckInput).toHaveValue('https://example.com/pitch-deck.pdf');
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInterestedInvestors });

      renderWithProviders(<SchedulePitch />);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText(/Schedule Meeting/i);
      await user.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Send Invitation/i })).toBeInTheDocument();
      });

      const sendButton = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Meeting date is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Submit Meeting Invitation', () => {
    it('should submit meeting invitation successfully', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInterestedInvestors });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          id: 'session-1',
          investor_id: 'investor-1',
          founder_id: 'founder-1',
          meeting_date: '2026-02-01T14:00:00Z',
          status: 'pending'
        }
      });

      renderWithProviders(<SchedulePitch />);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText(/Schedule Meeting/i);
      await user.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/Meeting Date/i)).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/Meeting Date/i);
      await user.type(dateInput, '2026-02-01T14:00');

      const sendButton = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/api/pitch-sessions', expect.objectContaining({
          investor_id: 'investor-1',
          meeting_date: expect.any(String)
        }));
      });
    });

    it('should show success message after sending invitation', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInterestedInvestors });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          id: 'session-1',
          investor_id: 'investor-1',
          founder_id: 'founder-1',
          meeting_date: '2026-02-01T14:00:00Z',
          status: 'pending'
        }
      });

      renderWithProviders(<SchedulePitch />);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText(/Schedule Meeting/i);
      await user.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/Meeting Date/i)).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/Meeting Date/i);
      await user.type(dateInput, '2026-02-01T14:00');

      const sendButton = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Meeting invitation sent successfully/i)).toBeInTheDocument();
      });
    });

    it('should mention investor can accept or decline', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInterestedInvestors });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          id: 'session-1',
          investor_id: 'investor-1',
          founder_id: 'founder-1',
          meeting_date: '2026-02-01T14:00:00Z',
          status: 'pending'
        }
      });

      renderWithProviders(<SchedulePitch />);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText(/Schedule Meeting/i);
      await user.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/Meeting Date/i)).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/Meeting Date/i);
      await user.type(dateInput, '2026-02-01T14:00');

      const sendButton = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Investor will receive invitation to accept or decline/i)).toBeInTheDocument();
      });
    });

    it('should mention automated reminders will be sent', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInterestedInvestors });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          id: 'session-1',
          investor_id: 'investor-1',
          founder_id: 'founder-1',
          meeting_date: '2026-02-01T14:00:00Z',
          status: 'pending',
          reminder_scheduled: true
        }
      });

      renderWithProviders(<SchedulePitch />);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText(/Schedule Meeting/i);
      await user.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/Meeting Date/i)).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/Meeting Date/i);
      await user.type(dateInput, '2026-02-01T14:00');

      const sendButton = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Automated reminders will be sent/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to load investors'));

      renderWithProviders(<SchedulePitch />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading interested investors/i)).toBeInTheDocument();
      });
    });

    it('should handle submission error gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockInterestedInvestors });
      vi.mocked(apiClient.post).mockRejectedValue({
        response: { data: { message: 'Failed to schedule meeting' } }
      });

      renderWithProviders(<SchedulePitch />);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText(/Schedule Meeting/i);
      await user.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/Meeting Date/i)).toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText(/Meeting Date/i);
      await user.type(dateInput, '2026-02-01T14:00');

      const sendButton = screen.getByRole('button', { name: /Send Invitation/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to schedule meeting/i)).toBeInTheDocument();
      });
    });
  });
});
