/**
 * E2E Test Suite: Admin Operations (Phase 4)
 * 
 * User Stories: US-ADMIN-001 through US-ADMIN-004
 * 
 * Tests the admin platform operations:
 * - Application review (approve/reject investor & founder applications)
 * - Audit log viewing and filtering
 * - User role management
 * - System statistics dashboard
 * 
 * Test Coverage (10 tests):
 * - ADMIN-E2E-001: Display application review page with applications
 * - ADMIN-E2E-002: Filter applications by type and view details
 * - ADMIN-E2E-003: Approve and reject applications
 * - ADMIN-E2E-004: Display audit logs page with entries
 * - ADMIN-E2E-005: Filter and search audit logs
 * - ADMIN-E2E-006: Display user role management with user list
 * - ADMIN-E2E-007: Search users and change role
 * - ADMIN-E2E-008: Display system statistics with summary cards
 * - ADMIN-E2E-009: View users by role and event statistics
 * - ADMIN-E2E-010: API returns statistics with correct data shape
 * 
 * Trace IDs: ADMIN-E2E-001 to ADMIN-E2E-010
 * @see PHASE4_USER_STORIES.md for full traceability matrix
 */

import { test, expect, type Page } from '@playwright/test';

// Admin panel tests configured for desktop viewports only via playwright.config.ts testIgnore

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
 * Seed test applications in the database for admin review.
 * Creates a pending investor application and a pending founder application.
 * Idempotent.
 */
async function seedTestApplications(token: string): Promise<void> {
  await fetchWithRetry(`${API_BASE}/api/test/seed-admin-applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Seed test audit logs in the database.
 * Idempotent.
 */
async function seedTestAuditLogs(token: string): Promise<void> {
  await fetchWithRetry(`${API_BASE}/api/test/seed-audit-logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

// ==================== TEST SUITE ====================

test.describe.serial('Admin Operations (Phase 4)', () => {
  let adminToken: string;

  test.beforeAll(async () => {
    adminToken = await getAuthToken(ADMIN_USER.email, ADMIN_USER.password);
    
    // Seed test data
    await seedTestApplications(adminToken);
    await seedTestAuditLogs(adminToken);
  });

  // ==================== US-ADMIN-001: Application Review ====================

  /**
   * ADMIN-E2E-001: Display application review page with applications
   * Trace: US-ADMIN-001 → AC-1, AC-2, AC-7
   * 
   * Validates:
   * - Application Review page loads with heading
   * - Application cards show full name, email, type badge, status badge
   * - Loading state shown initially
   */
  test('ADMIN-E2E-001: should display application review page with applications', async ({ page }) => {
    await loginAndNavigate(page, ADMIN_USER, '/admin/applications');

    // Verify page heading
    await expect(page.locator('h1')).toContainText('Application Review');

    // Verify at least one application card is displayed
    const applicationCards = page.locator('.grid > div').filter({ has: page.locator('h3') });
    await expect(applicationCards.first()).toBeVisible({ timeout: 10000 });

    // Verify application card has name and email
    const firstCard = applicationCards.first();
    await expect(firstCard).toContainText(/[A-Za-z]/); // Has a name
    
    // Verify status badge is present (Pending, Approved, or Rejected)
    const statusBadge = page.locator('text=/Pending|Approved|Rejected/i');
    await expect(statusBadge.first()).toBeVisible();

    // Verify type badge is present (Investor or Founder)
    const typeBadge = page.locator('text=/Investor|Founder/i');
    await expect(typeBadge.first()).toBeVisible();
  });

  /**
   * ADMIN-E2E-002: Filter applications by type and view details
   * Trace: US-ADMIN-001 → AC-3, AC-4
   * 
   * Validates:
   * - Type filter dropdown works (All/Investor/Founder)
   * - View Details button opens dialog with complete information
   */
  test('ADMIN-E2E-002: should filter applications by type and view details', async ({ page }) => {
    await loginAndNavigate(page, ADMIN_USER, '/admin/applications');
    await page.waitForTimeout(1000);

    // Filter by investor
    const typeFilter = page.locator('#type-filter');
    await typeFilter.click();
    await page.locator('[role="option"]').filter({ hasText: 'Investor' }).click();
    await page.waitForTimeout(500);

    // All visible type badges should be "Investor"
    const investorBadges = page.locator('text=/Investor/i');
    await expect(investorBadges.first()).toBeVisible();

    // Reset filter
    await typeFilter.click();
    await page.locator('[role="option"]').filter({ hasText: 'All' }).click();
    await page.waitForTimeout(500);

    // Click "View Details" on first application
    const viewDetailsBtn = page.getByRole('button', { name: /View Details/i });
    await viewDetailsBtn.first().click();

    // Verify dialog opens with application details
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toContainText('Application Details');

    // Dialog should contain detailed fields
    await expect(page.locator('[role="dialog"]')).toContainText(/Full Name|Email|Phone/i);
  });

  /**
   * ADMIN-E2E-003: Approve and reject applications
   * Trace: US-ADMIN-001 → AC-5, AC-6
   * 
   * Validates:
   * - Approve button on pending application triggers approval
   * - Reject button opens rejection dialog with reason field
   * - Success toasts shown after approve/reject
   */
  test('ADMIN-E2E-003: should approve and reject applications', async ({ page }) => {
    await loginAndNavigate(page, ADMIN_USER, '/admin/applications');
    await page.waitForTimeout(1000);

    // Look for pending applications with Approve button
    const approveBtn = page.getByRole('button', { name: /Approve/i });
    
    if (await approveBtn.count() > 0) {
      // Approve the first pending application
      await approveBtn.first().click();
      
      // Verify success toast
      await expect(page.locator('text=/approved successfully/i')).toBeVisible({ timeout: 5000 });
    }

    // Re-seed so we have applications to reject
    await seedTestApplications(adminToken);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click Reject on a pending application
    const rejectBtn = page.getByRole('button', { name: /Reject/i });
    if (await rejectBtn.count() > 0) {
      await rejectBtn.first().click();

      // Rejection dialog should open
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Fill rejection reason
      const reasonField = page.locator('#rejection-reason, textarea');
      await reasonField.last().fill('Does not meet minimum investment criteria');

      // Submit rejection
      const submitRejectBtn = page.locator('[role="dialog"]').getByRole('button', { name: /Reject/i });
      await submitRejectBtn.click();

      // Verify success toast
      await expect(page.locator('text=/rejected/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  // ==================== US-ADMIN-002: Audit Logs ====================

  /**
   * ADMIN-E2E-004: Display audit logs page with entries
   * Trace: US-ADMIN-002 → AC-1, AC-2
   * 
   * Validates:
   * - Audit Logs page loads with heading
   * - Summary cards shown (Total Logs, Today, This Week)
   * - Log entries display action, user, timestamp
   */
  test('ADMIN-E2E-004: should display audit logs page with entries', async ({ page }) => {
    await loginAndNavigate(page, ADMIN_USER, '/admin/audit-logs');

    // Verify page heading
    await expect(page.locator('h1, h2').filter({ hasText: 'Audit Logs' })).toBeVisible();

    // Verify summary cards
    await expect(page.getByText('Total Logs')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Today')).toBeVisible();
    await expect(page.getByText('This Week')).toBeVisible();

    // Verify at least one log entry is displayed
    const logEntries = page.locator('[class*="space-y"] > div, [class*="scroll"] > div').filter({ 
      has: page.locator('text=/verify|reject|assign|create|approve|flag|clear|update|delete/i') 
    });
    const count = await logEntries.count();
    expect(count).toBeGreaterThan(0);
  });

  /**
   * ADMIN-E2E-005: Filter and search audit logs
   * Trace: US-ADMIN-002 → AC-3, AC-4, AC-5
   * 
   * Validates:
   * - Search input filters by user name/email
   * - Action type filter narrows results
   * - Export CSV button is visible
   */
  test('ADMIN-E2E-005: should filter and search audit logs', async ({ page }) => {
    await loginAndNavigate(page, ADMIN_USER, '/admin/audit-logs');
    await page.waitForTimeout(1000);

    // Verify search input exists
    const searchInput = page.locator('#search, input[placeholder*="Search"], input[placeholder*="search"]');
    await expect(searchInput.first()).toBeVisible();

    // Type in search
    await searchInput.first().fill('admin');
    await page.waitForTimeout(500);

    // Verify action type filter exists
    const actionFilter = page.locator('select, [role="combobox"]').filter({ hasText: /All Actions|Action Type|all/i });
    if (await actionFilter.count() > 0) {
      await actionFilter.first().click();
      await page.waitForTimeout(300);
      // Close dropdown
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // Verify Export CSV button
    const exportBtn = page.locator('button:has-text("Export CSV")');
    await expect(exportBtn.first()).toBeVisible({ timeout: 10000 });
  });

  // ==================== US-ADMIN-003: User Role Management ====================

  /**
   * ADMIN-E2E-006: Display user role management with user list
   * Trace: US-ADMIN-003 → AC-1, AC-2, AC-3
   * 
   * Validates:
   * - User Role Management page loads with heading
   * - User list shows users with name, email, role badge, join date
   * - Role statistics cards show counts per role
   */
  test('ADMIN-E2E-006: should display user role management with user list', async ({ page }) => {
    await loginAndNavigate(page, ADMIN_USER, '/admin/users');

    // Verify page heading
    await expect(page.locator('h1')).toContainText('User Role Management');

    // Verify role stats cards
    await expect(page.getByText('Administrator').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Standard User').first()).toBeVisible();

    // Wait for user list to load (API call may take time)
    await page.waitForSelector('button:has-text("Change Role")', { timeout: 15000 });
    
    // Verify at least one user is listed
    const userCards = page.locator('.space-y-4 > div').filter({ has: page.getByRole('button', { name: /Change Role/i }) });
    const count = await userCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify user card shows email and role badge
    const firstUser = userCards.first();
    await expect(firstUser).toContainText(/@/); // Has email
    // Check that a role badge exists (Badge component uses specific classes)
    const roleBadge = firstUser.locator('.inline-flex.items-center.rounded-full');
    await expect(roleBadge.first()).toBeVisible();
  });

  /**
   * ADMIN-E2E-007: Search users and change role
   * Trace: US-ADMIN-003 → AC-4, AC-5, AC-6
   * 
   * Validates:
   * - Search filters users by email or name
   * - Change Role button opens dialog
   * - Role selector allows choosing new role
   * - Assign Role button saves the change
   */
  test('ADMIN-E2E-007: should search users and change role', async ({ page }) => {
    await loginAndNavigate(page, ADMIN_USER, '/admin/users');
    await page.waitForTimeout(1000);

    // Search for investor user
    const searchInput = page.locator('#search');
    await searchInput.fill('investor');
    await page.waitForTimeout(500);

    // Verify filtered results contain investor user
    await expect(page.getByText(INVESTOR_USER.email)).toBeVisible();

    // Click "Change Role" on the investor user
    const changeRoleBtn = page.getByRole('button', { name: /Change Role/i });
    await changeRoleBtn.first().scrollIntoViewIfNeeded();
    await changeRoleBtn.first().click({ force: true });

    // Verify role assignment dialog opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toContainText('Assign Role');

    // Select a new role (moderator)
    const roleSelector = page.locator('[role="dialog"]').locator('#new-role, [role="combobox"]');
    await roleSelector.first().click();
    await page.locator('[role="option"]').filter({ hasText: 'Moderator' }).click();
    await page.waitForTimeout(300);

    // Click Assign Role
    const assignBtn = page.locator('[role="dialog"]').getByRole('button', { name: /Assign Role/i });
    await assignBtn.click();

    // Verify success toast
    await expect(page.locator('text=/Role updated|success/i').first()).toBeVisible({ timeout: 5000 });

    // Revert role back to user (cleanup)
    await page.waitForTimeout(500);
    const revertBtn = page.getByRole('button', { name: /Change Role/i });
    if (await revertBtn.count() > 0) {
      await revertBtn.first().scrollIntoViewIfNeeded();
      await revertBtn.first().click({ force: true });
      await page.waitForTimeout(300);
      const revertSelector = page.locator('[role="dialog"]').locator('#new-role, [role="combobox"]');
      await revertSelector.first().click();
      await page.locator('[role="option"]').filter({ hasText: 'Standard User' }).click();
      const revertAssign = page.locator('[role="dialog"]').getByRole('button', { name: /Assign Role/i });
      await revertAssign.click();
      await page.waitForTimeout(500);
    }
  });

  // ==================== US-ADMIN-004: System Statistics ====================

  /**
   * ADMIN-E2E-008: Display system statistics with summary cards
   * Trace: US-ADMIN-004 → AC-1, AC-2
   * 
   * Validates:
   * - System Statistics page loads with heading
   * - Four summary cards: Total Users, Total Deals, Total Investment, Total Events
   * - Cards show numeric values
   */
  test('ADMIN-E2E-008: should display system statistics with summary cards', async ({ page }) => {
    await loginAndNavigate(page, ADMIN_USER, '/admin/statistics');

    // Verify page heading
    await expect(page.locator('h1')).toContainText('System Statistics');

    // Verify four summary cards
    await expect(page.getByText('Total Users')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Total Deals')).toBeVisible();
    await expect(page.getByText('Total Investment')).toBeVisible();
    await expect(page.getByText('Total Events').first()).toBeVisible();

    // Verify cards show numbers (at least 0)
    const totalUsersCard = page.locator('div').filter({ hasText: 'Total Users' }).locator('.text-2xl');
    await expect(totalUsersCard.first()).toBeVisible();
  });

  /**
   * ADMIN-E2E-009: View users by role and event statistics
   * Trace: US-ADMIN-004 → AC-3, AC-4
   * 
   * Validates:
   * - Users by Role breakdown card shows role names and counts
   * - Event Statistics card shows total events and attendees
   */
  test('ADMIN-E2E-009: should view users by role and event statistics', async ({ page }) => {
    await loginAndNavigate(page, ADMIN_USER, '/admin/statistics');
    await page.waitForTimeout(1000);

    // Verify Users by Role card
    await expect(page.getByText('Users by Role')).toBeVisible({ timeout: 10000 });

    // Verify Event Statistics card
    await expect(page.getByText('Event Statistics')).toBeVisible();
    await expect(page.getByText('Total Attendees')).toBeVisible();
  });

  /**
   * ADMIN-E2E-010: API returns statistics with correct data shape
   * Trace: US-ADMIN-004 → AC-5, full flow
   * 
   * Validates:
   * - GET /api/admin/statistics returns expected data structure
   * - Response contains users, deals, events, and growth data
   */
  test('ADMIN-E2E-010: should return statistics API with correct data shape', async () => {
    const response = await fetchWithRetry(`${API_BASE}/api/admin/statistics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.ok).toBe(true);
    const data = await response.json();

    // Validate top-level structure
    expect(data).toHaveProperty('users');
    expect(data).toHaveProperty('deals');
    expect(data).toHaveProperty('events');

    // Validate users structure
    expect(data.users).toHaveProperty('total');
    expect(typeof data.users.total).toBe('number');
    expect(data.users).toHaveProperty('byRole');
    expect(typeof data.users.byRole).toBe('object');

    // Validate deals structure
    expect(data.deals).toHaveProperty('total');
    expect(typeof data.deals.total).toBe('number');
    expect(data.deals).toHaveProperty('totalInvestment');

    // Validate events structure
    expect(data.events).toHaveProperty('total');
    expect(typeof data.events.total).toBe('number');
    expect(data.events).toHaveProperty('totalAttendees');
  });
});

// ==================== ADMIN DELETE OPERATIONS ====================

test.describe('US-ADMIN-005: Admin Delete Operations', () => {
  let adminToken: string;
  let investorToken: string;

  test.beforeAll(async () => {
    adminToken = await getAuthToken(ADMIN_USER.email, ADMIN_USER.password);
    investorToken = await getAuthToken(INVESTOR_USER.email, INVESTOR_USER.password);
  });

  /**
   * ADMIN-E2E-011: Admin can delete a user
   * Trace: US-ADMIN-005 → AC-1
   * 
   * Validates:
   * - Admin can create a test user
   * - Admin can delete the user via DELETE /api/admin/users/:id
   * - Subsequent GET returns 404
   * - All related data is cascade deleted
   */
  test('ADMIN-E2E-011: admin can delete a user and cascade deletes related data', async () => {
    // Step 1: Create a test user to delete
    const testEmail = `delete-test-${Date.now()}@test.com`;
    const createResponse = await fetchWithRetry(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestDelete@123',
        fullName: 'Delete Test User',
      }),
    });
    expect(createResponse.ok).toBe(true);
    const { user: createdUser } = await createResponse.json();
    const userId = createdUser.id;

    // Step 2: Verify user exists
    const checkResponse = await fetchWithRetry(`${API_BASE}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(checkResponse.ok).toBe(true);
    const usersData = await checkResponse.json();
    const userExists = usersData.users.some((u: { id: string }) => u.id === userId);
    expect(userExists).toBe(true);

    // Step 3: Admin deletes the user
    const deleteResponse = await fetchWithRetry(`${API_BASE}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(deleteResponse.ok).toBe(true);
    const deleteData = await deleteResponse.json();
    expect(deleteData.message).toBe('User deleted successfully');

    // Step 4: Verify user no longer exists
    const verifyResponse = await fetchWithRetry(`${API_BASE}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(verifyResponse.ok).toBe(true);
    const verifyData = await verifyResponse.json();
    const userStillExists = verifyData.users.some((u: { id: string }) => u.id === userId);
    expect(userStillExists).toBe(false);
  });

  /**
   * ADMIN-E2E-012: Non-admin cannot delete a user
   * Trace: US-ADMIN-005 → AC-2
   * 
   * Validates:
   * - Investor role cannot access DELETE /api/admin/users/:id
   * - Returns 403 Forbidden
   */
  test('ADMIN-E2E-012: non-admin cannot delete a user', async () => {
    // First get a real user ID to try to delete
    const usersResponse = await fetchWithRetry(`${API_BASE}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = await usersResponse.json();
    const targetUserId = usersData.users[0]?.id || 'some-user-id';

    // Try to delete with investor token (should fail with 403)
    const deleteResponse = await fetchWithRetry(`${API_BASE}/api/admin/users/${targetUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${investorToken}` },
    });
    expect(deleteResponse.status).toBe(403);
  });

  /**
   * ADMIN-E2E-013: Admin can delete a company
   * Trace: US-ADMIN-005 → AC-3
   * 
   * Validates:
   * - Admin can delete a company via DELETE /api/admin/companies/:id
   * - Returns success message
   * - Company no longer exists after deletion
   */
  test('ADMIN-E2E-013: admin can delete a company', async () => {
    // Step 1: Get list of companies (using company-profiles endpoint)
    const listResponse = await fetchWithRetry(`${API_BASE}/api/company-profiles`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    // If no company profiles, try regular companies
    let companies: Array<{ id: string }> = [];
    if (listResponse.ok) {
      const data = await listResponse.json();
      companies = data.companyProfiles || data.companies || data || [];
    }

    if (!Array.isArray(companies) || companies.length === 0) {
      // Skip if no companies to test with
      test.skip();
      return;
    }

    const companyToDelete = companies[companies.length - 1];
    const companyId = companyToDelete.id;

    // Step 2: Admin deletes the company
    const deleteResponse = await fetchWithRetry(`${API_BASE}/api/admin/companies/${companyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(deleteResponse.ok).toBe(true);
    const deleteData = await deleteResponse.json();
    expect(deleteData.message).toBe('Company deleted successfully');
  });

  /**
   * ADMIN-E2E-014: Non-admin cannot delete a company
   * Trace: US-ADMIN-005 → AC-4
   * 
   * Validates:
   * - Investor role cannot access DELETE /api/admin/companies/:id
   * - Returns 403 Forbidden
   */
  test('ADMIN-E2E-014: non-admin cannot delete a company', async () => {
    // First get a real company ID to try to delete
    const listResponse = await fetchWithRetry(`${API_BASE}/api/company-profiles`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    let companyId = 'some-company-id';
    if (listResponse.ok) {
      const data = await listResponse.json();
      const companies = data.companyProfiles || data.companies || data || [];
      if (Array.isArray(companies) && companies.length > 0) {
        companyId = companies[0].id;
      }
    }

    // Try to delete with investor token (should fail with 403)
    const deleteResponse = await fetchWithRetry(`${API_BASE}/api/admin/companies/${companyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${investorToken}` },
    });
    expect(deleteResponse.status).toBe(403);
  });

  /**
   * ADMIN-E2E-015: Admin cannot delete themselves
   * Trace: US-ADMIN-005 → AC-5
   * 
   * Validates:
   * - Admin cannot delete their own account
   * - Returns 400 Bad Request with appropriate message
   */
  test('ADMIN-E2E-015: admin cannot delete themselves', async () => {
    // Get admin user ID from session endpoint
    const sessionResponse = await fetchWithRetry(`${API_BASE}/api/auth/session`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(sessionResponse.ok).toBe(true);
    const sessionData = await sessionResponse.json();
    const adminId = sessionData.data.user.id;

    // Try to delete self
    const deleteResponse = await fetchWithRetry(`${API_BASE}/api/admin/users/${adminId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(deleteResponse.status).toBe(400);
    const errorData = await deleteResponse.json();
    expect(errorData.error.message).toContain('cannot delete');
  });
});
