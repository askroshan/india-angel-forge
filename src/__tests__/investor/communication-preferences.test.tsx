import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CommunicationPreferences from '@/pages/investor/CommunicationPreferences';
import { apiClient } from '@/api/client';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

// Mock AuthContext
const mockUser = {
  id: 'user-1',
  email: 'investor@example.com',
  role: 'investor',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
}));

// Mock data
const mockPreferences = {
  new_deal_notifications: {
    email: true,
    in_app: true,
  },
  portfolio_updates: {
    frequency: 'weekly', // daily, weekly, monthly
    email: true,
    in_app: true,
  },
  message_notifications: {
    email: true,
    in_app: true,
  },
  event_reminders: {
    email: true,
    in_app: true,
    reminder_hours: 24, // hours before event
  },
  digest_emails: {
    enabled: true,
    frequency: 'weekly', // daily, weekly, never
  },
};

describe('US-INVESTOR-016: Set Communication Preferences', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    // Default mock implementation
    vi.mocked(apiClient.get).mockResolvedValue(mockPreferences);
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CommunicationPreferences />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('Page Display', () => {
    it('should display communication preferences page', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Communication Preferences')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText('New Deal Notifications')).toBeInTheDocument();
        expect(screen.getByText('Portfolio Updates')).toBeInTheDocument();
      });
    });

    it('should display error when loading preferences fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Failed to load'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/error.*loading|failed to load/i)).toBeInTheDocument();
      });
    });
  });

  describe('New Deal Notifications', () => {
    it('should display new deal notification settings', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('New Deal Notifications')).toBeInTheDocument();
      });

      // Check for email and in-app toggles using label text
      expect(screen.getByText('Email notifications for new deals')).toBeInTheDocument();
      expect(screen.getByText('In-app notifications for new deals')).toBeInTheDocument();
    });

    it('should allow toggling new deal email notifications', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { success: true }, error: null });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('New Deal Notifications')).toBeInTheDocument();
      });

      // Find email toggle using id
      const emailToggle = screen.getByRole('switch', { name: /email notifications for new deals/i });
      await user.click(emailToggle);

      // Click save button to trigger API call
      const saveButton = screen.getByRole('button', { name: /save preferences/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith(
          '/api/preferences',
          expect.objectContaining({
            new_deal_notifications: expect.any(Object),
          })
        );
      });
    });
  });

  describe('Portfolio Updates', () => {
    it('should display portfolio update frequency options', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Portfolio Updates')).toBeInTheDocument();
      });

      // Should show frequency label (lowercase 'f')
      await waitFor(() => {
        expect(screen.getByText('Update frequency')).toBeInTheDocument();
      });
    });

    it('should allow changing portfolio update frequency', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { success: true }, error: null });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Portfolio Updates')).toBeInTheDocument();
      });

      // Find and click frequency dropdown using label
      const frequencySelect = screen.getByRole('combobox', { name: /update frequency/i });
      await user.click(frequencySelect);

      await waitFor(() => {
        const dailyOption = screen.getByRole('option', { name: /daily/i });
        expect(dailyOption).toBeInTheDocument();
      });

      const dailyOption = screen.getByRole('option', { name: /daily/i });
      await user.click(dailyOption);

      // Click save button
      const saveButton = screen.getByRole('button', { name: /save preferences/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalled();
      });
    });
  });

  describe('Message Notifications', () => {
    it('should display message notification settings', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Message Notifications')).toBeInTheDocument();
      });
    });

    it('should allow toggling message notifications', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { success: true }, error: null });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Message Notifications')).toBeInTheDocument();
      });

      // Find all switches and click one of them
      const switches = screen.getAllByRole('switch');
      // Message notification switches should be after the first two (new deal email/inapp)
      await user.click(switches[2]);

      // Click save button
      const saveButton = screen.getByRole('button', { name: /save preferences/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalled();
      });
    });
  });

  describe('Event Reminders', () => {
    it('should display event reminder settings', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/event.*reminder/i)).toBeInTheDocument();
      });

      // Should show reminder hours
      expect(screen.getByText(/hours.*before|reminder.*hours/i)).toBeInTheDocument();
    });

    it('should allow changing reminder hours', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { success: true }, error: null });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/event.*reminder/i)).toBeInTheDocument();
      });

      // Find reminder hours input
      const hoursInput = screen.getByRole('spinbutton', { name: /hours/i });
      await user.clear(hoursInput);
      await user.type(hoursInput, '48');

      // Trigger save (could be auto-save or explicit button)
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalled();
      });
    });
  });

  describe('Digest Emails', () => {
    it('should display digest email settings', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Digest Emails')).toBeInTheDocument();
      });
    });

    it('should allow enabling/disabling digest emails', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { success: true }, error: null });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Digest Emails')).toBeInTheDocument();
      });

      // Find digest toggle by label
      const digestToggle = screen.getByRole('switch', { name: /enable digest emails/i });
      await user.click(digestToggle);

      // Click save button
      const saveButton = screen.getByRole('button', { name: /save preferences/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalled();
      });
    });

    it('should allow changing digest frequency', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { success: true }, error: null });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Digest Emails')).toBeInTheDocument();
      });

      // Find digest frequency dropdown
      const frequencySelects = screen.getAllByRole('combobox');
      // Digest frequency should be the last select
      await user.click(frequencySelects[frequencySelects.length - 1]);

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThan(0);
      });
    });
  });
});
