import { test, expect } from '@playwright/test';

test('Debug: Navigate to events page and check', async ({ page }) => {
  test.setTimeout(60000);
  // Login
  await page.goto('/login');
  await page.fill('input[type="email"]', 'investor.standard@test.com');
  await page.fill('input[type="password"]', 'Investor@12345');
  await page.click('button[type="submit"]');
  await page.waitForURL((url: URL) => url.pathname === '/' || url.pathname === '/dashboard', { timeout: 10000 });

  // Navigate to events
  await page.goto('/events');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Wait for data loading

  // Check what the page shows
  const content = await page.content();
  const hasNoEvents = content.includes('No upcoming events');
  const hasEventCard = content.includes('data-testid="event-card"');
  
  console.log('Page state:', { hasNoEvents, hasEventCard });

  // Try direct API call from page context
  const apiResult = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/events?filter=upcoming');
      const data = await response.json();
      return {
        status: response.status,
        isArray: Array.isArray(data),
        count: Array.isArray(data) ? data.length : 'not an array',
        hasData: data && 'data' in data,
        dataCount: data && 'data' in data ? data.data.length : null,
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('API result from page:', apiResult);

  // Take screenshot (fullPage: false to avoid Firefox/Mobile Chrome screenshot limits)
  await page.screenshot({ path: 'debug-events-simple.png', fullPage: false });

  // The test will fail to show us the logs
  expect(hasEventCard).toBe(true);
});
