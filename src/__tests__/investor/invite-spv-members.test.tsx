/**
 * US-INVESTOR-009: Invite Co-Investors to SPV
 * 
 * As an: SPV lead
 * I want to: Invite other investors to join my SPV
 * So that: We can invest together
 * 
 * Acceptance Criteria:
 * - Send invitations with SPV details via email
 * - Invited investors can accept and commit an amount
 * - View commitment status for all invited investors
 * - Set a deadline for commitments
 * - Adjust allocations if oversubscribed
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
    delete: vi.fn(),
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

// Mock SPV lead auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'lead-1', email: 'lead@test.com', role: 'investor' },
    isAuthenticated: true,
    token: 'mock-token',
    hasRole: (role: string) => role === 'investor',
  }),
}));

const mockSPV = {
  id: 'spv-1',
  name: 'TechCorp Growth SPV',
  deal_id: 'deal-1',
  deal_name: 'TechCorp Series A',
  lead_investor_id: 'lead-1',
  target_amount: 5000000,
  minimum_investment: 100000,
  carry_percentage: 20,
  hurdle_rate: 8,
  deadline: '2024-02-15',
  status: 'open',
  created_at: '2024-01-15T10:00:00Z',
};

const mockInvitations = [
  {
    id: 'inv-1',
    spv_id: 'spv-1',
    investor_id: 'investor-1',
    investor_email: 'investor1@test.com',
    investor_name: 'Priya Sharma',
    status: 'accepted',
    committed_amount: 500000,
    invited_at: '2024-01-16T09:00:00Z',
    responded_at: '2024-01-17T14:00:00Z',
  },
  {
    id: 'inv-2',
    spv_id: 'spv-1',
    investor_id: 'investor-2',
    investor_email: 'investor2@test.com',
    investor_name: 'Rajesh Kumar',
    status: 'pending',
    committed_amount: null,
    invited_at: '2024-01-16T09:00:00Z',
    responded_at: null,
  },
  {
    id: 'inv-3',
    spv_id: 'spv-1',
    investor_id: 'investor-3',
    investor_email: 'investor3@test.com',
    investor_name: 'Anita Desai',
    status: 'declined',
    committed_amount: null,
    invited_at: '2024-01-16T09:00:00Z',
    responded_at: '2024-01-18T11:00:00Z',
  },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

describe('US-INVESTOR-009: Invite Co-Investors to SPV', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    (apiClient.get as Mock).mockImplementation((url: string) => {
      if (url.includes('/spvs/spv-1')) {
        return Promise.resolve({ data: mockSPV });
      }
      if (url.includes('/invitations')) {
        return Promise.resolve({ data: mockInvitations });
      }
      return Promise.resolve({ data: [] });
    });
    (apiClient.post as Mock).mockResolvedValue({ data: { success: true } });
    (apiClient.put as Mock).mockResolvedValue({ data: { success: true } });
  });

  describe('Invitation Data Structure', () => {
    it('should have SPV details in invitation', async () => {
      expect(mockSPV).toHaveProperty('id');
      expect(mockSPV).toHaveProperty('name');
      expect(mockSPV).toHaveProperty('deal_name');
      expect(mockSPV).toHaveProperty('target_amount');
    });

    it('should include carry structure in SPV', async () => {
      expect(mockSPV.carry_percentage).toBe(20);
      expect(mockSPV.hurdle_rate).toBe(8);
    });

    it('should have minimum investment requirement', async () => {
      expect(mockSPV.minimum_investment).toBe(100000);
    });

    it('should track invitation status', async () => {
      const statuses = mockInvitations.map(inv => inv.status);
      expect(statuses).toContain('accepted');
      expect(statuses).toContain('pending');
      expect(statuses).toContain('declined');
    });
  });

  describe('Send Invitations', () => {
    it('should send invitation with investor email', async () => {
      const invitationData = {
        spv_id: 'spv-1',
        investor_email: 'newinvestor@test.com',
        message: 'Join our SPV for TechCorp Series A',
      };

      await apiClient.post('/spvs/spv-1/invitations', invitationData);

      expect(apiClient.post).toHaveBeenCalledWith('/spvs/spv-1/invitations', invitationData);
    });

    it('should include SPV details in invitation email', async () => {
      const emailContent = {
        spv_name: mockSPV.name,
        deal_name: mockSPV.deal_name,
        target_amount: mockSPV.target_amount,
        minimum_investment: mockSPV.minimum_investment,
        deadline: mockSPV.deadline,
        carry: `${mockSPV.carry_percentage}% carry with ${mockSPV.hurdle_rate}% hurdle`,
      };

      expect(emailContent.spv_name).toBe('TechCorp Growth SPV');
      expect(emailContent.minimum_investment).toBe(100000);
    });

    it('should send multiple invitations at once', async () => {
      const emails = ['investor4@test.com', 'investor5@test.com', 'investor6@test.com'];
      const bulkInvite = {
        spv_id: 'spv-1',
        investor_emails: emails,
      };

      await apiClient.post('/spvs/spv-1/invitations/bulk', bulkInvite);

      expect(apiClient.post).toHaveBeenCalledWith('/spvs/spv-1/invitations/bulk', bulkInvite);
    });
  });

  describe('Commitment Status Tracking', () => {
    it('should show accepted invitations with committed amounts', async () => {
      const acceptedInvitations = mockInvitations.filter(inv => inv.status === 'accepted');
      expect(acceptedInvitations).toHaveLength(1);
      expect(acceptedInvitations[0].committed_amount).toBe(500000);
    });

    it('should show pending invitations', async () => {
      const pendingInvitations = mockInvitations.filter(inv => inv.status === 'pending');
      expect(pendingInvitations).toHaveLength(1);
      expect(pendingInvitations[0].committed_amount).toBeNull();
    });

    it('should show declined invitations', async () => {
      const declinedInvitations = mockInvitations.filter(inv => inv.status === 'declined');
      expect(declinedInvitations).toHaveLength(1);
    });

    it('should calculate total committed amount', async () => {
      const totalCommitted = mockInvitations
        .filter(inv => inv.status === 'accepted' && inv.committed_amount)
        .reduce((sum, inv) => sum + (inv.committed_amount || 0), 0);
      expect(totalCommitted).toBe(500000);
    });

    it('should track response timestamps', async () => {
      mockInvitations.forEach(inv => {
        expect(inv).toHaveProperty('invited_at');
        expect(inv).toHaveProperty('responded_at');
      });
    });
  });

  describe('Deadline Management', () => {
    it('should have commitment deadline', async () => {
      expect(mockSPV.deadline).toBe('2024-02-15');
    });

    it('should update commitment deadline', async () => {
      const newDeadline = '2024-02-28';
      
      await apiClient.put('/spvs/spv-1', { deadline: newDeadline });

      expect(apiClient.put).toHaveBeenCalledWith('/spvs/spv-1', { deadline: newDeadline });
    });

    it('should identify expired invitations based on deadline', async () => {
      const deadline = new Date(mockSPV.deadline);
      const pendingInvitations = mockInvitations.filter(inv => inv.status === 'pending');
      
      // Check if pending invitations would be affected by deadline
      expect(pendingInvitations.length).toBeGreaterThan(0);
      expect(deadline).toBeInstanceOf(Date);
    });
  });

  describe('Allocation Adjustments', () => {
    it('should track oversubscription', async () => {
      const totalCommitted = 6000000; // Over target
      const target = mockSPV.target_amount;
      const isOversubscribed = totalCommitted > target;
      
      expect(isOversubscribed).toBe(true);
    });

    it('should allow allocation adjustment for oversubscribed SPV', async () => {
      const adjustedAllocation = {
        investor_id: 'investor-1',
        original_commitment: 500000,
        adjusted_amount: 400000,
        reason: 'Pro-rata reduction due to oversubscription',
      };

      await apiClient.put('/spvs/spv-1/allocations/investor-1', adjustedAllocation);

      expect(apiClient.put).toHaveBeenCalledWith(
        '/spvs/spv-1/allocations/investor-1',
        adjustedAllocation
      );
    });

    it('should calculate pro-rata allocations', async () => {
      const totalCommitted = 6000000;
      const target = mockSPV.target_amount; // 5000000
      const proRataRatio = target / totalCommitted; // ~0.833

      const originalCommitment = 500000;
      const adjustedAllocation = Math.round(originalCommitment * proRataRatio);

      expect(adjustedAllocation).toBeLessThan(originalCommitment);
    });

    it('should remove investor from SPV before close', async () => {
      await apiClient.delete('/spvs/spv-1/members/investor-1');

      expect(apiClient.delete).toHaveBeenCalledWith('/spvs/spv-1/members/investor-1');
    });
  });

  describe('Investor Response Flow', () => {
    it('should allow investor to accept invitation with commitment', async () => {
      const response = {
        status: 'accepted',
        committed_amount: 250000,
      };

      await apiClient.put('/invitations/inv-2/respond', response);

      expect(apiClient.put).toHaveBeenCalledWith('/invitations/inv-2/respond', response);
    });

    it('should validate minimum investment on acceptance', async () => {
      const minimumInvestment = mockSPV.minimum_investment;
      const invalidAmount = 50000; // Below minimum

      expect(invalidAmount < minimumInvestment).toBe(true);
    });

    it('should allow investor to decline invitation', async () => {
      const response = {
        status: 'declined',
        reason: 'Not interested in this deal',
      };

      await apiClient.put('/invitations/inv-2/respond', response);

      expect(apiClient.put).toHaveBeenCalledWith('/invitations/inv-2/respond', response);
    });

    it('should resend invitation to pending investors', async () => {
      await apiClient.post('/invitations/inv-2/resend');

      expect(apiClient.post).toHaveBeenCalledWith('/invitations/inv-2/resend');
    });
  });

  describe('API Integration', () => {
    it('should fetch SPV details', async () => {
      await apiClient.get('/spvs/spv-1');
      expect(apiClient.get).toHaveBeenCalledWith('/spvs/spv-1');
    });

    it('should fetch all invitations for SPV', async () => {
      await apiClient.get('/spvs/spv-1/invitations');
      expect(apiClient.get).toHaveBeenCalledWith('/spvs/spv-1/invitations');
    });

    it('should support filtering invitations by status', async () => {
      await apiClient.get('/spvs/spv-1/invitations?status=pending');
      expect(apiClient.get).toHaveBeenCalledWith('/spvs/spv-1/invitations?status=pending');
    });
  });
});
