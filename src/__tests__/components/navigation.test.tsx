/**
 * Navigation Component – Role-Based Menu & Logo
 *
 * As a: User of any role
 * I want to: See navigation options appropriate to my role
 * So that: I can access only the features I'm authorized to use
 *
 * Acceptance Criteria:
 * - Logo uses logo-transparent.png
 * - Admin users see Admin Dashboard link
 * - Admin users see role-appropriate dropdown items
 * - All users see My Registrations & Membership in dropdown
 * - Non-admin users do NOT see Admin Dashboard link
 * - Unauthenticated users see Login and Join Now buttons
 *
 * TDD: RED Phase - Writing failing tests first
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Navigation from '@/components/Navigation';

// Mock auth context
let mockAuthState: { user: { id: string; email: string; roles: string[] } | null; signOut: ReturnType<typeof vi.fn> } = {
  user: null,
  signOut: vi.fn(),
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

const renderNavigation = () => {
  return render(
    <BrowserRouter>
      <Navigation />
    </BrowserRouter>
  );
};

describe('Navigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: null,
      signOut: vi.fn(),
    };
  });

  describe('Logo', () => {
    it('should render logo with logo-transparent.png', () => {
      renderNavigation();
      const logo = screen.getByAltText('India Angel Forum');
      expect(logo).toHaveAttribute('src', '/logo-transparent.png');
    });

    it('should link logo to home page', () => {
      renderNavigation();
      const logoLink = screen.getByAltText('India Angel Forum').closest('a');
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('Unauthenticated User', () => {
    it('should show Login button when not logged in', () => {
      renderNavigation();
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    });

    it('should show Join Now button when not logged in', () => {
      renderNavigation();
      expect(screen.getByRole('link', { name: /join now/i })).toBeInTheDocument();
    });

    it('should NOT show user dropdown when not logged in', () => {
      renderNavigation();
      expect(screen.queryByRole('button', { name: /admin/i })).not.toBeInTheDocument();
    });
  });

  describe('Authenticated Admin User', () => {
    beforeEach(() => {
      mockAuthState = {
        user: {
          id: 'admin-1',
          email: 'admin@indiaangelforum.test',
          roles: ['admin'],
        },
        signOut: vi.fn(),
      };
    });

    it('should show user dropdown trigger with email prefix', () => {
      renderNavigation();
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('should show Admin Dashboard link in dropdown', async () => {
      renderNavigation();
      // Open dropdown
      const trigger = screen.getByText('admin');
      await userEvent.click(trigger);

      await waitFor(() => {
        const adminLink = screen.getByRole('menuitem', { name: /admin dashboard/i });
        expect(adminLink).toBeInTheDocument();
      });
    });

    it('should show My Registrations link in dropdown', async () => {
      renderNavigation();
      const trigger = screen.getByText('admin');
      await userEvent.click(trigger);

      await waitFor(() => {
        const regLink = screen.getByRole('menuitem', { name: /my registrations/i });
        expect(regLink).toBeInTheDocument();
      });
    });

    it('should show Membership link in dropdown', async () => {
      renderNavigation();
      const trigger = screen.getByText('admin');
      await userEvent.click(trigger);

      await waitFor(() => {
        const membershipLink = screen.getByRole('menuitem', { name: /membership/i });
        expect(membershipLink).toBeInTheDocument();
      });
    });

    it('should show Sign Out option in dropdown', async () => {
      renderNavigation();
      const trigger = screen.getByText('admin');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated Regular User', () => {
    beforeEach(() => {
      mockAuthState = {
        user: {
          id: 'user-1',
          email: 'user@test.com',
          roles: ['user'],
        },
        signOut: vi.fn(),
      };
    });

    it('should show My Registrations link in dropdown', async () => {
      renderNavigation();
      const trigger = screen.getByText('user');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /my registrations/i })).toBeInTheDocument();
      });
    });

    it('should NOT show Admin Dashboard link for non-admin', async () => {
      renderNavigation();
      const trigger = screen.getByText('user');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('menuitem', { name: /admin dashboard/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Public Navigation Links', () => {
    it('should show For Founders link', () => {
      renderNavigation();
      expect(screen.getByRole('link', { name: /for founders/i })).toBeInTheDocument();
    });

    it('should show For Investors link', () => {
      renderNavigation();
      expect(screen.getByRole('link', { name: /for investors/i })).toBeInTheDocument();
    });

    it('should show Portfolio link', () => {
      renderNavigation();
      expect(screen.getByRole('link', { name: /portfolio/i })).toBeInTheDocument();
    });

    it('should show Events link', () => {
      renderNavigation();
      expect(screen.getByRole('link', { name: /events/i })).toBeInTheDocument();
    });

    it('should show About link', () => {
      renderNavigation();
      expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    });
  });
});
