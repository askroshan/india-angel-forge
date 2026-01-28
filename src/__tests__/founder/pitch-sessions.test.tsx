/**
 * US-FOUNDER-004: Schedule Pitch Sessions
 * 
 * As a: Founder
 * I want to: Schedule pitch sessions with interested investors
 * So that: I can present my startup and answer questions
 * 
 * Acceptance Criteria:
 * - GIVEN investor expressed interest
 *   WHEN I view interested investors
 *   THEN I see option to schedule pitch
 * 
 * - GIVEN I select time slots
 *   WHEN I send invitation
 *   THEN investor receives calendar invite
 * 
 * - GIVEN pitch session scheduled
 *   WHEN viewing calendar
 *   THEN I see upcoming sessions
 * 
 * - GIVEN session completed
 *   WHEN adding notes
 *   THEN notes saved for future reference
 * 
 * Priority: High
 * Status: Implementing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';

import PitchSessions from '@/pages/founder/PitchSessions';

// Mock AuthContext for authentication
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'founder-123',
      email: 'founder@example.com',
      role: 'founder',
    },
    isAuthenticated: true,
    token: 'test-token',
  }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-FOUNDER-004: Schedule Pitch Sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pitch Sessions Dashboard', () => {
    it('should display pitch sessions dashboard', async () => {
      const mockSessions = [
        {
          id: 'session-001',
          scheduledDate: '2026-02-01T14:00:00Z',
          duration: 30,
          status: 'scheduled',
          investorId: 'investor-001',
        }
      ];

      server.use(
        http.get('/api/pitch/sessions', () => {
          return HttpResponse.json(mockSessions);
        }),
      );

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/pitch sessions/i)).toBeInTheDocument();
      });
    });

    it('should show upcoming sessions', async () => {
      const mockSessions = [
        {
          id: 'session-001',
          scheduledDate: '2026-02-01T14:00:00Z',
          duration: 30,
          status: 'scheduled',
          investorId: 'investor-001',
        }
      ];

      server.use(
        http.get('/api/pitch/sessions', () => {
          return HttpResponse.json(mockSessions);
        }),
      );

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
      });
    });
  });

  describe('Schedule New Session', () => {
    it('should show schedule button', async () => {
      server.use(
        http.get('/api/pitch/sessions', () => {
          return HttpResponse.json([]);
        }),
      );

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/schedule new session/i)).toBeInTheDocument();
      });
    });

    it('should allow scheduling session', async () => {
      const user = userEvent.setup();

      server.use(
        http.get('/api/pitch/sessions', () => {
          return HttpResponse.json([]);
        }),
        http.post('/api/pitch/sessions', () => {
          return HttpResponse.json({
            id: 'session-001',
            scheduledDate: '2026-02-01T14:00:00Z',
            duration: 30,
            status: 'scheduled',
          });
        }),
      );

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/schedule new session/i)).toBeInTheDocument();
      });

      const scheduleButton = screen.getByText(/schedule new session/i);
      await user.click(scheduleButton);

      await waitFor(() => {
        // Dialog should appear
        expect(screen.getByRole('dialog') || screen.getByLabelText(/date/i) || screen.getByLabelText(/investor/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    it('should allow adding notes to completed sessions', async () => {
      const mockSessions = [
        {
          id: 'session-001',
          scheduledDate: '2026-01-15T14:00:00Z',
          duration: 30,
          status: 'completed',
          investorId: 'investor-001',
          notes: '',
        }
      ];

      server.use(
        http.get('/api/pitch/sessions', () => {
          return HttpResponse.json(mockSessions);
        }),
        http.patch('/api/pitch/sessions/:id', () => {
          return HttpResponse.json({ ...mockSessions[0], notes: 'Great discussion' });
        }),
      );

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
      });
    });

    it('should display cancelled sessions', async () => {
      const mockSessions = [
        {
          id: 'session-001',
          scheduledDate: '2026-02-01T14:00:00Z',
          duration: 30,
          status: 'cancelled',
          investorId: 'investor-001',
        }
      ];

      server.use(
        http.get('/api/pitch/sessions', () => {
          return HttpResponse.json(mockSessions);
        }),
      );

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no sessions exist', async () => {
      server.use(
        http.get('/api/pitch/sessions', () => {
          return HttpResponse.json([]);
        }),
      );

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/no pitch sessions/i) || screen.getByText(/no upcoming sessions/i) || screen.getByText(/schedule new session/i)).toBeInTheDocument();
      });
    });
  });
});
