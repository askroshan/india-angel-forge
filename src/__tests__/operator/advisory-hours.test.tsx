import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import AdvisoryHours from '@/pages/operator/AdvisoryHours';
import * as apiClient from '@/api/client';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock AuthContext
const mockUser = {
  id: 'operator-1',
  email: 'operator@example.com',
  role: 'operator_angel',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
}));

// Mock data
const mockTimeEntries = [
  {
    id: 'entry-1',
    operator_id: mockUser.id,
    company_id: 'company-1',
    company_name: 'TechStartup India',
    date: '2024-02-15',
    duration_hours: 2.5,
    topic: 'Product Strategy',
    notes: 'Discussed product roadmap and feature prioritization',
    status: 'CONFIRMED',
    created_at: '2024-02-15T10:00:00Z',
  },
  {
    id: 'entry-2',
    operator_id: mockUser.id,
    company_id: 'company-2',
    company_name: 'HealthTech Solutions',
    date: '2024-02-18',
    duration_hours: 1.5,
    topic: 'Fundraising',
    notes: 'Reviewed pitch deck and provided feedback',
    status: 'PENDING',
    created_at: '2024-02-18T14:00:00Z',
  },
  {
    id: 'entry-3',
    operator_id: mockUser.id,
    company_id: 'company-1',
    company_name: 'TechStartup India',
    date: '2024-02-20',
    duration_hours: 1.0,
    topic: 'Growth Marketing',
    notes: 'Growth hacking strategies discussion',
    status: 'CONFIRMED',
    created_at: '2024-02-20T16:00:00Z',
  },
];

const mockSummary = {
  total_hours: 5.0,
  by_company: [
    { company_id: 'company-1', company_name: 'TechStartup India', total_hours: 3.5 },
    { company_id: 'company-2', company_name: 'HealthTech Solutions', total_hours: 1.5 },
  ],
  by_topic: [
    { topic: 'Product Strategy', total_hours: 2.5 },
    { topic: 'Fundraising', total_hours: 1.5 },
    { topic: 'Growth Marketing', total_hours: 1.0 },
  ],
  current_month_hours: 5.0,
  last_month_hours: 8.5,
};

describe('US-OPERATOR-002: Track Advisory Hours', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(apiClient.apiClient.get).mockImplementation((url: string) => {
      if (url === '/api/operator/advisory-hours') {
        return Promise.resolve(mockTimeEntries);
      }
      if (url === '/api/operator/advisory-hours/summary') {
        return Promise.resolve(mockSummary);
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvisoryHours />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('Page Display', () => {
    it('should display advisory hours tracking page', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Advisory Hours')).toBeInTheDocument();
      });
    });

    it('should display empty state when no hours logged', async () => {
      vi.mocked(apiClient.apiClient.get).mockImplementation((url: string) => {
        if (url === '/api/operator/advisory-hours') {
          return Promise.resolve([]);
        }
        if (url === '/api/operator/advisory-hours/summary') {
          return Promise.resolve({ total_hours: 0, by_company: [], by_topic: [], current_month_hours: 0, last_month_hours: 0 });
        }
        return Promise.reject(new Error('Not found'));
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no hours logged|no time entries/i)).toBeInTheDocument();
      });
    });
  });

  describe('Time Summary', () => {
    it('should display total hours tracked', async () => {
      renderComponent();

      await waitFor(() => {
        const totalHours = screen.getAllByText('5.0');
        expect(totalHours.length).toBeGreaterThan(0);
        expect(screen.getByText(/Total Hours/i)).toBeInTheDocument();
      });
    });

    it('should display hours by company', async () => {
      renderComponent();

      await waitFor(() => {
        const techStartup = screen.getAllByText('TechStartup India');
        expect(techStartup.length).toBeGreaterThan(0);
        const healthTech = screen.getAllByText('HealthTech Solutions');
        expect(healthTech.length).toBeGreaterThan(0);
        expect(screen.getByText('3.5')).toBeInTheDocument(); // TechStartup hours
        expect(screen.getByText('1.5')).toBeInTheDocument(); // HealthTech hours
      });
    });
  });

  describe('Time Entries List', () => {
    it('should display all time entries', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Product Strategy')).toBeInTheDocument();
        expect(screen.getByText('Fundraising')).toBeInTheDocument();
        expect(screen.getByText('Growth Marketing')).toBeInTheDocument();
      });
    });

    it('should display company name for each entry', async () => {
      renderComponent();

      await waitFor(() => {
        const techStartupEntries = screen.getAllByText('TechStartup India');
        expect(techStartupEntries.length).toBeGreaterThan(0);
        const healthTechEntries = screen.getAllByText('HealthTech Solutions');
        expect(healthTechEntries.length).toBeGreaterThan(0);
      });
    });

    it('should display duration for each entry', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/2\.5.*hours?|2\.5h/i)).toBeInTheDocument();
        expect(screen.getByText(/1\.5.*hours?|1\.5h/i)).toBeInTheDocument();
        expect(screen.getByText(/1\.0.*hours?|1\.0h/i)).toBeInTheDocument();
      });
    });

    it('should display confirmation status', async () => {
      renderComponent();

      await waitFor(() => {
        const confirmed = screen.getAllByText('CONFIRMED');
        expect(confirmed.length).toBe(2);
        expect(screen.getByText('PENDING')).toBeInTheDocument();
      });
    });
  });

  describe('Log Hours', () => {
    it('should allow logging new advisory hours', async () => {
      const user = userEvent.setup();

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Advisory Hours')).toBeInTheDocument();
      });

      const logButton = screen.getByRole('button', { name: /log.*hours/i });
      await user.click(logButton);

      // Just verify dialog opened with form
      await waitFor(() => {
        expect(screen.getByText('Log Advisory Hours')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading hours fails', async () => {
      vi.mocked(apiClient.apiClient.get).mockRejectedValue(new Error('Failed to load'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/error.*loading|failed to load/i)).toBeInTheDocument();
      });
    });
  });
});
