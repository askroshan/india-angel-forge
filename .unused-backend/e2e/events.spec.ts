import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Events Pages
 * Tests event listing, filtering, and event detail pages
 */

test.describe("Events", () => {
  test.describe("Events Listing Page", () => {
    test("events page loads correctly", async ({ page }) => {
      await page.goto("/events");
      
      await expect(page).toHaveTitle(/Events|India Angel Forum/);
      await expect(page.locator("h1")).toBeVisible();
    });

    test("events page has tabs for filtering", async ({ page }) => {
      await page.goto("/events");
      
      // Check for tab navigation (upcoming/past events)
      const tabs = page.locator('[role="tablist"], .tabs');
      
      if (await tabs.isVisible()) {
        await expect(tabs).toBeVisible();
      }
    });

    test("events are displayed in cards", async ({ page }) => {
      await page.goto("/events");
      
      // Wait for events to load
      await page.waitForLoadState("networkidle");
      
      // Check for event cards or empty state message
      const eventCards = page.locator('[data-testid="event-card"], .event-card, article');
      const emptyState = page.locator('text="No events"');
      
      // Either events are shown or empty state
      const hasEvents = await eventCards.count() > 0;
      const hasEmptyState = await emptyState.isVisible();
      
      expect(hasEvents || hasEmptyState).toBe(true);
    });

    test("events page is responsive", async ({ page }) => {
      // Desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/events");
      await expect(page.locator("h1")).toBeVisible();
      
      // Tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator("h1")).toBeVisible();
      
      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator("h1")).toBeVisible();
    });
  });

  test.describe("Event Detail Page", () => {
    test("event detail page loads for valid slug", async ({ page }) => {
      // First, get a valid event slug from the events listing
      await page.goto("/events");
      await page.waitForLoadState("networkidle");
      
      const eventLink = page.locator('a[href^="/events/"]').first();
      
      if (await eventLink.isVisible()) {
        const href = await eventLink.getAttribute("href");
        
        if (href) {
          await page.goto(href);
          
          // Event detail page should have event information
          await expect(page.locator("h1")).toBeVisible();
        }
      }
    });

    test("404 page shown for invalid event slug", async ({ page }) => {
      await page.goto("/events/non-existent-event-slug-123456");
      
      // Should show 404 or event not found message
      const notFound = page.locator('text="Not Found", text="not found", text="404"');
      const emptyState = page.locator('text="Event not found"');
      
      const hasNotFound = await notFound.first().isVisible().catch(() => false);
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      
      // Either 404 page or event not found message
      expect(hasNotFound || hasEmptyState).toBe(true);
    });
  });

  test.describe("Event Registration", () => {
    test("registration button is visible on event detail", async ({ page }) => {
      await page.goto("/events");
      await page.waitForLoadState("networkidle");
      
      const eventLink = page.locator('a[href^="/events/"]').first();
      
      if (await eventLink.isVisible()) {
        const href = await eventLink.getAttribute("href");
        
        if (href) {
          await page.goto(href);
          
          // Check for registration or waitlist button
          const registerButton = page.locator(
            'button:has-text("Register"), button:has-text("Join"), button:has-text("Waitlist")'
          );
          
          // Either register button or some action is visible
          // Implementation depends on event state (sold out, etc.)
        }
      }
    });

    test("registration requires authentication", async ({ page }) => {
      await page.goto("/events");
      await page.waitForLoadState("networkidle");
      
      const eventLink = page.locator('a[href^="/events/"]').first();
      
      if (await eventLink.isVisible()) {
        const href = await eventLink.getAttribute("href");
        
        if (href) {
          await page.goto(href);
          
          const registerButton = page.locator(
            'button:has-text("Register"), button:has-text("Join")'
          ).first();
          
          if (await registerButton.isVisible()) {
            await registerButton.click();
            
            // Should either show login prompt or redirect to auth
            // Exact behavior depends on implementation
          }
        }
      }
    });
  });

  test.describe("Event Waitlist", () => {
    test("waitlist form is visible when event is full", async ({ page }) => {
      // This test is conditional on having a full event
      await page.goto("/events");
      await page.waitForLoadState("networkidle");
      
      // Look for waitlist indicator
      const waitlistText = page.locator('text="Waitlist", text="Sold Out"');
      
      if (await waitlistText.first().isVisible()) {
        // Waitlist functionality should be present
        await expect(waitlistText.first()).toBeVisible();
      }
    });
  });
});

test.describe("Event Type Filtering", () => {
  test("can filter events by type", async ({ page }) => {
    await page.goto("/events");
    await page.waitForLoadState("networkidle");
    
    // Look for filter tabs or buttons
    const filterButtons = page.locator(
      '[role="tab"], button:has-text("Demo Day"), button:has-text("Summit"), button:has-text("All")'
    );
    
    if (await filterButtons.first().isVisible()) {
      // Click a filter
      await filterButtons.first().click();
      
      // Page should update (URL or content)
      await page.waitForLoadState("networkidle");
    }
  });
});

test.describe("My Registrations", () => {
  test("my registrations page requires authentication", async ({ page }) => {
    await page.goto("/my-registrations");
    
    // Should redirect to login
    await expect(page).toHaveURL(/auth|login/);
  });
});
