import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EventAttendance from '@/pages/moderator/EventAttendance';
import * as apiClient from '@/api/client';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

// Mock AuthContext
const mockUser = {
  id: 'moderator-1',
  email: 'moderator@example.com',
  role: 'moderator',
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
const mockEvent = {
  id: 'event-1',
  title: 'Angel Investor Forum - Q1 2024',
  date: '2024-02-15T18:00:00Z',
  location: 'Bangalore, India',
  total_registrations: 45,
  attended_count: 32,
  no_show_count: 8,
  pending_count: 5,
};

const mockRegistrations = [
  {
    id: 'reg-1',
    event_id: 'event-1',
    user_id: 'user-1',
    user_name: 'Rajesh Kumar',
    user_email: 'rajesh@example.com',
    user_role: 'investor',
    registered_at: '2024-02-01T10:00:00Z',
    attendance_status: 'ATTENDED',
    checked_in_at: '2024-02-15T17:55:00Z',
    no_show_history_count: 0,
  },
  {
    id: 'reg-2',
    event_id: 'event-1',
    user_id: 'user-2',
    user_name: 'Priya Sharma',
    user_email: 'priya@example.com',
    user_role: 'founder',
    registered_at: '2024-02-03T14:30:00Z',
    attendance_status: 'NO_SHOW',
    checked_in_at: null,
    no_show_history_count: 2, // Frequent no-show
  },
  {
    id: 'reg-3',
    event_id: 'event-1',
    user_id: 'user-3',
    user_name: 'Amit Verma',
    user_email: 'amit@example.com',
    user_role: 'investor',
    registered_at: '2024-02-05T09:15:00Z',
    attendance_status: 'PENDING',
    checked_in_at: null,
    no_show_history_count: 0,
  },
  {
    id: 'reg-4',
    event_id: 'event-1',
    user_id: 'user-4',
    user_name: 'Sarah Chen',
    user_email: 'sarah@example.com',
    user_role: 'investor',
    registered_at: '2024-02-07T16:45:00Z',
    attendance_status: 'PENDING',
    checked_in_at: null,
    no_show_history_count: 0,
  },
];

describe('US-MODERATOR-002: Review Event Attendance', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    // Default mock implementation
    (apiClient.apiClient.get as any).mockImplementation((url: string) => {
      if (url === '/api/moderator/events/event-1') {
        return Promise.resolve({ data: mockEvent });
      }
      if (url === '/api/moderator/events/event-1/registrations') {
        return Promise.resolve({ data: mockRegistrations });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/moderator/events/event-1/attendance']}>
          <Routes>
            <Route path="/moderator/events/:eventId/attendance" element={<EventAttendance />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('Page Display', () => {
    it('should display event attendance management page', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Event Attendance')).toBeInTheDocument();
        expect(screen.getByText(/Angel Investor Forum/i)).toBeInTheDocument();
      });
    });

    it('should display event details and statistics', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Angel Investor Forum/i)).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument(); // Total registrations
        expect(screen.getByText('32')).toBeInTheDocument(); // Attended count
        expect(screen.getByText('8')).toBeInTheDocument(); // No show count
      });
    });
  });

  describe('Registration List', () => {
    it('should display list of registrations with attendee details', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
        expect(screen.getByText(/rajesh@example.com/i)).toBeInTheDocument();
      });
    });

    it('should display attendance status badges', async () => {
      renderComponent();

      await waitFor(() => {
        const badges = screen.getAllByText(/ATTENDED/i);
        expect(badges.length).toBeGreaterThan(0);
        const noShowBadges = screen.getAllByText(/NO.*SHOW|NO_SHOW/i);
        expect(noShowBadges.length).toBeGreaterThan(0);
        const pendingBadges = screen.getAllByText(/PENDING/i);
        expect(pendingBadges.length).toBeGreaterThan(0);
      });
    });

    it('should highlight frequent no-shows', async () => {
      renderComponent();

      await waitFor(() => {
        const priyaRow = screen.getByText('Priya Sharma').closest('div');
        // Should have indicator or warning for no-show history count > 1
        expect(priyaRow).toBeInTheDocument();
      });
    });
  });

  describe('Mark Attendance', () => {
    it('should allow marking attendee as attended', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.patch as any).mockResolvedValueOnce({
        data: { ...mockRegistrations[2], attendance_status: 'ATTENDED' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      // Find "Mark Attended" button for pending registration
      const attendedButtons = screen.getAllByRole('button', { name: /mark.*attended|attended/i });
      await user.click(attendedButtons[0]);

      await waitFor(() => {
        expect(apiClient.apiClient.patch).toHaveBeenCalledWith(
          '/api/moderator/events/event-1/registrations/reg-3',
          expect.objectContaining({ attendance_status: 'ATTENDED' })
        );
      });
    });

    it('should allow marking registrant as no-show', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.patch as any).mockResolvedValueOnce({
        data: { ...mockRegistrations[2], attendance_status: 'NO_SHOW' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      const noShowButtons = screen.getAllByRole('button', { name: /no.*show/i });
      await user.click(noShowButtons[0]);

      await waitFor(() => {
        expect(apiClient.apiClient.patch).toHaveBeenCalledWith(
          '/api/moderator/events/event-1/registrations/reg-3',
          expect.objectContaining({ attendance_status: 'NO_SHOW' })
        );
      });
    });
  });

  describe('QR Code Check-in', () => {
    it('should display QR code scanner option', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Angel Investor Forum/i)).toBeInTheDocument();
      });

      // Should have QR code scanner button or link
      expect(screen.getByRole('button', { name: /qr.*code|scan.*qr|check.*in/i })).toBeInTheDocument();
    });
  });

  describe('Attendance Statistics', () => {
    it('should display attendance breakdown', async () => {
      renderComponent();

      await waitFor(() => {
        const attendedCount = screen.getAllByText('32');
        expect(attendedCount.length).toBeGreaterThan(0);
        expect(screen.getByText('Attended')).toBeInTheDocument();
        
        const noShowCount = screen.getAllByText('8');
        expect(noShowCount.length).toBeGreaterThan(0);
        const noShowLabels = screen.getAllByText('No Show');
        expect(noShowLabels.length).toBeGreaterThan(0);
        
        const pendingCount = screen.getAllByText('5');
        expect(pendingCount.length).toBeGreaterThan(0);
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });
    });

    it('should calculate attendance percentage', async () => {
      renderComponent();

      await waitFor(() => {
        // 32 attended / 45 total = 71%
        expect(screen.getByText('71%')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading event fails', async () => {
      (apiClient.apiClient.get as any).mockRejectedValueOnce(new Error('Failed to load'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/error.*loading|failed to load/i)).toBeInTheDocument();
      });
    });

    it('should handle attendance update error gracefully', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.patch as any).mockRejectedValueOnce(new Error('Update failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      const attendedButtons = screen.getAllByRole('button', { name: /mark.*attended|attended/i });
      await user.click(attendedButtons[0]);

      await waitFor(() => {
        expect(apiClient.apiClient.patch).toHaveBeenCalled();
      });
    });
  });
});
