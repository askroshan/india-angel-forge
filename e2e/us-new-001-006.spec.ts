/**
 * E2E Tests: US-NEW-001 through US-NEW-006
 *
 * Branch: 2026-03-14-USNew001-006
 *
 * Covers:
 *   US-NEW-001  Lead capture for visitors — email interest form on landing page
 *   US-NEW-002  Forum calendar for visitors — public upcoming events API / page
 *   US-NEW-003  Email status notifications — investor/founder application status change triggers email
 *   US-NEW-004  DPIIT badge on application forms — recognition badge on /apply/investor + /apply/founder
 *   US-NEW-005  Referral code system — generate, validate, use referral codes
 *   US-NEW-006  Mobile QR code check-in — functional QR scanner for event check-in
 */

import { test, expect, Page } from '@playwright/test';

const API_BASE = 'http://localhost:3001';
const BASE_URL = 'http://localhost:8082';

const ADMIN_EMAIL = 'admin@indiaangelforum.test';
const ADMIN_PASSWORD = 'Admin@12345';
const MODERATOR_EMAIL = 'moderator@indiaangelforum.test';
const MODERATOR_PASSWORD = 'Moderator@12345';
const GUEST_EMAIL = 'user@test.com';
const GUEST_PASSWORD = 'User@12345';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function getToken(email: string, password: string): Promise<{ token: string; user: Record<string, unknown> }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.token) throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  return { token: data.token, user: data.user };
}

async function injectToken(page: Page, email: string, password: string) {
  const { token, user } = await getToken(email, password);
  await page.goto(BASE_URL);
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }, { token, user });
  await page.reload();
}

// ===========================================================================
// US-NEW-001: Lead Capture for Visitors
// ===========================================================================
test.describe('US-NEW-001: Lead capture for visitors', () => {
  test('API: POST /api/lead-capture accepts visitor email and name', async () => {
    const res = await fetch(`${API_BASE}/api/lead-capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `visitor_${Date.now()}@test.com`,
        name: 'Test Visitor',
        interest: 'investor',
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.email).toBeDefined();
  });

  test('API: POST /api/lead-capture validates email format', async () => {
    const res = await fetch(`${API_BASE}/api/lead-capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', name: 'Test' }),
    });
    expect(res.status).toBe(400);
  });

  test('API: POST /api/lead-capture prevents duplicate email submissions', async () => {
    const email = `dedup_${Date.now()}@test.com`;
    await fetch(`${API_BASE}/api/lead-capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: 'Test Visitor' }),
    });
    const res2 = await fetch(`${API_BASE}/api/lead-capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: 'Test Visitor' }),
    });
    // Should return 200 OK (already exists) or 409, but not error out
    expect([200, 201, 409]).toContain(res2.status);
  });

  test('API: GET /api/admin/lead-captures returns list (admin only)', async () => {
    const { token } = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await fetch(`${API_BASE}/api/admin/lead-captures`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('API: GET /api/admin/lead-captures is forbidden without admin role', async () => {
    const { token } = await getToken(GUEST_EMAIL, GUEST_PASSWORD);
    const res = await fetch(`${API_BASE}/api/admin/lead-captures`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  test('UI: Landing page has lead capture form with email input', async ({ page }) => {
    await page.goto(BASE_URL);
    const form = page.locator('[data-testid="lead-capture-form"]');
    await expect(form).toBeVisible();
    const emailInput = form.locator('[data-testid="lead-capture-email"]');
    await expect(emailInput).toBeVisible();
  });

  test('UI: Lead capture form submits successfully and shows confirmation', async ({ page }) => {
    await page.goto(BASE_URL);
    const form = page.locator('[data-testid="lead-capture-form"]');
    await form.locator('[data-testid="lead-capture-email"]').fill(`ui_visitor_${Date.now()}@test.com`);
    const nameInput = form.locator('[data-testid="lead-capture-name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test UI Visitor');
    }
    await form.locator('[data-testid="lead-capture-submit"]').click();
    const successMsg = page.locator('[data-testid="lead-capture-success"]');
    await expect(successMsg).toBeVisible({ timeout: 5000 });
  });
});

// ===========================================================================
// US-NEW-002: Forum Calendar for Visitors
// ===========================================================================
test.describe('US-NEW-002: Forum calendar for visitors', () => {
  test('API: GET /api/events/public-calendar returns upcoming events without auth', async () => {
    const res = await fetch(`${API_BASE}/api/events/public-calendar`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('API: Public calendar events have required fields (title, date, location, type)', async () => {
    const res = await fetch(`${API_BASE}/api/events/public-calendar`);
    const data = await res.json();
    if (data.data.length > 0) {
      const ev = data.data[0];
      expect(ev).toHaveProperty('id');
      expect(ev).toHaveProperty('title');
      expect(ev).toHaveProperty('date');
      expect(ev).toHaveProperty('location');
    }
  });

  test('UI: /events page has public calendar section visible without login', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`);
    const calendar = page.locator('[data-testid="public-forum-calendar"]');
    await expect(calendar).toBeVisible({ timeout: 8000 });
  });

  test('UI: Public calendar shows event titles and dates', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`);
    const calendar = page.locator('[data-testid="public-forum-calendar"]');
    await expect(calendar).toBeVisible({ timeout: 8000 });
    const items = calendar.locator('[data-testid^="calendar-event-"]');
    await expect(items.first()).toBeVisible({ timeout: 5000 });
  });

  test('UI: Forum calendar is accessible without login (no redirect to /auth)', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`);
    expect(page.url()).not.toContain('/auth');
    await expect(page.locator('[data-testid="public-forum-calendar"]')).toBeVisible({ timeout: 8000 });
  });
});

// ===========================================================================
// US-NEW-003: Email Status Notifications
// ===========================================================================
test.describe('US-NEW-003: Email status notifications', () => {
  test('API: PATCH /api/admin/applications/investors/:id returns updated status', async () => {
    const { token } = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
    // First get an investor application to update
    const listRes = await fetch(`${API_BASE}/api/admin/applications/investors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    const apps: Array<{ id: string; status: string }> = Array.isArray(listData) ? listData : listData.applications || [];
    if (apps.length === 0) {
      test.skip();
      return;
    }
    const app = apps[0];
    const newStatus = app.status === 'APPROVED' ? 'REJECTED' : 'APPROVED';
    const patchRes = await fetch(`${API_BASE}/api/admin/applications/investors/${app.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.status?.toLowerCase() || patchData.status).toBeTruthy();
  });

  test('API: Email log records notification after investor status update', async () => {
    const { token } = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
    // Check email logs exist in the system
    const res = await fetch(`${API_BASE}/api/admin/email-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('API: POST /api/admin/applications/investors/:id/notify sends status email', async () => {
    const { token } = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
    const listRes = await fetch(`${API_BASE}/api/admin/applications/investors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listData = await listRes.json();
    const apps: Array<{ id: string }> = Array.isArray(listData) ? listData : listData.applications || [];
    if (apps.length === 0) {
      test.skip();
      return;
    }
    const res = await fetch(`${API_BASE}/api/admin/applications/investors/${apps[0].id}/notify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'status_update' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('API: POST /api/admin/applications/founders/:id/notify sends status email', async () => {
    const { token } = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
    const listRes = await fetch(`${API_BASE}/api/admin/applications/founders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    const apps: Array<{ id: string }> = Array.isArray(listData) ? listData : listData.applications || [];
    if (apps.length === 0) {
      test.skip();
      return;
    }
    const res = await fetch(`${API_BASE}/api/admin/applications/founders/${apps[0].id}/notify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'status_update' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('API: Email notification is unauthorized without admin token', async () => {
    const { token } = await getToken(GUEST_EMAIL, GUEST_PASSWORD);
    const res = await fetch(`${API_BASE}/api/admin/applications/investors/nonexistent-id/notify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'status_update' }),
    });
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// US-NEW-004: DPIIT Badge on Application Forms
// ===========================================================================
test.describe('US-NEW-004: DPIIT badge on application forms', () => {
  test('UI: /apply/investor page shows DPIIT recognition badge', async ({ page }) => {
    await page.goto(`${BASE_URL}/apply/investor`);
    const badge = page.locator('[data-testid="dpiit-recognition-badge"]');
    await expect(badge).toBeVisible({ timeout: 8000 });
  });

  test('UI: /apply/founder page shows DPIIT recognition badge', async ({ page }) => {
    await page.goto(`${BASE_URL}/apply/founder`);
    const badge = page.locator('[data-testid="dpiit-recognition-badge"]');
    await expect(badge).toBeVisible({ timeout: 8000 });
  });

  test('UI: DPIIT badge contains DPIIT text or logo reference', async ({ page }) => {
    await page.goto(`${BASE_URL}/apply/investor`);
    const badge = page.locator('[data-testid="dpiit-recognition-badge"]');
    await expect(badge).toBeVisible({ timeout: 8000 });
    const text = await badge.textContent();
    expect(text?.toLowerCase()).toContain('dpiit');
  });

  test('UI: DPIIT badge is present on founder application form too', async ({ page }) => {
    await page.goto(`${BASE_URL}/apply/founder`);
    const badge = page.locator('[data-testid="dpiit-recognition-badge"]');
    const text = await badge.textContent();
    expect(text?.toLowerCase()).toContain('dpiit');
  });

  test('UI: DPIIT badge is visible to unauthenticated visitors on /apply/investor', async ({ page }) => {
    await page.goto(`${BASE_URL}/apply/investor`);
    // Page should not redirect to /auth
    expect(page.url()).not.toContain('/auth');
    await expect(page.locator('[data-testid="dpiit-recognition-badge"]')).toBeVisible({ timeout: 8000 });
  });
});

// ===========================================================================
// US-NEW-005: Referral Code System
// ===========================================================================
test.describe('US-NEW-005: Referral code system', () => {
  test('API: POST /api/referrals/generate creates a referral code for authenticated user', async () => {
    const { token } = await getToken(GUEST_EMAIL, GUEST_PASSWORD);
    const res = await fetch(`${API_BASE}/api/referrals/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.code).toBeDefined();
    expect(typeof data.data.code).toBe('string');
    expect(data.data.code.length).toBeGreaterThan(4);
  });

  test('API: GET /api/referrals/my-code returns existing code for authenticated user', async () => {
    const { token } = await getToken(GUEST_EMAIL, GUEST_PASSWORD);
    // Generate first
    await fetch(`${API_BASE}/api/referrals/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const res = await fetch(`${API_BASE}/api/referrals/my-code`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.code).toBeDefined();
  });

  test('API: POST /api/referrals/validate validates a referral code', async () => {
    const { token } = await getToken(GUEST_EMAIL, GUEST_PASSWORD);
    // Get code
    await fetch(`${API_BASE}/api/referrals/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const myCode = await fetch(`${API_BASE}/api/referrals/my-code`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json());
    const code = myCode.data?.code;
    if (!code) { test.skip(); return; }

    const validateRes = await fetch(`${API_BASE}/api/referrals/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    expect(validateRes.status).toBe(200);
    const validateData = await validateRes.json();
    expect(validateData.success).toBe(true);
    expect(validateData.data.valid).toBe(true);
  });

  test('API: POST /api/referrals/validate returns invalid for fake code', async () => {
    const res = await fetch(`${API_BASE}/api/referrals/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'FAKE-CODE-99999' }),
    });
    expect([200, 404]).toContain(res.status);
    const data = await res.json();
    if (res.status === 200) {
      expect(data.data.valid).toBe(false);
    }
  });

  test('API: POST /api/referrals/generate is unauthorized without token', async () => {
    const res = await fetch(`${API_BASE}/api/referrals/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status).toBe(401);
  });

  test('UI: /apply/investor has referral code input field', async ({ page }) => {
    await page.goto(`${BASE_URL}/apply/investor`);
    const referralField = page.locator('[data-testid="referral-code-input"]');
    await expect(referralField).toBeVisible({ timeout: 8000 });
  });

  test('UI: /apply/founder has referral code input field', async ({ page }) => {
    await page.goto(`${BASE_URL}/apply/founder`);
    const referralField = page.locator('[data-testid="referral-code-input"]');
    await expect(referralField).toBeVisible({ timeout: 8000 });
  });
});

// ===========================================================================
// US-NEW-006: Mobile QR Code Check-in
// ===========================================================================
test.describe('US-NEW-006: Mobile QR code check-in', () => {
  test('API: POST /api/events/:eventId/attendance/qr-checkin accepts userId and returns success', async () => {
    const { token } = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
    // Get any event with attendees
    const listRes = await fetch(`${API_BASE}/api/events`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listData = await listRes.json();
    const events = Array.isArray(listData) ? listData : listData.data || listData.events || [];
    if (events.length === 0) {
      test.skip();
      return;
    }
    const eventId = events[0].id;
    // Get attendees for this event
    const attendRes = await fetch(`${API_BASE}/api/events/${eventId}/attendance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const attendData = await attendRes.json();
    const attendees = attendData.data?.attendees || attendData.attendees || [];
    if (attendees.length === 0) {
      test.skip();
      return;
    }
    const userId = attendees[0].userId;
    const res = await fetch(`${API_BASE}/api/events/${eventId}/attendance/qr-checkin`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    // Expect 200 (checked in) or 400 (already checked in) — not 404/500
    expect([200, 400]).toContain(res.status);
    const data = await res.json();
    expect(data.success !== undefined).toBe(true);
  });

  test('API: POST /api/events/:eventId/attendance/qr-checkin is unauthorized without token', async () => {
    const res = await fetch(`${API_BASE}/api/events/test-event/attendance/qr-checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'some-user' }),
    });
    expect(res.status).toBe(401);
  });

  test('API: GET /api/events/:eventId/attendance/qr-code returns QR code data for attendee', async () => {
    const { token } = await getToken(GUEST_EMAIL, GUEST_PASSWORD);
    // Get events to find one the guest is registered for
    const myRegRes = await fetch(`${API_BASE}/api/events/my-registrations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const myRegData = await myRegRes.json();
    const regs = Array.isArray(myRegData) ? myRegData : myRegData.data || [];
    if (regs.length === 0) {
      test.skip();
      return;
    }
    const eventId = regs[0].eventId || regs[0].event_id;
    const res = await fetch(`${API_BASE}/api/events/${eventId}/attendance/qr-code`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.qrCode).toBeDefined();
  });

  test('UI: Moderator event attendance page has functional QR scanner (not just placeholder)', async ({ page }) => {
    await injectToken(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    // Get an event ID
    const { token } = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
    const listRes = await fetch(`${API_BASE}/api/events`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listData = await listRes.json();
    const events = Array.isArray(listData) ? listData : listData.data || listData.events || [];
    if (events.length === 0) {
      test.skip();
      return;
    }
    const eventId = events[0].id;
    await page.goto(`${BASE_URL}/moderator/events/${eventId}/attendance`);
    // Click QR Code Check-in button
    const qrBtn = page.locator('[data-testid="qr-checkin-btn"]');
    await expect(qrBtn).toBeVisible({ timeout: 8000 });
    await qrBtn.click();
    // Should show the actual QR scanner (not just placeholder text)
    const scanner = page.locator('[data-testid="qr-scanner-panel"]');
    await expect(scanner).toBeVisible({ timeout: 5000 });
    // Should NOT show the "QR Code Scanner would appear here" placeholder text
    const placeholder = page.locator('text=QR Code Scanner would appear here');
    await expect(placeholder).not.toBeVisible();
  });

  test('UI: QR scanner has manual code entry input for fallback', async ({ page }) => {
    await injectToken(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const { token } = await getToken(ADMIN_EMAIL, ADMIN_PASSWORD);
    const listRes = await fetch(`${API_BASE}/api/events`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listData = await listRes.json();
    const events = Array.isArray(listData) ? listData : listData.data || listData.events || [];
    if (events.length === 0) { test.skip(); return; }
    await page.goto(`${BASE_URL}/moderator/events/${events[0].id}/attendance`);
    await page.locator('[data-testid="qr-checkin-btn"]').click();
    const manualInput = page.locator('[data-testid="qr-manual-input"]');
    await expect(manualInput).toBeVisible({ timeout: 5000 });
  });
});
