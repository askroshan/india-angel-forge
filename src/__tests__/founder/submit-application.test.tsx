/**
 * US-FOUNDER-001: Submit Founder Application
 * 
 * As a: Startup founder
 * I want to: Submit a funding application
 * So that: I can pitch to angel investors
 * 
 * Acceptance Criteria:
 * - Display application form with all required fields
 * - Collect company information (name, website, sector, stage)
 * - Collect founder details (name, email, phone)
 * - Collect business details (problem, solution, traction)
 * - Submit application via API
 * - Show success message on submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ApplyFounder from '@/pages/ApplyFounder';

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
        <ApplyFounder />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('US-FOUNDER-001: Submit Founder Application', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.post as Mock).mockResolvedValue({ data: { success: true } });
  });

  describe('Page Structure', () => {
    it('should display page title', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /apply for funding/i })).toBeInTheDocument();
      });
    });

    it('should display description text', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/join 40\+ companies funded/i)).toBeInTheDocument();
      });
    });

    it('should display fee information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/application is free/i)).toBeInTheDocument();
        expect(screen.getByText(/₹50,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Display - Company Information', () => {
    it('should display company information section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/company information/i)).toBeInTheDocument();
        expect(screen.getByText(/company name \*/i)).toBeInTheDocument();
        expect(screen.getByText(/company website/i)).toBeInTheDocument();
      });
    });

    it('should display industry sector field', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/industry sector \*/i)).toBeInTheDocument();
      });
    });

    it('should display funding stage field', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/funding stage \*/i)).toBeInTheDocument();
      });
    });

    it('should display location field', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/location \*/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Display - Founder Information', () => {
    it('should display founder information section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/founder information/i)).toBeInTheDocument();
        expect(screen.getByText(/your full name \*/i)).toBeInTheDocument();
      });
    });

    it('should display contact fields', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/email address \*/i)).toBeInTheDocument();
        expect(screen.getByText(/phone number \*/i)).toBeInTheDocument();
      });
    });

    it('should display optional fields', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/linkedin profile/i)).toBeInTheDocument();
        expect(screen.getByText(/co-founders/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Display - Business Details', () => {
    it('should display business details section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/business details/i)).toBeInTheDocument();
      });
    });

    it('should display problem statement and solution description fields', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/problem statement \*/i)).toBeInTheDocument();
        expect(screen.getByText(/solution description \*/i)).toBeInTheDocument();
      });
    });

    it('should display target market and business model fields', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/target market \*/i)).toBeInTheDocument();
        expect(screen.getByText(/business model \*/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Display - Funding Information', () => {
    it('should display funding information section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/funding information/i)).toBeInTheDocument();
      });
    });

    it('should display amount raising field', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/amount raising \*/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submit', () => {
    it('should display submit button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument();
      });
    });
  });
});
