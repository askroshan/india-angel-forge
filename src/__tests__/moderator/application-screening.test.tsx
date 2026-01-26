import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ApplicationScreening from '@/pages/moderator/ApplicationScreening';
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
  id: 'moderator-1',
  email: 'moderator@example.com',
  role: 'moderator',
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
const mockApplications = [
  {
    id: 'app-1',
    company_name: 'TechStartup India',
    founder_name: 'Priya Sharma',
    founder_email: 'priya@techstartup.com',
    website: 'https://techstartup.com',
    stage: 'SEED',
    sector: 'SaaS',
    problem: 'Small businesses struggle with inventory management',
    solution: 'AI-powered inventory platform with real-time insights',
    market_size: '₹5,000 Crore TAM in India',
    traction: '500 paying customers, ₹20L MRR, growing 15% MoM',
    fundraising_amount: 5000000, // ₹50 lakhs
    use_of_funds: 'Product development (40%), Marketing (35%), Team expansion (25%)',
    status: 'SUBMITTED',
    submitted_at: '2024-01-20T10:00:00Z',
    completeness_score: 95,
  },
  {
    id: 'app-2',
    company_name: 'HealthTech Solutions',
    founder_name: 'Rajesh Kumar',
    founder_email: 'rajesh@healthtech.com',
    website: 'https://healthtech.com',
    stage: 'PRE_SEED',
    sector: 'HealthTech',
    problem: 'Rural areas lack access to quality healthcare',
    solution: 'Telemedicine platform connecting rural patients with doctors',
    market_size: '₹10,000 Crore market opportunity',
    traction: 'MVP built, 50 pilot users, positive feedback',
    fundraising_amount: 2500000, // ₹25 lakhs
    use_of_funds: 'Product development and pilot expansion',
    status: 'UNDER_REVIEW',
    submitted_at: '2024-01-18T15:30:00Z',
    completeness_score: 80,
  },
  {
    id: 'app-3',
    company_name: 'EduTech Platform',
    founder_name: 'Amit Verma',
    founder_email: 'amit@edutech.com',
    website: '',
    stage: 'SEED',
    sector: 'EdTech',
    problem: 'Students lack personalized learning experiences',
    solution: 'Adaptive learning platform',
    market_size: '',
    traction: 'Early prototype',
    fundraising_amount: 3000000,
    use_of_funds: 'Product and marketing',
    status: 'SUBMITTED',
    submitted_at: '2024-01-22T09:00:00Z',
    completeness_score: 55, // Incomplete application
  },
];

const mockScreeningNotes = [
  {
    id: 'note-1',
    application_id: 'app-2',
    moderator_id: 'moderator-1',
    notes: 'Strong problem-solution fit. Founder has relevant healthcare background. Need more traction data.',
    created_at: '2024-01-19T10:00:00Z',
  },
];

describe('US-MODERATOR-001: Screen Founder Applications', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    // Default mock implementation
    (apiClient.apiClient.get as any).mockImplementation((url: string) => {
      if (url === '/api/moderator/applications') {
        return Promise.resolve({ data: mockApplications });
      }
      if (url.startsWith('/api/moderator/applications/app-')) {
        const appId = url.split('/').pop();
        const app = mockApplications.find(a => a.id === appId);
        return Promise.resolve({ data: app });
      }
      if (url.includes('/screening-notes')) {
        return Promise.resolve({ data: mockScreeningNotes });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ApplicationScreening />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('Page Display', () => {
    it('should display application screening page for moderators', async () => {
      renderComponent();

      expect(screen.getByText('Application Screening')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
      });
    });

    it('should display empty state when no applications exist', async () => {
      (apiClient.apiClient.get as any).mockResolvedValueOnce({ data: [] });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no applications/i)).toBeInTheDocument();
      });
    });
  });

  describe('Application List', () => {
    it('should display list of applications with key details', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
        expect(screen.getByText('HealthTech Solutions')).toBeInTheDocument();
        expect(screen.getByText('EduTech Platform')).toBeInTheDocument();
        expect(screen.getByText(/Priya Sharma/i)).toBeInTheDocument();
      });
    });

    it('should display application status badges', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/SUBMITTED/i)).toBeInTheDocument();
        expect(screen.getByText(/UNDER.*REVIEW|UNDER_REVIEW/i)).toBeInTheDocument();
      });
    });

    it('should display completeness score for each application', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/95.*%|95/)).toBeInTheDocument();
        expect(screen.getByText(/80.*%|80/)).toBeInTheDocument();
        expect(screen.getByText(/55.*%|55/)).toBeInTheDocument();
      });
    });

    it('should highlight incomplete applications', async () => {
      renderComponent();

      await waitFor(() => {
        const eduTechApp = screen.getByText('EduTech Platform').closest('div');
        // Should have warning indicator for low completeness (55%)
        expect(eduTechApp).toBeInTheDocument();
      });
    });
  });

  describe('View Application Details', () => {
    it('should show complete application details when viewing', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
      });

      // Click to view details
      const viewButton = screen.getAllByRole('button', { name: /view|details/i })[0];
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText(/AI-powered inventory platform/i)).toBeInTheDocument();
        expect(screen.getByText(/500 paying customers/i)).toBeInTheDocument();
        expect(screen.getByText(/₹50.*lakh|5000000/i)).toBeInTheDocument();
      });
    });

    it('should display problem and solution clearly', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
      });

      const viewButton = screen.getAllByRole('button', { name: /view|details/i })[0];
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText(/Small businesses struggle/i)).toBeInTheDocument();
        expect(screen.getByText(/AI-powered inventory/i)).toBeInTheDocument();
      });
    });

    it('should show market size and traction metrics', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
      });

      const viewButton = screen.getAllByRole('button', { name: /view|details/i })[0];
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText(/₹5,000 Crore TAM/i)).toBeInTheDocument();
        expect(screen.getByText(/₹20L MRR/i)).toBeInTheDocument();
      });
    });
  });

  describe('Application Actions', () => {
    it('should allow approving application for forum selection', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.patch as any).mockResolvedValueOnce({
        data: { ...mockApplications[0], status: 'APPROVED' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
      });

      const approveButton = screen.getAllByRole('button', { name: /approve/i })[0];
      await user.click(approveButton);

      await waitFor(() => {
        expect(apiClient.apiClient.patch).toHaveBeenCalledWith(
          '/api/moderator/applications/app-1',
          expect.objectContaining({ status: 'APPROVED' })
        );
      });
    });

    it('should allow requesting more information', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.post as any).mockResolvedValueOnce({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
      });

      const moreInfoButton = screen.getAllByRole('button', { name: /more.*info|request.*information/i })[0];
      await user.click(moreInfoButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/message|note|feedback/i)).toBeInTheDocument();
      });

      const messageInput = screen.getByLabelText(/message|note|feedback/i);
      await user.type(messageInput, 'Please provide more details on your go-to-market strategy');

      const sendButton = screen.getByRole('button', { name: /send|submit/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(apiClient.apiClient.post).toHaveBeenCalled();
      });
    });

    it('should allow declining application with feedback', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.patch as any).mockResolvedValueOnce({
        data: { ...mockApplications[2], status: 'DECLINED' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('EduTech Platform')).toBeInTheDocument();
      });

      const declineButton = screen.getAllByRole('button', { name: /decline|reject/i })[0];
      await user.click(declineButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/reason|feedback/i)).toBeInTheDocument();
      });

      const feedbackInput = screen.getByLabelText(/reason|feedback/i);
      await user.type(feedbackInput, 'Application incomplete - missing key traction metrics and market analysis');

      const confirmButton = screen.getByRole('button', { name: /confirm|submit/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(apiClient.apiClient.patch).toHaveBeenCalledWith(
          '/api/moderator/applications/app-3',
          expect.objectContaining({
            status: 'DECLINED',
            feedback: expect.stringContaining('incomplete'),
          })
        );
      });
    });
  });

  describe('Screening Notes', () => {
    it('should allow adding screening notes', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.post as any).mockResolvedValueOnce({
        data: { id: 'note-2', notes: 'Test note' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
      });

      const viewButton = screen.getAllByRole('button', { name: /view|details/i })[0];
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/notes|comments/i)).toBeInTheDocument();
      });

      const notesInput = screen.getByLabelText(/notes|comments/i);
      await user.type(notesInput, 'Strong team with good traction. Recommend for forum.');

      const saveNotesButton = screen.getByRole('button', { name: /save.*note|add.*note/i });
      await user.click(saveNotesButton);

      await waitFor(() => {
        expect(apiClient.apiClient.post).toHaveBeenCalledWith(
          '/api/moderator/applications/app-1/screening-notes',
          expect.objectContaining({
            notes: expect.stringContaining('Strong team'),
          })
        );
      });
    });

    it('should display existing screening notes', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('HealthTech Solutions')).toBeInTheDocument();
      });

      const viewButton = screen.getAllByRole('button', { name: /view|details/i })[1];
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText(/Strong problem-solution fit/i)).toBeInTheDocument();
        expect(screen.getByText(/Need more traction data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Notifications', () => {
    it('should notify founder when application is approved', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.patch as any).mockResolvedValueOnce({
        data: { ...mockApplications[0], status: 'APPROVED' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
      });

      const approveButton = screen.getAllByRole('button', { name: /approve/i })[0];
      await user.click(approveButton);

      await waitFor(() => {
        expect(apiClient.apiClient.patch).toHaveBeenCalledWith(
          '/api/moderator/applications/app-1',
          expect.objectContaining({
            status: 'APPROVED',
            notify_founder: true,
          })
        );
      });
    });

    it('should notify founder when application is declined', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.patch as any).mockResolvedValueOnce({
        data: { ...mockApplications[2], status: 'DECLINED' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('EduTech Platform')).toBeInTheDocument();
      });

      const declineButton = screen.getAllByRole('button', { name: /decline|reject/i })[0];
      await user.click(declineButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/reason|feedback/i)).toBeInTheDocument();
      });

      const feedbackInput = screen.getByLabelText(/reason|feedback/i);
      await user.type(feedbackInput, 'Application needs more work');

      const confirmButton = screen.getByRole('button', { name: /confirm|submit/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(apiClient.apiClient.patch).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading applications fails', async () => {
      (apiClient.apiClient.get as any).mockRejectedValueOnce(new Error('Failed to load'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/error.*loading|failed to load/i)).toBeInTheDocument();
      });
    });

    it('should handle approval error gracefully', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.patch as any).mockRejectedValueOnce(new Error('Approval failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
      });

      const approveButton = screen.getAllByRole('button', { name: /approve/i })[0];
      await user.click(approveButton);

      await waitFor(() => {
        expect(screen.getByText(/failed.*approve|error/i)).toBeInTheDocument();
      });
    });
  });
});
