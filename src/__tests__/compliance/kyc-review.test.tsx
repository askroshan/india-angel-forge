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
 * Status: Implementing
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Component to be implemented
import KYCReviewDashboard from '@/pages/compliance/KYCReviewDashboard';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'compliance-officer-001',
      email: 'compliance@example.com',
      role: 'compliance_officer'
    },
    token: 'mock-token',
    isAuthenticated: true
  })
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Test data
const mockKYCDocuments = [
  {
    id: 'kyc-001',
    investorId: 'investor-001',
    investorName: 'Priya Sharma',
    investorEmail: 'priya@example.com',
    documentType: 'pan',
    filePath: 'kyc/pan_priya.pdf',
    verificationStatus: 'pending',
    uploadedAt: '2025-01-24T10:00:00Z'
  },
  {
    id: 'kyc-002',
    investorId: 'investor-001',
    investorName: 'Priya Sharma',
    investorEmail: 'priya@example.com',
    documentType: 'aadhaar',
    filePath: 'kyc/aadhaar_priya.pdf',
    verificationStatus: 'pending',
    uploadedAt: '2025-01-24T10:05:00Z'
  },
  {
    id: 'kyc-003',
    investorId: 'investor-002',
    investorName: 'Rahul Kumar',
    investorEmail: 'rahul@example.com',
    documentType: 'pan',
    filePath: 'kyc/pan_rahul.pdf',
    verificationStatus: 'verified',
    uploadedAt: '2025-01-23T09:00:00Z',
    verifiedAt: '2025-01-23T11:00:00Z',
    verifiedBy: 'compliance-officer-001'
  },
  {
    id: 'kyc-004',
    investorId: 'investor-003',
    investorName: 'Amit Patel',
    investorEmail: 'amit@example.com',
    documentType: 'bank_statement',
    filePath: 'kyc/bank_amit.pdf',
    verificationStatus: 'rejected',
    uploadedAt: '2025-01-22T08:00:00Z',
    rejectionReason: 'Document is illegible'
  }
];

const pendingDocuments = mockKYCDocuments.filter(d => d.verificationStatus === 'pending');

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Helper to create a successful fetch mock that works for both checkAccess and fetchDocuments
const createSuccessFetchMock = (documents = mockKYCDocuments) => {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(documents)
  } as Response);
};

describe('US-COMPLIANCE-001: KYC Document Review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for fetch - returns mockKYCDocuments for both checkAccess and fetchDocuments calls
    global.fetch = createSuccessFetchMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Dashboard Access & Display', () => {
    it('should display KYC review dashboard for compliance officer', async () => {
      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /KYC Document Review/i })).toBeInTheDocument();
      });
    });

    it('should show list of KYC documents', async () => {
      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        // Use getAllByText since Priya Sharma has multiple documents
        expect(screen.getAllByText(/Priya Sharma/i).length).toBeGreaterThan(0);
      });
    });

    it('should display document metadata (type, investor)', async () => {
      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getAllByText(/PAN/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Priya Sharma/i).length).toBeGreaterThan(0);
      });
    });

    it('should deny access to non-compliance users', async () => {
      // Mock unauthorized response for checkAccess
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Forbidden' })
      } as Response);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      });
    });
  });

  describe('Document Viewing', () => {
    it('should allow viewing document when clicked', async () => {
      const user = userEvent.setup();
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getAllByText(/Priya Sharma/i).length).toBeGreaterThan(0);
      });

      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      await user.click(viewButtons[0]);

      expect(windowOpenSpy).toHaveBeenCalled();
    });
  });

  describe('Document Verification', () => {
    it('should allow marking document as verified', async () => {
      const user = userEvent.setup();

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getAllByText(/Priya Sharma/i).length).toBeGreaterThan(0);
      });

      // Click verify button (should be available for pending documents)
      const verifyButtons = screen.getAllByRole('button', { name: /verify/i });
      await user.click(verifyButtons[0]);

      // Should open dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Verify Document/i)).toBeInTheDocument();
      });
    });

    it('should update document status to verified via API', async () => {
      const user = userEvent.setup();
      
      // Mock both initial fetches, then the PATCH, then re-fetch
      const mockFetch = vi.fn()
        // First call: checkAccess
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(pendingDocuments)
        } as Response)
        // Second call: fetchDocuments
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(pendingDocuments)
        } as Response)
        // Third call: PATCH to verify
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true })
        } as Response)
        // Fourth call: re-fetch documents
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([])
        } as Response);

      global.fetch = mockFetch;

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getAllByText(/Priya Sharma/i).length).toBeGreaterThan(0);
      });

      const verifyButtons = screen.getAllByRole('button', { name: /verify/i });
      await user.click(verifyButtons[0]);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click the Confirm Verification button
      const confirmButton = screen.getByRole('button', { name: /Confirm Verification/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/compliance/kyc-review/'),
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('verified')
          })
        );
      });
    });
  });

  describe('Document Rejection', () => {
    it('should allow rejecting document with reason', async () => {
      const user = userEvent.setup();
      
      // Mock fetch calls
      const mockFetch = vi.fn()
        // checkAccess
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(pendingDocuments)
        } as Response)
        // fetchDocuments
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(pendingDocuments)
        } as Response)
        // PATCH to reject
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true })
        } as Response)
        // re-fetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([])
        } as Response);

      global.fetch = mockFetch;

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getAllByText(/Priya Sharma/i).length).toBeGreaterThan(0);
      });

      // Click reject button
      const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
      await user.click(rejectButtons[0]);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Reject Document/i)).toBeInTheDocument();
      });

      // Enter rejection reason
      const reasonField = screen.getByLabelText(/Rejection Reason/i);
      await user.type(reasonField, 'Document is not clear, please upload high quality scan');

      // Submit rejection
      const submitButton = screen.getByRole('button', { name: /Submit Rejection/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/compliance/kyc-review/'),
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('rejected')
          })
        );
      });
    });

    it('should require rejection reason when rejecting', async () => {
      const user = userEvent.setup();

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getAllByText(/Priya Sharma/i).length).toBeGreaterThan(0);
      });

      const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
      await user.click(rejectButtons[0]);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Try to submit without reason - the dialog should stay open
      const submitButton = screen.getByRole('button', { name: /Submit Rejection/i });
      await user.click(submitButton);

      // The dialog should remain open because we didn't enter a reason
      await waitFor(() => {
        // Dialog should still be visible
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        // The rejection reason field should still be there
        expect(screen.getByLabelText(/Rejection Reason/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should allow filtering by verification status', async () => {
      const user = userEvent.setup();

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      });

      const statusFilter = screen.getByLabelText(/status/i);
      await user.click(statusFilter);

      const pendingOption = await screen.findByRole('option', { name: /pending/i });
      await user.click(pendingOption);

      // Should filter documents
      await waitFor(() => {
        expect(statusFilter).toBeInTheDocument();
      });
    });

    it('should allow searching by investor name', async () => {
      const user = userEvent.setup();

      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getAllByText(/Priya Sharma/i).length).toBeGreaterThan(0);
      });

      const searchInput = screen.getByPlaceholderText(/name or email/i);
      await user.type(searchInput, 'Rahul');

      await waitFor(() => {
        expect(searchInput).toHaveValue('Rahul');
      });
    });
  });

  describe('Document Status Display', () => {
    it('should display verified status badge', async () => {
      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        // There should be at least one verified badge
        expect(screen.getAllByText(/verified/i).length).toBeGreaterThan(0);
      });
    });

    it('should display pending status badge', async () => {
      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        // There should be pending badges for pending documents
        expect(screen.getAllByText(/pending/i).length).toBeGreaterThan(0);
      });
    });

    it('should display rejection reason for rejected documents', async () => {
      renderWithRouter(<KYCReviewDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Document is illegible/i)).toBeInTheDocument();
      });
    });
  });
});
