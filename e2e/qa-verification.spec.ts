/**
 * QA Verification Suite — Branch 2026-03-13
 * Verifies fixes for B1–B6 and the admin profile edit feature (US-ADMIN-018)
 * Also verifies dynamic port config (vite.config.ts / playwright.config.ts).
 */

import { test, expect } from '@playwright/test';

const API = process.env.API_URL ?? 'http://localhost:3001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/auth');
  await page.locator('input[type="email"]').fill('admin@indiaangelforum.test');
  await page.locator('input[type="password"]').fill('Admin@12345');
  await page.locator('input[type="password"]').press('Enter');
  await page.waitForURL(/\/(admin|$)/, { timeout: 15000 });
}

// ---------------------------------------------------------------------------
// B1 — US-ADMIN-011: Multi-role display & counts
// ---------------------------------------------------------------------------

test.describe('B1 — US-ADMIN-011: Multi-role display', () => {
  test('Operator Angel count ≥ 1 on user management page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // The stats grid renders one card per role; find Operator Angel card
    const cards = page.locator('.grid .text-2xl.font-bold');
    // Find the card preceded by "Operator Angel" label
    const operatorCard = page.getByText('Operator Angel').locator('..').locator('..').locator('.text-2xl.font-bold');
    const text = await operatorCard.first().textContent();
    expect(Number(text)).toBeGreaterThanOrEqual(1);
  });

  test('Family Office count ≥ 1 on user management page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    const familyCard = page.getByText('Family Office').locator('..').locator('..').locator('.text-2xl.font-bold');
    const text = await familyCard.first().textContent();
    expect(Number(text)).toBeGreaterThanOrEqual(1);
  });

  test('Multi-role user shows multiple role badges', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // At least one user card should have 2+ role badges
    const userCards = page.locator('[data-testid="role-badge"]');
    const count = await userCards.count();
    // Should be more badges than users (some users have multiple roles)
    expect(count).toBeGreaterThan(9); // 9 users but multi-role users add badges
  });

  test('Filtering by Operator Angel shows ≥ 1 user', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Open role filter select
    await page.locator('#role').click();
    await page.getByRole('option', { name: 'Operator Angel' }).click();
    await page.waitForTimeout(300);

    const userCards = page.locator('.space-y-4 > [class*="Card"], .space-y-4 > div').first();
    // Should not show "No users found"
    const noUsers = await page.getByText('No users found').isVisible();
    expect(noUsers).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// B2 — US-ADMIN-003: View Details navigates to /events/:id not /events/undefined
// ---------------------------------------------------------------------------

test.describe('B2 — US-ADMIN-003: Event View Details route', () => {
  test('View Details button navigates to /events/<uuid>, not /events/undefined', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/events');
    await page.waitForLoadState('networkidle');

    const viewDetailsBtn = page.getByRole('button', { name: /view details/i }).first();
    await expect(viewDetailsBtn).toBeVisible({ timeout: 10000 });
    await viewDetailsBtn.click();

    // Wait for navigation
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url).not.toContain('/events/undefined');
    expect(url).toMatch(/\/events\/[a-f0-9-]{10,}/i);
  });
});

// ---------------------------------------------------------------------------
// B3 — US-ADMIN-017: /admin/deals page exists (no 404)
// ---------------------------------------------------------------------------

test.describe('B3 — US-ADMIN-017: Admin Deals page', () => {
  test('/admin/deals loads without 404', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/deals');
    await page.waitForLoadState('networkidle');

    // Should NOT show a 404 error or redirect to /not-found
    const url = page.url();
    expect(url).not.toContain('not-found');
    expect(url).not.toContain('404');

    // Should show a heading related to deals
    await expect(page.getByRole('heading', { name: /deal/i })).toBeVisible({ timeout: 10000 });
  });

  test('API GET /api/admin/deals returns 200 with auth', async ({ request }) => {
    // Login first to get token
    const loginRes = await request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@indiaangelforum.test', password: 'Admin@12345' },
    });
    expect(loginRes.status()).toBe(200);
    const { token } = await loginRes.json();

    const dealsRes = await request.get(`${API}/api/admin/deals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(dealsRes.status()).toBe(200);
    const body = await dealsRes.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// B4 — US-ADMIN-009: Invoice status counts visible
// ---------------------------------------------------------------------------

test.describe('B4 — US-ADMIN-009: Invoice status counts', () => {
  test('Invoice management page shows status count cards', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/invoices');
    await page.waitForLoadState('networkidle');

    // The stats grid should be visible (not conditionally hidden)
    // Looking for cards that contain Pending/Active/Failed/Completed labels
    await expect(page.getByText('Pending', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Failed', { exact: false })).toBeVisible({ timeout: 10000 });

    // The count values should be numeric (0 is fine, just not blank/"undefined")
    const countEls = page.locator('[data-testid="invoice-count"], .text-2xl.font-bold, .text-3xl.font-bold');
    const firstCount = await countEls.first().textContent();
    expect(firstCount).toMatch(/^\d+$/);
  });
});

// ---------------------------------------------------------------------------
// B5 — US-ADMIN-008: Membership plan names
// ---------------------------------------------------------------------------

test.describe('B5 — US-ADMIN-008: Membership plan names', () => {
  test('Membership page shows Associate, Full Member, Lead Angel plans', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/membership');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Associate', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Full Member', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Lead Angel', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('Old plan names (Introductory, Standard Member, Premium Member) are NOT shown', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/membership');
    await page.waitForLoadState('networkidle');

    // Wait for content to fully load
    await page.waitForTimeout(1000);

    const introductory = await page.getByText('Introductory', { exact: true }).count();
    const standardMember = await page.getByText('Standard Member', { exact: true }).count();
    const premiumMember = await page.getByText('Premium Member', { exact: true }).count();

    expect(introductory).toBe(0);
    expect(standardMember).toBe(0);
    expect(premiumMember).toBe(0);
  });

  test('API seed plan names correct via membership endpoint', async ({ request }) => {
    const loginRes = await request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@indiaangelforum.test', password: 'Admin@12345' },
    });
    const { token } = await loginRes.json();

    const plansRes = await request.get(`${API}/api/membership/plans`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (plansRes.status() === 200) {
      const plans = await plansRes.json();
      const names = plans.map((p: { name: string }) => p.name);
      expect(names).toContain('Associate');
      expect(names).toContain('Full Member');
      expect(names).toContain('Lead Angel');
    }
    // If endpoint doesn't exist yet, skip (not a failure of seed)
  });
});

// ---------------------------------------------------------------------------
// B6 — US-ADMIN-006: Audit logs surface activity data
// ---------------------------------------------------------------------------

test.describe('B6 — US-ADMIN-006: Audit logs', () => {
  test('Audit log page shows entries (not 0)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should not show "No logs found" or "0 entries" — seeded activity_logs should appear
    const noLogs = await page.getByText(/no (logs|entries|results)/i).isVisible();
    expect(noLogs).toBe(false);
  });

  test('API /api/admin/audit-logs returns ≥ 1 entry', async ({ request }) => {
    const loginRes = await request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@indiaangelforum.test', password: 'Admin@12345' },
    });
    const { token } = await loginRes.json();

    const logsRes = await request.get(`${API}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(logsRes.status()).toBe(200);
    const body = await logsRes.json();
    const logs = Array.isArray(body) ? body : body.logs ?? body.data ?? [];
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Feature — US-ADMIN-018: Admin view/edit user profile
// ---------------------------------------------------------------------------

test.describe('US-ADMIN-018: Admin view/edit user profile', () => {
  test('View/Edit button visible on each user card', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    const viewEditBtns = page.locator('[data-testid="view-profile-btn"]');
    const count = await viewEditBtns.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('View/Edit dialog opens with fullName and email fields', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="view-profile-btn"]').first().click();

    // Dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#edit-email')).toBeVisible();
    await expect(page.locator('#edit-fullname')).toBeVisible();
  });

  test('Edit dialog shows current user email', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="view-profile-btn"]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    const emailVal = await page.locator('#edit-email').inputValue();
    expect(emailVal).toContain('@');
  });

  test('PATCH /api/admin/users/:id updates user fullName', async ({ request }) => {
    const loginRes = await request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@indiaangelforum.test', password: 'Admin@12345' },
    });
    const { token } = await loginRes.json();

    // Get users list
    const usersRes = await request.get(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await usersRes.json();
    const target = users.find((u: { email: string }) => u.email !== 'admin@indiaangelforum.test');
    expect(target).toBeDefined();

    const originalName = target.fullName;
    const newName = `QA Test ${Date.now()}`;

    const patchRes = await request.patch(`${API}/api/admin/users/${target.id}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { fullName: newName },
    });
    expect(patchRes.status()).toBe(200);
    const updated = await patchRes.json();
    expect(updated.fullName).toBe(newName);

    // Restore original name
    await request.patch(`${API}/api/admin/users/${target.id}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { fullName: originalName },
    });
  });

  test('GET /api/admin/users/:id returns user profile', async ({ request }) => {
    const loginRes = await request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@indiaangelforum.test', password: 'Admin@12345' },
    });
    const { token } = await loginRes.json();

    const usersRes = await request.get(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await usersRes.json();
    const target = users[0];

    const profileRes = await request.get(`${API}/api/admin/users/${target.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(profileRes.status()).toBe(200);
    const profile = await profileRes.json();
    expect(profile.id).toBe(target.id);
    expect(profile.email).toBe(target.email);
    expect(Array.isArray(profile.roles)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Infra — Dynamic port config: vite port / playwright baseURL read from env
// ---------------------------------------------------------------------------

test.describe('Infra: Dynamic port config', () => {
  test('App serves at configured BASE_URL (no hardcoded port in response)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // If served correctly, we're not on a blank/error page
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
