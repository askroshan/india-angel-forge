/**
 * Escrow & Virtual Account Types for India Angel Forum
 * 
 * Implementation follows best practices for Indian angel investing:
 * - Bank escrow accounts for investor fund collection
 * - Per-investor-per-deal virtual accounts for traceability
 * - Integration with major Indian banks (ICICI, HDFC, Yes Bank)
 * - RBI compliance for fund pooling and disbursement
 */

// Escrow account status
export type EscrowAccountStatus = 
  | 'pending-setup'     // Requested, waiting for bank setup
  | 'active'            // Ready to receive funds
  | 'suspended'         // Temporarily suspended
  | 'closed';           // Account closed

// Virtual account status
export type VirtualAccountStatus = 
  | 'active'            // Ready to receive payment
  | 'payment-received'  // Payment received, pending verification
  | 'verified'          // Payment verified
  | 'expired'           // VA expired (typically 7-14 days)
  | 'refunded'          // Amount refunded to investor
  | 'transferred';      // Funds transferred to company

// Payment status for tracking
export type PaymentStatus = 
  | 'pending'           // Awaiting payment
  | 'initiated'         // Payment initiated by investor
  | 'processing'        // Bank is processing
  | 'received'          // Payment received in escrow
  | 'verified'          // Payment amount verified
  | 'transferred'       // Transferred to company
  | 'refunded'          // Refunded to investor
  | 'failed';           // Payment failed

// Bank partner for escrow
export type BankPartner = 
  | 'icici'
  | 'hdfc'
  | 'yes-bank'
  | 'axis'
  | 'kotak'
  | 'rbl';

// Payment mode
export type PaymentMode = 
  | 'neft'              // NEFT transfer
  | 'rtgs'              // RTGS transfer (> 2L)
  | 'imps'              // IMPS transfer
  | 'upi'               // UPI payment
  | 'cheque'            // Cheque deposit
  | 'wire';             // International wire (for NRIs)

// Main escrow account (one per deal/SPV)
export interface EscrowAccount {
  id: string;
  
  // Link to deal
  dealId: string;
  spvId?: string;                    // If using SPV model
  
  // Bank details
  bankPartner: BankPartner;
  accountNumber: string;             // Actual escrow account number
  accountName: string;               // Account holder name
  ifscCode: string;
  branchName: string;
  
  // Status
  status: EscrowAccountStatus;
  
  // Balance tracking
  currentBalance: number;            // Current balance in account
  totalReceived: number;             // Lifetime received
  totalDisbursed: number;            // Lifetime disbursed
  
  // Compliance
  escrowAgreementId?: string;        // Reference to escrow agreement doc
  trusteeId?: string;                // Escrow trustee (if applicable)
  
  // Bank integration
  bankReferenceId?: string;          // Bank's reference for API integration
  webhookSecret?: string;            // Webhook verification secret
  
  // Timeline
  setupRequestedAt?: string;
  activatedAt?: string;
  closedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Virtual account (one per investor per deal)
export interface VirtualAccount {
  id: string;
  
  // Links
  escrowAccountId: string;           // Parent escrow account
  dealId: string;
  investorId: string;
  commitmentId: string;              // Link to deal commitment
  
  // VA details
  virtualAccountNumber: string;      // Unique VA number
  beneficiaryName: string;           // Display name for transfers
  ifscCode: string;                  // Same as escrow account
  
  // Expected payment
  expectedAmount: number;            // Amount expected from investor
  receivedAmount: number;            // Amount actually received
  
  // Status
  status: VirtualAccountStatus;
  
  // Payment tracking
  paymentReference?: string;         // UTR/Transaction reference
  paymentMode?: PaymentMode;
  paymentReceivedAt?: string;
  paymentVerifiedAt?: string;
  
  // Validity
  expiresAt: string;                 // VA expiry date
  
  // Bank integration
  bankVaId?: string;                 // Bank's VA reference
  
  createdAt: string;
  updatedAt: string;
}

// Payment transaction record
export interface PaymentTransaction {
  id: string;
  
  // Links
  virtualAccountId: string;
  escrowAccountId: string;
  investorId: string;
  dealId: string;
  
  // Transaction details
  amount: number;
  paymentMode: PaymentMode;
  status: PaymentStatus;
  
  // Bank references
  utrNumber?: string;                // Unique Transaction Reference
  bankReferenceNumber?: string;
  senderAccountNumber?: string;
  senderIfscCode?: string;
  senderBankName?: string;
  
  // Verification
  isAmountMatched: boolean;
  amountMismatchReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  
  // Timestamps
  initiatedAt?: string;
  receivedAt?: string;
  
  // For refunds
  refundReason?: string;
  refundedAt?: string;
  refundUtrNumber?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Fund disbursement record (from escrow to company)
export interface Disbursement {
  id: string;
  
  // Links
  escrowAccountId: string;
  dealId: string;
  
  // Disbursement details
  amount: number;
  
  // Destination
  beneficiaryName: string;
  beneficiaryAccountNumber: string;
  beneficiaryIfscCode: string;
  beneficiaryBankName: string;
  
  // Status
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed';
  
  // Approval
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  
  // Bank reference
  utrNumber?: string;
  bankReferenceNumber?: string;
  
  // For tranche-based disbursement
  trancheNumber?: number;
  trancheOf?: number;               // e.g., 2 of 3
  
  completedAt?: string;
  failureReason?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Refund record
export interface Refund {
  id: string;
  
  // Links
  paymentTransactionId: string;
  virtualAccountId: string;
  investorId: string;
  
  // Refund details
  amount: number;
  reason: RefundReason;
  reasonDetail?: string;
  
  // Status
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed';
  
  // Destination (investor's bank account)
  refundAccountNumber: string;
  refundIfscCode: string;
  refundAccountName: string;
  
  // Processing
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  
  // Bank reference
  utrNumber?: string;
  
  completedAt?: string;
  failureReason?: string;
  
  createdAt: string;
  updatedAt: string;
}

export type RefundReason = 
  | 'deal-cancelled'          // Deal was cancelled
  | 'over-subscription'       // Deal over-subscribed, excess returned
  | 'investor-withdrawal'     // Investor withdrew before closing
  | 'amount-mismatch'         // Amount received doesn't match commitment
  | 'compliance-issue'        // Compliance/KYC issue
  | 'other';

// Bank webhook payload for payment notification
export interface BankWebhookPayload {
  eventType: 'payment_received' | 'payment_failed' | 'va_expired';
  timestamp: string;
  
  // VA details
  virtualAccountNumber: string;
  
  // Payment details (for payment events)
  amount?: number;
  utrNumber?: string;
  paymentMode?: PaymentMode;
  senderDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountName: string;
  };
  
  // Bank signature for verification
  signature: string;
}

// DTOs for operations
export interface CreateEscrowAccountInput {
  dealId: string;
  spvId?: string;
  bankPartner: BankPartner;
}

export interface CreateVirtualAccountInput {
  escrowAccountId: string;
  dealId: string;
  investorId: string;
  commitmentId: string;
  expectedAmount: number;
  expiresAt?: string;               // Defaults to 14 days
}

export interface RecordPaymentInput {
  virtualAccountId: string;
  amount: number;
  paymentMode: PaymentMode;
  utrNumber?: string;
  senderAccountNumber?: string;
  senderIfscCode?: string;
}

export interface CreateDisbursementInput {
  escrowAccountId: string;
  dealId: string;
  amount: number;
  beneficiaryName: string;
  beneficiaryAccountNumber: string;
  beneficiaryIfscCode: string;
  beneficiaryBankName: string;
  trancheNumber?: number;
  trancheOf?: number;
}

export interface CreateRefundInput {
  paymentTransactionId: string;
  reason: RefundReason;
  reasonDetail?: string;
}

// State machines
export const VALID_VA_TRANSITIONS: Record<VirtualAccountStatus, VirtualAccountStatus[]> = {
  'active': ['payment-received', 'expired'],
  'payment-received': ['verified', 'refunded'],
  'verified': ['transferred', 'refunded'],
  'expired': [],
  'refunded': [],
  'transferred': [],
};

export function isValidVATransition(from: VirtualAccountStatus, to: VirtualAccountStatus): boolean {
  return VALID_VA_TRANSITIONS[from]?.includes(to) ?? false;
}

// Default VA validity period (14 days)
export const DEFAULT_VA_VALIDITY_DAYS = 14;

// Generate VA expiry date
export function generateVAExpiryDate(validityDays: number = DEFAULT_VA_VALIDITY_DAYS): string {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + validityDays);
  return expiryDate.toISOString();
}
