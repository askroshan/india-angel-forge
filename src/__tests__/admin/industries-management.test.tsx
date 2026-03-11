/**
 * US-SEED-001: Admin Manage Industries
 * US-SEED-002: Admin Manage Funding Stages
 *
 * As an: Admin
 * I want to: Add/edit/disable industries and funding stages
 * So that: I can keep platform options current
 *
 * TDD: RED Phase
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import SeedDataManagement from '@/pages/admin/SeedDataManagement';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-admin-token',
    user: { id: 'admin-1', email: 'admin@example.com', roles: ['admin'] },
    isAuthenticated: true,
  }),
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockIndustries = [
  { id: 'ind-1', name: 'Technology', code: 'TECH', description: 'Tech sector', displayOrder: 1, isActive: true },
  { id: 'ind-2', name: 'Healthcare', code: 'HEALTH', description: 'Health sector', displayOrder: 2, isActive: true },
  { id: 'ind-3', name: 'Legacy Industry', code: 'LEGACY', description: 'Old sector', displayOrder: 3, isActive: false },
];

const mockFundingStages = [
  { id: 'fs-1', name: 'Pre-Seed', code: 'PRE_SEED', description: 'Early stage', typicalMin: 500000, typicalMax: 2000000, displayOrder: 1, isActive: true },
  { id: 'fs-2', name: 'Seed', code: 'SEED', description: 'Seed stage', typicalMin: 2000000, typicalMax: 10000000, displayOrder: 2, isActive: true },
];

const renderComponent = () =>
  render(<BrowserRouter><SeedDataManagement /></BrowserRouter>);

describe('US-SEED-001: Admin Manage Industries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('/api/admin/industries', () => HttpResponse.json(mockIndustries)),
      http.get('/api/admin/funding-stages', () => HttpResponse.json(mockFundingStages)),
      http.post('/api/admin/industries', () => HttpResponse.json({ id: 'ind-new', name: 'New Industry', code: 'NEW_IND', displayOrder: 4, isActive: true }, { status: 201 })),
      http.patch('/api/admin/industries/:id', () => HttpResponse.json({ id: 'ind-1', name: 'Technology Updated', code: 'TECH', displayOrder: 1, isActive: true })),
      http.delete('/api/admin/industries/:id', () => HttpResponse.json({ message: 'Industry disabled' })),
    );
  });

  describe('Page Layout', () => {
    it('should display Industries tab', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /industries/i })).toBeInTheDocument();
      });
    });

    it('should list all industries with active/inactive states', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Technology')).toBeInTheDocument();
        expect(screen.getByText('Healthcare')).toBeInTheDocument();
        expect(screen.getByText('Legacy Industry')).toBeInTheDocument();
      });
    });

    it('should show active badge for active industries', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Technology')).toBeInTheDocument();
      });
      const activeBadges = screen.getAllByText(/^Active$/i);
      expect(activeBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('should show inactive badge for disabled industries', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Legacy Industry')).toBeInTheDocument();
      });
      expect(screen.getByText(/inactive/i)).toBeInTheDocument();
    });
  });

  describe('Create Industry', () => {
    it('should show Add Industry button', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add industry/i })).toBeInTheDocument();
      });
    });

    it('should open create form when clicking Add Industry', async () => {
      renderComponent();
      const addBtn = await screen.findByRole('button', { name: /add industry/i });
      await userEvent.click(addBtn);
      await waitFor(() => {
        expect(screen.getByLabelText(/industry name/i)).toBeInTheDocument();
      });
    });

    it('should call POST API when submitting new industry', async () => {
      let postCalled = false;
      server.use(
        http.post('/api/admin/industries', () => {
          postCalled = true;
          return HttpResponse.json({ id: 'ind-new', name: 'FinTech', code: 'FINTECH', displayOrder: 4, isActive: true }, { status: 201 });
        }),
      );
      renderComponent();
      await userEvent.click(await screen.findByRole('button', { name: /add industry/i }));
      await userEvent.type(await screen.findByLabelText(/industry name/i), 'FinTech');
      const codeField = screen.getByLabelText(/^code$/i);
      await userEvent.type(codeField, 'FINTECH');
      await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
      await waitFor(() => expect(postCalled).toBe(true));
    });
  });

  describe('Edit Industry', () => {
    it('should open edit form with existing data when clicking Edit', async () => {
      renderComponent();
      await waitFor(() => expect(screen.getByText('Technology')).toBeInTheDocument());
      const editBtns = screen.getAllByRole('button', { name: /^edit$/i });
      await userEvent.click(editBtns[0]);
      await waitFor(() => {
        const nameField = screen.getByDisplayValue('Technology');
        expect(nameField).toBeInTheDocument();
      });
    });

    it('should call PATCH API when saving edits', async () => {
      let patchCalled = false;
      server.use(
        http.patch('/api/admin/industries/:id', () => {
          patchCalled = true;
          return HttpResponse.json({ id: 'ind-1', name: 'Technology Updated', code: 'TECH', displayOrder: 1, isActive: true });
        }),
      );
      renderComponent();
      await waitFor(() => expect(screen.getByText('Technology')).toBeInTheDocument());
      const editBtns = screen.getAllByRole('button', { name: /^edit$/i });
      await userEvent.click(editBtns[0]);
      const nameField = await screen.findByDisplayValue('Technology');
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'Technology Updated');
      await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
      await waitFor(() => expect(patchCalled).toBe(true));
    });
  });

  describe('Disable Industry', () => {
    it('should call DELETE API when disabling industry', async () => {
      let deleteCalled = false;
      server.use(
        http.delete('/api/admin/industries/:id', () => {
          deleteCalled = true;
          return HttpResponse.json({ message: 'Industry disabled' });
        }),
      );
      renderComponent();
      await waitFor(() => expect(screen.getByText('Technology')).toBeInTheDocument());
      const disableBtns = screen.getAllByRole('button', { name: /disable/i });
      await userEvent.click(disableBtns[0]);
      const confirmBtn = await screen.findByRole('button', { name: /^disable$/i });
      await userEvent.click(confirmBtn);
      await waitFor(() => expect(deleteCalled).toBe(true));
    });
  });
});

describe('US-SEED-002: Admin Manage Funding Stages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('/api/admin/industries', () => HttpResponse.json(mockIndustries)),
      http.get('/api/admin/funding-stages', () => HttpResponse.json(mockFundingStages)),
      http.post('/api/admin/funding-stages', () => HttpResponse.json({ id: 'fs-new', name: 'Series A', code: 'SERIES_A', displayOrder: 3, isActive: true }, { status: 201 })),
      http.patch('/api/admin/funding-stages/:id', () => HttpResponse.json({ id: 'fs-1', name: 'Pre-Seed Updated', code: 'PRE_SEED', displayOrder: 1, isActive: true })),
      http.delete('/api/admin/funding-stages/:id', () => HttpResponse.json({ message: 'Stage disabled' })),
    );
  });

  describe('Page Layout', () => {
    it('should display Funding Stages tab', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /funding stages/i })).toBeInTheDocument();
      });
    });

    it('should list all funding stages when tab is clicked', async () => {
      renderComponent();
      const tab = await screen.findByRole('tab', { name: /funding stages/i });
      await userEvent.click(tab);
      await waitFor(() => {
        expect(screen.getByText('Pre-Seed')).toBeInTheDocument();
        expect(screen.getByText('Seed')).toBeInTheDocument();
      });
    });

    it('should display typical amount range for stages', async () => {
      renderComponent();
      const tab = await screen.findByRole('tab', { name: /funding stages/i });
      await userEvent.click(tab);
      await waitFor(() => {
        expect(screen.getByText('Pre-Seed')).toBeInTheDocument();
      });
      // Should show the range somewhere
      expect(screen.getAllByText(/typical/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Create Funding Stage', () => {
    it('should show Add Funding Stage button', async () => {
      renderComponent();
      const tab = await screen.findByRole('tab', { name: /funding stages/i });
      await userEvent.click(tab);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add.*stage/i })).toBeInTheDocument();
      });
    });

    it('should call POST API when creating a new funding stage', async () => {
      let postCalled = false;
      server.use(
        http.post('/api/admin/funding-stages', () => {
          postCalled = true;
          return HttpResponse.json({ id: 'fs-new', name: 'Series A', code: 'SERIES_A', displayOrder: 3, isActive: true }, { status: 201 });
        }),
      );
      renderComponent();
      const tab = await screen.findByRole('tab', { name: /funding stages/i });
      await userEvent.click(tab);
      const addBtn = await screen.findByRole('button', { name: /add.*stage/i });
      await userEvent.click(addBtn);
      await userEvent.type(await screen.findByLabelText(/stage name/i), 'Series A');
      const codeField = screen.getByLabelText(/^code$/i);
      await userEvent.type(codeField, 'SERIES_A');
      await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
      await waitFor(() => expect(postCalled).toBe(true));
    });
  });

  describe('Edit Funding Stage', () => {
    it('should call PATCH API when editing a funding stage', async () => {
      let patchCalled = false;
      server.use(
        http.patch('/api/admin/funding-stages/:id', () => {
          patchCalled = true;
          return HttpResponse.json({ id: 'fs-1', name: 'Pre-Seed Updated', code: 'PRE_SEED', displayOrder: 1, isActive: true });
        }),
      );
      renderComponent();
      const tab = await screen.findByRole('tab', { name: /funding stages/i });
      await userEvent.click(tab);
      await waitFor(() => expect(screen.getByText('Pre-Seed')).toBeInTheDocument());
      const editBtns = screen.getAllByRole('button', { name: /^edit$/i });
      await userEvent.click(editBtns[0]);
      const nameField = await screen.findByDisplayValue('Pre-Seed');
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'Pre-Seed Updated');
      await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
      await waitFor(() => expect(patchCalled).toBe(true));
    });
  });

  describe('Disable Funding Stage', () => {
    it('should call DELETE API when disabling a funding stage', async () => {
      let deleteCalled = false;
      server.use(
        http.delete('/api/admin/funding-stages/:id', () => {
          deleteCalled = true;
          return HttpResponse.json({ message: 'Stage disabled' });
        }),
      );
      renderComponent();
      const tab = await screen.findByRole('tab', { name: /funding stages/i });
      await userEvent.click(tab);
      await waitFor(() => expect(screen.getByText('Pre-Seed')).toBeInTheDocument());
      const disableBtns = screen.getAllByRole('button', { name: /disable/i });
      await userEvent.click(disableBtns[0]);
      const confirmBtn = await screen.findByRole('button', { name: /^disable$/i });
      await userEvent.click(confirmBtn);
      await waitFor(() => expect(deleteCalled).toBe(true));
    });
  });
});
