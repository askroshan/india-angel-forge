import { getApiClient } from '@/api';
import type { ApiResponse, PaginatedResponse, ApiError } from '@/api/types';
import type { 
  Deal, 
  DealStatus, 
  DealCommitment, 
  CreateDealInput, 
  UpdateDealInput,
  CreateCommitmentInput,
} from './types';
import { isValidDealTransition } from './types';

// Minimum commitment as per SEBI Angel Fund regulations (1 Lakh INR)
const MIN_COMMITMENT_AMOUNT = 100000;

// Statuses that can accept new commitments
const COMMITMENT_ACCEPTING_STATUSES: DealStatus[] = ['live', 'closing'];

// Statuses that allow deal deletion
const DELETABLE_STATUSES: DealStatus[] = ['draft', 'cancelled'];

// Commitment statuses that count towards deal metrics
const ACTIVE_COMMITMENT_STATUSES = ['committed', 'documents-pending', 'payment-pending', 'payment-received', 'funded'];

export interface DealFilters {
  status?: DealStatus;
  investmentVehicle?: Deal['investmentVehicle'];
  sector?: Deal['sector'];
  stage?: Deal['stage'];
}

export interface DealMetrics {
  totalCommitted: number;
  totalFunded: number;
  investorCount: number;
}

export class DealRepository {
  private apiClient = getApiClient();

  /**
   * Get a single deal by ID
   */
  async getById(id: string): Promise<ApiResponse<Deal>> {
    return this.apiClient.get<Deal>('deals', id);
  }

  /**
   * List deals with optional filters
   */
  async list(filters: DealFilters = {}): Promise<PaginatedResponse<Deal>> {
    return this.apiClient.list<Deal>('deals', filters);
  }

  /**
   * Create a new deal
   */
  async create(input: CreateDealInput): Promise<ApiResponse<Deal>> {
    // Validation
    const validationError = this.validateCreateInput(input);
    if (validationError) {
      return { data: null, error: validationError };
    }

    // Create with default values
    const dealData = {
      ...input,
      status: 'draft' as DealStatus,
      totalCommitted: 0,
      totalFunded: 0,
      investorCount: 0,
      requiresRbiApproval: false,
      isAngelTaxExempt: true,
      isPressNote3Compliant: true,
    };

    return this.apiClient.create<Deal>('deals', dealData);
  }

  /**
   * Update a deal's fields
   */
  async update(id: string, input: UpdateDealInput): Promise<ApiResponse<Deal>> {
    // Don't allow status updates through this method
    const { status, ...updateData } = input;
    
    return this.apiClient.update<Deal>('deals', id, updateData);
  }

  /**
   * Update deal status with state machine validation
   */
  async updateStatus(id: string, newStatus: DealStatus): Promise<ApiResponse<Deal>> {
    // Get current deal
    const dealResponse = await this.getById(id);
    if (dealResponse.error || !dealResponse.data) {
      return { data: null, error: dealResponse.error || { message: 'Deal not found', code: 'NOT_FOUND' } };
    }

    const currentDeal = dealResponse.data;

    // Validate transition
    if (!isValidDealTransition(currentDeal.status, newStatus)) {
      return {
        data: null,
        error: {
          message: `Invalid status transition from ${currentDeal.status} to ${newStatus}`,
          code: 'INVALID_TRANSITION',
        },
      };
    }

    // Build update payload with status-specific fields
    const updatePayload: Partial<Deal> = { status: newStatus };

    if (newStatus === 'live' && !currentDeal.publishedAt) {
      updatePayload.publishedAt = new Date().toISOString();
    }

    if (newStatus === 'closed') {
      updatePayload.actualCloseDate = new Date().toISOString();
    }

    if (newStatus === 'funded') {
      updatePayload.fundedDate = new Date().toISOString();
    }

    if (newStatus === 'exited') {
      updatePayload.exitDate = new Date().toISOString();
    }

    return this.apiClient.update<Deal>('deals', id, updatePayload);
  }

  /**
   * Delete a deal (only allowed for draft/cancelled deals)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    // Get current deal
    const dealResponse = await this.getById(id);
    if (dealResponse.error || !dealResponse.data) {
      return { data: null, error: dealResponse.error || { message: 'Deal not found', code: 'NOT_FOUND' } };
    }

    // Check if deletion is allowed
    if (!DELETABLE_STATUSES.includes(dealResponse.data.status)) {
      return {
        data: null,
        error: {
          message: `Cannot delete deal in ${dealResponse.data.status} status`,
          code: 'INVALID_OPERATION',
        },
      };
    }

    return this.apiClient.delete('deals', id);
  }

  /**
   * Get all commitments for a deal
   */
  async getCommitments(dealId: string): Promise<PaginatedResponse<DealCommitment>> {
    return this.apiClient.list<DealCommitment>('deal_commitments', { dealId });
  }

  /**
   * Add a commitment to a deal
   */
  async addCommitment(dealId: string, investorId: string, amount: number): Promise<ApiResponse<DealCommitment>> {
    // Get deal
    const dealResponse = await this.getById(dealId);
    if (dealResponse.error || !dealResponse.data) {
      return { data: null, error: dealResponse.error || { message: 'Deal not found', code: 'NOT_FOUND' } };
    }

    const deal = dealResponse.data;

    // Check if deal is accepting commitments
    if (!COMMITMENT_ACCEPTING_STATUSES.includes(deal.status)) {
      return {
        data: null,
        error: {
          message: `Deal is not accepting commitments. Current status: ${deal.status}`,
          code: 'INVALID_OPERATION',
        },
      };
    }

    // Validate minimum commitment
    if (amount < deal.minCommitment) {
      return {
        data: null,
        error: {
          message: `Amount ${amount} is below minimum commitment of ${deal.minCommitment}`,
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Validate maximum commitment if set
    if (deal.maxCommitment && amount > deal.maxCommitment) {
      return {
        data: null,
        error: {
          message: `Amount ${amount} exceeds maximum commitment of ${deal.maxCommitment}`,
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Create commitment
    const commitmentData = {
      dealId,
      investorId,
      amount,
      status: 'pending',
      amountReceived: 0,
    };

    return this.apiClient.create<DealCommitment>('deal_commitments', commitmentData);
  }

  /**
   * Calculate metrics for a deal based on commitments
   */
  async calculateDealMetrics(dealId: string): Promise<ApiResponse<DealMetrics>> {
    const commitmentsResponse = await this.getCommitments(dealId);
    
    if (commitmentsResponse.error) {
      return { data: null, error: commitmentsResponse.error };
    }

    const commitments = commitmentsResponse.data || [];
    
    // Filter active commitments (exclude cancelled)
    const activeCommitments = commitments.filter(c => 
      ACTIVE_COMMITMENT_STATUSES.includes(c.status)
    );

    const metrics: DealMetrics = {
      totalCommitted: activeCommitments.reduce((sum, c) => sum + c.amount, 0),
      totalFunded: activeCommitments.reduce((sum, c) => sum + (c.amountReceived || 0), 0),
      investorCount: activeCommitments.length,
    };

    return { data: metrics, error: null };
  }

  /**
   * Validate create input
   */
  private validateCreateInput(input: CreateDealInput): ApiError | null {
    if (input.minCommitment < MIN_COMMITMENT_AMOUNT) {
      return {
        message: `Minimum commitment must be at least ₹${MIN_COMMITMENT_AMOUNT.toLocaleString('en-IN')} (1 Lakh)`,
        code: 'VALIDATION_ERROR',
      };
    }

    if (input.targetAmount <= 0) {
      return {
        message: 'Target amount must be positive',
        code: 'VALIDATION_ERROR',
      };
    }

    if (input.valuation <= 0) {
      return {
        message: 'Valuation must be positive',
        code: 'VALIDATION_ERROR',
      };
    }

    if (input.maxCommitment && input.maxCommitment < input.minCommitment) {
      return {
        message: 'Maximum commitment cannot be less than minimum commitment',
        code: 'VALIDATION_ERROR',
      };
    }

    if (input.discountRate !== undefined && (input.discountRate < 0 || input.discountRate > 100)) {
      return {
        message: 'Discount rate must be between 0 and 100',
        code: 'VALIDATION_ERROR',
      };
    }

    return null;
  }
}
