/**
 * US-INVESTOR-001: Submit Investor Application
 * 
 * As a: Prospective investor
 * I want to: Submit an investment application
 * So that: I can join the angel network
 * 
 * Acceptance Criteria:
 * - Display application form with all required fields
 * - Validate personal information (name, email, phone)
 * - Collect investment profile (sectors, check size, experience)
 * - Submit application via API
 * - Show success message on submission
 * - Handle validation errors
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ApplyInvestor from '@/pages/ApplyInvestor';

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

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    token: '',
  }),
}));

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
        <ApplyInvestor />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('US-INVESTOR-001: Submit Investor Application', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.post as Mock).mockResolvedValue({ data: { success: true } });
  });

  describe('Page Structure', () => {
    it('should display page title', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /apply for membership/i })).toBeInTheDocument();
      });
    });

    it('should display description text', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/join 400\+ angels/i)).toBeInTheDocument();
      });
    });

    it('should display KYC process information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/kyc process/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Display', () => {
    it('should display personal information section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/personal information/i)).toBeInTheDocument();
        expect(screen.getByText(/full name/i)).toBeInTheDocument();
        expect(screen.getByText(/email address/i)).toBeInTheDocument();
        expect(screen.getByText(/phone number/i)).toBeInTheDocument();
      });
    });

    it('should display professional details section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/professional details/i)).toBeInTheDocument();
        expect(screen.getByText(/current role/i)).toBeInTheDocument();
      });
    });

    it('should display investment profile section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/investment profile/i)).toBeInTheDocument();
        expect(screen.getByText(/investment thesis/i)).toBeInTheDocument();
      });
    });

    it('should display sector options', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/preferred sectors/i)).toBeInTheDocument();
        expect(screen.getByText(/fintech/i)).toBeInTheDocument();
        expect(screen.getByText(/healthcare/i)).toBeInTheDocument();
        expect(screen.getByText(/saas/i)).toBeInTheDocument();
      });
    });

    it('should display accreditation section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/accreditation/i)).toBeInTheDocument();
        expect(screen.getByText(/net worth range/i)).toBeInTheDocument();
      });
    });

    it('should display submit button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should display required field indicators', async () => {
      renderComponent();

      await waitFor(() => {
        // Required fields have asterisks
        expect(screen.getByText(/full name \*/i)).toBeInTheDocument();
        expect(screen.getByText(/email address \*/i)).toBeInTheDocument();
      });
    });
  });

  describe('Membership Types', () => {
    it('should display membership plan section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/membership plan \*/i)).toBeInTheDocument();
      });
    });
  });
});
