import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DueDiligenceChecklist from '@/pages/investor/DueDiligenceChecklist';

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'investor-1', email: 'investor@example.com', role: 'INVESTOR' },
    token: 'mock-token',
    isAuthenticated: true,
  }),
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
  });

  it('should display due diligence checklist page', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/deals/deal-123/due-diligence')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url.includes('/api/deals/deal-123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'deal-123', companyName: 'TechStartup Inc' }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

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
        itemName: 'Review Financial Statements',
        completed: false,
        notes: '',
        category: 'Financial',
      },
      {
        id: 'item-2',
        itemName: 'Verify Legal Documents',
        completed: true,
        notes: 'All documents verified',
        category: 'Legal',
      },
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/deals/deal-123/due-diligence')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockItems),
        });
      }
      if (url.includes('/api/deals/deal-123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'deal-123', companyName: 'TechStartup Inc' }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

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
