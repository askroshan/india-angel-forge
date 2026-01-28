import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import SystemStatistics from '../../pages/admin/SystemStatistics';
import * as apiClient from '../../api/client';

// Mock the API client
vi.mock('../../api/client');

const mockApiClient = apiClient as { getSystemStatistics: ReturnType<typeof vi.fn> };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SystemStatistics />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('US-ADMIN-005: System Statistics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('Basic Rendering', () => {
    it('should display the page title', async () => {
      mockApiClient.getSystemStatistics.mockResolvedValue({
        users: { total: 0, byRole: {} },
        deals: { total: 0, totalInvestment: 0 },
        events: { total: 0, totalAttendees: 0 },
        growth: []
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /system statistics/i })).toBeInTheDocument();
      });
    });

    it('should display loading state initially', () => {
      mockApiClient.getSystemStatistics.mockImplementation(() => new Promise(() => {}));

      renderComponent();
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('User Statistics', () => {
    it('should display total users count', async () => {
      mockApiClient.getSystemStatistics.mockResolvedValue({
        users: {
          total: 150,
          byRole: {
            investor: 50,
            founder: 70,
            moderator: 10,
            operator_angel: 15,
            admin: 5
          }
        },
        deals: { total: 0, totalInvestment: 0 },
        events: { total: 0, totalAttendees: 0 },
        growth: []
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText(/total users/i)).toBeInTheDocument();
      });
    });

    it('should display users by role breakdown', async () => {
      mockApiClient.getSystemStatistics.mockResolvedValue({
        users: {
          total: 150,
          byRole: {
            investor: 50,
            founder: 70,
            moderator: 10,
            operator_angel: 15,
            admin: 5
          }
        },
        deals: { total: 0, totalInvestment: 0 },
        events: { total: 0, totalAttendees: 0 },
        growth: []
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText(/investors/i)).toBeInTheDocument();
        expect(screen.getByText('70')).toBeInTheDocument();
        expect(screen.getByText(/founders/i)).toBeInTheDocument();
      });
    });
  });

  describe('Deal Statistics', () => {
    it('should display total deals count', async () => {
      mockApiClient.getSystemStatistics.mockResolvedValue({
        users: { total: 0, byRole: {} },
        deals: {
          total: 25,
          totalInvestment: 5000000
        },
        events: { total: 0, totalAttendees: 0 },
        growth: []
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText(/total deals/i)).toBeInTheDocument();
      });
    });

    it('should display total investment amount formatted', async () => {
      mockApiClient.getSystemStatistics.mockResolvedValue({
        users: { total: 0, byRole: {} },
        deals: {
          total: 25,
          totalInvestment: 5000000
        },
        events: { total: 0, totalAttendees: 0 },
        growth: []
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/\$5,000,000/)).toBeInTheDocument();
        expect(screen.getByText(/total investment/i)).toBeInTheDocument();
      });
    });
  });

  describe('Event Statistics', () => {
    it('should display total events count', async () => {
      mockApiClient.getSystemStatistics.mockResolvedValue({
        users: { total: 0, byRole: {} },
        deals: { total: 0, totalInvestment: 0 },
        events: {
          total: 12,
          totalAttendees: 350
        },
        growth: []
      });

      renderComponent();
      
      await waitFor(() => {
        const cards = screen.getAllByText('12');
        // The first occurrence should be in the "Total Events" card at the top
        expect(cards[0]).toBeInTheDocument();
        const eventTexts = screen.getAllByText(/total events/i);
        expect(eventTexts.length).toBeGreaterThan(0);
      });
    });

    it('should display total event attendees', async () => {
      mockApiClient.getSystemStatistics.mockResolvedValue({
        users: { total: 0, byRole: {} },
        deals: { total: 0, totalInvestment: 0 },
        events: {
          total: 12,
          totalAttendees: 350
        },
        growth: []
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('350')).toBeInTheDocument();
        expect(screen.getByText(/total attendees/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Growth Chart', () => {
    it('should display user growth over time', async () => {
      mockApiClient.getSystemStatistics.mockResolvedValue({
        users: { total: 150, byRole: {} },
        deals: { total: 0, totalInvestment: 0 },
        events: { total: 0, totalAttendees: 0 },
        growth: [
          { month: '2024-01', users: 50 },
          { month: '2024-02', users: 75 },
          { month: '2024-03', users: 100 },
          { month: '2024-04', users: 150 }
        ]
      });

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/user growth/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when statistics fail to load', async () => {
      mockApiClient.getSystemStatistics.mockRejectedValue(new Error('Failed to fetch statistics'));

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load statistics/i)).toBeInTheDocument();
      });
    });
  });
});
