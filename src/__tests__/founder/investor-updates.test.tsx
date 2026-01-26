import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import InvestorUpdates from '@/pages/founder/InvestorUpdates';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
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

describe('InvestorUpdates', () => {
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

  describe('Updates Dashboard', () => {
    it('should display investor updates dashboard', async () => {
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
          created_at: '2024-01-15T10:00:00Z',
          investor: {
            full_name: 'John Investor',
            email: 'john@investor.com',
          },
        },
        {
          id: 'update-2',
          title: 'Market Insights',
          content: 'Interesting market trends',
          created_at: '2024-01-20T10:00:00Z',
          investor: {
            full_name: 'Jane Capital',
            email: 'jane@capital.com',
          },
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockUpdates,
              error: null,
            }),
          }),
        }),
      });

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
          created_at: '2024-01-15T10:00:00Z',
          investor: {
            full_name: 'John Investor',
            email: 'john@investor.com',
          },
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockUpdates,
              error: null,
            }),
          }),
        }),
      });

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
          created_at: '2024-01-15T10:00:00Z',
          investor: {
            full_name: 'John Investor',
            email: 'john@investor.com',
          },
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockUpdates,
              error: null,
            }),
          }),
        }),
      });

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
          created_at: '2024-01-15T10:00:00Z',
          investor: {
            full_name: 'John Investor',
            email: 'john@investor.com',
          },
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockUpdates,
              error: null,
            }),
          }),
        }),
      });

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
          created_at: '2024-01-20T10:00:00Z',
          investor: {
            full_name: 'John Investor',
            email: 'john@investor.com',
          },
        },
        {
          id: 'update-1',
          title: 'Older Update',
          content: 'Old message',
          created_at: '2024-01-15T10:00:00Z',
          investor: {
            full_name: 'John Investor',
            email: 'john@investor.com',
          },
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockUpdates,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <InvestorUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        const updates = screen.getAllByRole('heading', { level: 3 });
        expect(updates[0]).toHaveTextContent('Newer Update');
        expect(updates[1]).toHaveTextContent('Older Update');
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no updates', async () => {
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
          <InvestorUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No updates/i)).toBeInTheDocument();
      });
    });
  });
});
