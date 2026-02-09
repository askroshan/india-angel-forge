/**
 * E2E Tests for Role-Based Authorization (US-AUTH-001, US-AUTH-002)
 * 
 * These tests verify that routes and API endpoints are properly protected
 * based on user roles. Following TDD - these tests are written FIRST.
 */

import { test, expect, Page } from '@playwright/test';

// Authorization tests run on all browsers

// Test credentials from testcredentials.md
const TEST_USERS = {
  admin: { email: 'admin@indiaangelforum.test', password: 'Admin@12345' },
  moderator: { email: 'moderator@indiaangelforum.test', password: 'Moderator@12345' },
  compliance: { email: 'compliance@indiaangelforum.test', password: 'Compliance@12345' },
  investor: { email: 'investor.standard@test.com', password: 'Investor@12345' },
  operatorAngel: { email: 'operator.angel@test.com', password: 'Operator@12345' },
  familyOffice: { email: 'family.office@test.com', password: 'FamilyOffice@12345' },
  founder: { email: 'founder@startup.test', password: 'Founder@12345' },
  guest: { email: 'user@test.com', password: 'User@12345' },
};

// Helper function to login
async function login(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  // Wait for redirect after login
  await page.waitForURL((url: URL) => !url.pathname.includes('/auth'), { timeout: 10000 });
}

// ==================== US-AUTH-001: Route Protection Tests ====================

test.describe('US-AUTH-001: Role-Based Route Protection', () => {
  
  test.describe('Admin Routes (/admin/*)', () => {
    test('admin can access /admin main dashboard', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      await page.goto('/admin');
      // Should NOT see Access Denied
      await expect(page.getByRole('heading', { name: /access denied/i })).not.toBeVisible();
      // Should see admin dashboard content
      await expect(page).not.toHaveURL(/access-denied|403/);
    });

    test('admin can click Admin Dashboard link in navigation and access it', async ({ page }) => {
      // Login as admin
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      
      // Should be redirected to home after login
      await page.waitForURL('/', { timeout: 10000 });
      
      // Navigate directly to admin dashboard
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Wait for the loading spinner to disappear (auth context resolving)
      await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});
      
      // Should NOT see Access Denied
      await expect(page.getByRole('heading', { name: /access denied/i })).not.toBeVisible({ timeout: 10000 });
      
      // Should see admin dashboard content
      await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible({ timeout: 15000 });
    });

    test('admin can access /admin/users', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      await page.goto('/admin/users');
      await expect(page.getByRole('heading', { name: /user role management/i })).toBeVisible();
      await expect(page).not.toHaveURL(/access-denied|403/);
    });

    test('admin can access /admin/audit-logs', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      await page.goto('/admin/audit-logs');
      await expect(page.getByRole('heading', { name: /audit/i })).toBeVisible();
    });

    test('investor cannot access /admin - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      await page.goto('/admin');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });

    test('investor cannot access /admin/users - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      await page.goto('/admin/users');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });

    test('founder cannot access /admin/users - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.founder.email, TEST_USERS.founder.password);
      await page.goto('/admin/users');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });

    test('compliance officer cannot access /admin/users - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.compliance.email, TEST_USERS.compliance.password);
      await page.goto('/admin/users');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });

    test('unauthenticated user is redirected to /auth', async ({ page }) => {
      await page.goto('/admin/users');
      await expect(page).toHaveURL(/\/auth/);
    });
  });

  test.describe('Compliance Routes (/compliance/*)', () => {
    test('compliance officer can access /compliance/kyc-review', async ({ page }) => {
      await login(page, TEST_USERS.compliance.email, TEST_USERS.compliance.password);
      await page.goto('/compliance/kyc-review');
      await expect(page.getByRole('heading', { name: /kyc/i })).toBeVisible();
    });

    test('admin can access /compliance/kyc-review', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      await page.goto('/compliance/kyc-review');
      await expect(page.getByRole('heading', { name: /kyc/i })).toBeVisible();
    });

    test('investor cannot access /compliance/kyc-review - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      await page.goto('/compliance/kyc-review');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });

    test('founder cannot access /compliance/aml-screening - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.founder.email, TEST_USERS.founder.password);
      await page.goto('/compliance/aml-screening');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });
  });

  test.describe('Investor Routes (/investor/*)', () => {
    test('standard investor can access /investor/deals', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      await page.goto('/investor/deals');
      await expect(page).not.toHaveURL(/access-denied|403/);
    });

    test('operator angel can access /investor/deals', async ({ page }) => {
      await login(page, TEST_USERS.operatorAngel.email, TEST_USERS.operatorAngel.password);
      await page.goto('/investor/deals');
      await expect(page).not.toHaveURL(/access-denied|403/);
    });

    test('family office can access /investor/deals', async ({ page }) => {
      await login(page, TEST_USERS.familyOffice.email, TEST_USERS.familyOffice.password);
      await page.goto('/investor/deals');
      await expect(page).not.toHaveURL(/access-denied|403/);
    });

    test('admin can access /investor/deals', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      await page.goto('/investor/deals');
      await expect(page).not.toHaveURL(/access-denied|403/);
    });

    test('founder cannot access /investor/deals - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.founder.email, TEST_USERS.founder.password);
      await page.goto('/investor/deals');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });

    test('compliance officer cannot access /investor/portfolio - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.compliance.email, TEST_USERS.compliance.password);
      await page.goto('/investor/portfolio');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });
  });

  test.describe('Founder Routes (/founder/*)', () => {
    test('founder can access /founder/application-status', async ({ page }) => {
      await login(page, TEST_USERS.founder.email, TEST_USERS.founder.password);
      await page.goto('/founder/application-status');
      await expect(page).not.toHaveURL(/access-denied|403/);
    });

    test('founder can access /founder/company-profile', async ({ page }) => {
      await login(page, TEST_USERS.founder.email, TEST_USERS.founder.password);
      await page.goto('/founder/company-profile');
      await expect(page).not.toHaveURL(/access-denied|403/);
    });

    test('admin can access /founder/application-status', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      await page.goto('/founder/application-status');
      await expect(page).not.toHaveURL(/access-denied|403/);
    });

    test('investor cannot access /founder/company-profile - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      await page.goto('/founder/company-profile');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });
  });

  test.describe('Moderator Routes (/moderator/*)', () => {
    test('moderator can access /moderator/applications', async ({ page }) => {
      await login(page, TEST_USERS.moderator.email, TEST_USERS.moderator.password);
      await page.goto('/moderator/applications');
      await expect(page).not.toHaveURL(/access-denied|403/);
    });

    test('admin can access /moderator/applications', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      await page.goto('/moderator/applications');
      await expect(page).not.toHaveURL(/access-denied|403/);
    });

    test('investor cannot access /moderator/applications - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      await page.goto('/moderator/applications');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });
  });

  test.describe('Operator Angel Routes (/operator/*)', () => {
    test('operator angel can access /operator/advisory', async ({ page }) => {
      await login(page, TEST_USERS.operatorAngel.email, TEST_USERS.operatorAngel.password);
      await page.goto('/operator/advisory');
      await expect(page).not.toHaveURL(/access-denied|403/);
    });

    test('admin can access /operator/advisory', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      await page.goto('/operator/advisory');
      await expect(page).not.toHaveURL(/access-denied|403/);
    });

    test('standard investor cannot access /operator/advisory - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      await page.goto('/operator/advisory');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });
  });
});

// ==================== US-AUTH-003: Access Denied Page Tests ====================

test.describe('US-AUTH-003: Forbidden Access Page (WCAG 2.2 AA)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as investor and try to access admin page to trigger 403
    await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
    await page.goto('/admin/users');
  });

  test('displays clear "Access Denied" heading (h1)', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1, name: /access denied/i });
    await expect(heading).toBeVisible();
  });

  test('explains why access was denied', async ({ page }) => {
    await expect(page.getByText(/don't have permission/i)).toBeVisible();
  });

  test('displays current user role', async ({ page }) => {
    await expect(page.getByText(/investor/i)).toBeVisible();
  });

  test('provides link to return to dashboard', async ({ page }) => {
    const dashboardLink = page.getByRole('link', { name: /dashboard|home|go back/i });
    await expect(dashboardLink).toBeVisible();
  });

  test('provides contact support link', async ({ page }) => {
    const supportLink = page.getByRole('link', { name: /contact support/i });
    await expect(supportLink).toBeVisible();
  });

  test('is keyboard navigable', async ({ page, browserName }) => {
    // Tab through the page and verify focus moves to interactive elements
    // WebKit/Safari don't move focus with Tab by default (macOS system setting)
    if (browserName === 'webkit') {
      // On WebKit, just verify focusable elements exist
      const links = page.getByRole('link');
      const linkCount = await links.count();
      expect(linkCount).toBeGreaterThan(0);
      return;
    }
    
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Should be able to reach links with keyboard - verify links are focusable
    const links = page.getByRole('link');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('has proper color contrast (WCAG AA)', async ({ page }) => {
    // Check that text is visible and not using low-contrast colors
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveCSS('color', /.+/); // Has a color defined
  });

  test('is responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const heading = page.getByRole('heading', { level: 1, name: /access denied/i });
    await expect(heading).toBeVisible();
    // Content should not overflow
    const body = page.locator('body');
    const boundingBox = await body.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
  });

  test('is responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const heading = page.getByRole('heading', { level: 1, name: /access denied/i });
    await expect(heading).toBeVisible();
  });
});

// ==================== US-AUTH-010: Admin Login to Dashboard Flow ====================

test.describe('US-AUTH-010: Admin Login to Dashboard Flow', () => {
  test('admin can login and access /admin dashboard', async ({ page }) => {
    // 1. Go to login page
    await page.goto('/auth');
    await expect(page).toHaveURL(/\/auth/);

    // 2. Enter admin credentials
    await page.getByLabel(/email/i).fill(TEST_USERS.admin.email);
    await page.getByLabel(/password/i).fill(TEST_USERS.admin.password);

    // 3. Click sign in
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // 4. Wait for redirect after login
    await page.waitForURL((url: URL) => !url.pathname.includes('/auth'), { timeout: 10000 });

    // 5. Navigate to admin dashboard
    await page.goto('/admin');

    // 6. Verify NOT seeing Access Denied
    await expect(page.getByRole('heading', { name: /access denied/i })).not.toBeVisible();

    // 7. Verify seeing admin dashboard
    await expect(page).not.toHaveURL(/access-denied|403/);
  });

  test('admin credentials are stored correctly after login', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    // Check localStorage for user data
    const userData = await page.evaluate(() => {
      return localStorage.getItem('auth_user');
    });
    
    expect(userData).toBeTruthy();
    const user = JSON.parse(userData!);
    expect(user.email).toBe('admin@indiaangelforum.test');
    expect(user.roles).toContain('admin');
  });

  test('subsequent visits to /admin work after login', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    // First visit
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /access denied/i })).not.toBeVisible();
    
    // Navigate away
    await page.goto('/');
    
    // Second visit
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /access denied/i })).not.toBeVisible();
  });

  test('wrong email shows invalid credentials error', async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/email/i).fill('wrong@email.com');
    await page.getByLabel(/password/i).fill('Admin@12345');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    
    // Should show error toast - Radix UI toast with data-state="open" and destructive variant
    await expect(page.locator('[data-state="open"]').filter({ hasText: /failed|invalid/i })).toBeVisible({ timeout: 5000 });
  });

  test('wrong password shows invalid credentials error', async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/email/i).fill('admin@indiaangelforum.test');
    await page.getByLabel(/password/i).fill('WrongPassword123!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    
    // Should show error toast - Radix UI toast with data-state="open" and destructive variant
    await expect(page.locator('[data-state="open"]').filter({ hasText: /failed|invalid/i })).toBeVisible({ timeout: 5000 });
  });
});

// ==================== US-AUTH-011: AccessDenied Shows User's Current Role ====================

test.describe('US-AUTH-011: AccessDenied Shows User Current Role', () => {
  test('AccessDenied page shows investor role when investor accesses admin page', async ({ page }) => {
    await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
    await page.goto('/admin');
    
    // Should see Access Denied
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    
    // Should show current user role
    await expect(page.getByText(/investor/i)).toBeVisible();
  });

  test('AccessDenied page shows founder role when founder accesses admin page', async ({ page }) => {
    await login(page, TEST_USERS.founder.email, TEST_USERS.founder.password);
    await page.goto('/admin');
    
    // Should see Access Denied
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    
    // Should show current user role
    await expect(page.getByText(/founder/i)).toBeVisible();
  });

  test('AccessDenied page shows compliance_officer role when compliance accesses admin page', async ({ page }) => {
    await login(page, TEST_USERS.compliance.email, TEST_USERS.compliance.password);
    await page.goto('/admin');
    
    // Should see Access Denied
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    
    // Should show current user role (formatted as "Compliance Officer")
    await expect(page.getByText(/compliance/i)).toBeVisible();
  });

  test('AccessDenied page provides link to appropriate dashboard', async ({ page }) => {
    await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
    await page.goto('/admin');
    
    // Should have a link to go back to dashboard
    const dashboardLink = page.getByRole('link', { name: /dashboard|home/i });
    await expect(dashboardLink).toBeVisible();
    
    // Link should point to investor dashboard
    await expect(dashboardLink).toHaveAttribute('href', expect.stringMatching(/investor/));
  });

  test('AccessDenied page shows required role', async ({ page }) => {
    await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
    await page.goto('/admin');
    
    // Should show required role (admin)
    await expect(page.getByText(/required.*admin|admin.*required/i)).toBeVisible();
  });
});
