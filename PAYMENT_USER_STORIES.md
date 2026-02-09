# Payment Integration User Stories

## Epic: Multi-Gateway Payment System for Indian and International Investors

---

## US-PAYMENT-001: Create Payment Order (Razorpay - Domestic)
**As a** domestic Indian investor  
**I want to** initiate a payment using Razorpay  
**So that** I can invest in deals using Indian payment methods (UPI, cards, net banking)

### Acceptance Criteria
- [ ] User must be authenticated
- [ ] Payment amount must be between ₹25,000 and ₹10,000,000
- [ ] System creates Razorpay order and returns order ID
- [ ] Payment details are stored in database with PENDING status
- [ ] User receives order details including key, amount, currency
- [ ] Invalid amounts are rejected with appropriate error messages
- [ ] Payment type must be specified (DEAL_COMMITMENT, MEMBERSHIP_FEE, etc.)

### Test Cases
1. Authenticated user creates valid payment order
2. Order is saved to database with correct details
3. Razorpay order ID is generated and returned
4. Amount below minimum is rejected
5. Amount above maximum is rejected
6. Unauthenticated user is rejected with 401

---

## US-PAYMENT-002: Verify Payment Completion (Razorpay)
**As a** system  
**I want to** verify Razorpay payment signatures  
**So that** I can confirm legitimate payment completion

### Acceptance Criteria
- [ ] Payment signature is cryptographically verified
- [ ] Verified payments update status to COMPLETED
- [ ] Failed verification keeps status as PENDING
- [ ] completedAt timestamp is set on success
- [ ] Invalid signatures are rejected
- [ ] Audit log entry is created for verification attempt

### Test Cases
1. Valid signature verification succeeds
2. Invalid signature verification fails
3. Payment status updates to COMPLETED on success
4. completedAt timestamp is set correctly
5. Audit log entry is created

---

## US-PAYMENT-003: Create Payment Order (Stripe - International)
**As an** NRI investor or international investor  
**I want to** initiate a payment using Stripe  
**So that** I can invest using international payment methods

### Acceptance Criteria
- [ ] User must be authenticated
- [ ] Payment amount validation in USD/other currencies
- [ ] System creates Stripe PaymentIntent
- [ ] Client secret is returned for frontend
- [ ] Payment stored with PENDING status
- [ ] Currency conversion is handled correctly

### Test Cases
1. International user creates Stripe payment order
2. PaymentIntent is created with Stripe
3. Client secret is returned securely
4. Payment saved with correct currency
5. Amount validation works for international currency

---

## US-PAYMENT-004: View Payment History
**As an** investor  
**I want to** view my payment history  
**So that** I can track my investments and transactions

### Acceptance Criteria
- [ ] User can only see their own payments
- [ ] Payments are sorted by date (newest first)
- [ ] Payment status is clearly displayed
- [ ] Gateway and amount information is shown
- [ ] Pagination is supported for large lists
- [ ] Filters available (status, date range, gateway)

### Test Cases
1. User retrieves their own payment history
2. User cannot view other users' payments
3. Payments are sorted correctly
4. All payment details are included
5. Empty list returned for user with no payments

---

## US-PAYMENT-005: Process Refund
**As an** admin or authorized user  
**I want to** process refunds for payments  
**So that** I can handle cancellations and disputes

### Acceptance Criteria
- [ ] Only admin or payment owner can request refund
- [ ] Refund reason must be provided
- [ ] Partial refunds are supported
- [ ] Refund is processed through original gateway
- [ ] Payment status updates to REFUNDED
- [ ] refundedAt timestamp is set
- [ ] Audit log entry is created

### Test Cases
1. Admin successfully processes full refund
2. User refunds their own payment
3. User cannot refund other users' payments
4. Partial refund is processed correctly
5. Refund reason is stored
6. Audit log entry is created

---

## US-PAYMENT-006: Save Payment Method
**As an** investor  
**I want to** save my payment methods securely  
**So that** I can make future payments quickly

### Acceptance Criteria
- [ ] Card details are tokenized (never stored directly)
- [ ] Last 4 digits displayed for identification
- [ ] Card brand (Visa, Mastercard) is shown
- [ ] Payment method can be set as default
- [ ] User can have multiple payment methods
- [ ] Sensitive data is encrypted
- [ ] Expired cards cannot be used

### Test Cases
1. User saves card with tokenization
2. Last 4 digits are stored correctly
3. Full card number is never stored
4. User can set default payment method
5. Encrypted token is created
6. Multiple payment methods per user

---

## US-PAYMENT-007: Webhook Processing (Razorpay)
**As a** system  
**I want to** process Razorpay webhooks  
**So that** I can update payment status automatically

### Acceptance Criteria
- [ ] Webhook signature is verified
- [ ] Payment status is updated based on event
- [ ] Duplicate webhooks are handled gracefully
- [ ] Failed webhooks are retried
- [ ] All webhook events are logged
- [ ] Invalid signatures are rejected

### Test Cases
1. Valid webhook updates payment status
2. Webhook signature is verified correctly
3. Invalid signature webhook is rejected
4. Duplicate webhook is handled (idempotent)
5. Webhook event is logged

---

## US-PAYMENT-008: Webhook Processing (Stripe)
**As a** system  
**I want to** process Stripe webhooks  
**So that** I can update international payment status

### Acceptance Criteria
- [ ] Webhook signature is verified using Stripe library
- [ ] payment_intent.succeeded updates status
- [ ] payment_intent.payment_failed is handled
- [ ] Charge disputes are logged
- [ ] All events stored in PaymentWebhook table

### Test Cases
1. Valid Stripe webhook processed
2. payment_intent.succeeded updates status
3. Invalid signature rejected
4. Duplicate events handled
5. Unknown events are logged

---

## US-PAYMENT-009: Payment Security - Encryption
**As a** security officer  
**I want** sensitive payment data encrypted  
**So that** we comply with PCI DSS and protect user data

### Acceptance Criteria
- [ ] Payment tokens encrypted with AES-256-GCM
- [ ] Card details never stored in plain text
- [ ] Encryption keys stored securely in env
- [ ] Decryption only happens when needed
- [ ] Sensitive data masked in logs
- [ ] IP addresses logged for fraud detection

### Test Cases
1. Payment token is encrypted before storage
2. Encrypted data can be decrypted correctly
3. Card details are masked in responses
4. Logs don't contain sensitive data
5. IP address is captured and stored

---

## US-PAYMENT-010: Payment Limits and Validation
**As a** compliance officer  
**I want** payment amount limits enforced  
**So that** we comply with regulations

### Acceptance Criteria
- [ ] Minimum investment: ₹25,000
- [ ] Maximum investment: ₹10,000,000
- [ ] Limits configurable via environment
- [ ] Clear error messages for violations
- [ ] Different limits for different payment types
- [ ] NRI limits may differ from domestic

### Test Cases
1. Payment below minimum rejected
2. Payment above maximum rejected
3. Valid amount accepted
4. Error messages are clear
5. Limits enforced for all gateways

---

## US-PAYMENT-011: Rate Limiting
**As a** security officer  
**I want** rate limits on payment endpoints  
**So that** we prevent abuse and fraud

### Acceptance Criteria
- [ ] Max 10 payment creation attempts per 15 minutes
- [ ] Max 5 verification attempts per minute
- [ ] Rate limit by IP and user ID
- [ ] Clear error when limit exceeded
- [ ] Rate limit bypass for admin (testing)

### Test Cases
1. 11th payment creation in 15min is blocked
2. 6th verification in 1min is blocked
3. Rate limit resets after window
4. Different users have separate limits
5. Error response includes retry-after header

---

## US-PAYMENT-012: Tax Information (PAN/GST)
**As an** Indian investor  
**I want to** provide my tax information  
**So that** TDS can be properly calculated

### Acceptance Criteria
- [ ] PAN number validation (format: ABCDE1234F)
- [ ] GST number optional (format: 22AAAAA0000A1Z5)
- [ ] TAN for TDS deduction
- [ ] Data encrypted at rest
- [ ] Verification with government APIs (future)

### Test Cases
1. Valid PAN is accepted and stored
2. Invalid PAN format rejected
3. GST number validated
4. Tax info encrypted in database
5. User can update tax information

---

## US-PAYMENT-013: NRI Tax Compliance
**As an** NRI investor  
**I want to** provide Form 15CA/15CB details  
**So that** I comply with Indian tax regulations

### Acceptance Criteria
- [ ] NRI flag set based on tax country
- [ ] Form 15CA/15CB document upload
- [ ] TDS certificate storage
- [ ] Different tax treatment for NRI
- [ ] Country-specific validation

### Test Cases
1. NRI user marked correctly
2. Form 15CA upload succeeds
3. TDS certificate stored securely
4. Tax calculations differ for NRI
5. NRI status affects payment flow

---

## US-PAYMENT-014: Payment Audit Trail
**As an** auditor  
**I want** complete audit trail of all payments  
**So that** I can track financial transactions

### Acceptance Criteria
- [ ] Every payment action logged to AuditLog
- [ ] Logs include: user, action, timestamp, IP
- [ ] Immutable audit records
- [ ] Query interface for audit logs
- [ ] Retention policy enforced
- [ ] Sensitive data redacted in logs

### Test Cases
1. Payment creation logged to audit
2. Payment verification logged
3. Refund logged with details
4. IP address captured correctly
5. Logs are immutable (no updates)

---

## US-PAYMENT-015: Multiple Payment Gateways Selection
**As an** investor  
**I want to** choose from multiple payment gateways  
**So that** I can use my preferred payment method

### Acceptance Criteria
- [ ] User can select gateway at checkout
- [ ] Razorpay shown for domestic users
- [ ] Stripe shown for international/NRI
- [ ] PayU, Paytm, etc. available as alternatives
- [ ] Gateway availability based on user location
- [ ] Clear indication of supported payment methods

### Test Cases
1. Domestic user sees Razorpay option
2. NRI user sees Stripe option
3. User can manually select gateway
4. Unsupported gateway returns error
5. Gateway recommendation works

---

## Traceability Matrix

| User Story | Test File | Test Count | API Endpoints | Database Models |
|------------|-----------|------------|---------------|-----------------|
| US-PAYMENT-001 | payment-razorpay.spec.ts | 6 | POST /api/payments/create-order | Payment |
| US-PAYMENT-002 | payment-razorpay.spec.ts | 5 | POST /api/payments/verify | Payment, AuditLog |
| US-PAYMENT-003 | payment-stripe.spec.ts | 5 | POST /api/payments/create-order | Payment |
| US-PAYMENT-004 | payment-history.spec.ts | 5 | GET /api/payments/history | Payment |
| US-PAYMENT-005 | payment-refund.spec.ts | 6 | POST /api/payments/refund | Payment, PaymentRefund, AuditLog |
| US-PAYMENT-006 | payment-methods.spec.ts | 6 | POST /api/payments/methods | PaymentMethod |
| US-PAYMENT-007 | payment-webhooks.spec.ts | 5 | POST /api/webhooks/razorpay | PaymentWebhook, Payment |
| US-PAYMENT-008 | payment-webhooks.spec.ts | 5 | POST /api/webhooks/stripe | PaymentWebhook, Payment |
| US-PAYMENT-009 | encryption.test.ts | 5 | N/A (utility) | Payment, PaymentMethod |
| US-PAYMENT-010 | payment-validation.test.ts | 5 | POST /api/payments/create-order | Payment |
| US-PAYMENT-011 | rate-limiting.spec.ts | 5 | All payment endpoints | N/A (middleware) |
| US-PAYMENT-012 | tax-information.spec.ts | 5 | POST /api/users/tax-info | TaxInformation |
| US-PAYMENT-013 | nri-compliance.spec.ts | 5 | POST /api/users/tax-info | TaxInformation |
| US-PAYMENT-014 | payment-audit.spec.ts | 5 | GET /api/audit/payments | AuditLog |
| US-PAYMENT-015 | payment-gateway-selection.spec.ts | 5 | GET /api/payments/gateways | N/A |

**Total User Stories:** 15  
**Total Tests:** 77  
**Total API Endpoints:** 10  
**Total Database Models:** 6

---

## Definition of Done

For each user story to be considered complete:
1. ✅ User story written with clear acceptance criteria
2. ✅ Tests written first (RED phase)
3. ✅ Tests failing with expected errors
4. ✅ Implementation code written (GREEN phase)
5. ✅ All tests passing
6. ✅ Code refactored for quality (REFACTOR phase)
7. ✅ Tests still passing after refactor
8. ✅ Code reviewed for security
9. ✅ Documentation updated
10. ✅ Traceability confirmed (story → test → code)
