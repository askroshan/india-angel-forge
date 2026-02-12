/**
 * US-ADMIN-CRUD-002: Invoice Admin Management
 * 
 * As an: Admin
 * I want to: View failed invoices, retry generation, and monitor queue health
 * So that: I can ensure all invoices are properly generated
 * 
 * TDD: RED Phase - Tests for new Invoice Admin page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import InvoiceManagement from '@/pages/admin/InvoiceManagement';

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-admin-token',
    user: { id: 'admin-1', email: 'admin@example.com', roles: ['admin'] },
    isAuthenticated: true,
  }),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockFailedInvoices = [
  {
    id: 'inv-1',
    paymentId: 'pay-1',
    userId: 'user-1',
    error: 'PDF generation timeout',
    attempts: 3,
    lastAttemptAt: '2024-06-15T10:00:00Z',
    payment: {
      id: 'pay-1',
      amount: 5000,
      currency: 'INR',
      status: 'completed',
      user: { email: 'investor@example.com', fullName: 'John Investor' },
    },
  },
  {
    id: 'inv-2',
    paymentId: 'pay-2',
    userId: 'user-2',
    error: 'Template not found',
    attempts: 1,
    lastAttemptAt: '2024-06-14T10:00:00Z',
    payment: {
      id: 'pay-2',
      amount: 10000,
      currency: 'INR',
      status: 'completed',
      user: { email: 'founder@example.com', fullName: 'Jane Founder' },
    },
  },
];

const mockQueueMetrics = {
  pendingJobs: 5,
  failedJobs: 2,
  completedJobs: 150,
  activeJobs: 1,
};

const mockCleanupStats = {
  totalInvoices: 200,
  failedInvoices: 2,
  successRate: 99,
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <InvoiceManagement />
    </BrowserRouter>
  );
};

describe('US-ADMIN-CRUD-002: Invoice Management Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('/api/admin/invoices/failed', () => {
        return HttpResponse.json(mockFailedInvoices);
      }),
      http.get('/api/admin/invoices/queue-metrics', () => {
        return HttpResponse.json(mockQueueMetrics);
      }),
      http.get('/api/admin/invoices/cleanup-stats', () => {
        return HttpResponse.json(mockCleanupStats);
      })
    );
  });

  describe('Page Layout', () => {
    it('should render the Invoice Management page title', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/invoice management/i)).toBeInTheDocument();
      });
    });

    it('should display queue metrics cards', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/pending/i)).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
      });
    });
  });

  describe('Failed Invoices List', () => {
    it('should display list of failed invoices', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('investor@example.com')).toBeInTheDocument();
        expect(screen.getByText('founder@example.com')).toBeInTheDocument();
      });
    });

    it('should show error message for each failed invoice', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/PDF generation timeout/i)).toBeInTheDocument();
        expect(screen.getByText(/Template not found/i)).toBeInTheDocument();
      });
    });

    it('should show attempt count for each failed invoice', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/3 attempts/i)).toBeInTheDocument();
        expect(screen.getByText(/1 attempt/i)).toBeInTheDocument();
      });
    });

    it('should show payment amount for each failed invoice', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/5,?000/)).toBeInTheDocument();
        expect(screen.getByText(/10,?000/)).toBeInTheDocument();
      });
    });
  });

  describe('Retry Single Invoice', () => {
    it('should show a retry button for each failed invoice', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('investor@example.com')).toBeInTheDocument();
      });

      const retryButtons = screen.getAllByRole('button', { name: /retry/i });
      expect(retryButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should call retry API when clicking retry button', async () => {
      let retryCalled = false;
      let retriedPaymentId = '';

      server.use(
        http.post('/api/admin/invoices/:paymentId/retry', ({ params }) => {
          retryCalled = true;
          retriedPaymentId = params.paymentId as string;
          return HttpResponse.json({ success: true, message: 'Invoice retry queued' });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('investor@example.com')).toBeInTheDocument();
      });

      // Get only the individual Retry buttons (not Retry All Failed)
      const retryButtons = screen.getAllByRole('button', { name: /^retry$/i });
      await userEvent.click(retryButtons[0]);

      await waitFor(() => {
        expect(retryCalled).toBe(true);
        expect(retriedPaymentId).toBe('pay-1');
      });
    });

    it('should show success toast after retry', async () => {
      server.use(
        http.post('/api/admin/invoices/:paymentId/retry', () => {
          return HttpResponse.json({ success: true, message: 'Invoice retry queued' });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('investor@example.com')).toBeInTheDocument();
      });

      const retryButtons = screen.getAllByRole('button', { name: /^retry$/i });
      await userEvent.click(retryButtons[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Success',
          })
        );
      });
    });
  });

  describe('Batch Retry', () => {
    it('should show a Retry All Failed button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('investor@example.com')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /retry all/i })).toBeInTheDocument();
    });

    it('should call batch retry API when clicking Retry All', async () => {
      let batchRetryCalled = false;

      server.use(
        http.post('/api/admin/invoices/retry-batch', () => {
          batchRetryCalled = true;
          return HttpResponse.json({ success: true, queued: 2 });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('investor@example.com')).toBeInTheDocument();
      });

      const retryAllButton = screen.getByRole('button', { name: /retry all/i });
      await userEvent.click(retryAllButton);

      await waitFor(() => {
        expect(batchRetryCalled).toBe(true);
      });
    });
  });

  describe('Empty State', () => {
    it('should show a success message when no failed invoices', async () => {
      server.use(
        http.get('/api/admin/invoices/failed', () => {
          return HttpResponse.json([]);
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no failed invoices/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error when API fails to load', async () => {
      server.use(
        http.get('/api/admin/invoices/failed', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
          })
        );
      });
    });
  });
});
