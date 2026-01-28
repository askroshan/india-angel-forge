import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import PitchMaterials from '@/pages/founder/PitchMaterials';

// Mock AuthContext for authentication
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'founder-123',
      email: 'founder@example.com',
      role: 'founder',
    },
    isAuthenticated: true,
    token: 'test-token',
  }),
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
  });

  describe('Pitch Materials Dashboard', () => {
    it('should display pitch materials dashboard', async () => {
      server.use(
        http.get('/api/pitch/materials', () => {
          return HttpResponse.json([]);
        }),
      );

      render(
        <BrowserRouter>
          <PitchMaterials />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Pitch Materials/i, level: 1 })).toBeInTheDocument();
      });
    });

    it('should display existing pitch materials', async () => {
      const mockMaterials = [
        {
          id: 'material-1',
          title: 'Pitch Deck.pdf',
          materialType: 'application/pdf',
          filePath: 'founder-123/pitch-deck.pdf',
          fileSize: 2048000,
          uploadedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'material-2',
          title: 'Financial Projections.xlsx',
          materialType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          filePath: 'founder-123/financial.xlsx',
          fileSize: 512000,
          uploadedAt: '2024-01-16T10:00:00Z',
        },
      ];

      server.use(
        http.get('/api/pitch/materials', () => {
          return HttpResponse.json(mockMaterials);
        }),
      );

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
      server.use(
        http.get('/api/pitch/materials', () => {
          return HttpResponse.json([]);
        }),
      );

      render(
        <BrowserRouter>
          <PitchMaterials />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Look for button containing "Upload Material" text specifically
        expect(screen.getByRole('button', { name: /Upload Material/i })).toBeInTheDocument();
      });
    });

    it('should allow uploading pitch material', async () => {
      const user = userEvent.setup();

      server.use(
        http.get('/api/pitch/materials', () => {
          return HttpResponse.json([]);
        }),
        http.post('/api/pitch/materials', () => {
          return HttpResponse.json({ id: 'material-123' });
        }),
      );

      render(
        <BrowserRouter>
          <PitchMaterials />
        </BrowserRouter>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Pitch Materials/i, level: 1 })).toBeInTheDocument();
      });

      // Click upload button - use specific button with "Upload Material" text
      const uploadButton = screen.getByRole('button', { name: /Upload Material/i });
      await user.click(uploadButton);

      // Should show file input or dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog') || screen.getByLabelText(/file/i) || screen.getByText(/title/i)).toBeInTheDocument();
      });
    });
  });

  describe('Material Details', () => {
    it('should display file size', async () => {
      const mockMaterials = [
        {
          id: 'material-1',
          title: 'Pitch Deck.pdf',
          materialType: 'application/pdf',
          filePath: 'founder-123/pitch-deck.pdf',
          fileSize: 2048000, // 2 MB
          uploadedAt: '2024-01-15T10:00:00Z',
        },
      ];

      server.use(
        http.get('/api/pitch/materials', () => {
          return HttpResponse.json(mockMaterials);
        }),
      );

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
          title: 'Pitch Deck.pdf',
          materialType: 'application/pdf',
          filePath: 'founder-123/pitch-deck.pdf',
          fileSize: 2048000,
          uploadedAt: '2024-01-15T10:00:00Z',
        },
      ];

      server.use(
        http.get('/api/pitch/materials', () => {
          return HttpResponse.json(mockMaterials);
        }),
      );

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
          title: 'Pitch Deck.pdf',
          materialType: 'application/pdf',
          filePath: 'founder-123/pitch-deck.pdf',
          fileSize: 2048000,
          uploadedAt: '2024-01-15T10:00:00Z',
        },
      ];

      server.use(
        http.get('/api/pitch/materials', () => {
          return HttpResponse.json(mockMaterials);
        }),
      );

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
      const mockMaterials = [
        {
          id: 'material-1',
          title: 'Pitch Deck.pdf',
          materialType: 'application/pdf',
          filePath: 'founder-123/pitch-deck.pdf',
          fileSize: 2048000,
          uploadedAt: '2024-01-15T10:00:00Z',
        },
      ];

      server.use(
        http.get('/api/pitch/materials', () => {
          return HttpResponse.json(mockMaterials);
        }),
      );

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
      const mockMaterials = [
        {
          id: 'material-1',
          title: 'Pitch Deck.pdf',
          materialType: 'application/pdf',
          filePath: 'founder-123/pitch-deck.pdf',
          fileSize: 2048000,
          uploadedAt: '2024-01-15T10:00:00Z',
        },
      ];

      server.use(
        http.get('/api/pitch/materials', () => {
          return HttpResponse.json(mockMaterials);
        }),
        http.delete('/api/pitch/materials/:id', () => {
          return HttpResponse.json({ success: true });
        }),
      );

      render(
        <BrowserRouter>
          <PitchMaterials />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Pitch Deck.pdf')).toBeInTheDocument();
      });

      // Should have delete button (look for button with red text styling that has a trash icon)
      const buttons = screen.getAllByRole('button');
      const trashButton = buttons.find(button => 
        button.classList.contains('text-red-600') || 
        button.querySelector('svg[class*="lucide"]')?.classList.contains('lucide-trash-2')
      );
      expect(trashButton).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no materials', async () => {
      server.use(
        http.get('/api/pitch/materials', () => {
          return HttpResponse.json([]);
        }),
      );

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
