/**
 * US-INVESTOR-ACTIVITY-001: Activity Timeline Type Filter
 *
 * As an: Investor
 * I want to: Filter activity timeline by Document type and see STATEMENT_GENERATED activities
 * So that: Financial statement generation events appear in Document category filter results
 *
 * TDD: RED Phase
 * Bug M7: activityType filter sends category name (DOCUMENT) instead of all matching prefixes
 * Root cause: Backend uses startsWith which doesn't match STATEMENT_GENERATED when filter is DOCUMENT
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import ActivityTimeline from '@/pages/ActivityTimeline';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token',
    user: { id: 'user-1', email: 'investor@example.com', roles: ['investor'] },
    isAuthenticated: true,
  }),
}));

// Mock localStorage for auth token
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => key === 'auth_token' ? 'mock-token' : null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock IntersectionObserver (used for infinite scroll)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

const mockAllActivities = [
  {
    id: 'act-1',
    activityType: 'PAYMENT_MADE',
    description: 'Payment of ₹50,000 processed',
    timestamp: '2024-01-10T10:00:00Z',
    metadata: {},
  },
  {
    id: 'act-2',
    activityType: 'STATEMENT_GENERATED',
    description: 'Financial statement FS-2024-001 generated',
    timestamp: '2024-01-15T10:00:00Z',
    metadata: {},
  },
  {
    id: 'act-3',
    activityType: 'CERTIFICATE_ISSUED',
    description: 'Certificate issued for Event Summit',
    timestamp: '2024-01-20T10:00:00Z',
    metadata: {},
  },
];

describe('US-INVESTOR-ACTIVITY-001: Activity Timeline Type Filter', () => {
  let capturedActivityTypeParam: string | null = null;

  beforeEach(() => {
    capturedActivityTypeParam = null;
    server.use(
      http.get('/api/activity', ({ request }) => {
        const url = new URL(request.url);
        capturedActivityTypeParam = url.searchParams.get('activityType');
        return HttpResponse.json({
          success: true,
          data: mockAllActivities,
          pagination: { hasMore: false, nextCursor: null, count: 3 },
        });
      })
    );
  });

  it('should send STATEMENT and CERTIFICATE prefixes when Document filter is selected', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <ActivityTimeline />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/Financial statement FS-2024-001/)).toBeInTheDocument();
    });

    // Open type filter
    await user.click(screen.getByTestId('filter-type'));

    // Select Document category
    await user.click(screen.getByTestId('type-document'));

    // Apply filter
    await user.click(screen.getByTestId('apply-type-filter'));

    // Wait for the API to be called with the filter
    await waitFor(() => {
      expect(capturedActivityTypeParam).not.toBeNull();
    });

    // The activityType param should include STATEMENT and CERTIFICATE (not just DOCUMENT)
    expect(capturedActivityTypeParam).toMatch(/STATEMENT/);
    expect(capturedActivityTypeParam).toMatch(/CERTIFICATE/);
  });

  it('should send DEAL and INVEST prefixes when Payment filter is selected', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <ActivityTimeline />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Payment of/)).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('filter-type'));
    await user.click(screen.getByTestId('type-payment'));
    await user.click(screen.getByTestId('apply-type-filter'));

    await waitFor(() => {
      expect(capturedActivityTypeParam).not.toBeNull();
    });

    // Should include DEAL and INVEST prefixes for PAYMENT category
    expect(capturedActivityTypeParam).toMatch(/DEAL|INVEST/);
  });
});
