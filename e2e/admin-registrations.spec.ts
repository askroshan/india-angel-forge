/**
 * E2E Test Suite: Admin Event Registrations Display
 * 
 * User Stories: US-ADMIN-REG-001 through US-ADMIN-REG-005
 * 
 * Tests verify:
 * - Admin can view event registrations with user details visible (not blank)
 * - Registration list shows full_name, email, status for each registrant
 * - Event filtering by event_id works correctly
 * - Proper data-testid attributes exist for all UI elements
 * - Seed data provides 30 events with registrations
 * 
 * Test Coverage (10 tests):
 * - REG-E2E-001: Admin registrations API returns flattened user data
 * - REG-E2E-002: Admin registrations API filters by event_id
 * - REG-E2E-003: Admin dashboard shows event list with registrations
 * - REG-E2E-004: Clicking registrations icon reveals user names and emails
 * - REG-E2E-005: Registration rows have proper data-testid attributes
 * - REG-E2E-006: Seed data provides at least 30 events
 * - REG-E2E-007: Events have associated registration records
 * - REG-E2E-008: Non-admin cannot access registrations API
 * - REG-E2E-009: Admin events page shows registration count per event
 * - REG-E2E-010: Registration status badges display correctly
 * 
 * Trace IDs: REG-E2E-001 to REG-E2E-010
 */

import { test, expect, Page } from '@playwright/test';

// Only run in chromium for faster E2E tests
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

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error('unreachable');
}

// ==================== API-LEVEL TESTS ====================

test.describe('US-ADMIN-REG-001: Admin Registrations API', () => {

  test('REG-E2E-001: registrations API returns flattened user data with full_name and email', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    const response = await fetchWithRetry(`${API_BASE}/api/admin/event-registrations`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    expect(response.ok).toBe(true);
    const registrations = await response.json();
    expect(Array.isArray(registrations)).toBe(true);
    expect(registrations.length).toBeGreaterThan(0);

    // Each registration must have flattened full_name and email (not nested in user object)
    const firstReg = registrations[0];
    expect(firstReg).toHaveProperty('full_name');
    expect(firstReg).toHaveProperty('email');
    expect(firstReg).toHaveProperty('status');
    expect(typeof firstReg.full_name).toBe('string');
    expect(firstReg.full_name.length).toBeGreaterThan(0);
    expect(typeof firstReg.email).toBe('string');
    expect(firstReg.email).toContain('@');
  });

  test('REG-E2E-002: registrations API filters by event_id correctly', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    // First get all events
    const eventsResponse = await fetchWithRetry(`${API_BASE}/api/admin/events`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const events = await eventsResponse.json();
    expect(events.length).toBeGreaterThan(0);
    const targetEvent = events[0];

    // Filter registrations by event_id
    const regResponse = await fetchWithRetry(
      `${API_BASE}/api/admin/event-registrations?event_id=${targetEvent.id}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    expect(regResponse.ok).toBe(true);
    const regs = await regResponse.json();
    expect(Array.isArray(regs)).toBe(true);

    // All returned registrations should belong to the target event
    for (const reg of regs) {
      expect(reg.eventId).toBe(targetEvent.id);
    }
  });

  test('REG-E2E-008: non-admin cannot access registrations API', async ({ page }) => {
    await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
    const token = await getAuthToken(page);

    const response = await fetchWithRetry(`${API_BASE}/api/admin/event-registrations`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    expect(response.status).toBe(403);
  });
});

// ==================== SEED DATA TESTS ====================

test.describe('US-ADMIN-REG-002: Event Seed Data', () => {

  test('REG-E2E-006: seed data provides at least 30 events', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    const response = await fetchWithRetry(`${API_BASE}/api/admin/events`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    expect(response.ok).toBe(true);
    const events = await response.json();
    expect(events.length).toBeGreaterThanOrEqual(30);
  });

  test('REG-E2E-007: events have associated registration records', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    const response = await fetchWithRetry(`${API_BASE}/api/admin/event-registrations`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    expect(response.ok).toBe(true);
    const registrations = await response.json();
    expect(registrations.length).toBeGreaterThan(0);

    // Should have registrations from multiple events
    const uniqueEvents = new Set(registrations.map((r: any) => r.eventId));
    expect(uniqueEvents.size).toBeGreaterThanOrEqual(3);
  });
});

// ==================== UI-LEVEL TESTS ====================

test.describe('US-ADMIN-REG-003: Admin Dashboard Registrations UI', () => {

  test('REG-E2E-003: admin dashboard events tab shows event cards', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // The Events tab should be active by default
    const eventCards = page.locator('[data-testid="admin-event-card"]');
    await expect(eventCards.first()).toBeVisible({ timeout: 15000 });

    // Should show multiple events
    const count = await eventCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('REG-E2E-004: clicking registrations icon shows user names and emails', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Wait for events to load
    const eventCards = page.locator('[data-testid="admin-event-card"]');
    await expect(eventCards.first()).toBeVisible({ timeout: 15000 });

    // Click the registrations toggle button on first event
    const regToggle = page.locator('[data-testid="toggle-registrations"]').first();
    await regToggle.click();

    // Wait for the registrations section to appear
    const regSection = page.locator('[data-testid="registrations-section"]').first();
    await expect(regSection).toBeVisible({ timeout: 10000 });

    // Check if registration rows contain name and email text
    const regRows = page.locator('[data-testid="registration-row"]');
    const rowCount = await regRows.count();

    if (rowCount > 0) {
      // First row should have visible name and email
      const firstRow = regRows.first();
      const nameEl = firstRow.locator('[data-testid="registration-name"]');
      const emailEl = firstRow.locator('[data-testid="registration-email"]');

      await expect(nameEl).toBeVisible();
      await expect(emailEl).toBeVisible();

      // Name should not be empty
      const nameText = await nameEl.textContent();
      expect(nameText?.trim().length).toBeGreaterThan(0);

      // Email should contain @
      const emailText = await emailEl.textContent();
      expect(emailText).toContain('@');
    }
  });

  test('REG-E2E-005: registration rows have proper data-testid attributes', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const eventCards = page.locator('[data-testid="admin-event-card"]');
    await expect(eventCards.first()).toBeVisible({ timeout: 15000 });

    // Toggle registrations on first event
    const regToggle = page.locator('[data-testid="toggle-registrations"]').first();
    await regToggle.click();

    const regSection = page.locator('[data-testid="registrations-section"]').first();
    await expect(regSection).toBeVisible({ timeout: 10000 });

    // Verify the section has heading
    await expect(regSection.locator('[data-testid="registrations-heading"]')).toBeVisible();

    // If there are registrations, check row structure
    const regRows = page.locator('[data-testid="registration-row"]');
    const rowCount = await regRows.count();

    if (rowCount > 0) {
      const firstRow = regRows.first();
      await expect(firstRow.locator('[data-testid="registration-name"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="registration-email"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="registration-status"]')).toBeVisible();
    }
  });

  test('REG-E2E-009: admin events page shows registration count per event', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const eventCards = page.locator('[data-testid="admin-event-card"]');
    await expect(eventCards.first()).toBeVisible({ timeout: 15000 });

    // Each event card should show a registration count
    const firstCard = eventCards.first();
    const regCount = firstCard.locator('[data-testid="event-registration-count"]');
    await expect(regCount).toBeVisible();

    const countText = await regCount.textContent();
    // Should contain a number
    expect(countText).toMatch(/\d+/);
  });

  test('REG-E2E-010: registration status badges display correctly', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const eventCards = page.locator('[data-testid="admin-event-card"]');
    await expect(eventCards.first()).toBeVisible({ timeout: 15000 });

    // Toggle registrations on first event
    const regToggle = page.locator('[data-testid="toggle-registrations"]').first();
    await regToggle.click();

    const regSection = page.locator('[data-testid="registrations-section"]').first();
    await expect(regSection).toBeVisible({ timeout: 10000 });

    // Check status badges
    const regRows = page.locator('[data-testid="registration-row"]');
    const rowCount = await regRows.count();

    if (rowCount > 0) {
      const statusBadge = regRows.first().locator('[data-testid="registration-status"]');
      await expect(statusBadge).toBeVisible();
      const statusText = await statusBadge.textContent();
      expect(['registered', 'waitlist', 'confirmed', 'attended', 'cancelled']).toContain(statusText?.trim().toLowerCase());
    }
  });
});
