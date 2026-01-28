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
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';

import ApplicationStatus from '@/pages/founder/ApplicationStatus';

// Mock AuthContext for authentication
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'founder-123',
      email: 'founder@example.com',
      role: 'founder',
    },
    token: 'mock-token-123',
    isAuthenticated: true,
  }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-FOUNDER-002: Track Application Status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Status Display', () => {
    it('should display application status dashboard', async () => {
      const mockApplication = {
        id: 'app-001',
        status: 'pending',
        createdAt: '2024-01-15T10:00:00Z',
        companyName: 'TechCorp',
        stage: 'initial_review'
      };

      server.use(
        http.get('/api/applications/founder-application', () => {
          return HttpResponse.json(mockApplication);
        })
      );

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/application status/i)).toBeInTheDocument();
        expect(screen.getByText(/TechCorp/i)).toBeInTheDocument();
      });
    });

    it('should show no application message when no applications exist', async () => {
      server.use(
        http.get('/api/applications/founder-application', () => {
          return HttpResponse.json({ status: 'not_submitted' });
        })
      );

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
        createdAt: '2024-01-15T10:00:00Z',
        companyName: 'TechCorp'
      };

      server.use(
        http.get('/api/applications/founder-application', () => {
          return HttpResponse.json(mockApplication);
        })
      );

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
        createdAt: '2024-01-15T10:00:00Z',
        companyName: 'TechCorp'
      };

      server.use(
        http.get('/api/applications/founder-application', () => {
          return HttpResponse.json(mockApplication);
        })
      );

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/interview/i)).toBeInTheDocument();
      });
    });
  });

  describe('Approval Flow', () => {
    it('should display approval confirmation', async () => {
      const mockApplication = {
        id: 'app-001',
        status: 'approved',
        stage: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        approvedAt: '2024-01-25T10:00:00Z',
        companyName: 'TechCorp'
      };

      server.use(
        http.get('/api/applications/founder-application', () => {
          return HttpResponse.json(mockApplication);
        })
      );

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
      });
    });

    it('should show next steps after approval', async () => {
      const mockApplication = {
        id: 'app-001',
        status: 'approved',
        companyName: 'TechCorp',
        stage: 'completed'
      };

      server.use(
        http.get('/api/applications/founder-application', () => {
          return HttpResponse.json(mockApplication);
        })
      );

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/next steps/i) || screen.getByText(/approved/i)).toBeInTheDocument();
      });
    });
  });

  describe('Rejection Flow', () => {
    it('should display rejection reason', async () => {
      const mockApplication = {
        id: 'app-001',
        status: 'rejected',
        rejectionReason: 'Business model not aligned with our investment focus',
        createdAt: '2024-01-15T10:00:00Z',
        companyName: 'TechCorp',
        stage: 'rejected'
      };

      server.use(
        http.get('/api/applications/founder-application', () => {
          return HttpResponse.json(mockApplication);
        })
      );

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/rejected/i)).toBeInTheDocument();
        expect(screen.getByText(/business model not aligned/i)).toBeInTheDocument();
      });
    });

    it('should show re-application guidance', async () => {
      const mockApplication = {
        id: 'app-001',
        status: 'rejected',
        rejectionReason: 'Too early stage',
        companyName: 'TechCorp',
        stage: 'rejected'
      };

      server.use(
        http.get('/api/applications/founder-application', () => {
          return HttpResponse.json(mockApplication);
        })
      );

      renderWithRouter(<ApplicationStatus />);

      await waitFor(() => {
        expect(screen.getByText(/reapply now/i)).toBeInTheDocument();
      });
    });
  });
});
