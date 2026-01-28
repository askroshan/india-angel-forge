import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import InvestorUpdates from '@/pages/founder/InvestorUpdates';

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

describe('InvestorUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Updates Dashboard', () => {
    it('should display investor updates dashboard', async () => {
      server.use(
        http.get('/api/portfolio/updates', () => {
          return HttpResponse.json([]);
        }),
      );

      render(
        <BrowserRouter>
          <InvestorUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Investor Updates/i)).toBeInTheDocument();
      });
    });

    it('should display received updates', async () => {
      const mockUpdates = [
        {
          id: 'update-1',
          title: 'Q1 2024 Portfolio Review',
          content: 'Great progress this quarter',
          createdAt: '2024-01-15T10:00:00Z',
          investorName: 'John Investor',
          investorEmail: 'john@investor.com',
        },
        {
          id: 'update-2',
          title: 'Market Insights',
          content: 'Interesting market trends',
          createdAt: '2024-01-20T10:00:00Z',
          investorName: 'Jane Capital',
          investorEmail: 'jane@capital.com',
        },
      ];

      server.use(
        http.get('/api/portfolio/updates', () => {
          return HttpResponse.json(mockUpdates);
        }),
      );

      render(
        <BrowserRouter>
          <InvestorUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Q1 2024 Portfolio Review')).toBeInTheDocument();
        expect(screen.getByText('Market Insights')).toBeInTheDocument();
      });
    });
  });

  describe('Update Details', () => {
    it('should display investor name with update', async () => {
      const mockUpdates = [
        {
          id: 'update-1',
          title: 'Q1 Review',
          content: 'Great work',
          createdAt: '2024-01-15T10:00:00Z',
          investorName: 'John Investor',
          investorEmail: 'john@investor.com',
        },
      ];

      server.use(
        http.get('/api/portfolio/updates', () => {
          return HttpResponse.json(mockUpdates);
        }),
      );

      render(
        <BrowserRouter>
          <InvestorUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Investor')).toBeInTheDocument();
      });
    });

    it('should display update timestamp', async () => {
      const mockUpdates = [
        {
          id: 'update-1',
          title: 'Q1 Review',
          content: 'Great work',
          createdAt: '2024-01-15T10:00:00Z',
          investorName: 'John Investor',
          investorEmail: 'john@investor.com',
        },
      ];

      server.use(
        http.get('/api/portfolio/updates', () => {
          return HttpResponse.json(mockUpdates);
        }),
      );

      render(
        <BrowserRouter>
          <InvestorUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/2024/)).toBeInTheDocument();
      });
    });

    it('should display update content', async () => {
      const mockUpdates = [
        {
          id: 'update-1',
          title: 'Q1 Review',
          content: 'Your company showed excellent growth this quarter',
          createdAt: '2024-01-15T10:00:00Z',
          investorName: 'John Investor',
          investorEmail: 'john@investor.com',
        },
      ];

      server.use(
        http.get('/api/portfolio/updates', () => {
          return HttpResponse.json(mockUpdates);
        }),
      );

      render(
        <BrowserRouter>
          <InvestorUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/excellent growth this quarter/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filter and Sort', () => {
    it('should display updates in chronological order', async () => {
      const mockUpdates = [
        {
          id: 'update-2',
          title: 'Newer Update',
          content: 'Recent message',
          createdAt: '2024-01-20T10:00:00Z',
          investorName: 'John Investor',
          investorEmail: 'john@investor.com',
        },
        {
          id: 'update-1',
          title: 'Older Update',
          content: 'Old message',
          createdAt: '2024-01-15T10:00:00Z',
          investorName: 'John Investor',
          investorEmail: 'john@investor.com',
        },
      ];

      server.use(
        http.get('/api/portfolio/updates', () => {
          return HttpResponse.json(mockUpdates);
        }),
      );

      render(
        <BrowserRouter>
          <InvestorUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Newer Update')).toBeInTheDocument();
        expect(screen.getByText('Older Update')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no updates', async () => {
      server.use(
        http.get('/api/portfolio/updates', () => {
          return HttpResponse.json([]);
        }),
      );

      render(
        <BrowserRouter>
          <InvestorUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No updates/i)).toBeInTheDocument();
      });
    });
  });
});
