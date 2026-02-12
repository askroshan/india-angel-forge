/**
 * US-ADMIN-CRUD-004: Companies Admin Management
 * 
 * As an: Admin
 * I want to: View and delete company profiles
 * So that: I can manage companies on the platform
 * 
 * TDD: RED Phase - Tests for Companies Admin page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import CompanyManagement from '@/pages/admin/CompanyManagement';

// Mock navigation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

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

const mockCompanies = [
  {
    id: 'comp-1',
    name: 'TechCorp',
    description: 'A technology company',
    sector: 'Technology',
    stage: 'Series A',
    website: 'https://techcorp.com',
    location: 'Mumbai',
    founder: { email: 'founder1@example.com', fullName: 'Alice Founder' },
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'comp-2',
    name: 'HealthInc',
    description: 'Healthcare startup',
    sector: 'Healthcare',
    stage: 'Seed',
    website: 'https://healthinc.com',
    location: 'Delhi',
    founder: { email: 'founder2@example.com', fullName: 'Bob Builder' },
    createdAt: '2024-02-20T10:00:00Z',
  },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <CompanyManagement />
    </BrowserRouter>
  );
};

describe('US-ADMIN-CRUD-004: Company Management Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('/api/admin/companies', () => {
        return HttpResponse.json(mockCompanies);
      })
    );
  });

  describe('Page Layout', () => {
    it('should render the Company Management page title', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/company management/i)).toBeInTheDocument();
      });
    });

    it('should display list of companies', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechCorp')).toBeInTheDocument();
        expect(screen.getByText('HealthInc')).toBeInTheDocument();
      });
    });

    it('should display company details', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechCorp')).toBeInTheDocument();
      });

      // Check sector badges and stage
      await waitFor(() => {
        expect(screen.getByText('Technology')).toBeInTheDocument();
        expect(screen.getByText('Series A')).toBeInTheDocument();
      });
    });

    it('should display founder info', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechCorp')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Alice Founder/)).toBeInTheDocument();
        expect(screen.getByText(/Bob Builder/)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    it('should have a search input', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });
    });

    it('should filter companies by search query', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechCorp')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await userEvent.type(searchInput, 'Health');

      await waitFor(() => {
        expect(screen.getByText('HealthInc')).toBeInTheDocument();
        expect(screen.queryByText('TechCorp')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Company', () => {
    it('should show delete button for each company', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechCorp')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should show confirmation dialog before deletion', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechCorp')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });
    });

    it('should call DELETE API when confirming', async () => {
      let deleteCalled = false;

      server.use(
        http.delete('/api/admin/companies/:companyId', () => {
          deleteCalled = true;
          return HttpResponse.json({ success: true });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechCorp')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm|yes|delete$/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(deleteCalled).toBe(true);
      });
    });

    it('should show success toast after deletion', async () => {
      server.use(
        http.delete('/api/admin/companies/:companyId', () => {
          return HttpResponse.json({ success: true });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechCorp')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm|yes|delete$/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Success',
          })
        );
      });
    });
  });

  describe('Empty State', () => {
    it('should show message when no companies', async () => {
      server.use(
        http.get('/api/admin/companies', () => {
          return HttpResponse.json([]);
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no companies/i)).toBeInTheDocument();
      });
    });
  });
});
