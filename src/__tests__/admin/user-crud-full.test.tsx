/**
 * US-ADMIN-CRUD-001: Full User CRUD
 * 
 * As an: Admin
 * I want to: Create, view, update roles, and delete users
 * So that: I have full control over platform user management
 * 
 * TDD: RED Phase - Tests for missing delete button + create user functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import UserRoleManagement from '@/pages/admin/UserRoleManagement';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
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

const mockUsers = [
  {
    id: 'user-1',
    email: 'investor@example.com',
    fullName: 'John Investor',
    createdAt: '2024-01-15T10:00:00Z',
    role: 'user',
  },
  {
    id: 'user-2',
    email: 'moderator@example.com',
    fullName: 'Jane Moderator',
    createdAt: '2024-01-16T10:00:00Z',
    role: 'moderator',
  },
  {
    id: 'admin-1',
    email: 'admin@example.com',
    fullName: 'Admin User',
    createdAt: '2024-01-10T10:00:00Z',
    role: 'admin',
  },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <UserRoleManagement />
    </BrowserRouter>
  );
};

describe('US-ADMIN-CRUD-001: User Delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('/api/admin/users', () => {
        return HttpResponse.json(mockUsers);
      })
    );
  });

  it('should show a delete button for each non-admin user', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Investor')).toBeInTheDocument();
    });

    // Each non-admin user card should have a delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2); // user-1 and user-2
  });

  it('should NOT show delete button for the current admin user', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    // Find the admin user's card
    const adminCard = screen.getByText('Admin User').closest('[class*="card"]') || screen.getByText('Admin User').parentElement?.parentElement;
    // Admin user should not have a delete button
    if (adminCard) {
      const deleteBtn = within(adminCard as HTMLElement).queryByRole('button', { name: /delete/i });
      expect(deleteBtn).not.toBeInTheDocument();
    }
  });

  it('should show confirmation dialog when clicking delete', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Investor')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });
  });

  it('should call DELETE API when confirming deletion', async () => {
    let deleteCalled = false;
    let deletedUserId = '';

    server.use(
      http.delete('/api/admin/users/:userId', ({ params }) => {
        deleteCalled = true;
        deletedUserId = params.userId as string;
        return HttpResponse.json({ success: true });
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Investor')).toBeInTheDocument();
    });

    // Click delete on first user
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirm|yes|delete$/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
      expect(deletedUserId).toBe('user-1');
    });
  });

  it('should show success toast and refresh list after deletion', async () => {
    server.use(
      http.delete('/api/admin/users/:userId', () => {
        return HttpResponse.json({ success: true });
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Investor')).toBeInTheDocument();
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

  it('should handle delete failure gracefully', async () => {
    server.use(
      http.delete('/api/admin/users/:userId', () => {
        return HttpResponse.json({ error: 'Cannot delete user' }, { status: 400 });
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Investor')).toBeInTheDocument();
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
          variant: 'destructive',
        })
      );
    });
  });

  it('should close confirmation dialog when clicking cancel', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Investor')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });
  });
});

describe('US-ADMIN-CRUD-001: User Create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('/api/admin/users', () => {
        return HttpResponse.json(mockUsers);
      })
    );
  });

  it('should show a Create User button', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Investor')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /create user|add user/i })).toBeInTheDocument();
  });

  it('should open create user dialog when clicking Create User button', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Investor')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create user|add user/i });
    await userEvent.click(createButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/email/i)).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/full name/i)).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/password/i)).toBeInTheDocument();
    });
  });

  it('should call POST API to create user', async () => {
    let postCalled = false;
    let postBody: Record<string, unknown> = {};

    server.use(
      http.post('/api/admin/users', async ({ request }) => {
        postCalled = true;
        postBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ id: 'new-user', email: postBody.email }, { status: 201 });
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Investor')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create user|add user/i });
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/email/i), 'newuser@example.com');
    await userEvent.type(within(dialog).getByLabelText(/full name/i), 'New User');
    await userEvent.type(within(dialog).getByLabelText(/password/i), 'SecurePassword123!');

    // Select role
    const roleSelect = within(dialog).getByRole('combobox');
    await userEvent.click(roleSelect);
    const userOption = await screen.findByRole('option', { name: /standard user/i });
    await userEvent.click(userOption);

    // Submit
    const submitButton = within(dialog).getByRole('button', { name: /create|save/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(postCalled).toBe(true);
      expect(postBody.email).toBe('newuser@example.com');
      expect(postBody.fullName).toBe('New User');
      expect(postBody.password).toBe('SecurePassword123!');
    });
  });

  it('should show success toast after creating user', async () => {
    server.use(
      http.post('/api/admin/users', () => {
        return HttpResponse.json({ id: 'new-user', email: 'newuser@example.com' }, { status: 201 });
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Investor')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create user|add user/i });
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/email/i), 'newuser@example.com');
    await userEvent.type(within(dialog).getByLabelText(/full name/i), 'New User');
    await userEvent.type(within(dialog).getByLabelText(/password/i), 'SecurePassword123!');

    const submitButton = within(dialog).getByRole('button', { name: /create|save/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success',
        })
      );
    });
  });

  it('should validate required fields before submission', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Investor')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create user|add user/i });
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Try to submit without filling fields
    const dialog = screen.getByRole('dialog');
    const submitButton = within(dialog).getByRole('button', { name: /create|save/i });
    await userEvent.click(submitButton);

    // Should not call API - form validation should prevent it
    await waitFor(() => {
      // Email field should be marked as required
      const emailInput = within(dialog).getByLabelText(/email/i);
      expect(emailInput).toBeRequired();
    });
  });
});
