/**
 * Deal Entity Types for India Angel Forum
 * Supports three operating models:
 * 1. Direct Angels - Direct investment by individual angels
 * 2. Syndicate/SPV - Co-investment via Special Purpose Vehicle
 * 3. AIF - Investment via Category I Alternative Investment Fund
 */

// Deal lifecycle states as per Section 18 of gaps.md
export type DealStatus = 
  | 'draft'      // Initial creation, not visible to investors
  | 'live'       // Open for commitments
  | 'closing'    // Soft close, final commitments being collected
  | 'closed'     // Commitments finalized, awaiting fund transfer
  | 'funded'     // Funds transferred to company
  | 'exited'     // Exit event occurred (acquisition, IPO, etc.)
  | 'cancelled'; // Deal cancelled before funding

// Investment vehicle types
export type InvestmentVehicle = 
  | 'direct'     // Direct cap table entry
  | 'spv'        // Special Purpose Vehicle (LLP/Private Ltd)
  | 'aif';       // Alternative Investment Fund (Cat I)

// Sector classification for SEBI reporting
export type SectorClassification = 
  | 'technology'
  | 'healthcare'
  | 'fintech'
  | 'consumer'
  | 'cleantech'
  | 'education'
  | 'agritech'
  | 'manufacturing'
  | 'other';

// Stage classification
export type InvestmentStage = 
  | 'pre-seed'
  | 'seed'
  | 'series-a'
  | 'series-b'
  | 'bridge';

// Instrument types as per Companies Act Section 42
export type InstrumentType = 
  | 'equity'                    // Plain equity shares
  | 'ccps'                      // Compulsorily Convertible Preference Shares
  | 'ccd'                       // Compulsorily Convertible Debentures
  | 'safe'                      // Simple Agreement for Future Equity
  | 'convertible-note';         // Convertible Note

// Deal document types
export type DealDocumentType = 
  | 'pitch-deck'
  | 'financials'
  | 'term-sheet'
  | 'sha'                       // Shareholders Agreement
  | 'ssa'                       // Share Subscription Agreement
  | 'due-diligence'
  | 'company-charter'
  | 'other';

// Company type for FDI/FEMA compliance
export type CompanyType = 
  | 'indian-private'            // Indian Private Limited
  | 'indian-llp'                // Indian LLP
  | 'foreign-subsidiary';       // Foreign subsidiary in India

// Deal entity
export interface Deal {
  id: string;
  
  // Basic info
  name: string;
  companyName: string;
  companyDescription: string;
  companyType: CompanyType;
  sector: SectorClassification;
  stage: InvestmentStage;
  
  // Investment terms
  instrumentType: InstrumentType;
  investmentVehicle: InvestmentVehicle;
  targetAmount: number;           // In INR
  minCommitment: number;          // Minimum per investor
  maxCommitment?: number;         // Maximum per investor (optional)
  valuation: number;              // Pre-money valuation in INR
  valuationCap?: number;          // For SAFE/CN
  discountRate?: number;          // For SAFE/CN (percentage)
  
  // Timeline
  status: DealStatus;
  publishedAt?: string;           // ISO date
  closingDate?: string;           // Target close date
  actualCloseDate?: string;       // Actual close date
  fundedDate?: string;            // Date funds transferred
  exitDate?: string;              // Exit event date
  
  // Metrics (updated as commitments come in)
  totalCommitted: number;         // Total committed amount
  totalFunded: number;            // Total funded amount
  investorCount: number;          // Number of committed investors
  
  // Compliance flags
  requiresRbiApproval: boolean;   // For FDI in restricted sectors
  isAngelTaxExempt: boolean;      // Section 56(2)(viib) exemption
  isPressNote3Compliant: boolean; // For investments from bordering countries
  
  // Relations
  leadInvestorId?: string;        // Lead investor user ID
  spvId?: string;                 // SPV entity ID if applicable
  aifSchemeId?: string;           // AIF scheme ID if applicable
  
  // Audit fields
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Deal commitment by an investor
export interface DealCommitment {
  id: string;
  dealId: string;
  investorId: string;
  
  // Commitment details
  amount: number;                 // Committed amount in INR
  status: CommitmentStatus;
  
  // Payment tracking
  escrowVirtualAccountId?: string;
  amountReceived: number;
  paymentReceivedAt?: string;
  
  // Document signing
  shaSignedAt?: string;
  ssaSignedAt?: string;
  
  // For SPV/AIF
  unitsAllocated?: number;
  certificateNumber?: string;
  
  // Audit
  createdAt: string;
  updatedAt: string;
}

export type CommitmentStatus = 
  | 'pending'           // Interest expressed, not yet confirmed
  | 'committed'         // Commitment confirmed
  | 'documents-pending' // Awaiting document signing
  | 'payment-pending'   // Awaiting payment
  | 'payment-received'  // Payment received in escrow
  | 'funded'            // Funds deployed to company
  | 'cancelled';        // Commitment cancelled

// Deal document
export interface DealDocument {
  id: string;
  dealId: string;
  type: DealDocumentType;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  isConfidential: boolean;
  
  // Access control
  visibleToInvestorRoles: string[]; // Which investor roles can see this
  
  createdBy: string;
  createdAt: string;
}

// SPV entity (for Syndicate model)
export interface SPV {
  id: string;
  dealId: string;
  
  // Entity details
  name: string;
  entityType: 'llp' | 'private-limited';
  cin?: string;                   // Corporate Identification Number
  llpin?: string;                 // LLP Identification Number
  pan: string;
  gst?: string;
  
  // Registered address
  registeredAddress: string;
  
  // Designated Partners (for LLP) or Directors
  partners: SPVPartner[];
  
  // Bank account for fund collection
  bankAccountId: string;
  
  // Compliance
  incorporatedAt: string;
  annualReturnFiledAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface SPVPartner {
  id: string;
  spvId: string;
  userId: string;
  role: 'designated-partner' | 'partner' | 'director';
  designation?: string;
  dpin?: string;                  // Designated Partner Identification Number
  din?: string;                   // Director Identification Number
  contributionPercentage: number;
}

// AIF Scheme (for AIF model)
export interface AIFScheme {
  id: string;
  
  // AIF registration
  aifName: string;
  sebiRegistrationNumber: string;
  category: 'I';                  // We only support Category I Angel Funds
  subCategory: 'angel-fund';
  
  // Scheme details
  schemeName: string;
  schemeCode: string;
  corpusTarget: number;           // Target corpus
  corpusRaised: number;           // Current corpus
  
  // Investment limits as per SEBI AIF regulations
  minInvestorCommitment: number;  // Min 25L as per regulations
  maxInvestors: number;           // Max 49 per scheme
  
  // Compliance
  trustee: string;
  custodian: string;
  auditor: string;
  
  createdAt: string;
  updatedAt: string;
}

// Create/Update DTOs
export interface CreateDealInput {
  name: string;
  companyName: string;
  companyDescription: string;
  companyType: CompanyType;
  sector: SectorClassification;
  stage: InvestmentStage;
  instrumentType: InstrumentType;
  investmentVehicle: InvestmentVehicle;
  targetAmount: number;
  minCommitment: number;
  maxCommitment?: number;
  valuation: number;
  valuationCap?: number;
  discountRate?: number;
  closingDate?: string;
}

export interface UpdateDealInput {
  name?: string;
  companyDescription?: string;
  targetAmount?: number;
  minCommitment?: number;
  maxCommitment?: number;
  closingDate?: string;
  status?: DealStatus;
}

export interface CreateCommitmentInput {
  dealId: string;
  amount: number;
}

// State machine for deal status transitions
export const VALID_DEAL_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  'draft': ['live', 'cancelled'],
  'live': ['closing', 'cancelled'],
  'closing': ['closed', 'live', 'cancelled'],
  'closed': ['funded', 'live'],
  'funded': ['exited'],
  'exited': [],
  'cancelled': [],
};

// Validate deal status transition
export function isValidDealTransition(from: DealStatus, to: DealStatus): boolean {
  return VALID_DEAL_TRANSITIONS[from]?.includes(to) ?? false;
}
