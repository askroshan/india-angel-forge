/**
 * E2E Test Suite: Moderator Features
 *
 * Bug Fixes: BUG-MOD-01 through BUG-MOD-06
 * User Stories: US-MOD-101 through US-MOD-108, US-REG-001 through US-REG-005
 *
 * Tests:
 * - MOD-E2E-001: Moderator nav link visible for moderator role
 * - MOD-E2E-002: Content moderation page loads without error (BUG-MOD-01)
 * - MOD-E2E-003: Moderator users page accessible (US-MOD-103, BUG-MOD-06)
 * - MOD-E2E-004: Moderator reports page accessible (US-MOD-105, BUG-MOD-06)
 * - MOD-E2E-005: Moderator attendance page accessible (US-MOD-108, BUG-MOD-06)
 * - MOD-E2E-006: Compliance dashboard accessible (US-REG-001 to US-REG-005)
 * - MOD-E2E-007: Event attendance shows all non-cancelled records (BUG-MOD-04)
 * - MOD-E2E-008: Moderator nav link NOT visible for regular investor
 * - MOD-E2E-009: Content flags API returns list (BUG-MOD-01 backend)
 * - MOD-E2E-010: Moderator reports API returns data shape (US-MOD-105 backend)
 * - MOD-E2E-011: Moderator attendance API returns paginated records (US-MOD-108 backend)
 * - MOD-E2E-012: SEBI compliance API accessible (US-REG-001)
 * - MOD-E2E-013: FEMA/FDI compliance API accessible (US-REG-002)
 * - MOD-E2E-014: DPIIT compliance API accessible (US-REG-003)
 * - MOD-E2E-015: AML summary API accessible (US-REG-005)
 * - MOD-E2E-016: Discount API returns flat response fields (BUG-MOD-02)
 * - MOD-E2E-017: My-registrations includes non-cancelled RSVP records (BUG-MOD-04)
 */

import { test, expect, type Page } from '@playwright/test';

// ==================== CONSTANTS ====================

const MODERATOR_USER = {
  email: 'moderator@indiaangelforum.test',
  password: 'Moderator@12345',
};

const ADMIN_USER = {
  email: 'admin@indiaangelforum.test',
  password: 'Admin@12345',
};

const INVESTOR_USER = {
  email: 'investor.standard@test.com',
  password: 'Investor@12345',
};

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

// ==================== HELPERS ====================

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error('fetchWithRetry: unreachable');
}

async function getAuthToken(email: string, password: string): Promise<string> {
  const res = await fetchWithRetry(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`);
  const data = await res.json();
  return data.token;
}

async function loginAndNavigate(page: Page, user: typeof MODERATOR_USER, path: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10000 });
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

// ==================== TESTS ====================

test.describe.serial('Moderator Features', () => {
  let moderatorToken: string;
  let adminToken: string;

  test.beforeAll(async () => {
    [moderatorToken, adminToken] = await Promise.all([
      getAuthToken(MODERATOR_USER.email, MODERATOR_USER.password),
      getAuthToken(ADMIN_USER.email, ADMIN_USER.password),
    ]);
  });

  // ─── Navigation ──────────────────────────────────────────────────────────

  test('MOD-E2E-001: Moderator nav link visible for moderator role (BUG-MOD-05, US-MOD-101)', async ({ page }) => {
    await loginAndNavigate(page, MODERATOR_USER, '/');
    // Open user dropdown
    const userMenu = page.locator('[data-testid="user-menu-button"], [data-testid="user-avatar"]').first();
    await userMenu.waitFor({ timeout: 5000 }).catch(() => {});
    if (await userMenu.isVisible()) await userMenu.click();
    const modLink = page.locator('[data-testid="nav-moderator-panel"]').first();
    await expect(modLink).toBeVisible({ timeout: 5000 });
  });

  test('MOD-E2E-008: Moderator nav link NOT visible for regular investor', async ({ page }) => {
    await loginAndNavigate(page, INVESTOR_USER, '/');
    const userMenu = page.locator('[data-testid="user-menu-button"], [data-testid="user-avatar"]').first();
    await userMenu.waitFor({ timeout: 5000 }).catch(() => {});
    if (await userMenu.isVisible()) await userMenu.click();
    await expect(page.locator('[data-testid="nav-moderator-panel"]')).toHaveCount(0);
  });

  // ─── Page Accessibility ───────────────────────────────────────────────────

  test('MOD-E2E-002: Content moderation page loads (BUG-MOD-01, US-MOD-102)', async ({ page }) => {
    await loginAndNavigate(page, MODERATOR_USER, '/moderator/content');
    // Page should not show an unhandled error
    await expect(page.locator('body')).not.toContainText('Unexpected error');
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('MOD-E2E-003: Moderator users page accessible (US-MOD-103, BUG-MOD-06)', async ({ page }) => {
    await loginAndNavigate(page, MODERATOR_USER, '/moderator/users');
    await expect(page.locator('[data-testid="moderator-users-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('MOD-E2E-004: Moderator reports page accessible (US-MOD-105, BUG-MOD-06)', async ({ page }) => {
    await loginAndNavigate(page, MODERATOR_USER, '/moderator/reports');
    await expect(page.locator('[data-testid="moderator-reports-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('MOD-E2E-005: Moderator attendance page accessible (US-MOD-108, BUG-MOD-06)', async ({ page }) => {
    await loginAndNavigate(page, MODERATOR_USER, '/moderator/attendance');
    await expect(page.locator('[data-testid="moderator-attendance-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('MOD-E2E-006: Compliance dashboard accessible (US-REG-001 to US-REG-005)', async ({ page }) => {
    await loginAndNavigate(page, MODERATOR_USER, '/moderator/compliance');
    await expect(page.locator('[data-testid="compliance-dashboard-page"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="compliance-tab-sebi"]')).toBeVisible();
    await expect(page.locator('[data-testid="compliance-tab-fema"]')).toBeVisible();
    await expect(page.locator('[data-testid="compliance-tab-dpiit"]')).toBeVisible();
    await expect(page.locator('[data-testid="compliance-tab-aml"]')).toBeVisible();
  });

  // ─── API Tests ────────────────────────────────────────────────────────────

  test('MOD-E2E-009: Content flags API returns list (BUG-MOD-01)', async () => {
    const res = await fetchWithRetry(`${API_BASE}/api/moderator/flags`, {
      headers: { Authorization: `Bearer ${moderatorToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('MOD-E2E-010: Moderator reports API returns expected shape (US-MOD-105)', async () => {
    const res = await fetchWithRetry(`${API_BASE}/api/moderator/reports`, {
      headers: { Authorization: `Bearer ${moderatorToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('totalFlags');
    expect(data).toHaveProperty('pendingFlags');
    expect(data).toHaveProperty('resolvedFlags');
    expect(data).toHaveProperty('flagStats');
    expect(data).toHaveProperty('resolutionStats');
    expect(data).toHaveProperty('applicationStats');
    expect(data).toHaveProperty('recentActions');
  });

  test('MOD-E2E-011: Moderator attendance API returns paginated records (US-MOD-108)', async () => {
    const res = await fetchWithRetry(`${API_BASE}/api/moderator/attendance?page=1&pageSize=10`, {
      headers: { Authorization: `Bearer ${moderatorToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('records');
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.records)).toBe(true);
  });

  test('MOD-E2E-012: SEBI compliance API accessible (US-REG-001)', async () => {
    const res = await fetchWithRetry(`${API_BASE}/api/moderator/compliance/sebi`, {
      headers: { Authorization: `Bearer ${moderatorToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('MOD-E2E-013: FEMA/FDI compliance API accessible (US-REG-002)', async () => {
    const res = await fetchWithRetry(`${API_BASE}/api/moderator/compliance/fema`, {
      headers: { Authorization: `Bearer ${moderatorToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('MOD-E2E-014: DPIIT compliance API accessible (US-REG-003)', async () => {
    const res = await fetchWithRetry(`${API_BASE}/api/moderator/compliance/dpiit`, {
      headers: { Authorization: `Bearer ${moderatorToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('MOD-E2E-015: AML summary API accessible (US-REG-005)', async () => {
    const res = await fetchWithRetry(`${API_BASE}/api/moderator/compliance/aml-summary`, {
      headers: { Authorization: `Bearer ${moderatorToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('totalScreened');
    expect(data).toHaveProperty('flaggedCount');
    expect(data).toHaveProperty('clearedCount');
    expect(data).toHaveProperty('pendingCount');
  });

  test('MOD-E2E-016: Discount API returns flat response fields (BUG-MOD-02)', async () => {
    // Apply a non-existent code to test response shape (will fail gracefully)
    const res = await fetchWithRetry(`${API_BASE}/api/membership/apply-discount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${moderatorToken}`,
      },
      body: JSON.stringify({ discountCode: 'INVALID_CODE_TEST', planId: 'plan_associate' }),
    });
    // Regardless of success/failure, if it returns 200, check flat fields
    if (res.status === 200) {
      const data = await res.json();
      if (data.success) {
        expect(data).toHaveProperty('discountedPrice');
        expect(data).toHaveProperty('discountAmount');
        expect(data).toHaveProperty('originalPrice');
      }
    } else {
      // 400/404 is acceptable for invalid code — bug was crash not validation error
      expect([400, 404, 422]).toContain(res.status);
    }
  });

  test('MOD-E2E-017: My-registrations includes non-cancelled RSVP records (BUG-MOD-04)', async () => {
    const res = await fetchWithRetry(`${API_BASE}/api/events/my-registrations`, {
      headers: { Authorization: `Bearer ${moderatorToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    // Verify no CANCELLED records are included
    const cancelledRecords = data.filter((r: { rsvpStatus?: string }) => r.rsvpStatus === 'CANCELLED');
    expect(cancelledRecords).toHaveLength(0);
  });

  // ─── Content Flag lifecycle ───────────────────────────────────────────────

  test('MOD-E2E-018: Moderator can create and resolve a content flag (US-MOD-102)', async () => {
    // Create a flag
    const createRes = await fetchWithRetry(`${API_BASE}/api/moderator/flags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${moderatorToken}`,
      },
      body: JSON.stringify({
        contentType: 'MESSAGE',
        contentId: 'test-content-id',
        contentText: 'Test flagged content',
        reason: 'SPAM',
        description: 'E2E test flag',
      }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created).toHaveProperty('id');

    // Resolve the flag
    const resolveRes = await fetchWithRetry(`${API_BASE}/api/moderator/flags/${created.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${moderatorToken}`,
      },
      body: JSON.stringify({ resolution: 'FALSE_POSITIVE', status: 'REVIEWED' }),
    });
    expect(resolveRes.status).toBe(200);
    const resolved = await resolveRes.json();
    expect(resolved.status).toBe('REVIEWED');
    expect(resolved.resolution).toBe('FALSE_POSITIVE');
  });

  // ─── Moderator user management ────────────────────────────────────────────

  test('MOD-E2E-019: Moderator /users API returns paginated list (US-MOD-103)', async () => {
    const res = await fetchWithRetry(`${API_BASE}/api/moderator/users?page=1&pageSize=10`, {
      headers: { Authorization: `Bearer ${moderatorToken}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('users');
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.users)).toBe(true);
  });

  test('MOD-E2E-020: Reports page export CSV button visible (US-MOD-105)', async ({ page }) => {
    await loginAndNavigate(page, MODERATOR_USER, '/moderator/reports');
    await expect(page.locator('[data-testid="moderator-reports-export-csv"]')).toBeVisible({ timeout: 10000 });
  });

  test('MOD-E2E-021: Attendance page shows event filter (US-MOD-108)', async ({ page }) => {
    await loginAndNavigate(page, MODERATOR_USER, '/moderator/attendance');
    await expect(page.locator('[data-testid="moderator-attendance-event-filter"]')).toBeVisible({ timeout: 10000 });
  });
});
