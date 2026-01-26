import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DueDiligenceChecklist from '@/pages/investor/DueDiligenceChecklist';
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

// Mock useNavigate and useParams
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ dealId: 'deal-123' }),
  };
});

describe('DueDiligenceChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth session
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: { id: 'investor-1' },
        },
      },
    });
  });

  describe('Checklist Dashboard', () => {
    it('should display due diligence checklist page', async () => {
      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'deals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'deal-123', company_name: 'TechStartup Inc' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'due_diligence_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return {};
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <DueDiligenceChecklist />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Due Diligence Checklist')).toBeInTheDocument();
      });
    });

    it('should display checklist items', async () => {
      const mockItems = [
        {
          id: 'item-1',
          item_name: 'Review Financial Statements',
          completed: false,
          notes: '',
          category: 'Financial',
        },
        {
          id: 'item-2',
          item_name: 'Verify Legal Documents',
          completed: true,
          notes: 'All documents verified',
          category: 'Legal',
        },
      ];

      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'deals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'deal-123', company_name: 'TechStartup Inc' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'due_diligence_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockItems,
                error: null,
              }),
            }),
          };
        }
        return {};
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <DueDiligenceChecklist />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Review Financial Statements')).toBeInTheDocument();
        expect(screen.getByText('Verify Legal Documents')).toBeInTheDocument();
      });
    });
  });

  describe('Add Checklist Item', () => {
    it('should show add item button', async () => {
      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'deals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'deal-123', company_name: 'TechStartup Inc' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'due_diligence_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return {};
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <DueDiligenceChecklist />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
      });
    });

    it('should allow adding new checklist item', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{
            id: 'item-1',
            item_name: 'Review Financial Statements',
            completed: false,
          }],
          error: null,
        }),
      });

      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'deals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'deal-123', company_name: 'TechStartup Inc' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'due_diligence_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
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
          <DueDiligenceChecklist />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/item name/i)).toBeInTheDocument();
      });

      const itemNameInput = screen.getByLabelText(/item name/i);
      await user.type(itemNameInput, 'Review Financial Statements');

      const saveButton = screen.getByRole('button', { name: /add/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });
    });
  });

  describe('Toggle Completion', () => {
    it('should allow marking item as complete', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'deals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'deal-123', company_name: 'TechStartup Inc' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'due_diligence_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{
                  id: 'item-1',
                  item_name: 'Review Financial Statements',
                  completed: false,
                }],
                error: null,
              }),
            }),
            update: mockUpdate,
          };
        }
        return {};
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <DueDiligenceChecklist />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Review Financial Statements')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ completed: true });
      });
    });

    it('should display completion status', async () => {
      const mockItems = [
        {
          id: 'item-1',
          item_name: 'Review Financial Statements',
          completed: false,
        },
        {
          id: 'item-2',
          item_name: 'Verify Legal Documents',
          completed: true,
        },
      ];

      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'deals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'deal-123', company_name: 'TechStartup Inc' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'due_diligence_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockItems,
                error: null,
              }),
            }),
          };
        }
        return {};
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <DueDiligenceChecklist />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should show completion percentage
        expect(screen.getByText(/50%/)).toBeInTheDocument();
      });
    });
  });

  describe('Add Notes', () => {
    it('should allow adding notes to checklist item', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'deals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'deal-123', company_name: 'TechStartup Inc' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'due_diligence_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{
                  id: 'item-1',
                  item_name: 'Review Financial Statements',
                  completed: false,
                  notes: '',
                }],
                error: null,
              }),
            }),
            update: mockUpdate,
          };
        }
        return {};
      });
      (supabase.from as any).mockImplementation(mockFrom);

      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <DueDiligenceChecklist />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Review Financial Statements')).toBeInTheDocument();
      });

      const notesInput = screen.getByPlaceholderText(/add notes/i);
      await user.type(notesInput, 'Reviewed all statements');
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ notes: 'Reviewed all statements' })
        );
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no items exist', async () => {
      const mockFrom = vi.fn().mockImplementation((table) => {
        if (table === 'deals') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'deal-123', company_name: 'TechStartup Inc' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'due_diligence_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return {};
      });
      (supabase.from as any).mockImplementation(mockFrom);

      render(
        <BrowserRouter>
          <DueDiligenceChecklist />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/no checklist items yet/i)).toBeInTheDocument();
      });
    });
  });
});
