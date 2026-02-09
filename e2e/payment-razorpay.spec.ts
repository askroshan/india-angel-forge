/**
 * US-PAYMENT-001: Create Payment Order (Razorpay - Domestic)
 * US-PAYMENT-002: Verify Payment Completion (Razorpay)
 * 
 * TDD Phase: RED - Tests written first, should fail
 */

import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const API_URL = 'http://localhost:3001';

test.describe('US-PAYMENT-001: Create Payment Order (Razorpay)', () => {
  let authToken: string;
  let userId: string;

  test.beforeEach(async ({ request }) => {
    // Create and login test user
    const signupResponse = await request.post(`${API_URL}/api/auth/signup`, {
      data: {
        email: `investor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.com`,
        password: 'SecurePass123!',
        fullName: 'Test Investor',
        role: 'investor'
      }
    });
    
    const userData = await signupResponse.json();
    authToken = userData.token;
    userId = userData.user.id;
  });

  test('TC-001: Authenticated user creates valid Razorpay payment order', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/payments/create-order`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        amount: 50000,
        currency: 'INR',
        type: 'DEAL_COMMITMENT',
        gateway: 'RAZORPAY',
        description: 'Investment in Startup X'
      }
    });

    expect(response.status()).toBe(201);
    const result = await response.json();
    
    expect(result.success).toBe(true);
    expect(result.orderId).toBeTruthy();
    expect(result.amount).toBe(5000000); // In paise
    expect(result.currency).toBe('INR');
    expect(result.key).toBeTruthy(); // Razorpay key
  });

  test('TC-002: Payment order is saved to database with correct details', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/payments/create-order`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        amount: 75000,
        currency: 'INR',
        type: 'MEMBERSHIP_FEE',
        gateway: 'RAZORPAY',
        description: 'Annual membership'
      }
    });

    const result = await response.json();
    
    // Verify payment was saved
    const historyResponse = await request.get(`${API_URL}/api/payments/history`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const history = await historyResponse.json();
    const savedPayment = history.payments.find((p: any) => 
      p.gatewayOrderId === result.orderId
    );
    
    expect(savedPayment).toBeTruthy();
    expect(savedPayment.amount).toBe('75000.00');
    expect(savedPayment.status).toBe('PENDING');
    expect(savedPayment.gateway).toBe('RAZORPAY');
    expect(savedPayment.type).toBe('MEMBERSHIP_FEE');
  });

  test('TC-003: Razorpay order ID is generated and returned', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/payments/create-order`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        amount: 100000,
        currency: 'INR',
        type: 'DEAL_COMMITMENT',
        gateway: 'RAZORPAY'
      }
    });

    const result = await response.json();
    
    // Razorpay order IDs start with 'order_'
    expect(result.orderId).toMatch(/^order_/);
    expect(result.key).toMatch(/^rzp_(test|live)_/);
  });

  test('TC-004: Amount below minimum is rejected', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/payments/create-order`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        amount: 10000, // Below ₹25,000 minimum
        currency: 'INR',
        type: 'DEAL_COMMITMENT',
        gateway: 'RAZORPAY'
      }
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Minimum investment amount');
    expect(result.error).toContain('25,000');
  });

  test('TC-005: Amount above maximum is rejected', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/payments/create-order`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        amount: 15000000, // Above ₹10,000,000 maximum
        currency: 'INR',
        type: 'DEAL_COMMITMENT',
        gateway: 'RAZORPAY'
      }
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Maximum investment amount');
    expect(result.error).toContain('10,000,000');
  });

  test('TC-006: Unauthenticated user is rejected with 401', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/payments/create-order`, {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        amount: 50000,
        currency: 'INR',
        type: 'DEAL_COMMITMENT',
        gateway: 'RAZORPAY'
      }
    });

    expect(response.status()).toBe(401);
    const result = await response.json();
    expect(result.error.code).toBe('UNAUTHORIZED');
  });
});

test.describe('US-PAYMENT-002: Verify Payment Completion (Razorpay)', () => {
  let authToken: string;
  let orderId: string;
  let paymentId: string;

  test.beforeEach(async ({ request }) => {
    // Setup: Create user and payment order
    const signupResponse = await request.post(`${API_URL}/api/auth/signup`, {
      data: {
        email: `investor_verify_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.com`,
        password: 'SecurePass123!',
        fullName: 'Test Investor',
        role: 'investor'
      }
    });
    
    const userData = await signupResponse.json();
    authToken = userData.token;

    // Create payment order
    const orderResponse = await request.post(`${API_URL}/api/payments/create-order`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        amount: 50000,
        currency: 'INR',
        type: 'DEAL_COMMITMENT',
        gateway: 'RAZORPAY'
      }
    });
    
    const orderData = await orderResponse.json();
    orderId = orderData.orderId;
    paymentId = `pay_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; // Mock payment ID
  });

  test('TC-007: Valid signature verification succeeds', async ({ request }) => {
    // Generate valid signature using Razorpay algorithm
    const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const response = await request.post(`${API_URL}/api/payments/verify`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        orderId,
        paymentId,
        signature,
        gateway: 'RAZORPAY'
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    
    expect(result.success).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.payment).toBeTruthy();
    expect(result.payment.status).toBe('COMPLETED');
  });

  test('TC-008: Invalid signature verification fails', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/payments/verify`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        orderId,
        paymentId,
        signature: 'invalid_signature_12345',
        gateway: 'RAZORPAY'
      }
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    
    expect(result.success).toBe(false);
    expect(result.verified).toBe(false);
    expect(result.error).toContain('signature');
  });

  test('TC-009: Payment status updates to COMPLETED on success', async ({ request }) => {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    await request.post(`${API_URL}/api/payments/verify`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        orderId,
        paymentId,
        signature,
        gateway: 'RAZORPAY'
      }
    });

    // Check payment status in history
    const historyResponse = await request.get(`${API_URL}/api/payments/history`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const history = await historyResponse.json();
    const payment = history.payments.find((p: any) => p.gatewayOrderId === orderId);
    
    expect(payment.status).toBe('COMPLETED');
    expect(payment.gatewayPaymentId).toBe(paymentId);
    expect(payment.gatewaySignature).toBe(signature);
  });

  test('TC-010: completedAt timestamp is set correctly', async ({ request }) => {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const beforeTime = new Date();
    
    await request.post(`${API_URL}/api/payments/verify`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        orderId,
        paymentId,
        signature,
        gateway: 'RAZORPAY'
      }
    });

    const afterTime = new Date();

    // Check payment in history
    const historyResponse = await request.get(`${API_URL}/api/payments/history`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const history = await historyResponse.json();
    const payment = history.payments.find((p: any) => p.gatewayOrderId === orderId);
    
    expect(payment.completedAt).toBeTruthy();
    const completedAt = new Date(payment.completedAt);
    expect(completedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(completedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  test('TC-011: Audit log entry is created for verification', async ({ request }) => {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    await request.post(`${API_URL}/api/payments/verify`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        orderId,
        paymentId,
        signature,
        gateway: 'RAZORPAY'
      }
    });

    // Check audit logs (admin only, so login as admin)
    const adminResponse = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@indiaangelforum.test',
        password: 'Admin@12345'
      }
    });
    
    const adminData = await adminResponse.json();
    
    const auditResponse = await request.get(`${API_URL}/api/audit/payments`, {
      headers: { 'Authorization': `Bearer ${adminData.token}` }
    });
    
    const audit = await auditResponse.json();
    const verifyLog = audit.logs.find((log: any) => 
      log.action === 'PAYMENT_VERIFIED' && 
      log.entity === 'Payment' &&
      log.details.includes(orderId)
    );
    
    expect(verifyLog).toBeTruthy();
    expect(verifyLog.ipAddress).toBeTruthy();
  });
});
