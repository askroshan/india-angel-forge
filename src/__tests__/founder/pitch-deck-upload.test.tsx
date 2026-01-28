import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import UploadPitchDeck from '../../pages/founder/UploadPitchDeck';
import { apiClient } from '../../api/client';

// Mock the API client
vi.mock('../../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UploadPitchDeck />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('US-FOUNDER-005: Upload Pitch Deck and Documents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('Basic Rendering', () => {
    it('should display the page title', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /pitch.*deck/i })).toBeInTheDocument();
      });
    });

    it('should display upload document sections', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      renderComponent();
      
      await waitFor(() => {
        const pitchTexts = screen.getAllByText(/pitch deck/i);
        expect(pitchTexts.length).toBeGreaterThan(0);
      }, { timeout: 500 });
    });
  });

  describe('Document Types', () => {
    it('should display pitch deck upload option', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      renderComponent();
      
      await waitFor(() => {
        const pitchTexts = screen.getAllByText(/pitch deck/i);
        expect(pitchTexts.length).toBeGreaterThan(0);
      }, { timeout: 500 });
    });

    it('should display financial model upload option', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      renderComponent();
      
      await waitFor(() => {
        const modelTexts = screen.getAllByText(/financial model/i);
        expect(modelTexts.length).toBeGreaterThan(0);
      }, { timeout: 500 });
    });

    it('should display cap table upload option', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      renderComponent();
      
      await waitFor(() => {
        const capTexts = screen.getAllByText(/cap table/i);
        expect(capTexts.length).toBeGreaterThan(0);
      }, { timeout: 500 });
    });
  });

  describe('Document List', () => {
    it('should display uploaded documents', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(
        [
          {
            id: '1',
            deal_id: 'deal1',
            document_type: 'pitch_deck',
            file_name: 'Pitch Deck.pdf',
            file_url: 'https://example.com/pitch.pdf',
            file_size: 1024000,
            uploaded_at: '2024-01-15T10:00:00Z',
            view_count: 5,
          },
        ]
      );

      renderComponent();
      
      await waitFor(() => {
        const documentNames = screen.getAllByText('Pitch Deck.pdf');
        expect(documentNames.length).toBeGreaterThan(0);
      });
    });

    it('should display document file size', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(
        [
          {
            id: '1',
            deal_id: 'deal1',
            document_type: 'pitch_deck',
            file_name: 'Pitch Deck.pdf',
            file_url: 'https://example.com/pitch.pdf',
            file_size: 1024000,
            uploaded_at: '2024-01-15T10:00:00Z',
            view_count: 5,
          },
        ]
      );

      renderComponent();
      
      await waitFor(() => {
        const fileSizes = screen.getAllByText(/1000\.0 KB/i);
        expect(fileSizes.length).toBeGreaterThan(0);
      });
    });

    it('should display document upload date', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(
        [
          {
            id: '1',
            deal_id: 'deal1',
            document_type: 'pitch_deck',
            file_name: 'Pitch Deck.pdf',
            file_url: 'https://example.com/pitch.pdf',
            file_size: 1024000,
            uploaded_at: '2024-01-15T10:00:00Z',
            view_count: 5,
          },
        ]
      );

      renderComponent();
      
      await waitFor(() => {
        const dates = screen.getAllByText(/15 january 2024/i);
        expect(dates.length).toBeGreaterThan(0);
      });
    });

    it('should display view count', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(
        [
          {
            id: '1',
            deal_id: 'deal1',
            document_type: 'pitch_deck',
            file_name: 'Pitch Deck.pdf',
            file_url: 'https://example.com/pitch.pdf',
            file_size: 1024000,
            uploaded_at: '2024-01-15T10:00:00Z',
            view_count: 5,
          },
        ]
      );

      renderComponent();
      
      await waitFor(() => {
        const viewTexts = screen.getAllByText(/5.*view/i);
        expect(viewTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Loading States', () => {
    it('should display loading state initially', () => {
      vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));

      renderComponent();
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when documents fail to load', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to fetch documents'));

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/error loading documents/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display upload buttons when no documents uploaded', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/upload pitch deck/i)).toBeInTheDocument();
        expect(screen.getByText(/upload financial model/i)).toBeInTheDocument();
      });
    });
  });
});
