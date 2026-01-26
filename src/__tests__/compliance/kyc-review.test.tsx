/**
 * US-COMPLIANCE-001: Review KYC Documents
 * 
 * As a: Compliance Officer
 * I want to: Review and verify KYC documents submitted by investors
 * So that: I can ensure regulatory compliance before approving memberships
 * 
 * Acceptance Criteria:
 * - GIVEN I am logged in as compliance officer
 *   WHEN I navigate to KYC review dashboard
 *   THEN I see list of pending KYC submissions
 * 
 * - GIVEN I am viewing a KYC submission
 *   WHEN I click on a document
 *   THEN I can view/download the document
 * 
 * - GIVEN I have reviewed a document
 *   WHEN I mark it as verified with notes
 *   THEN status updates to verified
 * 
 * - GIVEN document is incomplete/invalid
 *   WHEN I reject with reason
 *   THEN investor is notified to resubmit
 * 
 * Priority: Critical
 * Status: Not Implemented
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { testUsers, testKYCDocuments, createMockSession, getKYCDocumentsByStatus } from '../fixtures/testData';

// Component to be implemented
import KYCReviewDashboard from '@/pages/compliance/KYCReviewDashboard';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-COMPLIANCE-001: KYC Document Review', () => {
  const complianceOfficer = testUsers.compliance_officer;
  const mockSession = createMockSession(complianceOfficer);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Access & Display', () => {
    it('should display KYC review dashboard for compliance officer', async () => {
      // RED: This test will fail until we implement KYCReviewDashboard
      const pendingDocs = getKYCDocumentsByStatus('pending');
      
      // Mock getSession
      vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as any);

      // Mock from() query
      const mockFrom = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: { role: 'compliance_officer' },
          error: null,
        }),
        order: vi.fn().mockResolvedValue({
          data: pendingDocs,
          error: null,
        }),
      } as any);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /KYC Document Review/i })).toBeInTheDocument();
      });
    });

    it('should show list of pending KYC submissions', async () => {
      const pendingDocs = getKYCDocumentsByStatus('pending');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: pendingDocs,
            error: null,
          }),
        }),
      } as any);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        pendingDocs.forEach(doc => {
          expect(screen.getByText(new RegExp(doc.document_type, 'i'))).toBeInTheDocument();
        });
      });
    });

    it('should display document metadata (upload date, type, investor)', async () => {
      const pendingDocs = getKYCDocumentsByStatus('pending');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: pendingDocs,
            error: null,
          }),
        }),
      } as any);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        const firstDoc = pendingDocs[0];
        expect(screen.getByText(new RegExp(firstDoc.document_type, 'i'))).toBeInTheDocument();
        // Should display upload date
        expect(screen.getByText(/2025-01-24/)).toBeInTheDocument();
      });
    });

    it('should deny access to non-compliance users', async () => {
      const regularUser = testUsers.standard_investor;
      const regularSession = createMockSession(regularUser);
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: regularSession },
        error: null,
      });

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Access Denied|Unauthorized/i)).toBeInTheDocument();
      });
    });
  });

  describe('Document Viewing', () => {
    it('should allow viewing document when clicked', async () => {
      const user = userEvent.setup();
      const pendingDocs = getKYCDocumentsByStatus('pending');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: pendingDocs,
            error: null,
          }),
        }),
      } as any);

      // Mock storage download
      vi.mocked(supabase.storage.from).mockReturnValue({
        download: vi.fn().mockResolvedValue({
          data: new Blob(['mock pdf content'], { type: 'application/pdf' }),
          error: null,
        }),
      } as any);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/pan/i)).toBeInTheDocument();
      });

      const viewButton = screen.getAllByRole('button', { name: /view|open/i })[0];
      await user.click(viewButton);

      await waitFor(() => {
        expect(supabase.storage.from).toHaveBeenCalledWith('kyc-documents');
      });
    });

    it('should allow downloading document', async () => {
      const user = userEvent.setup();
      const pendingDocs = getKYCDocumentsByStatus('pending');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: pendingDocs,
            error: null,
          }),
        }),
      } as any);

      vi.mocked(supabase.storage.from).mockReturnValue({
        download: vi.fn().mockResolvedValue({
          data: new Blob(['mock pdf content'], { type: 'application/pdf' }),
          error: null,
        }),
      } as any);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/pan/i)).toBeInTheDocument();
      });

      const downloadButton = screen.getAllByRole('button', { name: /download/i })[0];
      await user.click(downloadButton);

      await waitFor(() => {
        expect(supabase.storage.from).toHaveBeenCalled();
      });
    });

    it('should handle document load errors gracefully', async () => {
      const pendingDocs = getKYCDocumentsByStatus('pending');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: pendingDocs,
            error: null,
          }),
        }),
      } as any);

      vi.mocked(supabase.storage.from).mockReturnValue({
        download: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'File not found' },
        }),
      } as any);

      const user = userEvent.setup();
      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/pan/i)).toBeInTheDocument();
      });

      const viewButton = screen.getAllByRole('button', { name: /view|open/i })[0];
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Document Verification', () => {
    it('should allow marking document as verified with notes', async () => {
      const user = userEvent.setup();
      const pendingDocs = getKYCDocumentsByStatus('pending');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: pendingDocs,
            error: null,
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ ...pendingDocs[0], verification_status: 'verified' }],
            error: null,
          }),
        }),
      } as any);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/pan/i)).toBeInTheDocument();
      });

      // Click verify button
      const verifyButton = screen.getAllByRole('button', { name: /verify|approve/i })[0];
      await user.click(verifyButton);

      // Fill verification notes
      const notesField = screen.getByLabelText(/notes|comments/i);
      await user.type(notesField, 'Document verified - All details match');

      // Submit verification
      const submitButton = screen.getByRole('button', { name: /submit|confirm/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('kyc_documents');
        const updateCall = vi.mocked(supabase.from).mock.results[0]?.value?.update;
        expect(updateCall).toHaveBeenCalled();
      });
    });

    it('should update document status to verified in database', async () => {
      const user = userEvent.setup();
      const pendingDocs = getKYCDocumentsByStatus('pending');
      const docId = pendingDocs[0].id;
      
      const mockUpdate = vi.fn().mockResolvedValue({
        data: [{ 
          ...pendingDocs[0], 
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: complianceOfficer.id,
        }],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: pendingDocs,
            error: null,
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((column, value) => {
            if (column === 'id' && value === docId) {
              return mockUpdate();
            }
            return { data: null, error: null };
          }),
        }),
      } as any);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/pan/i)).toBeInTheDocument();
      });

      const verifyButton = screen.getAllByRole('button', { name: /verify|approve/i })[0];
      await user.click(verifyButton);

      const submitButton = screen.getByRole('button', { name: /submit|confirm/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it('should show success message after verification', async () => {
      const user = userEvent.setup();
      const pendingDocs = getKYCDocumentsByStatus('pending');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: pendingDocs,
            error: null,
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ ...pendingDocs[0], verification_status: 'verified' }],
            error: null,
          }),
        }),
      } as any);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/pan/i)).toBeInTheDocument();
      });

      const verifyButton = screen.getAllByRole('button', { name: /verify|approve/i })[0];
      await user.click(verifyButton);

      const submitButton = screen.getByRole('button', { name: /submit|confirm/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/success|verified/i)).toBeInTheDocument();
      });
    });
  });

  describe('Document Rejection', () => {
    it('should allow rejecting document with reason', async () => {
      const user = userEvent.setup();
      const pendingDocs = getKYCDocumentsByStatus('pending');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: pendingDocs,
            error: null,
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ 
              ...pendingDocs[0], 
              verification_status: 'rejected',
              rejection_reason: 'Document is not clear',
            }],
            error: null,
          }),
        }),
      } as any);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/pan/i)).toBeInTheDocument();
      });

      // Click reject button
      const rejectButton = screen.getAllByRole('button', { name: /reject/i })[0];
      await user.click(rejectButton);

      // Enter rejection reason
      const reasonField = screen.getByLabelText(/reason/i);
      await user.type(reasonField, 'Document is not clear, please upload high quality scan');

      // Submit rejection
      const submitButton = screen.getByRole('button', { name: /submit|confirm/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('kyc_documents');
      });
    });

    it('should require rejection reason when rejecting', async () => {
      const user = userEvent.setup();
      const pendingDocs = getKYCDocumentsByStatus('pending');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: pendingDocs,
            error: null,
          }),
        }),
      } as any);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/pan/i)).toBeInTheDocument();
      });

      const rejectButton = screen.getAllByRole('button', { name: /reject/i })[0];
      await user.click(rejectButton);

      // Try to submit without reason
      const submitButton = screen.getByRole('button', { name: /submit|confirm/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/reason is required/i)).toBeInTheDocument();
      });
    });

    it('should send notification to investor on rejection', async () => {
      const user = userEvent.setup();
      const pendingDocs = getKYCDocumentsByStatus('pending');
      
      const mockRpc = vi.fn().mockResolvedValue({ data: { success: true }, error: null });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: pendingDocs,
            error: null,
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ ...pendingDocs[0], verification_status: 'rejected' }],
            error: null,
          }),
        }),
      } as any);

      vi.mocked(supabase.rpc).mockImplementation(mockRpc);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/pan/i)).toBeInTheDocument();
      });

      const rejectButton = screen.getAllByRole('button', { name: /reject/i })[0];
      await user.click(rejectButton);

      const reasonField = screen.getByLabelText(/reason/i);
      await user.type(reasonField, 'Document expired, please upload current document');

      const submitButton = screen.getByRole('button', { name: /submit|confirm/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith(
          expect.stringContaining('send_kyc_rejection'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Filtering and Search', () => {
    it('should allow filtering by document type', async () => {
      const user = userEvent.setup();
      const allDocs = testKYCDocuments;
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: allDocs,
            error: null,
          }),
        }),
      } as any);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/filter/i)).toBeInTheDocument();
      });

      // Filter by PAN card
      const filterSelect = screen.getByLabelText(/document type|filter/i);
      await user.selectOptions(filterSelect, 'pan');

      await waitFor(() => {
        const panDocs = allDocs.filter(d => d.document_type === 'pan');
        expect(screen.getAllByText(/pan/i).length).toBeGreaterThanOrEqual(panDocs.length);
      });
    });

    it('should allow filtering by verification status', async () => {
      const user = userEvent.setup();
      const allDocs = testKYCDocuments;
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: allDocs,
            error: null,
          }),
        }),
      } as any);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/filter/i)).toBeInTheDocument();
      });

      const statusFilter = screen.getByLabelText(/status/i);
      await user.selectOptions(statusFilter, 'verified');

      await waitFor(() => {
        const verifiedDocs = getKYCDocumentsByStatus('verified');
        // Should show verified documents
        expect(screen.queryByText(/pending/i)).not.toBeInTheDocument();
      });
    });

    it('should allow searching by investor name or email', async () => {
      const user = userEvent.setup();
      const allDocs = testKYCDocuments;
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockResolvedValue({
              data: allDocs.filter(d => d.investor_id === testUsers.standard_investor.id),
              error: null,
            }),
          }),
        }),
      } as any);

      renderWithRouter(<KYCReviewDashboard />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'Rahul');

      await waitFor(() => {
        // Should filter results
        expect(supabase.from).toHaveBeenCalled();
      });
    });
  });

  describe('Audit Trail', () => {
    it('should log verification action in audit trail', async () => {
      const user = userEvent.setup();
      const pendingDocs = getKYCDocumentsByStatus('pending');
      
      const mockInsert = vi.fn().mockResolvedValue({ data: [{}], error: null });
      
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'kyc_documents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: pendingDocs,
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ ...pendingDocs[0], verification_status: 'verified' }],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: mockInsert,
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/pan/i)).toBeInTheDocument();
      });

      const verifyButton = screen.getAllByRole('button', { name: /verify|approve/i })[0];
      await user.click(verifyButton);

      const submitButton = screen.getByRole('button', { name: /submit|confirm/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: expect.stringContaining('kyc_verified'),
            user_id: complianceOfficer.id,
          })
        );
      });
    });

    it('should log rejection action in audit trail', async () => {
      const user = userEvent.setup();
      const pendingDocs = getKYCDocumentsByStatus('pending');
      
      const mockInsert = vi.fn().mockResolvedValue({ data: [{}], error: null });
      
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'kyc_documents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: pendingDocs,
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ ...pendingDocs[0], verification_status: 'rejected' }],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: mockInsert,
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/pan/i)).toBeInTheDocument();
      });

      const rejectButton = screen.getAllByRole('button', { name: /reject/i })[0];
      await user.click(rejectButton);

      const reasonField = screen.getByLabelText(/reason/i);
      await user.type(reasonField, 'Invalid document');

      const submitButton = screen.getByRole('button', { name: /submit|confirm/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action: expect.stringContaining('kyc_rejected'),
            user_id: complianceOfficer.id,
          })
        );
      });
    });
  });
});
