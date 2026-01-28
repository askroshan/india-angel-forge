import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Public Pages
 * Tests that all public pages load correctly, navigation works,
 * and scroll-to-top behavior functions properly.
 */

test.describe("Public Pages", () => {
  test("homepage loads correctly", async ({ page }) => {
    await page.goto("/");
    
    // Check page title
    await expect(page).toHaveTitle(/India Angel Forum/);
    
    // Check hero section is visible
    await expect(page.locator("h1")).toBeVisible();
    
    // Check navigation is present
    await expect(page.locator("nav")).toBeVisible();
    
    // Check footer is present
    await expect(page.locator("footer")).toBeVisible();
  });

  test("founders page loads correctly", async ({ page }) => {
    await page.goto("/founders");
    
    await expect(page).toHaveTitle(/Founders|India Angel Forum/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("investors page loads correctly", async ({ page }) => {
    await page.goto("/investors");
    
    await expect(page).toHaveTitle(/Investors|India Angel Forum/);
    await expect(page.locator("h1")).toBeVisible();
    
    // Check membership plans section
    await expect(page.locator("#plans")).toBeVisible();
  });

  test("portfolio page loads correctly", async ({ page }) => {
    await page.goto("/portfolio");
    
    await expect(page.locator("h1")).toBeVisible();
  });

  test("events page loads correctly", async ({ page }) => {
    await page.goto("/events");
    
    await expect(page.locator("h1")).toBeVisible();
  });

  test("about page loads correctly", async ({ page }) => {
    await page.goto("/about");
    
    await expect(page.locator("h1")).toBeVisible();
  });

  test("contact page loads correctly", async ({ page }) => {
    await page.goto("/contact");
    
    await expect(page).toHaveTitle(/Contact/);
    await expect(page.locator("h1")).toContainText("Get in Touch");
    
    // Check contact form container is present
    await expect(page.locator("#companyhub-form")).toBeVisible();
  });
});

test.describe("Legal Pages", () => {
  test("terms page loads with all sections", async ({ page }) => {
    await page.goto("/terms");
    
    await expect(page).toHaveTitle(/Terms of Service/);
    await expect(page.locator("h1")).toContainText("Terms of Service");
    
    // Check table of contents is present
    await expect(page.getByText("Table of Contents")).toBeVisible();
    
    // Check key sections exist
    await expect(page.locator("#introduction")).toBeVisible();
    await expect(page.locator("#definitions")).toBeVisible();
    await expect(page.locator("#governing-law")).toBeVisible();
  });

  test("privacy policy page loads with all sections", async ({ page }) => {
    await page.goto("/privacy");
    
    await expect(page).toHaveTitle(/Privacy Policy/);
    await expect(page.locator("h1")).toContainText("Privacy Policy");
    
    // Check grievance officer section
    await expect(page.locator("#grievance-officer")).toBeVisible();
    await expect(page.getByText("Roshan Shah")).toBeVisible();
  });

  test("code of conduct page loads with all sections", async ({ page }) => {
    await page.goto("/code-of-conduct");
    
    await expect(page).toHaveTitle(/Code of Conduct/);
    await expect(page.locator("h1")).toContainText("Code of Conduct");
    
    // Check key sections
    await expect(page.locator("#prohibited-conduct")).toBeVisible();
    await expect(page.locator("#enforcement")).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("main navigation links work", async ({ page }) => {
    await page.goto("/");
    
    // Test navigation to founders
    await page.click('nav >> a:has-text("Founders")');
    await expect(page).toHaveURL(/founders/);
    
    // Test navigation to investors
    await page.click('nav >> a:has-text("Investors")');
    await expect(page).toHaveURL(/investors/);
    
    // Test navigation to portfolio
    await page.click('nav >> a:has-text("Portfolio")');
    await expect(page).toHaveURL(/portfolio/);
    
    // Test navigation to events
    await page.click('nav >> a:has-text("Events")');
    await expect(page).toHaveURL(/events/);
  });

  test("footer links to legal pages work", async ({ page }) => {
    await page.goto("/");
    
    // Scroll to footer
    await page.locator("footer").scrollIntoViewIfNeeded();
    
    // Test terms link
    await page.click('footer >> a:has-text("Terms & Policies")');
    await expect(page).toHaveURL(/terms/);
    
    // Go back and test privacy link
    await page.goto("/");
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.click('footer >> a:has-text("Privacy Policy")');
    await expect(page).toHaveURL(/privacy/);
    
    // Go back and test code of conduct link
    await page.goto("/");
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.click('footer >> a:has-text("Code of Conduct")');
    await expect(page).toHaveURL(/code-of-conduct/);
  });

  test("contact link in footer works", async ({ page }) => {
    await page.goto("/");
    
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.click('footer >> a:has-text("Contact Us")');
    await expect(page).toHaveURL(/contact/);
  });
});

test.describe("Scroll Behavior", () => {
  test("scroll to top on route change", async ({ page }) => {
    await page.goto("/");
    
    // Scroll down on homepage
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(100);
    
    // Navigate to another page
    await page.click('nav >> a:has-text("About")');
    await page.waitForURL(/about/);
    
    // Verify scroll position is at top
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBe(0);
  });

  test("anchor links scroll to section without resetting", async ({ page }) => {
    await page.goto("/investors");
    
    // Click anchor link to plans section
    await page.click('a[href="#plans"]');
    
    // Wait for scroll
    await page.waitForTimeout(500);
    
    // Verify we scrolled to the plans section
    const plansVisible = await page.locator("#plans").isVisible();
    expect(plansVisible).toBe(true);
  });
});

test.describe("No Email Addresses Displayed", () => {
  test("homepage has no email addresses", async ({ page }) => {
    await page.goto("/");
    
    const content = await page.content();
    expect(content).not.toContain("hello@indiaangelforum.com");
    expect(content).not.toContain("mailto:");
  });

  test("investors page has no email addresses", async ({ page }) => {
    await page.goto("/investors");
    
    const content = await page.content();
    expect(content).not.toContain("hello@indiaangelforum.com");
    expect(content).not.toContain("mailto:");
  });

  test("footer has no email addresses", async ({ page }) => {
    await page.goto("/");
    
    const footerContent = await page.locator("footer").textContent();
    expect(footerContent).not.toContain("@");
  });
});

test.describe("Responsive Design", () => {
  test("mobile navigation works", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    
    // Check that mobile menu button is visible
    const menuButton = page.locator('button[aria-label="Toggle menu"]');
    await expect(menuButton).toBeVisible();
    
    // Click to open menu
    await menuButton.click();
    
    // Check that navigation links are visible
    await expect(page.locator('nav >> a:has-text("Founders")')).toBeVisible();
  });

  test("legal pages are readable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/terms");
    
    // Check content is visible and readable
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("#introduction")).toBeVisible();
  });
});
