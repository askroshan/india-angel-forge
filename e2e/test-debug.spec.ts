import { test, expect } from '@playwright/test';

test('debug page load', async ({ page }) => {
  // Listen for console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });
  
  await page.goto('http://localhost:8080/login');
  await page.fill('input[type="email"]', 'admin@indiaangelforum.test');
  await page.fill('input[type="password"]', 'Admin@12345');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:8080/');
  
  await page.goto('http://localhost:8080/transaction-history');
  await page.waitForTimeout(500);
  const urlAfterNav = page.url();
  console.log('URL after navigation:', urlAfterNav);
  
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  const url = page.url();
  const title = await page.title();
  const body = await page.textContent('body');
  const html = await page.content();
  
  // Check for root div
  const hasRoot = await page.locator('#root').count();
  
  // Check for specific elements
  const hasTransactionHistory = await page.locator('[data-testid="transaction-history"]').count();
  const hasH3 = await page.locator('h3').count();
  const hasCard = await page.locator('.container').count();
  const hasLoading = await page.locator('[class*="animate-spin"]').count();
  
  console.log('URL:', url);
  console.log('Title:', title);
  console.log('Body length:', body?.length);
  console.log('HTML length:', html?.length);
  console.log('#root div:', hasRoot);
  console.log('transaction-history div:', hasTransactionHistory);
  console.log('h3 count:', hasH3);
  console.log('container count:', hasCard);
  console.log('loading spinner:', hasLoading);
  console.log('Body sample:', body?.substring(0, 500));
  console.log('Console errors:', errors);
  
  await page.screenshot({ path: 'debug.png', fullPage: true });
  
  expect(url).toContain('transaction-history');
});
