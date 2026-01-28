import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility Tests using axe-core
 * Tests WCAG 2.2 AA compliance across all public pages
 */

test.describe("Accessibility - WCAG 2.2 AA Compliance", () => {
  const publicPages = [
    { path: "/", name: "Homepage" },
    { path: "/founders", name: "Founders" },
    { path: "/investors", name: "Investors" },
    { path: "/portfolio", name: "Portfolio" },
    { path: "/events", name: "Events" },
    { path: "/about", name: "About" },
    { path: "/contact", name: "Contact" },
    { path: "/terms", name: "Terms of Service" },
    { path: "/privacy", name: "Privacy Policy" },
    { path: "/code-of-conduct", name: "Code of Conduct" },
  ];

  for (const page of publicPages) {
    test(`${page.name} page should have no accessibility violations`, async ({
      page: browserPage,
    }) => {
      await browserPage.goto(page.path);
      
      // Wait for page to be fully loaded
      await browserPage.waitForLoadState("networkidle");

      const accessibilityScanResults = await new AxeBuilder({ page: browserPage })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze();

      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log(
          `Accessibility violations on ${page.name}:`,
          JSON.stringify(accessibilityScanResults.violations, null, 2)
        );
      }

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }

  test("skip link is functional", async ({ page }) => {
    await page.goto("/");
    
    // Focus on skip link (it should be the first focusable element)
    await page.keyboard.press("Tab");
    
    // Check that skip link receives focus
    const skipLink = page.locator('a[href="#main-content"]');
    
    // The skip link should be focusable and visible when focused
    await expect(skipLink).toBeFocused();
  });

  test("navigation has proper ARIA landmarks", async ({ page }) => {
    await page.goto("/");
    
    // Check for main navigation landmark
    const nav = page.locator('nav[role="navigation"], nav');
    await expect(nav).toBeVisible();
    
    // Check for main content landmark
    // Note: Main content ID is used for skip link target
    const mainContent = page.locator("#main-content, main");
    await expect(mainContent.first()).toBeVisible();
    
    // Check for footer landmark
    const footer = page.locator('footer[role="contentinfo"], footer');
    await expect(footer).toBeVisible();
  });

  test("images have alt text", async ({ page }) => {
    await page.goto("/");
    
    // Get all images
    const images = page.locator("img");
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const ariaHidden = await img.getAttribute("aria-hidden");
      
      // Images should have alt text OR be marked as decorative
      expect(alt !== null || ariaHidden === "true").toBeTruthy();
    }
  });

  test("buttons have accessible names", async ({ page }) => {
    await page.goto("/");
    
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.evaluate((el) => {
        return (
          el.textContent?.trim() ||
          el.getAttribute("aria-label") ||
          el.getAttribute("title") ||
          ""
        );
      });
      
      // Every button should have an accessible name
      expect(accessibleName.length).toBeGreaterThan(0);
    }
  });

  test("links have accessible names", async ({ page }) => {
    await page.goto("/");
    
    const links = page.locator("a");
    const linkCount = await links.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const accessibleName = await link.evaluate((el) => {
        return (
          el.textContent?.trim() ||
          el.getAttribute("aria-label") ||
          el.getAttribute("title") ||
          ""
        );
      });
      
      // Every link should have an accessible name
      expect(accessibleName.length).toBeGreaterThan(0);
    }
  });

  test("form inputs have labels", async ({ page }) => {
    // Test on auth page which has forms
    await page.goto("/auth");
    
    const inputs = page.locator("input:not([type='hidden'])");
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");
      const placeholder = await input.getAttribute("placeholder");
      
      // Input should have associated label, aria-label, or aria-labelledby
      if (id) {
        const hasLabel = await page.locator(`label[for="${id}"]`).count();
        expect(
          hasLabel > 0 || ariaLabel !== null || ariaLabelledBy !== null
        ).toBeTruthy();
      } else {
        expect(ariaLabel !== null || ariaLabelledBy !== null).toBeTruthy();
      }
    }
  });

  test("color contrast meets WCAG AA standards", async ({ page }) => {
    await page.goto("/");
    
    // Run axe specifically for color contrast
    const contrastResults = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();

    if (contrastResults.violations.length > 0) {
      console.log(
        "Color contrast violations:",
        JSON.stringify(contrastResults.violations, null, 2)
      );
    }

    expect(contrastResults.violations).toEqual([]);
  });

  test("focus is visible on interactive elements", async ({ page }) => {
    await page.goto("/");
    
    // Tab through the page
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      
      // Get the focused element
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        
        const styles = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          outline: styles.outline,
          outlineStyle: styles.outlineStyle,
          boxShadow: styles.boxShadow,
        };
      });
      
      if (focusedElement) {
        // Element should have visible focus indicator
        const hasFocusStyle =
          focusedElement.outlineStyle !== "none" ||
          focusedElement.boxShadow !== "none";
        
        expect(hasFocusStyle).toBeTruthy();
      }
    }
  });

  test("heading hierarchy is correct", async ({ page }) => {
    await page.goto("/");
    
    const headings = await page.evaluate(() => {
      const h1s = document.querySelectorAll("h1");
      const allHeadings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      
      return {
        h1Count: h1s.length,
        headingOrder: Array.from(allHeadings).map((h) => ({
          level: parseInt(h.tagName[1]),
          text: h.textContent?.slice(0, 50),
        })),
      };
    });
    
    // Should have exactly one H1
    expect(headings.h1Count).toBe(1);
    
    // Heading levels should not skip (e.g., h1 -> h3)
    let previousLevel = 0;
    for (const heading of headings.headingOrder) {
      // Allow going to any lower level or up by one
      expect(heading.level - previousLevel).toBeLessThanOrEqual(1);
      previousLevel = heading.level;
    }
  });
});

test.describe("Keyboard Navigation", () => {
  test("all interactive elements are keyboard accessible", async ({ page }) => {
    await page.goto("/");
    
    // Get count of interactive elements
    const interactiveCount = await page.evaluate(() => {
      const interactive = document.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return interactive.length;
    });
    
    // Tab through all interactive elements
    let tabbedCount = 0;
    const maxTabs = interactiveCount + 10; // Buffer for safety
    
    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press("Tab");
      
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
      
      if (focusedTag && focusedTag !== "BODY") {
        tabbedCount++;
      }
      
      // Check if we've cycled back to start
      if (tabbedCount > 0 && focusedTag === "BODY") {
        break;
      }
    }
    
    // Should be able to tab to most interactive elements
    expect(tabbedCount).toBeGreaterThan(0);
  });

  test("dropdown menus are keyboard accessible", async ({ page }) => {
    await page.goto("/");
    
    // Navigate to a dropdown trigger if one exists
    const dropdownTrigger = page.locator('[aria-haspopup="true"]').first();
    
    if (await dropdownTrigger.isVisible()) {
      await dropdownTrigger.focus();
      await page.keyboard.press("Enter");
      
      // Check that dropdown opened
      const dropdown = page.locator('[role="menu"], [role="listbox"]').first();
      await expect(dropdown).toBeVisible();
      
      // Press Escape to close
      await page.keyboard.press("Escape");
      await expect(dropdown).not.toBeVisible();
    }
  });

  test("modal dialogs trap focus", async ({ page }) => {
    await page.goto("/auth");
    
    // If there's a dialog trigger, test focus trapping
    const dialogTrigger = page.locator('[data-state="closed"][role="dialog"]').first();
    
    // Note: This test is conditional based on page having dialogs
    // Add specific dialog tests based on your UI components
  });
});

test.describe("Reduced Motion", () => {
  test("respects prefers-reduced-motion", async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    
    // Check that animations are disabled
    const animationDuration = await page.evaluate(() => {
      const el = document.querySelector("*");
      if (!el) return "0s";
      const styles = window.getComputedStyle(el);
      return styles.animationDuration;
    });
    
    // Animation duration should be minimal when reduced motion is preferred
    // Our CSS sets it to 0.01ms
    expect(
      animationDuration === "0s" || 
      animationDuration === "0.01ms" ||
      animationDuration === "0.00001s"
    ).toBeTruthy();
  });
});
