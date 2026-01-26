import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PortfolioUpdates from '@/pages/investor/PortfolioUpdates';
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

describe('PortfolioUpdates', () => {
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

  describe('Updates Dashboard', () => {
    it('should display portfolio updates dashboard', async () => {
      // Mock portfolio companies query
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      render(
        <BrowserRouter>
          <PortfolioUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Portfolio Updates/i)).toBeInTheDocument();
      });
    });

    it('should display sent updates', async () => {
      const mockUpdates = [
        {
          id: 'update-1',
          title: 'Q1 2024 Performance',
          content: 'Strong quarter with 30% revenue growth',
          created_at: '2024-01-15T10:00:00Z',
          company: {
            company_name: 'TechStartup Inc',
          },
        },
        {
          id: 'update-2',
          title: 'New Product Launch',
          content: 'Excited to announce our new product line',
          created_at: '2024-01-20T10:00:00Z',
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
        if (table === 'portfolio_updates') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockUpdates,
                  error: null,
                }),
              }),
            }),
            insert: vi.fn(),
          };
        }
      });

      render(
        <BrowserRouter>
          <PortfolioUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Q1 2024 Performance')).toBeInTheDocument();
        expect(screen.getByText('New Product Launch')).toBeInTheDocument();
      });
    });
  });

  describe('Send Update', () => {
    it('should show compose update button', async () => {
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
          <PortfolioUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Compose Update/i) || screen.getByText(/Send Update/i)).toBeInTheDocument();
      });
    });

    it('should allow composing new update', async () => {
      const user = userEvent.setup();

      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'TechStartup Inc',
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
        if (table === 'portfolio_updates') {
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
              data: { id: 'update-123' },
              error: null,
            }),
          };
        }
      });

      render(
        <BrowserRouter>
          <PortfolioUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Compose Update/i) || screen.getByText(/Send Update/i)).toBeInTheDocument();
      });

      // Click compose button
      const composeButton = screen.getByText(/Compose Update/i) || screen.getByText(/Send Update/i);
      await user.click(composeButton);

      // Should show form
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/content/i) || screen.getByLabelText(/message/i)).toBeInTheDocument();
      });
    });

    it('should allow selecting portfolio company', async () => {
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
        if (table === 'portfolio_updates') {
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
              data: { id: 'update-123' },
              error: null,
            }),
          };
        }
      });

      render(
        <BrowserRouter>
          <PortfolioUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        const composeButton = screen.getByText(/Compose Update/i) || screen.getByText(/Send Update/i);
        expect(composeButton).toBeInTheDocument();
      });

      const composeButton = screen.getByText(/Compose Update/i) || screen.getByText(/Send Update/i);
      await user.click(composeButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      });
    });

    it('should send update to selected company', async () => {
      const user = userEvent.setup();

      const mockCompanies = [
        {
          id: 'company-1',
          company_name: 'TechStartup Inc',
        },
      ];

      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: 'update-123' },
        error: null,
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
        if (table === 'portfolio_updates') {
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
          <PortfolioUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        const composeButton = screen.getByText(/Compose Update/i) || screen.getByText(/Send Update/i);
        expect(composeButton).toBeInTheDocument();
      });

      const composeButton = screen.getByText(/Compose Update/i) || screen.getByText(/Send Update/i);
      await user.click(composeButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Fill form
      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i) || screen.getByLabelText(/message/i);
      
      await user.type(titleInput, 'Q1 Update');
      await user.type(contentInput, 'Great quarter!');

      // Submit
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Q1 Update',
            content: 'Great quarter!',
          })
        );
      });
    });
  });

  describe('Update Details', () => {
    it('should display update timestamp', async () => {
      const mockUpdates = [
        {
          id: 'update-1',
          title: 'Q1 2024 Performance',
          content: 'Strong quarter',
          created_at: '2024-01-15T10:00:00Z',
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
        if (table === 'portfolio_updates') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockUpdates,
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      render(
        <BrowserRouter>
          <PortfolioUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/2024/)).toBeInTheDocument();
      });
    });

    it('should display company name with update', async () => {
      const mockUpdates = [
        {
          id: 'update-1',
          title: 'Q1 2024 Performance',
          content: 'Strong quarter',
          created_at: '2024-01-15T10:00:00Z',
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
        if (table === 'portfolio_updates') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockUpdates,
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      render(
        <BrowserRouter>
          <PortfolioUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('TechStartup Inc')).toBeInTheDocument();
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
          <PortfolioUpdates />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No updates/i)).toBeInTheDocument();
      });
    });
  });
});
