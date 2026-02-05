# Payment Integration Guide

## Overview

India Angel Forum platform supports multiple payment gateways for domestic Indian investors and international NRI investors, with enterprise-grade security and OWASP Top 25 compliance.

## Supported Payment Gateways

### Indian Payments
1. **Razorpay** (Primary - Recommended)
   - Credit/Debit Cards
   - Net Banking
   - UPI (PhonePe, Google Pay, Paytm)
   - Wallets
   - International Cards

2. **PayU** (Alternative)
   - All major Indian payment methods
   - EMI options

3. **Paytm** (Digital Wallet)
   - Paytm Wallet
   - UPI
   - Cards

4. **CCAvenue** (Enterprise)
   - 200+ payment options
   - Multi-currency support

5. **Instamojo** (Easy Integration)
   - Quick merchant onboarding
   - All Indian payment methods

### International/NRI Payments
1. **Stripe** (Primary for International)
   - International credit/debit cards
   - Apple Pay, Google Pay
   - Bank transfers (ACH, SEPA)
   - Multi-currency support

2. **PayPal** (Alternative)
   - PayPal balance
   - Cards
   - Bank accounts

## Setup Instructions

### 1. Install Dependencies

```bash
npm install razorpay stripe helmet express-rate-limit
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Get Payment Gateway Credentials

#### Razorpay
1. Sign up at [https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup)
2. Generate API keys from Settings > API Keys
3. Set up webhook: Settings > Webhooks
4. Add to `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

#### Stripe
1. Sign up at [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Get API keys from Developers > API keys
3. Set up webhook: Developers > Webhooks
4. Add to `.env`:
   ```
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx
   ```

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name add_payment_models
npx prisma generate
```

### 5. Start Servers

```bash
# Backend
npx tsx server.ts

# Frontend
npm run dev
```

## Security Features

### OWASP Top 25 Compliance

✅ **A01: Broken Access Control**
- Role-based access control for payment operations
- User can only view their own payment history
- Admin approval required for refunds

✅ **A02: Cryptographic Failures**
- AES-256-GCM encryption for sensitive payment data
- No card details stored (tokenization)
- Encrypted payment tokens
- TLS/HTTPS enforced

✅ **A03: Injection**
- Prisma ORM prevents SQL injection
- All inputs validated and sanitized
- Parameterized queries only

✅ **A04: Insecure Design**
- Payment flow designed with security first
- Multiple verification layers
- Transaction atomicity guaranteed

✅ **A05: Security Misconfiguration**
- Helmet.js for security headers
- CORS properly configured
- Rate limiting enabled
- Production secrets not in code

✅ **A06: Vulnerable Components**
- Regular npm audit
- Dependencies kept up to date
- Only trusted packages used

✅ **A07: Authentication Failures**
- JWT token authentication
- Secure session management
- Payment operations require authentication

✅ **A08: Data Integrity**
- Webhook signature verification
- Payment signature verification
- Audit logging for all transactions

✅ **A09: Logging Failures**
- Comprehensive payment audit logs
- Failed payment attempts logged
- IP address tracking
- Sensitive data not logged

✅ **A10: SSRF**
- Webhook URLs validated
- No user-controlled external requests

### Additional Security Measures

1. **PCI DSS Compliance**
   - No card data stored
   - Payment tokenization
   - Secure transmission only

2. **Fraud Prevention**
   - Amount limits enforced
   - Rate limiting on payment attempts
   - IP address logging
   - Unusual activity detection

3. **Data Encryption**
   - Payment tokens encrypted at rest
   - Sensitive PII encrypted
   - Encryption key rotation support

4. **Audit Trail**
   - All payment operations logged
   - User actions tracked
   - IP and user agent recorded

## API Endpoints

### Create Payment Order
```
POST /api/payments/create-order
Authorization: Bearer <token>

Request:
{
  "amount": 50000,
  "currency": "INR",
  "type": "DEAL_COMMITMENT",
  "gateway": "RAZORPAY",
  "description": "Investment in Startup X"
}

Response:
{
  "success": true,
  "orderId": "order_xxx",
  "amount": 50000,
  "currency": "INR",
  "key": "rzp_test_xxx"
}
```

### Verify Payment
```
POST /api/payments/verify
Authorization: Bearer <token>

Request:
{
  "orderId": "order_xxx",
  "paymentId": "pay_xxx",
  "signature": "signature_xxx",
  "gateway": "RAZORPAY"
}

Response:
{
  "success": true,
  "verified": true,
  "payment": { ... }
}
```

### Get Payment History
```
GET /api/payments/history
Authorization: Bearer <token>

Response:
{
  "payments": [
    {
      "id": "uuid",
      "amount": 50000,
      "currency": "INR",
      "status": "COMPLETED",
      "gateway": "RAZORPAY",
      "createdAt": "2026-02-05T..."
    }
  ]
}
```

### Request Refund
```
POST /api/payments/refund
Authorization: Bearer <token>

Request:
{
  "paymentId": "uuid",
  "amount": 50000,
  "reason": "Investment cancelled"
}

Response:
{
  "success": true,
  "refundId": "rfnd_xxx",
  "status": "PROCESSING"
}
```

## Frontend Integration

### Razorpay Example

```typescript
import { PaymentGateway } from '@prisma/client';

// 1. Create order
const response = await fetch('/api/payments/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    amount: 50000,
    currency: 'INR',
    type: 'DEAL_COMMITMENT',
    gateway: 'RAZORPAY'
  })
});

const { orderId, amount, currency, key } = await response.json();

// 2. Open Razorpay checkout
const options = {
  key,
  amount,
  currency,
  order_id: orderId,
  name: 'India Angel Forum',
  description: 'Investment Payment',
  handler: async (response: any) => {
    // 3. Verify payment
    const verifyResponse = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
        gateway: 'RAZORPAY'
      })
    });

    const result = await verifyResponse.json();
    if (result.verified) {
      alert('Payment successful!');
    }
  }
};

const razorpay = new (window as any).Razorpay(options);
razorpay.open();
```

### Stripe Example

```typescript
// 1. Create payment intent
const response = await fetch('/api/payments/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    amount: 500, // $500 USD
    currency: 'USD',
    type: 'DEAL_COMMITMENT',
    gateway: 'STRIPE'
  })
});

const { clientSecret } = await response.json();

// 2. Initialize Stripe Elements
const stripe = await loadStripe(publishableKey);
const elements = stripe.elements({ clientSecret });
const paymentElement = elements.create('payment');
paymentElement.mount('#payment-element');

// 3. Confirm payment
const { error } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: 'https://yoursite.com/payment-success'
  }
});
```

## Testing

### Test Credentials

#### Razorpay Test Cards
- Success: 4111 1111 1111 1111
- Failure: 4111 1111 1111 1234
- CVV: Any 3 digits
- Expiry: Any future date

#### Stripe Test Cards
- Success: 4242 4242 4242 4242
- 3D Secure: 4000 0027 6000 3184
- Declined: 4000 0000 0000 0002
- CVV: Any 3 digits
- Expiry: Any future date

### Test UPI (Razorpay)
- success@razorpay
- failure@razorpay

## Async Invoice Generation Flow

As of Phase 1 GREEN, invoice generation has been moved to an asynchronous queue system for improved reliability and performance.

### Architecture

```
Payment Verification Success
          ↓
    Queue Invoice Job (Bull + Redis)
          ↓
    Return Success Response (non-blocking)
          ↓
Background Worker Processes Job
          ↓
    Generate PDF (pdfkit)
          ↓
    Save to Database & Storage
          ↓
    Send Email with Attachment
          ↓
[Success] → Complete
[Failure] → Retry (3 attempts: 1min, 5min, 15min)
          ↓
[All Retries Failed] → Admin Digest Email
```

### Key Features

1. **Non-Blocking Response**: Payment verification returns immediately without waiting for PDF generation
2. **Automatic Retries**: 3 retry attempts with exponential backoff (1min → 5min → 15min)
3. **Job Deduplication**: Uses `invoice-${paymentId}` job ID to prevent duplicate invoices
4. **Admin Monitoring**: Failed jobs included in daily digest email at 9 AM UTC
5. **Bull Board Dashboard**: Real-time queue monitoring at `/admin/queues`

### Code Example

```typescript
// server.ts - Payment verification endpoint
app.post('/api/payments/verify', async (req, res) => {
  // ... payment verification logic ...
  
  // Queue invoice generation (async, non-blocking)
  await invoiceQueueService.addInvoiceJob({
    userId: payment.userId,
    paymentId: payment.id,
    buyerName: user.fullName || user.email,
    buyerEmail: user.email,
    lineItems: [/* ... */],
    subtotal: payment.amount,
    totalAmount: payment.amount,
  });
  
  // Return immediately
  return res.status(200).json({
    success: true,
    message: 'Payment verified. Invoice will be generated shortly.',
    paymentId: payment.id,
  });
});
```

### Admin Operations

#### Retry Failed Invoice
```typescript
// Single retry
await invoiceQueueService.retryInvoiceJob(paymentId);

// Batch retry (max 50)
await invoiceQueueService.retryBatchInvoices([paymentId1, paymentId2, ...]);
```

#### Monitor Queue
```typescript
// Get metrics
const metrics = await invoiceQueueService.getMetrics();
// Returns: { waiting, active, completed, failed, delayed, total }

// Get failed jobs
const failedJobs = await invoiceQueueService.getFailedJobs(100);
```

### Configuration

```env
# Redis for queue (default: redis://localhost:6379)
REDIS_URL=redis://localhost:6379

# Admin email for alerts
ADMIN_EMAIL=admin@indiaangelforum.com

# Invoice storage
INVOICE_DIR=./invoices
ARCHIVE_DIR=./archives

# Retention policies
INVOICE_RETENTION_YEARS=2
ARCHIVE_RETENTION_YEARS=7

# Monitoring
DISK_SPACE_ALERT_THRESHOLD_GB=10
```

### Monitoring Dashboard

Access Bull Board at `/admin/queues` (admin auth required) to:
- View real-time job status
- Inspect job details and errors
- Manually retry failed jobs
- Monitor queue health metrics

For more details, see [PHASE1_GREEN_COMPLETE.md](PHASE1_GREEN_COMPLETE.md).

## Production Deployment Checklist

- [ ] Generate strong encryption keys
- [ ] Configure production payment gateway credentials
- [ ] Enable HTTPS/TLS
- [ ] Set up webhook endpoints with signature verification
- [ ] Configure rate limiting
- [ ] Enable audit logging
- [ ] Set up error monitoring (Sentry)
- [ ] Configure backup encryption
- [ ] Test payment flows end-to-end
- [ ] Review and test refund workflows
- [ ] Set up automated security scanning
- [ ] Configure DDoS protection
- [ ] Enable fraud detection
- [ ] Set up alerts for failed payments
- [ ] Document incident response procedures

## Compliance

### Indian Regulations
- RBI guidelines compliant
- KYC/AML verification required
- TDS deduction for applicable transactions
- Form 15CA/15CB for NRI investments

### International Regulations
- PCI DSS Level 1 compliance
- GDPR compliant data handling
- SOC 2 Type II audit ready

## Support

For payment integration issues:
1. Check logs in `/var/log/payments`
2. Review webhook delivery in gateway dashboard
3. Verify signature calculation
4. Check rate limiting status
5. Contact gateway support if needed

## Monitoring

Key metrics to monitor:
- Payment success rate
- Average transaction time
- Failed payment reasons
- Refund processing time
- Gateway uptime
- Fraud detection alerts

## License

Proprietary - India Angel Forum
