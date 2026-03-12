/**
 * US-MEMB-002: Admin Membership Plans Management
 * US-DISC-001: Admin Discount Codes Management
 *
 * TDD: Validates that MembershipManagement sub-components correctly extract
 * data from the wrapped API responses returned by /api/admin/membership/plans,
 * /api/admin/membership/discount-codes, etc.
 *
 * B2 ROOT CAUSE: Sub-components call setPlans(data || []) where data is the
 * full response object { success: true, plans: [...] } — they must extract
 * the nested array to avoid crashing during render.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import MembershipManagement from '@/pages/admin/MembershipManagement';

// Mock navigation so we can render the page without the full app
vi.mock('@/components/Navigation', () => ({
  default: () => <nav data-testid="navigation">Navigation</nav>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

// Mock sonner toast to avoid env issues
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockPlansResponse = {
  success: true,
  plans: [
    {
      id: 'plan-1',
      name: 'Standard Annual',
      slug: 'standard-annual',
      price: 5000,
      billingCycle: 'ANNUAL',
      features: ['Feature A', 'Feature B'],
      isActive: true,
      displayOrder: 1,
      _count: { memberships: 10 },
    },
    {
      id: 'plan-2',
      name: 'Premium Annual',
      slug: 'premium-annual',
      price: 10000,
      billingCycle: 'ANNUAL',
      features: ['Feature A', 'Feature B', 'Feature C'],
      isActive: true,
      displayOrder: 2,
      _count: { memberships: 5 },
    },
  ],
};

const mockDiscountCodesResponse = {
  success: true,
  discountCodes: [
    {
      id: 'dc-1',
      code: 'SUMMER25',
      discountType: 'PERCENTAGE',
      discountValue: 25,
      maxUses: 100,
      currentUses: 10,
      validFrom: '2024-01-01T00:00:00Z',
      validUntil: '2024-12-31T23:59:59Z',
      applicablePlanIds: [],
      isActive: true,
    },
  ],
};

const mockMembershipsResponse = {
  success: true,
  memberships: [
    {
      id: 'mem-1',
      status: 'ACTIVE',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2025-01-01T00:00:00Z',
      user: { id: 'user-1', fullName: 'Alice Investor', email: 'alice@example.com' },
      plan: { id: 'plan-1', name: 'Standard Annual' },
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

const mockChangelogResponse = {
  success: true,
  changelog: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
};

const mockConfigResponse = {
  success: true,
  configs: [
    {
      id: 'config-1',
      key: 'membership.introductory_price_override',
      value: '',
      description: 'Override all plan prices',
    },
  ],
};

const renderComponent = () =>
  render(
    <BrowserRouter>
      <MembershipManagement />
    </BrowserRouter>
  );

describe('US-MEMB-002: Membership Management Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      // B2: API returns wrapped response — component must extract plans array
      http.get('/api/admin/membership/plans', () =>
        HttpResponse.json(mockPlansResponse)
      ),
      http.get('/api/admin/membership/discount-codes', () =>
        HttpResponse.json(mockDiscountCodesResponse)
      ),
      http.get('/api/admin/membership/memberships', () =>
        HttpResponse.json(mockMembershipsResponse)
      ),
      http.get('/api/admin/membership/changelog', () =>
        HttpResponse.json(mockChangelogResponse)
      ),
      http.get('/api/admin/membership/system-config', () =>
        HttpResponse.json(mockConfigResponse)
      )
    );
  });

  describe('Page Layout', () => {
    it('should render the Membership Management page without crashing', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('admin-membership-page')).toBeInTheDocument();
      });
    });

    it('should render Navigation and Footer', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('navigation')).toBeInTheDocument();
        expect(screen.getByTestId('footer')).toBeInTheDocument();
      });
    });

    it('should render all tab triggers', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('membership-plans-tab')).toBeInTheDocument();
        expect(screen.getByTestId('membership-discount-tab')).toBeInTheDocument();
        expect(screen.getByTestId('membership-subscribers-tab')).toBeInTheDocument();
        expect(screen.getByTestId('membership-changelog-tab')).toBeInTheDocument();
        expect(screen.getByTestId('membership-config-tab')).toBeInTheDocument();
      });
    });
  });

  // B2 RED: Plans tab must render plan names from the wrapped API response
  describe('Plans Tab (B2: data shape fix)', () => {
    it('should render plan names from wrapped API response { success, plans: [] }', async () => {
      renderComponent();

      // The Plans tab is active by default
      await waitFor(() => {
        expect(screen.getByText('Standard Annual')).toBeInTheDocument();
        expect(screen.getByText('Premium Annual')).toBeInTheDocument();
      });
    });

    it('should render plan rows with correct testid', async () => {
      renderComponent();

      await waitFor(() => {
        const planRows = screen.getAllByTestId('plan-row');
        expect(planRows).toHaveLength(2);
      });
    });

    it('should show Add Plan button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('plan-create-btn')).toBeInTheDocument();
      });
    });
  });
});
