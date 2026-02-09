import { test, expect } from '@playwright/test';

test('debug activity page v2', async ({ page }) => {
  const consoleMessages: string[] = [];
  const pageErrors: string[] = [];
  
  page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => pageErrors.push(err.message));

  // Login
  await page.goto('/login');
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'admin@indiaangelforum.test');
  await page.fill('input[type="password"]', 'Admin@12345');
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10000 });
  
  console.log('=== After login console messages ===');
  consoleMessages.forEach(m => console.log(m));
  consoleMessages.length = 0;
  
  // Navigate to activity page
  await page.goto('/activity');
  await page.waitForTimeout(5000);
  
  console.log('=== After /activity console messages ===');
  consoleMessages.forEach(m => console.log(m));
  console.log('=== Page errors ===');
  pageErrors.forEach(m => console.log(m));
  
  // Check what rendered
  const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML || 'NO ROOT');
  console.log('Root HTML length:', rootHTML.length);
  console.log('Root HTML:', rootHTML.substring(0, 3000));
  
  expect(pageErrors).toHaveLength(0);
});
