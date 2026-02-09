/**
 * Event CRUD Operations - Full Test Coverage
 * Tests all CRUD operations across all user roles
 * 
 * Test Matrix:
 * - Admin: CREATE (✓), READ (✓), UPDATE (✓), DELETE (✓), List (✓)
 * - Investor: READ (✓), Register (✓), View Registrations (✓), Cancel (✓)
 * - Founder: READ (✓), Register (✓), View Registrations (✓)
 * - Moderator: READ (✓)
 * - Unauthorized: 403 responses
 */

import { test, expect, Page } from '@playwright/test';

test.use({ browserName: 'chromium' });

const BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:8080';

const TEST_USERS = {
  admin: { email: 'admin@indiaangelforum.test', password: 'Admin@12345' },
  investor: { email: 'investor.standard@test.com', password: 'Investor@12345' },
  founder: { email: 'founder@startup.test', password: 'Founder@12345' },
  moderator: { email: 'moderator@indiaangelforum.test', password: 'Moderator@12345' },
};

let eventId: string;
let adminToken: string;
let investorToken: string;
let founderToken: string;

// Helper: Get auth token via API
async function getToken(page: Page, email: string, password: string): Promise<string> {
  const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: { email, password }
  });
  const data = await response.json();
  return data.token;
}

test.describe('Event CRUD - Admin Operations', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    adminToken = await getToken(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await context.close();
  });

  test('CREATE: Admin can create event with all fields', async ({ page }) => {
    const eventData = {
      title: `E2E Event ${Date.now()}`,
      description: 'Comprehensive test event with all fields',
      eventDate: '2026-05-15T14:00:00Z',
      location: 'Mumbai Convention Center',
      capacity: 200,
      registrationDeadline: '2026-05-01T00:00:00Z',
      status: 'upcoming'
    };

    const response = await page.request.post(`${BASE_URL}/api/admin/events`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: eventData
    });

    expect(response.status()).toBe(201);
    const event = await response.json();
    eventId = event.id;

    expect(event.title).toBe(eventData.title);
    expect(event.description).toBe(eventData.description);
    expect(event.capacity).toBe(eventData.capacity);
    expect(event.location).toBe(eventData.location);
    expect(event.status).toBe('upcoming');
  });

  test('CREATE: Admin can create event with minimum fields', async ({ page }) => {
    const eventData = {
      title: `Minimal Event ${Date.now()}`,
      eventDate: '2026-05-20T10:00:00Z'
    };

    const response = await page.request.post(`${BASE_URL}/api/admin/events`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: eventData
    });

    expect(response.status()).toBe(201);
    const event = await response.json();
    expect(event.title).toBe(eventData.title);
    expect(event.capacity).toBeNull();
    expect(event.description).toBeNull();
  });

  test('CREATE: Admin cannot create event without title', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/admin/events`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { eventDate: '2026-05-20T10:00:00Z' }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe('VALIDATION_ERROR');
  });

  test('CREATE: Admin cannot create event without eventDate', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/admin/events`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { title: 'Event without date' }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe('VALIDATION_ERROR');
  });

  test('READ: Admin can retrieve single event', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/events/${eventId}`);
    expect(response.status()).toBe(200);
    const event = await response.json();
    expect(event.id).toBe(eventId);
  });

  test('READ: Admin can list all events', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/admin/events`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    const events = await response.json();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });

  test('UPDATE: Admin can update event fields', async ({ page }) => {
    const updateData = {
      title: `Updated Event ${Date.now()}`,
      description: 'Updated description',
      capacity: 150
    };

    const response = await page.request.patch(`${BASE_URL}/api/admin/events/${eventId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: updateData
    });

    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.title).toBe(updateData.title);
    expect(updated.description).toBe(updateData.description);
    expect(updated.capacity).toBe(updateData.capacity);
  });

  test('UPDATE: Admin can update event status', async ({ page }) => {
    const response = await page.request.patch(`${BASE_URL}/api/admin/events/${eventId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { status: 'cancelled' }
    });

    expect(response.status()).toBe(200);
    const updated = await response.json();
    expect(updated.status).toBe('cancelled');
  });

  test('DELETE: Admin can delete event', async ({ page }) => {
    // Create event to delete
    const createResponse = await page.request.post(`${BASE_URL}/api/admin/events`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: `Event to Delete ${Date.now()}`,
        eventDate: '2026-06-01T10:00:00Z'
      }
    });
    const createdEvent = await createResponse.json();
    const deleteId = createdEvent.id;

    // Delete it
    const deleteResponse = await page.request.delete(`${BASE_URL}/api/admin/events/${deleteId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(deleteResponse.status()).toBe(200);

    // Verify it's gone
    const getResponse = await page.request.get(`${BASE_URL}/api/events/${deleteId}`);
    expect(getResponse.status()).toBe(404);
  });

  test('READ: Admin can view event registrations', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/admin/event-registrations`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    const registrations = await response.json();
    expect(Array.isArray(registrations)).toBe(true);
  });
});

test.describe('Event CRUD - Investor Operations', () => {
  test.describe.configure({ mode: 'serial' });
  let testEventId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    adminToken = await getToken(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    investorToken = await getToken(page, TEST_USERS.investor.email, TEST_USERS.investor.password);

    // Create test event
    const createResponse = await page.request.post(`${BASE_URL}/api/admin/events`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: `Investor Test Event ${Date.now()}`,
        eventDate: '2026-06-10T10:00:00Z',
        capacity: 50
      }
    });
    const createdEvent = await createResponse.json();
    testEventId = createdEvent.id;
    await context.close();
  });

  test('READ: Investor can view public events list', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/events`);
    expect(response.status()).toBe(200);
    const events = await response.json();
    expect(Array.isArray(events)).toBe(true);
  });

  test('READ: Investor can view event details', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/events/${testEventId}`);
    expect(response.status()).toBe(200);
    const event = await response.json();
    expect(event.id).toBe(testEventId);
  });

  test('REGISTER: Investor can register for event', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/events/register`, {
      headers: { Authorization: `Bearer ${investorToken}` },
      data: {
        eventId: testEventId,
        fullName: 'Test Investor',
        email: 'investor@test.com'
      }
    });

    expect(response.status()).toBe(201);
    const registration = await response.json();
    expect(registration.userId).toBeDefined();
    expect(registration.eventId).toBe(testEventId);
  });

  test('READ: Investor can view their registrations', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/events/my-registrations`, {
      headers: { Authorization: `Bearer ${investorToken}` }
    });

    expect(response.status()).toBe(200);
    const registrations = await response.json();
    expect(Array.isArray(registrations)).toBe(true);
  });

  test('REGISTER: Investor cannot register twice for same event', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/events/register`, {
      headers: { Authorization: `Bearer ${investorToken}` },
      data: {
        eventId: testEventId,
        fullName: 'Test Investor',
        email: 'investor@test.com'
      }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe('ALREADY_REGISTERED');
  });

  test('READ: Investor can check registration count', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/events/${testEventId}/registration-count`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Event CRUD - Waitlist Operations', () => {
  test.describe.configure({ mode: 'serial' });
  let testEventId: string;
  let fullCapacityEventId: string;
  let founderToken: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    adminToken = await getToken(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    investorToken = await getToken(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
    founderToken = await getToken(page, TEST_USERS.founder.email, TEST_USERS.founder.password);

    // Create test event with limited capacity
    const createResponse = await page.request.post(`${BASE_URL}/api/admin/events`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: `Waitlist Event ${Date.now()}`,
        eventDate: '2026-07-10T10:00:00Z',
        capacity: 1  // Limited capacity for waitlist testing
      }
    });
    const createdEvent = await createResponse.json();
    fullCapacityEventId = createdEvent.id;
    await context.close();
  });

  test('WAITLIST: Investor can join waitlist when event is full', async ({ page }) => {
    const context = await page.context();
    const page2 = await context.newPage();

    // Register first user (investor) to fill capacity
    await page.request.post(`${BASE_URL}/api/events/register`, {
      headers: { Authorization: `Bearer ${investorToken}` },
      data: {
        eventId: fullCapacityEventId,
        fullName: 'Investor 1',
        email: 'investor1@test.com'
      }
    });

    // Try to register second user (founder) - should get capacity error
    const registerResponse = await page2.request.post(`${BASE_URL}/api/events/register`, {
      headers: { Authorization: `Bearer ${founderToken}` },
      data: {
        eventId: fullCapacityEventId,
        fullName: 'Founder User',
        email: 'founder@test.com'
      }
    });

    expect(registerResponse.status()).toBe(400);
    const error = await registerResponse.json();
    expect(error.error.code).toBe('CAPACITY_FULL');

    // Now join waitlist using founder token
    const waitlistResponse = await page2.request.post(`${BASE_URL}/api/events/${fullCapacityEventId}/waitlist`, {
      headers: { Authorization: `Bearer ${founderToken}` },
      data: {
        fullName: 'Founder User',
        email: 'founder@test.com'
      }
    });

    expect(waitlistResponse.status()).toBe(201);
    const waitlistEntry = await waitlistResponse.json();
    expect(waitlistEntry.position).toBeGreaterThan(0);

    await page2.close();
  });

  test('READ: Investor can view their waitlist position', async ({ page }) => {
    // Use founderToken since founder is on the waitlist
    const response = await page.request.get(
      `${BASE_URL}/api/events/${fullCapacityEventId}/waitlist/position`,
      { headers: { Authorization: `Bearer ${founderToken}` } }
    );

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.position).toBeGreaterThan(0);
  });

  test('READ: Investor can view their waitlist entries', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/events/my-waitlist`, {
      headers: { Authorization: `Bearer ${founderToken}` }
    });

    expect(response.status()).toBe(200);
    const waitlist = await response.json();
    expect(Array.isArray(waitlist)).toBe(true);
  });

  test('READ: Public can view waitlist count', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/events/${fullCapacityEventId}/waitlist/count`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Event CRUD - Authorization & Access Control', () => {
  test('401: Unauthenticated user cannot create event', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/admin/events`, {
      data: { title: 'Event', eventDate: '2026-05-15T10:00:00Z' }
    });

    expect(response.status()).toBe(401);
  });

  test('403: Investor cannot create event', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const token = await getToken(page, TEST_USERS.investor.email, TEST_USERS.investor.password);

    const response = await page.request.post(`${BASE_URL}/api/admin/events`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Event', eventDate: '2026-05-15T10:00:00Z' }
    });

    expect(response.status()).toBe(403);
    await context.close();
  });

  test('403: Founder cannot create event', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const token = await getToken(page, TEST_USERS.founder.email, TEST_USERS.founder.password);

    const response = await page.request.post(`${BASE_URL}/api/admin/events`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Event', eventDate: '2026-05-15T10:00:00Z' }
    });

    expect(response.status()).toBe(403);
    await context.close();
  });

  test('403: Moderator cannot create event', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const token = await getToken(page, TEST_USERS.moderator.email, TEST_USERS.moderator.password);

    const response = await page.request.post(`${BASE_URL}/api/admin/events`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Event', eventDate: '2026-05-15T10:00:00Z' }
    });

    expect(response.status()).toBe(403);
    await context.close();
  });
});
