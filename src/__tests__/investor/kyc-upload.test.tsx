/**
 * US-INVESTOR-002: Upload KYC Documents
 * 
 * As an: Investor
 * I want to: Upload my KYC documents (PAN, Aadhaar, Bank Statements, Income Proof)
 * So that: I can complete membership verification process
 * 
 * Acceptance Criteria:
 * - GIVEN I am logged in as investor
 *   WHEN I navigate to KYC upload page
 *   THEN I see upload form for each required document
 * 
 * - GIVEN I have selected a file
 *   WHEN I click upload
 *   THEN file is uploaded and status shows pending
 * 
 * - GIVEN documents are verified
 *   WHEN I view my KYC status
 *   THEN I see verified badge with date
 * 
 * - GIVEN document is rejected
 *   WHEN I check status
 *   THEN I see reason and can reupload
 * 
 * Priority: Critical
 * Status: Implemented
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { testUsers, createMockSession } from '../fixtures/testData';

import KYCUpload from '@/pages/investor/KYCUpload';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-INVESTOR-002: Upload KYC Documents', () => {
  const investor = testUsers.standard_investor;
  const mockSession = createMockSession(investor);

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
  });

  describe('Upload Form Display', () => {
    it('should display KYC upload form for investor', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: { id: 'investor-app-001' },
          error: null,
        }),
      } as any);

      renderWithRouter(<KYCUpload />);

      await waitFor(() => {
        expect(screen.getByText(/Upload KYC Documents/i)).toBeInTheDocument();
      });
    });

    it('should show required document types', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: { id: 'investor-app-001' },
          error: null,
        }),
      } as any);

      renderWithRouter(<KYCUpload />);

      await waitFor(() => {
        expect(screen.getAllByText(/PAN Card/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Aadhaar/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Bank Statement/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Income Proof/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Document Upload', () => {
    it('should allow selecting and uploading file', async () => {
      const user = userEvent.setup();
      
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: { id: 'investor-app-001' },
          error: null,
        }),
        insert: vi.fn().mockResolvedValue({
          data: [{ id: 'kyc-001' }],
          error: null,
        }),
      } as any);

      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'kyc/test.pdf' },
          error: null,
        }),
      } as any);

      renderWithRouter(<KYCUpload />);

      await waitFor(() => {
        expect(screen.getByText(/PAN Card/i)).toBeInTheDocument();
      });

      const file = new File(['dummy content'], 'pan.pdf', { type: 'application/pdf' });
      const input = screen.getAllByLabelText(/upload/i)[0];
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(supabase.storage.from).toHaveBeenCalledWith('kyc-documents');
      });
    });

    it('should show success message after upload', async () => {
      const user = userEvent.setup();
      
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: { id: 'investor-app-001' },
          error: null,
        }),
        insert: vi.fn().mockResolvedValue({
          data: [{ id: 'kyc-001' }],
          error: null,
        }),
      } as any);

      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'kyc/test.pdf' },
          error: null,
        }),
      } as any);

      renderWithRouter(<KYCUpload />);

      await waitFor(() => {
        expect(screen.getByText(/PAN Card/i)).toBeInTheDocument();
      });

      const file = new File(['dummy'], 'pan.pdf', { type: 'application/pdf' });
      const input = screen.getAllByLabelText(/upload/i)[0];
      
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/success|uploaded/i)).toBeInTheDocument();
      });
    });
  });

  describe('Document Status Display', () => {
    it('should show pending status for uploaded documents', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'kyc-001',
              document_type: 'pan',
              verification_status: 'pending',
              uploaded_at: new Date().toISOString(),
            },
          ],
          error: null,
        }),
      } as any);

      renderWithRouter(<KYCUpload />);

      await waitFor(() => {
        expect(screen.getByText(/pending/i)).toBeInTheDocument();
      });
    });

    it('should show verified badge for approved documents', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'kyc-001',
              document_type: 'pan',
              verification_status: 'verified',
              verified_at: '2025-01-20T10:00:00Z',
            },
          ],
          error: null,
        }),
      } as any);

      renderWithRouter(<KYCUpload />);

      await waitFor(() => {
        expect(screen.getByText(/verified/i)).toBeInTheDocument();
      });
    });

    it('should show rejection reason for rejected documents', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'kyc-001',
              document_type: 'pan',
              verification_status: 'rejected',
              rejection_reason: 'Document not clear',
            },
          ],
          error: null,
        }),
      } as any);

      renderWithRouter(<KYCUpload />);

      await waitFor(() => {
        expect(screen.getByText(/rejected/i)).toBeInTheDocument();
        expect(screen.getByText(/Document not clear/i)).toBeInTheDocument();
      });
    });

    it('should allow reuploading rejected documents', async () => {
      const user = userEvent.setup();
      
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'kyc-001',
              document_type: 'pan',
              verification_status: 'rejected',
              rejection_reason: 'Document expired',
            },
          ],
          error: null,
        }),
        insert: vi.fn().mockResolvedValue({
          data: [{ id: 'kyc-002' }],
          error: null,
        }),
      } as any);

      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'kyc/new.pdf' },
          error: null,
        }),
      } as any);

      renderWithRouter(<KYCUpload />);

      await waitFor(() => {
        expect(screen.getByText(/rejected/i)).toBeInTheDocument();
      });

      const reuploadButton = screen.getByRole('button', { name: /reupload|upload again/i });
      await user.click(reuploadButton);

      await waitFor(() => {
        const input = screen.getAllByLabelText(/upload/i)[0];
        expect(input).toBeInTheDocument();
      });
    });
  });
});
