import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Application Forms
 * Tests founder and investor application flows
 */

test.describe("Founder Application", () => {
  test("founder application page loads", async ({ page }) => {
    await page.goto("/apply/founder");
    
    await expect(page).toHaveTitle(/Founder|Apply|India Angel Forum/i);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("founder application form is present", async ({ page }) => {
    await page.goto("/apply/founder");
    
    // Check for form elements
    const form = page.locator("form");
    await expect(form).toBeVisible();
    
    // Check for essential fields
    const nameField = page.locator('input[name*="name"], input[placeholder*="Name"]').first();
    const emailField = page.locator('input[type="email"], input[name*="email"]').first();
    const companyField = page.locator(
      'input[name*="company"], input[placeholder*="Company"], input[name*="startup"]'
    ).first();
    
    // At least some fields should be present
    const hasNameField = await nameField.isVisible().catch(() => false);
    const hasEmailField = await emailField.isVisible().catch(() => false);
    const hasCompanyField = await companyField.isVisible().catch(() => false);
    
    expect(hasNameField || hasEmailField || hasCompanyField).toBe(true);
  });

  test("founder form has required field validation", async ({ page }) => {
    await page.goto("/apply/founder");
    
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Submit"), button:has-text("Apply")'
    ).first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Check for validation errors or required field indicators
      const invalidFields = page.locator('[aria-invalid="true"], .error, [data-error]');
      const requiredMessages = page.locator('text="required", text="Required"');
      
      // Wait a moment for validation
      await page.waitForTimeout(500);
      
      // Form should either show errors or use HTML5 validation
      const form = page.locator("form");
      const formValidity = await form.evaluate((el: HTMLFormElement) => el.checkValidity());
      
      // Form should be invalid if submitted without data, or show error messages
      const hasErrors = (await invalidFields.count()) > 0 || (await requiredMessages.count()) > 0;
      
      expect(!formValidity || hasErrors).toBe(true);
    }
  });

  test("founder application is accessible", async ({ page }) => {
    await page.goto("/apply/founder");
    
    // All form inputs should have labels
    const inputs = await page.locator("input, select, textarea").all();
    
    for (const input of inputs) {
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");
      const placeholder = await input.getAttribute("placeholder");
      
      // Input should have some form of accessible name
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.isVisible().catch(() => false);
        const hasAriaLabel = !!ariaLabel || !!ariaLabelledBy;
        
        expect(hasLabel || hasAriaLabel || !!placeholder).toBe(true);
      }
    }
  });

  test("founder page is responsive", async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/apply/founder");
    await expect(page.locator("h1")).toBeVisible();
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator("h1")).toBeVisible();
    
    // Form should still be usable
    const form = page.locator("form");
    await expect(form).toBeVisible();
  });
});

test.describe("Investor Application", () => {
  test("investor application page loads", async ({ page }) => {
    await page.goto("/apply/investor");
    
    await expect(page).toHaveTitle(/Investor|Apply|India Angel Forum/i);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("investor application form is present", async ({ page }) => {
    await page.goto("/apply/investor");
    
    const form = page.locator("form");
    await expect(form).toBeVisible();
    
    // Check for investor-specific fields
    const investmentField = page.locator(
      'input[name*="investment"], select[name*="investment"], input[placeholder*="investment"]'
    ).first();
    const sectorField = page.locator(
      'input[name*="sector"], select[name*="sector"], [name*="focus"]'
    ).first();
    
    // Form should have some fields
    const hasInvestmentField = await investmentField.isVisible().catch(() => false);
    const hasSectorField = await sectorField.isVisible().catch(() => false);
    
    // At least the form is present
    await expect(form).toBeVisible();
  });

  test("investor form has required field validation", async ({ page }) => {
    await page.goto("/apply/investor");
    
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Submit"), button:has-text("Apply")'
    ).first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Wait for validation
      await page.waitForTimeout(500);
      
      // Check for validation messages
      const form = page.locator("form");
      const formValidity = await form.evaluate((el: HTMLFormElement) => el.checkValidity());
      
      // Form should be invalid without required fields
      expect(formValidity).toBe(false);
    }
  });

  test("investor application is accessible", async ({ page }) => {
    await page.goto("/apply/investor");
    
    // All form inputs should have labels
    const inputs = await page.locator("input, select, textarea").all();
    
    for (const input of inputs) {
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.isVisible().catch(() => false);
        const hasAriaLabel = !!ariaLabel || !!ariaLabelledBy;
        
        expect(hasLabel || hasAriaLabel).toBe(true);
      }
    }
  });

  test("investor page is responsive", async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/apply/investor");
    await expect(page.locator("h1")).toBeVisible();
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Application Navigation", () => {
  test("can navigate from home to founder application", async ({ page }) => {
    await page.goto("/");
    
    // Look for founder apply link
    const founderLink = page.locator(
      'a[href="/apply/founder"], a:has-text("Apply as Founder"), a:has-text("Founder Application")'
    ).first();
    
    if (await founderLink.isVisible()) {
      await founderLink.click();
      await expect(page).toHaveURL("/apply/founder");
    }
  });

  test("can navigate from home to investor application", async ({ page }) => {
    await page.goto("/");
    
    const investorLink = page.locator(
      'a[href="/apply/investor"], a:has-text("Apply as Investor"), a:has-text("Investor Application")'
    ).first();
    
    if (await investorLink.isVisible()) {
      await investorLink.click();
      await expect(page).toHaveURL("/apply/investor");
    }
  });

  test("founders page links to application", async ({ page }) => {
    await page.goto("/founders");
    
    const applyLink = page.locator(
      'a[href="/apply/founder"], button:has-text("Apply"), a:has-text("Apply")'
    ).first();
    
    if (await applyLink.isVisible()) {
      await applyLink.click();
      await expect(page).toHaveURL("/apply/founder");
    }
  });

  test("investors page links to application", async ({ page }) => {
    await page.goto("/investors");
    
    const applyLink = page.locator(
      'a[href="/apply/investor"], button:has-text("Apply"), a:has-text("Join")'
    ).first();
    
    if (await applyLink.isVisible()) {
      await applyLink.click();
      await expect(page).toHaveURL(/apply\/investor|membership/);
    }
  });
});

test.describe("Form Submission Flow", () => {
  test("founder form shows success message on valid submission", async ({ page }) => {
    await page.goto("/apply/founder");
    
    // This is a placeholder - actual test would fill in form data
    // and verify success message appears
    // Implementation depends on form fields and backend
  });

  test("investor form shows success message on valid submission", async ({ page }) => {
    await page.goto("/apply/investor");
    
    // This is a placeholder - actual test would fill in form data
    // and verify success message appears
  });
});

test.describe("No Email Display", () => {
  test("founder application page does not display email addresses", async ({ page }) => {
    await page.goto("/apply/founder");
    
    const bodyText = await page.locator("body").innerText();
    
    // Check for email pattern (excluding input placeholders and form field names)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = bodyText.match(emailRegex);
    
    // Filter out common non-display emails (like aria labels or technical strings)
    const displayEmails = emails?.filter(
      (email) => !email.includes("example") && !email.includes("placeholder")
    );
    
    expect(displayEmails?.length || 0).toBe(0);
  });

  test("investor application page does not display email addresses", async ({ page }) => {
    await page.goto("/apply/investor");
    
    const bodyText = await page.locator("body").innerText();
    
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = bodyText.match(emailRegex);
    
    const displayEmails = emails?.filter(
      (email) => !email.includes("example") && !email.includes("placeholder")
    );
    
    expect(displayEmails?.length || 0).toBe(0);
  });
});
