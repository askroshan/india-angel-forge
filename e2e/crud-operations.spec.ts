/**
 * E2E Tests for CRUD Operations by User Role
 * 
 * These tests verify that Create, Read, Update, Delete operations work correctly
 * for each user role across all major features.
 * 
 * Test Coverage:
 * - US-ADMIN-003: Event Management (Admin)
 * - US-ADMIN-004: Application Review (Admin)
 * - US-COMPLIANCE-001: KYC Review (Compliance)
 * - US-COMPLIANCE-002: AML Screening (Compliance)
 * - US-INVESTOR-001: Submit Application (Investor)
 * - US-INVESTOR-004: Express Interest (Investor)
 * - US-FOUNDER-001: Submit Application (Founder)
 * - US-MODERATOR-001: Application Screening (Moderator)
 */

import { test, expect, Page } from '@playwright/test';

// Only run in chromium for faster E2E tests
test.use({ browserName: 'chromium' });

// Test credentials
const TEST_USERS = {
  admin: { email: 'admin@indiaangelforum.test', password: 'Admin@12345' },
  moderator: { email: 'moderator@indiaangelforum.test', password: 'Moderator@12345' },
  compliance: { email: 'compliance@indiaangelforum.test', password: 'Compliance@12345' },
  investor: { email: 'investor.standard@test.com', password: 'Investor@12345' },
  operatorAngel: { email: 'operator.angel@test.com', password: 'Operator@12345' },
  founder: { email: 'founder@startup.test', password: 'Founder@12345' },
};

// Helper function to login
async function login(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL((url: URL) => !url.pathname.includes('/auth'), { timeout: 10000 });
}

// Helper to get auth token from localStorage
async function getAuthToken(page: Page): Promise<string> {
  return await page.evaluate(() => localStorage.getItem('auth_token') || '');
}

// ==================== US-ADMIN-003: Event Management CRUD ====================

test.describe('US-ADMIN-003: Event Management CRUD', () => {
  
  test.describe('CREATE Event', () => {
    test('admin can create event via API', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.post('/api/admin/events', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'E2E Test Event ' + Date.now(),
          description: 'This is a test event created by E2E tests',
          eventDate: '2026-04-15T10:00:00Z',
          location: 'Mumbai, India',
          capacity: 100
        }
      });
      
      expect(response.status()).toBe(201);
      const event = await response.json();
      expect(event.title).toContain('E2E Test Event');
    });

    test('admin cannot create event without required title', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.post('/api/admin/events', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          location: 'Mumbai',
          eventDate: '2026-04-15T10:00:00Z'
        }
      });
      
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    test('admin can create event with minimum required fields only', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.post('/api/admin/events', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'Minimal Event ' + Date.now(),
          eventDate: '2026-05-01T10:00:00Z'
        }
      });
      
      expect(response.status()).toBe(201);
    });

    test('investor cannot create events - returns 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.post('/api/admin/events', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'Investor Event',
          eventDate: '2026-06-15T10:00:00Z'
        }
      });
      
      expect(response.status()).toBe(403);
    });
  });

  test.describe('READ Events', () => {
    test('admin can view list of events via API', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.get('/api/admin/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.ok()).toBe(true);
      const events = await response.json();
      expect(Array.isArray(events)).toBe(true);
    });

    test('admin can view event details via API', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      const token = await getAuthToken(page);
      
      // Get events list first
      const listResponse = await page.request.get('/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (listResponse.ok()) {
        const events = await listResponse.json();
        if (events.length > 0) {
          // Get single event
          const response = await page.request.get(`/api/events/${events[0].id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          expect(response.ok()).toBe(true);
          const event = await response.json();
          expect(event.id).toBe(events[0].id);
        }
      }
    });

    test('public can view events list (read-only)', async ({ page }) => {
      const response = await page.request.get('/api/events');
      
      expect(response.ok()).toBe(true);
      const events = await response.json();
      expect(Array.isArray(events)).toBe(true);
    });

    test('investor can view events list', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.get('/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.ok()).toBe(true);
    });
  });

  test.describe('UPDATE Event', () => {
    test('admin can update event title', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      const token = await getAuthToken(page);
      
      // First create an event
      const createResponse = await page.request.post('/api/admin/events', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'Event To Update',
          eventDate: '2026-07-15T10:00:00Z'
        }
      });
      
      if (createResponse.ok()) {
        const event = await createResponse.json();
        
        // Update the event
        const updateResponse = await page.request.patch(`/api/admin/events/${event.id}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            title: 'Updated Event Title'
          }
        });
        
        expect(updateResponse.ok()).toBe(true);
        const updated = await updateResponse.json();
        expect(updated.title).toBe('Updated Event Title');
      }
    });

    test('admin can update event location', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      const token = await getAuthToken(page);
      
      // Create event first
      const createResponse = await page.request.post('/api/admin/events', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'Location Update Test',
          eventDate: '2026-07-20T10:00:00Z',
          location: 'Delhi'
        }
      });
      
      if (createResponse.ok()) {
        const event = await createResponse.json();
        
        const updateResponse = await page.request.patch(`/api/admin/events/${event.id}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            location: 'Mumbai'
          }
        });
        
        expect(updateResponse.ok()).toBe(true);
        const updated = await updateResponse.json();
        expect(updated.location).toBe('Mumbai');
      }
    });

    test('admin can update event capacity', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      const token = await getAuthToken(page);
      
      const createResponse = await page.request.post('/api/admin/events', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'Capacity Update Test',
          eventDate: '2026-07-25T10:00:00Z',
          capacity: 50
        }
      });
      
      if (createResponse.ok()) {
        const event = await createResponse.json();
        
        const updateResponse = await page.request.patch(`/api/admin/events/${event.id}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            capacity: 100
          }
        });
        
        expect(updateResponse.ok()).toBe(true);
        const updated = await updateResponse.json();
        expect(updated.capacity).toBe(100);
      }
    });

    test('investor cannot update events - returns 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      const token = await getAuthToken(page);
      
      // Try to update a random event ID
      const response = await page.request.patch('/api/admin/events/test-event-id', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'Hacked Title'
        }
      });
      
      expect(response.status()).toBe(403);
    });
  });

  test.describe('DELETE Event', () => {
    test('admin can delete event', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      const token = await getAuthToken(page);
      
      // Create event first
      const createResponse = await page.request.post('/api/admin/events', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'Event To Delete',
          eventDate: '2026-08-15T10:00:00Z'
        }
      });
      
      if (createResponse.ok()) {
        const event = await createResponse.json();
        
        // Delete the event
        const deleteResponse = await page.request.delete(`/api/admin/events/${event.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        expect(deleteResponse.ok()).toBe(true);
        
        // Verify event is deleted by trying to fetch
        const getResponse = await page.request.get(`/api/events/${event.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        expect(getResponse.status()).toBe(404);
      }
    });

    test('investor cannot delete events - returns 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.delete('/api/admin/events/test-event-id', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.status()).toBe(403);
    });

    test('founder cannot delete events - returns 403', async ({ page }) => {
      await login(page, TEST_USERS.founder.email, TEST_USERS.founder.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.delete('/api/admin/events/test-event-id', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.status()).toBe(403);
    });
  });
});

// ==================== US-INVESTOR-001: Event Registration CRUD ====================

test.describe('US-INVESTOR-001: Event Registration', () => {
  
  test.describe('CREATE Registration', () => {
    test('investor can register for an event', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      const token = await getAuthToken(page);
      
      // Get available events
      const eventsResponse = await page.request.get('/api/events');
      if (eventsResponse.ok()) {
        const events = await eventsResponse.json();
        
        if (events.length > 0) {
          const eventId = events[0].id;
          
          const response = await page.request.post('/api/events/register', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              eventId,
              fullName: 'Test Investor',
              email: TEST_USERS.investor.email
            }
          });
          
          // Either success or already registered
          expect([201, 400]).toContain(response.status());
        }
      }
    });

    test('investor cannot register twice for same event', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      const token = await getAuthToken(page);
      
      // Get available events
      const eventsResponse = await page.request.get('/api/events');
      if (eventsResponse.ok()) {
        const events = await eventsResponse.json();
        
        if (events.length > 0) {
          const eventId = events[0].id;
          
          // First registration attempt
          await page.request.post('/api/events/register', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              eventId,
              fullName: 'Test Investor',
              email: TEST_USERS.investor.email
            }
          });
          
          // Second registration attempt
          const response = await page.request.post('/api/events/register', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              eventId,
              fullName: 'Test Investor',
              email: TEST_USERS.investor.email
            }
          });
          
          expect(response.status()).toBe(400);
          const body = await response.json();
          expect(body.error.code).toBe('ALREADY_REGISTERED');
        }
      }
    });

    test('founder can register for events', async ({ page }) => {
      await login(page, TEST_USERS.founder.email, TEST_USERS.founder.password);
      const token = await getAuthToken(page);
      
      const eventsResponse = await page.request.get('/api/events');
      if (eventsResponse.ok()) {
        const events = await eventsResponse.json();
        
        if (events.length > 0) {
          const eventId = events[0].id;
          
          const response = await page.request.post('/api/events/register', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              eventId,
              fullName: 'Test Founder',
              email: TEST_USERS.founder.email
            }
          });
          
          expect([201, 400]).toContain(response.status());
        }
      }
    });

    test('unauthenticated user cannot register - returns 401', async ({ page }) => {
      const eventsResponse = await page.request.get('/api/events');
      if (eventsResponse.ok()) {
        const events = await eventsResponse.json();
        
        if (events.length > 0) {
          const response = await page.request.post('/api/events/register', {
            headers: { 'Content-Type': 'application/json' },
            data: {
              eventId: events[0].id,
              fullName: 'Anonymous',
              email: 'anon@test.com'
            }
          });
          
          expect(response.status()).toBe(401);
        }
      }
    });
  });

  test.describe('READ Registrations', () => {
    test('investor can view their own registrations', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.get('/api/events/my-registrations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Should return 200 with array (possibly empty)
      expect(response.ok()).toBe(true);
      const registrations = await response.json();
      expect(Array.isArray(registrations)).toBe(true);
    });

    test('admin can view all event registrations', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.get('/api/admin/event-registrations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.ok()).toBe(true);
      const registrations = await response.json();
      expect(Array.isArray(registrations)).toBe(true);
    });

    test('investor cannot view admin registrations endpoint - returns 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.get('/api/admin/event-registrations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.status()).toBe(403);
    });
  });
});

// ==================== US-COMPLIANCE-001: KYC Review CRUD ====================

test.describe('US-COMPLIANCE-001: KYC Document Review', () => {
  
  test.describe('READ KYC Submissions', () => {
    test('compliance officer can view pending KYC submissions', async ({ page }) => {
      await login(page, TEST_USERS.compliance.email, TEST_USERS.compliance.password);
      await page.goto('/compliance/kyc-review');
      
      // Should see KYC review page
      await expect(page.getByRole('heading', { name: /kyc/i })).toBeVisible();
    });

    test('admin can view KYC submissions', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      await page.goto('/compliance/kyc-review');
      
      await expect(page.getByRole('heading', { name: /kyc/i })).toBeVisible();
    });

    test('investor cannot view KYC review page - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      await page.goto('/compliance/kyc-review');
      
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });

    test('founder cannot view KYC review page - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.founder.email, TEST_USERS.founder.password);
      await page.goto('/compliance/kyc-review');
      
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });
  });

  test.describe('UPDATE KYC Status', () => {
    test('compliance officer can approve KYC submission', async ({ page }) => {
      await login(page, TEST_USERS.compliance.email, TEST_USERS.compliance.password);
      const token = await getAuthToken(page);
      
      // Get pending KYC documents using correct endpoint
      const response = await page.request.get('/api/compliance/kyc-review', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.ok()).toBe(true);
      const documents = await response.json();
      
      if (documents.length > 0) {
        const pending = documents.filter((d: { status: string }) => d.status === 'pending');
        
        if (pending.length > 0) {
          const updateResponse = await page.request.put(`/api/compliance/kyc-review/${pending[0].id}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              status: 'verified',
              notes: 'Approved by E2E test'
            }
          });
          
          expect(updateResponse.ok()).toBe(true);
        }
      }
    });

    test('compliance officer can reject KYC submission with reason', async ({ page }) => {
      await login(page, TEST_USERS.compliance.email, TEST_USERS.compliance.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.get('/api/compliance/kyc-review', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.ok()).toBe(true);
      const documents = await response.json();
      
      if (documents.length > 0) {
        const pending = documents.filter((d: { status: string }) => d.status === 'pending');
        
        if (pending.length > 0) {
          const updateResponse = await page.request.put(`/api/compliance/kyc-review/${pending[0].id}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              status: 'rejected',
              notes: 'Document unclear - please resubmit'
            }
          });
          
          expect(updateResponse.ok()).toBe(true);
        }
      }
    });

    test('investor cannot update KYC status - returns 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.put('/api/compliance/kyc-review/test-id', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          status: 'verified'
        }
      });
      
      expect(response.status()).toBe(403);
    });
  });
});

// ==================== US-COMPLIANCE-002: AML Screening CRUD ====================

test.describe('US-COMPLIANCE-002: AML Screening', () => {
  
  test.describe('READ AML Screenings', () => {
    test('compliance officer can view AML screenings', async ({ page }) => {
      await login(page, TEST_USERS.compliance.email, TEST_USERS.compliance.password);
      await page.goto('/compliance/aml-screening');
      
      await expect(page.getByRole('heading', { name: /aml|anti-money|screening/i })).toBeVisible();
    });

    test('admin can view AML screenings', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      await page.goto('/compliance/aml-screening');
      
      await expect(page.getByRole('heading', { name: /aml|anti-money|screening/i })).toBeVisible();
    });

    test('investor cannot view AML screenings - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      await page.goto('/compliance/aml-screening');
      
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });
  });

  test.describe('UPDATE AML Status', () => {
    test('compliance officer can update AML screening status', async ({ page }) => {
      await login(page, TEST_USERS.compliance.email, TEST_USERS.compliance.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.get('/api/compliance/aml-screenings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok()) {
        const screenings = await response.json();
        const pending = screenings.filter((s: { status: string }) => s.status === 'pending');
        
        if (pending.length > 0) {
          const updateResponse = await page.request.put(`/api/compliance/aml-screening/${pending[0].id}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              status: 'cleared',
              riskLevel: 'low',
              notes: 'Cleared by E2E test'
            }
          });
          
          expect(updateResponse.ok()).toBe(true);
        }
      }
    });

    test('investor cannot update AML screening - returns 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.put('/api/compliance/aml-screening/test-id', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          status: 'cleared'
        }
      });
      
      expect(response.status()).toBe(403);
    });
  });
});

// ==================== US-FOUNDER-001: Founder Application ====================

test.describe('US-FOUNDER-001: Founder Application', () => {
  
  test.describe('CREATE Application', () => {
    test('founder application page is accessible', async ({ page }) => {
      await page.goto('/apply/founder');
      
      // Should show the founder application heading
      await expect(page.getByRole('heading', { name: /apply for funding/i })).toBeVisible();
      
      // Form should be visible
      await expect(page.getByText(/company information/i)).toBeVisible();
    });

    test('founder application form shows required field validation', async ({ page }) => {
      await page.goto('/apply/founder');
      
      // Try to submit empty form by clicking submit
      await page.getByRole('button', { name: /submit/i }).click();
      
      // Should show validation errors (form validates on submit)
      await expect(page.getByText(/required|at least/i).first()).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('READ Application Status', () => {
    test('founder can view their application status', async ({ page }) => {
      await login(page, TEST_USERS.founder.email, TEST_USERS.founder.password);
      await page.goto('/founder/application-status');
      
      // Should see application status page
      await expect(page.getByRole('heading', { name: /application|status/i })).toBeVisible();
    });

    test('investor cannot view founder application status - sees 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      await page.goto('/founder/application-status');
      
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });
  });
});

// ==================== US-INVESTOR-004: Deal Interest ====================

test.describe('US-INVESTOR-004: Deal Interest', () => {
  
  test.describe('READ Deal Interests', () => {
    test('investor can view their expressed interests via API', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      const token = await getAuthToken(page);
      
      // Use API endpoint to read interests
      const response = await page.request.get('/api/deals/interests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.ok()).toBe(true);
      const interests = await response.json();
      expect(Array.isArray(interests)).toBe(true);
    });

    test('investor can view their deal pipeline page', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      await page.goto('/investor/pipeline');
      
      // Should see pipeline page with correct heading
      await expect(page.getByRole('heading', { name: /my deal pipeline/i })).toBeVisible();
    });

    test('founder cannot view investor deal interests - returns 403', async ({ page }) => {
      await login(page, TEST_USERS.founder.email, TEST_USERS.founder.password);
      const token = await getAuthToken(page);
      
      // Founder shouldn't be able to access investor-specific endpoints
      await page.goto('/investor/pipeline');
      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
    });
  });
});

// ==================== US-MODERATOR-001: Application Screening ====================

test.describe('US-MODERATOR-001: Application Screening', () => {
  
  test.describe('READ Applications', () => {
    test('moderator can view founder applications via API', async ({ page }) => {
      await login(page, TEST_USERS.moderator.email, TEST_USERS.moderator.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.get('/api/moderator/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.ok()).toBe(true);
      const applications = await response.json();
      expect(Array.isArray(applications)).toBe(true);
    });

    test('admin can view applications via API', async ({ page }) => {
      await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.get('/api/moderator/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.ok()).toBe(true);
      const applications = await response.json();
      expect(Array.isArray(applications)).toBe(true);
    });

    test('investor cannot view applications - returns 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.get('/api/moderator/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.status()).toBe(403);
    });
  });

  test.describe('UPDATE Application Status', () => {
    test('moderator can approve founder application', async ({ page }) => {
      await login(page, TEST_USERS.moderator.email, TEST_USERS.moderator.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.get('/api/moderator/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.ok()).toBe(true);
      const applications = await response.json();
      
      if (applications.length > 0) {
        const pending = applications.filter((a: { status: string }) => 
          a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW' || a.status === 'pending'
        );
        
        if (pending.length > 0) {
          const updateResponse = await page.request.patch(`/api/moderator/applications/${pending[0].id}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              status: 'APPROVED',
            }
          });
          
          expect(updateResponse.ok()).toBe(true);
        }
      }
    });

    test('moderator can reject founder application with reason', async ({ page }) => {
      await login(page, TEST_USERS.moderator.email, TEST_USERS.moderator.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.get('/api/moderator/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      expect(response.ok()).toBe(true);
      const applications = await response.json();
      
      if (applications.length > 0) {
        const pending = applications.filter((a: { status: string }) => 
          a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW' || a.status === 'pending'
        );
        
        if (pending.length > 0) {
          const updateResponse = await page.request.patch(`/api/moderator/applications/${pending[0].id}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              status: 'DECLINED',
            }
          });
          
          expect(updateResponse.ok()).toBe(true);
        }
      }
    });

    test('investor cannot update application status - returns 403', async ({ page }) => {
      await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
      const token = await getAuthToken(page);
      
      const response = await page.request.patch('/api/moderator/applications/test-id', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          status: 'APPROVED'
        }
      });
      
      expect(response.status()).toBe(403);
    });
  });
});
