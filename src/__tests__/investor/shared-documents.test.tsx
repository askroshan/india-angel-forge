import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SharedDocuments from '@/pages/investor/SharedDocuments';
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

describe('SharedDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock authenticated session
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: { id: 'investor-123' },
        },
      },
    });
  });

  describe('Shared Documents Dashboard', () => {
    it('should display shared documents dashboard', async () => {
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
          <SharedDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Shared Documents/i)).toBeInTheDocument();
      });
    });

    it('should display shared documents', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          file_name: 'Investment Agreement.pdf',
          file_type: 'application/pdf',
          file_size: 1024000,
          shared_at: '2024-01-15T10:00:00Z',
          company: {
            company_name: 'TechStartup Inc',
          },
        },
        {
          id: 'doc-2',
          file_name: 'Term Sheet.docx',
          file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          file_size: 512000,
          shared_at: '2024-01-20T10:00:00Z',
          company: {
            company_name: 'FinTech Solutions',
          },
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'portfolio_companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        if (table === 'shared_documents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockDocuments,
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      render(
        <BrowserRouter>
          <SharedDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Investment Agreement.pdf')).toBeInTheDocument();
        expect(screen.getByText('Term Sheet.docx')).toBeInTheDocument();
      });
    });
  });

  describe('Share Document', () => {
    it('should show share document button', async () => {
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
          <SharedDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Share Document/i)).toBeInTheDocument();
      });
    });

    it('should allow uploading and sharing document', async () => {
      const user = userEvent.setup();

      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'TechStartup Inc',
        },
      ];

      const mockStorageUpload = vi.fn().mockResolvedValue({
        data: { path: 'investor-123/agreement.pdf' },
        error: null,
      });

      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: 'doc-123' },
        error: null,
      });

      (supabase.storage.from as any).mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.supabase.co/shared-documents/investor-123/agreement.pdf' },
        }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'portfolio_companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockCompanies,
                error: null,
              }),
            }),
          };
        }
        if (table === 'shared_documents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
            insert: mockInsert,
          };
        }
      });

      render(
        <BrowserRouter>
          <SharedDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Share Document/i)).toBeInTheDocument();
      });

      const shareButton = screen.getByText(/Share Document/i);
      await user.click(shareButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/file/i) || screen.getByText(/Choose file/i)).toBeInTheDocument();
      });
    });

    it('should allow selecting company to share with', async () => {
      const user = userEvent.setup();

      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'TechStartup Inc',
        },
        {
          id: 'company-2',
          company_name: 'FinTech Solutions',
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'portfolio_companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockCompanies,
                error: null,
              }),
            }),
          };
        }
        if (table === 'shared_documents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({
              data: { id: 'doc-123' },
              error: null,
            }),
          };
        }
      });

      render(
        <BrowserRouter>
          <SharedDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Share Document/i)).toBeInTheDocument();
      });

      const shareButton = screen.getByText(/Share Document/i);
      await user.click(shareButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      });
    });
  });

  describe('Document Details', () => {
    it('should display file size', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          file_name: 'Agreement.pdf',
          file_type: 'application/pdf',
          file_size: 1024000, // 1 MB
          shared_at: '2024-01-15T10:00:00Z',
          company: {
            company_name: 'TechStartup Inc',
          },
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'portfolio_companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        if (table === 'shared_documents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockDocuments,
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      render(
        <BrowserRouter>
          <SharedDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/1.0 MB/i)).toBeInTheDocument();
      });
    });

    it('should display company name', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          file_name: 'Agreement.pdf',
          file_type: 'application/pdf',
          file_size: 1024000,
          shared_at: '2024-01-15T10:00:00Z',
          company: {
            company_name: 'TechStartup Inc',
          },
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'portfolio_companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        if (table === 'shared_documents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockDocuments,
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      render(
        <BrowserRouter>
          <SharedDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('TechStartup Inc')).toBeInTheDocument();
      });
    });

    it('should display shared date', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          file_name: 'Agreement.pdf',
          file_type: 'application/pdf',
          file_size: 1024000,
          shared_at: '2024-01-15T10:00:00Z',
          company: {
            company_name: 'TechStartup Inc',
          },
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'portfolio_companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        if (table === 'shared_documents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockDocuments,
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      render(
        <BrowserRouter>
          <SharedDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/2024/)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no documents', async () => {
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
          <SharedDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No documents shared/i)).toBeInTheDocument();
      });
    });
  });
});
