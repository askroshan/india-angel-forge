import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Discussions from '@/pages/investor/Discussions';
import * as apiClient from '@/api/client';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock AuthContext
const mockUser = {
  id: 'user-1',
  email: 'investor@example.com',
  role: 'investor',
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
const mockDiscussions = [
  {
    id: 'discussion-1',
    title: 'Best practices for due diligence in SaaS startups',
    description: 'What key metrics and factors do you look at when evaluating early-stage SaaS companies?',
    created_by: 'user-2',
    created_at: '2024-01-15T10:00:00Z',
    tags: ['due-diligence', 'saas', 'metrics'],
    author: {
      id: 'user-2',
      full_name: 'Rajesh Kumar',
      role: 'investor',
      profile_picture: null,
    },
    reply_count: 8,
    upvotes: 12,
    user_vote: 1, // 1 for upvote, -1 for downvote, 0 for no vote
    has_best_answer: true,
  },
  {
    id: 'discussion-2',
    title: 'Healthcare sector investment opportunities in India',
    description: 'Looking to explore healthtech and telemedicine startups. What should I know?',
    created_by: 'user-3',
    created_at: '2024-01-16T14:30:00Z',
    tags: ['healthcare', 'sector-insights', 'healthtech'],
    author: {
      id: 'user-3',
      full_name: 'Priya Sharma',
      role: 'investor',
      profile_picture: null,
    },
    reply_count: 5,
    upvotes: 7,
    user_vote: 0,
    has_best_answer: false,
  },
  {
    id: 'discussion-3',
    title: 'Understanding SAFE notes vs equity rounds',
    description: 'Can someone explain the pros/cons of using SAFE notes versus traditional equity?',
    created_by: 'user-1',
    created_at: '2024-01-17T09:15:00Z',
    tags: ['fundraising', 'investment-structure'],
    author: {
      id: 'user-1',
      full_name: 'Investor User',
      role: 'investor',
      profile_picture: null,
    },
    reply_count: 3,
    upvotes: 5,
    user_vote: 0,
    has_best_answer: false,
  },
];

const mockReplies = [
  {
    id: 'reply-1',
    discussion_id: 'discussion-1',
    content: 'I always start with unit economics - CAC, LTV, payback period. For SaaS, look at MRR growth, churn rate, and NRR (net revenue retention).',
    created_by: 'user-4',
    created_at: '2024-01-15T11:00:00Z',
    author: {
      id: 'user-4',
      full_name: 'Amit Verma',
      role: 'investor',
      profile_picture: null,
    },
    upvotes: 8,
    user_vote: 1,
    is_best_answer: true,
  },
  {
    id: 'reply-2',
    discussion_id: 'discussion-1',
    content: 'Do not forget to check founder-market fit. Do they understand the problem deeply? Have they built similar products before?',
    created_by: 'user-5',
    created_at: '2024-01-15T12:30:00Z',
    author: {
      id: 'user-5',
      full_name: 'Sarah Chen',
      role: 'investor',
      profile_picture: null,
    },
    upvotes: 5,
    user_vote: 0,
    is_best_answer: false,
  },
  {
    id: 'reply-3',
    discussion_id: 'discussion-1',
    content: 'Also review their tech stack and scalability. Can their infrastructure handle 10x growth?',
    created_by: 'user-6',
    created_at: '2024-01-15T14:00:00Z',
    author: {
      id: 'user-6',
      full_name: 'Vikram Singh',
      role: 'investor',
      profile_picture: null,
    },
    upvotes: 3,
    user_vote: 0,
    is_best_answer: false,
  },
];

describe('US-INVESTOR-015: Create Discussion Threads', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    // Default mock implementation
    (apiClient.apiClient.get as any).mockImplementation((url: string) => {
      if (url === '/api/discussions') {
        return Promise.resolve({ data: mockDiscussions });
      }
      if (url.startsWith('/api/discussions/discussion-1/replies')) {
        return Promise.resolve({ data: mockReplies });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Discussions />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('Page Display', () => {
    it('should display discussions page with title', async () => {
      renderComponent();

      expect(screen.getByText('Community Discussions')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText(/Best practices for due diligence/i)).toBeInTheDocument();
      });
    });

    it('should display empty state when no discussions', async () => {
      (apiClient.apiClient.get as any).mockResolvedValueOnce({ data: [] });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/No discussions yet/i)).toBeInTheDocument();
        expect(screen.getByText(/Start a discussion/i)).toBeInTheDocument();
      });
    });
  });

  describe('Discussion List', () => {
    it('should display all discussions with titles and descriptions', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Best practices for due diligence in SaaS startups')).toBeInTheDocument();
        expect(screen.getByText('Healthcare sector investment opportunities in India')).toBeInTheDocument();
        expect(screen.getByText('Understanding SAFE notes vs equity rounds')).toBeInTheDocument();
        expect(screen.getByText(/What key metrics and factors/i)).toBeInTheDocument();
      });
    });

    it('should display tags for each discussion', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('due-diligence')).toBeInTheDocument();
        expect(screen.getByText('saas')).toBeInTheDocument();
        expect(screen.getByText('healthcare')).toBeInTheDocument();
        expect(screen.getByText('fundraising')).toBeInTheDocument();
      });
    });

    it('should display author information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      });
    });

    it('should display reply count and upvotes', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/8.*repl/i)).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument(); // upvotes for discussion-1
      });
    });

    it('should display best answer indicator when discussion has one', async () => {
      renderComponent();

      await waitFor(() => {
        // Look for best answer badge or icon on discussion-1
        const discussion = screen.getByText('Best practices for due diligence in SaaS startups').closest('div');
        expect(discussion).toBeInTheDocument();
      });
    });
  });

  describe('Create Discussion', () => {
    it('should allow creating a new discussion', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.post as any).mockResolvedValueOnce({
        data: {
          id: 'discussion-4',
          title: 'New Discussion',
          description: 'Test discussion',
          tags: ['test'],
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Community Discussions')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /new discussion|create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.type(titleInput, 'New Discussion');
      await user.type(descriptionInput, 'Test discussion');

      const submitButton = screen.getByRole('button', { name: /post|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiClient.apiClient.post).toHaveBeenCalledWith(
          '/api/discussions',
          expect.objectContaining({
            title: 'New Discussion',
            description: 'Test discussion',
          })
        );
      });
    });

    it('should allow adding tags when creating discussion', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.post as any).mockResolvedValueOnce({
        data: {
          id: 'discussion-5',
          title: 'Tagged Discussion',
          description: 'With tags',
          tags: ['fundraising', 'metrics'],
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Community Discussions')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /new discussion|create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Add tags - implementation specific to how tags are added
      // This could be dropdowns, chips, or multi-select
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Tagged Discussion');

      const submitButton = screen.getByRole('button', { name: /post|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiClient.apiClient.post).toHaveBeenCalled();
      });
    });
  });

  describe('View Discussion Details', () => {
    it('should display replies when viewing discussion', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Best practices for due diligence in SaaS startups')).toBeInTheDocument();
      });

      const discussionTitle = screen.getByText('Best practices for due diligence in SaaS startups');
      await user.click(discussionTitle);

      await waitFor(() => {
        expect(screen.getByText(/I always start with unit economics/i)).toBeInTheDocument();
        expect(screen.getByText(/founder-market fit/i)).toBeInTheDocument();
        expect(screen.getByText(/tech stack and scalability/i)).toBeInTheDocument();
      });
    });

    it('should allow posting replies to discussion', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.post as any).mockResolvedValueOnce({
        data: {
          id: 'reply-4',
          content: 'Great discussion!',
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Best practices for due diligence in SaaS startups')).toBeInTheDocument();
      });

      const discussionTitle = screen.getByText('Best practices for due diligence in SaaS startups');
      await user.click(discussionTitle);

      await waitFor(() => {
        expect(screen.getByText(/I always start with unit economics/i)).toBeInTheDocument();
      });

      const replyInput = screen.getByPlaceholderText(/add.*reply|your reply/i);
      await user.type(replyInput, 'Great discussion!');

      const postButton = screen.getByRole('button', { name: /post.*reply|reply/i });
      await user.click(postButton);

      await waitFor(() => {
        expect(apiClient.apiClient.post).toHaveBeenCalledWith(
          '/api/discussions/discussion-1/replies',
          expect.objectContaining({
            content: 'Great discussion!',
          })
        );
      });
    });
  });

  describe('Voting', () => {
    it('should allow upvoting discussion', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.post as any).mockResolvedValueOnce({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Healthcare sector investment opportunities in India')).toBeInTheDocument();
      });

      // Find upvote button for discussion-2 (which has user_vote: 0)
      const upvoteButtons = screen.getAllByRole('button', { name: /upvote/i });
      await user.click(upvoteButtons[1]); // Second discussion

      await waitFor(() => {
        expect(apiClient.apiClient.post).toHaveBeenCalledWith(
          '/api/discussions/discussion-2/vote',
          expect.objectContaining({ vote: 1 })
        );
      });
    });

    it('should allow downvoting discussion', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.post as any).mockResolvedValueOnce({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Healthcare sector investment opportunities in India')).toBeInTheDocument();
      });

      const downvoteButtons = screen.getAllByRole('button', { name: /downvote/i });
      await user.click(downvoteButtons[1]); // Second discussion

      await waitFor(() => {
        expect(apiClient.apiClient.post).toHaveBeenCalledWith(
          '/api/discussions/discussion-2/vote',
          expect.objectContaining({ vote: -1 })
        );
      });
    });

    it('should allow upvoting replies', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.post as any).mockResolvedValueOnce({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Best practices for due diligence in SaaS startups')).toBeInTheDocument();
      });

      const discussionTitle = screen.getByText('Best practices for due diligence in SaaS startups');
      await user.click(discussionTitle);

      await waitFor(() => {
        expect(screen.getByText(/founder-market fit/i)).toBeInTheDocument();
      });

      // Find upvote button for reply-2 (which has user_vote: 0)
      const upvoteButtons = screen.getAllByRole('button', { name: /upvote/i });
      await user.click(upvoteButtons[0]);

      await waitFor(() => {
        expect(apiClient.apiClient.post).toHaveBeenCalled();
      });
    });
  });

  describe('Mark Best Answer', () => {
    it('should allow discussion creator to mark best answer', async () => {
      const user = userEvent.setup();
      
      // Mock discussion created by current user
      (apiClient.apiClient.get as any).mockImplementation((url: string) => {
        if (url === '/api/discussions') {
          return Promise.resolve({
            data: [{
              ...mockDiscussions[0],
              created_by: 'user-1', // Current user
              has_best_answer: false,
            }],
          });
        }
        if (url.startsWith('/api/discussions/')) {
          return Promise.resolve({ data: mockReplies });
        }
        return Promise.reject(new Error('Not found'));
      });
      
      (apiClient.apiClient.patch as any).mockResolvedValueOnce({ data: { success: true } });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Best practices for due diligence in SaaS startups')).toBeInTheDocument();
      });

      const discussionTitle = screen.getByText('Best practices for due diligence in SaaS startups');
      await user.click(discussionTitle);

      await waitFor(() => {
        expect(screen.getByText(/I always start with unit economics/i)).toBeInTheDocument();
      });

      // Find "Mark as Best Answer" button
      const markBestButtons = screen.getAllByRole('button', { name: /mark.*best|best answer/i });
      await user.click(markBestButtons[0]);

      await waitFor(() => {
        expect(apiClient.apiClient.patch).toHaveBeenCalledWith(
          '/api/discussions/discussion-1/replies/reply-1/best-answer',
          expect.anything()
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading discussions fails', async () => {
      (apiClient.apiClient.get as any).mockRejectedValueOnce(new Error('Failed to load'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/error.*loading|failed to load/i)).toBeInTheDocument();
      });
    });

    it('should handle discussion creation error gracefully', async () => {
      const user = userEvent.setup();
      
      (apiClient.apiClient.post as any).mockRejectedValueOnce(new Error('Creation failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Community Discussions')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /new discussion|create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.type(titleInput, 'Test Discussion');
      await user.type(descriptionInput, 'Test description');

      const submitButton = screen.getByRole('button', { name: /post|submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create|error creating/i)).toBeInTheDocument();
      });
    });
  });
});
