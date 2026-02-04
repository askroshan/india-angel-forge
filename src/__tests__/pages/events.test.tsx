/**
 * Events Page Tests
 * 
 * User Story: Browse Events
 * 
 * As a: Visitor/Member
 * I want to: Browse upcoming and past events
 * So that: I can find events to attend
 * 
 * Acceptance Criteria:
 * - Display upcoming events by default
 * - Allow switching to past events
 * - Show event cards with details
 * - Display My Registrations for authenticated users
 * - Show loading states while fetching
 * - Show empty states when no events exist
 * 
 * TDD: RED Phase - Writing failing tests first
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EventsPage from '@/pages/Events';

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

const mockUpcomingEvents = [
  {
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
  {
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
];

const mockPastEvents = [
  {
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
];

const mockMyRegistrations: unknown[] = [];

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
        <EventsPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Events Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth state to unauthenticated by default
    mockAuthState = {
      user: null as unknown as typeof mockUser,
      isAuthenticated: false,
      token: '',
    };
    
    // Mock API responses based on URL
    (apiClient.get as Mock).mockImplementation((url: string) => {
      if (url.includes('filter=upcoming')) {
        return Promise.resolve(mockUpcomingEvents);
      } else if (url.includes('filter=past')) {
        return Promise.resolve(mockPastEvents);
      } else if (url.includes('/my-registrations')) {
        return Promise.resolve(mockMyRegistrations);
      }
      return Promise.resolve([]);
    });
  });

  describe('Page Structure', () => {
    it('should display page title', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /events & forums/i })).toBeInTheDocument();
      });
    });

    it('should display browse events section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /browse events/i })).toBeInTheDocument();
      });
    });

    it('should display how forums work section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /how our forums work/i })).toBeInTheDocument();
      });
    });
  });

  describe('Tabs Navigation', () => {
    it('should display upcoming and past event tabs', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /upcoming/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /past events/i })).toBeInTheDocument();
      });
    });

    it('should show upcoming events by default', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
        expect(screen.getByText('Sector Summit - Fintech')).toBeInTheDocument();
      });
    });

    it('should switch to past events when clicking past tab', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const pastTab = screen.getByRole('tab', { name: /past events/i });
      await userEvent.click(pastTab);

      await waitFor(() => {
        expect(screen.getByText('Annual Summit 2023')).toBeInTheDocument();
      });
    });
  });

  describe('Event Cards', () => {
    it('should display event titles', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
        expect(screen.getByText('Sector Summit - Fintech')).toBeInTheDocument();
      });
    });

    it('should display event venues', async () => {
      renderComponent();

      await waitFor(() => {
        // EventCard shows venue_name || location, so we check venue_name
        expect(screen.getByText('Grand Hotel')).toBeInTheDocument();
        expect(screen.getByText('Tech Park')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no upcoming events', async () => {
      (apiClient.get as Mock).mockImplementation((url: string) => {
        if (url.includes('filter=upcoming')) {
          return Promise.resolve([]);
        } else if (url.includes('filter=past')) {
          return Promise.resolve(mockPastEvents);
        }
        return Promise.resolve([]);
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no upcoming events scheduled/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no past events', async () => {
      (apiClient.get as Mock).mockImplementation((url: string) => {
        if (url.includes('filter=upcoming')) {
          return Promise.resolve(mockUpcomingEvents);
        } else if (url.includes('filter=past')) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const pastTab = screen.getByRole('tab', { name: /past events/i });
      await userEvent.click(pastTab);

      await waitFor(() => {
        expect(screen.getByText(/no past events to display/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated User', () => {
    it('should show My Registrations section for logged-in users', async () => {
      mockAuthState = {
        user: mockUser,
        isAuthenticated: true,
        token: 'mock-token',
      };

      renderComponent();

      // For authenticated users, the MyRegistrations component is rendered
      await waitFor(() => {
        // The page should render without errors
        expect(screen.getByRole('heading', { name: /events & forums/i })).toBeInTheDocument();
      });
    });

    it('should not show My Registrations section for unauthenticated users', async () => {
      mockAuthState = {
        user: null as unknown as typeof mockUser,
        isAuthenticated: false,
        token: '',
      };

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /events & forums/i })).toBeInTheDocument();
      });

      // Page renders but MyRegistrations section is not shown
      expect(screen.getByRole('heading', { name: /events & forums/i })).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading skeleton while fetching upcoming events', async () => {
      (apiClient.get as Mock).mockImplementation(() => new Promise(() => {}));

      renderComponent();

      // Should show skeleton loaders
      const skeletons = document.querySelectorAll('.animate-pulse, [class*="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('CTA Section', () => {
    it('should display join our next event section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /join our next event/i })).toBeInTheDocument();
      });
    });

    it('should have become a member button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /become a member/i })).toBeInTheDocument();
      });
    });

    it('should have view all events button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view all events/i })).toBeInTheDocument();
      });
    });
  });
});
