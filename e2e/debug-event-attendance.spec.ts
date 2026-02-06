/**
 * Debug test for EventAttendance page
 */

import { test } from '@playwright/test';

test('Debug EventAttendance page state', async ({ page }) => {
  // Listen to console messages
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));
  
  // Login as admin
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@indiaangelforum.test');
  await page.fill('input[type="password"]', 'Admin@12345');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  
  // Navigate to admin events
  await page.goto('/admin/events');
  await page.waitForLoadState('networkidle');
  
  // Click first event's "Manage Attendance" button
  const firstEventRow = page.locator('[data-testid="admin-event-row"]').first();
  await firstEventRow.locator('[data-testid="manage-attendance"]').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'debug-event-attendance.png', fullPage: true });
  
  // Check URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  // Get all h1, h2, h3 headings
  const headings = await page.locator('h1, h2, h3').allTextContents();
  console.log('- Headings:', headings);
  
  // Check for errors
  const errorMessages = await page.locator('.text-destructive').allTextContents();
  console.log('- Error messages:', errorMessages);
});
