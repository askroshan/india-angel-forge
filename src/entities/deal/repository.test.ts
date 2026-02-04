import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  isValidDealTransition, 
  VALID_DEAL_TRANSITIONS,
  type Deal,
  type DealStatus,
  type CreateDealInput,
  type DealCommitment,
  type CommitmentStatus,
} from './types';
import { DealRepository } from './repository';
import { getApiClient, type ApiClient } from '@/api';

// Mock the API client
vi.mock('@/api', () => ({
  getApiClient: vi.fn(),
}));

describe('Deal Types', () => {
  describe('isValidDealTransition', () => {
    it('should allow draft -> live transition', () => {
      expect(isValidDealTransition('draft', 'live')).toBe(true);
    });

    it('should allow draft -> cancelled transition', () => {
      expect(isValidDealTransition('draft', 'cancelled')).toBe(true);
    });

    it('should not allow draft -> closed transition', () => {
      expect(isValidDealTransition('draft', 'closed')).toBe(false);
    });

    it('should allow live -> closing transition', () => {
      expect(isValidDealTransition('live', 'closing')).toBe(true);
    });

    it('should allow closing -> closed transition', () => {
      expect(isValidDealTransition('closing', 'closed')).toBe(true);
    });

    it('should allow closing -> live (reopening)', () => {
      expect(isValidDealTransition('closing', 'live')).toBe(true);
    });

    it('should allow closed -> funded transition', () => {
      expect(isValidDealTransition('closed', 'funded')).toBe(true);
    });

    it('should allow funded -> exited transition', () => {
      expect(isValidDealTransition('funded', 'exited')).toBe(true);
    });

    it('should not allow transitions from exited', () => {
      expect(isValidDealTransition('exited', 'draft')).toBe(false);
      expect(isValidDealTransition('exited', 'live')).toBe(false);
    });

    it('should not allow transitions from cancelled', () => {
      expect(isValidDealTransition('cancelled', 'draft')).toBe(false);
      expect(isValidDealTransition('cancelled', 'live')).toBe(false);
    });
  });

  describe('VALID_DEAL_TRANSITIONS', () => {
    it('should define all status keys', () => {
      const allStatuses: DealStatus[] = ['draft', 'live', 'closing', 'closed', 'funded', 'exited', 'cancelled'];
      
      allStatuses.forEach(status => {
        expect(VALID_DEAL_TRANSITIONS).toHaveProperty(status);
      });
    });
  });
});

describe('DealRepository', () => {
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    rpc: ReturnType<typeof vi.fn>;
  };

  let repository: DealRepository;

  const mockDeal: Deal = {
    id: 'deal-123',
    name: 'TechStartup Series A',
    companyName: 'TechStartup Pvt Ltd',
    companyDescription: 'A technology startup',
    companyType: 'indian-private',
    sector: 'technology',
    stage: 'series-a',
    instrumentType: 'ccps',
    investmentVehicle: 'spv',
    targetAmount: 50000000, // 5 Cr
    minCommitment: 500000,  // 5 Lakh
    valuation: 200000000,   // 20 Cr
    status: 'draft',
    totalCommitted: 0,
    totalFunded: 0,
    investorCount: 0,
    requiresRbiApproval: false,
    isAngelTaxExempt: true,
    isPressNote3Compliant: true,
    createdBy: 'admin-123',
    createdAt: '2026-01-25T00:00:00Z',
    updatedAt: '2026-01-25T00:00:00Z',
  };

  const mockCreateInput: CreateDealInput = {
    name: 'TechStartup Series A',
    companyName: 'TechStartup Pvt Ltd',
    companyDescription: 'A technology startup',
    companyType: 'indian-private',
    sector: 'technology',
    stage: 'series-a',
    instrumentType: 'ccps',
    investmentVehicle: 'spv',
    targetAmount: 50000000,
    minCommitment: 500000,
    valuation: 200000000,
  };

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      rpc: vi.fn(),
    };

    vi.mocked(getApiClient).mockReturnValue(mockApiClient as unknown as ApiClient);
    repository = new DealRepository();
  });

  describe('getById', () => {
    it('should fetch a deal by ID', async () => {
      // GET returns data directly
      mockApiClient.get.mockResolvedValue(mockDeal);

      const result = await repository.getById('deal-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('deals', 'deal-123');
      expect(result.data).toEqual(mockDeal);
      expect(result.error).toBeNull();
    });

    it('should return error for non-existent deal', async () => {
      // GET throws on error
      mockApiClient.get.mockRejectedValue(new Error('Deal not found'));

      const result = await repository.getById('invalid-id');

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });
  });

  describe('list', () => {
    it('should list all deals with default filters', async () => {
      mockApiClient.list.mockResolvedValue({ 
        data: [mockDeal], 
        error: null,
        total: 1,
        page: 1,
        pageSize: 20,
      });

      const result = await repository.list();

      expect(mockApiClient.list).toHaveBeenCalledWith('deals', { filters: {} });
      expect(result.data).toHaveLength(1);
    });

    it('should filter deals by status', async () => {
      mockApiClient.list.mockResolvedValue({ 
        data: [mockDeal], 
        error: null,
        total: 1,
        page: 1,
        pageSize: 20,
      });

      const result = await repository.list({ status: 'live' });

      expect(mockApiClient.list).toHaveBeenCalledWith('deals', { filters: { status: 'live' } });
    });

    it('should filter deals by investment vehicle', async () => {
      mockApiClient.list.mockResolvedValue({ 
        data: [mockDeal], 
        error: null,
        total: 1,
        page: 1,
        pageSize: 20,
      });

      const result = await repository.list({ investmentVehicle: 'spv' });

      expect(mockApiClient.list).toHaveBeenCalledWith('deals', { filters: { investmentVehicle: 'spv' } });
    });
  });

  describe('create', () => {
    it('should create a new deal in draft status', async () => {
      mockApiClient.create.mockResolvedValue({ data: mockDeal, error: null });

      const result = await repository.create(mockCreateInput);

      expect(mockApiClient.create).toHaveBeenCalledWith('deals', expect.objectContaining({
        ...mockCreateInput,
        status: 'draft',
        totalCommitted: 0,
        totalFunded: 0,
        investorCount: 0,
      }));
      expect(result.data?.status).toBe('draft');
    });

    it('should validate minimum commitment is at least 1 lakh', async () => {
      const invalidInput = { ...mockCreateInput, minCommitment: 50000 }; // 50K

      const result = await repository.create(invalidInput);

      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('Minimum commitment');
    });

    it('should validate target amount is positive', async () => {
      const invalidInput = { ...mockCreateInput, targetAmount: -1000 };

      const result = await repository.create(invalidInput);

      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('update', () => {
    it('should update deal fields', async () => {
      const updatedDeal = { ...mockDeal, name: 'Updated Deal Name' };
      mockApiClient.update.mockResolvedValue({ data: updatedDeal, error: null });

      const result = await repository.update('deal-123', { name: 'Updated Deal Name' });

      expect(mockApiClient.update).toHaveBeenCalledWith('deals', 'deal-123', { name: 'Updated Deal Name' });
      expect(result.data?.name).toBe('Updated Deal Name');
    });
  });

  describe('updateStatus', () => {
    it('should transition deal from draft to live', async () => {
      mockApiClient.get.mockResolvedValue(mockDeal);
      const liveDeal = { ...mockDeal, status: 'live' as DealStatus, publishedAt: expect.any(String) };
      mockApiClient.update.mockResolvedValue({ data: liveDeal, error: null });

      const result = await repository.updateStatus('deal-123', 'live');

      expect(result.data?.status).toBe('live');
      expect(mockApiClient.update).toHaveBeenCalled();
    });

    it('should reject invalid status transition', async () => {
      mockApiClient.get.mockResolvedValue(mockDeal); // Draft status

      const result = await repository.updateStatus('deal-123', 'funded'); // Invalid: draft -> funded

      expect(result.error?.code).toBe('INVALID_TRANSITION');
      expect(result.error?.message).toContain('draft');
      expect(result.error?.message).toContain('funded');
    });

    it('should set publishedAt when transitioning to live', async () => {
      mockApiClient.get.mockResolvedValue(mockDeal);
      mockApiClient.update.mockResolvedValue({ 
        data: { ...mockDeal, status: 'live', publishedAt: '2026-01-25T00:00:00Z' }, 
        error: null 
      });

      const result = await repository.updateStatus('deal-123', 'live');

      expect(mockApiClient.update).toHaveBeenCalledWith(
        'deals', 
        'deal-123', 
        expect.objectContaining({ publishedAt: expect.any(String) })
      );
    });
  });

  describe('delete', () => {
    it('should delete a draft deal', async () => {
      mockApiClient.get.mockResolvedValue(mockDeal); // Draft status
      mockApiClient.delete.mockResolvedValue({ data: null, error: null });

      const result = await repository.delete('deal-123');

      expect(mockApiClient.delete).toHaveBeenCalledWith('deals', 'deal-123');
      expect(result.error).toBeNull();
    });

    it('should not delete a live deal', async () => {
      const liveDeal = { ...mockDeal, status: 'live' as DealStatus };
      mockApiClient.get.mockResolvedValue(liveDeal);

      const result = await repository.delete('deal-123');

      expect(result.error?.code).toBe('INVALID_OPERATION');
      expect(mockApiClient.delete).not.toHaveBeenCalled();
    });
  });

  describe('getCommitments', () => {
    it('should fetch commitments for a deal', async () => {
      const mockCommitment: DealCommitment = {
        id: 'commitment-123',
        dealId: 'deal-123',
        investorId: 'investor-456',
        amount: 500000,
        status: 'committed',
        amountReceived: 0,
        createdAt: '2026-01-25T00:00:00Z',
        updatedAt: '2026-01-25T00:00:00Z',
      };

      mockApiClient.list.mockResolvedValue({ 
        data: {
          data: [mockCommitment],
          total: 1,
          page: 1,
          pageSize: 20,
          hasMore: false,
        },
        error: null,
      });

      const result = await repository.getCommitments('deal-123');

      expect(mockApiClient.list).toHaveBeenCalledWith('deal_commitments', { filters: { dealId: 'deal-123' } });
      expect(result.data?.data).toHaveLength(1);
    });
  });

  describe('addCommitment', () => {
    it('should add a commitment to a live deal', async () => {
      const liveDeal = { ...mockDeal, status: 'live' as DealStatus };
      mockApiClient.get.mockResolvedValue(liveDeal);
      
      const mockCommitment: DealCommitment = {
        id: 'commitment-123',
        dealId: 'deal-123',
        investorId: 'investor-456',
        amount: 500000,
        status: 'pending',
        amountReceived: 0,
        createdAt: '2026-01-25T00:00:00Z',
        updatedAt: '2026-01-25T00:00:00Z',
      };
      mockApiClient.create.mockResolvedValue({ data: mockCommitment, error: null });

      const result = await repository.addCommitment('deal-123', 'investor-456', 500000);

      expect(result.data?.status).toBe('pending');
      expect(result.data?.amount).toBe(500000);
    });

    it('should reject commitment below minimum', async () => {
      const liveDeal = { ...mockDeal, status: 'live' as DealStatus, minCommitment: 500000 };
      mockApiClient.get.mockResolvedValue(liveDeal);

      const result = await repository.addCommitment('deal-123', 'investor-456', 100000); // Below 5L min

      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('minimum');
    });

    it('should reject commitment when deal is not live', async () => {
      mockApiClient.get.mockResolvedValue(mockDeal); // Draft status

      const result = await repository.addCommitment('deal-123', 'investor-456', 500000);

      expect(result.error?.code).toBe('INVALID_OPERATION');
      expect(result.error?.message).toContain('not accepting');
    });
  });

  describe('calculateDealMetrics', () => {
    it('should calculate total committed and investor count', async () => {
      const commitments: DealCommitment[] = [
        {
          id: 'c1',
          dealId: 'deal-123',
          investorId: 'inv-1',
          amount: 500000,
          status: 'committed',
          amountReceived: 0,
          createdAt: '2026-01-25T00:00:00Z',
          updatedAt: '2026-01-25T00:00:00Z',
        },
        {
          id: 'c2',
          dealId: 'deal-123',
          investorId: 'inv-2',
          amount: 1000000,
          status: 'payment-received',
          amountReceived: 1000000,
          createdAt: '2026-01-25T00:00:00Z',
          updatedAt: '2026-01-25T00:00:00Z',
        },
        {
          id: 'c3',
          dealId: 'deal-123',
          investorId: 'inv-3',
          amount: 750000,
          status: 'cancelled',
          amountReceived: 0,
          createdAt: '2026-01-25T00:00:00Z',
          updatedAt: '2026-01-25T00:00:00Z',
        },
      ];

      mockApiClient.list.mockResolvedValue({ 
        data: {
          data: commitments,
          total: 3,
          page: 1,
          pageSize: 20,
          hasMore: false,
        },
        error: null,
      });

      const result = await repository.calculateDealMetrics('deal-123');

      // Should only count non-cancelled commitments
      expect(result.data?.totalCommitted).toBe(1500000); // 5L + 10L
      expect(result.data?.investorCount).toBe(2);
      expect(result.data?.totalFunded).toBe(1000000); // Only payment-received amounts
    });
  });
});
