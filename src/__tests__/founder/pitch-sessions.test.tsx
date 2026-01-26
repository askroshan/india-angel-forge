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
import { supabase } from '@/integrations/supabase/client';
import { testUsers, createMockSession } from '../fixtures/testData';

import PitchSessions from '@/pages/founder/PitchSessions';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-FOUNDER-004: Schedule Pitch Sessions', () => {
  const founder = testUsers.founder;
  const mockSession = createMockSession(founder);

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
  });

  describe('Pitch Sessions Dashboard', () => {
    it('should display pitch sessions dashboard', async () => {
      const mockSessions = [
        {
          id: 'session-001',
          scheduled_at: '2026-02-01T14:00:00Z',
          status: 'scheduled',
          investor: {
            full_name: 'John Investor',
            email: 'john@example.com'
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'pitch_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockSessions,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/pitch sessions/i)).toBeInTheDocument();
        expect(screen.getByText(/John Investor/i)).toBeInTheDocument();
      });
    });

    it('should show upcoming sessions', async () => {
      const mockSessions = [
        {
          id: 'session-001',
          scheduled_at: '2026-02-01T14:00:00Z',
          status: 'scheduled',
          investor: {
            full_name: 'Test Investor',
            email: 'test@example.com'
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'pitch_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockSessions,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
      });
    });
  });

  describe('Schedule New Session', () => {
    it('should show schedule form', async () => {
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'pitch_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/schedule new session/i)).toBeInTheDocument();
      });
    });

    it('should allow scheduling session', async () => {
      const user = userEvent.setup();
      
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'pitch_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/schedule new session/i)).toBeInTheDocument();
      });

      const scheduleButton = screen.getByText(/schedule new session/i);
      await user.click(scheduleButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/date and time/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Details', () => {
    it('should display session date and time', async () => {
      const mockSessions = [
        {
          id: 'session-001',
          scheduled_at: '2026-02-01T14:00:00Z',
          duration_minutes: 30,
          status: 'scheduled',
          investor: {
            full_name: 'Test Investor',
            email: 'test@example.com'
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'pitch_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockSessions,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/30 minutes/i)).toBeInTheDocument();
      });
    });

    it('should show meeting link for scheduled sessions', async () => {
      const mockSessions = [
        {
          id: 'session-001',
          scheduled_at: '2026-02-01T14:00:00Z',
          status: 'scheduled',
          meeting_link: 'https://meet.example.com/session-001',
          investor: {
            full_name: 'Test Investor',
            email: 'test@example.com'
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'pitch_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockSessions,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/join meeting/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Notes', () => {
    it('should allow adding notes to completed session', async () => {
      const user = userEvent.setup();
      
      const mockSessions = [
        {
          id: 'session-001',
          scheduled_at: '2026-01-20T14:00:00Z',
          status: 'completed',
          investor: {
            full_name: 'Test Investor',
            email: 'test@example.com'
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'pitch_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockSessions,
              error: null,
            }),
            update: vi.fn().mockReturnThis(),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/add notes/i)).toBeInTheDocument();
      });
    });

    it('should display existing notes', async () => {
      const mockSessions = [
        {
          id: 'session-001',
          scheduled_at: '2026-01-20T14:00:00Z',
          status: 'completed',
          notes: 'Investor showed strong interest in product',
          investor: {
            full_name: 'Test Investor',
            email: 'test@example.com'
          }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'pitch_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockSessions,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/strong interest in product/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Status', () => {
    it('should show different status badges', async () => {
      const mockSessions = [
        {
          id: 'session-001',
          scheduled_at: '2026-02-01T14:00:00Z',
          status: 'scheduled',
          investor: { full_name: 'Investor 1', email: 'inv1@example.com' }
        },
        {
          id: 'session-002',
          scheduled_at: '2026-01-20T14:00:00Z',
          status: 'completed',
          investor: { full_name: 'Investor 2', email: 'inv2@example.com' }
        },
        {
          id: 'session-003',
          scheduled_at: '2026-02-05T14:00:00Z',
          status: 'cancelled',
          investor: { full_name: 'Investor 3', email: 'inv3@example.com' }
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'pitch_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockSessions,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<PitchSessions />);

      await waitFor(() => {
        expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
        expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
      });
    });
  });
});
