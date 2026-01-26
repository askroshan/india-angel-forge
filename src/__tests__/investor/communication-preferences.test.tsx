import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CommunicationPreferences from '@/pages/investor/CommunicationPreferences';
import * as apiClient from '@/api/client';

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
    (apiClient.apiClient.get as any).mockResolvedValue({ data: mockPreferences });
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

      expect(screen.getByText('Communication Preferences')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText(/new deal/i)).toBeInTheDocument();
        expect(screen.getByText(/portfolio updates/i)).toBeInTheDocument();
      });
    });

    it('should display error when loading preferences fails', async () => {
      (apiClient.apiClient.get as any).mockRejectedValueOnce(new Error('Failed to load'));

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
        expect(screen.getByText(/new deal/i)).toBeInTheDocument();
      });

      // Check for email and in-app toggles
      const emailLabel = screen.getByText(/email.*new deal|new deal.*email/i);
      const inAppLabel = screen.getByText(/in-app.*new deal|new deal.*in-app/i);
      
      expect(emailLabel).toBeInTheDocument();
      expect(inAppLabel).toBeInTheDocument();
    });

    it('should allow toggling new deal email notifications', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.put as any).mockResolvedValueOnce({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/new deal/i)).toBeInTheDocument();
      });

      // Find email toggle for new deals and click it
      const emailToggles = screen.getAllByRole('checkbox');
      await user.click(emailToggles[0]); // First checkbox for new deal email

      await waitFor(() => {
        expect(apiClient.apiClient.put).toHaveBeenCalledWith(
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
        expect(screen.getByText(/portfolio updates/i)).toBeInTheDocument();
      });

      // Should show frequency selector
      expect(screen.getByText(/frequency/i)).toBeInTheDocument();
    });

    it('should allow changing portfolio update frequency', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.put as any).mockResolvedValueOnce({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/portfolio updates/i)).toBeInTheDocument();
      });

      // Find and click frequency dropdown
      const frequencyButton = screen.getByRole('combobox', { name: /frequency|portfolio.*frequency/i });
      await user.click(frequencyButton);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /daily/i })).toBeInTheDocument();
      });

      const dailyOption = screen.getByRole('option', { name: /daily/i });
      await user.click(dailyOption);

      await waitFor(() => {
        expect(apiClient.apiClient.put).toHaveBeenCalled();
      });
    });
  });

  describe('Message Notifications', () => {
    it('should display message notification settings', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/message.*notification/i)).toBeInTheDocument();
      });
    });

    it('should allow toggling message notifications', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.put as any).mockResolvedValueOnce({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/message.*notification/i)).toBeInTheDocument();
      });

      const toggles = screen.getAllByRole('checkbox');
      // Find message notification toggle (index depends on layout)
      await user.click(toggles[4]);

      await waitFor(() => {
        expect(apiClient.apiClient.put).toHaveBeenCalled();
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
      
      (apiClient.apiClient.put as any).mockResolvedValueOnce({ data: { success: true } });

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
        expect(apiClient.apiClient.put).toHaveBeenCalled();
      });
    });
  });

  describe('Digest Emails', () => {
    it('should display digest email settings', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/digest.*email/i)).toBeInTheDocument();
      });
    });

    it('should allow enabling/disabling digest emails', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.put as any).mockResolvedValueOnce({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/digest.*email/i)).toBeInTheDocument();
      });

      const digestToggle = screen.getAllByRole('checkbox').find(
        cb => cb.getAttribute('name')?.includes('digest') || 
              cb.closest('div')?.textContent?.toLowerCase().includes('digest')
      );
      
      if (digestToggle) {
        await user.click(digestToggle);

        await waitFor(() => {
          expect(apiClient.apiClient.put).toHaveBeenCalled();
        });
      }
    });

    it('should allow changing digest frequency', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.put as any).mockResolvedValueOnce({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/digest.*email/i)).toBeInTheDocument();
      });

      // Find digest frequency dropdown
      const frequencyDropdowns = screen.getAllByRole('combobox');
      const digestFrequency = frequencyDropdowns.find(
        dd => dd.getAttribute('name')?.includes('digest')
      ) || frequencyDropdowns[frequencyDropdowns.length - 1];

      await user.click(digestFrequency);

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThan(0);
      });
    });
  });
});
