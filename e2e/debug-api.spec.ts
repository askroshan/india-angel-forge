import { test, expect } from '@playwright/test';

test('Debug API: Check events API', async ({ page }) => {
  // Go to frontend
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Make direct API call from browser context
  const response = await page.evaluate(async () => {
    const res = await fetch('/api/events?filter=upcoming');
    const data = await res.json();
    return { status: res.status, count: Array.isArray(data) ? data.length : 0, first: data[0] };
  });

  console.log('API Response:', response);
  expect(response.status).toBe(200);
  expect(response.count).toBeGreaterThan(0);
});

test('Debug Events Page: Check if events load', async ({ page }) => {
  test.setTimeout(60000);
  // Login first
  await page.goto('/login');
  await page.fill('input[type="email"]', 'investor.standard@test.com');
  await page.fill('input[type="password"]', 'Investor@12345');
  await page.click('button[type="submit"]');
  await page.waitForURL((url: URL) => url.pathname === '/', { timeout: 10000 });

  // Navigate to events
  await page.goto('/events');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Check page content
  const content = await page.content();
  console.log('Page includes "No upcoming events":', content.includes('No upcoming events'));
  console.log('Page includes "event-card":', content.includes('event-card'));

  // Take screenshot (fullPage: false to avoid Firefox/Mobile Chrome screenshot limits)
  await page.screenshot({ path: 'debug-events-page.png', fullPage: false });

  // Check console logs
  const logs: string[] = [];
  page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));

  await page.reload();
  await page.waitForLoadState('networkidle');
  
  console.log('Browser console logs:', logs);
});
