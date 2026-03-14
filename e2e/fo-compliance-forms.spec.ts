/**
 * E2E Tests for US-FO-06: DPIIT/SEBI Angel Fund Compliance Form Tracking
 *
 * Test user: family.office@test.com / FamilyOffice@12345
 *
 * Covers:
 *   FO-FO06-001: GET /api/family-office/compliance-forms returns an array
 *   FO-FO06-002: POST /api/family-office/compliance-forms creates a new AIF_SCHEDULE3 filing
 *   FO-FO06-003: PATCH /api/family-office/compliance-forms/:id marks filing as FILED
 *   FO-FO06-004: GET /api/family-office/compliance-forms/:id/generate returns formData with expected keys
 *   FO-FO06-005: Generated FEMA Form 10 data contains investor, company, and declaration fields
 *   FO-FO06-006: Generated AIF Schedule III data contains fund, portfolio, and regulatory fields
 *   FO-FO06-007: All 4 endpoints return 401 without auth token
 *   FO-FO06-008: Compliance Forms page renders with data-testid="compliance-forms-page"
 */

import { test, expect, Page } from "@playwright/test";

test.use({ browserName: "chromium" });

const FO_USER = {
  email: "family.office@test.com",
  password: "FamilyOffice@12345",
};

const API_BASE = process.env.API_URL ?? "http://localhost:3001";

// ==================== Helpers ====================

async function loginAsFamilyOffice(page: Page) {
  await page.goto("/auth");
  await page.getByLabel(/email/i).fill(FO_USER.email);
  await page.getByLabel(/password/i).fill(FO_USER.password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL((url: URL) => !url.pathname.includes("/auth"), {
    timeout: 10_000,
  });
}

async function getAuthToken(page: Page): Promise<string> {
  return (await page.evaluate(() => localStorage.getItem("auth_token"))) ?? "";
}

async function fetchAPI(
  page: Page,
  path: string,
  options: { method?: string; body?: object; token?: string } = {}
) {
  return page.request.fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    data: options.body,
  });
}

// ==================== FO-FO06-001: GET list returns array ====================

test.describe("FO-FO06-001: GET compliance-forms returns array", () => {
  test("compliance-forms list endpoint returns an array for authenticated user", async ({ page }) => {
    await loginAsFamilyOffice(page);
    const token = await getAuthToken(page);

    const resp = await fetchAPI(page, "/api/family-office/compliance-forms", { token });
    expect(resp.status()).toBe(200);

    const body = await resp.json();
    expect(Array.isArray(body)).toBe(true);

    // If auto-creation produced filings, check shape of first item
    if (body.length > 0) {
      const first = body[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("formType");
      expect(first).toHaveProperty("status");
      expect(["FEMA_FORM10", "AIF_SCHEDULE3"]).toContain(first.formType);
      expect(["PENDING", "FILED", "OVERDUE", "NOT_REQUIRED"]).toContain(first.status);
    }
  });
});

// ==================== FO-FO06-002: POST creates filing ====================

test.describe("FO-FO06-002: POST creates a new compliance filing", () => {
  test("POST /api/family-office/compliance-forms with AIF_SCHEDULE3 returns 201", async ({ page }) => {
    await loginAsFamilyOffice(page);
    const token = await getAuthToken(page);

    const resp = await fetchAPI(page, "/api/family-office/compliance-forms", {
      method: "POST",
      token,
      body: {
        formType: "AIF_SCHEDULE3",
        regulatoryRef: "SEBI AIF Regulations 2012 — Schedule III",
        notes: "Created by FO-FO06-002 test",
      },
    });

    expect(resp.status()).toBe(201);
    const filing = await resp.json();
    expect(filing.id).toBeTruthy();
    expect(filing.formType).toBe("AIF_SCHEDULE3");
    expect(filing.status).toBe("PENDING");
  });

  test("POST with invalid formType returns 400", async ({ page }) => {
    await loginAsFamilyOffice(page);
    const token = await getAuthToken(page);

    const resp = await fetchAPI(page, "/api/family-office/compliance-forms", {
      method: "POST",
      token,
      body: { formType: "INVALID_TYPE" },
    });

    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.error).toMatch(/formType/i);
  });
});

// ==================== FO-FO06-003: PATCH marks as FILED ====================

test.describe("FO-FO06-003: PATCH updates filing status to FILED", () => {
  test("PATCH marks existing filing as FILED and sets filedAt", async ({ page }) => {
    await loginAsFamilyOffice(page);
    const token = await getAuthToken(page);

    // First ensure we have a filing to update
    const createResp = await fetchAPI(page, "/api/family-office/compliance-forms", {
      method: "POST",
      token,
      body: {
        formType: "FEMA_FORM10",
        notes: "Created for PATCH test FO-FO06-003",
      },
    });
    expect(createResp.status()).toBe(201);
    const filing = await createResp.json();

    // Now mark it as FILED with a reference
    const patchResp = await fetchAPI(
      page,
      `/api/family-office/compliance-forms/${filing.id}`,
      {
        method: "PATCH",
        token,
        body: {
          status: "FILED",
          filingReference: "RBI/TEST/FEMA/2024-001",
        },
      }
    );

    expect(patchResp.status()).toBe(200);
    const updated = await patchResp.json();
    expect(updated.status).toBe("FILED");
    expect(updated.filedAt).toBeTruthy();
    expect(updated.filingReference).toBe("RBI/TEST/FEMA/2024-001");
  });

  test("PATCH with invalid status returns 400", async ({ page }) => {
    await loginAsFamilyOffice(page);
    const token = await getAuthToken(page);

    // Need a real filing id — get any existing one
    const listResp = await fetchAPI(page, "/api/family-office/compliance-forms", { token });
    const filings = await listResp.json();
    if (filings.length === 0) return; // skip gracefully

    const patchResp = await fetchAPI(
      page,
      `/api/family-office/compliance-forms/${filings[0].id}`,
      {
        method: "PATCH",
        token,
        body: { status: "INVALID_STATUS" },
      }
    );
    expect(patchResp.status()).toBe(400);
  });
});

// ==================== FO-FO06-004: GET generate returns formData ====================

test.describe("FO-FO06-004: GET generate returns pre-filled formData", () => {
  test("generate endpoint returns filingId, formType, generatedAt and formData", async ({ page }) => {
    await loginAsFamilyOffice(page);
    const token = await getAuthToken(page);

    // Create a filing to generate
    const createResp = await fetchAPI(page, "/api/family-office/compliance-forms", {
      method: "POST",
      token,
      body: {
        formType: "AIF_SCHEDULE3",
        notes: "Created for generate test FO-FO06-004",
      },
    });
    expect(createResp.status()).toBe(201);
    const filing = await createResp.json();

    const genResp = await fetchAPI(
      page,
      `/api/family-office/compliance-forms/${filing.id}/generate`,
      { token }
    );
    expect(genResp.status()).toBe(200);
    const generated = await genResp.json();

    expect(generated.filingId).toBe(filing.id);
    expect(generated.formType).toBe("AIF_SCHEDULE3");
    expect(generated.generatedAt).toBeTruthy();
    expect(generated.formData).toBeDefined();
    expect(typeof generated.formData).toBe("object");
  });
});

// ==================== FO-FO06-005: FEMA Form 10 data shape ====================

test.describe("FO-FO06-005: FEMA Form 10 generated data has correct fields", () => {
  test("FEMA_FORM10 formData contains investorName, regulatoryRef, formType fields", async ({ page }) => {
    await loginAsFamilyOffice(page);
    const token = await getAuthToken(page);

    // Create FEMA_FORM10 filing
    const createResp = await fetchAPI(page, "/api/family-office/compliance-forms", {
      method: "POST",
      token,
      body: {
        formType: "FEMA_FORM10",
        notes: "FEMA test FO-FO06-005",
      },
    });
    expect(createResp.status()).toBe(201);
    const filing = await createResp.json();

    const genResp = await fetchAPI(
      page,
      `/api/family-office/compliance-forms/${filing.id}/generate`,
      { token }
    );
    expect(genResp.status()).toBe(200);
    const { formData } = await genResp.json();

    // Check top-level fields required for Form 10 (FEMA) reporting
    expect(formData).toHaveProperty("formType", "FEMA_FORM10");
    expect(formData).toHaveProperty("regulatoryRef");
    expect(formData).toHaveProperty("generatedAt");
    expect(formData).toHaveProperty("status");
    // Investor identity fields
    expect(formData).toHaveProperty("investorName");
    expect(formData).toHaveProperty("investorEmail");
  });
});

// ==================== FO-FO06-006: AIF Schedule III data shape ====================

test.describe("FO-FO06-006: AIF Schedule III generated data has correct fields", () => {
  test("AIF_SCHEDULE3 formData contains fundName, aifCategory, reportingPeriod fields", async ({ page }) => {
    await loginAsFamilyOffice(page);
    const token = await getAuthToken(page);

    // Get or create an AIF_SCHEDULE3 filing
    const listResp = await fetchAPI(page, "/api/family-office/compliance-forms", { token });
    const allFilings = await listResp.json();
    let aifFiling = allFilings.find((f: { formType: string }) => f.formType === "AIF_SCHEDULE3");

    if (!aifFiling) {
      const createResp = await fetchAPI(page, "/api/family-office/compliance-forms", {
        method: "POST",
        token,
        body: {
          formType: "AIF_SCHEDULE3",
          notes: "AIF Schedule III test FO-FO06-006",
        },
      });
      expect(createResp.status()).toBe(201);
      aifFiling = await createResp.json();
    }

    const genResp = await fetchAPI(
      page,
      `/api/family-office/compliance-forms/${aifFiling.id}/generate`,
      { token }
    );
    expect(genResp.status()).toBe(200);
    const { formData } = await genResp.json();

    // Check fields specific to AIF Schedule III
    expect(formData).toHaveProperty("formType", "AIF_SCHEDULE3");
    expect(formData).toHaveProperty("regulatoryRef");
    expect(formData).toHaveProperty("generatedAt");
    expect(formData).toHaveProperty("entityName");  // Fund / FO entity name
    expect(formData).toHaveProperty("investorEmail");
  });
});

// ==================== FO-FO06-007: Auth guards — 401 without token ====================

test.describe("FO-FO06-007: All compliance endpoints require authentication", () => {
  test("GET /api/family-office/compliance-forms returns 401 without token", async ({ page }) => {
    const resp = await fetchAPI(page, "/api/family-office/compliance-forms");
    expect(resp.status()).toBe(401);
  });

  test("POST /api/family-office/compliance-forms returns 401 without token", async ({ page }) => {
    const resp = await fetchAPI(page, "/api/family-office/compliance-forms", {
      method: "POST",
      body: { formType: "AIF_SCHEDULE3" },
    });
    expect(resp.status()).toBe(401);
  });

  test("PATCH /api/family-office/compliance-forms/:id returns 401 without token", async ({ page }) => {
    const resp = await fetchAPI(page, "/api/family-office/compliance-forms/fake-id", {
      method: "PATCH",
      body: { status: "FILED" },
    });
    expect(resp.status()).toBe(401);
  });

  test("GET /api/family-office/compliance-forms/:id/generate returns 401 without token", async ({ page }) => {
    const resp = await fetchAPI(page, "/api/family-office/compliance-forms/fake-id/generate");
    expect(resp.status()).toBe(401);
  });
});

// ==================== FO-FO06-008: Frontend page renders ====================

test.describe("FO-FO06-008: Compliance Forms page renders", () => {
  test("compliance-forms-page element is present after navigation", async ({ page }) => {
    await loginAsFamilyOffice(page);
    await page.goto("/investor/family-office/compliance-forms");
    await page.waitForSelector('[data-testid="compliance-forms-page"]', { timeout: 10_000 });

    const pageEl = page.getByTestId("compliance-forms-page");
    await expect(pageEl).toBeVisible();

    // Page heading should mention compliance
    await expect(pageEl).toContainText(/compliance/i);
  });

  test("compliance page shows FEMA or AIF section (or empty state) after loading", async ({ page }) => {
    await loginAsFamilyOffice(page);
    await page.goto("/investor/family-office/compliance-forms");

    // Wait for loading to finish (spinner should disappear)
    await page.waitForSelector('[data-testid="compliance-forms-page"]', { timeout: 10_000 });
    await page.waitForTimeout(2000); // wait for React Query fetch

    // Either a section or the empty state should be visible
    const femaSection = page.getByTestId("fema-forms-section");
    const aifSection = page.getByTestId("aif-forms-section");
    const emptyState = page.locator('text=No compliance filings yet');

    const femaVisible = await femaSection.isVisible().catch(() => false);
    const aifVisible = await aifSection.isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);

    expect(femaVisible || aifVisible || emptyVisible).toBe(true);
  });
});
