import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  isValidVATransition, 
  VALID_VA_TRANSITIONS,
  generateVAExpiryDate,
  DEFAULT_VA_VALIDITY_DAYS,
  type EscrowAccount,
  type VirtualAccount,
  type VirtualAccountStatus,
  type PaymentTransaction,
  type CreateEscrowAccountInput,
  type CreateVirtualAccountInput,
} from './types';
import { EscrowRepository } from './repository';
import { getApiClient, type ApiClient } from '@/api';

// Mock the API client
vi.mock('@/api', () => ({
  getApiClient: vi.fn(),
}));

describe('Escrow Types', () => {
  describe('isValidVATransition', () => {
    it('should allow active -> payment-received transition', () => {
      expect(isValidVATransition('active', 'payment-received')).toBe(true);
    });

    it('should allow active -> expired transition', () => {
      expect(isValidVATransition('active', 'expired')).toBe(true);
    });

    it('should allow payment-received -> verified transition', () => {
      expect(isValidVATransition('payment-received', 'verified')).toBe(true);
    });

    it('should allow verified -> transferred transition', () => {
      expect(isValidVATransition('verified', 'transferred')).toBe(true);
    });

    it('should allow verified -> refunded transition', () => {
      expect(isValidVATransition('verified', 'refunded')).toBe(true);
    });

    it('should not allow transitions from expired', () => {
      expect(isValidVATransition('expired', 'active')).toBe(false);
    });

    it('should not allow transitions from transferred', () => {
      expect(isValidVATransition('transferred', 'refunded')).toBe(false);
    });

    it('should not allow direct active -> transferred transition', () => {
      expect(isValidVATransition('active', 'transferred')).toBe(false);
    });
  });

  describe('generateVAExpiryDate', () => {
    it('should generate date 14 days in future by default', () => {
      const now = new Date();
      const expiryDate = new Date(generateVAExpiryDate());
      
      const diffDays = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(DEFAULT_VA_VALIDITY_DAYS);
    });

    it('should generate date with custom validity days', () => {
      const now = new Date();
      const expiryDate = new Date(generateVAExpiryDate(7));
      
      const diffDays = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);
    });

    it('should return ISO string format', () => {
      const expiryDate = generateVAExpiryDate();
      expect(expiryDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('DEFAULT_VA_VALIDITY_DAYS', () => {
    it('should be 14 days', () => {
      expect(DEFAULT_VA_VALIDITY_DAYS).toBe(14);
    });
  });
});

describe('EscrowRepository', () => {
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    rpc: ReturnType<typeof vi.fn>;
  };

  let repository: EscrowRepository;

  const mockEscrowAccount: EscrowAccount = {
    id: 'escrow-123',
    dealId: 'deal-456',
    bankPartner: 'icici',
    accountNumber: '1234567890',
    accountName: 'TechStartup Deal Escrow',
    ifscCode: 'ICIC0001234',
    branchName: 'Mumbai Main',
    status: 'active',
    currentBalance: 0,
    totalReceived: 0,
    totalDisbursed: 0,
    createdAt: '2026-01-25T00:00:00Z',
    updatedAt: '2026-01-25T00:00:00Z',
  };

  const mockVirtualAccount: VirtualAccount = {
    id: 'va-123',
    escrowAccountId: 'escrow-123',
    dealId: 'deal-456',
    investorId: 'investor-789',
    commitmentId: 'commitment-012',
    virtualAccountNumber: 'VA1234567890',
    beneficiaryName: 'TechStartup Deal - Roshan Shah',
    ifscCode: 'ICIC0001234',
    expectedAmount: 500000,
    receivedAmount: 0,
    status: 'active',
    expiresAt: '2026-02-08T00:00:00Z',
    createdAt: '2026-01-25T00:00:00Z',
    updatedAt: '2026-01-25T00:00:00Z',
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
    repository = new EscrowRepository();
  });

  describe('createEscrowAccount', () => {
    it('should create a new escrow account for a deal', async () => {
      const input: CreateEscrowAccountInput = {
        dealId: 'deal-456',
        bankPartner: 'icici',
      };

      mockApiClient.create.mockResolvedValue({ data: mockEscrowAccount, error: null });

      const result = await repository.createEscrowAccount(input);

      expect(mockApiClient.create).toHaveBeenCalledWith('escrow_accounts', expect.objectContaining({
        dealId: 'deal-456',
        bankPartner: 'icici',
        status: 'pending-setup',
      }));
      expect(result.error).toBeNull();
    });
  });

  describe('getEscrowAccountByDeal', () => {
    it('should fetch escrow account for a deal', async () => {
      mockApiClient.list.mockResolvedValue({ 
        data: [mockEscrowAccount], 
        error: null,
        total: 1,
        page: 1,
        pageSize: 1,
      });

      const result = await repository.getEscrowAccountByDeal('deal-456');

      expect(mockApiClient.list).toHaveBeenCalledWith('escrow_accounts', { dealId: 'deal-456' });
      expect(result.data).toEqual(mockEscrowAccount);
    });
  });

  describe('activateEscrowAccount', () => {
    it('should activate a pending escrow account', async () => {
      const pendingEscrow = { ...mockEscrowAccount, status: 'pending-setup' as const };
      mockApiClient.get.mockResolvedValue({ data: pendingEscrow, error: null });
      
      const activeEscrow = { ...pendingEscrow, status: 'active' as const };
      mockApiClient.update.mockResolvedValue({ data: activeEscrow, error: null });

      const result = await repository.activateEscrowAccount('escrow-123', {
        accountNumber: '1234567890',
        accountName: 'TechStartup Deal Escrow',
        ifscCode: 'ICIC0001234',
        branchName: 'Mumbai Main',
      });

      expect(result.data?.status).toBe('active');
    });

    it('should not activate an already active escrow', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEscrowAccount, error: null }); // Already active

      const result = await repository.activateEscrowAccount('escrow-123', {
        accountNumber: '1234567890',
        accountName: 'TechStartup Deal Escrow',
        ifscCode: 'ICIC0001234',
        branchName: 'Mumbai Main',
      });

      expect(result.error?.code).toBe('INVALID_OPERATION');
    });
  });

  describe('createVirtualAccount', () => {
    it('should create a VA for an investor commitment', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEscrowAccount, error: null });
      mockApiClient.create.mockResolvedValue({ data: mockVirtualAccount, error: null });

      const input: CreateVirtualAccountInput = {
        escrowAccountId: 'escrow-123',
        dealId: 'deal-456',
        investorId: 'investor-789',
        commitmentId: 'commitment-012',
        expectedAmount: 500000,
      };

      const result = await repository.createVirtualAccount(input);

      expect(mockApiClient.create).toHaveBeenCalledWith('virtual_accounts', expect.objectContaining({
        status: 'active',
        expectedAmount: 500000,
        receivedAmount: 0,
      }));
      expect(result.error).toBeNull();
    });

    it('should fail if escrow account is not active', async () => {
      const pendingEscrow = { ...mockEscrowAccount, status: 'pending-setup' as const };
      mockApiClient.get.mockResolvedValue({ data: pendingEscrow, error: null });

      const input: CreateVirtualAccountInput = {
        escrowAccountId: 'escrow-123',
        dealId: 'deal-456',
        investorId: 'investor-789',
        commitmentId: 'commitment-012',
        expectedAmount: 500000,
      };

      const result = await repository.createVirtualAccount(input);

      expect(result.error?.code).toBe('INVALID_OPERATION');
    });
  });

  describe('getVirtualAccountByCommitment', () => {
    it('should fetch VA for a commitment', async () => {
      mockApiClient.list.mockResolvedValue({ 
        data: [mockVirtualAccount], 
        error: null,
        total: 1,
        page: 1,
        pageSize: 1,
      });

      const result = await repository.getVirtualAccountByCommitment('commitment-012');

      expect(result.data).toEqual(mockVirtualAccount);
    });
  });

  describe('recordPayment', () => {
    it('should record payment and update VA status', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockVirtualAccount, error: null });
      
      const paidVA = { 
        ...mockVirtualAccount, 
        status: 'payment-received' as VirtualAccountStatus,
        receivedAmount: 500000,
      };
      mockApiClient.update.mockResolvedValue({ data: paidVA, error: null });
      
      mockApiClient.create.mockResolvedValue({ 
        data: { id: 'tx-123' }, 
        error: null 
      });

      const result = await repository.recordPayment({
        virtualAccountId: 'va-123',
        amount: 500000,
        paymentMode: 'neft',
        utrNumber: 'UTR123456789',
      });

      expect(result.data?.receivedAmount).toBe(500000);
      expect(result.data?.status).toBe('payment-received');
    });

    it('should fail for expired VA', async () => {
      const expiredVA = { ...mockVirtualAccount, status: 'expired' as VirtualAccountStatus };
      mockApiClient.get.mockResolvedValue({ data: expiredVA, error: null });

      const result = await repository.recordPayment({
        virtualAccountId: 'va-123',
        amount: 500000,
        paymentMode: 'neft',
      });

      expect(result.error?.code).toBe('INVALID_OPERATION');
      expect(result.error?.message).toContain('expired');
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment and update VA status', async () => {
      const paidVA = { 
        ...mockVirtualAccount, 
        status: 'payment-received' as VirtualAccountStatus,
        receivedAmount: 500000,
      };
      mockApiClient.get.mockResolvedValue({ data: paidVA, error: null });
      
      const verifiedVA = { ...paidVA, status: 'verified' as VirtualAccountStatus };
      mockApiClient.update.mockResolvedValue({ data: verifiedVA, error: null });

      const result = await repository.verifyPayment('va-123', 'admin-456');

      expect(result.data?.status).toBe('verified');
    });

    it('should detect amount mismatch', async () => {
      const mismatchedVA = { 
        ...mockVirtualAccount, 
        status: 'payment-received' as VirtualAccountStatus,
        receivedAmount: 400000, // Less than expected 500000
      };
      mockApiClient.get.mockResolvedValue({ data: mismatchedVA, error: null });

      const result = await repository.verifyPayment('va-123', 'admin-456');

      expect(result.error?.code).toBe('AMOUNT_MISMATCH');
    });
  });

  describe('getPaymentTransactions', () => {
    it('should fetch payment transactions for a VA', async () => {
      const mockTransaction: PaymentTransaction = {
        id: 'tx-123',
        virtualAccountId: 'va-123',
        escrowAccountId: 'escrow-123',
        investorId: 'investor-789',
        dealId: 'deal-456',
        amount: 500000,
        paymentMode: 'neft',
        status: 'received',
        isAmountMatched: true,
        createdAt: '2026-01-25T00:00:00Z',
        updatedAt: '2026-01-25T00:00:00Z',
      };

      mockApiClient.list.mockResolvedValue({ 
        data: [mockTransaction], 
        error: null,
        total: 1,
        page: 1,
        pageSize: 20,
      });

      const result = await repository.getPaymentTransactions('va-123');

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getDealEscrowSummary', () => {
    it('should return summary of all escrow funds for a deal', async () => {
      mockApiClient.list.mockResolvedValueOnce({ 
        data: [mockEscrowAccount], 
        error: null,
        total: 1,
        page: 1,
        pageSize: 1,
      });

      const virtualAccounts = [
        { ...mockVirtualAccount, receivedAmount: 500000, status: 'verified' },
        { ...mockVirtualAccount, id: 'va-456', receivedAmount: 1000000, status: 'verified' },
      ];
      mockApiClient.list.mockResolvedValueOnce({ 
        data: virtualAccounts, 
        error: null,
        total: 2,
        page: 1,
        pageSize: 20,
      });

      const result = await repository.getDealEscrowSummary('deal-456');

      expect(result.data?.totalExpected).toBe(1000000); // 2 x 500000
      expect(result.data?.totalReceived).toBe(1500000); // 500000 + 1000000
      expect(result.data?.totalVerified).toBe(1500000);
    });
  });

  describe('createDisbursement', () => {
    it('should create disbursement request', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: { ...mockEscrowAccount, currentBalance: 5000000 }, 
        error: null 
      });
      
      mockApiClient.create.mockResolvedValue({ 
        data: { id: 'disbursement-123', status: 'pending' }, 
        error: null 
      });

      const result = await repository.createDisbursement({
        escrowAccountId: 'escrow-123',
        dealId: 'deal-456',
        amount: 4500000,
        beneficiaryName: 'TechStartup Pvt Ltd',
        beneficiaryAccountNumber: '9876543210',
        beneficiaryIfscCode: 'HDFC0001234',
        beneficiaryBankName: 'HDFC Bank',
      }, 'admin-456');

      expect(mockApiClient.create).toHaveBeenCalledWith('disbursements', expect.objectContaining({
        amount: 4500000,
        status: 'pending',
        requestedBy: 'admin-456',
      }));
    });

    it('should fail if disbursement exceeds balance', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: { ...mockEscrowAccount, currentBalance: 1000000 }, 
        error: null 
      });

      const result = await repository.createDisbursement({
        escrowAccountId: 'escrow-123',
        dealId: 'deal-456',
        amount: 5000000, // More than 1M balance
        beneficiaryName: 'TechStartup Pvt Ltd',
        beneficiaryAccountNumber: '9876543210',
        beneficiaryIfscCode: 'HDFC0001234',
        beneficiaryBankName: 'HDFC Bank',
      }, 'admin-456');

      expect(result.error?.code).toBe('INSUFFICIENT_BALANCE');
    });
  });

  describe('expireVirtualAccounts', () => {
    it('should expire VAs past their expiry date', async () => {
      const expiredVAs = [
        { ...mockVirtualAccount, id: 'va-1', expiresAt: '2026-01-20T00:00:00Z' },
        { ...mockVirtualAccount, id: 'va-2', expiresAt: '2026-01-21T00:00:00Z' },
      ];

      mockApiClient.rpc.mockResolvedValue({ 
        data: { expiredCount: 2 }, 
        error: null 
      });

      const result = await repository.expireVirtualAccounts();

      expect(result.data?.expiredCount).toBe(2);
    });
  });
});
