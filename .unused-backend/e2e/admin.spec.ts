/**
 * E2E Tests for Admin User Stories
 * Tests all admin-related features:
 * - User management
 * - Role assignment
 * - Event management
 * - Application review
 * - System configuration
 */

import { test, expect, Page } from '@playwright/test';
import { testUsers } from '../fixtures/testData';

async function loginAsAdmin(page: Page) {
  await page.goto('/auth');
  await page.fill('[name="email"]', testUsers.admin.email);
  await page.fill('[name="password"]', testUsers.admin.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

test.describe('US-ADMIN-001: User Management', () => {
  test('should display user management dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    await expect(page.locator('h1')).toContainText('User Management');
    
    // Check search and filters
    await expect(page.locator('[data-testid="search-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-filter"]')).toBeVisible();
  });
  
  test('should list all users with roles', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // Check users table
    const users = page.locator('[data-testid="user-row"]');
    await expect(users.first()).toBeVisible();
    
    // Check columns
    await expect(users.first().locator('[data-testid="user-email"]')).toBeVisible();
    await expect(users.first().locator('[data-testid="user-name"]')).toBeVisible();
    await expect(users.first().locator('[data-testid="user-roles"]')).toBeVisible();
  });
  
  test('should search users by email', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    await page.fill('[data-testid="search-users"]', testUsers.investor.email);
    await page.waitForTimeout(500);
    
    const users = page.locator('[data-testid="user-row"]');
    const count = await users.count();
    
    if (count > 0) {
      const email = await users.first().locator('[data-testid="user-email"]').textContent();
      expect(email?.toLowerCase()).toContain('investor');
    }
  });
  
  test('should filter users by role', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    await page.selectOption('[data-testid="role-filter"]', 'investor');
    await page.waitForTimeout(500);
    
    const users = page.locator('[data-testid="user-row"]');
    const count = await users.count();
    
    if (count > 0) {
      const roles = await users.first().locator('[data-testid="user-roles"]').textContent();
      expect(roles?.toLowerCase()).toContain('investor');
    }
  });
  
  test('should view user details', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    const firstUser = page.locator('[data-testid="user-row"]').first();
    await firstUser.click();
    
    // Check details modal/page
    await expect(page.locator('[data-testid="user-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-verified"]')).toBeVisible();
    await expect(page.locator('[data-testid="created-at"]')).toBeVisible();
  });
});

test.describe('US-ADMIN-002: Role Assignment', () => {
  test('should assign role to user', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    const firstUser = page.locator('[data-testid="user-row"]').first();
    
    if (await firstUser.isVisible()) {
      await firstUser.locator('[data-testid="manage-roles"]').click();
      
      // Select additional role
      await page.check('[data-testid="role-founder"]');
      
      // Save changes
      await page.click('[data-testid="save-roles"]');
      
      await expect(page.locator('.toast')).toContainText('Roles updated');
    }
  });
  
  test('should remove role from user', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    const firstUser = page.locator('[data-testid="user-row"]').first();
    
    if (await firstUser.isVisible()) {
      await firstUser.locator('[data-testid="manage-roles"]').click();
      
      // Uncheck role
      await page.uncheck('[data-testid="role-founder"]');
      
      await page.click('[data-testid="save-roles"]');
      
      await expect(page.locator('.toast')).toContainText('Roles updated');
    }
  });
  
  test('should prevent removing last role', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    const firstUser = page.locator('[data-testid="user-row"]').first();
    
    if (await firstUser.isVisible()) {
      await firstUser.locator('[data-testid="manage-roles"]').click();
      
      // Try to uncheck all roles
      const roles = page.locator('[data-testid^="role-"]');
      const roleCount = await roles.count();
      
      if (roleCount === 1) {
        await page.uncheck(roles.first());
        await page.click('[data-testid="save-roles"]');
        
        // Should show error
        await expect(page.locator('[data-testid="role-error"]')).toContainText('at least one role');
      }
    }
  });
});

test.describe('US-ADMIN-003: Event Management', () => {
  test('should display event management page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/events');
    
    await expect(page.locator('h1')).toContainText('Event Management');
    
    // Check create button
    await expect(page.locator('[data-testid="create-event"]')).toBeVisible();
  });
  
  test('should create new event', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/events');
    
    await page.click('[data-testid="create-event"]');
    
    // Fill event details
    await page.fill('[name="title"]', 'Tech Investor Meetup 2025');
    await page.fill('[name="description"]', 'Quarterly networking event for tech investors and founders');
    await page.selectOption('[name="eventType"]', 'networking');
    
    // Set date (30 days from now)
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await page.fill('[name="date"]', futureDate.toISOString().split('T')[0]);
    
    await page.fill('[name="location"]', 'Tech Hub, Bangalore');
    await page.fill('[name="maxAttendees"]', '100');
    await page.fill('[name="registrationFee"]', '5000');
    
    // Virtual event toggle
    await page.uncheck('[name="isVirtual"]');
    
    await page.click('[data-testid="create-event-submit"]');
    
    await expect(page.locator('.toast')).toContainText('Event created');
  });
  
  test('should edit existing event', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/events');
    
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    
    if (await firstEvent.isVisible()) {
      await firstEvent.locator('[data-testid="edit-event"]').click();
      
      // Update details
      await page.fill('[name="maxAttendees"]', '150');
      
      await page.click('[data-testid="save-event"]');
      
      await expect(page.locator('.toast')).toContainText('Event updated');
    }
  });
  
  test('should cancel event', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/events');
    
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    
    if (await firstEvent.isVisible()) {
      await firstEvent.locator('[data-testid="cancel-event"]').click();
      
      // Confirm cancellation
      await page.fill('[data-testid="cancellation-reason"]', 'Venue unavailable');
      await page.click('[data-testid="confirm-cancel"]');
      
      await expect(page.locator('.toast')).toContainText('Event cancelled');
    }
  });
  
  test('should view event registrations', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/events');
    
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    
    if (await firstEvent.isVisible()) {
      await firstEvent.locator('[data-testid="view-registrations"]').click();
      
      // Check registrations list
      await expect(page.locator('[data-testid="registrations-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="attendee-count"]')).toBeVisible();
    }
  });
});

test.describe('US-ADMIN-004: Application Review', () => {
  test('should display pending applications', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/applications');
    
    await expect(page.locator('h1')).toContainText('Applications');
    
    // Check tabs for different application types
    await expect(page.locator('[data-testid="founder-applications-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="investor-applications-tab"]')).toBeVisible();
  });
  
  test('should review founder application', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/applications');
    
    await page.click('[data-testid="founder-applications-tab"]');
    
    const firstApplication = page.locator('[data-testid="application-card"]').first();
    
    if (await firstApplication.isVisible()) {
      await firstApplication.click();
      
      // Check application details
      await expect(page.locator('[data-testid="company-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="pitch-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="funding-required"]')).toBeVisible();
    }
  });
  
  test('should approve founder application', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/applications');
    
    await page.click('[data-testid="founder-applications-tab"]');
    
    const firstApplication = page.locator('[data-testid="application-card"]').first();
    
    if (await firstApplication.isVisible()) {
      await firstApplication.click();
      
      // Add review notes
      await page.fill('[data-testid="review-notes"]', 'Strong founding team, clear business model. Approved for platform access.');
      
      // Approve
      await page.click('[data-testid="approve-application"]');
      
      await expect(page.locator('.toast')).toContainText('Application approved');
    }
  });
  
  test('should reject application with reason', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/applications');
    
    await page.click('[data-testid="investor-applications-tab"]');
    
    const firstApplication = page.locator('[data-testid="application-card"]').first();
    
    if (await firstApplication.isVisible()) {
      await firstApplication.click();
      
      // Click reject
      await page.click('[data-testid="reject-application"]');
      
      // Add rejection reason
      await page.fill('[data-testid="rejection-reason"]', 'Incomplete information. Please resubmit with additional documentation.');
      
      await page.click('[data-testid="confirm-rejection"]');
      
      await expect(page.locator('.toast')).toContainText('Application rejected');
    }
  });
  
  test('should filter applications by status', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/applications');
    
    await page.selectOption('[data-testid="status-filter"]', 'approved');
    await page.waitForTimeout(500);
    
    const applications = page.locator('[data-testid="application-card"]');
    const count = await applications.count();
    
    if (count > 0) {
      const status = await applications.first().locator('[data-testid="status-badge"]').textContent();
      expect(status).toContain('Approved');
    }
  });
});

test.describe('US-ADMIN-005: System Statistics', () => {
  test('should display admin dashboard with statistics', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
    
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    
    // Check stats cards
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-deals"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-applications"]')).toBeVisible();
    await expect(page.locator('[data-testid="upcoming-events"]')).toBeVisible();
  });
  
  test('should display charts and analytics', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
    
    // Check for charts
    await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="deal-status-chart"]')).toBeVisible();
  });
  
  test('should filter statistics by date range', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
    
    // Select date range
    await page.click('[data-testid="date-range-picker"]');
    await page.click('[data-testid="last-30-days"]');
    
    await page.waitForTimeout(500);
    
    // Statistics should update
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
  });
});

test.describe('US-ADMIN-006: Audit Logs', () => {
  test('should view system audit logs', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/audit-logs');
    
    await expect(page.locator('h1')).toContainText('Audit Logs');
    
    // Check logs table
    await expect(page.locator('[data-testid="audit-log-table"]')).toBeVisible();
  });
  
  test('should filter logs by user', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/audit-logs');
    
    await page.fill('[data-testid="user-filter"]', testUsers.investor.email);
    await page.waitForTimeout(500);
    
    const logs = page.locator('[data-testid="audit-log-row"]');
    
    if (await logs.first().isVisible()) {
      const user = await logs.first().locator('[data-testid="log-user"]').textContent();
      expect(user?.toLowerCase()).toContain('investor');
    }
  });
  
  test('should filter logs by action type', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/audit-logs');
    
    await page.selectOption('[data-testid="action-filter"]', 'login');
    await page.waitForTimeout(500);
    
    const logs = page.locator('[data-testid="audit-log-row"]');
    
    if (await logs.first().isVisible()) {
      const action = await logs.first().locator('[data-testid="log-action"]').textContent();
      expect(action?.toLowerCase()).toContain('login');
    }
  });
});

test.describe('Accessibility: Admin Pages', () => {
  test('User management page should be accessible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // Check heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    
    // Check table accessibility
    const table = page.locator('table').first();
    
    if (await table.isVisible()) {
      // Should have thead and tbody
      await expect(table.locator('thead')).toBeVisible();
      await expect(table.locator('tbody')).toBeVisible();
      
      // Headers should have scope
      const headers = table.locator('th');
      const headerCount = await headers.count();
      
      for (let i = 0; i < Math.min(headerCount, 5); i++) {
        const scope = await headers.nth(i).getAttribute('scope');
        expect(scope).toBe('col');
      }
    }
  });
  
  test('Event management should have keyboard navigation', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/events');
    
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    
    const interactiveTags = ['BUTTON', 'A', 'INPUT'];
    expect(interactiveTags).toContain(focusedElement);
  });
  
  test('Application review should have proper ARIA labels', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/applications');
    
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Button should have either text or aria-label
      expect(ariaLabel || text?.trim()).toBeTruthy();
    }
  });
});

test.describe('Responsive Design: Admin Pages', () => {
  test('User management should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
    
    // Check mobile menu
    const mobileMenu = page.locator('[data-testid="mobile-menu"], [aria-label="Menu"]');
    await expect(mobileMenu).toBeVisible();
  });
  
  test('Dashboard should adapt to tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
    
    await expect(page.locator('main')).toBeVisible();
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
  
  test('Event management should have touch-friendly buttons on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginAsAdmin(page);
    await page.goto('/admin/events');
    
    const buttons = page.locator('button');
    
    if (await buttons.first().isVisible()) {
      const box = await buttons.first().boundingBox();
      
      // Should have sufficient tap target size (minimum 44x44 per WCAG)
      expect(box?.height).toBeGreaterThan(40);
    }
  });
});
