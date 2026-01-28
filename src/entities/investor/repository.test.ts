import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  isValidInvestorTransition, 
  VALID_INVESTOR_TRANSITIONS,
  requiresGovernmentApproval,
  BORDERING_COUNTRIES,
  ACCREDITED_THRESHOLDS,
  type Investor,
  type InvestorStatus,
  type CreateInvestorInput,
  type KYCDocument,
  type AccreditedVerification,
} from './types';
import { InvestorRepository } from './repository';
import { getApiClient, type ApiClient } from '@/api';

// Mock the API client
vi.mock('@/api', () => ({
  getApiClient: vi.fn(),
}));

describe('Investor Types', () => {
  describe('isValidInvestorTransition', () => {
    it('should allow applied -> under-review transition', () => {
      expect(isValidInvestorTransition('applied', 'under-review')).toBe(true);
    });

    it('should allow applied -> rejected transition', () => {
      expect(isValidInvestorTransition('applied', 'rejected')).toBe(true);
    });

    it('should not allow applied -> approved transition', () => {
      expect(isValidInvestorTransition('applied', 'approved')).toBe(false);
    });

    it('should allow under-review -> kyc-pending transition', () => {
      expect(isValidInvestorTransition('under-review', 'kyc-pending')).toBe(true);
    });

    it('should allow kyc-verified -> approved transition', () => {
      expect(isValidInvestorTransition('kyc-verified', 'approved')).toBe(true);
    });

    it('should allow approved -> active transition', () => {
      expect(isValidInvestorTransition('approved', 'active')).toBe(true);
    });

    it('should allow suspended -> active transition (reactivation)', () => {
      expect(isValidInvestorTransition('suspended', 'active')).toBe(true);
    });

    it('should not allow transitions from rejected', () => {
      expect(isValidInvestorTransition('rejected', 'applied')).toBe(false);
      expect(isValidInvestorTransition('rejected', 'under-review')).toBe(false);
    });
  });

  describe('requiresGovernmentApproval', () => {
    it('should return true for China', () => {
      expect(requiresGovernmentApproval('CN')).toBe(true);
    });

    it('should return true for Pakistan', () => {
      expect(requiresGovernmentApproval('PK')).toBe(true);
    });

    it('should return true for Bangladesh', () => {
      expect(requiresGovernmentApproval('BD')).toBe(true);
    });

    it('should return false for USA', () => {
      expect(requiresGovernmentApproval('US')).toBe(false);
    });

    it('should return false for UK', () => {
      expect(requiresGovernmentApproval('GB')).toBe(false);
    });

    it('should return false for Singapore', () => {
      expect(requiresGovernmentApproval('SG')).toBe(false);
    });

    it('should handle lowercase country codes', () => {
      expect(requiresGovernmentApproval('cn')).toBe(true);
      expect(requiresGovernmentApproval('us')).toBe(false);
    });
  });

  describe('BORDERING_COUNTRIES', () => {
    it('should include all 7 bordering countries', () => {
      expect(BORDERING_COUNTRIES).toHaveLength(7);
      expect(BORDERING_COUNTRIES).toContain('CN');
      expect(BORDERING_COUNTRIES).toContain('PK');
      expect(BORDERING_COUNTRIES).toContain('BD');
      expect(BORDERING_COUNTRIES).toContain('MM');
      expect(BORDERING_COUNTRIES).toContain('NP');
      expect(BORDERING_COUNTRIES).toContain('BT');
      expect(BORDERING_COUNTRIES).toContain('AF');
    });
  });

  describe('ACCREDITED_THRESHOLDS', () => {
    it('should have correct individual income threshold (2 Cr)', () => {
      expect(ACCREDITED_THRESHOLDS.individual.income).toBe(20000000);
    });

    it('should have correct individual networth threshold (7.5 Cr)', () => {
      expect(ACCREDITED_THRESHOLDS.individual.netWorth).toBe(75000000);
    });

    it('should have correct body corporate networth threshold (50 Cr)', () => {
      expect(ACCREDITED_THRESHOLDS.bodyCorporate.netWorth).toBe(500000000);
    });
  });
});

describe('InvestorRepository', () => {
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    rpc: ReturnType<typeof vi.fn>;
  };

  let repository: InvestorRepository;

  const mockInvestor: Investor = {
    id: 'investor-123',
    userId: 'user-456',
    investorType: 'individual',
    status: 'applied',
    legalName: 'Roshan Shah',
    email: 'roshan@example.com',
    phone: '+919876543210',
    pan: 'ABCDE1234F',
    residencyStatus: 'resident-indian',
    nationality: 'IN',
    countryOfResidence: 'IN',
    countryClassification: 'non-restricted',
    isAccreditedInvestor: false,
    kycStatus: 'not-submitted',
    isPoliticallyExposed: false,
    isRelatedToRegulator: false,
    hasSanctionsHit: false,
    requiresGovernmentApproval: false,
    createdAt: '2026-01-25T00:00:00Z',
    updatedAt: '2026-01-25T00:00:00Z',
  };

  const mockCreateInput: CreateInvestorInput = {
    investorType: 'individual',
    legalName: 'Roshan Shah',
    email: 'roshan@example.com',
    phone: '+919876543210',
    pan: 'ABCDE1234F',
    residencyStatus: 'resident-indian',
    nationality: 'IN',
    countryOfResidence: 'IN',
    dateOfBirth: '1990-01-15',
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
    repository = new InvestorRepository();
  });

  describe('getById', () => {
    it('should fetch an investor by ID', async () => {
      mockApiClient.get.mockResolvedValue(mockInvestor);

      const result = await repository.getById('investor-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('investors', 'investor-123');
      expect(result.data).toEqual(mockInvestor);
    });
  });

  describe('getByUserId', () => {
    it('should fetch investor by user ID', async () => {
      mockApiClient.list.mockResolvedValue({ 
        data: {
          data: [mockInvestor],
          total: 1,
          page: 1,
          pageSize: 1,
          hasMore: false,
        },
        error: null,
      });

      const result = await repository.getByUserId('user-456');

      expect(mockApiClient.list).toHaveBeenCalledWith('investors', { filters: { userId: 'user-456' } });
      expect(result.data).toEqual(mockInvestor);
    });

    it('should return null if no investor found', async () => {
      mockApiClient.list.mockResolvedValue({ 
        data: {
          data: [],
          total: 0,
          page: 1,
          pageSize: 1,
          hasMore: false,
        },
        error: null,
      });

      const result = await repository.getByUserId('non-existent');

      expect(result.data).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new investor in applied status', async () => {
      mockApiClient.create.mockResolvedValue({ data: mockInvestor, error: null });

      const result = await repository.create('user-456', mockCreateInput);

      expect(mockApiClient.create).toHaveBeenCalledWith('investors', expect.objectContaining({
        ...mockCreateInput,
        userId: 'user-456',
        status: 'applied',
        kycStatus: 'not-submitted',
      }));
      expect(result.data?.status).toBe('applied');
    });

    it('should validate PAN format', async () => {
      const invalidInput = { ...mockCreateInput, pan: 'INVALID' };

      const result = await repository.create('user-456', invalidInput);

      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('PAN');
    });

    it('should validate email format', async () => {
      const invalidInput = { ...mockCreateInput, email: 'invalid-email' };

      const result = await repository.create('user-456', invalidInput);

      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toContain('email');
    });

    it('should set requiresGovernmentApproval for bordering countries', async () => {
      const nriInput: CreateInvestorInput = { 
        ...mockCreateInput, 
        countryOfResidence: 'CN',
        residencyStatus: 'foreign-national',
        nationality: 'CN',
      };
      
      const expectedInvestor = { 
        ...mockInvestor, 
        countryOfResidence: 'CN',
        requiresGovernmentApproval: true,
        countryClassification: 'bordering-country' as const,
      };
      mockApiClient.create.mockResolvedValue({ data: expectedInvestor, error: null });

      const result = await repository.create('user-456', nriInput);

      expect(mockApiClient.create).toHaveBeenCalledWith('investors', expect.objectContaining({
        requiresGovernmentApproval: true,
        countryClassification: 'bordering-country',
      }));
    });
  });

  describe('updateStatus', () => {
    it('should transition investor from applied to under-review', async () => {
      mockApiClient.get.mockResolvedValue(mockInvestor);
      const updatedInvestor = { ...mockInvestor, status: 'under-review' as InvestorStatus };
      mockApiClient.update.mockResolvedValue({ data: updatedInvestor, error: null });

      const result = await repository.updateStatus('investor-123', 'under-review');

      expect(result.data?.status).toBe('under-review');
    });

    it('should reject invalid status transition', async () => {
      mockApiClient.get.mockResolvedValue(mockInvestor);

      const result = await repository.updateStatus('investor-123', 'active');

      expect(result.error?.code).toBe('INVALID_TRANSITION');
    });

    it('should set approvedAt when transitioning to approved', async () => {
      const kycVerifiedInvestor = { ...mockInvestor, status: 'kyc-verified' as InvestorStatus };
      mockApiClient.get.mockResolvedValue(kycVerifiedInvestor);
      mockApiClient.update.mockResolvedValue({ 
        data: { ...kycVerifiedInvestor, status: 'approved', approvedAt: expect.any(String) }, 
        error: null 
      });

      const result = await repository.updateStatus('investor-123', 'approved', 'admin-789');

      expect(mockApiClient.update).toHaveBeenCalledWith('investors', 'investor-123', expect.objectContaining({
        status: 'approved',
        approvedAt: expect.any(String),
        approvedBy: 'admin-789',
      }));
    });
  });

  describe('rejectInvestor', () => {
    it('should reject investor with reason', async () => {
      mockApiClient.get.mockResolvedValue(mockInvestor);
      const rejectedInvestor = { 
        ...mockInvestor, 
        status: 'rejected' as InvestorStatus,
        rejectionReason: 'Incomplete documentation' 
      };
      mockApiClient.update.mockResolvedValue({ data: rejectedInvestor, error: null });

      const result = await repository.rejectInvestor('investor-123', 'Incomplete documentation', 'admin-789');

      expect(result.data?.status).toBe('rejected');
      expect(mockApiClient.update).toHaveBeenCalledWith('investors', 'investor-123', expect.objectContaining({
        status: 'rejected',
        rejectionReason: 'Incomplete documentation',
        rejectedBy: 'admin-789',
      }));
    });
  });

  describe('submitKYC', () => {
    it('should transition from kyc-pending to kyc-submitted', async () => {
      const kycPendingInvestor = { ...mockInvestor, status: 'kyc-pending' as InvestorStatus };
      mockApiClient.get.mockResolvedValue(kycPendingInvestor);
      
      const kycSubmittedInvestor = { 
        ...kycPendingInvestor, 
        status: 'kyc-submitted' as InvestorStatus,
        kycStatus: 'submitted' as const,
      };
      mockApiClient.update.mockResolvedValue({ data: kycSubmittedInvestor, error: null });

      const result = await repository.submitKYC('investor-123');

      expect(result.data?.status).toBe('kyc-submitted');
      expect(result.data?.kycStatus).toBe('submitted');
    });

    it('should fail if not in kyc-pending status', async () => {
      mockApiClient.get.mockResolvedValue(mockInvestor); // applied status

      const result = await repository.submitKYC('investor-123');

      expect(result.error?.code).toBe('INVALID_OPERATION');
    });
  });

  describe('verifyKYC', () => {
    it('should transition from kyc-submitted to kyc-verified', async () => {
      const kycSubmittedInvestor = { 
        ...mockInvestor, 
        status: 'kyc-submitted' as InvestorStatus,
        kycStatus: 'submitted' as const,
      };
      mockApiClient.get.mockResolvedValue(kycSubmittedInvestor);
      
      const kycVerifiedInvestor = { 
        ...kycSubmittedInvestor, 
        status: 'kyc-verified' as InvestorStatus,
        kycStatus: 'verified' as const,
      };
      mockApiClient.update.mockResolvedValue({ data: kycVerifiedInvestor, error: null });

      const result = await repository.verifyKYC('investor-123', 'admin-789');

      expect(result.data?.status).toBe('kyc-verified');
      expect(result.data?.kycStatus).toBe('verified');
    });
  });

  describe('verifyAccreditedStatus', () => {
    it('should mark investor as accredited with category', async () => {
      const approvedInvestor = { ...mockInvestor, status: 'approved' as InvestorStatus };
      mockApiClient.get.mockResolvedValue(approvedInvestor);
      
      const accreditedInvestor = { 
        ...approvedInvestor, 
        isAccreditedInvestor: true,
        accreditedCategory: 'individual-income' as const,
      };
      mockApiClient.update.mockResolvedValue({ data: accreditedInvestor, error: null });

      const result = await repository.verifyAccreditedStatus(
        'investor-123', 
        'individual-income', 
        'admin-789'
      );

      expect(result.data?.isAccreditedInvestor).toBe(true);
      expect(result.data?.accreditedCategory).toBe('individual-income');
    });
  });

  describe('getKYCDocuments', () => {
    it('should fetch KYC documents for an investor', async () => {
      const mockDocuments: KYCDocument[] = [
        {
          id: 'doc-1',
          investorId: 'investor-123',
          documentType: 'pan',
          documentNumber: 'ABCDE1234F',
          fileName: 'pan.pdf',
          fileUrl: 'https://storage/pan.pdf',
          fileSize: 102400,
          mimeType: 'application/pdf',
          status: 'verified',
          createdAt: '2026-01-25T00:00:00Z',
          updatedAt: '2026-01-25T00:00:00Z',
        },
      ];

      mockApiClient.list.mockResolvedValue({ 
        data: {
          data: mockDocuments,
          total: 1,
          page: 1,
          pageSize: 20,
          hasMore: false,
        },
        error: null,
      });

      const result = await repository.getKYCDocuments('investor-123');

      expect(mockApiClient.list).toHaveBeenCalledWith('kyc_documents', { filters: { investorId: 'investor-123' } });
      expect(result.data?.data).toHaveLength(1);
    });
  });

  describe('checkEligibilityForDeal', () => {
    it('should return eligible for approved investor', async () => {
      const approvedInvestor = { ...mockInvestor, status: 'approved' as InvestorStatus };
      mockApiClient.get.mockResolvedValue(approvedInvestor);

      const result = await repository.checkEligibilityForDeal('investor-123');

      expect(result.data?.isEligible).toBe(true);
    });

    it('should return eligible for active investor', async () => {
      const activeInvestor = { ...mockInvestor, status: 'active' as InvestorStatus };
      mockApiClient.get.mockResolvedValue(activeInvestor);

      const result = await repository.checkEligibilityForDeal('investor-123');

      expect(result.data?.isEligible).toBe(true);
    });

    it('should return not eligible for kyc-pending investor', async () => {
      const kycPendingInvestor = { ...mockInvestor, status: 'kyc-pending' as InvestorStatus };
      mockApiClient.get.mockResolvedValue(kycPendingInvestor);

      const result = await repository.checkEligibilityForDeal('investor-123');

      expect(result.data?.isEligible).toBe(false);
      expect(result.data?.reason).toContain('KYC');
    });

    it('should return not eligible for suspended investor', async () => {
      const suspendedInvestor = { ...mockInvestor, status: 'suspended' as InvestorStatus };
      mockApiClient.get.mockResolvedValue(suspendedInvestor);

      const result = await repository.checkEligibilityForDeal('investor-123');

      expect(result.data?.isEligible).toBe(false);
      expect(result.data?.reason).toContain('suspended');
    });

    it('should require government approval for bordering country investors', async () => {
      const borderingInvestor = { 
        ...mockInvestor, 
        status: 'approved' as InvestorStatus,
        countryOfResidence: 'CN',
        requiresGovernmentApproval: true,
      };
      mockApiClient.get.mockResolvedValue(borderingInvestor);

      const result = await repository.checkEligibilityForDeal('investor-123');

      expect(result.data?.requiresApproval).toBe(true);
      expect(result.data?.approvalType).toBe('government');
    });
  });
});
