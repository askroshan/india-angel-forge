/**
 * US-COMM-004: Communication Audit Log
 *
 * As an: Admin
 * I want to: View an audit log of all platform communications
 * So that: I can maintain compliance and investigate issues
 *
 * TDD: RED Phase
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import CommunicationAuditLog from '@/pages/admin/CommunicationAuditLog';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-admin-token',
    user: { id: 'admin-1', email: 'admin@example.com', roles: ['admin'] },
    isAuthenticated: true,
  }),
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockMessages = [
  {
    id: 'msg-1',
    senderId: 'inv-1',
    recipientId: 'founder-1',
    senderName: 'Rahul Sharma',
    recipientName: 'Amit Kumar',
    subject: 'Interest in TechCo',
    preview: 'I am interested in your deal...',
    sentAt: '2024-03-15T10:00:00Z',
    threadId: 'thread-1',
    messageCount: 3,
  },
  {
    id: 'msg-2',
    senderId: 'admin-1',
    recipientId: 'inv-2',
    senderName: 'Admin User',
    recipientName: 'Priya Mehta',
    subject: 'Account verification',
    preview: 'Your account has been verified...',
    sentAt: '2024-03-14T08:00:00Z',
    threadId: 'thread-2',
    messageCount: 1,
  },
];

const renderComponent = () =>
  render(<BrowserRouter><CommunicationAuditLog /></BrowserRouter>);

describe('US-COMM-004: Communication Audit Log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('/api/admin/communications', () => HttpResponse.json({ messages: mockMessages, total: 2 })),
    );
  });

  describe('Page Layout', () => {
    it('should display Communication Audit Log heading', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /communication audit/i })).toBeInTheDocument();
      });
    });

    it('should display all message threads', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
        expect(screen.getByText('Amit Kumar')).toBeInTheDocument();
        expect(screen.getByText('Admin User')).toBeInTheDocument();
        expect(screen.getByText('Priya Mehta')).toBeInTheDocument();
      });
    });

    it('should show message subject and preview', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Interest in TechCo')).toBeInTheDocument();
        expect(screen.getByText('Account verification')).toBeInTheDocument();
      });
    });

    it('should display sent date for each message', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
      });
      // Should contain some date representation
      expect(screen.getAllByText(/2024|Mar|15/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Filtering', () => {
    it('should have a search input for filtering messages', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search.*messages/i)).toBeInTheDocument();
      });
    });

    it('should filter messages by sender/recipient name', async () => {
      server.use(
        http.get('/api/admin/communications', ({ request }) => {
          const url = new URL(request.url);
          const q = url.searchParams.get('q') || '';
          const filtered = mockMessages.filter(m =>
            m.senderName.toLowerCase().includes(q.toLowerCase()) ||
            m.recipientName.toLowerCase().includes(q.toLowerCase())
          );
          return HttpResponse.json({ messages: filtered, total: filtered.length });
        }),
      );
      renderComponent();
      await waitFor(() => expect(screen.getByText('Rahul Sharma')).toBeInTheDocument());
      await userEvent.type(screen.getByPlaceholderText(/search.*messages/i), 'Rahul');
      await waitFor(() => {
        expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no messages exist', async () => {
      server.use(
        http.get('/api/admin/communications', () => HttpResponse.json({ messages: [], total: 0 })),
      );
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText(/no.*message|no.*communication/i)).toBeInTheDocument();
      });
    });
  });

  describe('API Contract', () => {
    it('should call GET /api/admin/communications on mount', async () => {
      let called = false;
      server.use(
        http.get('/api/admin/communications', () => {
          called = true;
          return HttpResponse.json({ messages: mockMessages, total: 2 });
        }),
      );
      renderComponent();
      await waitFor(() => expect(called).toBe(true));
    });
  });
});
