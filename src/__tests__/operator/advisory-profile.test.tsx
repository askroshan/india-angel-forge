import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import AdvisoryProfile from '@/pages/operator/AdvisoryProfile';
import * as apiClient from '@/api/client';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

// Mock AuthContext
const mockUser = {
  id: 'operator-1',
  email: 'operator@example.com',
  role: 'operator_angel',
  name: 'Experienced Operator',
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
const mockProfile = {
  id: 'profile-1',
  user_id: mockUser.id,
  expertise_areas: ['Product Management', 'Growth Marketing', 'Fundraising'],
  hourly_rate: 25000, // ₹25,000 per hour
  engagement_terms: 'Available for 1-2 hour sessions, flexible scheduling',
  availability: 'Weekdays 6-9 PM IST, Weekends flexible',
  bio: 'Former VP of Product at unicorn startup with 10+ years of experience',
  is_active: true,
  total_sessions: 45,
  average_rating: 4.8,
  created_at: '2024-01-15T10:00:00Z',
};

const mockRequests = [
  {
    id: 'req-1',
    advisory_profile_id: 'profile-1',
    founder_id: 'founder-1',
    founder_name: 'Startup Founder',
    founder_company: 'TechStartup India',
    topic: 'Product-Market Fit Strategy',
    description: 'Need guidance on finding PMF for our SaaS product',
    preferred_dates: ['2024-02-20', '2024-02-22'],
    status: 'PENDING',
    created_at: '2024-02-15T14:30:00Z',
  },
  {
    id: 'req-2',
    advisory_profile_id: 'profile-1',
    founder_id: 'founder-2',
    founder_name: 'Another Founder',
    founder_company: 'HealthTech Solutions',
    topic: 'Fundraising Strategy',
    description: 'Preparing for Series A raise, need advice on pitch and valuation',
    preferred_dates: ['2024-02-25'],
    status: 'ACCEPTED',
    scheduled_date: '2024-02-25T16:00:00Z',
    created_at: '2024-02-16T10:00:00Z',
  },
];

describe('US-OPERATOR-001: Offer Advisory Services', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(apiClient.apiClient.get).mockImplementation((url: string) => {
      if (url === '/api/operator/advisory-profile') {
        return Promise.resolve({ data: mockProfile });
      }
      if (url === '/api/operator/advisory-requests') {
        return Promise.resolve({ data: mockRequests });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvisoryProfile />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('Page Display', () => {
    it('should display advisory profile page', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Advisory Services')).toBeInTheDocument();
      });
    });

    it('should display create profile prompt when no profile exists', async () => {
      // Override the default mock to return null for profile
      vi.mocked(apiClient.apiClient.get).mockImplementation((url: string) => {
        if (url === '/api/operator/advisory-profile') {
          return Promise.resolve({ data: null });
        }
        return Promise.reject(new Error('Not found'));
      });

      renderComponent();

      await waitFor(() => {
        const createElements = screen.queryAllByText(/create.*profile|set up.*profile/i);
        expect(createElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Advisory Profile Display', () => {
    it('should display expertise areas', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Product Management')).toBeInTheDocument();
        expect(screen.getByText('Growth Marketing')).toBeInTheDocument();
        expect(screen.getByText('Fundraising')).toBeInTheDocument();
      });
    });

    it('should display hourly rate', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/₹.*25,000|25,000.*hour/i)).toBeInTheDocument();
      });
    });

    it('should display engagement terms', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/1-2 hour sessions/i)).toBeInTheDocument();
      });
    });

    it('should display availability', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Weekdays 6-9 PM/i)).toBeInTheDocument();
      });
    });

    it('should display profile statistics', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument(); // Total sessions
        expect(screen.getByText(/4\.8.*5\.0|4\.8/)).toBeInTheDocument(); // Average rating
      });
    });
  });

  describe('Advisory Requests List', () => {
    it('should display pending advisory requests', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Startup Founder')).toBeInTheDocument();
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
        expect(screen.getByText('Product-Market Fit Strategy')).toBeInTheDocument();
      });
    });

    it('should display accepted requests', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Advisory Services')).toBeInTheDocument();
      });

      // Switch to 'All' filter to see accepted requests
      const allButton = screen.getByRole('button', { name: /^All$/i });
      await user.click(allButton);

      await waitFor(() => {
        expect(screen.getByText('Another Founder')).toBeInTheDocument();
        expect(screen.getByText('HealthTech Solutions')).toBeInTheDocument();
        expect(screen.getByText('ACCEPTED')).toBeInTheDocument();
      });
    });
  });

  describe('Accept Request', () => {
    it('should allow accepting advisory requests', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.apiClient.patch).mockResolvedValueOnce({
        data: { ...mockRequests[0], status: 'ACCEPTED' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Startup Founder')).toBeInTheDocument();
      });

      // Find the "Accept" button (not "Accepted" filter button)
      const acceptButton = await screen.findByRole('button', { name: /^Accept$/i });
      await user.click(acceptButton);

      await waitFor(() => {
        expect(apiClient.apiClient.patch).toHaveBeenCalledWith(
          expect.stringContaining('/advisory-requests/req-1'),
          expect.objectContaining({ status: 'ACCEPTED' })
        );
      });
    });
  });

  describe('Decline Request', () => {
    it('should allow declining advisory requests', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.apiClient.patch).mockResolvedValueOnce({
        data: { ...mockRequests[0], status: 'DECLINED' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Startup Founder')).toBeInTheDocument();
      });

      const declineButtons = screen.getAllByRole('button', { name: /decline/i });
      await user.click(declineButtons[0]);

      await waitFor(() => {
        expect(apiClient.apiClient.patch).toHaveBeenCalledWith(
          expect.stringContaining('/advisory-requests/req-1'),
          expect.objectContaining({ status: 'DECLINED' })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading profile fails', async () => {
      vi.mocked(apiClient.apiClient.get).mockRejectedValueOnce(new Error('Failed to load'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/error.*loading|failed to load/i)).toBeInTheDocument();
      });
    });

    it('should handle request acceptance error gracefully', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.apiClient.patch).mockRejectedValueOnce(new Error('Update failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Startup Founder')).toBeInTheDocument();
      });

      const acceptButton = await screen.findByRole('button', { name: /^Accept$/i });
      await user.click(acceptButton);

      await waitFor(() => {
        expect(apiClient.apiClient.patch).toHaveBeenCalled();
      });
    });
  });
});
