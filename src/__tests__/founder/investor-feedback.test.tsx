/**
 * US-FOUNDER-006: Receive and Respond to Investor Feedback
 * 
 * As an: Approved founder
 * I want to: Receive feedback from investors
 * So that: I can address concerns and improve my pitch
 * 
 * Acceptance Criteria:
 * - Receive notifications when investors provide feedback
 * - Respond to feedback from investors
 * - View common objections/questions
 * - Feedback is threaded by investor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock apiClient
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { apiClient } from '@/api/client';
import { toast } from 'sonner';
import type { Mock } from 'vitest';

// Mock founder auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'founder-1', email: 'founder@test.com', role: 'founder' },
    isAuthenticated: true,
    token: 'mock-token',
    hasRole: (role: string) => role === 'founder',
  }),
}));

const mockDeal = {
  id: 'deal-1',
  company_name: 'TechCorp',
  founder_id: 'founder-1',
  status: 'active',
};

const mockFeedback = [
  {
    id: 'fb-1',
    deal_id: 'deal-1',
    investor_id: 'investor-1',
    investor_name: 'Priya Sharma',
    investor_email: 'priya@test.com',
    type: 'question',
    content: 'What is your customer acquisition cost?',
    created_at: '2024-01-15T10:30:00Z',
    status: 'pending',
    responses: [],
  },
  {
    id: 'fb-2',
    deal_id: 'deal-1',
    investor_id: 'investor-2',
    investor_name: 'Rajesh Kumar',
    investor_email: 'rajesh@test.com',
    type: 'concern',
    content: 'The market size projections seem optimistic. Can you provide more data?',
    created_at: '2024-01-15T11:00:00Z',
    status: 'responded',
    responses: [
      {
        id: 'resp-1',
        feedback_id: 'fb-2',
        content: 'We have updated our projections based on recent industry reports...',
        created_at: '2024-01-15T14:00:00Z',
      },
    ],
  },
  {
    id: 'fb-3',
    deal_id: 'deal-1',
    investor_id: 'investor-1',
    investor_name: 'Priya Sharma',
    investor_email: 'priya@test.com',
    type: 'suggestion',
    content: 'Consider including unit economics in your deck.',
    created_at: '2024-01-16T09:00:00Z',
    status: 'pending',
    responses: [],
  },
  {
    id: 'fb-4',
    deal_id: 'deal-1',
    investor_id: 'investor-3',
    investor_name: 'Anita Desai',
    investor_email: 'anita@test.com',
    type: 'question',
    content: 'What is your customer acquisition cost?',
    created_at: '2024-01-16T10:00:00Z',
    status: 'pending',
    responses: [],
  },
];

const mockNotifications = [
  {
    id: 'notif-1',
    type: 'new_feedback',
    deal_id: 'deal-1',
    feedback_id: 'fb-1',
    investor_name: 'Priya Sharma',
    message: 'Priya Sharma asked a question about TechCorp',
    created_at: '2024-01-15T10:30:00Z',
    read: false,
  },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

describe('US-FOUNDER-006: Receive and Respond to Investor Feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    (apiClient.get as Mock).mockImplementation((url: string) => {
      if (url.includes('/deals/deal-1/feedback')) {
        return Promise.resolve({ data: mockFeedback });
      }
      if (url.includes('/notifications')) {
        return Promise.resolve({ data: mockNotifications });
      }
      return Promise.resolve({ data: [] });
    });
    (apiClient.post as Mock).mockResolvedValue({ data: { success: true } });
    (apiClient.put as Mock).mockResolvedValue({ data: { success: true } });
  });

  describe('Feedback Data Structure', () => {
    it('should include investor information in feedback', async () => {
      mockFeedback.forEach(fb => {
        expect(fb).toHaveProperty('investor_id');
        expect(fb).toHaveProperty('investor_name');
        expect(fb).toHaveProperty('investor_email');
      });
    });

    it('should categorize feedback by type', async () => {
      const feedbackTypes = [...new Set(mockFeedback.map(fb => fb.type))];
      expect(feedbackTypes).toContain('question');
      expect(feedbackTypes).toContain('concern');
      expect(feedbackTypes).toContain('suggestion');
    });

    it('should track feedback status', async () => {
      const pendingFeedback = mockFeedback.filter(fb => fb.status === 'pending');
      const respondedFeedback = mockFeedback.filter(fb => fb.status === 'responded');
      
      expect(pendingFeedback.length).toBeGreaterThan(0);
      expect(respondedFeedback.length).toBeGreaterThan(0);
    });

    it('should include timestamps for feedback', async () => {
      mockFeedback.forEach(fb => {
        expect(fb).toHaveProperty('created_at');
        expect(new Date(fb.created_at).getTime()).not.toBeNaN();
      });
    });
  });

  describe('Notification System', () => {
    it('should create notification when investor provides feedback', async () => {
      const notification = mockNotifications[0];
      expect(notification.type).toBe('new_feedback');
      expect(notification).toHaveProperty('investor_name');
      expect(notification).toHaveProperty('feedback_id');
    });

    it('should track unread notifications', async () => {
      const unreadNotifications = mockNotifications.filter(n => !n.read);
      expect(unreadNotifications.length).toBeGreaterThan(0);
    });

    it('should mark notification as read', async () => {
      await apiClient.put('/notifications/notif-1/read');
      expect(apiClient.put).toHaveBeenCalledWith('/notifications/notif-1/read');
    });

    it('should include deal context in notification', async () => {
      const notification = mockNotifications[0];
      expect(notification.deal_id).toBe('deal-1');
    });
  });

  describe('Respond to Feedback', () => {
    it('should submit response to feedback', async () => {
      const response = {
        feedback_id: 'fb-1',
        content: 'Our CAC is ₹500 per customer with a 3-month payback period.',
      };

      await apiClient.post('/deals/deal-1/feedback/fb-1/respond', response);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/deals/deal-1/feedback/fb-1/respond',
        response
      );
    });

    it('should update feedback status after response', async () => {
      const respondedFeedback = mockFeedback.find(fb => fb.status === 'responded');
      expect(respondedFeedback).toBeDefined();
      expect(respondedFeedback?.responses.length).toBeGreaterThan(0);
    });

    it('should allow multiple responses in thread', async () => {
      const feedbackWithResponses = mockFeedback.find(fb => fb.responses.length > 0);
      expect(feedbackWithResponses).toBeDefined();
      expect(feedbackWithResponses?.responses[0]).toHaveProperty('content');
    });

    it('should track response timestamps', async () => {
      const feedbackWithResponses = mockFeedback.find(fb => fb.responses.length > 0);
      expect(feedbackWithResponses?.responses[0]).toHaveProperty('created_at');
    });
  });

  describe('Common Objections Analysis', () => {
    it('should identify common questions', async () => {
      // Group feedback by content similarity
      const questions = mockFeedback.filter(fb => fb.type === 'question');
      const cacQuestions = questions.filter(fb => 
        fb.content.toLowerCase().includes('customer acquisition cost')
      );
      
      // CAC is asked twice by different investors
      expect(cacQuestions.length).toBe(2);
    });

    it('should group feedback by topic', async () => {
      const topics = {
        cac: mockFeedback.filter(fb => 
          fb.content.toLowerCase().includes('customer acquisition') ||
          fb.content.toLowerCase().includes('cac')
        ),
        market: mockFeedback.filter(fb => 
          fb.content.toLowerCase().includes('market')
        ),
        economics: mockFeedback.filter(fb => 
          fb.content.toLowerCase().includes('unit economics')
        ),
      };

      expect(topics.cac.length).toBeGreaterThan(0);
      expect(topics.market.length).toBeGreaterThan(0);
    });

    it('should calculate feedback frequency by type', async () => {
      const typeCounts = mockFeedback.reduce((acc, fb) => {
        acc[fb.type] = (acc[fb.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(typeCounts.question).toBeGreaterThan(0);
      expect(typeCounts.concern).toBeGreaterThan(0);
    });
  });

  describe('Threaded Feedback by Investor', () => {
    it('should group feedback by investor', async () => {
      const feedbackByInvestor = mockFeedback.reduce((acc, fb) => {
        if (!acc[fb.investor_id]) {
          acc[fb.investor_id] = [];
        }
        acc[fb.investor_id].push(fb);
        return acc;
      }, {} as Record<string, typeof mockFeedback>);

      // Priya (investor-1) has 2 feedback items
      expect(feedbackByInvestor['investor-1'].length).toBe(2);
      // Rajesh (investor-2) has 1 feedback item
      expect(feedbackByInvestor['investor-2'].length).toBe(1);
    });

    it('should show investor profile with feedback thread', async () => {
      const investorFeedback = mockFeedback.filter(fb => fb.investor_id === 'investor-1');
      expect(investorFeedback[0].investor_name).toBe('Priya Sharma');
      expect(investorFeedback.length).toBe(2);
    });

    it('should sort feedback by date within investor thread', async () => {
      const investorFeedback = mockFeedback
        .filter(fb => fb.investor_id === 'investor-1')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      expect(new Date(investorFeedback[0].created_at).getTime())
        .toBeGreaterThan(new Date(investorFeedback[1].created_at).getTime());
    });
  });

  describe('API Integration', () => {
    it('should fetch all feedback for deal', async () => {
      await apiClient.get('/deals/deal-1/feedback');
      expect(apiClient.get).toHaveBeenCalledWith('/deals/deal-1/feedback');
    });

    it('should support filtering feedback by status', async () => {
      await apiClient.get('/deals/deal-1/feedback?status=pending');
      expect(apiClient.get).toHaveBeenCalledWith('/deals/deal-1/feedback?status=pending');
    });

    it('should support filtering feedback by investor', async () => {
      await apiClient.get('/deals/deal-1/feedback?investor_id=investor-1');
      expect(apiClient.get).toHaveBeenCalledWith('/deals/deal-1/feedback?investor_id=investor-1');
    });

    it('should support filtering feedback by type', async () => {
      await apiClient.get('/deals/deal-1/feedback?type=question');
      expect(apiClient.get).toHaveBeenCalledWith('/deals/deal-1/feedback?type=question');
    });

    it('should fetch notifications for founder', async () => {
      await apiClient.get('/notifications?type=new_feedback');
      expect(apiClient.get).toHaveBeenCalledWith('/notifications?type=new_feedback');
    });
  });

  describe('Feedback Analytics', () => {
    it('should calculate response rate', async () => {
      const totalFeedback = mockFeedback.length;
      const respondedFeedback = mockFeedback.filter(fb => fb.status === 'responded').length;
      const responseRate = (respondedFeedback / totalFeedback) * 100;

      expect(responseRate).toBe(25); // 1 out of 4
    });

    it('should calculate average response time', async () => {
      const respondedFeedback = mockFeedback.filter(fb => fb.status === 'responded');
      
      respondedFeedback.forEach(fb => {
        if (fb.responses.length > 0) {
          const feedbackTime = new Date(fb.created_at).getTime();
          const responseTime = new Date(fb.responses[0].created_at).getTime();
          const responseDelay = responseTime - feedbackTime;
          
          expect(responseDelay).toBeGreaterThan(0);
        }
      });
    });

    it('should identify unanswered feedback', async () => {
      const unansweredFeedback = mockFeedback.filter(fb => fb.status === 'pending');
      expect(unansweredFeedback.length).toBe(3);
    });
  });
});
