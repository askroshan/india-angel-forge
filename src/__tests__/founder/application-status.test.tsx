/**
 * US-FOUNDER-002: Track Application Status
 * 
 * As a: Founder
 * I want to: Track my membership application status
 * So that: I know where I stand in the approval process
 * 
 * Acceptance Criteria:
 * - GIVEN I submitted an application
 *   WHEN I view application status
 *   THEN I see current stage and progress
 * 
 * - GIVEN application is under review
 *   WHEN viewing status
 *   THEN I see review stage with estimated timeline
 * 
 * - GIVEN application is approved
 *   WHEN viewing status
 *   THEN I see approval confirmation and next steps
 * 
 * - GIVEN application is rejected
 *   WHEN viewing status
 *   THEN I see rejection reason and re-application guidance
 * 
 * Priority: High
 * Status: Implementing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { testUsers, createMockSession } from '../fixtures/testData';

import ApplicationStatus from '@/pages/founder/ApplicationStatus';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-FOUNDER-002: Track Application Status', () => {
  const founder = testUsers.founder;
  const mockSession = createMockSession(founder);

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
  });

  describe('Status Display', () => {
    it('should display application status dashboard', async () => {
      const mockApplication = {
        id: 'app-001',
        status: 'pending',
        created_at: '2024-01-15T10:00:00Z',
        company_name: 'TechCorp'
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'founder_applications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockApplication],
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/application status/i)).toBeInTheDocument();
        expect(screen.getByText(/TechCorp/i)).toBeInTheDocument();
      });
    });

    it('should show no application message when no applications exist', async () => {
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'founder_applications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/no application found/i)).toBeInTheDocument();
        expect(screen.getByText(/apply now/i)).toBeInTheDocument();
      });
    });
  });

  describe('Review Stage', () => {
    it('should display review stage with timeline for pending applications', async () => {
      const mockApplication = {
        id: 'app-001',
        status: 'pending',
        stage: 'initial_review',
        created_at: '2024-01-15T10:00:00Z',
        company_name: 'TechCorp'
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'founder_applications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockApplication],
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/initial review/i)).toBeInTheDocument();
        expect(screen.getByText(/5-7 business days/i)).toBeInTheDocument();
      });
    });

    it('should show interview stage', async () => {
      const mockApplication = {
        id: 'app-001',
        status: 'under_review',
        stage: 'interview',
        created_at: '2024-01-15T10:00:00Z',
        company_name: 'TechCorp'
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'founder_applications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockApplication],
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/interview/i)).toBeInTheDocument();
      });
    });
  });

  describe('Approval Status', () => {
    it('should show approval confirmation and next steps', async () => {
      const mockApplication = {
        id: 'app-001',
        status: 'approved',
        stage: 'complete',
        created_at: '2024-01-15T10:00:00Z',
        approved_at: '2024-01-20T15:00:00Z',
        company_name: 'TechCorp'
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'founder_applications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockApplication],
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/approved/i)).toBeInTheDocument();
        expect(screen.getByText(/complete your membership/i)).toBeInTheDocument();
      });
    });

    it('should show membership payment button for approved applications', async () => {
      const mockApplication = {
        id: 'app-001',
        status: 'approved',
        stage: 'complete',
        created_at: '2024-01-15T10:00:00Z',
        company_name: 'TechCorp'
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'founder_applications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockApplication],
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/proceed to membership/i)).toBeInTheDocument();
      });
    });
  });

  describe('Rejection Status', () => {
    it('should show rejection reason', async () => {
      const mockApplication = {
        id: 'app-001',
        status: 'rejected',
        stage: 'complete',
        created_at: '2024-01-15T10:00:00Z',
        rejected_at: '2024-01-18T12:00:00Z',
        rejection_reason: 'Company stage does not meet requirements',
        company_name: 'TechCorp'
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'founder_applications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockApplication],
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/rejected/i)).toBeInTheDocument();
        expect(screen.getByText(/Company stage does not meet requirements/i)).toBeInTheDocument();
      });
    });

    it('should show re-application guidance for rejected applications', async () => {
      const mockApplication = {
        id: 'app-001',
        status: 'rejected',
        stage: 'complete',
        created_at: '2024-01-15T10:00:00Z',
        rejected_at: '2024-01-18T12:00:00Z',
        rejection_reason: 'Incomplete information',
        company_name: 'TechCorp',
        can_reapply_after: '2024-04-18T12:00:00Z'
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'founder_applications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockApplication],
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/reapply/i)).toBeInTheDocument();
      });
    });
  });

  describe('Progress Timeline', () => {
    it('should display progress steps', async () => {
      const mockApplication = {
        id: 'app-001',
        status: 'under_review',
        stage: 'committee_review',
        created_at: '2024-01-15T10:00:00Z',
        company_name: 'TechCorp'
      };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'founder_applications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [mockApplication],
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/submitted/i)).toBeInTheDocument();
        expect(screen.getByText(/committee review/i)).toBeInTheDocument();
      });
    });
  });
});
