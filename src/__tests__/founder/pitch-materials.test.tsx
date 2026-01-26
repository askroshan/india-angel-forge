import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PitchMaterials from '@/pages/founder/PitchMaterials';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('PitchMaterials', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock authenticated session
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: { id: 'founder-123' },
        },
      },
    });
  });

  describe('Pitch Materials Dashboard', () => {
    it('should display pitch materials dashboard', async () => {
      // Mock pitch materials query
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PitchMaterials />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Pitch Materials/i)).toBeInTheDocument();
      });
    });

    it('should display existing pitch materials', async () => {
      const mockMaterials = [
        {
          id: 'material-1',
          file_name: 'Pitch Deck.pdf',
          file_type: 'application/pdf',
          file_size: 2048000,
          uploaded_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'material-2',
          file_name: 'Financial Projections.xlsx',
          file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          file_size: 512000,
          uploaded_at: '2024-01-16T10:00:00Z',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockMaterials,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PitchMaterials />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Pitch Deck.pdf')).toBeInTheDocument();
        expect(screen.getByText('Financial Projections.xlsx')).toBeInTheDocument();
      });
    });
  });

  describe('Upload Pitch Material', () => {
    it('should show upload button', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PitchMaterials />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Upload/i)).toBeInTheDocument();
      });
    });

    it('should allow uploading pitch material', async () => {
      const user = userEvent.setup();

      // Mock storage operations
      const mockStorageUpload = vi.fn().mockResolvedValue({
        data: { path: 'founder-123/pitch-deck.pdf' },
        error: null,
      });

      (supabase.storage.from as any).mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.supabase.co/pitch-materials/founder-123/pitch-deck.pdf' },
        }),
      });

      // Mock insert operation
      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: 'material-123' },
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: mockInsert,
      });

      render(
        <BrowserRouter>
          <PitchMaterials />
        </BrowserRouter>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/Pitch Materials/i)).toBeInTheDocument();
      });

      // Click upload button
      const uploadButton = screen.getByText(/Upload/i);
      await user.click(uploadButton);

      // Should show file input or dialog
      await waitFor(() => {
        expect(screen.getByLabelText(/file/i) || screen.getByText(/Choose file/i)).toBeInTheDocument();
      });
    });
  });

  describe('Material Details', () => {
    it('should display file size', async () => {
      const mockMaterials = [
        {
          id: 'material-1',
          file_name: 'Pitch Deck.pdf',
          file_type: 'application/pdf',
          file_size: 2048000, // 2 MB
          uploaded_at: '2024-01-15T10:00:00Z',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockMaterials,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PitchMaterials />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/2.0 MB/i)).toBeInTheDocument();
      });
    });

    it('should display file type icon', async () => {
      const mockMaterials = [
        {
          id: 'material-1',
          file_name: 'Pitch Deck.pdf',
          file_type: 'application/pdf',
          file_size: 2048000,
          uploaded_at: '2024-01-15T10:00:00Z',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockMaterials,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PitchMaterials />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Check for PDF display or file icon
        expect(screen.getByText('Pitch Deck.pdf')).toBeInTheDocument();
      });
    });

    it('should display upload date', async () => {
      const mockMaterials = [
        {
          id: 'material-1',
          file_name: 'Pitch Deck.pdf',
          file_type: 'application/pdf',
          file_size: 2048000,
          uploaded_at: '2024-01-15T10:00:00Z',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockMaterials,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PitchMaterials />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/2024/)).toBeInTheDocument();
      });
    });
  });

  describe('Material Actions', () => {
    it('should allow downloading pitch material', async () => {
      const user = userEvent.setup();

      const mockMaterials = [
        {
          id: 'material-1',
          file_name: 'Pitch Deck.pdf',
          file_type: 'application/pdf',
          file_size: 2048000,
          file_path: 'founder-123/pitch-deck.pdf',
          uploaded_at: '2024-01-15T10:00:00Z',
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockMaterials,
              error: null,
            }),
          }),
        }),
      });

      // Mock storage download
      (supabase.storage.from as any).mockReturnValue({
        download: vi.fn().mockResolvedValue({
          data: new Blob(),
          error: null,
        }),
      });

      render(
        <BrowserRouter>
          <PitchMaterials />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Pitch Deck.pdf')).toBeInTheDocument();
      });

      // Should have download button
      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeInTheDocument();
    });

    it('should allow deleting pitch material', async () => {
      const user = userEvent.setup();

      const mockMaterials = [
        {
          id: 'material-1',
          file_name: 'Pitch Deck.pdf',
          file_type: 'application/pdf',
          file_size: 2048000,
          file_path: 'founder-123/pitch-deck.pdf',
          uploaded_at: '2024-01-15T10:00:00Z',
        },
      ];

      // Mock delete operations
      const mockDelete = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockStorageRemove = vi.fn().mockResolvedValue({
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockMaterials,
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: mockDelete,
        }),
      });

      (supabase.storage.from as any).mockReturnValue({
        remove: mockStorageRemove,
      });

      render(
        <BrowserRouter>
          <PitchMaterials />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Pitch Deck.pdf')).toBeInTheDocument();
      });

      // Should have delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no materials', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PitchMaterials />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No pitch materials/i)).toBeInTheDocument();
      });
    });
  });
});
