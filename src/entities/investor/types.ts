/**
 * Investor & KYC Types for India Angel Forum
 * 
 * Compliance frameworks covered:
 * - SEBI Accredited Investor Framework (2021)
 * - KYC/AML as per PML Act and SEBI guidelines
 * - FEMA regulations for NRI/Foreign investors
 * - Press Note 3 (2020) for investments from bordering countries
 * - DPDP Act 2023 for data protection
 */

// Investor application states
export type InvestorStatus = 
  | 'applied'           // Initial application submitted
  | 'under-review'      // Admin reviewing application
  | 'kyc-pending'       // Approved but KYC not complete
  | 'kyc-submitted'     // KYC documents submitted
  | 'kyc-verified'      // KYC verified, pending final approval
  | 'approved'          // Fully approved investor
  | 'active'            // Active with at least one investment
  | 'suspended'         // Temporarily suspended
  | 'rejected';         // Application rejected

// Investor types
export type InvestorType = 
  | 'individual'        // Individual investor
  | 'huf'               // Hindu Undivided Family
  | 'partnership'       // Partnership firm
  | 'llp'               // Limited Liability Partnership
  | 'company'           // Company (private/public)
  | 'trust'             // Trust (family office)
  | 'aif'               // Alternative Investment Fund
  | 'fpi';              // Foreign Portfolio Investor

// Residency classification for FEMA compliance
export type ResidencyStatus = 
  | 'resident-indian'   // Indian resident (RBI classification)
  | 'nri'               // Non-Resident Indian
  | 'oci'               // Overseas Citizen of India
  | 'foreign-national'  // Foreign national (non-Indian origin)
  | 'foreign-entity';   // Foreign company/entity

// Country classification for Press Note 3 compliance
export type CountryClassification = 
  | 'non-restricted'    // No FDI restrictions
  | 'bordering-country' // Requires government approval (China, Pakistan, etc.)
  | 'fatf-greylist'     // FATF greylist - enhanced due diligence
  | 'sanctioned';       // OFAC/UN sanctioned - prohibited

// Accredited Investor categories as per SEBI framework
export type AccreditedInvestorCategory = 
  | 'individual-income'       // Income > 2 Cr/year for last 3 years
  | 'individual-networth'     // Net worth > 7.5 Cr (excluding primary residence)
  | 'individual-combined'     // Income > 1 Cr + Net worth > 5 Cr
  | 'family-trust'            // Family trust with net worth > 7.5 Cr
  | 'body-corporate'          // Net worth > 50 Cr
  | 'partnership-llp'         // Each partner qualifies individually
  | 'not-accredited';         // Does not qualify

// KYC verification status
export type KYCVerificationStatus = 
  | 'not-submitted'
  | 'submitted'
  | 'under-review'
  | 'verified'
  | 'rejected'
  | 'expired';          // KYC needs renewal (typically 2 years)

// KYC document types
export type KYCDocumentType = 
  // Identity documents
  | 'pan'               // PAN card (mandatory for all)
  | 'aadhaar'           // Aadhaar (optional, for resident Indians)
  | 'passport'          // Passport (mandatory for NRIs/foreigners)
  | 'voter-id'          // Voter ID
  | 'driving-license'   // Driving license
  
  // Address proof
  | 'address-proof'     // Utility bill, bank statement, etc.
  | 'foreign-address'   // Address proof for overseas address
  
  // Financial documents
  | 'bank-statement'    // Bank statements (6 months)
  | 'demat-statement'   // Demat account statement
  | 'itr'               // Income Tax Returns
  | 'ca-certificate'    // CA certificate for net worth
  | 'financial-statement' // Audited financials (for entities)
  
  // Entity documents
  | 'incorporation-cert' // Certificate of incorporation
  | 'moa-aoa'           // Memorandum & Articles of Association
  | 'board-resolution'  // Board resolution for investment
  | 'partnership-deed'  // Partnership deed
  | 'trust-deed'        // Trust deed
  | 'registration-cert' // SEBI/RBI registration (for FPIs, AIFs)
  
  // NRI/Foreign specific
  | 'pio-oci-card'      // PIO/OCI card
  | 'work-permit'       // Work permit / visa
  | 'tax-residency-cert' // Tax residency certificate
  | 'fatca-form'        // FATCA/CRS self-certification
  | 'fema-declaration'  // FEMA compliance declaration
  
  // Risk acknowledgment
  | 'risk-acknowledgment' // Signed risk acknowledgment form
  | 'accredited-declaration' // Self-declaration for accredited status
  
  // Other
  | 'other';

// Risk profile for investor suitability
export type RiskProfile = 
  | 'conservative'
  | 'moderate'
  | 'aggressive'
  | 'very-aggressive';

// Main Investor entity
export interface Investor {
  id: string;
  userId: string;                     // Link to auth user
  
  // Basic info
  investorType: InvestorType;
  status: InvestorStatus;
  
  // Personal/Entity details
  legalName: string;                  // Full legal name
  displayName?: string;               // Display name (for anonymity)
  dateOfBirth?: string;               // For individuals
  dateOfIncorporation?: string;       // For entities
  
  // Contact
  email: string;
  phone: string;
  alternatePhone?: string;
  
  // Tax identifiers
  pan: string;                        // PAN is mandatory for all
  gstin?: string;                     // For entities
  cin?: string;                       // Company identification number
  llpin?: string;                     // LLP identification number
  din?: string;                       // Director identification number
  
  // Residency & Nationality
  residencyStatus: ResidencyStatus;
  nationality: string;                // ISO country code
  countryOfResidence: string;         // ISO country code
  countryClassification: CountryClassification;
  
  // Accredited Investor status
  isAccreditedInvestor: boolean;
  accreditedCategory?: AccreditedInvestorCategory;
  accreditedVerifiedAt?: string;
  accreditedExpiresAt?: string;       // Typically 1 year
  
  // KYC status
  kycStatus: KYCVerificationStatus;
  kycVerifiedAt?: string;
  kycExpiresAt?: string;              // Typically 2 years
  kycRiskRating?: 'low' | 'medium' | 'high';
  
  // Bank account for refunds/exits
  primaryBankAccountId?: string;
  
  // Investment preferences
  riskProfile?: RiskProfile;
  preferredSectors?: string[];
  preferredStages?: string[];
  minTicketSize?: number;
  maxTicketSize?: number;
  
  // Compliance flags
  isPoliticallyExposed: boolean;      // PEP check
  isRelatedToRegulator: boolean;      // Related to SEBI/RBI staff
  hasSanctionsHit: boolean;           // Sanctions screening
  requiresGovernmentApproval: boolean; // For Press Note 3 countries
  
  // NRI specific
  nreAccountNumber?: string;
  nroAccountNumber?: string;
  
  // Consent & Legal
  termsAcceptedAt?: string;
  privacyPolicyAcceptedAt?: string;
  riskDisclosureAcceptedAt?: string;
  
  // Audit
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

// KYC Document
export interface KYCDocument {
  id: string;
  investorId: string;
  
  documentType: KYCDocumentType;
  documentNumber?: string;           // PAN number, passport number, etc.
  
  // File info
  fileName: string;
  fileUrl: string;                   // Stored encrypted
  fileSize: number;
  mimeType: string;
  
  // Verification
  status: KYCVerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  
  // Validity
  issuedAt?: string;
  expiresAt?: string;
  
  // Metadata
  extractedData?: Record<string, unknown>;  // OCR/AI extracted data
  
  createdAt: string;
  updatedAt: string;
}

// Accredited Investor verification record
export interface AccreditedVerification {
  id: string;
  investorId: string;
  
  category: AccreditedInvestorCategory;
  
  // For income-based
  declaredIncome?: number;           // Annual income in INR
  incomeYear1?: number;
  incomeYear2?: number;
  incomeYear3?: number;
  
  // For networth-based
  declaredNetWorth?: number;         // Net worth in INR
  primaryResidenceValue?: number;    // Excluded from calculation
  
  // Supporting documents
  supportingDocumentIds: string[];
  
  // Verification
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  verifiedAt?: string;
  verifiedBy?: string;
  expiresAt?: string;               // Typically 1 year
  
  // CA certificate details (if provided)
  caCertificateNumber?: string;
  caName?: string;
  caRegistrationNumber?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Bank account for investor
export interface InvestorBankAccount {
  id: string;
  investorId: string;
  
  // Account details
  accountHolderName: string;
  accountNumber: string;             // Encrypted
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: 'savings' | 'current' | 'nre' | 'nro';
  
  // Verification
  isVerified: boolean;
  verifiedAt?: string;
  verificationMethod?: 'penny-drop' | 'cancelled-cheque' | 'bank-statement';
  
  // For NRE/NRO accounts
  nriAccountType?: 'nre' | 'nro' | 'fcnr';
  
  isPrimary: boolean;
  
  createdAt: string;
  updatedAt: string;
}

// Address entity
export interface InvestorAddress {
  id: string;
  investorId: string;
  
  type: 'registered' | 'correspondence' | 'overseas';
  
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;                   // ISO country code
  
  isVerified: boolean;
  
  createdAt: string;
  updatedAt: string;
}

// Nominee details
export interface InvestorNominee {
  id: string;
  investorId: string;
  
  name: string;
  relationship: string;
  dateOfBirth?: string;
  sharePercentage: number;           // 0-100
  
  // Contact
  email?: string;
  phone?: string;
  address?: string;
  
  // Identification
  pan?: string;
  
  // Guardian (if nominee is minor)
  guardianName?: string;
  guardianRelationship?: string;
  guardianAddress?: string;
  
  createdAt: string;
  updatedAt: string;
}

// DTOs for create/update
export interface CreateInvestorInput {
  investorType: InvestorType;
  legalName: string;
  email: string;
  phone: string;
  pan: string;
  residencyStatus: ResidencyStatus;
  nationality: string;
  countryOfResidence: string;
  dateOfBirth?: string;
  dateOfIncorporation?: string;
}

export interface UpdateInvestorInput {
  displayName?: string;
  phone?: string;
  alternatePhone?: string;
  riskProfile?: RiskProfile;
  preferredSectors?: string[];
  preferredStages?: string[];
  minTicketSize?: number;
  maxTicketSize?: number;
}

export interface SubmitKYCInput {
  documents: {
    type: KYCDocumentType;
    documentNumber?: string;
    file: File;
    expiresAt?: string;
  }[];
  addresses: Omit<InvestorAddress, 'id' | 'investorId' | 'isVerified' | 'createdAt' | 'updatedAt'>[];
  nominees?: Omit<InvestorNominee, 'id' | 'investorId' | 'createdAt' | 'updatedAt'>[];
  isPoliticallyExposed: boolean;
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  riskDisclosureAccepted: boolean;
}

// State machine for investor status transitions
export const VALID_INVESTOR_TRANSITIONS: Record<InvestorStatus, InvestorStatus[]> = {
  'applied': ['under-review', 'rejected'],
  'under-review': ['kyc-pending', 'rejected'],
  'kyc-pending': ['kyc-submitted'],
  'kyc-submitted': ['kyc-verified', 'kyc-pending'], // Back to pending if docs rejected
  'kyc-verified': ['approved', 'kyc-pending'],
  'approved': ['active', 'suspended'],
  'active': ['suspended'],
  'suspended': ['active', 'approved'],
  'rejected': [], // Terminal state
};

// Validate investor status transition
export function isValidInvestorTransition(from: InvestorStatus, to: InvestorStatus): boolean {
  return VALID_INVESTOR_TRANSITIONS[from]?.includes(to) ?? false;
}

// List of bordering countries (Press Note 3)
export const BORDERING_COUNTRIES = [
  'CN', // China
  'PK', // Pakistan
  'BD', // Bangladesh
  'MM', // Myanmar
  'NP', // Nepal
  'BT', // Bhutan
  'AF', // Afghanistan
];

// Check if country requires government approval
export function requiresGovernmentApproval(countryCode: string): boolean {
  return BORDERING_COUNTRIES.includes(countryCode.toUpperCase());
}

// Accredited investor minimum thresholds (as per SEBI framework)
export const ACCREDITED_THRESHOLDS = {
  individual: {
    income: 20000000,           // 2 Cr annual income for 3 years
    netWorth: 75000000,         // 7.5 Cr net worth
    combinedIncome: 10000000,   // 1 Cr income (combined criteria)
    combinedNetWorth: 50000000, // 5 Cr net worth (combined criteria)
  },
  familyTrust: {
    netWorth: 75000000,         // 7.5 Cr net worth
  },
  bodyCorporate: {
    netWorth: 500000000,        // 50 Cr net worth
  },
};
