import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ContentModeration from '@/pages/moderator/ContentModeration';
import * as apiClient from '@/api/client';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
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
const mockFlags = [
  {
    id: 'flag-1',
    content_type: 'MESSAGE',
    content_id: 'msg-1',
    content_text: 'This is spam content advertising my product',
    content_author: {
      id: 'user-1',
      name: 'Spam User',
      email: 'spam@example.com',
    },
    reported_by: {
      id: 'user-2',
      name: 'Reporter One',
      email: 'reporter1@example.com',
    },
    reason: 'SPAM',
    description: 'This user is constantly posting spam',
    status: 'PENDING',
    created_at: '2024-02-10T10:00:00Z',
  },
  {
    id: 'flag-2',
    content_type: 'DISCUSSION',
    content_id: 'disc-1',
    content_text: 'This post contains offensive language and harassment',
    content_author: {
      id: 'user-3',
      name: 'Offensive User',
      email: 'offensive@example.com',
    },
    reported_by: {
      id: 'user-4',
      name: 'Reporter Two',
      email: 'reporter2@example.com',
    },
    reason: 'HARASSMENT',
    description: 'Offensive and harassing content',
    status: 'PENDING',
    created_at: '2024-02-11T14:30:00Z',
  },
  {
    id: 'flag-3',
    content_type: 'REPLY',
    content_id: 'reply-1',
    content_text: 'This seems like a normal helpful reply',
    content_author: {
      id: 'user-5',
      name: 'Helpful User',
      email: 'helpful@example.com',
    },
    reported_by: {
      id: 'user-6',
      name: 'Mistaken Reporter',
      email: 'reporter3@example.com',
    },
    reason: 'OTHER',
    description: 'Not sure why this was flagged',
    status: 'REVIEWED',
    resolution: 'FALSE_POSITIVE',
    resolved_at: '2024-02-12T09:00:00Z',
    resolved_by: mockUser.id,
    created_at: '2024-02-11T16:00:00Z',
  },
];

describe('US-MODERATOR-003: Manage Content Flags', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    // Mock window.confirm to always return true
    window.confirm = vi.fn(() => true);

    // Default mock implementation
    vi.mocked(apiClient.apiClient.get).mockResolvedValue({
      data: mockFlags,
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ContentModeration />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('Page Display', () => {
    it('should display content moderation page', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Content Moderation')).toBeInTheDocument();
      });
    });

    it('should display empty state when no flags exist', async () => {
      vi.mocked(apiClient.apiClient.get).mockResolvedValueOnce({ data: [] });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no.*flag|no.*content/i)).toBeInTheDocument();
      });
    });
  });

  describe('Flagged Content List', () => {
    it('should display list of flagged content', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('This is spam content advertising my product')).toBeInTheDocument();
        expect(screen.getByText('This post contains offensive language and harassment')).toBeInTheDocument();
      });
    });

    it('should display flag reason and status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('SPAM')).toBeInTheDocument();
        expect(screen.getByText('HARASSMENT')).toBeInTheDocument();
        const pendingBadges = screen.getAllByText('PENDING');
        expect(pendingBadges.length).toBeGreaterThan(0);
      });
    });

    it('should display reporter information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Reporter One')).toBeInTheDocument();
        expect(screen.getByText('Reporter Two')).toBeInTheDocument();
      });
    });

    it('should display content author information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Spam User')).toBeInTheDocument();
        expect(screen.getByText('Offensive User')).toBeInTheDocument();
      });
    });
  });

  describe('Remove Content', () => {
    it('should allow removing inappropriate content', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.apiClient.delete).mockResolvedValueOnce({ data: { success: true } });
      vi.mocked(apiClient.apiClient.patch).mockResolvedValueOnce({
        data: { ...mockFlags[0], status: 'REVIEWED', resolution: 'REMOVED' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Spam User')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByRole('button', { name: /remove.*content|delete/i });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(apiClient.apiClient.delete).toHaveBeenCalled();
      });
    });
  });

  describe('User Actions', () => {
    it('should allow warning users', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.apiClient.patch).mockResolvedValueOnce({
        data: { success: true },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Spam User')).toBeInTheDocument();
      });

      const warnButtons = screen.getAllByRole('button', { name: /warn/i });
      await user.click(warnButtons[0]);

      await waitFor(() => {
        expect(apiClient.apiClient.patch).toHaveBeenCalled();
      });
    });

    it('should allow suspending users', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.apiClient.patch).mockResolvedValueOnce({
        data: { success: true },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Offensive User')).toBeInTheDocument();
      });

      const suspendButtons = screen.getAllByRole('button', { name: /suspend/i });
      await user.click(suspendButtons[0]);

      await waitFor(() => {
        expect(apiClient.apiClient.patch).toHaveBeenCalled();
      });
    });
  });

  describe('False Positive', () => {
    it('should allow marking flags as false positive', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.apiClient.patch).mockResolvedValueOnce({
        data: { ...mockFlags[0], status: 'REVIEWED', resolution: 'FALSE_POSITIVE' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Spam User')).toBeInTheDocument();
      });

      const falsePositiveButtons = screen.getAllByRole('button', { name: /false.*positive|no.*action/i });
      await user.click(falsePositiveButtons[0]);

      await waitFor(() => {
        expect(apiClient.apiClient.patch).toHaveBeenCalledWith(
          expect.stringContaining('/flags/flag-1'),
          expect.objectContaining({ resolution: 'FALSE_POSITIVE' })
        );
      });
    });

    it('should display resolved false positives differently', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Reviewed/i })).toBeInTheDocument();
      });

      // Switch to 'All' tab first to see all flags including reviewed ones
      const allButton = screen.getByRole('button', { name: /All/i });
      await user.click(allButton);

      await waitFor(() => {
        expect(screen.getByText('This seems like a normal helpful reply')).toBeInTheDocument();
        expect(screen.getByText('FALSE_POSITIVE')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading flags fails', async () => {
      vi.mocked(apiClient.apiClient.get).mockRejectedValueOnce(new Error('Failed to load'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/error.*loading|failed to load/i)).toBeInTheDocument();
      });
    });

    it('should handle content removal error gracefully', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.apiClient.delete).mockRejectedValueOnce(new Error('Delete failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Spam User')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByRole('button', { name: /remove.*content|delete/i });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(apiClient.apiClient.delete).toHaveBeenCalled();
      });
    });
  });
});
