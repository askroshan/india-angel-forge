import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import DirectMessages from '@/pages/investor/DirectMessages';

// Mock API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'investor-1',
      email: 'investor@example.com',
      role: 'INVESTOR',
      full_name: 'Roshan Shah',
    },
    isAuthenticated: true,
  }),
}));

// Mock router
vi.mock('react-router-dom', () => ({
  useParams: () => ({ threadId: undefined }),
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

// Mock message threads data
const mockThreads = [
  {
    id: 'thread-1',
    participant_ids: ['investor-1', 'founder-1'],
    last_message: {
      id: 'msg-1',
      content: 'Thank you for your interest in our Series A round!',
      sent_at: '2026-01-25T14:30:00Z',
      sender_id: 'founder-1',
    },
    other_participant: {
      id: 'founder-1',
      full_name: 'Priya Sharma',
      role: 'FOUNDER',
      company: 'TechStartup India',
      profile_picture: 'https://example.com/avatar1.png',
    },
    unread_count: 2,
    updated_at: '2026-01-25T14:30:00Z',
  },
  {
    id: 'thread-2',
    participant_ids: ['investor-1', 'investor-2'],
    last_message: {
      id: 'msg-2',
      content: 'Are you interested in co-investing in the HealthTech deal?',
      sent_at: '2026-01-24T10:15:00Z',
      sender_id: 'investor-1',
    },
    other_participant: {
      id: 'investor-2',
      full_name: 'Rajesh Kumar',
      role: 'INVESTOR',
      company: null,
      profile_picture: null,
    },
    unread_count: 0,
    updated_at: '2026-01-24T10:15:00Z',
  },
];

const mockMessages = [
  {
    id: 'msg-1',
    thread_id: 'thread-1',
    sender_id: 'founder-1',
    content: 'Thank you for your interest in our Series A round!',
    sent_at: '2026-01-25T14:30:00Z',
    attachments: [],
    sender: {
      id: 'founder-1',
      full_name: 'Priya Sharma',
      role: 'FOUNDER',
    },
  },
  {
    id: 'msg-2',
    thread_id: 'thread-1',
    sender_id: 'investor-1',
    content: 'I would love to learn more about your traction and unit economics.',
    sent_at: '2026-01-25T13:00:00Z',
    attachments: [],
    sender: {
      id: 'investor-1',
      full_name: 'Roshan Shah',
      role: 'INVESTOR',
    },
  },
  {
    id: 'msg-3',
    thread_id: 'thread-1',
    sender_id: 'founder-1',
    content: 'Here is our pitch deck with detailed metrics.',
    sent_at: '2026-01-25T12:00:00Z',
    attachments: [
      {
        id: 'att-1',
        filename: 'TechStartup-Deck.pdf',
        file_url: 'https://example.com/deck.pdf',
        file_size: 2500000,
      },
    ],
    sender: {
      id: 'founder-1',
      full_name: 'Priya Sharma',
      role: 'FOUNDER',
    },
  },
];

const mockUsers = [
  {
    id: 'founder-1',
    full_name: 'Priya Sharma',
    email: 'priya@techstartup.com',
    role: 'FOUNDER',
    company: 'TechStartup India',
  },
  {
    id: 'investor-2',
    full_name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    role: 'INVESTOR',
    company: null,
  },
];

describe('US-INVESTOR-014: Send Direct Messages', () => {
  let queryClient: QueryClient;

  const renderWithProviders = (component: React.ReactElement) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Display', () => {
    it('should display direct messages page', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockThreads);

      renderWithProviders(<DirectMessages />);

      await waitFor(() => {
        expect(screen.getByText(/Direct Messages/i)).toBeInTheDocument();
      });
    });

    it('should display empty state when no message threads', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      renderWithProviders(<DirectMessages />);

      await waitFor(() => {
        expect(screen.getByText(/No conversations yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Message Threads List', () => {
    it('should display all message threads', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockThreads);

      renderWithProviders(<DirectMessages />);

      await waitFor(() => {
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
        expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
      });
    });

    it('should display last message preview for each thread', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockThreads);

      renderWithProviders(<DirectMessages />);

      await waitFor(() => {
        expect(screen.getByText(/Thank you for your interest in our Series A round!/i)).toBeInTheDocument();
        expect(screen.getByText(/Are you interested in co-investing/i)).toBeInTheDocument();
      });
    });

    it('should display unread count for threads with unread messages', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockThreads);

      renderWithProviders(<DirectMessages />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // unread count badge
      });
    });

    it('should display participant role and company', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockThreads);

      renderWithProviders(<DirectMessages />);

      await waitFor(() => {
        expect(screen.getByText('TechStartup India')).toBeInTheDocument();
      });
    });
  });

  describe('Send Messages', () => {
    it('should allow sending a new message', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/messages/threads') return Promise.resolve(mockThreads);
        if (url.includes('/messages')) return Promise.resolve(mockMessages);
        return Promise.resolve([]);
      });
      vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'new-msg' }, error: null });

      renderWithProviders(<DirectMessages />);

      await waitFor(() => {
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      });

      // Click on thread to open conversation
      const thread = screen.getByText('Priya Sharma');
      await user.click(thread);

      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText(/Type your message/i);
        expect(messageInput).toBeInTheDocument();
      });

      const messageInput = screen.getByPlaceholderText(/Type your message/i);
      await user.type(messageInput, 'Looking forward to our meeting next week');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/api/messages',
          expect.objectContaining({
            thread_id: 'thread-1',
            content: 'Looking forward to our meeting next week',
          })
        );
      });
    });

    it('should display messages in conversation', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/messages/threads') return Promise.resolve(mockThreads);
        if (url.includes('/messages')) return Promise.resolve(mockMessages);
        return Promise.resolve([]);
      });

      renderWithProviders(<DirectMessages />);

      await waitFor(() => {
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const thread = screen.getByText('Priya Sharma');
      await user.click(thread);

      await waitFor(() => {
        expect(screen.getByText(/I would love to learn more about your traction/i)).toBeInTheDocument();
        expect(screen.getByText(/Here is our pitch deck with detailed metrics/i)).toBeInTheDocument();
      });
    });

    it('should show attachment when message has file', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/messages/threads') return Promise.resolve(mockThreads);
        if (url.includes('/messages')) return Promise.resolve(mockMessages);
        return Promise.resolve([]);
      });

      renderWithProviders(<DirectMessages />);

      await waitFor(() => {
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const thread = screen.getByText('Priya Sharma');
      await user.click(thread);

      await waitFor(() => {
        expect(screen.getByText('TechStartup-Deck.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('Search Messages', () => {
    it('should allow searching messages', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/messages/threads') return Promise.resolve(mockThreads);
        if (url.includes('search')) return Promise.resolve([mockMessages[1]]);
        return Promise.resolve([]);
      });

      renderWithProviders(<DirectMessages />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search messages/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search messages/i);
      await user.type(searchInput, 'traction');

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringContaining('search')
        );
      });
    });
  });

  describe('Start New Conversation', () => {
    it('should allow starting a new conversation', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/messages/threads') return Promise.resolve(mockThreads);
        if (url.includes('/users')) return Promise.resolve(mockUsers);
        return Promise.resolve([]);
      });
      vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'thread-3' }, error: null });

      renderWithProviders(<DirectMessages />);

      await waitFor(() => {
        expect(screen.getByText(/New Message/i)).toBeInTheDocument();
      });

      const newMessageButton = screen.getByText(/New Message/i);
      await user.click(newMessageButton);

      await waitFor(() => {
        expect(screen.getByText(/Start New Conversation/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading threads fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to load messages'));

      renderWithProviders(<DirectMessages />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading messages/i)).toBeInTheDocument();
      });
    });

    it('should handle message send error gracefully', async () => {
      const user = userEvent.setup();
      
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/api/messages/threads') return Promise.resolve(mockThreads);
        if (url.includes('/messages')) return Promise.resolve(mockMessages);
        return Promise.resolve([]);
      });
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Failed to send'));

      renderWithProviders(<DirectMessages />);

      await waitFor(() => {
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      });

      const thread = screen.getByText('Priya Sharma');
      await user.click(thread);

      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText(/Type your message/i);
        expect(messageInput).toBeInTheDocument();
      });

      const messageInput = screen.getByPlaceholderText(/Type your message/i);
      await user.type(messageInput, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalled();
      });
    });
  });
});
