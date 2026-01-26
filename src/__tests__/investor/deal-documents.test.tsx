/**
 * US-INVESTOR-006: View Deal Documents
 * 
 * As an: Investor
 * I want to: View deal documents (pitch deck, financials, legal docs)
 * So that: I can conduct due diligence before committing
 * 
 * Acceptance Criteria:
 * - GIVEN I have expressed interest in a deal
 *   WHEN I navigate to deal documents
 *   THEN I see all available documents
 * 
 * - GIVEN documents are uploaded
 *   WHEN viewing list
 *   THEN I see document type, name, size, upload date
 * 
 * - GIVEN I click download
 *   WHEN downloading document
 *   THEN secure signed URL is generated
 * 
 * - GIVEN I haven't expressed interest
 *   WHEN trying to view documents
 *   THEN access is denied with message
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

import DealDocuments from '@/pages/investor/DealDocuments';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('US-INVESTOR-006: View Deal Documents', () => {
  const investor = testUsers.standard_investor;
  const mockSession = createMockSession(investor);

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
  });

  describe('Document List', () => {
    it('should display deal documents for interested investor', async () => {
      // Mock interest check
      const mockInterest = {
        id: 'interest-001',
        deal_id: 'deal-001',
        status: 'accepted'
      };

      const mockDocuments = [
        {
          id: 'doc-001',
          deal_id: 'deal-001',
          document_type: 'pitch_deck',
          file_name: 'HealthTech Pitch Deck.pdf',
          file_size: 2500000,
          uploaded_at: new Date().toISOString()
        },
        {
          id: 'doc-002',
          deal_id: 'deal-001',
          document_type: 'financials',
          file_name: 'Financial Statements Q4 2025.pdf',
          file_size: 1500000,
          uploaded_at: new Date().toISOString()
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockInterest,
              error: null,
            }),
          } as any;
        } else if (table === 'deal_documents') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockDocuments,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<DealDocuments />);

      await waitFor(() => {
        expect(screen.getByText(/HealthTech Pitch Deck/i)).toBeInTheDocument();
        expect(screen.getByText(/Financial Statements/i)).toBeInTheDocument();
      });
    });

    it('should show document metadata', async () => {
      const mockInterest = { id: 'interest-001', deal_id: 'deal-001', status: 'accepted' };
      const mockDocuments = [
        {
          id: 'doc-001',
          deal_id: 'deal-001',
          document_type: 'pitch_deck',
          file_name: 'Pitch Deck.pdf',
          file_size: 2500000, // 2.5 MB
          uploaded_at: '2026-01-20T10:00:00Z'
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockInterest, error: null }),
          } as any;
        } else if (table === 'deal_documents') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockDocuments, error: null }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<DealDocuments />);

      await waitFor(() => {
        expect(screen.getByText(/2.5 MB/i)).toBeInTheDocument();
      });
    });
  });

  describe('Access Control', () => {
    it('should deny access to non-interested investors', async () => {
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null, // No interest found
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<DealDocuments />);

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      });
    });

    it('should show message to express interest first', async () => {
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<DealDocuments />);

      await waitFor(() => {
        expect(screen.getByText(/express interest/i)).toBeInTheDocument();
      });
    });
  });

  describe('Document Download', () => {
    it('should allow downloading documents', async () => {
      const user = userEvent.setup();
      
      const mockInterest = { id: 'interest-001', deal_id: 'deal-001', status: 'accepted' };
      const mockDocuments = [
        {
          id: 'doc-001',
          deal_id: 'deal-001',
          document_type: 'pitch_deck',
          file_name: 'Pitch Deck.pdf',
          file_path: 'deals/deal-001/pitch-deck.pdf',
          file_size: 2500000,
          uploaded_at: new Date().toISOString()
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockInterest, error: null }),
          } as any;
        } else if (table === 'deal_documents') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockDocuments, error: null }),
          } as any;
        }
        return {} as any;
      });

      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://storage.example.com/signed-url' },
          error: null,
        }),
      } as any);

      renderWithRouter(<DealDocuments />);

      await waitFor(() => {
        expect(screen.getByText(/Pitch Deck/i)).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      await user.click(downloadButtons[0]);

      await waitFor(() => {
        expect(supabase.storage.from).toHaveBeenCalledWith('deal-documents');
      });
    });
  });

  describe('Document Types', () => {
    it('should display different document type badges', async () => {
      const mockInterest = { id: 'interest-001', deal_id: 'deal-001', status: 'accepted' };
      const mockDocuments = [
        {
          id: 'doc-001',
          deal_id: 'deal-001',
          document_type: 'pitch_deck',
          file_name: 'Pitch.pdf',
          file_size: 1000000,
          uploaded_at: new Date().toISOString()
        },
        {
          id: 'doc-002',
          deal_id: 'deal-001',
          document_type: 'financials',
          file_name: 'Financials.pdf',
          file_size: 1000000,
          uploaded_at: new Date().toISOString()
        },
        {
          id: 'doc-003',
          deal_id: 'deal-001',
          document_type: 'legal',
          file_name: 'Legal.pdf',
          file_size: 1000000,
          uploaded_at: new Date().toISOString()
        }
      ];

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockInterest, error: null }),
          } as any;
        } else if (table === 'deal_documents') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockDocuments, error: null }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<DealDocuments />);

      await waitFor(() => {
        expect(screen.getByText(/Pitch Deck/i)).toBeInTheDocument();
        expect(screen.getByText(/Financials/i)).toBeInTheDocument();
        expect(screen.getByText(/Legal/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show message when no documents available', async () => {
      const mockInterest = { id: 'interest-001', deal_id: 'deal-001', status: 'accepted' };

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'deal_interests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockInterest, error: null }),
          } as any;
        } else if (table === 'deal_documents') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as any;
        }
        return {} as any;
      });

      renderWithRouter(<DealDocuments />);

      await waitFor(() => {
        expect(screen.getByText(/no documents available/i)).toBeInTheDocument();
      });
    });
  });
});
