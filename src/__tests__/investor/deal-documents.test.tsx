/**
 * US-INVESTOR-006: View Deal Documents
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DealDocuments from '@/pages/investor/DealDocuments';

const createChainableMock = (finalData: unknown, finalError: unknown = null) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: finalData, error: finalError }),
  order: vi.fn().mockResolvedValue({ data: finalData, error: finalError }),
});

// ...existing code...

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'investor-1', email: 'investor@example.com', role: 'INVESTOR' },
    token: 'mock-token',
    isAuthenticated: true
  })
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ dealId: 'deal-001' })
  };
});

describe('US-INVESTOR-006: View Deal Documents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display deal documents for interested investor', async () => {
    const mockDocs = [
      {
        id: 'doc-001',
        deal_id: 'deal-001',
        document_type: 'pitch_deck',
        file_name: 'Pitch Deck.pdf',
        file_size: 2500000,
        uploaded_at: new Date().toISOString()
      }
    ];

    const interestChain = createChainableMock({ 
      id: 'interest-001', 
      deal_id: 'deal-001', 
      deal: { title: 'Test Deal' } 
    });
    const documentsChain = createChainableMock(mockDocs);

    // TODO: Replace with mock for new API fetch implementation

    render(<BrowserRouter><DealDocuments /></BrowserRouter>);

    await waitFor(() => {
      // Check file name appears (in the card title)
      expect(screen.getByText('Pitch Deck.pdf')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should deny access to non-interested investors', async () => {
    const interestChain = createChainableMock(null, { message: 'Not found' });

    // TODO: Replace with mock for new API fetch implementation

    render(<BrowserRouter><DealDocuments /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
