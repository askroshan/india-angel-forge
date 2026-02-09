import { test, expect } from '@playwright/test';

test('debug activity page', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@indiaangelforum.test');
  await page.fill('input[type="password"]', 'Admin@12345');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  
  // Navigate to activity page
  await page.goto('/activity');
  await page.waitForTimeout(3000);
  
  // Get page content
  const url = page.url();
  const title = await page.title();
  const body = await page.locator('body').innerHTML();
  const h1Elements = await page.locator('h1').count();
  const headings = await page.locator('h1, h2, h3').allTextContents();
  
  console.log('=== DEBUG INFO ===');
  console.log('URL:', url);
  console.log('Title:', title);
  console.log('H1 count:', h1Elements);
  console.log('Headings:', headings);
  console.log('Body length:', body.length);
  console.log('Body preview:', body.substring(0, 2000));
  
  // Check localStorage
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  const user = await page.evaluate(() => localStorage.getItem('auth_user'));
  console.log('auth_token:', token ? 'SET (' + token.length + ' chars)' : 'NULL');
  console.log('auth_user:', user ? 'SET' : 'NULL');
  
  // Check for errors in console
  const consoleMessages: string[] = [];
  page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));
  
  expect(h1Elements).toBeGreaterThan(0);
});
