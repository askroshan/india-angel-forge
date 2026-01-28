/**
 * US-INVESTOR-007: Submit Investment Commitment
 * 
 * As an: Investor
 * I want to: Submit formal investment commitment
 * So that: I can proceed with fund transfer and SPV membership
 * 
 * Acceptance Criteria:
 * - GIVEN my interest is accepted
 *   WHEN I navigate to commitment page
 *   THEN I see commitment form with SPV details
 * 
 * - GIVEN I fill commitment form
 *   WHEN I submit
 *   THEN commitment is recorded in database
 * 
 * - GIVEN commitment is submitted
 *   WHEN viewing status
 *   THEN I see pending payment status
 * 
 * - GIVEN payment is confirmed
 *   WHEN viewing commitment
 *   THEN status shows paid with receipt
 * 
 * Priority: Critical
 * Status: Implementing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

import InvestmentCommitment from '@/pages/investor/InvestmentCommitment';

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
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ interestId: 'interest-001' }) };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-INVESTOR-007: Submit Investment Commitment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Commitment Form', () => {
    it('should display commitment form for accepted interest', async () => {
      const mockInterest = {
        id: 'interest-001',
        dealId: 'deal-001',
        status: 'accepted',
        commitmentAmount: 1000000,
        spvId: 'spv-001',
        deal: {
          title: 'HealthTech Startup',
          companyName: 'HealthTech Inc'
        }
      };

      const mockSPV = {
        id: 'spv-001',
        name: 'HealthTech SPV 2026',
        targetAmount: 50000000
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/deal-interests/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockInterest),
          });
        }
        if (url.includes('/api/spv/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSPV),
          });
        }
        if (url.includes('/api/commitments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(null),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      renderWithRouter(<InvestmentCommitment />);

      await waitFor(() => {
        expect(screen.getByText(/Investment Commitment/i)).toBeInTheDocument();
        expect(screen.getByText(/HealthTech SPV 2026/i)).toBeInTheDocument();
      });
    });

    it('should show SPV details in form', async () => {
      const mockInterest = {
        id: 'interest-001',
        status: 'accepted',
        commitmentAmount: 1000000,
        spvId: 'spv-001',
        deal: { title: 'Test Deal', companyName: 'Test Co' }
      };

      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        targetAmount: 50000000,
        carryPercentage: 20
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/deal-interests/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockInterest),
          });
        }
        if (url.includes('/api/spv/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSPV),
          });
        }
        if (url.includes('/api/commitments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(null),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      renderWithRouter(<InvestmentCommitment />);

      await waitFor(() => {
        expect(screen.getByText(/Test SPV/i)).toBeInTheDocument();
        expect(screen.getByText(/20%/i)).toBeInTheDocument();
      });
    });
  });

  describe('Commitment Submission', () => {
    it('should allow submitting commitment', async () => {
      const user = userEvent.setup();
      
      const mockInterest = {
        id: 'interest-001',
        status: 'accepted',
        commitmentAmount: 1000000,
        spvId: 'spv-001',
        deal: { title: 'Test Deal', companyName: 'Test Co' }
      };

      const mockSPV = {
        id: 'spv-001',
        name: 'Test SPV',
        targetAmount: 50000000
      };

      global.fetch = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/api/deal-interests/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockInterest),
          });
        }
        if (url.includes('/api/spv/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSPV),
          });
        }
        if (url.includes('/api/commitments') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        if (url.includes('/api/commitments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(null),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      renderWithRouter(<InvestmentCommitment />);

      await waitFor(() => {
        expect(screen.getByText(/Investment Commitment/i)).toBeInTheDocument();
      });

      const confirmCheckbox = screen.getByRole('checkbox');
      await user.click(confirmCheckbox);

      const submitButton = screen.getByRole('button', { name: /submit commitment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/commitment submitted/i)).toBeInTheDocument();
      });
    });

    it('should require confirmation checkbox', async () => {
      const mockInterest = {
        id: 'interest-001',
        status: 'accepted',
        commitmentAmount: 1000000,
        spvId: 'spv-001',
        deal: { title: 'Test Deal', companyName: 'Test Co' }
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/deal-interests/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockInterest),
          });
        }
        if (url.includes('/api/spv/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'spv-001', name: 'Test SPV' }),
          });
        }
        if (url.includes('/api/commitments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(null),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      renderWithRouter(<InvestmentCommitment />);

      await waitFor(() => {
        expect(screen.getByText(/Investment Commitment/i)).toBeInTheDocument();
      });

      // Submit button should be disabled when checkbox not checked
      const submitButton = screen.getByRole('button', { name: /submit commitment/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Payment Status', () => {
    it('should show pending payment status after submission', async () => {
      const mockInterest = {
        id: 'interest-001',
        status: 'accepted',
        commitmentAmount: 1000000,
        spvId: 'spv-001',
        deal: { title: 'Test Deal', companyName: 'Test Co' }
      };

      const mockCommitment = {
        id: 'commitment-001',
        status: 'pending_payment',
        amount: 1000000
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/deal-interests/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockInterest),
          });
        }
        if (url.includes('/api/spv/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'spv-001', name: 'Test SPV' }),
          });
        }
        if (url.includes('/api/commitments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCommitment),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      renderWithRouter(<InvestmentCommitment />);

      await waitFor(() => {
        expect(screen.getByText(/pending payment/i)).toBeInTheDocument();
      });
    });

    it('should show paid status with confirmation', async () => {
      const mockInterest = {
        id: 'interest-001',
        status: 'accepted',
        commitmentAmount: 1000000,
        spvId: 'spv-001',
        deal: { title: 'Test Deal', companyName: 'Test Co' }
      };

      const mockCommitment = {
        id: 'commitment-001',
        status: 'paid',
        amount: 1000000,
        paymentReference: 'PAY-123456'
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/deal-interests/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockInterest),
          });
        }
        if (url.includes('/api/spv/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'spv-001', name: 'Test SPV' }),
          });
        }
        if (url.includes('/api/commitments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCommitment),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      renderWithRouter(<InvestmentCommitment />);

      await waitFor(() => {
        expect(screen.getByText(/paid/i)).toBeInTheDocument();
        expect(screen.getByText(/PAY-123456/i)).toBeInTheDocument();
      });
    });
  });

  describe('Access Control', () => {
    it('should deny access if interest not accepted', async () => {
      const mockInterest = {
        id: 'interest-001',
        status: 'pending', // Not accepted
        commitmentAmount: 1000000,
        deal: { title: 'Test Deal', companyName: 'Test Co' }
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/deal-interests/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockInterest),
          });
        }
        if (url.includes('/api/commitments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(null),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
      });

      renderWithRouter(<InvestmentCommitment />);

      // Wait for the "not accepted" message to appear
      await waitFor(() => {
        expect(screen.getByText(/has not yet been accepted/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});
