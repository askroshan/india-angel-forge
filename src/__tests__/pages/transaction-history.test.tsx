/**
 * N4: Transaction History CSV/PDF Export Toast Feedback
 *
 * As an Investor
 * I want to receive feedback when exporting my transaction history
 * So that I know the download completed or failed
 *
 * Acceptance Criteria:
 * - GIVEN I click "Export CSV"
 *   WHEN the export succeeds
 *   THEN a success toast is shown
 * - GIVEN I click "Export PDF"
 *   WHEN the export succeeds
 *   THEN a success toast is shown
 * - GIVEN I click "Export CSV"
 *   WHEN the export fails (network error)
 *   THEN a destructive toast is shown
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TransactionHistory from '@/pages/TransactionHistory';

// ---- mocks ----------------------------------------------------------------

const mockToast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token',
    user: { id: 'investor-1', email: 'inv@test.com', role: 'investor' },
  }),
}));

// Blob/URL helpers used by exportCSV/exportPDF live in the browser environment.
// jsdom does not implement createObjectURL so we shim it.
beforeEach(() => {
  mockToast.mockClear();
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = vi.fn();
});

// Default successful fetch responses:
//  • First call   → transaction list (fetchTransactions)
//  • Subsequent   → CSV / PDF blob
const makeFetchMock = ({
  exportOk = true,
  networkError = false,
}: { exportOk?: boolean; networkError?: boolean } = {}) => {
  return vi.fn().mockImplementation((url: string) => {
    // Transaction list endpoint
    if ((url as string).includes('/api/payments/history?')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { transactions: [], pagination: null },
          }),
      });
    }

    // Export endpoints
    if (networkError) {
      return Promise.reject(new Error('Network error'));
    }
    if (!exportOk) {
      return Promise.resolve({ ok: false, status: 500, blob: () => Promise.resolve(new Blob()) });
    }
    return Promise.resolve({
      ok: true,
      blob: () => Promise.resolve(new Blob(['col1,col2'], { type: 'text/csv' })),
    });
  });
};

const renderPage = () =>
  render(
    <BrowserRouter>
      <TransactionHistory />
    </BrowserRouter>,
  );

// ---------------------------------------------------------------------------

describe('N4: Transaction History Export Toast Feedback', () => {
  describe('CSV Export', () => {
    it('shows a success toast after a successful CSV export', async () => {
      global.fetch = makeFetchMock();

      renderPage();

      const csvButton = await screen.findByRole('button', { name: /csv/i });
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: expect.stringMatching(/export|success/i) }),
        );
      });
    });

    it('shows a destructive toast when CSV export fails with a network error', async () => {
      global.fetch = makeFetchMock({ networkError: true });

      renderPage();

      // Wait until the transaction list is loaded so the export button is available
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /csv/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /csv/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ variant: 'destructive' }),
        );
      });
    });
  });

  describe('PDF Export', () => {
    it('shows a success toast after a successful PDF export', async () => {
      global.fetch = makeFetchMock();

      renderPage();

      const pdfButton = await screen.findByRole('button', { name: /pdf/i });
      fireEvent.click(pdfButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: expect.stringMatching(/export|success/i) }),
        );
      });
    });
  });
});
