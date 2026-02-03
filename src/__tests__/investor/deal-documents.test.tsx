/**
 * US-INVESTOR-006: View Deal Documents
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DealDocuments from '@/pages/investor/DealDocuments';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/api/client';
import { Mock } from 'vitest';

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

    (apiClient.get as Mock).mockImplementation((url: string) => {
      if (url.includes('/interest')) {
        return Promise.resolve({ id: 'interest-001', deal: { title: 'Test Deal' } });
      }
      if (url.includes('/documents')) {
        return Promise.resolve(mockDocs);
      }
      return Promise.resolve(null);
    });

    render(<BrowserRouter><DealDocuments /></BrowserRouter>);

    await waitFor(() => {
      // Check file name appears (in the card title)
      expect(screen.getByText('Pitch Deck.pdf')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should deny access to non-interested investors', async () => {
    (apiClient.get as Mock).mockImplementation((url: string) => {
      if (url.includes('/interest')) {
        return Promise.reject(new Error('Not found'));
      }
      return Promise.resolve([]);
    });

    render(<BrowserRouter><DealDocuments /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
