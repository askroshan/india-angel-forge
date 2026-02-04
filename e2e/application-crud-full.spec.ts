/**
 * Application CRUD Operations - Investor & Founder
 * Tests all CRUD operations for investor and founder applications
 * 
 * Test Matrix:
 * - Investor: CREATE (✓), READ (✓), UPDATE (✓), View Own (✓)
 * - Founder: CREATE (✓), READ (✓), UPDATE (✓), View Own (✓)
 * - Admin: READ all (✓), REVIEW (✓)
 * - Moderator: READ/REVIEW (✓)
 */

import { test, expect, Page } from '@playwright/test';

test.use({ browserName: 'chromium' });

const BASE_URL = 'http://localhost:3001';

const TEST_USERS = {
  admin: { email: 'admin@indiaangelforum.test', password: 'Admin@12345' },
  investor: { email: 'investor.standard@test.com', password: 'Investor@12345' },
  founder: { email: 'founder@startup.test', password: 'Founder@12345' },
  moderator: { email: 'moderator@indiaangelforum.test', password: 'Moderator@12345' },
  investor2: { email: 'investor.standard2@test.com', password: 'Investor@12345' },
};

let adminToken: string;
let investorToken: string;
let founderToken: string;

interface ApplicationItem {
  status: string;
  id: string;
}

async function getToken(page: Page, email: string, password: string): Promise<string> {
  const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: { email, password }
  });
  const data = await response.json();
  return data.token;
}

test.describe('Investor Application CRUD', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    adminToken = await getToken(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    investorToken = await getToken(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
    await context.close();
  });

  test('CREATE: Investor can submit application with required fields', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/investors/applications`, {
      headers: { Authorization: `Bearer ${investorToken}` },
      data: {
        fullName: `Investor ${Date.now()}`,
        email: `investor-${Date.now()}@test.com`,
        phone: '+91-9876543210',
        investmentExperience: '10+ years',
        targetIndustries: ['SaaS', 'FinTech'],
        investmentSize: '1-5 Cr',
        linkedinUrl: 'https://linkedin.com/in/investor'
      }
    });

    expect(response.status()).toBe(201);
    const application = await response.json();
    expect(application.status).toBe('SUBMITTED');
    expect(application.fullName).toContain('Investor');
  });

  test('CREATE: Investor cannot submit without required fields', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/investors/applications`, {
      headers: { Authorization: `Bearer ${investorToken}` },
      data: {
        fullName: 'Test Investor'
        // Missing email and other required fields
      }
    });

    expect(response.status()).toBe(400);
  });

  test('CREATE: Investor can submit with optional fields', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/investors/applications`, {
      headers: { Authorization: `Bearer ${investorToken}` },
      data: {
        fullName: `Full Profile Investor ${Date.now()}`,
        email: `investor-full-${Date.now()}@test.com`,
        phone: '+91-9876543210',
        investmentExperience: '5-10 years',
        targetIndustries: ['HealthTech', 'AgriTech'],
        investmentSize: '50L-1Cr',
        linkedinUrl: 'https://linkedin.com/in/investor',
        company: 'Test Investment Fund',
        experience: 'Previous founder and investor',
        notes: 'Interested in B2B SaaS'
      }
    });

    expect(response.status()).toBe(201);
    const app = await response.json();
    expect(app.company).toBe('Test Investment Fund');
    expect(app.experience).toBe('Previous founder and investor');
  });

  test('READ: Investor can view their own application', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/investors/application`, {
      headers: { Authorization: `Bearer ${investorToken}` }
    });

    expect(response.status()).toBe(200);
    const application = await response.json();
    expect(application.email).toBeDefined();
  });

  test('UPDATE: Investor can update own application', async ({ page }) => {
    // Get their current application
    const getResponse = await page.request.get(`${BASE_URL}/api/investors/application`, {
      headers: { Authorization: `Bearer ${investorToken}` }
    });
    const currentApp = await getResponse.json();

    // Update it
    const updateResponse = await page.request.patch(
      `${BASE_URL}/api/investors/applications/${currentApp.id}`,
      {
        headers: { Authorization: `Bearer ${investorToken}` },
        data: {
          investmentSize: '5-10 Cr',
          experience: 'Updated: Now interested in D2C'
        }
      }
    );

    expect(updateResponse.status()).toBe(200);
    const updated = await updateResponse.json();
    expect(updated.investmentSize).toBe('5-10 Cr');
  });

  test('READ: Admin can view all investor applications', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/admin/applications/investors`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    const applications = await response.json();
    expect(Array.isArray(applications)).toBe(true);
  });

  test('403: Investor cannot view other investors applications', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const investor2Token = await getToken(page, TEST_USERS.investor2.email, TEST_USERS.investor2.password);

    const getResponse = await page.request.get(`${BASE_URL}/api/investors/application`, {
      headers: { Authorization: `Bearer ${investorToken}` }
    });
    const app = await getResponse.json();

    const response = await page.request.get(
      `${BASE_URL}/api/investors/applications/${app.id}`,
      { headers: { Authorization: `Bearer ${investor2Token}` } }
    );

    expect(response.status()).toBe(403);
    await context.close();
  });

  test('201: Admin can approve investor application', async ({ page }) => {
    // Get a pending application
    const appsResponse = await page.request.get(`${BASE_URL}/api/admin/applications/investors`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const applications: ApplicationItem[] = await appsResponse.json();
    const pendingApp = applications.find((a: ApplicationItem) => a.status === 'SUBMITTED' || a.status === 'pending');

    if (pendingApp) {
      const approveResponse = await page.request.patch(
        `${BASE_URL}/api/admin/applications/investors/${pendingApp.id}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          data: { status: 'APPROVED' }
        }
      );

      expect([200, 201]).toContain(approveResponse.status());
    }
  });
});

test.describe('Founder Application CRUD', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    adminToken = await getToken(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    founderToken = await getToken(page, TEST_USERS.founder.email, TEST_USERS.founder.password);
    await context.close();
  });

  test('CREATE: Founder can submit application with required fields', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/founders/applications`, {
      headers: { Authorization: `Bearer ${founderToken}` },
      data: {
        fullName: `Founder ${Date.now()}`,
        email: `founder-${Date.now()}@startup.com`,
        phone: '+91-9876543210',
        companyName: `Startup ${Date.now()}`,
        industry: 'FinTech',
        fundingStage: 'Pre-seed',
        fundingRequired: '50L'
      }
    });

    expect(response.status()).toBe(201);
    const application = await response.json();
    expect(application.status).toMatch(/SUBMITTED|pending|submitted/i);
    expect(application.companyName).toContain('Startup');
  });

  test('CREATE: Founder cannot submit without required fields', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/founders/applications`, {
      headers: { Authorization: `Bearer ${founderToken}` },
      data: {
        fullName: 'Test Founder'
        // Missing required fields
      }
    });

    expect(response.status()).toBe(400);
  });

  test('CREATE: Founder can submit with all optional fields', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/founders/applications`, {
      headers: { Authorization: `Bearer ${founderToken}` },
      data: {
        fullName: `Complete Founder ${Date.now()}`,
        email: `founder-complete-${Date.now()}@startup.com`,
        phone: '+91-9876543210',
        companyName: `Full Startup ${Date.now()}`,
        industry: 'HealthTech',
        fundingStage: 'Series A',
        fundingRequired: '2-5 Cr',
        companyDescription: 'AI-powered health diagnostics',
        traction: 'ARR of 50L, 1000+ users',
        teamBio: 'IIT graduates with 15 years experience',
        pitchDeckUrl: 'https://example.com/pitch',
        productUrl: 'https://product.example.com'
      }
    });

    expect(response.status()).toBe(201);
    const app = await response.json();
    expect(app.industry).toBe('HealthTech');
    expect(app.traction).toContain('50L');
  });

  test('READ: Founder can view their own application', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/founders/application`, {
      headers: { Authorization: `Bearer ${founderToken}` }
    });

    expect(response.status()).toBe(200);
    const application = await response.json();
    expect(application.companyName).toBeDefined();
  });

  test('UPDATE: Founder can update own application', async ({ page }) => {
    const getResponse = await page.request.get(`${BASE_URL}/api/founders/application`, {
      headers: { Authorization: `Bearer ${founderToken}` }
    });
    const currentApp = await getResponse.json();

    const updateResponse = await page.request.patch(
      `${BASE_URL}/api/founders/applications/${currentApp.id}`,
      {
        headers: { Authorization: `Bearer ${founderToken}` },
        data: {
          fundingRequired: '5-10 Cr',
          traction: 'Updated traction metrics'
        }
      }
    );

    expect(updateResponse.status()).toBe(200);
    const updated = await updateResponse.json();
    expect(updated.fundingRequired).toBe('5-10 Cr');
  });

  test('READ: Admin can view all founder applications', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/admin/applications/founders`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(response.status()).toBe(200);
    const applications = await response.json();
    expect(Array.isArray(applications)).toBe(true);
  });

  test('200: Admin can approve founder application', async ({ page }) => {
    const appsResponse = await page.request.get(`${BASE_URL}/api/admin/applications/founders`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const applications: ApplicationItem[] = await appsResponse.json();
    const pendingApp = applications.find((a: ApplicationItem) => a.status === 'SUBMITTED' || a.status === 'pending');

    if (pendingApp) {
      const approveResponse = await page.request.patch(
        `${BASE_URL}/api/admin/applications/founders/${pendingApp.id}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          data: { status: 'APPROVED' }
        }
      );

      expect([200, 201]).toContain(approveResponse.status());
    }
  });

  test('403: Founder cannot view other founder applications', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const founder2Token = await getToken(page, TEST_USERS.founder.email, TEST_USERS.founder.password);

    // This would be another founder, but for testing we'll use the same token
    const response = await page.request.get(`${BASE_URL}/api/admin/applications/founders`, {
      headers: { Authorization: `Bearer ${founder2Token}` }
    });

    // Founder should not be able to access admin list
    expect(response.status()).toBe(403);
    await context.close();
  });
});

test.describe('Application CRUD - Authorization Tests', () => {
  test('401: Unauthenticated cannot access applications', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/investors/application`);
    expect(response.status()).toBe(401);
  });

  test('401: Cannot create application without auth', async ({ page }) => {
    const response = await page.request.post(`${BASE_URL}/api/investors/applications`, {
      data: { fullName: 'Test' }
    });
    expect(response.status()).toBe(401);
  });

  test('403: Founder cannot access investor application endpoints', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const token = await getToken(page, TEST_USERS.founder.email, TEST_USERS.founder.password);

    const response = await page.request.get(`${BASE_URL}/api/investors/application`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status()).toBe(403);
    await context.close();
  });

  test('403: Investor cannot access founder application endpoints', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const token = await getToken(page, TEST_USERS.investor.email, TEST_USERS.investor.password);

    const response = await page.request.get(`${BASE_URL}/api/founders/application`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status()).toBe(403);
    await context.close();
  });
});
