/**
 * E2E Tests: Guest / User Role — Bug Fixes & New User Stories
 *
 * Branch: 2026-03-13-GuestBugsandfeatures
 *
 * Covers:
 *   BUG-GUEST-001  /investors CTA buttons do nothing (no navigation)
 *   BUG-GUEST-002  /membership "Verify Identity" redirects to wrong port 3002
 *   BUG-GUEST-003  /deals returns 403 for user role (should show public preview)
 *   BUG-GUEST-004  /verify-certificate/:code returns 404 (route missing)
 *   BUG-GUEST-005  My Registrations shows 0 after successful RSVP
 *
 *  US-GUEST-001  Public deal preview for all authenticated users
 *  US-GUEST-002  Functional membership plan CTAs on /investors
 *  US-GUEST-003  /verify-certificate public page
 *  US-GUEST-004  Identity verification port fix for membership
 *  US-GUEST-005  My Registrations RSVP consistency
 */

import { test, expect, Page } from '@playwright/test';

const API_BASE = 'http://localhost:3001';
const BASE_URL = 'http://localhost:8082';

const GUEST_EMAIL = 'user@test.com';
const GUEST_PASSWORD = 'User@12345';
const GUEST_ID = '810d1ebe-2191-40fb-a44d-250c88e79142';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getToken(email: string, password: string): Promise<string> {
  const resp = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await resp.json();
  return body.token as string;
}

async function injectToken(page: Page, email: string, password: string) {
  const token = await getToken(email, password);
  const resp = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const { user } = await resp.json();
  await page.goto(BASE_URL);
  await page.evaluate(({ tok, usr }) => {
    localStorage.setItem('auth_token', tok);
    localStorage.setItem('auth_user', JSON.stringify(usr));
  }, { tok: token, usr: user });
  await page.reload();
  return token;
}

// =========================================================================
// BUG-GUEST-001 / US-GUEST-002 — /investors CTA buttons
// =========================================================================

test.describe('BUG-GUEST-001: /investors CTA buttons navigate correctly', () => {
  test('API: guest user login returns valid token with user role', async () => {
    // BUG-GUEST-001: /api/auth/me is not implemented; use login response which
    // returns user.roles as a flat string array e.g. ['user']
    const loginResp = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: GUEST_EMAIL, password: GUEST_PASSWORD }),
    });
    const data = await loginResp.json();
    expect(data.token).toBeTruthy();
    const roles: string[] = data.user?.roles ?? [];
    expect(roles).toContain('user');
    expect(roles).not.toContain('investor');
  });

  test('UI: /investors page loads with guest user logged in', async ({ page }) => {
    await injectToken(page, GUEST_EMAIL, GUEST_PASSWORD);
    await page.goto(`${BASE_URL}/investors`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('UI: "Join as Standard Member" button is visible on /investors', async ({ page }) => {
    await injectToken(page, GUEST_EMAIL, GUEST_PASSWORD);
    await page.goto(`${BASE_URL}/investors`);
    const btn = page.getByRole('button', { name: /join as standard member/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('UI: "Apply for Operator Plan" button is visible on /investors', async ({ page }) => {
    await injectToken(page, GUEST_EMAIL, GUEST_PASSWORD);
    await page.goto(`${BASE_URL}/investors`);
    const btn = page.getByRole('button', { name: /apply for operator plan/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('US-GUEST-002: Clicking "Join as Standard Member" navigates to /apply/investor for non-investor users', async ({ page }) => {
    await injectToken(page, GUEST_EMAIL, GUEST_PASSWORD);
    await page.goto(`${BASE_URL}/investors`);
    const btn = page.getByRole('button', { name: /join as standard member/i });
    await btn.click();
    // Should navigate to /apply/investor (not stay on /investors or show error)
    await expect(page).toHaveURL(/\/apply\/investor/, { timeout: 5000 });
  });

  test('US-GUEST-002: Clicking "Apply for Operator Plan" navigates to /apply/investor for non-investor users', async ({ page }) => {
    await injectToken(page, GUEST_EMAIL, GUEST_PASSWORD);
    await page.goto(`${BASE_URL}/investors`);
    const btn = page.getByRole('button', { name: /apply for operator plan/i });
    await btn.click();
    await expect(page).toHaveURL(/\/apply\/investor/, { timeout: 5000 });
  });

  test('UI: "Join as Standard Member" unauthenticated redirects to /auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/investors`);
    const btn = page.getByRole('button', { name: /join as standard member/i });
    await btn.click();
    await expect(page).toHaveURL(/\/(auth|login)/, { timeout: 5000 });
  });
});

// =========================================================================
// BUG-GUEST-002 / US-GUEST-004 — Identity verification port on /membership
// =========================================================================

test.describe('BUG-GUEST-002: Identity verification uses correct port 8082', () => {
  test('API: POST /api/verification/start as guest user returns inquiryUrl with port 8082', async () => {
    const token = await getToken(GUEST_EMAIL, GUEST_PASSWORD);
    const resp = await fetch(`${API_BASE}/api/verification/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    expect(resp.status).toBe(200);
    const data = await resp.json();
    const url: string = data.inquiryUrl ?? '';
    expect(url).toBeTruthy();
    expect(url).toContain('8082');
    expect(url).not.toContain('3002');
    expect(url).toContain('/membership');
  });

  test('UI: /membership page loads for guest user', async ({ page }) => {
    await injectToken(page, GUEST_EMAIL, GUEST_PASSWORD);
    await page.goto(`${BASE_URL}/membership`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('UI: Verify Identity button is present on /membership (data-testid)', async ({ page }) => {
    await injectToken(page, GUEST_EMAIL, GUEST_PASSWORD);
    await page.goto(`${BASE_URL}/membership`);
    // Button text can be 'Verify Identity' or 'Continue Verification' depending
    // on verification state — use stable data-testid for reliability
    await page.waitForLoadState('networkidle');
    const btn = page.locator('[data-testid="membership-verify-btn"]');
    await expect(btn).toBeVisible({ timeout: 8000 });
  });
});

// =========================================================================
// BUG-GUEST-003 / US-GUEST-001 — /deals shows public preview for guest
// =========================================================================

test.describe('BUG-GUEST-003: /deals shows public preview for user role', () => {
  test('API: GET /api/deals/public returns public deals without auth', async () => {
    const resp = await fetch(`${API_BASE}/api/deals/public`);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('API: /api/applications/investor-application for guest user returns 404 or empty (not approved)', async () => {
    const token = await getToken(GUEST_EMAIL, GUEST_PASSWORD);
    const resp = await fetch(`${API_BASE}/api/applications/investor-application`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // 404 means no application, which should trigger the public preview path
    const isRelevantStatus = resp.status === 404 || resp.status === 200;
    expect(isRelevantStatus).toBe(true);
    if (resp.status === 200) {
      const data = await resp.json();
      const status = (data?.status ?? '').toLowerCase();
      expect(status).not.toBe('approved');
    }
  });

  test('US-GUEST-001: /deals page is accessible to authenticated user role (no 403)', async ({ page }) => {
    await injectToken(page, GUEST_EMAIL, GUEST_PASSWORD);
    await page.goto(`${BASE_URL}/deals`);
    // Should NOT show 403 or redirect to auth — should show public preview
    await expect(page).not.toHaveURL(/\/(auth|login)/);
    await expect(page.locator('body')).not.toContainText('403');
    await expect(page.locator('body')).not.toContainText('Access Denied');
  });

  test('US-GUEST-001: /deals page shows OnboardingBanner or public deal preview for user role', async ({ page }) => {
    await injectToken(page, GUEST_EMAIL, GUEST_PASSWORD);
    await page.goto(`${BASE_URL}/deals`);
    // Wait for the page to load — should show either onboarding banner or public deals
    await page.waitForLoadState('networkidle');
    // Should contain apply-related content or public deal cards
    const pageContent = await page.locator('body').textContent();
    const hasRelevantContent =
      (pageContent ?? '').toLowerCase().includes('apply') ||
      (pageContent ?? '').toLowerCase().includes('deal') ||
      (pageContent ?? '').toLowerCase().includes('invest');
    expect(hasRelevantContent).toBe(true);
  });

  test('US-GUEST-001: OnboardingBanner has link to apply page', async ({ page }) => {
    await injectToken(page, GUEST_EMAIL, GUEST_PASSWORD);
    await page.goto(`${BASE_URL}/deals`);
    await page.waitForLoadState('networkidle');
    // Check for a link/button pointing to /apply/investor
    const applyLink = page.locator('a[href*="/apply/investor"], button:has-text("Apply")').first();
    await expect(applyLink).toBeVisible({ timeout: 5000 });
  });
});

// =========================================================================
// BUG-GUEST-004 / US-GUEST-003 — /verify-certificate/:code route
// =========================================================================

test.describe('BUG-GUEST-004: /verify-certificate/:code page works', () => {
  test('UI: /verify-certificate (no param) page loads without auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/verify-certificate`);
    await expect(page.locator('h1')).toContainText(/verify certificate/i);
    await expect(page.locator('[data-testid="certificate-id-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="verify-button"]')).toBeVisible();
  });

  test('US-GUEST-003: /verify-certificate/:code route exists and pre-fills the certificate ID', async ({ page }) => {
    const testCertId = 'CERT-2025-TEST-99999';
    await page.goto(`${BASE_URL}/verify-certificate/${testCertId}`);
    await page.waitForLoadState('networkidle');
    // Page should not 404 — it should show the certificate verification form
    await expect(page.locator('h1')).toContainText(/verify certificate/i);
    // The input should be pre-filled with the certificate ID from the URL
    const input = page.locator('[data-testid="certificate-id-input"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue(testCertId);
  });

  test('US-GUEST-003: Verifying an invalid certificate shows error state', async ({ page }) => {
    await page.goto(`${BASE_URL}/verify-certificate/CERT-INVALID-00000`);
    await page.waitForLoadState('networkidle');
    // After auto-verifying the invalid cert, should show error
    await expect(page.locator('[data-testid="verification-result"]')).toBeVisible({ timeout: 8000 });
    // Should show not-found/error
    const result = await page.locator('[data-testid="verification-result"]').textContent();
    expect((result ?? '').toLowerCase()).toMatch(/not found|invalid|failed|error/i);
  });

  test('API: GET /api/certificates/verify/:id returns 404 for invalid cert', async () => {
    const resp = await fetch(`${API_BASE}/api/certificates/verify/CERT-INVALID-00000`);
    const data = await resp.json();
    expect(data.success).toBe(false);
    expect(data.verified).toBe(false);
  });

  test('US-GUEST-003: /verify-certificate is publicly accessible (no auth required)', async ({ page }) => {
    await page.goto(`${BASE_URL}/verify-certificate`);
    await expect(page).not.toHaveURL(/\/(auth|login)/);
    await expect(page.locator('h1')).toContainText(/verify/i);
  });
});

// =========================================================================
// BUG-GUEST-005 / US-GUEST-005 — My Registrations shows RSVP records
// =========================================================================

test.describe('BUG-GUEST-005: My Registrations shows RSVP from event_attendance', () => {
  test('DB/API: Guest user has at least 1 confirmed RSVP', async () => {
    const token = await getToken(GUEST_EMAIL, GUEST_PASSWORD);
    const resp = await fetch(`${API_BASE}/api/events/my-registrations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    const sources = data.map((r: { _source?: string }) => r._source ?? 'registration');
    expect(sources).toContain('attendance');
  });

  test('API: Attendance records include event title', async () => {
    const token = await getToken(GUEST_EMAIL, GUEST_PASSWORD);
    const resp = await fetch(`${API_BASE}/api/events/my-registrations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json();
    const attRec = data.find((r: { _source?: string }) => r._source === 'attendance');
    expect(attRec).toBeTruthy();
    const title = attRec?.events?.title ?? attRec?.event?.title ?? '';
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('UI: /events page shows My Registrations section for logged-in guest', async ({ page }) => {
    await injectToken(page, GUEST_EMAIL, GUEST_PASSWORD);
    await page.goto(`${BASE_URL}/events`);
    await page.waitForLoadState('networkidle');
    // My Registrations section should be visible
    const section = page.locator('[data-testid="upcoming-registrations-section"], [data-testid="past-registrations-section"]').first();
    await expect(section).toBeVisible({ timeout: 8000 });
  });

  test('US-GUEST-005: My Registrations section shows at least 1 event for guest user', async ({ page }) => {
    await injectToken(page, GUEST_EMAIL, GUEST_PASSWORD);
    await page.goto(`${BASE_URL}/events`);
    await page.waitForLoadState('networkidle');
    // The cards inside the registration sections should be visible
    const cards = page.locator('[data-testid^="registration-card-"]');
    await expect(cards.first()).toBeVisible({ timeout: 8000 });
  });

  test('US-GUEST-005: /my-registrations standalone page also shows guest RSVPs', async ({ page }) => {
    await injectToken(page, GUEST_EMAIL, GUEST_PASSWORD);
    await page.goto(`${BASE_URL}/my-registrations`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    const cards = page.locator('[data-testid^="registration-card-"]');
    await expect(cards.first()).toBeVisible({ timeout: 8000 });
  });
});

// =========================================================================
// Cross-cutting: Access Control verification
// =========================================================================

test.describe('Access Control: Guest role boundaries', () => {
  test('Unauthenticated user cannot access /membership (redirected)', async ({ page }) => {
    await page.goto(`${BASE_URL}/membership`);
    await expect(page).toHaveURL(/\/(auth|login)/, { timeout: 5000 });
  });

  test('Guest user CAN access /events (public page)', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`);
    await expect(page).not.toHaveURL(/\/(auth|login)/);
  });

  test('Guest user CAN access /investors (public page)', async ({ page }) => {
    await page.goto(`${BASE_URL}/investors`);
    await expect(page).not.toHaveURL(/\/(auth|login)/);
  });

  test('Guest user CAN access /verify-certificate (public page)', async ({ page }) => {
    await page.goto(`${BASE_URL}/verify-certificate`);
    await expect(page).not.toHaveURL(/\/(auth|login)/);
  });
});
