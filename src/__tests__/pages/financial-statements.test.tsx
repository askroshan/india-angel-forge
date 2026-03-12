/**
 * US-INVESTOR-007: Download PDF Financial Statements
 *
 * As an: Investor
 * I want to: See success/error feedback when downloading a PDF statement
 * So that: I know if the download started or failed
 *
 * TDD: RED Phase
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import FinancialStatements from '@/pages/FinancialStatements';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => mockToast(...args),
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token',
    user: { id: 'user-1', email: 'investor@example.com', roles: ['investor'] },
    isAuthenticated: true,
  }),
}));

const mockGet = vi.fn();
vi.mock('@/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockStatements = [
  {
    id: 'stmt-1',
    statementNumber: 'FS-2024-001',
    month: 1,
    year: 2024,
    dateFrom: '2024-01-01',
    dateTo: '2024-01-31',
    format: 'detailed',
    totalInvested: 500000,
    totalRefunded: 0,
    netInvestment: 500000,
    totalTax: 9000,
    cgst: 4500,
    sgst: 4500,
    igst: 0,
    tds: 5000,
    pdfUrl: '/invoices/FS-2024-001.pdf',
    status: 'FINAL',
    generatedAt: '2024-02-01T10:00:00Z',
  },
];

describe('US-INVESTOR-007: PDF Download Feedback', () => {
  beforeEach(() => {
    mockToast.mockClear();
    mockGet.mockResolvedValue(mockStatements);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show a success toast when PDF download is initiated', async () => {
    const user = userEvent.setup();

    // Prevent actual navigation by intercepting click on anchor elements
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(
      <BrowserRouter>
        <FinancialStatements />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('FS-2024-001')).toBeInTheDocument();
    });

    const downloadBtn = screen.getByTestId('download-statement');
    await user.click(downloadBtn);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/download|success/i),
      })
    );
  });

  it('should show an error toast when PDF download fails', async () => {
    const user = userEvent.setup();

    // Simulate click throwing an error
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('Download failed');
    });

    render(
      <BrowserRouter>
        <FinancialStatements />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('FS-2024-001')).toBeInTheDocument();
    });

    const downloadBtn = screen.getByTestId('download-statement');
    await user.click(downloadBtn);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
      })
    );
  });
});

