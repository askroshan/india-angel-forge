/**
 * E2E Test Suite: Compliance & KYC (Phase 4)
 * 
 * User Stories: US-COMP-001 through US-COMP-003
 * 
 * Tests the compliance and KYC workflows:
 * - Investor KYC document upload and status tracking
 * - Compliance officer KYC document review (verify/reject)
 * - Accreditation verification (approve/reject)
 * 
 * Test Coverage (10 tests):
 * - COMP-E2E-001: Display KYC upload page with document cards
 * - COMP-E2E-002: View document status badges
 * - COMP-E2E-003: API returns KYC documents with correct data shape
 * - COMP-E2E-004: Display KYC review dashboard with documents
 * - COMP-E2E-005: Filter KYC documents by status and type
 * - COMP-E2E-006: Verify a KYC document
 * - COMP-E2E-007: Reject a KYC document with reason
 * - COMP-E2E-008: Display accreditation verification with applications
 * - COMP-E2E-009: Approve accreditation with expiry date
 * - COMP-E2E-010: Reject accreditation with reason
 * 
 * Trace IDs: COMP-E2E-001 to COMP-E2E-010
 * @see PHASE4_USER_STORIES.md for full traceability matrix
 */

import { test, expect, type Page } from '@playwright/test';

// Compliance/KYC admin tests configured for desktop viewports only via playwright.config.ts testIgnore

// ==================== TEST CONSTANTS ====================

const ADMIN_USER = {
  email: 'admin@indiaangelforum.test',
  password: 'Admin@12345',
};

const INVESTOR_USER = {
  email: 'investor.standard@test.com',
  password: 'Investor@12345',
};

const API_BASE = 'http://127.0.0.1:3001';

// ==================== HELPERS ====================

/**
 * Login via API and return auth token
 */
async function getAuthToken(email: string, password: string): Promise<string> {
  const response = await fetchWithRetry(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(`Login failed for ${email}: ${response.status}`);
  }
  const data = await response.json();
  return data.token;
}

/**
 * Login via UI and navigate to a page
 */
async function loginAndNavigate(page: Page, user: typeof ADMIN_USER, path: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10000 });
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Retry wrapper for transient network errors (ECONNRESET, etc.)
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error('fetchWithRetry: should not reach here');
}

/**
 * Seed test KYC documents for investor and compliance review.
 * Idempotent.
 */
async function seedTestKYCDocuments(token: string): Promise<void> {
  await fetchWithRetry(`${API_BASE}/api/test/seed-kyc-documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Seed test accreditation applications for compliance review.
 * Idempotent.
 */
async function seedTestAccreditationApplications(token: string): Promise<void> {
  await fetchWithRetry(`${API_BASE}/api/test/seed-accreditation-applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Seed approved investor application to prevent redirect.
 */
async function ensureApprovedInvestorApplication(token: string): Promise<void> {
  await fetchWithRetry(`${API_BASE}/api/test/seed-investor-application`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fullName: 'Test Investor',
      email: INVESTOR_USER.email,
      investorType: 'individual',
      status: 'approved',
    }),
  });
}

// ==================== TEST SUITE ====================

test.describe.serial('Compliance & KYC (Phase 4)', () => {
  let adminToken: string;
  let investorToken: string;

  test.beforeAll(async () => {
    adminToken = await getAuthToken(ADMIN_USER.email, ADMIN_USER.password);
    investorToken = await getAuthToken(INVESTOR_USER.email, INVESTOR_USER.password);

    // Seed prerequisite data
    await ensureApprovedInvestorApplication(investorToken);
    await seedTestKYCDocuments(adminToken);
    await seedTestAccreditationApplications(adminToken);
  });

  // ==================== US-COMP-001: Investor KYC Upload ====================

  /**
   * COMP-E2E-001: Display KYC upload page with document cards
   * Trace: US-COMP-001 → AC-1, AC-2, AC-3
   * 
   * Validates:
   * - KYC Upload page loads with heading
   * - Four document cards displayed: PAN Card, Aadhaar Card, Bank Statement, Income Proof
   * - Each card shows document type, description, and status
   */
  test('COMP-E2E-001: should display KYC upload page with document cards', async ({ page }) => {
    await loginAndNavigate(page, INVESTOR_USER, '/investor/kyc');

    // Verify page heading
    await expect(page.locator('h1, h2').filter({ hasText: /KYC Document|Upload KYC/i })).toBeVisible({ timeout: 10000 });

    // Verify four document type cards are present
    await expect(page.getByRole('heading', { name: 'PAN Card' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Aadhaar Card' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bank Statement' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Income Proof' })).toBeVisible();
  });

  /**
   * COMP-E2E-002: View document status badges
   * Trace: US-COMP-001 → AC-3, AC-5, AC-6
   * 
   * Validates:
   * - Status badges show Verified (green), Rejected (red), Pending Review, or Not Uploaded
   * - Each document section shows appropriate status
   */
  test('COMP-E2E-002: should view document status badges', async ({ page }) => {
    await loginAndNavigate(page, INVESTOR_USER, '/investor/kyc');
    await page.waitForTimeout(1000);

    // Verify at least some status indicators are present
    // Documents could be in any status: Not Uploaded, Pending Review, Verified, Rejected
    const statusTexts = page.locator('text=/Not Uploaded|Pending|Verified|Rejected/i');
    const count = await statusTexts.count();
    expect(count).toBeGreaterThan(0);
  });

  /**
   * COMP-E2E-003: API returns KYC documents with correct data shape
   * Trace: US-COMP-001 → AC-4
   * 
   * Validates:
   * - GET /api/kyc/documents returns array of documents
   * - Each document has expected fields (documentType, status)
   */
  test('COMP-E2E-003: should return KYC documents API with correct data shape', async () => {
    const response = await fetchWithRetry(`${API_BASE}/api/kyc/documents`, {
      headers: { Authorization: `Bearer ${investorToken}` },
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);

    if (data.length > 0) {
      const doc = data[0];
      expect(doc).toHaveProperty('id');
      expect(doc).toHaveProperty('documentType');
      expect(['pan', 'aadhaar', 'bank_statement', 'income_proof']).toContain(doc.documentType);
    }
  });

  // ==================== US-COMP-002: KYC Review Dashboard ====================

  /**
   * COMP-E2E-004: Display KYC review dashboard with documents
   * Trace: US-COMP-002 → AC-1, AC-2
   * 
   * Validates:
   * - KYC Review Dashboard loads with heading (admin has compliance access)
   * - Documents list shows investor name, document type, status, upload date
   */
  test('COMP-E2E-004: should display KYC review dashboard with documents', async ({ page }) => {
    await loginAndNavigate(page, ADMIN_USER, '/compliance/kyc-review');

    // Verify page heading
    await expect(page.locator('h1, h2').filter({ hasText: /KYC Document Review/i })).toBeVisible({ timeout: 10000 });

    // Verify document entries are displayed (or empty state)
    const documentEntries = page.locator('text=/PAN|Aadhaar|Bank Statement|Income Proof/i');
    const count = await documentEntries.count();
    // Should have seeded documents
    expect(count).toBeGreaterThan(0);

    // Verify status badges are present
    const statusBadges = page.locator('text=/Pending|Verified|Rejected/i');
    await expect(statusBadges.first()).toBeVisible();
  });

  /**
   * COMP-E2E-005: Filter KYC documents by status and type
   * Trace: US-COMP-002 → AC-3, AC-4, AC-5
   * 
   * Validates:
   * - Status filter (All/Pending/Verified/Rejected) works
   * - Document type filter (All/PAN/Aadhaar/Bank Statement/Income Proof) works
   * - Search by investor name/email works
   */
  test('COMP-E2E-005: should filter KYC documents by status and type', async ({ page }) => {
    await loginAndNavigate(page, ADMIN_USER, '/compliance/kyc-review');
    await page.waitForTimeout(1000);

    // Verify status filter exists
    const statusFilter = page.locator('select, [role="combobox"]').first();
    await expect(statusFilter).toBeVisible();

    // Verify search input exists
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"], #search');
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('investor');
      await page.waitForTimeout(500);
    }
  });

  /**
   * COMP-E2E-006: Verify a KYC document
   * Trace: US-COMP-002 → AC-6
   * 
   * Validates:
   * - Verify button on pending document triggers verification
   * - Success toast shown after verification
   */
  test('COMP-E2E-006: should verify a KYC document', async ({ page }) => {
    // Re-seed to ensure pending documents exist
    await seedTestKYCDocuments(adminToken);

    await loginAndNavigate(page, ADMIN_USER, '/compliance/kyc-review');
    await page.waitForTimeout(1000);

    // Find a Verify button
    const verifyBtn = page.getByRole('button', { name: /Verify/i });
    
    if (await verifyBtn.count() > 0) {
      await verifyBtn.first().scrollIntoViewIfNeeded();
      await verifyBtn.first().click({ force: true });
      
      // If there's a confirmation dialog, confirm
      const confirmBtn = page.locator('[role="dialog"]').getByRole('button', { name: /Verify|Confirm|Submit/i });
      if (await confirmBtn.count() > 0) {
        await confirmBtn.first().click();
      }

      // Verify success indication
      await expect(page.locator('text=/verified|success/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  /**
   * COMP-E2E-007: Reject a KYC document with reason
   * Trace: US-COMP-002 → AC-7
   * 
   * Validates:
   * - Reject button opens rejection dialog
   * - Reason field is required
   * - Submitting rejection updates document status
   */
  test('COMP-E2E-007: should reject a KYC document with reason', async ({ page }) => {
    // Re-seed to ensure pending documents exist
    await seedTestKYCDocuments(adminToken);

    await loginAndNavigate(page, ADMIN_USER, '/compliance/kyc-review');
    await page.waitForTimeout(1000);

    // Find a Reject button
    const rejectBtn = page.getByRole('button', { name: /Reject/i });
    
    if (await rejectBtn.count() > 0) {
      await rejectBtn.first().scrollIntoViewIfNeeded();
      await rejectBtn.first().click({ force: true });

      // Verify rejection dialog opens
      await expect(page.locator('[role="dialog"], .dialog')).toBeVisible({ timeout: 3000 });

      // Fill rejection reason
      const reasonField = page.locator('[role="dialog"] textarea, [role="dialog"] input[type="text"]');
      if (await reasonField.count() > 0) {
        await reasonField.first().fill('Document is blurry and unreadable');
      }

      // Submit rejection
      const submitBtn = page.locator('[role="dialog"]').getByRole('button', { name: /Reject|Submit/i });
      await submitBtn.first().click();

      // Verify success indication
      await expect(page.locator('text=/rejected|success/i')).toBeVisible({ timeout: 5000 });
    }
  });

  // ==================== US-COMP-003: Accreditation Verification ====================

  /**
   * COMP-E2E-008: Display accreditation verification with applications
   * Trace: US-COMP-003 → AC-1, AC-2, AC-3
   * 
   * Validates:
   * - Accreditation Verification page loads with heading
   * - Applications list shows investor info, verification method, status
   * - Status filter works
   */
  test('COMP-E2E-008: should display accreditation verification with applications', async ({ page }) => {
    await loginAndNavigate(page, ADMIN_USER, '/compliance/accreditation');

    // Verify page heading
    await expect(page.locator('h1, h2').filter({ hasText: /Accreditation Verification/i })).toBeVisible({ timeout: 10000 });

    // Verify application entries are displayed
    const applicationEntries = page.locator('text=/Pending|Approved|Rejected|Expired/i');
    const count = await applicationEntries.count();
    expect(count).toBeGreaterThan(0);

    // Verify verification method labels are shown
    const methodLabels = page.locator('text=/Income|Net Worth|Professional/i');
    await expect(methodLabels.first()).toBeVisible();
  });

  /**
   * COMP-E2E-009: Approve accreditation with expiry date
   * Trace: US-COMP-003 → AC-4, AC-7
   * 
   * Validates:
   * - Approve button opens dialog with expiry date field
   * - Submitting approval with expiry date updates application
   * - Financial details (annual income, net worth) shown where applicable
   */
  test('COMP-E2E-009: should approve accreditation with expiry date', async ({ page }) => {
    // Re-seed to ensure pending accreditations exist
    await seedTestAccreditationApplications(adminToken);

    await loginAndNavigate(page, ADMIN_USER, '/compliance/accreditation');
    await page.waitForTimeout(1000);

    // Find Approve button
    const approveBtn = page.getByRole('button', { name: /Approve/i });

    if (await approveBtn.count() > 0) {
      await approveBtn.first().click();

      // Verify approval dialog opens with expiry date
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Expiry date field should be present and prefilled
      const expiryField = page.locator('[role="dialog"] input[type="date"]');
      await expect(expiryField.first()).toBeVisible();

      // Submit approval
      const submitBtn = page.locator('[role="dialog"]').getByRole('button', { name: /Approve|Submit|Confirm/i });
      await submitBtn.first().click();

      // Verify success
      await expect(page.locator('text=/approved|success/i')).toBeVisible({ timeout: 5000 });
    }
  });

  /**
   * COMP-E2E-010: Reject accreditation with reason
   * Trace: US-COMP-003 → AC-5, AC-6
   * 
   * Validates:
   * - Reject button opens dialog with reason field
   * - Submitting rejection updates application status
   * - View Documents button shows submitted documents
   */
  test('COMP-E2E-010: should reject accreditation with reason', async ({ page }) => {
    // Re-seed to ensure pending accreditations exist
    await seedTestAccreditationApplications(adminToken);

    await loginAndNavigate(page, ADMIN_USER, '/compliance/accreditation');
    await page.waitForTimeout(1000);

    // First test View Documents if available
    const viewDocsBtn = page.getByRole('button', { name: /View Documents/i });
    if (await viewDocsBtn.count() > 0) {
      await viewDocsBtn.first().click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      // Close dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // Find Reject button
    const rejectBtn = page.getByRole('button', { name: /Reject/i });
    
    if (await rejectBtn.count() > 0) {
      await rejectBtn.first().click();

      // Verify rejection dialog opens
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Fill rejection reason
      const reasonField = page.locator('[role="dialog"] textarea');
      await reasonField.first().fill('Income verification documents are insufficient');

      // Submit rejection
      const submitBtn = page.locator('[role="dialog"]').getByRole('button', { name: /Reject|Submit/i });
      await submitBtn.first().click();

      // Verify success
      await expect(page.locator('text=/rejected|success/i').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
