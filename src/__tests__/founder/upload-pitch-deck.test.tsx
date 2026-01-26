import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import UploadPitchDeck from '@/pages/founder/UploadPitchDeck';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'founder-1',
      email: 'founder@example.com',
      role: 'FOUNDER',
    },
    isAuthenticated: true,
  }),
}));

// Mock uploaded documents
const mockDocuments = [
  {
    id: 'doc-1',
    deal_id: 'deal-1',
    document_type: 'pitch_deck',
    file_name: 'Startup Pitch Deck.pdf',
    file_url: 'https://storage.example.com/pitch-deck.pdf',
    file_size: 2500000,
    uploaded_at: '2026-01-20T10:00:00Z',
    view_count: 15,
    last_viewed_at: '2026-01-24T15:30:00Z',
  },
  {
    id: 'doc-2',
    deal_id: 'deal-1',
    document_type: 'financial_model',
    file_name: 'Financial Projections.xlsx',
    file_url: 'https://storage.example.com/financial-model.xlsx',
    file_size: 850000,
    uploaded_at: '2026-01-21T14:00:00Z',
    view_count: 8,
    last_viewed_at: '2026-01-23T09:15:00Z',
  },
];

// Mock document viewers
const mockDocumentViewers = [
  {
    investor_id: 'investor-1',
    investor_name: 'Rajesh Kumar',
    document_id: 'doc-1',
    viewed_at: '2026-01-24T15:30:00Z',
    view_duration: 480,
  },
  {
    investor_id: 'investor-2',
    investor_name: 'Priya Sharma',
    document_id: 'doc-1',
    viewed_at: '2026-01-23T11:20:00Z',
    view_duration: 360,
  },
];

describe('US-FOUNDER-005: Upload Pitch Deck and Documents', () => {
  let queryClient: QueryClient;

  const renderWithProviders = (component: React.ReactElement) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Display', () => {
    it('should display upload pitch materials page', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

      renderWithProviders(<UploadPitchDeck />);

      expect(screen.getByText(/Upload Pitch Materials/i)).toBeInTheDocument();
    });

    it('should display list of uploaded documents', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDocuments });

      renderWithProviders(<UploadPitchDeck />);

      await waitFor(() => {
        expect(screen.getByText('Startup Pitch Deck.pdf')).toBeInTheDocument();
        expect(screen.getByText('Financial Projections.xlsx')).toBeInTheDocument();
      });
    });

    it('should display document metadata (type, size, upload date)', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDocuments });

      renderWithProviders(<UploadPitchDeck />);

      await waitFor(() => {
        expect(screen.getByText(/Pitch Deck/i)).toBeInTheDocument();
        expect(screen.getByText(/2.4 MB/i)).toBeInTheDocument();
        expect(screen.getByText(/January 20, 2026/i)).toBeInTheDocument();
      });
    });

    it('should display view counts for documents', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDocuments });

      renderWithProviders(<UploadPitchDeck />);

      await waitFor(() => {
        const viewCounts = screen.getAllByText(/15 views/i);
        expect(viewCounts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Upload Documents', () => {
    it('should display upload button for each document type', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

      renderWithProviders(<UploadPitchDeck />);

      await waitFor(() => {
        expect(screen.getByText(/Upload Pitch Deck/i)).toBeInTheDocument();
        expect(screen.getByText(/Upload Financial Model/i)).toBeInTheDocument();
        expect(screen.getByText(/Upload Demo Video/i)).toBeInTheDocument();
        expect(screen.getByText(/Upload Cap Table/i)).toBeInTheDocument();
      });
    });

    it('should allow selecting file for upload', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

      renderWithProviders(<UploadPitchDeck />);

      const uploadButton = await screen.findByText(/Upload Pitch Deck/i);
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Select File/i)).toBeInTheDocument();
      });
    });

    it('should validate file types', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

      renderWithProviders(<UploadPitchDeck />);

      const uploadButton = await screen.findByText(/Upload Pitch Deck/i);
      await user.click(uploadButton);

      await waitFor(() => {
        const fileInput = screen.getByLabelText(/Select File/i);
        expect(fileInput).toHaveAttribute('accept', '.pdf,.ppt,.pptx');
      });
    });

    it('should upload document successfully', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          id: 'doc-3',
          document_type: 'pitch_deck',
          file_name: 'New Pitch.pdf',
          file_url: 'https://storage.example.com/new-pitch.pdf',
        },
      });

      renderWithProviders(<UploadPitchDeck />);

      const uploadButton = await screen.findByText(/Upload Pitch Deck/i);
      await user.click(uploadButton);

      const fileInput = await screen.findByLabelText(/Select File/i);
      const file = new File(['content'], 'pitch.pdf', { type: 'application/pdf' });
      await user.upload(fileInput, file);

      const submitButton = screen.getByRole('button', { name: /Upload/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/api/deal-documents',
          expect.any(FormData)
        );
      });
    });

    it('should show success message after upload', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          id: 'doc-3',
          document_type: 'pitch_deck',
          file_name: 'New Pitch.pdf',
        },
      });

      renderWithProviders(<UploadPitchDeck />);

      const uploadButton = await screen.findByText(/Upload Pitch Deck/i);
      await user.click(uploadButton);

      const fileInput = await screen.findByLabelText(/Select File/i);
      const file = new File(['content'], 'pitch.pdf', { type: 'application/pdf' });
      await user.upload(fileInput, file);

      const submitButton = screen.getByRole('button', { name: /Upload/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Document uploaded successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Update Documents', () => {
    it('should display replace button for existing documents', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDocuments });

      renderWithProviders(<UploadPitchDeck />);

      await waitFor(() => {
        const replaceButtons = screen.getAllByText(/Replace/i);
        expect(replaceButtons.length).toBeGreaterThan(0);
      });
    });

    it('should allow replacing existing document', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDocuments });
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { id: 'doc-1', file_name: 'Updated Pitch.pdf' },
      });

      renderWithProviders(<UploadPitchDeck />);

      await waitFor(() => {
        const replaceButtons = screen.getAllByText(/Replace/i);
        expect(replaceButtons.length).toBeGreaterThan(0);
      });

      const replaceButton = screen.getAllByText(/Replace/i)[0];
      await user.click(replaceButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Select File/i)).toBeInTheDocument();
      });
    });

    it('should show confirmation before replacing document', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDocuments });

      renderWithProviders(<UploadPitchDeck />);

      await waitFor(() => {
        const replaceButtons = screen.getAllByText(/Replace/i);
        expect(replaceButtons.length).toBeGreaterThan(0);
      });

      const replaceButton = screen.getAllByText(/Replace/i)[0];
      await user.click(replaceButton);

      await waitFor(() => {
        expect(screen.getByText(/This will replace the existing document/i)).toBeInTheDocument();
      });
    });
  });

  describe('View Document Analytics', () => {
    it('should display who viewed documents', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/deal-documents') {
          return Promise.resolve({ data: mockDocuments });
        }
        if (url.includes('/api/document-views/')) {
          return Promise.resolve({ data: mockDocumentViewers });
        }
        return Promise.resolve({ data: [] });
      });

      renderWithProviders(<UploadPitchDeck />);

      await waitFor(() => {
        expect(screen.getByText('Startup Pitch Deck.pdf')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const viewDetailsButton = screen.getAllByText(/View Details/i)[0];
      await user.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      });
    });

    it('should display view timestamps', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/deal-documents') {
          return Promise.resolve({ data: mockDocuments });
        }
        if (url.includes('/api/document-views/')) {
          return Promise.resolve({ data: mockDocumentViewers });
        }
        return Promise.resolve({ data: [] });
      });

      renderWithProviders(<UploadPitchDeck />);

      await waitFor(() => {
        expect(screen.getByText('Startup Pitch Deck.pdf')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const viewDetailsButton = screen.getAllByText(/View Details/i)[0];
      await user.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText(/January 24, 2026/i)).toBeInTheDocument();
      });
    });

    it('should display view duration', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/deal-documents') {
          return Promise.resolve({ data: mockDocuments });
        }
        if (url.includes('/api/document-views/')) {
          return Promise.resolve({ data: mockDocumentViewers });
        }
        return Promise.resolve({ data: [] });
      });

      renderWithProviders(<UploadPitchDeck />);

      await waitFor(() => {
        expect(screen.getByText('Startup Pitch Deck.pdf')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const viewDetailsButton = screen.getAllByText(/View Details/i)[0];
      await user.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText(/8 minutes/i)).toBeInTheDocument();
        expect(screen.getByText(/6 minutes/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to load documents'));

      renderWithProviders(<UploadPitchDeck />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading documents/i)).toBeInTheDocument();
      });
    });

    it('should handle upload error gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Upload failed'));

      renderWithProviders(<UploadPitchDeck />);

      const uploadButton = await screen.findByText(/Upload Pitch Deck/i);
      await user.click(uploadButton);

      const fileInput = await screen.findByLabelText(/Select File/i);
      const file = new File(['content'], 'pitch.pdf', { type: 'application/pdf' });
      await user.upload(fileInput, file);

      const submitButton = screen.getByRole('button', { name: /Upload/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to upload document/i)).toBeInTheDocument();
      });
    });
  });
});
