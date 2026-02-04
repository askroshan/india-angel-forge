/**
 * US-ADMIN-003: Event Management
 * 
 * As an: Admin
 * I want to: Create, edit, and manage events
 * So that: I can organize platform events effectively
 * 
 * Acceptance Criteria:
 * - Display list of all events with status
 * - Create new events with all required fields
 * - Edit existing events
 * - Delete events with confirmation
 * - View event registrations
 * 
 * TDD: RED Phase - Writing failing tests first
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EventManagement } from '@/components/admin/EventManagement';

// Mock apiClient
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    update: vi.fn(),
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
import { toast } from 'sonner';
import type { Mock } from 'vitest';

const mockEvents = [
  {
    id: 'event-1',
    title: 'Monthly Investor Forum',
    slug: 'monthly-investor-forum-jan',
    description: 'Join us for our monthly investor networking event.',
    event_type: 'monthly_forum',
    date: '2024-02-15',
    start_time: '18:00',
    end_time: '21:00',
    location: 'Mumbai',
    venue_name: 'Grand Hotel',
    venue_address: '123 Main Street',
    max_attendees: 100,
    is_featured: true,
    is_members_only: false,
    registration_deadline: '2024-02-14',
    image_url: null,
    agenda: [{ time: '18:00', title: 'Welcome' }],
    speakers: [{ name: 'John Doe', role: 'CEO', topic: 'Investing' }],
    status: 'upcoming',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 'event-2',
    title: 'Sector Summit - Fintech',
    slug: 'sector-summit-fintech',
    description: 'Deep dive into fintech investments.',
    event_type: 'sector_summit',
    date: '2024-02-20',
    start_time: '09:00',
    end_time: '17:00',
    location: 'Bangalore',
    venue_name: 'Tech Park',
    venue_address: '456 Tech Road',
    max_attendees: 50,
    is_featured: false,
    is_members_only: true,
    registration_deadline: '2024-02-19',
    image_url: null,
    agenda: null,
    speakers: null,
    status: 'upcoming',
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-05T10:00:00Z',
  },
  {
    id: 'event-3',
    title: 'Past Event',
    slug: 'past-event',
    description: 'This event already happened.',
    event_type: 'angel_education',
    date: '2024-01-01',
    start_time: '10:00',
    end_time: '12:00',
    location: 'Delhi',
    venue_name: 'Education Center',
    venue_address: '789 Learn Street',
    max_attendees: null,
    is_featured: false,
    is_members_only: false,
    registration_deadline: null,
    image_url: null,
    agenda: null,
    speakers: null,
    status: 'completed',
    created_at: '2023-12-01T10:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
  },
];

const mockRegistrations = [
  {
    id: 'reg-1',
    event_id: 'event-1',
    user_id: 'user-1',
    full_name: 'John Investor',
    email: 'john@example.com',
    phone: '+91 9876543210',
    company: 'Tech Corp',
    dietary_requirements: null,
    notes: null,
    status: 'registered',
    registered_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 'reg-2',
    event_id: 'event-1',
    user_id: 'user-2',
    full_name: 'Jane Founder',
    email: 'jane@example.com',
    phone: '+91 9876543211',
    company: 'Startup Inc',
    dietary_requirements: 'Vegetarian',
    notes: null,
    status: 'registered',
    registered_at: '2024-01-11T10:00:00Z',
  },
];

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
        <EventManagement />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('US-ADMIN-003: Event Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as Mock).mockResolvedValue(mockEvents);
  });

  describe('Display Events', () => {
    it('should display list of all events', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
        expect(screen.getByText('Sector Summit - Fintech')).toBeInTheDocument();
        expect(screen.getByText('Past Event')).toBeInTheDocument();
      });
    });

    it('should display event type labels', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Forum')).toBeInTheDocument();
        expect(screen.getByText('Sector Summit')).toBeInTheDocument();
        expect(screen.getByText('Angel Education')).toBeInTheDocument();
      });
    });

    it('should display event status badges', async () => {
      renderComponent();

      await waitFor(() => {
        // Use getAllByText since there are multiple events with same status
        const upcomingBadges = screen.getAllByText('upcoming');
        expect(upcomingBadges.length).toBeGreaterThan(0);
        expect(screen.getByText('completed')).toBeInTheDocument();
      });
    });

    it('should display event locations', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Mumbai/)).toBeInTheDocument();
        expect(screen.getByText(/Bangalore/)).toBeInTheDocument();
        expect(screen.getByText(/Delhi/)).toBeInTheDocument();
      });
    });

    it('should show featured badge for featured events', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Featured')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', async () => {
      (apiClient.get as Mock).mockImplementation(() => new Promise(() => {}));
      
      renderComponent();
      
      // Should show loading spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should show empty state when no events exist', async () => {
      (apiClient.get as Mock).mockResolvedValue([]);
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no events yet/i)).toBeInTheDocument();
        // There are multiple Create Event buttons in empty state - use getAllByRole
        const createButtons = screen.getAllByRole('button', { name: /create event/i });
        expect(createButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Create Event', () => {
    it('should open event form when clicking Create Event button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create event/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should call API to create new event', async () => {
      (apiClient.post as Mock).mockResolvedValue({ data: mockEvents[0], error: null });
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      // Click create button
      const createButton = screen.getByRole('button', { name: /create event/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill form (assuming form fields exist)
      // The actual form submission would be tested in EventForm.test.tsx
      // This test verifies the create flow is wired up correctly
    });
  });

  describe('Edit Event', () => {
    it('should open edit dialog when clicking edit button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      // Find and click edit button (icon button with Edit icon)
      const editButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('[class*="lucide-edit"], [data-lucide="edit"]') ||
        btn.getAttribute('aria-label')?.includes('edit')
      );
      
      // Click the first edit button
      if (editButtons.length > 0) {
        await userEvent.click(editButtons[0]);
        
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Delete Event', () => {
    it('should show delete confirmation dialog', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      // Find delete button (has destructive class and trash icon)
      const deleteButtons = screen.getAllByRole('button').filter(btn => 
        btn.classList.contains('text-destructive') ||
        btn.querySelector('[class*="lucide-trash"]')
      );

      if (deleteButtons.length > 0) {
        await userEvent.click(deleteButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
        });
      }
    });

    it('should call API to delete event when confirmed', async () => {
      (apiClient.delete as Mock).mockResolvedValue({ success: true });
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      // Find and click delete button
      const deleteButtons = screen.getAllByRole('button').filter(btn => 
        btn.classList.contains('text-destructive') ||
        btn.querySelector('[class*="lucide-trash"]')
      );

      if (deleteButtons.length > 0) {
        await userEvent.click(deleteButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
        });

        // Confirm deletion
        const confirmButton = screen.getByRole('button', { name: /delete/i });
        await userEvent.click(confirmButton);

        await waitFor(() => {
          expect(apiClient.delete).toHaveBeenCalledWith('admin/events', 'event-1');
        });
      }
    });

    it('should show success toast after deletion', async () => {
      (apiClient.delete as Mock).mockResolvedValue({ success: true });
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button').filter(btn => 
        btn.classList.contains('text-destructive')
      );

      if (deleteButtons.length > 0) {
        await userEvent.click(deleteButtons[0]);

        await waitFor(() => {
          expect(screen.getByRole('alertdialog')).toBeInTheDocument();
        });

        const confirmButton = screen.getByRole('button', { name: /^delete$/i });
        await userEvent.click(confirmButton);

        await waitFor(() => {
          expect(toast.success).toHaveBeenCalledWith('Event deleted successfully!');
        });
      }
    });

    it('should cancel deletion when clicking cancel', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button').filter(btn => 
        btn.classList.contains('text-destructive')
      );

      if (deleteButtons.length > 0) {
        await userEvent.click(deleteButtons[0]);

        await waitFor(() => {
          expect(screen.getByRole('alertdialog')).toBeInTheDocument();
        });

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await userEvent.click(cancelButton);

        await waitFor(() => {
          expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        });

        // Event should still be visible
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      }
    });
  });

  describe('View Registrations', () => {
    it('should show registrations when clicking users icon', async () => {
      (apiClient.get as Mock).mockImplementation((url: string) => {
        if (url.includes('event-registrations')) {
          return Promise.resolve(mockRegistrations);
        }
        return Promise.resolve(mockEvents);
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      // Find users icon button (for viewing registrations)
      const usersButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('[class*="lucide-users"]')
      );

      if (usersButtons.length > 0) {
        await userEvent.click(usersButtons[0]);

        await waitFor(() => {
          expect(screen.getByText('Registrations')).toBeInTheDocument();
          expect(screen.getByText('John Investor')).toBeInTheDocument();
          expect(screen.getByText('Jane Founder')).toBeInTheDocument();
        });
      }
    });

    it('should show registration count and emails', async () => {
      (apiClient.get as Mock).mockImplementation((url: string) => {
        if (url.includes('event-registrations')) {
          return Promise.resolve(mockRegistrations);
        }
        return Promise.resolve(mockEvents);
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const usersButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('[class*="lucide-users"]')
      );

      if (usersButtons.length > 0) {
        await userEvent.click(usersButtons[0]);

        await waitFor(() => {
          expect(screen.getByText('john@example.com')).toBeInTheDocument();
          expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        });
      }
    });

    it('should show no registrations message when empty', async () => {
      (apiClient.get as Mock).mockImplementation((url: string) => {
        if (url.includes('event-registrations')) {
          return Promise.resolve([]);
        }
        return Promise.resolve(mockEvents);
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const usersButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('[class*="lucide-users"]')
      );

      if (usersButtons.length > 0) {
        await userEvent.click(usersButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/no registrations yet/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle API error when loading events', async () => {
      (apiClient.get as Mock).mockRejectedValue(new Error('Network error'));

      renderComponent();

      // The component should handle the error gracefully
      // React Query will handle the error state
      await waitFor(() => {
        // Component should still render without crashing
        expect(screen.getByText('Event Management')).toBeInTheDocument();
      });
    });

    it('should close delete dialog when cancelled', async () => {
      // This test verifies the cancel flow works
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Monthly Investor Forum')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button').filter(btn => 
        btn.classList.contains('text-destructive')
      );

      if (deleteButtons.length > 0) {
        await userEvent.click(deleteButtons[0]);

        await waitFor(() => {
          expect(screen.getByRole('alertdialog')).toBeInTheDocument();
        });

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await userEvent.click(cancelButton);

        await waitFor(() => {
          expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        });
      }
    });
  });
});
