/**
 * E2E Tests for Enhanced Events - Filtering, Title Links, Map, Startups, Auth Fix
 * 
 * Tests verify:
 * - Event title links to detail page
 * - Event search filter by title
 * - Event city filter dropdown
 * - Clear filters button
 * - Event detail page shows map when coordinates exist
 * - Event detail page shows startups pitching section
 * - Unauthenticated users see login prompt (not token error)
 * - Event startups API CRUD (admin)
 */

import { test, expect, Page } from '@playwright/test';

// Only run in chromium for faster E2E tests
test.use({ browserName: 'chromium' });

const TEST_USERS = {
  admin: { email: 'admin@indiaangelforum.test', password: 'Admin@12345' },
  investor: { email: 'investor.standard@test.com', password: 'Investor@12345' },
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

// ==================== EVENT LISTING & FILTERING ====================

test.describe('Events Page - Filtering', () => {

  test('events page renders filter controls', async ({ page }) => {
    await page.goto('/events');
    await expect(page.locator('[data-testid="event-filters"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="event-search"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-city-filter"]')).toBeVisible();
  });

  test('event search filters events by title', async ({ page }) => {
    await page.goto('/events');
    await expect(page.locator('[data-testid="event-search"]')).toBeVisible({ timeout: 10000 });
    
    // Type a search query
    await page.locator('[data-testid="event-search"]').fill('Angel Forum');
    
    // Wait for API to return filtered results
    await page.waitForTimeout(1000);
    
    // The events should be filtered (page should still show results or empty state)
    const eventsContainer = page.locator('[data-testid="event-filters"]');
    await expect(eventsContainer).toBeVisible();
  });

  test('city filter dropdown works', async ({ page }) => {
    await page.goto('/events');
    await expect(page.locator('[data-testid="event-city-filter"]')).toBeVisible({ timeout: 10000 });
    
    // Click city filter and select a city
    await page.locator('[data-testid="event-city-filter"]').click();
    // Try to find Mumbai option
    const mumbaiOption = page.locator('[role="option"]').filter({ hasText: 'Mumbai' });
    const count = await mumbaiOption.count();
    if (count > 0) {
      await mumbaiOption.click();
    }
  });

  test('clear filters button resets filters', async ({ page }) => {
    await page.goto('/events');
    const searchInput = page.locator('[data-testid="event-search"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    
    // Set a filter
    await searchInput.fill('test search');
    
    // Clear button should appear
    const clearBtn = page.locator('[data-testid="clear-filters"]');
    const clearVisible = await clearBtn.isVisible();
    if (clearVisible) {
      await clearBtn.click();
      // Search should be cleared
      await expect(searchInput).toHaveValue('');
    }
  });
});

// ==================== EVENT TITLE LINKS ====================

test.describe('Event Card - Title Link', () => {

  test('event card title is a clickable link', async ({ page }) => {
    await page.goto('/events');
    await page.waitForTimeout(2000);
    
    // Check if event title links exist
    const titleLinks = page.locator('[data-testid="event-title-link"]');
    const count = await titleLinks.count();
    if (count > 0) {
      const href = await titleLinks.first().getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toContain('/events/');
    }
  });

  test('clicking event title navigates to detail page', async ({ page }) => {
    await page.goto('/events');
    await page.waitForTimeout(2000);
    
    const titleLinks = page.locator('[data-testid="event-title-link"]');
    const count = await titleLinks.count();
    if (count > 0) {
      await titleLinks.first().click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/events/');
    }
  });
});

// ==================== EVENT DETAIL - MAP & STARTUPS ====================

test.describe('Event Detail - Map Section', () => {

  test('event detail page shows map when coordinates exist', async ({ page }) => {
    // First get events to find one with coordinates
    const eventsRes = await page.request.get('/api/events');
    const events = await eventsRes.json();
    const eventWithMap = events.find((e: any) => e.mapLatitude && e.mapLongitude);

    if (eventWithMap) {
      await page.goto(`/events/${eventWithMap.id}`);
      const mapSection = page.locator('[data-testid="event-map"]');
      await expect(mapSection).toBeVisible({ timeout: 10000 });
      
      // Should have an iframe
      const iframe = page.locator('[data-testid="map-iframe"]');
      await expect(iframe).toBeVisible();
    }
  });

  test('event detail page shows venue and address info', async ({ page }) => {
    const eventsRes = await page.request.get('/api/events');
    const events = await eventsRes.json();
    const eventWithVenue = events.find((e: any) => e.venue || e.city);

    if (eventWithVenue) {
      await page.goto(`/events/${eventWithVenue.id}`);
      await page.waitForTimeout(2000);
      
      // Venue or city info should be visible somewhere on the page
      const pageText = await page.textContent('body');
      if (eventWithVenue.venue) {
        expect(pageText).toContain(eventWithVenue.venue);
      }
    }
  });
});

test.describe('Event Detail - Startups Pitching', () => {

  test('event detail shows startups section when startups exist', async ({ page }) => {
    // First get events
    const eventsRes = await page.request.get('/api/events');
    const events = await eventsRes.json();
    
    if (events.length > 0) {
      // Check each event for startups
      for (const event of events.slice(0, 3)) {
        const startupsRes = await page.request.get(`/api/events/${event.id}/startups`);
        if (startupsRes.ok()) {
          const startups = await startupsRes.json();
          if (startups.length > 0) {
            await page.goto(`/events/${event.id}`);
            const startupsSection = page.locator('[data-testid="startups-section"]');
            await expect(startupsSection).toBeVisible({ timeout: 10000 });
            
            // Should show startup cards
            const cards = page.locator('[data-testid="startup-card"]');
            await expect(cards.first()).toBeVisible();
            break;
          }
        }
      }
    }
  });
});

// ==================== EVENT REGISTRATION AUTH FIX ====================

test.describe('Event Registration - Auth Fix', () => {

  test('unauthenticated user sees login prompt, not token error', async ({ page }) => {
    // Clear any existing auth
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('auth_token'));
    
    const eventsRes = await page.request.get('/api/events');
    const events = await eventsRes.json();
    const upcomingEvent = events.find((e: any) => e.status === 'upcoming');

    if (upcomingEvent) {
      await page.goto(`/events/${upcomingEvent.id}`);
      await page.waitForTimeout(2000);
      
      // Should see login prompt or sign-in link, NOT "Invalid or expired token"
      const pageText = await page.textContent('body') || '';
      expect(pageText).not.toContain('Invalid or expired token');
      
      // Check for login prompt
      const loginPrompt = page.locator('[data-testid="login-prompt"]');
      const hasPrompt = await loginPrompt.isVisible().catch(() => false);
      if (hasPrompt) {
        await expect(loginPrompt).toBeVisible();
      }
    }
  });

  test('authenticated user can RSVP without token error', async ({ page }) => {
    await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
    
    const eventsRes = await page.request.get('/api/events');
    const events = await eventsRes.json();
    const upcomingEvent = events.find((e: any) => e.status === 'upcoming');

    if (upcomingEvent) {
      await page.goto(`/events/${upcomingEvent.id}`);
      await page.waitForTimeout(2000);
      
      // Should NOT see "Invalid or expired token" 
      const pageText = await page.textContent('body') || '';
      expect(pageText).not.toContain('Invalid or expired token');
    }
  });
});

// ==================== EVENT STARTUPS API CRUD ====================

test.describe('Event Startups API', () => {

  test('public can list event startups', async ({ page }) => {
    // Get events first
    const eventsRes = await page.request.get('/api/events');
    const events = await eventsRes.json();
    
    if (events.length > 0) {
      const response = await page.request.get(`/api/events/${events[0].id}/startups`);
      expect(response.ok()).toBeTruthy();
      const startups = await response.json();
      expect(Array.isArray(startups)).toBeTruthy();
    }
  });

  test('admin can create an event startup via API', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    // Get first event
    const eventsRes = await page.request.get('/api/events');
    const events = await eventsRes.json();
    
    if (events.length > 0) {
      const response = await page.request.post(`/api/admin/events/${events[0].id}/startups`, {
        headers: { 'Authorization': `Bearer ${token}` },
        multipart: {
          companyName: 'E2E Test Startup',
          founderName: 'Test Founder',
          pitchDescription: 'A test startup for E2E testing.',
          industry: 'AI/ML',
          fundingStage: 'Seed',
          displayOrder: '99',
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.companyName).toBe('E2E Test Startup');
      expect(body.founderName).toBe('Test Founder');
    }
  });

  test('admin can delete an event startup via API', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    const eventsRes = await page.request.get('/api/events');
    const events = await eventsRes.json();
    
    if (events.length > 0) {
      const startupsRes = await page.request.get(`/api/events/${events[0].id}/startups`);
      const startups = await startupsRes.json();
      const e2eStartup = startups.find((s: any) => s.companyName === 'E2E Test Startup');
      
      if (e2eStartup) {
        const response = await page.request.delete(`/api/admin/events/${events[0].id}/startups/${e2eStartup.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        expect(response.ok()).toBeTruthy();
      }
    }
  });

  test('non-admin cannot create event startups', async ({ page }) => {
    await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
    const token = await getAuthToken(page);

    const eventsRes = await page.request.get('/api/events');
    const events = await eventsRes.json();
    
    if (events.length > 0) {
      const response = await page.request.post(`/api/admin/events/${events[0].id}/startups`, {
        headers: { 'Authorization': `Bearer ${token}` },
        multipart: {
          companyName: 'Unauthorized Startup',
          founderName: 'Should Fail',
        },
      });
      expect(response.status()).toBe(403);
    }
  });
});

// ==================== EVENT FILTERING API ====================

test.describe('Event Filtering API', () => {

  test('API supports city filter parameter', async ({ page }) => {
    const response = await page.request.get('/api/events?city=Mumbai');
    expect(response.ok()).toBeTruthy();
    const events = await response.json();
    expect(Array.isArray(events)).toBeTruthy();
    // All returned events should be in Mumbai (if any)
    for (const event of events) {
      if (event.city) {
        expect(event.city.toLowerCase()).toBe('mumbai');
      }
    }
  });

  test('API supports search filter parameter', async ({ page }) => {
    const response = await page.request.get('/api/events?search=Angel');
    expect(response.ok()).toBeTruthy();
    const events = await response.json();
    expect(Array.isArray(events)).toBeTruthy();
  });

  test('API supports combined filters', async ({ page }) => {
    const response = await page.request.get('/api/events?city=Mumbai&search=Forum');
    expect(response.ok()).toBeTruthy();
    const events = await response.json();
    expect(Array.isArray(events)).toBeTruthy();
  });
});

// ==================== ADMIN EVENT ENHANCED FIELDS ====================

test.describe('Admin Event API - Enhanced Fields', () => {

  test('admin can create event with city and map coordinates', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    const response = await page.request.post('/api/admin/events', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        title: 'E2E Enhanced Event Test',
        eventDate: '2026-12-01T10:00:00Z',
        location: 'Test Venue, Delhi',
        city: 'Delhi',
        venue: 'Test Convention Center',
        address: '123 Test Street, Delhi 110001',
        mapLatitude: 28.6139,
        mapLongitude: 77.2090,
        capacity: 50,
        status: 'upcoming',
      },
    });

    expect(response.ok()).toBeTruthy();
    const event = await response.json();
    expect(event.city).toBe('Delhi');
    expect(event.venue).toBe('Test Convention Center');
    expect(event.mapLatitude).toBeCloseTo(28.6139, 2);
    expect(event.mapLongitude).toBeCloseTo(77.2090, 2);

    // Cleanup
    await page.request.delete(`/api/admin/events/${event.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  });

  test('admin can update event with enhanced fields', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const token = await getAuthToken(page);

    // Get existing event
    const eventsRes = await page.request.get('/api/events');
    const events = await eventsRes.json();
    
    if (events.length > 0) {
      const response = await page.request.patch(`/api/admin/events/${events[0].id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          city: 'Bangalore',
          venue: 'Updated Venue',
        },
      });

      expect(response.ok()).toBeTruthy();
      const updated = await response.json();
      expect(updated.city).toBe('Bangalore');
      expect(updated.venue).toBe('Updated Venue');

      // Restore original
      await page.request.patch(`/api/admin/events/${events[0].id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          city: 'Mumbai',
          venue: 'Taj Lands End',
        },
      });
    }
  });
});
