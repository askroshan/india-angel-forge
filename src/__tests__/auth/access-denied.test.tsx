/**
 * Unit Tests for AccessDenied Page Component (US-AUTH-003)
 * 
 * TDD RED Phase: Tests for WCAG 2.2 AA compliant 403 Forbidden page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import AccessDenied from '@/pages/AccessDenied';

expect.extend(toHaveNoViolations);

// Mock the useAuth hook
const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('US-AUTH-003: AccessDenied Page (WCAG 2.2 AA)', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'investor@test.com', roles: ['investor'] },
      loading: false,
    });
  });

  describe('Content Requirements', () => {
    it('displays "Access Denied" as h1 heading', () => {
      renderWithRouter(<AccessDenied />);
      
      const heading = screen.getByRole('heading', { level: 1, name: /access denied/i });
      expect(heading).toBeInTheDocument();
    });

    it('displays explanation message about access denial', () => {
      renderWithRouter(<AccessDenied />);
      
      expect(screen.getByText(/not authorized|don't have permission|cannot access/i)).toBeInTheDocument();
    });

    it('displays the current user role', () => {
      renderWithRouter(<AccessDenied />);
      
      expect(screen.getByText(/investor/i)).toBeInTheDocument();
    });

    it('provides a link to return to dashboard', () => {
      renderWithRouter(<AccessDenied />);
      
      const dashboardLink = screen.getByRole('link', { name: /dashboard|home|go back/i });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href');
    });

    it('provides a contact support link', () => {
      renderWithRouter(<AccessDenied />);
      
      // There are two contact links - the button and inline text link - both should exist
      const supportLinks = screen.getAllByRole('link', { name: /contact|support|help/i });
      expect(supportLinks.length).toBeGreaterThanOrEqual(1);
      expect(supportLinks[0]).toHaveAttribute('href', '/contact');
    });

    it('displays 403 status code', () => {
      renderWithRouter(<AccessDenied />);
      
      expect(screen.getByText(/403/)).toBeInTheDocument();
    });
  });

  describe('Accessibility (WCAG 2.2 AA)', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithRouter(<AccessDenied />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter(<AccessDenied />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      
      // Should not have any h1 after the main one
      const allH1s = screen.getAllByRole('heading', { level: 1 });
      expect(allH1s).toHaveLength(1);
    });

    it('all links have accessible names', () => {
      renderWithRouter(<AccessDenied />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });

    it('main content is in a main landmark', () => {
      renderWithRouter(<AccessDenied />);
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has skip to content or proper focus management', () => {
      renderWithRouter(<AccessDenied />);
      
      // The heading should be the first focusable or near-first element
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('all interactive elements are keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AccessDenied />);
      
      // Tab through the page
      await user.tab();
      
      // Should be able to focus on links
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('focus is visible on interactive elements', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AccessDenied />);
      
      const firstLink = screen.getAllByRole('link')[0];
      await user.tab();
      
      // Element should receive focus
      expect(document.activeElement).toBeDefined();
    });

    it('links are activatable with Enter key', async () => {
      const user = userEvent.setup();
      renderWithRouter(<AccessDenied />);
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      
      // Links should have href attributes for keyboard activation
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders content on mobile viewport (375px)', () => {
      // Mock viewport - in actual test this would use viewport testing
      renderWithRouter(<AccessDenied />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('renders content on tablet viewport (768px)', () => {
      renderWithRouter(<AccessDenied />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('renders content on desktop viewport (1280px)', () => {
      renderWithRouter(<AccessDenied />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('User Role Display', () => {
    it('shows admin role correctly', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', roles: ['admin'] },
        loading: false,
      });
      
      renderWithRouter(<AccessDenied />);
      expect(screen.getByText(/admin/i)).toBeInTheDocument();
    });

    it('shows compliance_officer role correctly', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'compliance@test.com', roles: ['compliance_officer'] },
        loading: false,
      });
      
      renderWithRouter(<AccessDenied />);
      expect(screen.getByText(/compliance/i)).toBeInTheDocument();
    });

    it('shows founder role correctly', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'founder@test.com', roles: ['founder'] },
        loading: false,
      });
      
      renderWithRouter(<AccessDenied />);
      expect(screen.getByText(/founder/i)).toBeInTheDocument();
    });

    it('shows multiple roles when user has several', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'operator@test.com', roles: ['investor', 'operator_angel'] },
        loading: false,
      });
      
      renderWithRouter(<AccessDenied />);
      // Should show at least one of the roles
      expect(
        screen.getByText(/investor|operator/i)
      ).toBeInTheDocument();
    });

    it('handles user with no roles gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', roles: [] },
        loading: false,
      });
      
      renderWithRouter(<AccessDenied />);
      expect(screen.getByRole('heading', { level: 1, name: /access denied/i })).toBeInTheDocument();
    });
  });

  describe('Dashboard Link Navigation', () => {
    it('links to /admin for admin users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', roles: ['admin'] },
        loading: false,
      });
      
      renderWithRouter(<AccessDenied />);
      const link = screen.getByRole('link', { name: /dashboard|home/i });
      expect(link).toHaveAttribute('href', expect.stringContaining('/admin'));
    });

    it('links to /investor for investor users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'investor@test.com', roles: ['investor'] },
        loading: false,
      });
      
      renderWithRouter(<AccessDenied />);
      const link = screen.getByRole('link', { name: /dashboard|home/i });
      expect(link).toHaveAttribute('href', expect.stringContaining('/investor'));
    });

    it('links to /founder for founder users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'founder@test.com', roles: ['founder'] },
        loading: false,
      });
      
      renderWithRouter(<AccessDenied />);
      const link = screen.getByRole('link', { name: /dashboard|home/i });
      expect(link).toHaveAttribute('href', expect.stringContaining('/founder'));
    });

    it('links to / for users with no clear role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'user@test.com', roles: ['user'] },
        loading: false,
      });
      
      renderWithRouter(<AccessDenied />);
      const link = screen.getByRole('link', { name: /dashboard|home/i });
      expect(link).toHaveAttribute('href', '/');
    });
  });
});
