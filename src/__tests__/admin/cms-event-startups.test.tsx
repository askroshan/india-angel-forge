/**
 * US-ADMIN-CRUD-003: CMS Event Startups Management
 * 
 * As an: Admin
 * I want to: Create, view, update, and delete event startups in CMS
 * So that: I can manage which startups are displayed on event pages
 * 
 * TDD: RED Phase - Tests for Event Startups tab in CMSManagement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import CMSManagement from '@/pages/admin/CMSManagement';

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-admin-token',
    user: { id: 'admin-1', email: 'admin@example.com', roles: ['admin'] },
    isAuthenticated: true,
  }),
}));

const mockEvents = [
  { id: 'event-1', title: 'Demo Day 2024', date: '2024-07-15T10:00:00Z', status: 'UPCOMING' },
  { id: 'event-2', title: 'Pitch Night 2024', date: '2024-08-01T18:00:00Z', status: 'UPCOMING' },
];

const mockStartups = [
  {
    id: 'startup-1',
    eventId: 'event-1',
    companyName: 'TechCo',
    companyLogoUrl: null,
    founderName: 'Alice Tech',
    founderPhotoUrl: null,
    founderLinkedin: 'https://linkedin.com/in/alicetech',
    pitchDescription: 'AI-powered analytics platform',
    industry: 'Technology',
    fundingStage: 'Seed',
    displayOrder: 1,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'startup-2',
    eventId: 'event-1',
    companyName: 'HealthStart',
    companyLogoUrl: null,
    founderName: 'Bob Health',
    founderPhotoUrl: null,
    founderLinkedin: null,
    pitchDescription: 'Digital health records',
    industry: 'Healthcare',
    fundingStage: 'Pre-Seed',
    displayOrder: 2,
    createdAt: '2024-06-02T10:00:00Z',
    updatedAt: '2024-06-02T10:00:00Z',
  },
];

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderComponent = () => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CMSManagement />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('US-ADMIN-CRUD-003: CMS Event Startups Tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('/api/admin/team-members', () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/admin/partners', () => {
        return HttpResponse.json([]);
      }),
      http.get('/api/admin/events', () => {
        return HttpResponse.json(mockEvents);
      }),
      http.get('/api/events/:eventId/startups', ({ params }) => {
        if (params.eventId === 'event-1') {
          return HttpResponse.json(mockStartups);
        }
        return HttpResponse.json([]);
      })
    );
  });

  describe('Tab Visibility', () => {
    it('should show an Event Startups tab in CMS Management', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /event startups/i })).toBeInTheDocument();
      });
    });

    it('should switch to Event Startups tab when clicked', async () => {
      renderComponent();

      const startupsTab = await screen.findByRole('tab', { name: /event startups/i });
      await userEvent.click(startupsTab);

      await waitFor(() => {
        // Should show event selector label
        expect(screen.getByText('Select an Event')).toBeInTheDocument();
      });
    });
  });

  describe('Event Selection', () => {
    it('should show a dropdown to select an event', async () => {
      renderComponent();

      const startupsTab = await screen.findByRole('tab', { name: /event startups/i });
      await userEvent.click(startupsTab);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should load startups when an event is selected', async () => {
      renderComponent();

      const startupsTab = await screen.findByRole('tab', { name: /event startups/i });
      await userEvent.click(startupsTab);

      // Select event
      const eventSelect = await screen.findByRole('combobox');
      await userEvent.click(eventSelect);

      const eventOption = await screen.findByRole('option', { name: /Demo Day 2024/i });
      await userEvent.click(eventOption);

      await waitFor(() => {
        expect(screen.getByText('TechCo')).toBeInTheDocument();
        expect(screen.getByText('HealthStart')).toBeInTheDocument();
      });
    });
  });

  describe('Display Startups', () => {
    it('should display startup company name and founder', async () => {
      renderComponent();

      const startupsTab = await screen.findByRole('tab', { name: /event startups/i });
      await userEvent.click(startupsTab);

      const eventSelect = await screen.findByRole('combobox');
      await userEvent.click(eventSelect);
      const eventOption = await screen.findByRole('option', { name: /Demo Day 2024/i });
      await userEvent.click(eventOption);

      await waitFor(() => {
        expect(screen.getByText('TechCo')).toBeInTheDocument();
        expect(screen.getByText('Alice Tech')).toBeInTheDocument();
        expect(screen.getByText('HealthStart')).toBeInTheDocument();
        expect(screen.getByText('Bob Health')).toBeInTheDocument();
      });
    });

    it('should display industry and funding stage', async () => {
      renderComponent();

      const startupsTab = await screen.findByRole('tab', { name: /event startups/i });
      await userEvent.click(startupsTab);

      const eventSelect = await screen.findByRole('combobox');
      await userEvent.click(eventSelect);
      const eventOption = await screen.findByRole('option', { name: /Demo Day 2024/i });
      await userEvent.click(eventOption);

      await waitFor(() => {
        expect(screen.getByText('TechCo')).toBeInTheDocument();
        expect(screen.getByText('Technology')).toBeInTheDocument();
        expect(screen.getByText('Seed')).toBeInTheDocument();
      });
    });
  });

  describe('Create Startup', () => {
    it('should show Add Startup button after selecting an event', async () => {
      renderComponent();

      const startupsTab = await screen.findByRole('tab', { name: /event startups/i });
      await userEvent.click(startupsTab);

      const eventSelect = await screen.findByRole('combobox');
      await userEvent.click(eventSelect);
      const eventOption = await screen.findByRole('option', { name: /Demo Day 2024/i });
      await userEvent.click(eventOption);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add startup/i })).toBeInTheDocument();
      });
    });

    it('should open create form when clicking Add Startup', async () => {
      renderComponent();

      const startupsTab = await screen.findByRole('tab', { name: /event startups/i });
      await userEvent.click(startupsTab);

      const eventSelect = await screen.findByRole('combobox');
      await userEvent.click(eventSelect);
      const eventOption = await screen.findByRole('option', { name: /Demo Day 2024/i });
      await userEvent.click(eventOption);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add startup/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /add startup/i }));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByLabelText(/company name/i)).toBeInTheDocument();
        expect(within(dialog).getByLabelText(/founder name/i)).toBeInTheDocument();
      });
    });

    it('should call create API when submitting the form', async () => {
      let createCalled = false;

      server.use(
        http.post('/api/admin/events/:eventId/startups', () => {
          createCalled = true;
          return HttpResponse.json({ id: 'new-startup', companyName: 'NewCo' }, { status: 201 });
        })
      );

      renderComponent();

      const startupsTab = await screen.findByRole('tab', { name: /event startups/i });
      await userEvent.click(startupsTab);

      const eventSelect = await screen.findByRole('combobox');
      await userEvent.click(eventSelect);
      const eventOption = await screen.findByRole('option', { name: /Demo Day 2024/i });
      await userEvent.click(eventOption);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add startup/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /add startup/i }));

      const dialog = await screen.findByRole('dialog');
      await userEvent.type(within(dialog).getByLabelText(/company name/i), 'NewCo');
      await userEvent.type(within(dialog).getByLabelText(/founder name/i), 'New Founder');

      const submitButton = within(dialog).getByRole('button', { name: /create|save|add/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(createCalled).toBe(true);
      });
    });
  });

  describe('Delete Startup', () => {
    it('should show delete button for each startup', async () => {
      renderComponent();

      const startupsTab = await screen.findByRole('tab', { name: /event startups/i });
      await userEvent.click(startupsTab);

      const eventSelect = await screen.findByRole('combobox');
      await userEvent.click(eventSelect);
      const eventOption = await screen.findByRole('option', { name: /Demo Day 2024/i });
      await userEvent.click(eventOption);

      await waitFor(() => {
        expect(screen.getByText('TechCo')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTestId('delete-startup');
      expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should call delete API when confirming deletion', async () => {
      let deleteCalled = false;

      server.use(
        http.delete('/api/admin/events/:eventId/startups/:startupId', () => {
          deleteCalled = true;
          return HttpResponse.json({ success: true });
        })
      );

      renderComponent();

      const startupsTab = await screen.findByRole('tab', { name: /event startups/i });
      await userEvent.click(startupsTab);

      const eventSelect = await screen.findByRole('combobox');
      await userEvent.click(eventSelect);
      const eventOption = await screen.findByRole('option', { name: /Demo Day 2024/i });
      await userEvent.click(eventOption);

      await waitFor(() => {
        expect(screen.getByText('TechCo')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTestId('delete-startup');
      await userEvent.click(deleteButtons[0]);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm|yes|delete$/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(deleteCalled).toBe(true);
      });
    });
  });

  describe('Edit Startup', () => {
    it('should show edit button for each startup', async () => {
      renderComponent();

      const startupsTab = await screen.findByRole('tab', { name: /event startups/i });
      await userEvent.click(startupsTab);

      const eventSelect = await screen.findByRole('combobox');
      await userEvent.click(eventSelect);
      const eventOption = await screen.findByRole('option', { name: /Demo Day 2024/i });
      await userEvent.click(eventOption);

      await waitFor(() => {
        expect(screen.getByText('TechCo')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('edit-startup');
      expect(editButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should call update API when saving edits', async () => {
      let updateCalled = false;

      server.use(
        http.patch('/api/admin/events/:eventId/startups/:startupId', () => {
          updateCalled = true;
          return HttpResponse.json({ ...mockStartups[0], companyName: 'Updated TechCo' });
        })
      );

      renderComponent();

      const startupsTab = await screen.findByRole('tab', { name: /event startups/i });
      await userEvent.click(startupsTab);

      const eventSelect = await screen.findByRole('combobox');
      await userEvent.click(eventSelect);
      const eventOption = await screen.findByRole('option', { name: /Demo Day 2024/i });
      await userEvent.click(eventOption);

      await waitFor(() => {
        expect(screen.getByText('TechCo')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('edit-startup');
      await userEvent.click(editButtons[0]);

      const dialog = await screen.findByRole('dialog');
      const companyInput = within(dialog).getByLabelText(/company name/i);
      await userEvent.clear(companyInput);
      await userEvent.type(companyInput, 'Updated TechCo');

      const submitButton = within(dialog).getByRole('button', { name: /update|save/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(updateCalled).toBe(true);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no startups for selected event', async () => {
      renderComponent();

      const startupsTab = await screen.findByRole('tab', { name: /event startups/i });
      await userEvent.click(startupsTab);

      const eventSelect = await screen.findByRole('combobox');
      await userEvent.click(eventSelect);
      const eventOption = await screen.findByRole('option', { name: /Pitch Night 2024/i });
      await userEvent.click(eventOption);

      await waitFor(() => {
        expect(screen.getByText(/no.*startup/i)).toBeInTheDocument();
      });
    });
  });
});
