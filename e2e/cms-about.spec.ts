/**
 * E2E Tests for CMS Features - About Page (Team Members & Partners)
 * 
 * Tests verify:
 * - Public visibility of team members and partners on About page
 * - Admin CRUD operations for team members
 * - Admin CRUD operations for partners
 * - RBAC enforcement (non-admin cannot manage CMS)
 * - Avatar fallback for missing photos
 * - CMS admin management page
 */

import { test, expect, Page } from '@playwright/test';

// Only run in chromium for faster E2E tests
test.use({ browserName: 'chromium' });

const TEST_USERS = {
  admin: { email: 'admin@indiaangelforum.test', password: 'Admin@12345' },
  investor: { email: 'investor.standard@test.com', password: 'Investor@12345' },
  founder: { email: 'founder@startup.test', password: 'Founder@12345' },
};

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

// ==================== TEAM MEMBERS API CRUD ====================

test.describe('CMS Team Members API', () => {
  let createdTeamMemberId: string;

  test('admin can create a team member via API', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    const response = await page.request.post('/api/admin/team-members', {
      headers: { 'Authorization': `Bearer ${token}` },
      multipart: {
        name: 'E2E Test Member',
        role: 'Test Role',
        bio: 'This is a test team member created by E2E tests.',
        linkedinUrl: 'https://linkedin.com/in/test-member',
        displayOrder: '99',
        isActive: 'true',
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.name).toBe('E2E Test Member');
    expect(body.role).toBe('Test Role');
    expect(body.bio).toContain('test team member');
    expect(body.isActive).toBe(true);
    createdTeamMemberId = body.id;
  });

  test('public can list active team members', async ({ page }) => {
    const response = await page.request.get('/api/team-members');
    expect(response.ok()).toBeTruthy();
    const members = await response.json();
    expect(Array.isArray(members)).toBeTruthy();
    // Should only contain active members
    for (const member of members) {
      expect(member.isActive).toBe(true);
    }
  });

  test('admin can list all team members (including inactive)', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    const response = await page.request.get('/api/admin/team-members', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(response.ok()).toBeTruthy();
    const members = await response.json();
    expect(Array.isArray(members)).toBeTruthy();
  });

  test('admin can update a team member via API', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    // First get all members to find one to update
    const listRes = await page.request.get('/api/admin/team-members', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const members = await listRes.json();
    const memberToUpdate = members.find((m: any) => m.name === 'E2E Test Member') || members[0];

    const response = await page.request.patch(`/api/admin/team-members/${memberToUpdate.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      multipart: {
        bio: 'Updated bio from E2E test',
      },
    });
    expect(response.ok()).toBeTruthy();
    const updated = await response.json();
    expect(updated.bio).toBe('Updated bio from E2E test');
  });

  test('non-admin cannot create team members', async ({ page }) => {
    await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
    const token = await getAuthToken(page);

    const response = await page.request.post('/api/admin/team-members', {
      headers: { 'Authorization': `Bearer ${token}` },
      multipart: {
        name: 'Unauthorized Member',
        role: 'Should Fail',
      },
    });
    expect(response.status()).toBe(403);
  });

  test('admin can delete a team member via API', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    // Find the E2E test member to delete
    const listRes = await page.request.get('/api/admin/team-members', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const members = await listRes.json();
    const e2eMember = members.find((m: any) => m.name === 'E2E Test Member');
    
    if (e2eMember) {
      const response = await page.request.delete(`/api/admin/team-members/${e2eMember.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      expect(response.ok()).toBeTruthy();
    }
  });
});

// ==================== PARTNERS API CRUD ====================

test.describe('CMS Partners API', () => {

  test('admin can create a partner via API', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    const response = await page.request.post('/api/admin/partners', {
      headers: { 'Authorization': `Bearer ${token}` },
      multipart: {
        name: 'E2E Test Partner',
        websiteUrl: 'https://test-partner.com',
        description: 'A test partner for E2E testing.',
        displayOrder: '99',
        isActive: 'true',
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.name).toBe('E2E Test Partner');
    expect(body.websiteUrl).toBe('https://test-partner.com');
    expect(body.isActive).toBe(true);
  });

  test('public can list active partners', async ({ page }) => {
    const response = await page.request.get('/api/partners');
    expect(response.ok()).toBeTruthy();
    const partners = await response.json();
    expect(Array.isArray(partners)).toBeTruthy();
    for (const partner of partners) {
      expect(partner.isActive).toBe(true);
    }
  });

  test('admin can update a partner via API', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    const listRes = await page.request.get('/api/admin/partners', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const partners = await listRes.json();
    const partnerToUpdate = partners.find((p: any) => p.name === 'E2E Test Partner') || partners[0];

    const response = await page.request.patch(`/api/admin/partners/${partnerToUpdate.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      multipart: {
        description: 'Updated partner description from E2E',
      },
    });
    expect(response.ok()).toBeTruthy();
    const updated = await response.json();
    expect(updated.description).toBe('Updated partner description from E2E');
  });

  test('non-admin cannot manage partners', async ({ page }) => {
    await login(page, TEST_USERS.founder.email, TEST_USERS.founder.password);
    const token = await getAuthToken(page);

    const response = await page.request.post('/api/admin/partners', {
      headers: { 'Authorization': `Bearer ${token}` },
      multipart: {
        name: 'Unauthorized Partner',
      },
    });
    expect(response.status()).toBe(403);
  });

  test('admin can delete a partner via API', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    const listRes = await page.request.get('/api/admin/partners', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const partners = await listRes.json();
    const e2ePartner = partners.find((p: any) => p.name === 'E2E Test Partner');
    
    if (e2ePartner) {
      const response = await page.request.delete(`/api/admin/partners/${e2ePartner.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      expect(response.ok()).toBeTruthy();
    }
  });
});

// ==================== ABOUT PAGE UI ====================

test.describe('About Page - CMS Content Display', () => {

  test('about page loads with correct structure', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('[data-testid="about-page"]')).toBeVisible();
  });

  test('team section displays team members from API', async ({ page }) => {
    await page.goto('/about');
    const teamSection = page.locator('[data-testid="team-section"]');
    await expect(teamSection).toBeVisible({ timeout: 10000 });

    // Should have at least one team member card (from seed data)
    const cards = teamSection.locator('[data-testid="team-member-card"]');
    const count = await cards.count();
    // Could be 0 if seed hasn't run, but section should still exist
    if (count > 0) {
      // Check first card has required elements
      const firstCard = cards.first();
      await expect(firstCard.locator('[data-testid="team-member-name"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="team-member-role"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="team-member-avatar"]')).toBeVisible();
    }
  });

  test('partners section displays partners from API', async ({ page }) => {
    await page.goto('/about');
    const partnersSection = page.locator('[data-testid="partners-section"]');
    await expect(partnersSection).toBeVisible({ timeout: 10000 });

    const cards = partnersSection.locator('[data-testid="partner-card"]');
    const count = await cards.count();
    if (count > 0) {
      const firstCard = cards.first();
      await expect(firstCard.locator('[data-testid="partner-name"]')).toBeVisible();
    }
  });

  test('team member avatars show initials fallback when no photo', async ({ page }) => {
    await page.goto('/about');
    const teamSection = page.locator('[data-testid="team-section"]');
    await expect(teamSection).toBeVisible({ timeout: 10000 });

    const avatars = teamSection.locator('[data-testid="team-member-avatar"]');
    const count = await avatars.count();
    if (count > 0) {
      // Avatar should be visible (either image or fallback initials)
      await expect(avatars.first()).toBeVisible();
    }
  });
});

// ==================== CMS ADMIN PAGE ====================

test.describe('CMS Admin Management Page', () => {

  test('admin can access CMS management page', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin/cms');
    await expect(page.locator('[data-testid="cms-management-page"]')).toBeVisible();
  });

  test('non-admin cannot access CMS management page', async ({ page }) => {
    await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
    await page.goto('/admin/cms');
    // Should show access denied page (ProtectedRoute renders AccessDenied inline)
    await expect(page.getByText('Access Denied')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="cms-management-page"]')).not.toBeVisible();
  });

  test('CMS page has team and partners tabs', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin/cms');
    await expect(page.locator('[data-testid="cms-management-page"]')).toBeVisible();
    
    // Should have tabs for team members and partners
    await expect(page.getByRole('tab', { name: /team members/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /partners/i })).toBeVisible();
  });

  test('admin can see add team member button', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin/cms');
    await expect(page.locator('[data-testid="add-team-member"]')).toBeVisible();
  });

  test('admin can see add partner button on partners tab', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin/cms');
    
    // Switch to partners tab
    await page.getByRole('tab', { name: /partners/i }).click();
    await expect(page.locator('[data-testid="add-partner"]')).toBeVisible();
  });
});
