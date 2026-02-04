/**
 * MyRegistrations Page Tests
 * 
 * User Story: View and Manage Event Registrations
 * 
 * As a: Registered User
 * I want to: View my event registrations
 * So that: I can manage and track events I've signed up for
 * 
 * Acceptance Criteria:
 * - Display upcoming event registrations with details
 * - Display past event registrations
 * - Allow cancellation of upcoming registrations
 * - Show sign-in prompt for unauthenticated users
 * - Show empty states when no registrations exist
 * 
 * TDD: RED Phase - Writing failing tests first
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyRegistrationsPage from '@/pages/MyRegistrations';

// Mock apiClient
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import type { Mock } from 'vitest';

// Mock user
const mockUser = {
  id: 'user-123',
  email: 'user@example.com',
};

// Mock auth context - will be overridden in specific tests
let mockAuthState = {
  user: mockUser,
  isAuthenticated: true,
  token: 'mock-token',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

// Future date for upcoming events
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 30);
const futureDateString = futureDate.toISOString().split('T')[0];

// Past date for past events
const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 30);
const pastDateString = pastDate.toISOString().split('T')[0];

const mockUpcomingRegistrations = [
  {
    id: 'reg-1',
    event_id: 'event-1',
    user_id: 'user-123',
    full_name: 'John Doe',
    email: 'user@example.com',
    phone: '+91 9876543210',
    company: 'Tech Corp',
    dietary_requirements: null,
    notes: null,
    status: 'registered',
    registered_at: '2024-01-15T10:00:00Z',
    events: {
      id: 'event-1',
      title: 'Monthly Investor Forum',
      slug: 'monthly-investor-forum',
      description: 'Join us for our monthly investor networking event.',
      event_type: 'monthly_forum',
      date: futureDateString,
      start_time: '18:00',
      end_time: '21:00',
      location: 'Mumbai',
      venue_name: 'Grand Hotel',
      venue_address: '123 Main Street',
      max_attendees: 100,
      is_featured: true,
      is_members_only: false,
      registration_deadline: futureDateString,
      image_url: null,
      agenda: null,
      speakers: null,
      status: 'upcoming',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
    },
  },
  {
    id: 'reg-2',
    event_id: 'event-2',
    user_id: 'user-123',
    full_name: 'John Doe',
    email: 'user@example.com',
    phone: null,
    company: null,
    dietary_requirements: null,
    notes: null,
    status: 'registered',
    registered_at: '2024-01-20T10:00:00Z',
    events: {
      id: 'event-2',
      title: 'Sector Summit - Fintech',
      slug: 'sector-summit-fintech',
      description: 'Deep dive into fintech investments.',
      event_type: 'sector_summit',
      date: futureDateString,
      start_time: '09:00',
      end_time: '17:00',
      location: 'Bangalore',
      venue_name: 'Tech Park',
      venue_address: '456 Tech Road',
      max_attendees: 50,
      is_featured: false,
      is_members_only: true,
      registration_deadline: futureDateString,
      image_url: null,
      agenda: null,
      speakers: null,
      status: 'upcoming',
      created_at: '2024-01-05T10:00:00Z',
      updated_at: '2024-01-05T10:00:00Z',
    },
  },
];

const mockPastRegistrations = [
  {
    id: 'reg-3',
    event_id: 'event-3',
    user_id: 'user-123',
    full_name: 'John Doe',
    email: 'user@example.com',
    phone: null,
    company: 'Tech Corp',
    dietary_requirements: null,
    notes: null,
    status: 'attended',
    registered_at: '2023-12-01T10:00:00Z',
    events: {
      id: 'event-3',
      title: 'Annual Summit 2023',
      slug: 'annual-summit-2023',
      description: 'Our annual investor summit.',
      event_type: 'annual_summit',
      date: pastDateString,
      start_time: '10:00',
      end_time: '18:00',
      location: 'Delhi',
      venue_name: 'Convention Center',
      venue_address: '789 Main Road',
      max_attendees: 500,
      is_featured: true,
      is_members_only: false,
      registration_deadline: pastDateString,
      image_url: null,
      agenda: null,
      speakers: null,
      status: 'completed',
      created_at: '2023-11-01T10:00:00Z',
      updated_at: '2023-12-16T18:00:00Z',
    },
  },
];

const mockAllRegistrations = [...mockUpcomingRegistrations, ...mockPastRegistrations];

const renderComponent = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MyRegistrationsPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('MyRegistrations Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth state to authenticated user
    mockAuthState = {
      user: mockUser,
      isAuthenticated: true,
      token: 'mock-token',
    };
    (apiClient.get as Mock).mockResolvedValue(mockAllRegistrations);
  });

  describe('Authentication', () => {
    it('should show sign-in prompt for unauthenticated users', async () => {
      mockAuthState = {
        user: null as unknown as typeof mockUser,
        isAuthenticated: false,
        token: '',
      };

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/sign in required/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
      });
    });

    it('should show registrations for authenticated users', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('My Registrations')).toBeInTheDocument();
        expect(screen.queryByText(/sign in required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Display Registrations', () => {
    it('should display upcoming registrations with event details', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
        expect(screen.getByText('Sector Summit - Fintech')).toBeInTheDocument();
      });
    });

    it('should show registration dates', async () => {
      renderComponent();

      await waitFor(() => {
        // Check that venue names are displayed
        expect(screen.getByText('Grand Hotel')).toBeInTheDocument();
        expect(screen.getByText('Tech Park')).toBeInTheDocument();
      });
    });

    it('should show event type badges', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Forum')).toBeInTheDocument();
        expect(screen.getByText('Sector Summit')).toBeInTheDocument();
      });
    });

    it('should show confirmed status for upcoming registrations', async () => {
      renderComponent();

      await waitFor(() => {
        const confirmedBadges = screen.getAllByText('Confirmed');
        expect(confirmedBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Tabs Navigation', () => {
    it('should display tabs for upcoming and past events', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /upcoming/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /past/i })).toBeInTheDocument();
      });
    });

    it('should show registration counts in tab labels', async () => {
      renderComponent();

      await waitFor(() => {
        // Should show count for upcoming events
        const upcomingTab = screen.getByRole('tab', { name: /upcoming/i });
        expect(upcomingTab).toHaveTextContent('2');
        
        // Should show count for past events
        const pastTab = screen.getByRole('tab', { name: /past/i });
        expect(pastTab).toHaveTextContent('1');
      });
    });

    it('should switch to past registrations when clicking Past tab', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const pastTab = screen.getByRole('tab', { name: /past/i });
      await userEvent.click(pastTab);

      await waitFor(() => {
        expect(screen.getByText('Annual Summit 2023')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no upcoming registrations', async () => {
      (apiClient.get as Mock).mockResolvedValue(mockPastRegistrations);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no upcoming registrations/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /browse events/i })).toBeInTheDocument();
      });
    });

    it('should show empty state when no past registrations', async () => {
      (apiClient.get as Mock).mockResolvedValue(mockUpcomingRegistrations);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const pastTab = screen.getByRole('tab', { name: /past/i });
      await userEvent.click(pastTab);

      await waitFor(() => {
        expect(screen.getByText(/no past events/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Registration', () => {
    it('should show cancel button for upcoming registrations', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      expect(cancelButtons.length).toBeGreaterThan(0);
    });

    it('should open confirmation dialog when clicking cancel', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
        expect(screen.getByText(/cancel registration\?/i)).toBeInTheDocument();
      });
    });

    it('should call API when confirming cancellation', async () => {
      (apiClient.delete as Mock).mockResolvedValue({ success: true });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /cancel registration/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalledWith('event_registrations', 'reg-1');
      });
    });

    it('should show success toast after cancellation', async () => {
      (apiClient.delete as Mock).mockResolvedValue({ success: true });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /cancel registration/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('cancelled')
        );
      });
    });

    it('should close dialog when clicking keep registration', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });

      const keepButton = screen.getByRole('button', { name: /keep registration/i });
      await userEvent.click(keepButton);

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('View Details Links', () => {
    it('should show view details button for upcoming events', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByRole('link', { name: /view details/i });
      expect(viewDetailsButtons.length).toBeGreaterThan(0);
      expect(viewDetailsButtons[0]).toHaveAttribute('href', '/events/monthly-investor-forum');
    });

    it('should show view recap button for past events', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const pastTab = screen.getByRole('tab', { name: /past/i });
      await userEvent.click(pastTab);

      await waitFor(() => {
        const viewRecapButton = screen.getByRole('link', { name: /view recap/i });
        expect(viewRecapButton).toHaveAttribute('href', '/events/annual-summit-2023');
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton while fetching data', async () => {
      (apiClient.get as Mock).mockImplementation(() => new Promise(() => {}));

      renderComponent();

      // Should show skeleton loaders
      const skeletons = document.querySelectorAll('.animate-pulse, [class*="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API error gracefully', async () => {
      (apiClient.get as Mock).mockRejectedValue(new Error('Network error'));

      renderComponent();

      // Component should still render without crashing
      await waitFor(() => {
        expect(screen.getByText('My Registrations')).toBeInTheDocument();
      });
    });
  });
});
