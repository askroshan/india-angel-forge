/**
 * N1: Admin Users Can Browse Investment Deals
 *
 * As an: Admin
 * I want to: Browse the investor deals page without being redirected
 * So that: I can oversee deal activity without maintaining an investor application
 *
 * Acceptance Criteria:
 * - GIVEN I am logged in as ADMIN
 *   WHEN I navigate to /investor/deals
 *   THEN the deals list is shown (not redirected to /apply/investor)
 *
 * Root cause: DealsPage.checkAccessAndLoadDeals() calls GET /api/applications/investor-application
 * and redirects to /apply/investor if no approved investor application exists.
 * Admins legitimately have no investor application, so the fix is to bypass
 * the application check for admin users.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DealsPage from '@/pages/investor/DealsPage';

// ---- mocks ----------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Controllable auth mock
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// ---- helper ----------------------------------------------------------------

const makeFetch = ({
  appStatus,
  appBody,
}: {
  appStatus?: number;
  appBody?: unknown;
}) => {
  return vi.fn().mockImplementation((url: string) => {
    const u = url as string;

    if (u.includes('/api/applications/investor-application')) {
      const status = appStatus ?? 200;
      return Promise.resolve({
        ok: status < 400,
        status,
        json: () => Promise.resolve(appBody ?? null),
      });
    }

    // deals, accreditation, interests, industries
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
  });
};

const renderPage = () =>
  render(
    <BrowserRouter>
      <DealsPage />
    </BrowserRouter>,
  );

// ---------------------------------------------------------------------------

describe('N1: Admin access to DealsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('When logged in as ADMIN', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        token: 'mock-token',
        user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
      });
    });

    it('completes loading without redirecting to /apply/investor', async () => {
      // Admin has no investor application → backend returns 200 with null body.
      // Without the fix: DealsPage sees ok=true && application===null → calls
      // navigate('/apply/investor') and returns early; fetchDeals() is never
      // called, setLoading(false) is never called, "Loading deals..." stays forever.
      // With the fix: admin bypasses the application check, fetchDeals() runs,
      // loading clears, and no redirect happens.
      global.fetch = makeFetch({ appStatus: 200, appBody: null });

      renderPage();

      // "Loading deals..." disappears only after fetchDeals() completes.
      // It stays forever when the early-redirect path is taken → RED before fix.
      await waitFor(
        () => expect(screen.queryByText(/loading deals/i)).not.toBeInTheDocument(),
        { timeout: 3000 },
      );

      expect(mockNavigate).not.toHaveBeenCalledWith('/apply/investor');
    });
  });

  describe('When logged in as regular INVESTOR', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        token: 'mock-token',
        user: { id: 'investor-1', email: 'investor@test.com', role: 'investor' },
      });
    });

    it('redirects an investor with a non-approved application to /apply/investor', async () => {
      global.fetch = makeFetch({ appStatus: 200, appBody: { status: 'pending' } });

      renderPage();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/apply/investor');
      }, { timeout: 3000 });
    });
  });
});

