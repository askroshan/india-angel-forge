import { getApiClient } from '@/api';
import type { ApiResponse, PaginatedResponse } from '@/api/types';
import type { 
  EscrowAccount, 
  EscrowAccountStatus,
  VirtualAccount, 
  VirtualAccountStatus,
  PaymentTransaction,
  Disbursement,
  Refund,
  CreateEscrowAccountInput,
  CreateVirtualAccountInput,
  RecordPaymentInput,
  CreateDisbursementInput,
  CreateRefundInput,
} from './types';
import { isValidVATransition, generateVAExpiryDate } from './types';

// Payment receiving statuses for VAs
const PAYMENT_RECEIVING_STATUSES: VirtualAccountStatus[] = ['active'];

export interface DealEscrowSummary {
  escrowAccountId: string;
  totalExpected: number;
  totalReceived: number;
  totalVerified: number;
  totalTransferred: number;
  totalRefunded: number;
  vaCount: number;
  paidVaCount: number;
}

export interface ActivateEscrowInput {
  accountNumber: string;
  accountName: string;
  ifscCode: string;
  branchName: string;
  bankReferenceId?: string;
}

export class EscrowRepository {
  private apiClient = getApiClient();

  // ============== Escrow Account Operations ==============

  /**
   * Create a new escrow account for a deal
   */
  async createEscrowAccount(input: CreateEscrowAccountInput): Promise<ApiResponse<EscrowAccount>> {
    const escrowData = {
      ...input,
      status: 'pending-setup' as EscrowAccountStatus,
      currentBalance: 0,
      totalReceived: 0,
      totalDisbursed: 0,
      setupRequestedAt: new Date().toISOString(),
    };

    return this.apiClient.create<EscrowAccount>('escrow_accounts', escrowData);
  }

  /**
   * Get escrow account by ID
   */
  async getEscrowAccount(id: string): Promise<ApiResponse<EscrowAccount>> {
    try {
      const data = await this.apiClient.get<EscrowAccount>('escrow_accounts', id);
      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to fetch escrow account', 
          code: 'FETCH_ERROR' 
        } 
      };
    }
  }

  /**
   * Get escrow account by deal ID
   */
  async getEscrowAccountByDeal(dealId: string): Promise<ApiResponse<EscrowAccount | null>> {
    const response = await this.apiClient.list<EscrowAccount>('escrow_accounts', { filters: { dealId } });
    
    if (response.error) {
      return { data: null, error: response.error };
    }

    return { 
      data: response.data?.data && response.data.data.length > 0 ? response.data.data[0] : null, 
      error: null 
    };
  }

  /**
   * Activate an escrow account with bank details
   */
  async activateEscrowAccount(
    id: string, 
    bankDetails: ActivateEscrowInput
  ): Promise<ApiResponse<EscrowAccount>> {
    const escrowResponse = await this.getEscrowAccount(id);
    if (escrowResponse.error || !escrowResponse.data) {
      return { data: null, error: escrowResponse.error || { message: 'Escrow account not found', code: 'NOT_FOUND' } };
    }

    if (escrowResponse.data.status !== 'pending-setup') {
      return {
        data: null,
        error: {
          message: `Cannot activate escrow. Current status is ${escrowResponse.data.status}`,
          code: 'INVALID_OPERATION',
        },
      };
    }

    return this.apiClient.update<EscrowAccount>('escrow_accounts', id, {
      ...bankDetails,
      status: 'active',
      activatedAt: new Date().toISOString(),
    });
  }

  // ============== Virtual Account Operations ==============

  /**
   * Create a virtual account for an investor commitment
   */
  async createVirtualAccount(input: CreateVirtualAccountInput): Promise<ApiResponse<VirtualAccount>> {
    // Verify escrow account is active
    const escrowResponse = await this.getEscrowAccount(input.escrowAccountId);
    if (escrowResponse.error || !escrowResponse.data) {
      return { data: null, error: escrowResponse.error || { message: 'Escrow account not found', code: 'NOT_FOUND' } };
    }

    if (escrowResponse.data.status !== 'active') {
      return {
        data: null,
        error: {
          message: 'Escrow account is not active. Cannot create virtual account.',
          code: 'INVALID_OPERATION',
        },
      };
    }

    const vaData = {
      ...input,
      ifscCode: escrowResponse.data.ifscCode,
      status: 'active' as VirtualAccountStatus,
      receivedAmount: 0,
      expiresAt: input.expiresAt || generateVAExpiryDate(),
    };

    return this.apiClient.create<VirtualAccount>('virtual_accounts', vaData);
  }

  /**
   * Get virtual account by ID
   */
  async getVirtualAccount(id: string): Promise<ApiResponse<VirtualAccount>> {
    try {
      const data = await this.apiClient.get<VirtualAccount>('virtual_accounts', id);
      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to fetch virtual account', 
          code: 'FETCH_ERROR' 
        } 
      };
    }
  }

  /**
   * Get virtual account by commitment ID
   */
  async getVirtualAccountByCommitment(commitmentId: string): Promise<ApiResponse<VirtualAccount | null>> {
    const response = await this.apiClient.list<VirtualAccount>('virtual_accounts', { filters: { commitmentId } });
    
    if (response.error) {
      return { data: null, error: response.error };
    }

    return { 
      data: response.data?.data && response.data.data.length > 0 ? response.data.data[0] : null, 
      error: null 
    };
  }

  /**
   * Get all virtual accounts for a deal
   */
  async getVirtualAccountsByDeal(dealId: string): Promise<ApiResponse<PaginatedResponse<VirtualAccount>>> {
    return this.apiClient.list<VirtualAccount>('virtual_accounts', { filters: { dealId } });
  }

  // ============== Payment Operations ==============

  /**
   * Record a payment received in a virtual account
   */
  async recordPayment(input: RecordPaymentInput): Promise<ApiResponse<VirtualAccount>> {
    const vaResponse = await this.getVirtualAccount(input.virtualAccountId);
    if (vaResponse.error || !vaResponse.data) {
      return { data: null, error: vaResponse.error || { message: 'Virtual account not found', code: 'NOT_FOUND' } };
    }

    const va = vaResponse.data;

    // Check if VA can receive payment
    if (!PAYMENT_RECEIVING_STATUSES.includes(va.status)) {
      return {
        data: null,
        error: {
          message: `Virtual account is ${va.status}. Cannot receive payment.`,
          code: 'INVALID_OPERATION',
        },
      };
    }

    // Create payment transaction record
    const transactionData = {
      virtualAccountId: va.id,
      escrowAccountId: va.escrowAccountId,
      investorId: va.investorId,
      dealId: va.dealId,
      amount: input.amount,
      paymentMode: input.paymentMode,
      status: 'received' as const,
      utrNumber: input.utrNumber,
      senderAccountNumber: input.senderAccountNumber,
      senderIfscCode: input.senderIfscCode,
      isAmountMatched: input.amount === va.expectedAmount,
      receivedAt: new Date().toISOString(),
    };

    await this.apiClient.create<PaymentTransaction>('payment_transactions', transactionData);

    // Update VA with received amount
    return this.apiClient.update<VirtualAccount>('virtual_accounts', va.id, {
      status: 'payment-received',
      receivedAmount: input.amount,
      paymentReference: input.utrNumber,
      paymentMode: input.paymentMode,
      paymentReceivedAt: new Date().toISOString(),
    });
  }

  /**
   * Verify payment in a virtual account
   */
  async verifyPayment(vaId: string, verifiedBy: string): Promise<ApiResponse<VirtualAccount>> {
    const vaResponse = await this.getVirtualAccount(vaId);
    if (vaResponse.error || !vaResponse.data) {
      return { data: null, error: vaResponse.error || { message: 'Virtual account not found', code: 'NOT_FOUND' } };
    }

    const va = vaResponse.data;

    if (va.status !== 'payment-received') {
      return {
        data: null,
        error: {
          message: `Cannot verify payment. VA status is ${va.status}`,
          code: 'INVALID_OPERATION',
        },
      };
    }

    // Check amount match
    if (va.receivedAmount !== va.expectedAmount) {
      return {
        data: null,
        error: {
          message: `Amount mismatch. Expected: ₹${va.expectedAmount}, Received: ₹${va.receivedAmount}`,
          code: 'AMOUNT_MISMATCH',
        },
      };
    }

    return this.apiClient.update<VirtualAccount>('virtual_accounts', vaId, {
      status: 'verified',
      paymentVerifiedAt: new Date().toISOString(),
    });
  }

  /**
   * Get payment transactions for a virtual account
   */
  async getPaymentTransactions(vaId: string): Promise<ApiResponse<PaginatedResponse<PaymentTransaction>>> {
    return this.apiClient.list<PaymentTransaction>('payment_transactions', { filters: { virtualAccountId: vaId } });
  }

  // ============== Disbursement Operations ==============

  /**
   * Create a disbursement request
   */
  async createDisbursement(
    input: CreateDisbursementInput, 
    requestedBy: string
  ): Promise<ApiResponse<Disbursement>> {
    const escrowResponse = await this.getEscrowAccount(input.escrowAccountId);
    if (escrowResponse.error || !escrowResponse.data) {
      return { data: null, error: escrowResponse.error || { message: 'Escrow account not found', code: 'NOT_FOUND' } };
    }

    const escrow = escrowResponse.data;

    // Check sufficient balance
    if (input.amount > escrow.currentBalance) {
      return {
        data: null,
        error: {
          message: `Insufficient balance. Available: ₹${escrow.currentBalance}, Requested: ₹${input.amount}`,
          code: 'INSUFFICIENT_BALANCE',
        },
      };
    }

    const disbursementData = {
      ...input,
      status: 'pending' as const,
      requestedBy,
      requestedAt: new Date().toISOString(),
    };

    return this.apiClient.create<Disbursement>('disbursements', disbursementData);
  }

  /**
   * Approve a disbursement
   */
  async approveDisbursement(id: string, approvedBy: string): Promise<ApiResponse<Disbursement>> {
    return this.apiClient.update<Disbursement>('disbursements', id, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date().toISOString(),
    });
  }

  /**
   * Get disbursements for a deal
   */
  async getDisbursements(dealId: string): Promise<ApiResponse<PaginatedResponse<Disbursement>>> {
    return this.apiClient.list<Disbursement>('disbursements', { filters: { dealId } });
  }

  // ============== Summary & Reporting ==============

  /**
   * Get summary of escrow funds for a deal
   */
  async getDealEscrowSummary(dealId: string): Promise<ApiResponse<DealEscrowSummary>> {
    // Get escrow account
    const escrowResponse = await this.getEscrowAccountByDeal(dealId);
    if (escrowResponse.error || !escrowResponse.data) {
      return { data: null, error: escrowResponse.error || { message: 'Escrow account not found', code: 'NOT_FOUND' } };
    }

    const escrow = escrowResponse.data;

    // Get all VAs for the deal
    const vasResponse = await this.getVirtualAccountsByDeal(dealId);
    if (vasResponse.error) {
      return { data: null, error: vasResponse.error };
    }

    const vas = vasResponse.data?.data || [];

    // Calculate summary
    const summary: DealEscrowSummary = {
      escrowAccountId: escrow.id,
      totalExpected: vas.reduce((sum: number, va: VirtualAccount) => sum + va.expectedAmount, 0),
      totalReceived: vas.reduce((sum: number, va: VirtualAccount) => sum + va.receivedAmount, 0),
      totalVerified: vas
        .filter((va: VirtualAccount) => va.status === 'verified' || va.status === 'transferred')
        .reduce((sum: number, va: VirtualAccount) => sum + va.receivedAmount, 0),
      totalTransferred: vas
        .filter((va: VirtualAccount) => va.status === 'transferred')
        .reduce((sum: number, va: VirtualAccount) => sum + va.receivedAmount, 0),
      totalRefunded: vas
        .filter((va: VirtualAccount) => va.status === 'refunded')
        .reduce((sum: number, va: VirtualAccount) => sum + va.receivedAmount, 0),
      vaCount: vas.length,
      paidVaCount: vas.filter((va: VirtualAccount) => va.receivedAmount > 0).length,
    };

    return { data: summary, error: null };
  }

  // ============== Maintenance Operations ==============

  /**
   * Expire virtual accounts past their expiry date
   * This would typically be called by a scheduled job
   */
  async expireVirtualAccounts(): Promise<ApiResponse<{ expiredCount: number }>> {
    // This would be an RPC call to the backend to expire VAs in bulk
    return this.apiClient.rpc<{ expiredCount: number }>('expire_virtual_accounts', {
      cutoffDate: new Date().toISOString(),
    });
  }

  // ============== Refund Operations ==============

  /**
   * Create a refund request
   */
  async createRefund(input: CreateRefundInput, requestedBy: string): Promise<ApiResponse<Refund>> {
    const refundData = {
      ...input,
      status: 'pending' as const,
      requestedBy,
      requestedAt: new Date().toISOString(),
    };

    return this.apiClient.create<Refund>('refunds', refundData);
  }

  /**
   * Approve a refund
   */
  async approveRefund(id: string, approvedBy: string): Promise<ApiResponse<Refund>> {
    return this.apiClient.update<Refund>('refunds', id, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date().toISOString(),
    });
  }
}
