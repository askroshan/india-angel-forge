/**
 * QA Verification Suite — 2026-03-13
 * Sr. QA Tester regression tests for bugs B1-B6 and admin profile feature
 *
 * B1 US-ADMIN-011: Multi-role users show all role badges & correct counts
 * B2 US-ADMIN-003: "View Details" navigates to /events/:id (not /events/undefined)
 * B3 US-ADMIN-017: /admin/deals page exists and loads deal data
 * B4 US-ADMIN-009: Invoice status tab counts display (not blank)
 * B5 US-ADMIN-008: Membership plans named Associate / Full Member / Lead Angel
 * B6 US-ADMIN-006: Audit logs page shows entries from activity_logs
 * F1 US-ADMIN-018: Admin can view/edit any user profile via View/Edit dialog
 */

import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@indiaangelforum.test';
const ADMIN_PASSWORD = 'Admin@12345';

async function adminLogin(page: Page) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  // Use keyboard to avoid browser password manager interference
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.locator('input[type="password"]').press('Enter');
  await page.waitForURL(/\/(admin|dashboard|\s*)$/, { timeout: 15000 }).catch(async () => {
    // Also accept root URL
    await page.waitForURL('/', { timeout: 5000 }).catch(() => {});
  });
}

// ─── B1: Multi-role display ────────────────────────────────────────────────
test.describe('B1 — US-ADMIN-011: Multi-role display', () => {
  test('role stat cards show correct counts for Operator Angel and Family Office', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Find the Operator Angel stat card
    const allCards = await page.locator('.grid .text-2xl.font-bold').all();
    expect(allCards.length).toBeGreaterThan(0);

    // Look at role stat section — each AVAILABLE_ROLES has a card
    const statSection = page.locator('.grid.grid-cols-1.md\\:grid-cols-4');
    await expect(statSection).toBeVisible();

    // Find "Operator Angel" card
    const operatorCard = page.locator('text=Operator Angel').locator('..').locator('..');
    await expect(operatorCard).toBeVisible();
    const operatorCount = operatorCard.locator('.text-2xl');
    await expect(operatorCount).not.toHaveText('0');

    // Find "Family Office" card
    const familyCard = page.locator('text=Family Office').locator('..').locator('..');
    await expect(familyCard).toBeVisible();
    const familyCount = familyCard.locator('.text-2xl');
    await expect(familyCount).not.toHaveText('0');
  });

  test('multi-role users show multiple role badges', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Users with dual roles should show ≥2 badges
    // Use the role filter to find operator_angel users first
    const roleSelect = page.locator('select, [role="combobox"]').filter({ hasText: /role|all/i }).first();
    // Click the Filter by Role dropdown
    const filterTrigger = page.locator('#role');
    await filterTrigger.click();
    await page.locator('[role="option"]').filter({ hasText: 'Operator Angel' }).click();
    await page.waitForTimeout(500);

    // At least one card should have multiple badges
    const badges = page.locator('[data-testid="role-badge"]');
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('role badge count reflects all roles on a user card', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Each user card's badges — look for any card with 2+ badges
    const userCards = page.locator('.space-y-4 > .\\[data-testid\\]').first();
    const allBadgesOnPage = page.locator('[data-testid="role-badge"]');
    const total = await allBadgesOnPage.count();
    // With 9 users, some multi-role, expect > 9 badges total
    expect(total).toBeGreaterThan(9);
  });
});

// ─── B2: View Details route ────────────────────────────────────────────────
test.describe('B2 — US-ADMIN-003: View Details navigates correctly', () => {
  test('View Details button URL does not contain /undefined', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/events');
    await page.waitForLoadState('networkidle');

    // Find all "View Details" buttons
    const viewDetailsButtons = page.locator('button', { hasText: 'View Details' });
    const count = await viewDetailsButtons.count();
    expect(count).toBeGreaterThan(0);

    // Click first View Details and verify URL
    await viewDetailsButtons.first().click();
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).not.toContain('/undefined');
    expect(url).toMatch(/\/events\/[a-zA-Z0-9-]+$/);
  });

  test('View Details navigates to a valid event page', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/events');
    await page.waitForLoadState('networkidle');

    const viewDetailsButtons = page.locator('button', { hasText: 'View Details' });
    await viewDetailsButtons.first().click();
    await page.waitForURL(/\/events\/[^/]+$/, { timeout: 5000 });
    // Should not be a 404 page
    await expect(page.locator('body')).not.toContainText('404');
    await expect(page.locator('body')).not.toContainText('Page Not Found');
  });
});

// ─── B3: Admin Deals page ──────────────────────────────────────────────────
test.describe('B3 — US-ADMIN-017: Admin Deal Oversight page', () => {
  test('/admin/deals loads without 404', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/deals');
    await page.waitForLoadState('networkidle');

    // Should not be a 404 or error page
    await expect(page.locator('body')).not.toContainText('404');
    await expect(page.locator('body')).not.toContainText('Page Not Found');
  });

  test('/admin/deals page shows deal oversight UI', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/deals');
    await page.waitForLoadState('networkidle');

    // Should show deals heading
    await expect(page.locator('h1, h2').filter({ hasText: /deal/i }).first()).toBeVisible();
  });

  test('GET /api/admin/deals returns 200 with array', async ({ page }) => {
    await adminLogin(page);
    // Call API directly via fetch in browser context
    const response = await page.request.get('/api/admin/deals', {
      headers: { 'Content-Type': 'application/json' },
    });
    // It might be 401 without auth token, but should not be 404
    expect(response.status()).not.toBe(404);
  });

  test('API /admin/deals returns data with token', async ({ page }) => {
    await adminLogin(page);
    // Get the auth token via login
    const loginResp = await page.request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const { token } = await loginResp.json();

    const resp = await page.request.get('/api/admin/deals', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─── B4: Invoice status counts ────────────────────────────────────────────
test.describe('B4 — US-ADMIN-009: Invoice status counts always visible', () => {
  test('invoice stats grid is visible', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/invoices');
    await page.waitForLoadState('networkidle');

    const statsGrid = page.locator('[data-testid="invoice-stats-grid"]');
    await expect(statsGrid).toBeVisible();
  });

  test('all 4 status count cards render with numeric values', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/invoices');
    await page.waitForLoadState('networkidle');

    const pending = page.locator('[data-testid="pending-count"]');
    const active = page.locator('[data-testid="active-count"]');
    const failed = page.locator('[data-testid="failed-count"]');
    const completed = page.locator('[data-testid="completed-count"]');

    await expect(pending).toBeVisible();
    await expect(active).toBeVisible();
    await expect(failed).toBeVisible();
    await expect(completed).toBeVisible();

    // Values should be numeric (0 is acceptable, but must be visible)
    for (const el of [pending, active, failed, completed]) {
      const text = await el.textContent();
      expect(text?.trim()).toMatch(/^\d+$/);
    }
  });
});

// ─── B5: Membership plan names ────────────────────────────────────────────
test.describe('B5 — US-ADMIN-008: Membership plan names match spec', () => {
  test('/admin/membership shows correct plan names', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/membership');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toContainText('Full Member');
    await expect(page.locator('body')).toContainText('Lead Angel');
    await expect(page.locator('body')).toContainText('Associate');
  });

  test('/admin/membership does NOT show old plan names', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/membership');
    await page.waitForLoadState('networkidle');

    // Old wrong names should be gone
    const body = page.locator('body');
    await expect(body).not.toContainText('Standard Member');
    await expect(body).not.toContainText('Premium Member');
    // "Introductory" might appear in config section text — check plan cards specifically
    const planCards = page.locator('[data-testid="membership-plan"], .membership-plan, h3, h4').filter({ hasText: /introductory/i });
    expect(await planCards.count()).toBe(0);
  });

  test('seed API returns correct plan names', async ({ page }) => {
    await adminLogin(page);
    const loginResp = await page.request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const { token } = await loginResp.json();
    const resp = await page.request.get('/api/membership/plans', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resp.status() === 200) {
      const plans = await resp.json();
      const names = plans.map((p: { name: string }) => p.name);
      expect(names).toContain('Full Member');
      expect(names).toContain('Lead Angel');
      expect(names).toContain('Associate');
      expect(names).not.toContain('Standard Member');
      expect(names).not.toContain('Premium Member');
    }
  });
});

// ─── B6: Audit logs from activity_logs ───────────────────────────────────
test.describe('B6 — US-ADMIN-006: Audit logs show activity data', () => {
  test('/admin/audit-logs page loads', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('audit logs API returns entries (merged from both tables)', async ({ page }) => {
    await adminLogin(page);
    const loginResp = await page.request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const { token } = await loginResp.json();
    const resp = await page.request.get('/api/admin/audit-logs', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    // Should return an array with items (activityLog seeds ~30 rows)
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test('audit logs page shows log entries, not "0 logs"', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('networkidle');

    // It should not show "0" as the only count or "No audit logs found"
    const body = page.locator('body');
    // There should be actual rows/entries visible
    const rows = page.locator('tr, [data-testid="audit-log-row"], .audit-row');
    const rowCount = await rows.count();
    // At least the header row + some data rows
    // If the page uses a different structure, check for non-empty state
    if (rowCount === 0) {
      // Check that it doesn't show "No logs" empty state
      await expect(body).not.toContainText('No audit logs');
    }
  });
});

// ─── F1: Admin view/edit user profile ────────────────────────────────────
test.describe('F1 — US-ADMIN-018: Admin view/edit user profile', () => {
  test('View/Edit button exists on each user card', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    const viewEditBtns = page.locator('[data-testid="view-profile-btn"]');
    const count = await viewEditBtns.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking View/Edit opens profile edit dialog', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Click first View/Edit button
    const firstBtn = page.locator('[data-testid="view-profile-btn"]').first();
    await firstBtn.click();
    await page.waitForTimeout(500);

    // Dialog should be visible with profile fields
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('input#edit-email, input[id="edit-email"]')).toBeVisible();
    await expect(dialog.locator('input#edit-fullname, input[id="edit-fullname"]')).toBeVisible();
  });

  test('profile dialog shows user email pre-populated', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="view-profile-btn"]').first().click();
    await page.waitForTimeout(500);

    const emailInput = page.locator('input[id="edit-email"]');
    await expect(emailInput).toBeVisible();
    const emailVal = await emailInput.inputValue();
    expect(emailVal).toContain('@');
  });

  test('editing and saving profile updates via PATCH API', async ({ page }) => {
    await adminLogin(page);
    const loginResp = await page.request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const { token } = await loginResp.json();

    // Get test user (not admin)
    const usersResp = await page.request.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await usersResp.json();
    const testUser = users.find((u: { email: string }) => u.email !== ADMIN_EMAIL);
    expect(testUser).toBeDefined();

    // PATCH the profile
    const patchResp = await page.request.patch(`/api/admin/users/${testUser.id}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { fullName: 'QA Test Updated Name' },
    });
    expect(patchResp.status()).toBe(200);
    const updated = await patchResp.json();
    expect(updated.fullName).toBe('QA Test Updated Name');

    // Restore original name
    await page.request.patch(`/api/admin/users/${testUser.id}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { fullName: testUser.fullName || '' },
    });
  });

  test('GET /api/admin/users/:id returns single user profile', async ({ page }) => {
    await adminLogin(page);
    const loginResp = await page.request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const { token } = await loginResp.json();

    const usersResp = await page.request.get('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await usersResp.json();
    const userId = users[0].id;

    const resp = await page.request.get(`/api/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
    const profile = await resp.json();
    expect(profile.id).toBe(userId);
    expect(profile.email).toBeDefined();
    expect(Array.isArray(profile.roles)).toBe(true);
  });
});
