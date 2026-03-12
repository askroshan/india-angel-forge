/**
 * N5: Forgot Password Flow Tested
 *
 * As a User who has forgotten their password
 * I want to request a password reset link
 * So that I can regain access to my account
 *
 * Acceptance Criteria:
 * - GIVEN I enter a valid email
 *   WHEN I submit the form
 *   THEN a success message is shown and a toast is displayed
 * - GIVEN I enter an invalid email
 *   WHEN I submit the form
 *   THEN a validation error toast is shown
 * - GIVEN the server returns an error
 *   WHEN I submit the form
 *   THEN a destructive error toast is shown
 * - GIVEN the reset email was sent
 *   WHEN I click "Back to Sign In"
 *   THEN I am navigated to /auth
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '@/pages/ForgotPassword';

// ---- mocks ----------------------------------------------------------------

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/components/Navigation', () => ({ default: () => <nav data-testid="navigation" /> }));
vi.mock('@/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

const mockResetPassword = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    resetPassword: mockResetPassword,
    user: null,
    token: null,
  }),
}));

// ---- helper ---------------------------------------------------------------

const renderPage = () =>
  render(
    <BrowserRouter>
      <ForgotPassword />
    </BrowserRouter>,
  );

// ---------------------------------------------------------------------------

describe('N5: Forgot Password Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Reset Password heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
  });

  it('shows the email input and submit button', () => {
    renderPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  describe('Successful submission', () => {
    it('calls resetPassword with the entered email', async () => {
      mockResetPassword.mockResolvedValue({ error: null });
      const user = userEvent.setup();

      renderPage();

      await user.type(screen.getByLabelText(/email/i), 'user@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('user@example.com');
      });
    });

    it('shows success message after successful email submission', async () => {
      mockResetPassword.mockResolvedValue({ error: null });
      const user = userEvent.setup();

      renderPage();

      await user.type(screen.getByLabelText(/email/i), 'user@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/we've sent a password reset link/i)).toBeInTheDocument();
      });
    });

    it('shows a success toast after successful email submission', async () => {
      mockResetPassword.mockResolvedValue({ error: null });
      const user = userEvent.setup();

      renderPage();

      await user.type(screen.getByLabelText(/email/i), 'user@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Email Sent' }),
        );
      });
    });

    it('shows a Back to Sign In button after success', async () => {
      mockResetPassword.mockResolvedValue({ error: null });
      const user = userEvent.setup();

      renderPage();

      await user.type(screen.getByLabelText(/email/i), 'user@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument();
      });
    });
  });

  describe('Validation errors', () => {
    it('shows a validation error toast for an invalid email format', async () => {
      const user = userEvent.setup();

      const { container } = renderPage();

      // Type invalid text then submit the form directly (bypasses browser type="email" constraint)
      await user.type(screen.getByLabelText(/email/i), 'not-an-email');
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ variant: 'destructive', title: 'Validation Error' }),
        );
      });

      expect(mockResetPassword).not.toHaveBeenCalled();
    });
  });

  describe('Server error', () => {
    it('shows a destructive toast when the server returns an error', async () => {
      mockResetPassword.mockResolvedValue({ error: new Error('Server unavailable') });
      const user = userEvent.setup();

      renderPage();

      await user.type(screen.getByLabelText(/email/i), 'user@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ variant: 'destructive', title: 'Error' }),
        );
      });
    });

    it('does NOT show the success message when the server returns an error', async () => {
      mockResetPassword.mockResolvedValue({ error: new Error('Server unavailable') });
      const user = userEvent.setup();

      renderPage();

      await user.type(screen.getByLabelText(/email/i), 'user@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      expect(screen.queryByText(/we've sent a password reset link/i)).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to /auth when "Back to Sign In" is clicked after submission', async () => {
      mockResetPassword.mockResolvedValue({ error: null });
      const user = userEvent.setup();

      renderPage();

      await user.type(screen.getByLabelText(/email/i), 'user@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /back to sign in/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });

    it('navigates to /auth when the pre-form "Back to Sign In" ghost button is clicked', async () => {
      const user = userEvent.setup();
      renderPage();

      // Ghost button below the form (before submission)
      const backButtons = screen.getAllByRole('button', { name: /back to sign in/i });
      await user.click(backButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });
  });
});
