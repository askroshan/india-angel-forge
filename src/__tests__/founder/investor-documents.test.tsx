import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import InvestorDocuments from '@/pages/founder/InvestorDocuments';
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

describe('InvestorDocuments', () => {
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

  describe('Documents Dashboard', () => {
    it('should display investor documents dashboard', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <InvestorDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Investor Documents/i)).toBeInTheDocument();
      });
    });

    it('should display shared documents', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          file_name: 'Investment Terms.pdf',
          file_type: 'application/pdf',
          file_size: 1024000,
          shared_at: '2024-01-15T10:00:00Z',
          file_path: 'investor-123/terms.pdf',
          investor: {
            full_name: 'John Investor',
            email: 'john@investor.com',
          },
        },
        {
          id: 'doc-2',
          file_name: 'Board Meeting Notes.docx',
          file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          file_size: 512000,
          shared_at: '2024-01-20T10:00:00Z',
          file_path: 'investor-123/notes.docx',
          investor: {
            full_name: 'Jane Capital',
            email: 'jane@capital.com',
          },
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'portfolio_companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'company-123' },
                  error: null,
                }),
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
          <InvestorDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Investment Terms.pdf')).toBeInTheDocument();
        expect(screen.getByText('Board Meeting Notes.docx')).toBeInTheDocument();
      });
    });
  });

  describe('Document Details', () => {
    it('should display investor name', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          file_name: 'Terms.pdf',
          file_type: 'application/pdf',
          file_size: 1024000,
          shared_at: '2024-01-15T10:00:00Z',
          file_path: 'investor-123/terms.pdf',
          investor: {
            full_name: 'John Investor',
            email: 'john@investor.com',
          },
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'portfolio_companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'company-123' },
                  error: null,
                }),
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
          <InvestorDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Investor')).toBeInTheDocument();
      });
    });

    it('should display file size', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          file_name: 'Terms.pdf',
          file_type: 'application/pdf',
          file_size: 1024000, // 1 MB
          shared_at: '2024-01-15T10:00:00Z',
          file_path: 'investor-123/terms.pdf',
          investor: {
            full_name: 'John Investor',
            email: 'john@investor.com',
          },
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'portfolio_companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'company-123' },
                  error: null,
                }),
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
          <InvestorDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/1.0 MB/i)).toBeInTheDocument();
      });
    });

    it('should display shared date', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          file_name: 'Terms.pdf',
          file_type: 'application/pdf',
          file_size: 1024000,
          shared_at: '2024-01-15T10:00:00Z',
          file_path: 'investor-123/terms.pdf',
          investor: {
            full_name: 'John Investor',
            email: 'john@investor.com',
          },
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'portfolio_companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'company-123' },
                  error: null,
                }),
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
          <InvestorDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/2024/)).toBeInTheDocument();
      });
    });
  });

  describe('Download Document', () => {
    it('should allow downloading document', async () => {
      const user = userEvent.setup();

      const mockDocuments = [
        {
          id: 'doc-1',
          file_name: 'Terms.pdf',
          file_type: 'application/pdf',
          file_size: 1024000,
          shared_at: '2024-01-15T10:00:00Z',
          file_path: 'investor-123/terms.pdf',
          investor: {
            full_name: 'John Investor',
            email: 'john@investor.com',
          },
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'portfolio_companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'company-123' },
                  error: null,
                }),
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

      (supabase.storage.from as any).mockReturnValue({
        download: vi.fn().mockResolvedValue({
          data: new Blob(),
          error: null,
        }),
      });

      render(
        <BrowserRouter>
          <InvestorDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Terms.pdf')).toBeInTheDocument();
      });

      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no documents', async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'portfolio_companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'company-123' },
                  error: null,
                }),
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
          };
        }
      });

      render(
        <BrowserRouter>
          <InvestorDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No documents/i)).toBeInTheDocument();
      });
    });
  });
});
