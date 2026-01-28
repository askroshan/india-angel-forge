import { getApiClient } from '@/api';
import type { ApiResponse, PaginatedResponse, ApiError } from '@/api/types';
import type { 
  Investor, 
  InvestorStatus, 
  KYCDocument,
  KYCVerificationStatus,
  AccreditedInvestorCategory,
  CreateInvestorInput,
  UpdateInvestorInput,
  CountryClassification,
} from './types';
import { isValidInvestorTransition, requiresGovernmentApproval } from './types';

// Statuses that allow investing in deals
const INVESTMENT_ELIGIBLE_STATUSES: InvestorStatus[] = ['approved', 'active'];

// PAN format regex (ABCDE1234F pattern)
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// Email format regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface InvestorFilters {
  status?: InvestorStatus;
  investorType?: Investor['investorType'];
  residencyStatus?: Investor['residencyStatus'];
  isAccreditedInvestor?: boolean;
}

export interface EligibilityResult {
  isEligible: boolean;
  reason?: string;
  requiresApproval?: boolean;
  approvalType?: 'government' | 'platform';
}

export class InvestorRepository {
  private apiClient = getApiClient();

  /**
   * Get an investor by ID
   */
  async getById(id: string): Promise<ApiResponse<Investor>> {
    try {
      const data = await this.apiClient.get<Investor>('investors', id);
      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to fetch investor', 
          code: 'FETCH_ERROR' 
        } 
      };
    }
  }

  /**
   * Get an investor by user ID
   */
  async getByUserId(userId: string): Promise<ApiResponse<Investor | null>> {
    const response = await this.apiClient.list<Investor>('investors', { filters: { userId } });
    
    if (response.error) {
      return { data: null, error: response.error };
    }

    return { 
      data: response.data?.data && response.data.data.length > 0 ? response.data.data[0] : null, 
      error: null 
    };
  }

  /**
   * List investors with optional filters
   */
  async list(filters: InvestorFilters = {}): Promise<ApiResponse<PaginatedResponse<Investor>>> {
    return this.apiClient.list<Investor>('investors', { filters: filters as Record<string, unknown> });
  }

  /**
   * Create a new investor
   */
  async create(userId: string, input: CreateInvestorInput): Promise<ApiResponse<Investor>> {
    // Validation
    const validationError = this.validateCreateInput(input);
    if (validationError) {
      return { data: null, error: validationError };
    }

    // Determine country classification
    const countryClassification = this.getCountryClassification(input.countryOfResidence);

    // Create investor data
    const investorData = {
      ...input,
      userId,
      status: 'applied' as InvestorStatus,
      countryClassification,
      isAccreditedInvestor: false,
      kycStatus: 'not-submitted' as KYCVerificationStatus,
      isPoliticallyExposed: false,
      isRelatedToRegulator: false,
      hasSanctionsHit: false,
      requiresGovernmentApproval: requiresGovernmentApproval(input.countryOfResidence),
    };

    return this.apiClient.create<Investor>('investors', investorData);
  }

  /**
   * Update investor details
   */
  async update(id: string, input: UpdateInvestorInput): Promise<ApiResponse<Investor>> {
    return this.apiClient.update<Investor>('investors', id, input);
  }

  /**
   * Update investor status with state machine validation
   */
  async updateStatus(
    id: string, 
    newStatus: InvestorStatus, 
    updatedBy?: string
  ): Promise<ApiResponse<Investor>> {
    // Get current investor
    const investorResponse = await this.getById(id);
    if (investorResponse.error || !investorResponse.data) {
      return { data: null, error: investorResponse.error || { message: 'Investor not found', code: 'NOT_FOUND' } };
    }

    const currentInvestor = investorResponse.data;

    // Validate transition
    if (!isValidInvestorTransition(currentInvestor.status, newStatus)) {
      return {
        data: null,
        error: {
          message: `Invalid status transition from ${currentInvestor.status} to ${newStatus}`,
          code: 'INVALID_TRANSITION',
        },
      };
    }

    // Build update payload with status-specific fields
    const updatePayload: Partial<Investor> = { status: newStatus };

    if (newStatus === 'approved') {
      updatePayload.approvedAt = new Date().toISOString();
      if (updatedBy) {
        updatePayload.approvedBy = updatedBy;
      }
    }

    return this.apiClient.update<Investor>('investors', id, updatePayload);
  }

  /**
   * Reject an investor with reason
   */
  async rejectInvestor(
    id: string, 
    reason: string, 
    rejectedBy: string
  ): Promise<ApiResponse<Investor>> {
    // Get current investor
    const investorResponse = await this.getById(id);
    if (investorResponse.error || !investorResponse.data) {
      return { data: null, error: investorResponse.error || { message: 'Investor not found', code: 'NOT_FOUND' } };
    }

    const currentInvestor = investorResponse.data;

    // Can only reject from certain states
    if (!isValidInvestorTransition(currentInvestor.status, 'rejected')) {
      return {
        data: null,
        error: {
          message: `Cannot reject investor in ${currentInvestor.status} status`,
          code: 'INVALID_OPERATION',
        },
      };
    }

    const updatePayload: Partial<Investor> = {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy,
      rejectionReason: reason,
    };

    return this.apiClient.update<Investor>('investors', id, updatePayload);
  }

  /**
   * Submit KYC documents (transitions from kyc-pending to kyc-submitted)
   */
  async submitKYC(id: string): Promise<ApiResponse<Investor>> {
    const investorResponse = await this.getById(id);
    if (investorResponse.error || !investorResponse.data) {
      return { data: null, error: investorResponse.error || { message: 'Investor not found', code: 'NOT_FOUND' } };
    }

    const investor = investorResponse.data;

    if (investor.status !== 'kyc-pending') {
      return {
        data: null,
        error: {
          message: `Cannot submit KYC. Investor status is ${investor.status}, expected kyc-pending`,
          code: 'INVALID_OPERATION',
        },
      };
    }

    return this.apiClient.update<Investor>('investors', id, {
      status: 'kyc-submitted',
      kycStatus: 'submitted',
    });
  }

  /**
   * Verify KYC (transitions from kyc-submitted to kyc-verified)
   */
  async verifyKYC(id: string, verifiedBy: string): Promise<ApiResponse<Investor>> {
    const investorResponse = await this.getById(id);
    if (investorResponse.error || !investorResponse.data) {
      return { data: null, error: investorResponse.error || { message: 'Investor not found', code: 'NOT_FOUND' } };
    }

    const investor = investorResponse.data;

    if (investor.status !== 'kyc-submitted') {
      return {
        data: null,
        error: {
          message: `Cannot verify KYC. Investor status is ${investor.status}, expected kyc-submitted`,
          code: 'INVALID_OPERATION',
        },
      };
    }

    // Set KYC expiry to 2 years from now
    const kycExpiresAt = new Date();
    kycExpiresAt.setFullYear(kycExpiresAt.getFullYear() + 2);

    return this.apiClient.update<Investor>('investors', id, {
      status: 'kyc-verified',
      kycStatus: 'verified',
      kycVerifiedAt: new Date().toISOString(),
      kycExpiresAt: kycExpiresAt.toISOString(),
    });
  }

  /**
   * Verify accredited investor status
   */
  async verifyAccreditedStatus(
    id: string,
    category: AccreditedInvestorCategory,
    verifiedBy: string
  ): Promise<ApiResponse<Investor>> {
    const investorResponse = await this.getById(id);
    if (investorResponse.error || !investorResponse.data) {
      return { data: null, error: investorResponse.error || { message: 'Investor not found', code: 'NOT_FOUND' } };
    }

    // Set accredited status expiry to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    return this.apiClient.update<Investor>('investors', id, {
      isAccreditedInvestor: true,
      accreditedCategory: category,
      accreditedVerifiedAt: new Date().toISOString(),
      accreditedExpiresAt: expiresAt.toISOString(),
    });
  }

  /**
   * Get KYC documents for an investor
   */
  async getKYCDocuments(investorId: string): Promise<ApiResponse<PaginatedResponse<KYCDocument>>> {
    return this.apiClient.list<KYCDocument>('kyc_documents', { filters: { investorId } });
  }

  /**
   * Check if an investor is eligible to invest in a deal
   */
  async checkEligibilityForDeal(investorId: string): Promise<ApiResponse<EligibilityResult>> {
    const investorResponse = await this.getById(investorId);
    if (investorResponse.error || !investorResponse.data) {
      return { 
        data: null, 
        error: investorResponse.error || { message: 'Investor not found', code: 'NOT_FOUND' } 
      };
    }

    const investor = investorResponse.data;

    // Check if status allows investing
    if (!INVESTMENT_ELIGIBLE_STATUSES.includes(investor.status)) {
      let reason = '';
      switch (investor.status) {
        case 'applied':
        case 'under-review':
          reason = 'Application is under review';
          break;
        case 'kyc-pending':
        case 'kyc-submitted':
        case 'kyc-verified':
          reason = 'KYC verification is pending';
          break;
        case 'suspended':
          reason = 'Account is suspended';
          break;
        case 'rejected':
          reason = 'Application was rejected';
          break;
        default:
          reason = `Status ${investor.status} does not allow investing`;
      }

      return {
        data: {
          isEligible: false,
          reason,
        },
        error: null,
      };
    }

    // Check for government approval requirement
    if (investor.requiresGovernmentApproval) {
      return {
        data: {
          isEligible: true,
          requiresApproval: true,
          approvalType: 'government',
        },
        error: null,
      };
    }

    // Check if KYC is expired
    if (investor.kycExpiresAt && new Date(investor.kycExpiresAt) < new Date()) {
      return {
        data: {
          isEligible: false,
          reason: 'KYC has expired. Please renew your KYC.',
        },
        error: null,
      };
    }

    return {
      data: {
        isEligible: true,
      },
      error: null,
    };
  }

  /**
   * Validate create input
   */
  private validateCreateInput(input: CreateInvestorInput): ApiError | null {
    // Validate PAN format
    if (!PAN_REGEX.test(input.pan)) {
      return {
        message: 'Invalid PAN format. Expected format: ABCDE1234F',
        code: 'VALIDATION_ERROR',
      };
    }

    // Validate email format
    if (!EMAIL_REGEX.test(input.email)) {
      return {
        message: 'Invalid email format',
        code: 'VALIDATION_ERROR',
      };
    }

    // Validate legal name
    if (!input.legalName || input.legalName.trim().length < 2) {
      return {
        message: 'Legal name is required and must be at least 2 characters',
        code: 'VALIDATION_ERROR',
      };
    }

    // Validate phone
    if (!input.phone || input.phone.length < 10) {
      return {
        message: 'Valid phone number is required',
        code: 'VALIDATION_ERROR',
      };
    }

    return null;
  }

  /**
   * Get country classification for compliance
   */
  private getCountryClassification(countryCode: string): CountryClassification {
    if (requiresGovernmentApproval(countryCode)) {
      return 'bordering-country';
    }
    
    // TODO: Add FATF greylist and sanctioned country checks
    return 'non-restricted';
  }
}
