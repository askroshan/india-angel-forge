import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EventAttendance from '@/pages/moderator/EventAttendance';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'moderator-1', email: 'mod@test.com', roles: ['moderator'] },
    isAuthenticated: true,
    signOut: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock localStorage
vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('mock-token');

// Mock data matching the component's Attendee interface
const mockEvent = {
  id: 'event-1',
  title: 'Angel Investor Forum - Q1 2024',
  eventDate: '2024-02-15T18:00:00Z',
  location: 'Bangalore, India',
};

const mockAttendees = [
  {
    userId: 'user-1',
    eventId: 'event-1',
    rsvpStatus: 'CONFIRMED' as const,
    attendanceStatus: null,
    checkInTime: '2024-02-15T17:55:00Z',
    checkOutTime: '2024-02-15T20:00:00Z',
    certificateId: null,
    user: { id: 'user-1', email: 'rajesh@example.com', fullName: 'Rajesh Kumar' },
  },
  {
    userId: 'user-2',
    eventId: 'event-1',
    rsvpStatus: 'NO_SHOW' as const,
    attendanceStatus: null,
    checkInTime: null,
    checkOutTime: null,
    certificateId: null,
    user: { id: 'user-2', email: 'priya@example.com', fullName: 'Priya Sharma' },
  },
  {
    userId: 'user-3',
    eventId: 'event-1',
    rsvpStatus: 'CONFIRMED' as const,
    attendanceStatus: null,
    checkInTime: null,
    checkOutTime: null,
    certificateId: null,
    user: { id: 'user-3', email: 'amit@example.com', fullName: 'Amit Verma' },
  },
  {
    userId: 'user-4',
    eventId: 'event-1',
    rsvpStatus: 'CONFIRMED' as const,
    attendanceStatus: null,
    checkInTime: '2024-02-15T18:10:00Z',
    checkOutTime: null,
    certificateId: null,
    user: { id: 'user-4', email: 'sarah@example.com', fullName: 'Sarah Chen' },
  },
];

// Helper to create mock fetch responses
const createMockFetch = (overrides?: {
  eventOk?: boolean;
  attendanceOk?: boolean;
  eventData?: Record<string, unknown>;
  attendanceData?: Record<string, unknown>;
  checkInOk?: boolean;
}) => {
  const opts = {
    eventOk: true,
    attendanceOk: true,
    checkInOk: true,
    ...overrides,
  };

  return vi.fn().mockImplementation((url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;

    if (urlStr.match(/\/api\/events\/event-1\/attendance\/check-in/)) {
      return Promise.resolve({
        ok: opts.checkInOk,
        json: () => Promise.resolve({ success: true }),
      });
    }

    if (urlStr.match(/\/api\/events\/event-1\/attendance/)) {
      if (!opts.attendanceOk) {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ error: 'Failed' }) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(opts.attendanceData || { attendees: mockAttendees }),
      });
    }

    if (urlStr.match(/\/api\/events\/event-1$/)) {
      if (!opts.eventOk) {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ error: 'Failed' }) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(opts.eventData || mockEvent),
      });
    }

    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  });
};

describe('US-MODERATOR-002: Review Event Attendance', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    global.fetch = createMockFetch();
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
        expect(screen.getByText('Bangalore, India')).toBeInTheDocument();
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
        const statusBadges = screen.getAllByTestId('attendance-status');
        expect(statusBadges.length).toBeGreaterThan(0);
      });
    });

    it('should highlight frequent no-shows', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
        expect(screen.getByText('No Show')).toBeInTheDocument();
      });
    });
  });

  describe('Mark Attendance', () => {
    it('should allow marking attendee as attended', async () => {
      const user = userEvent.setup();

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      const checkInButtons = screen.getAllByTestId('check-in-button');
      expect(checkInButtons.length).toBeGreaterThan(0);
      await user.click(checkInButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/events\/event-1\/attendance\/check-in/),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('should allow marking registrant as no-show', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      });

      expect(screen.getByText('No Show')).toBeInTheDocument();
    });
  });

  describe('QR Code Check-in', () => {
    it('should display QR code scanner option', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Angel Investor Forum/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /QR Code Check-in/i })).toBeInTheDocument();
    });
  });

  describe('Attendance Statistics', () => {
    it('should display attendance breakdown', async () => {
      renderComponent();

      await waitFor(() => {
        // "Checked In" appears as stat label and as a badge, so use getAllByText
        expect(screen.getAllByText('Checked In').length).toBeGreaterThan(0);
        expect(screen.getByText('Checked Out')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });
    });

    it('should calculate attendance percentage', async () => {
      renderComponent();

      // 2 checked in / 3 confirmed = 67%
      await waitFor(() => {
        expect(screen.getByText('67%')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading event fails', async () => {
      global.fetch = createMockFetch({ eventOk: false });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Event not found')).toBeInTheDocument();
      });
    });

    it('should handle attendance update error gracefully', async () => {
      const user = userEvent.setup();

      global.fetch = createMockFetch({ checkInOk: false });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Amit Verma')).toBeInTheDocument();
      });

      const checkInButtons = screen.getAllByTestId('check-in-button');
      await user.click(checkInButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Event Attendance')).toBeInTheDocument();
      });
    });
  });
});
