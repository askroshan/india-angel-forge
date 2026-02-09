/**
 * Debug test to check AdminEvents page state
 */

import { test, expect } from '@playwright/test';

test('Debug AdminEvents page state', async ({ page }) => {
  // Listen to console messages
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));
  
  // Login as admin
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@indiaangelforum.test');
  await page.fill('input[type="password"]', 'Admin@12345');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  
  // Check if user is actually logged in
  const userMenuButton = page.locator('button:has-text("admin")');
  const isLoggedIn = await userMenuButton.isVisible();
  console.log('User logged in:', isLoggedIn);
  
  // Navigate to admin events
  await page.goto('/admin/events');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Take screenshot (fullPage: false to avoid Firefox >32767px limit)
  await page.screenshot({ path: 'debug-admin-events.png', fullPage: false });
  
  // Check URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  // Check if loading spinner is visible
  const loadingSpinner = await page.locator('.animate-spin').isVisible();
  console.log('Loading spinner:', loadingSpinner);
  
  // Check what's visible
  const loading = await page.locator('[data-testid="admin-events-loading"]').isVisible();
  const error = await page.locator('[data-testid="admin-events-error"]').isVisible();
  const empty = await page.locator('[data-testid="admin-events-empty"]').isVisible();
  const eventRows = await page.locator('[data-testid="admin-event-row"]').count();
  
  console.log('Page state:');
  console.log('- Loading:', loading);
  console.log('- Error:', error);
  console.log('- Empty:', empty);
  console.log('- Event rows:', eventRows);
  
  // Check if Access Denied page is shown
  const accessDenied = await page.locator('text=Access Denied').isVisible();
  console.log('- Access Denied:', accessDenied);
  
  // Get all h1, h2, h3 headings
  const headings = await page.locator('h1, h2, h3').allTextContents();
  console.log('- Headings:', headings);
});
