/**
 * US-ADMIN-EVENTS-001: Admin Event Attendance Management Routing
 *
 * As an: Admin
 * I want to: Click "Manage Attendance" and be taken to the admin attendance page
 * So that: The URL is in the /admin namespace, not /moderator
 *
 * TDD: RED Phase
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import AdminEvents from '@/pages/admin/AdminEvents';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-admin-token',
    user: { id: 'admin-1', email: 'admin@example.com', roles: ['admin'] },
    isAuthenticated: true,
  }),
}));

const mockEvents = [
  {
    id: 'event-1',
    title: 'Angel Investor Summit 2024',
    slug: 'angel-investor-summit-2024',
    description: 'Annual summit for angel investors',
    date: '2024-06-15T10:00:00Z',
    event_date: '2024-06-15T10:00:00Z',
    location: 'Mumbai',
    venue_name: 'Grand Hyatt Mumbai',
    max_attendees: 100,
    status: 'upcoming',
    event_type: 'CONFERENCE',
    registration_count: 55,
    checked_in_count: 0,
  },
];

describe('US-ADMIN-EVENTS-001: Manage Attendance Routing', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json(mockEvents);
      })
    );
  });

  it('should navigate to /admin/events/:id/attendance (NOT /moderator/...) when Manage Attendance is clicked', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <AdminEvents />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Angel Investor Summit 2024')).toBeInTheDocument();
    });

    const manageBtn = screen.getByTestId('manage-attendance');
    await user.click(manageBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/events/event-1/attendance');
    expect(mockNavigate).not.toHaveBeenCalledWith('/moderator/events/event-1/attendance');
  });
});

// N3: Test event artifact cleanup filter
describe('N3: Hide Test Events Filter', () => {
  const eventsWithTestData = [
    {
      id: 'event-real',
      title: 'Angel Investor Summit 2024',
      slug: 'angel-investor-summit-2024',
      description: 'Real production event',
      date: '2024-06-15T10:00:00Z',
      event_date: '2024-06-15T10:00:00Z',
      location: 'Mumbai',
      venue_name: 'Grand Hyatt Mumbai',
      max_attendees: 100,
      status: 'upcoming',
      event_type: 'CONFERENCE',
      registration_count: 55,
      checked_in_count: 0,
    },
    {
      id: 'event-test-1',
      title: 'Capacity Update Test',
      slug: 'capacity-update-test',
      description: 'E2E test artifact',
      date: '2024-06-15T10:00:00Z',
      event_date: '2024-06-15T10:00:00Z',
      location: 'Test Location',
      venue_name: 'Test Venue',
      max_attendees: 10,
      status: 'upcoming',
      event_type: 'WEBINAR',
      registration_count: 0,
      checked_in_count: 0,
    },
  ];

  beforeEach(() => {
    mockNavigate.mockClear();
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json(eventsWithTestData);
      })
    );
  });

  const renderAdminEvents = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <AdminEvents />
        </MemoryRouter>
      </QueryClientProvider>
    );

  it('shows all events (including test data) by default', async () => {
    renderAdminEvents();

    await waitFor(() => {
      expect(screen.getByText('Angel Investor Summit 2024')).toBeInTheDocument();
      expect(screen.getByText('Capacity Update Test')).toBeInTheDocument();
    });
  });

  it('has a "Hide test events" checkbox in the UI', async () => {
    renderAdminEvents();

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /hide test events/i })).toBeInTheDocument();
    });
  });

  it('hides events with "test" in the title when checkbox is checked', async () => {
    const user = userEvent.setup();
    renderAdminEvents();

    await waitFor(() => {
      expect(screen.getByText('Capacity Update Test')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox', { name: /hide test events/i });
    await user.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText('Angel Investor Summit 2024')).toBeInTheDocument();
      expect(screen.queryByText('Capacity Update Test')).not.toBeInTheDocument();
    });
  });

  it('restores test events when checkbox is unchecked', async () => {
    const user = userEvent.setup();
    renderAdminEvents();

    await waitFor(() => {
      expect(screen.getByText('Capacity Update Test')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox', { name: /hide test events/i });
    await user.click(checkbox); // hide
    await waitFor(() => {
      expect(screen.queryByText('Capacity Update Test')).not.toBeInTheDocument();
    });

    await user.click(checkbox); // restore
    await waitFor(() => {
      expect(screen.getByText('Capacity Update Test')).toBeInTheDocument();
    });
  });
});
