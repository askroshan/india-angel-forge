/**
 * WSOD Safety – MyRegistrations handles null/missing event data
 *
 * As a: User of any role (admin, investor, founder, etc.)
 * I want to: View /my-registrations without a White Screen of Death
 * So that: The page never crashes even when event data is missing
 *
 * Acceptance Criteria:
 * - Page renders when registrations have null `events` field
 * - Page renders when `events` has missing sub-fields (start_time, venue_name, etc.)
 * - Page renders when API returns empty array
 * - Page renders when API returns error
 * - Admin user can view /my-registrations without WSOD
 *
 * TDD: RED Phase - Writing failing tests first
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { apiClient } from '@/api/client';
import type { Mock } from 'vitest';

const mockAdminUser = {
  id: 'admin-001',
  email: 'admin@indiaangelforum.test',
  roles: ['admin'],
};

const mockInvestorUser = {
  id: 'investor-001',
  email: 'investor@test.com',
  roles: ['investor'],
};

let mockAuthState: { user: typeof mockAdminUser | typeof mockInvestorUser | null; isAuthenticated: boolean; token: string } = {
  user: mockAdminUser,
  isAuthenticated: true,
  token: 'mock-token',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 30);
const futureDateStr = futureDate.toISOString().split('T')[0];

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MyRegistrationsPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('MyRegistrations – WSOD Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: mockAdminUser,
      isAuthenticated: true,
      token: 'mock-token',
    };
  });

  describe('Admin user resilience', () => {
    it('should render the page heading for admin user without crashing', async () => {
      (apiClient.get as Mock).mockResolvedValue([]);
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('My Registrations')).toBeInTheDocument();
      });
    });

    it('should handle admin with registrations that have null events', async () => {
      (apiClient.get as Mock).mockResolvedValue([
        {
          id: 'reg-null-1',
          event_id: 'ev-1',
          user_id: 'admin-001',
          status: 'registered',
          registered_at: '2024-01-15T10:00:00Z',
          events: null,
        },
      ]);

      renderPage();

      // Must NOT crash — should still show page heading
      await waitFor(() => {
        expect(screen.getByText('My Registrations')).toBeInTheDocument();
      });
    });
  });

  describe('Missing sub-fields resilience', () => {
    it('should render without crashing when events is missing start_time and end_time', async () => {
      (apiClient.get as Mock).mockResolvedValue([
        {
          id: 'reg-partial-1',
          event_id: 'ev-2',
          user_id: 'admin-001',
          status: 'registered',
          registered_at: '2024-01-15T10:00:00Z',
          events: {
            id: 'ev-2',
            title: 'Partial Event',
            slug: 'partial-event',
            event_type: 'monthly_forum',
            date: futureDateStr,
            // deliberately missing: start_time, end_time, venue_name, location
          },
        },
      ]);

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Partial Event')).toBeInTheDocument();
      });
    });

    it('should render without crashing when events has empty strings', async () => {
      (apiClient.get as Mock).mockResolvedValue([
        {
          id: 'reg-empty-1',
          event_id: 'ev-3',
          user_id: 'admin-001',
          status: 'registered',
          registered_at: '2024-01-15T10:00:00Z',
          events: {
            id: 'ev-3',
            title: '',
            slug: '',
            event_type: '',
            date: futureDateStr,
            start_time: '',
            end_time: '',
            venue_name: '',
            location: '',
          },
        },
      ]);

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('My Registrations')).toBeInTheDocument();
      });
    });
  });

  describe('API error resilience', () => {
    it('should not crash when API returns error', async () => {
      (apiClient.get as Mock).mockRejectedValue(new Error('500 Internal Server Error'));

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('My Registrations')).toBeInTheDocument();
      });
    });

    it('should not crash when API returns undefined', async () => {
      (apiClient.get as Mock).mockResolvedValue(undefined);

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('My Registrations')).toBeInTheDocument();
      });
    });
  });

  describe('Investor user on same page', () => {
    beforeEach(() => {
      mockAuthState = {
        user: mockInvestorUser,
        isAuthenticated: true,
        token: 'mock-token',
      };
    });

    it('should render the page heading for investor user', async () => {
      (apiClient.get as Mock).mockResolvedValue([]);
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('My Registrations')).toBeInTheDocument();
      });
    });
  });
});
