/**
 * US-INVESTOR-010: Track SPV Allocations
 * 
 * As a: Lead Investor
 * I want to: Track all SPV allocations and commitments
 * So that: I can monitor fundraising progress and manage the SPV
 * 
 * Acceptance Criteria:
 * - GIVEN I am lead investor of an SPV
 *   WHEN I view SPV dashboard
 *   THEN I see all members and their commitments
 * 
 * - GIVEN SPV has target amount
 *   WHEN viewing progress
 *   THEN I see percentage of target raised
 * 
 * - GIVEN member commitments change
 *   WHEN viewing dashboard
 *   THEN I see updated totals in real-time
 * 
 * - GIVEN SPV is ready to close
 *   WHEN all commitments confirmed
 *   THEN I see option to finalize SPV
 * 
 * Priority: High
 * Status: Implementing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import SPVDashboard from '@/pages/investor/SPVDashboard';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'investor-1', email: 'investor@example.com', role: 'INVESTOR' },
    token: 'mock-token',
    isAuthenticated: true,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ spvId: 'spv-001' }) };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-INVESTOR-010: Track SPV Allocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SPV Dashboard', () => {
    it('should display SPV dashboard with allocations', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV 2026',
        dealId: 'deal-001',
        leadInvestorId: 'investor-1',
        targetAmount: 50000000,
        carryPercentage: 20,
        status: 'forming',
        members: [
          {
            id: 'member-001',
            spvId: 'spv-001',
            investorId: 'inv-1',
            commitmentAmount: 5000000,
            status: 'confirmed',
            investorName: 'John Investor',
            investorEmail: 'john@example.com'
          }
        ]
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/spv/spv-001')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSPV),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      renderWithRouter(<SPVDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Test SPV 2026/i)).toBeInTheDocument();
        expect(screen.getByText(/John Investor/i)).toBeInTheDocument();
      });
    });

    it('should show progress percentage', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        dealId: 'deal-001',
        leadInvestorId: 'investor-1',
        targetAmount: 50000000,
        carryPercentage: 20,
        status: 'forming',
        members: [
          {
            id: 'member-001',
            spvId: 'spv-001',
            investorId: 'inv-1',
            commitmentAmount: 25000000,
            status: 'confirmed',
            investorName: 'Investor 1',
            investorEmail: 'inv1@example.com'
          }
        ]
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/spv/spv-001')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSPV),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      renderWithRouter(<SPVDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/50%/i)).toBeInTheDocument();
      });
    });

    it('should display total committed amount', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        dealId: 'deal-001',
        leadInvestorId: 'investor-1',
        targetAmount: 50000000,
        carryPercentage: 20,
        status: 'forming',
        members: [
          {
            id: 'member-001',
            spvId: 'spv-001',
            investorId: 'inv-1',
            commitmentAmount: 10000000,
            status: 'confirmed',
            investorName: 'Investor 1',
            investorEmail: 'inv1@example.com'
          },
          {
            id: 'member-002',
            spvId: 'spv-001',
            investorId: 'inv-2',
            commitmentAmount: 5000000,
            status: 'confirmed',
            investorName: 'Investor 2',
            investorEmail: 'inv2@example.com'
          }
        ]
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/spv/spv-001')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSPV),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      renderWithRouter(<SPVDashboard />);

      await waitFor(() => {
        // Amount appears both in stats card and progress bar
        const amounts = screen.getAllByText(/1\.50 Cr/i);
        expect(amounts.length).toBeGreaterThan(0);
      });
    });

    it('should show member count', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        dealId: 'deal-001',
        leadInvestorId: 'investor-1',
        targetAmount: 50000000,
        carryPercentage: 20,
        status: 'forming',
        members: [
          { id: 'member-001', spvId: 'spv-001', investorId: 'inv-1', commitmentAmount: 5000000, status: 'confirmed', investorName: 'Inv 1', investorEmail: 'inv1@example.com' },
          { id: 'member-002', spvId: 'spv-001', investorId: 'inv-2', commitmentAmount: 5000000, status: 'confirmed', investorName: 'Inv 2', investorEmail: 'inv2@example.com' },
          { id: 'member-003', spvId: 'spv-001', investorId: 'inv-3', commitmentAmount: 5000000, status: 'confirmed', investorName: 'Inv 3', investorEmail: 'inv3@example.com' }
        ]
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/spv/spv-001')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSPV),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      renderWithRouter(<SPVDashboard />);

      await waitFor(() => {
        // Check that all 3 members are rendered
        expect(screen.getByText(/Inv 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Inv 2/i)).toBeInTheDocument();
        expect(screen.getByText(/Inv 3/i)).toBeInTheDocument();
      });
    });
  });

  describe('Member Status', () => {
    it('should show confirmed members separately', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        dealId: 'deal-001',
        leadInvestorId: 'investor-1',
        targetAmount: 50000000,
        carryPercentage: 20,
        status: 'forming',
        members: [
          {
            id: 'member-001',
            spvId: 'spv-001',
            investorId: 'inv-1',
            commitmentAmount: 5000000,
            status: 'confirmed',
            investorName: 'Confirmed Investor',
            investorEmail: 'confirmed@example.com'
          }
        ]
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/spv/spv-001')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSPV),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      renderWithRouter(<SPVDashboard />);

      await waitFor(() => {
        // Multiple "Confirmed" elements exist: badge on member card and header badge
        const confirmedElements = screen.getAllByText(/confirmed/i);
        expect(confirmedElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SPV Actions', () => {
    it('should show invite button for lead investor', async () => {
      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        dealId: 'deal-001',
        leadInvestorId: 'investor-1',
        targetAmount: 50000000,
        carryPercentage: 20,
        status: 'forming',
        members: []
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/spv/spv-001')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSPV),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      renderWithRouter(<SPVDashboard />);

      await waitFor(() => {
        // Multiple invite buttons may exist (header + empty state)
        const inviteButtons = screen.getAllByText(/invite co-investors/i);
        expect(inviteButtons.length).toBeGreaterThan(0);
      });
    });
  });
});
