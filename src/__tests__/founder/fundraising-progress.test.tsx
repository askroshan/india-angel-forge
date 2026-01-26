import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import FundraisingProgress from '@/pages/founder/FundraisingProgress';
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

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('FundraisingProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth session
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: { id: 'founder-1' },
        },
      },
    });
  });

  describe('Fundraising Dashboard', () => {
    it('should display fundraising progress page', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'company-1',
                company_name: 'TechStartup Inc',
              },
              error: null,
            }),
          }),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Fundraising Progress')).toBeInTheDocument();
      });
    });

    it('should display active fundraising rounds', async () => {
      const mockRounds = [
        {
          id: 'round-1',
          round_name: 'Seed Round',
          target_amount: 1000000,
          raised_amount: 750000,
          status: 'active',
          start_date: '2024-01-01',
          target_close_date: '2024-06-30',
        },
        {
          id: 'round-2',
          round_name: 'Series A',
          target_amount: 5000000,
          raised_amount: 0,
          status: 'planning',
          start_date: null,
          target_close_date: '2024-12-31',
        },
      ];

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'company_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'company-1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'fundraising_rounds') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockRounds,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Seed Round')).toBeInTheDocument();
        expect(screen.getByText('Series A')).toBeInTheDocument();
      });
    });
  });

  describe('Add Fundraising Round', () => {
    it('should show add round button', async () => {
      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'company_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'company-1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'fundraising_rounds') {
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
        return {};
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add round/i })).toBeInTheDocument();
      });
    });

    it('should allow adding new fundraising round', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{
            id: 'round-1',
            round_name: 'Seed Round',
            target_amount: 1000000,
          }],
          error: null,
        }),
      });

      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'company_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'company-1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'fundraising_rounds') {
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
        return {};
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add round/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add round/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/round name/i)).toBeInTheDocument();
      });

      const roundNameInput = screen.getByLabelText(/round name/i);
      const targetAmountInput = screen.getByLabelText(/target amount/i);

      await user.type(roundNameInput, 'Seed Round');
      await user.type(targetAmountInput, '1000000');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });
    });
  });

  describe('Progress Visualization', () => {
    it('should display fundraising progress bar', async () => {
      const mockRounds = [
        {
          id: 'round-1',
          round_name: 'Seed Round',
          target_amount: 1000000,
          raised_amount: 750000,
          status: 'active',
        },
      ];

      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'company_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'company-1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'fundraising_rounds') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockRounds,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Check for percentage display (75% progress)
        expect(screen.getByText(/75%/)).toBeInTheDocument();
      });
    });

    it('should display target and raised amounts', async () => {
      const mockRounds = [
        {
          id: 'round-1',
          round_name: 'Seed Round',
          target_amount: 1000000,
          raised_amount: 750000,
          status: 'active',
        },
      ];

      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'company_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'company-1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'fundraising_rounds') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockRounds,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Check for formatted amounts
        expect(screen.getByText(/₹7.5L/)).toBeInTheDocument();
        expect(screen.getByText(/₹10L/)).toBeInTheDocument();
      });
    });

    it('should display round status', async () => {
      const mockRounds = [
        {
          id: 'round-1',
          round_name: 'Seed Round',
          target_amount: 1000000,
          raised_amount: 750000,
          status: 'active',
        },
        {
          id: 'round-2',
          round_name: 'Series A',
          target_amount: 5000000,
          raised_amount: 0,
          status: 'planning',
        },
      ];

      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'company_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'company-1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'fundraising_rounds') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockRounds,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/active/i)).toBeInTheDocument();
        expect(screen.getByText(/planning/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no rounds exist', async () => {
      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'company_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'company-1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'fundraising_rounds') {
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
        return {};
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <FundraisingProgress />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/no fundraising rounds yet/i)).toBeInTheDocument();
      });
    });
  });
});
