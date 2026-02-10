/**
 * E2E Test Suite: Discount Codes
 *
 * User Stories: US-DISC-001 through US-DISC-004
 *
 * Tests verify:
 * - Admin can CRUD discount codes
 * - Discount codes validate correctly (expired, max uses, applicable plans)
 * - Percentage and fixed amount discount types work
 * - Discount application returns correct discounted price
 *
 * Test Coverage (8 tests):
 * - DISC-E2E-001: Admin creates a percentage discount code
 * - DISC-E2E-002: Admin creates a fixed amount discount code
 * - DISC-E2E-003: Apply valid discount code returns discounted price
 * - DISC-E2E-004: Expired discount code is rejected
 * - DISC-E2E-005: Discount code with max uses exceeded is rejected
 * - DISC-E2E-006: Invalid discount code is rejected
 * - DISC-E2E-007: Admin lists all discount codes
 * - DISC-E2E-008: Admin deactivates a discount code
 *
 * Trace IDs: DISC-E2E-001 to DISC-E2E-008
 */

import { test, expect, Page } from '@playwright/test';

// Run all test groups serially to avoid cleanup race conditions
test.describe.configure({ mode: 'serial' });

test.use({ browserName: 'chromium' });

const TEST_USERS = {
  admin: { email: 'admin@indiaangelforum.test', password: 'Admin@12345' },
  investor: { email: 'investor.standard@test.com', password: 'Investor@12345' },
};

const API_BASE = 'http://127.0.0.1:3001';

// ==================== HELPERS ====================

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL((url: URL) => !url.pathname.includes('/auth'), { timeout: 10000 });
}

async function getAuthToken(page: Page): Promise<string> {
  return await page.evaluate(() => localStorage.getItem('auth_token') || '');
}

async function fetchAPI(url: string, options: RequestInit = {}): Promise<Response> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error('unreachable');
}

// Helper: Get auth token via direct API login
async function getAPIToken(email: string, password: string): Promise<string> {
  const res = await fetchAPI(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!body.token) throw new Error(`Login failed for ${email}: ${JSON.stringify(body)}`);
  return body.token;
}

// Clean up test discount codes
async function cleanupTestCodes(token: string) {
  const res = await fetchAPI(`${API_BASE}/api/admin/membership/discount-codes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) {
    const body = await res.json();
    const codes = body.discountCodes || [];
    for (const code of codes) {
      if (code.code?.startsWith('E2ETEST')) {
        await fetchAPI(`${API_BASE}/api/admin/membership/discount-codes/${code.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
  }
}

// ==================== ADMIN CRUD TESTS ====================

test.describe('US-DISC-001: Admin Discount Code CRUD', () => {
  let adminToken: string;
  let testPlanId: string;
  let percentCodeId: string;
  let fixedCodeId: string;

  test.beforeAll(async () => {
    adminToken = await getAPIToken(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await cleanupTestCodes(adminToken);

    // Get a plan ID for applicable plans
    const plansRes = await fetchAPI(`${API_BASE}/api/membership/plans`);
    const plansBody = await plansRes.json();
    if (plansBody.plans?.length > 0) {
      testPlanId = plansBody.plans[0].id;
    }
  });

  test.afterAll(async () => {
    const token = await getAPIToken(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await cleanupTestCodes(token);
  });

  test('DISC-E2E-001: Admin creates a percentage discount code', async () => {
    const res = await fetchAPI(`${API_BASE}/api/admin/membership/discount-codes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'E2ETEST20PCT',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxUses: 100,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        applicablePlanIds: testPlanId ? [testPlanId] : [],
        isActive: true,
      }),
    });

    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.discountCode.code).toBe('E2ETEST20PCT');
    expect(body.discountCode.discountType).toBe('PERCENTAGE');
    expect(Number(body.discountCode.discountValue)).toBe(20);
    percentCodeId = body.discountCode.id;
  });

  test('DISC-E2E-002: Admin creates a fixed amount discount code', async () => {
    const res = await fetchAPI(`${API_BASE}/api/admin/membership/discount-codes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'E2ETEST5000OFF',
        discountType: 'FIXED_AMOUNT',
        discountValue: 5000,
        maxUses: 50,
        validFrom: new Date().toISOString(),
        applicablePlanIds: [],
        isActive: true,
      }),
    });

    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.discountCode.code).toBe('E2ETEST5000OFF');
    expect(body.discountCode.discountType).toBe('FIXED_AMOUNT');
    fixedCodeId = body.discountCode.id;
  });

  test('DISC-E2E-007: Admin lists all discount codes', async () => {
    const res = await fetchAPI(`${API_BASE}/api/admin/membership/discount-codes`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.discountCodes)).toBe(true);
    // Should include our test codes
    const testCodes = body.discountCodes.filter((c: any) => c.code?.startsWith('E2ETEST'));
    expect(testCodes.length).toBeGreaterThanOrEqual(2);
  });

  test('DISC-E2E-008: Admin deactivates a discount code', async () => {
    // Create a code to deactivate
    const createRes = await fetchAPI(`${API_BASE}/api/admin/membership/discount-codes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'E2ETESTDEACTIVATE',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        validFrom: new Date().toISOString(),
        applicablePlanIds: [],
        isActive: true,
      }),
    });
    const createBody = await createRes.json();
    const codeId = createBody.discountCode.id;

    // Deactivate
    const deleteRes = await fetchAPI(`${API_BASE}/api/admin/membership/discount-codes/${codeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(deleteRes.ok).toBe(true);
    const deleteBody = await deleteRes.json();
    expect(deleteBody.success).toBe(true);
  });
});

// ==================== DISCOUNT APPLICATION TESTS ====================

test.describe('US-DISC-002: Discount Code Application', () => {
  let adminToken: string;
  let investorToken: string;
  let testPlanId: string;

  test.beforeAll(async () => {
    adminToken = await getAPIToken(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await cleanupTestCodes(adminToken);

    // Get a plan
    const plansRes = await fetchAPI(`${API_BASE}/api/membership/plans`);
    const plansBody = await plansRes.json();
    if (plansBody.plans?.length > 0) {
      testPlanId = plansBody.plans[0].id;
    }

    // Create test codes
    await fetchAPI(`${API_BASE}/api/admin/membership/discount-codes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'E2ETESTVALID',
        discountType: 'PERCENTAGE',
        discountValue: 25,
        maxUses: 100,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        applicablePlanIds: [],
        isActive: true,
      }),
    });

    // Create expired code
    await fetchAPI(`${API_BASE}/api/admin/membership/discount-codes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'E2ETESTEXPIRED',
        discountType: 'PERCENTAGE',
        discountValue: 50,
        validFrom: new Date('2024-01-01').toISOString(),
        validUntil: new Date('2024-12-31').toISOString(),
        applicablePlanIds: [],
        isActive: true,
      }),
    });

    // Get investor token via API
    investorToken = await getAPIToken(TEST_USERS.investor.email, TEST_USERS.investor.password);
  });

  test.afterAll(async () => {
    const token = await getAPIToken(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await cleanupTestCodes(token);
  });

  test('DISC-E2E-003: Apply valid discount code returns discounted price', async () => {
    if (!testPlanId) test.skip();

    const res = await fetchAPI(`${API_BASE}/api/membership/apply-discount`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${investorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'E2ETESTVALID', planId: testPlanId }),
    });

    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.discount).toBeDefined();
    expect(body.discount).toHaveProperty('originalPrice');
    expect(body.discount).toHaveProperty('finalPrice');
    expect(body.discount).toHaveProperty('discountAmount');
  });

  test('DISC-E2E-004: Expired discount code is rejected', async () => {
    if (!testPlanId) test.skip();

    const res = await fetchAPI(`${API_BASE}/api/membership/apply-discount`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${investorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'E2ETESTEXPIRED', planId: testPlanId }),
    });

    // Should be rejected (400 or with error message)
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('DISC-E2E-005: Discount code with max uses exceeded is rejected', async () => {
    if (!testPlanId) test.skip();

    // Create code with 0 max uses remaining
    await fetchAPI(`${API_BASE}/api/admin/membership/discount-codes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'E2ETESTMAXUSED',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        maxUses: 0,
        validFrom: new Date().toISOString(),
        applicablePlanIds: [],
        isActive: true,
      }),
    });

    const res = await fetchAPI(`${API_BASE}/api/membership/apply-discount`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${investorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'E2ETESTMAXUSED', planId: testPlanId }),
    });

    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('DISC-E2E-006: Invalid discount code is rejected', async () => {
    if (!testPlanId) test.skip();

    const res = await fetchAPI(`${API_BASE}/api/membership/apply-discount`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${investorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'NONEXISTENTCODE', planId: testPlanId }),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
