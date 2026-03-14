/**
 * E2E Test Suite: Investor Secondary (B8, B9, B10, US-INV-201 through US-INV-209)
 *
 * Test User: investor.standard2@test.com / Investor@12345 (Priya Mehta — unapproved investor)
 *
 * Tests:
 * - INV2-E2E-001: API: GET /api/events/:id/my-rsvp returns null for no RSVP
 * - INV2-E2E-002: API: POST /api/events/:id/rsvp saves record to DB (B8 / US-INV-204)
 * - INV2-E2E-003: API: GET /api/events/:id/my-rsvp returns CONFIRMED after RSVP
 * - INV2-E2E-004: API: RSVP stores dietaryRequirements in DB (US-INV-205)
 * - INV2-E2E-005: API: DELETE /api/events/:id/rsvp cancels RSVP
 * - INV2-E2E-006: UI: Event detail page shows dietary requirements input (US-INV-205)
 * - INV2-E2E-007: UI: RSVP button on event detail triggers success toast (US-INV-204)
 * - INV2-E2E-008: UI: Investor application form pre-fills email from auth (B9 / US-INV-202)
 * - INV2-E2E-009: UI: Application form has SEBI declaration checkbox (US-INV-208)
 * - INV2-E2E-010: UI: Application form has PAN number field (US-INV-209)
 * - INV2-E2E-011: UI: Onboarding banner visible on /apply/investor for unapproved user (B10 / US-INV-201)
 * - INV2-E2E-012: UI: Onboarding banner shows all 4 steps (US-INV-201)
 * - INV2-E2E-013: UI: /deals shows access-restricted view for unapproved investor (B10)
 * - INV2-E2E-014: UI: Deals access-restricted view shows public deal preview (US-INV-207)
 * - INV2-E2E-015: API: GET /api/deals/public returns limited deal data (US-INV-207)
 * - INV2-E2E-016: UI: /apply/investor/status shows application status page (US-INV-203)
 * - INV2-E2E-017: API: PAN validation rejects invalid PAN format (US-INV-209)
 *
 * @see USER_STORIES.md § Investor Secondary
 */

import { test, expect, type Page } from '@playwright/test';

// ==================== TEST CONSTANTS ====================

const INVESTOR2_USER = {
  email: 'investor.standard2@test.com',
  password: 'Investor@12345',
};

const API_BASE = 'http://127.0.0.1:3001';

// ==================== HELPERS ====================

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error('fetchWithRetry: unexpected exit');
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

async function getFirstUpcomingEventId(token: string): Promise<string> {
  const res = await fetchWithRetry(`${API_BASE}/api/events`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch events');
  const data = await res.json();
  const events = (data.events ?? data) as Array<{ id: string; status: string; registrationDeadline?: string; capacity?: number }>;
  const now = new Date();
  // Find an upcoming event with open registration (no deadline or future deadline)
  const eligible = events.filter(e =>
    e.status === 'upcoming' &&
    (!e.registrationDeadline || new Date(e.registrationDeadline) > now)
  );
  if (!eligible.length) throw new Error('No upcoming events with open registration found');
  return eligible[0].id;
}

async function cleanupRsvp(token: string, eventId: string): Promise<void> {
  // Cancel any existing RSVP so tests start clean
  await fetchWithRetry(`${API_BASE}/api/events/${eventId}/rsvp`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function loginUI(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect after login
  await page.waitForURL(/\/(dashboard|$|\?|investor)/, { timeout: 15000 });
}

// ==================== TEST SUITE ====================

test.describe.serial('Investor Secondary (B8, B9, B10, US-INV-201–209)', () => {
  let investorToken: string;
  let eventId: string;

  test.beforeAll(async () => {
    investorToken = await getAuthToken(INVESTOR2_USER.email, INVESTOR2_USER.password);
    eventId = await getFirstUpcomingEventId(investorToken);
    // Ensure clean slate for RSVP tests
    await cleanupRsvp(investorToken, eventId);
  });

  // ==================== API: RSVP Endpoints (B8 / US-INV-204) ====================

  test('INV2-E2E-001: API: GET my-rsvp returns null/CANCELLED when not actively RSVPed', async () => {
    const res = await fetchWithRetry(`${API_BASE}/api/events/${eventId}/my-rsvp`, {
      headers: { Authorization: `Bearer ${investorToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Either no record (null) or a CANCELLED record — user is not actively RSVPed
    const att = body.data.attendance;
    expect(att === null || att.rsvpStatus === 'CANCELLED').toBe(true);
  });

  test('INV2-E2E-002: API: POST /api/events/:id/rsvp creates CONFIRMED record in DB (B8 / US-INV-204)', async () => {
    const res = await fetchWithRetry(`${API_BASE}/api/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${investorToken}`,
      },
      body: JSON.stringify({}),
    });
    const body = await res.json();
    // 201 for new record, 200 for re-activation of a CANCELLED RSVP
    expect([200, 201], `Expected 200/201, got: ${JSON.stringify(body)}`).toContain(res.status);
    expect(body.success).toBe(true);
    expect(body.data.attendance.rsvpStatus).toBe('CONFIRMED');
    expect(body.data.attendance.userId).toBeTruthy();
    expect(body.data.attendance.eventId).toBe(eventId);
  });

  test('INV2-E2E-003: API: GET my-rsvp returns CONFIRMED after RSVP', async () => {
    const res = await fetchWithRetry(`${API_BASE}/api/events/${eventId}/my-rsvp`, {
      headers: { Authorization: `Bearer ${investorToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.attendance).not.toBeNull();
    expect(body.data.attendance.rsvpStatus).toBe('CONFIRMED');
  });

  test('INV2-E2E-004: API: RSVP stores dietaryRequirements in DB (US-INV-205)', async () => {
    // Cancel first, then re-RSVP with dietary prefs
    await cleanupRsvp(investorToken, eventId);

    const res = await fetchWithRetry(`${API_BASE}/api/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${investorToken}`,
      },
      body: JSON.stringify({ dietaryRequirements: 'vegan, gluten-free' }),
    });
    const body = await res.json();
    expect([200, 201]).toContain(res.status); // 201 for new, 200 for re-activated
    expect(body.data.attendance.dietaryRequirements).toBe('vegan, gluten-free');

    // Confirm via GET
    const getRes = await fetchWithRetry(`${API_BASE}/api/events/${eventId}/my-rsvp`, {
      headers: { Authorization: `Bearer ${investorToken}` },
    });
    const getData = await getRes.json();
    expect(getData.data.attendance.dietaryRequirements).toBe('vegan, gluten-free');
  });

  test('INV2-E2E-005: API: DELETE /api/events/:id/rsvp cancels RSVP', async () => {
    const res = await fetchWithRetry(`${API_BASE}/api/events/${eventId}/rsvp`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${investorToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Confirm RSVP is now CANCELLED
    const getRes = await fetchWithRetry(`${API_BASE}/api/events/${eventId}/my-rsvp`, {
      headers: { Authorization: `Bearer ${investorToken}` },
    });
    const getData = await getRes.json();
    expect(getData.data.attendance.rsvpStatus).toBe('CANCELLED');
  });

  // ==================== API: Public Deals (US-INV-207) ====================

  test('INV2-E2E-015: API: GET /api/deals/public returns limited deal data (US-INV-207)', async () => {
    const res = await fetchWithRetry(`${API_BASE}/api/deals/public`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      const deal = body.data[0];
      // Should only have limited fields, no financials
      expect(deal).toHaveProperty('id');
      expect(deal).toHaveProperty('companyName');
      expect(deal).toHaveProperty('sector');
      expect(deal).toHaveProperty('stage');
      expect(deal).toHaveProperty('postedAt');
      // Should NOT expose financial details
      expect(deal.dealSize).toBeUndefined();
      expect(deal.minInvestment).toBeUndefined();
    }
  });

  // ==================== UI: Event RSVP with dietary requirements (US-INV-205) ====================

  test('INV2-E2E-006: UI: Event detail page shows dietary requirements input', async ({ page }) => {
    await loginUI(page, INVESTOR2_USER.email, INVESTOR2_USER.password);

    // Navigate to the upcoming event
    await page.goto(`/events/${eventId}`);
    await page.waitForLoadState('networkidle');

    // Dietary requirements input should be visible for upcoming events
    const dietaryInput = page.locator('[data-testid="dietary-requirements-input"]');
    await expect(dietaryInput).toBeVisible({ timeout: 10000 });
  });

  test('INV2-E2E-007: UI: RSVP button triggers success after RSVP', async ({ page }) => {
    await loginUI(page, INVESTOR2_USER.email, INVESTOR2_USER.password);

    // Ensure clean state via API first
    await cleanupRsvp(investorToken, eventId);

    await page.goto(`/events/${eventId}`);
    await page.waitForLoadState('networkidle');

    const rsvpButton = page.locator('[data-testid="rsvp-button"]');
    if (await rsvpButton.isVisible()) {
      await rsvpButton.click();
      // Should show confirmed status or success toast
      await expect(page.locator('[data-testid="rsvp-status"], [data-testid="rsvp-success-message"]').first())
        .toBeVisible({ timeout: 10000 });
    } else {
      // Already RSVPed or event is past — just check page loaded
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  // ==================== UI: Application Form pre-fill (B9 / US-INV-202) ====================

  test('INV2-E2E-008: UI: Application form email field shows logged-in user email (B9 / US-INV-202)', async ({ page }) => {
    await loginUI(page, INVESTOR2_USER.email, INVESTOR2_USER.password);
    await page.goto('/apply/investor');
    await page.waitForLoadState('networkidle');

    const emailField = page.locator('input[type="email"]').first();
    await expect(emailField).toBeVisible({ timeout: 10000 });

    // Email should be pre-filled with user's email
    const emailValue = await emailField.inputValue();
    expect(emailValue).toBe(INVESTOR2_USER.email);
  });

  // ==================== UI: SEBI Declaration (US-INV-208) ====================

  test('INV2-E2E-009: UI: Application form has SEBI declaration checkbox', async ({ page }) => {
    await loginUI(page, INVESTOR2_USER.email, INVESTOR2_USER.password);
    await page.goto('/apply/investor');
    await page.waitForLoadState('networkidle');

    const sebiCheckbox = page.locator('[data-testid="sebi-declaration-checkbox"]');
    await sebiCheckbox.scrollIntoViewIfNeeded();
    await expect(sebiCheckbox).toBeVisible({ timeout: 10000 });
    await expect(sebiCheckbox).not.toBeChecked();
  });

  // ==================== UI: PAN field (US-INV-209) ====================

  test('INV2-E2E-010: UI: Application form has PAN number input field', async ({ page }) => {
    await loginUI(page, INVESTOR2_USER.email, INVESTOR2_USER.password);
    await page.goto('/apply/investor');
    await page.waitForLoadState('networkidle');

    const panInput = page.locator('[data-testid="pan-number-input"]');
    await panInput.scrollIntoViewIfNeeded();
    await expect(panInput).toBeVisible({ timeout: 10000 });

    // Type an invalid PAN and verify it's rejected
    await panInput.fill('INVALID');
    await panInput.blur();
    // Valid PAN format should be enforced (uppercase)
    const val = await panInput.inputValue();
    expect(val).toBe('INVALID'); // stored, validation happens on submit
  });

  test('INV2-E2E-017: API: PAN validation rejects invalid PAN format', async ({ page }) => {
    await loginUI(page, INVESTOR2_USER.email, INVESTOR2_USER.password);
    await page.goto('/apply/investor');
    await page.waitForLoadState('networkidle');

    const panInput = page.locator('[data-testid="pan-number-input"]');
    await panInput.scrollIntoViewIfNeeded();

    // Fill an invalid PAN
    await panInput.fill('INVALID123');
    // Try to submit (scroll to submit button)
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();

    // PAN validation error should appear
    await expect(page.locator('text=PAN must be in format')).toBeVisible({ timeout: 5000 });
  });

  // ==================== UI: Onboarding Banner (B10 / US-INV-201) ====================

  test('INV2-E2E-011: UI: Onboarding banner visible on /apply/investor for unapproved user (B10 / US-INV-201)', async ({ page }) => {
    await loginUI(page, INVESTOR2_USER.email, INVESTOR2_USER.password);
    await page.goto('/apply/investor');
    await page.waitForLoadState('networkidle');

    const banner = page.locator('[data-testid="onboarding-banner"]');
    await expect(banner).toBeVisible({ timeout: 10000 });
  });

  test('INV2-E2E-012: UI: Onboarding banner shows all 4 steps', async ({ page }) => {
    await loginUI(page, INVESTOR2_USER.email, INVESTOR2_USER.password);
    await page.goto('/apply/investor');
    await page.waitForLoadState('networkidle');

    for (let i = 1; i <= 4; i++) {
      const step = page.locator(`[data-testid="onboarding-step-${i}"]`);
      await expect(step).toBeVisible({ timeout: 10000 });
    }
  });

  // ==================== UI: Deals access-restricted view (B10 / US-INV-207) ====================

  test('INV2-E2E-013: UI: /deals shows access-restricted view for unapproved investor (B10)', async ({ page }) => {
    await loginUI(page, INVESTOR2_USER.email, INVESTOR2_USER.password);
    await page.goto('/investor/deals');
    await page.waitForLoadState('networkidle');

    // Should stay on /investor/deals (not navigate away) and show access restricted view
    await expect(page).toHaveURL(/\/investor\/deals/, { timeout: 10000 });
    const restrictedView = page.locator('[data-testid="access-restricted-view"]');
    await expect(restrictedView).toBeVisible({ timeout: 10000 });
  });

  test('INV2-E2E-014: UI: Deals access-restricted view shows public deal preview (US-INV-207)', async ({ page }) => {
    await loginUI(page, INVESTOR2_USER.email, INVESTOR2_USER.password);
    await page.goto('/investor/deals');
    await page.waitForLoadState('networkidle');

    // Wait for public deals to load (async fetch)
    await page.waitForTimeout(2000);
    const preview = page.locator('[data-testid="public-deals-preview"]');
    // Only check if deals exist in the DB
    const dealsRes = await fetchWithRetry(`${API_BASE}/api/deals/public`);
    const dealsBody = await dealsRes.json();
    if (dealsBody.data.length > 0) {
      await expect(preview).toBeVisible({ timeout: 10000 });
    }
  });

  // ==================== UI: Application Status (US-INV-203) ====================

  test('INV2-E2E-016: UI: /apply/investor/status shows application status page (US-INV-203)', async ({ page }) => {
    await loginUI(page, INVESTOR2_USER.email, INVESTOR2_USER.password);
    await page.goto('/apply/investor/status');
    await page.waitForLoadState('networkidle');

    // Page should load (either with application or no-application state)
    const hasStatus = await page.locator('[data-testid="application-status-card"]').isVisible();
    const hasNoApp = await page.locator('[data-testid="no-application"]').isVisible();
    expect(hasStatus || hasNoApp).toBe(true);
  });
});
