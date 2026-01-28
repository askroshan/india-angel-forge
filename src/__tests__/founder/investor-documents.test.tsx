import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import InvestorDocuments from '@/pages/founder/InvestorDocuments';

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

describe('InvestorDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Documents Dashboard', () => {
    it('should display investor documents dashboard', async () => {
      server.use(
        http.get('/api/documents', () => {
          return HttpResponse.json([]);
        }),
      );

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
          fileName: 'Investment Terms.pdf',
          fileType: 'application/pdf',
          fileSize: 1024000,
          sharedAt: '2024-01-15T10:00:00Z',
          filePath: 'investor-123/terms.pdf',
          investorName: 'John Investor',
          investorEmail: 'john@investor.com',
        },
        {
          id: 'doc-2',
          fileName: 'Board Meeting Notes.docx',
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          fileSize: 512000,
          sharedAt: '2024-01-20T10:00:00Z',
          filePath: 'investor-123/notes.docx',
          investorName: 'Jane Capital',
          investorEmail: 'jane@capital.com',
        },
      ];

      server.use(
        http.get('/api/documents', () => {
          return HttpResponse.json(mockDocuments);
        }),
      );

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
          fileName: 'Terms.pdf',
          fileType: 'application/pdf',
          fileSize: 1024000,
          sharedAt: '2024-01-15T10:00:00Z',
          filePath: 'investor-123/terms.pdf',
          investorName: 'John Investor',
          investorEmail: 'john@investor.com',
        },
      ];

      server.use(
        http.get('/api/documents', () => {
          return HttpResponse.json(mockDocuments);
        }),
      );

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
          fileName: 'Terms.pdf',
          fileType: 'application/pdf',
          fileSize: 1024000, // 1 MB
          sharedAt: '2024-01-15T10:00:00Z',
          filePath: 'investor-123/terms.pdf',
          investorName: 'John Investor',
          investorEmail: 'john@investor.com',
        },
      ];

      server.use(
        http.get('/api/documents', () => {
          return HttpResponse.json(mockDocuments);
        }),
      );

      render(
        <BrowserRouter>
          <InvestorDocuments />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/1000.0 KB/i) || screen.getByText(/1.0 MB/i)).toBeInTheDocument();
      });
    });

    it('should display shared date', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          fileName: 'Terms.pdf',
          fileType: 'application/pdf',
          fileSize: 1024000,
          sharedAt: '2024-01-15T10:00:00Z',
          filePath: 'investor-123/terms.pdf',
          investorName: 'John Investor',
          investorEmail: 'john@investor.com',
        },
      ];

      server.use(
        http.get('/api/documents', () => {
          return HttpResponse.json(mockDocuments);
        }),
      );

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
      const mockDocuments = [
        {
          id: 'doc-1',
          fileName: 'Terms.pdf',
          fileType: 'application/pdf',
          fileSize: 1024000,
          sharedAt: '2024-01-15T10:00:00Z',
          filePath: 'investor-123/terms.pdf',
          investorName: 'John Investor',
          investorEmail: 'john@investor.com',
        },
      ];

      server.use(
        http.get('/api/documents', () => {
          return HttpResponse.json(mockDocuments);
        }),
      );

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
      server.use(
        http.get('/api/documents', () => {
          return HttpResponse.json([]);
        }),
      );

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
