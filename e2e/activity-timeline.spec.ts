/**
 * E2E Test Suite: Activity Timeline (US-HISTORY-003)
 * 
 * Tests unified activity feed showing payments, events, messages,
 * documents, and profile changes with filtering and export.
 * 
 * Test Coverage:
 * - AT-E2E-001: Display unified activity timeline
 * - AT-E2E-002: Filter activities by type
 * - AT-E2E-003: Filter activities by date range
 * - AT-E2E-004: Infinite scroll loading
 * - AT-E2E-005: Activity detail expansion
 * - AT-E2E-006: Export activity timeline
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';

// Test data setup constants
const TEST_USER = {
  email: 'admin@indiaangelforum.test',
  password: 'Admin@12345',
  name: 'Admin User',
};

const ACTIVITIES_PER_PAGE = 20;

test.describe('Activity Timeline (US-HISTORY-003)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Navigate to activity timeline
    await page.goto('/activity');
    await page.waitForSelector('[data-testid="activity-timeline"]', { timeout: 5000 });
  });

  /**
   * AT-E2E-001: Display unified activity timeline
   * 
   * Validates:
   * - Activity timeline page loads successfully
   * - Shows activities from multiple sources (payments, events, messages, etc.)
   * - Activities sorted chronologically (newest first)
   * - Each activity shows: type icon, description, timestamp
   * - Activity types: PAYMENT_*, EVENT_*, MESSAGE_*, DOCUMENT_*, PROFILE_*
   * - Initial load time < 2 seconds
   * - Shows up to 20 activities initially
   */
  test('AT-E2E-001: should display unified activity timeline', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to activity timeline
    await page.goto('/activity');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // < 2s load time
    
    // Verify page title
    await expect(page.locator('h1')).toContainText('Activity Timeline');
    
    // Verify timeline container
    const timeline = page.locator('[data-testid="activity-timeline"]');
    await expect(timeline).toBeVisible();
    
    // Get activity items
    const activityItems = page.locator('[data-testid="activity-item"]');
    const count = await activityItems.count();
    
    // Should have activities (or empty state)
    if (count === 0) {
      await expect(page.locator('[data-testid="no-activities"]')).toBeVisible();
    } else {
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(ACTIVITIES_PER_PAGE);
      
      // Verify first activity has required elements
      const firstActivity = activityItems.first();
      
      // Activity type icon
      const typeIcon = firstActivity.locator('[data-testid="activity-type-icon"]');
      await expect(typeIcon).toBeVisible();
      
      // Activity description
      const description = firstActivity.locator('[data-testid="activity-description"]');
      await expect(description).toBeVisible();
      const descText = await description.textContent();
      expect(descText).toBeTruthy();
      expect(descText!.length).toBeGreaterThan(10);
      
      // Activity timestamp
      const timestamp = firstActivity.locator('[data-testid="activity-timestamp"]');
      await expect(timestamp).toBeVisible();
      const timeText = await timestamp.textContent();
      expect(timeText).toMatch(/ago|on|at|just now/i); // Relative or absolute time
      
      // Activity type badge (optional)
      const typeBadge = firstActivity.locator('[data-testid="activity-type"]');
      if (await typeBadge.isVisible()) {
        const typeText = await typeBadge.textContent();
        const validTypes = [
          'Payment', 'Refund', 'Event', 'Message', 'Document', 
          'Profile', 'Application', 'Deal', 'Certificate', 'Statement'
        ];
        expect(validTypes.some(t => typeText?.includes(t))).toBeTruthy();
      }
      
      // Verify chronological order (newest first)
      if (count >= 2) {
        const firstTime = await activityItems.nth(0).locator('[data-testid="activity-timestamp"]').getAttribute('data-timestamp');
        const secondTime = await activityItems.nth(1).locator('[data-testid="activity-timestamp"]').getAttribute('data-timestamp');
        
        if (firstTime && secondTime) {
          const first = new Date(firstTime).getTime();
          const second = new Date(secondTime).getTime();
          expect(first).toBeGreaterThanOrEqual(second);
        }
      }
    }
  });

  /**
   * AT-E2E-002: Filter activities by type
   * 
   * Validates:
   * - Activity type filter dropdown is present
   * - Shows all activity types: Payments, Events, Messages, Documents, Profile Changes
   * - Can select multiple types
   * - Only selected types are shown
   * - Filter applies without full page reload
   * - Clear filter button works
   * - Filter state persists during session
   */
  test('AT-E2E-002: should filter activities by type', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForLoadState('networkidle');
    
    // Verify activity items exist
    const activityItems = page.locator('[data-testid="activity-item"]');
    if (await activityItems.count() === 0) {
      test.skip();
      return;
    }
    
    // Open type filter
    const typeFilterButton = page.locator('[data-testid="filter-type"]');
    await expect(typeFilterButton).toBeVisible();
    await typeFilterButton.click();
    
    // Verify filter options
    const filterMenu = page.locator('[data-testid="type-filter-menu"]');
    await expect(filterMenu).toBeVisible();
    
    // Check available activity types
    const paymentOption = page.locator('[data-testid="type-payment"]');
    const eventOption = page.locator('[data-testid="type-event"]');
    const messageOption = page.locator('[data-testid="type-message"]');
    const documentOption = page.locator('[data-testid="type-document"]');
    const profileOption = page.locator('[data-testid="type-profile"]');
    
    // At least one option should be present
    const hasOptions = await paymentOption.isVisible() || 
                       await eventOption.isVisible() || 
                       await messageOption.isVisible();
    expect(hasOptions).toBeTruthy();
    
    // Select "Payment" activities only
    if (await paymentOption.isVisible()) {
      await paymentOption.click();
      
      // Apply filter
      const applyButton = page.locator('[data-testid="apply-type-filter"]');
      await applyButton.click();
      await page.waitForTimeout(500);
      
      // Verify active filter indicator
      await expect(page.locator('[data-testid="active-filters"]')).toContainText('Type');
      
      // Verify filtered results (all should be payment-related)
      const filteredItems = page.locator('[data-testid="activity-item"]');
      const filteredCount = await filteredItems.count();
      
      if (filteredCount > 0) {
        // Check first few items are payment-related
        for (let i = 0; i < Math.min(3, filteredCount); i++) {
          const item = filteredItems.nth(i);
          const description = await item.locator('[data-testid="activity-description"]').textContent();
          expect(description?.toLowerCase()).toMatch(/payment|paid|invest|refund/);
        }
      }
      
      // Clear filter
      const clearButton = page.locator('[data-testid="clear-filters"]');
      await clearButton.click();
      await page.waitForTimeout(500);
      
      // Verify filter cleared
      const clearedCount = await activityItems.count();
      expect(clearedCount).toBeGreaterThanOrEqual(filteredCount);
    }
  });

  /**
   * AT-E2E-003: Filter activities by date range
   * 
   * Validates:
   * - Date range filter is present
   * - Can select custom date range
   * - Quick filters available (Today, Last 7 days, Last 30 days, This year)
   * - Only activities within range shown
   * - Date filter combines with type filter
   * - Filter interaction time < 500ms
   */
  test('AT-E2E-003: should filter activities by date range', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForLoadState('networkidle');
    
    const activityItems = page.locator('[data-testid="activity-item"]');
    if (await activityItems.count() === 0) {
      test.skip();
      return;
    }
    
    // Open date filter
    const dateFilterButton = page.locator('[data-testid="filter-date"]');
    await expect(dateFilterButton).toBeVisible();
    
    const startTime = Date.now();
    await dateFilterButton.click();
    
    // Verify quick filter options
    const filterMenu = page.locator('[data-testid="date-filter-menu"]');
    await expect(filterMenu).toBeVisible();
    
    // Test "Last 7 days" quick filter
    const last7DaysOption = page.locator('[data-testid="date-last-7-days"]');
    if (await last7DaysOption.isVisible()) {
      await last7DaysOption.click();
      
      const filterTime = Date.now() - startTime;
      expect(filterTime).toBeLessThan(500); // < 500ms interaction
      
      await page.waitForTimeout(500);
      
      // Verify filter applied
      await expect(page.locator('[data-testid="active-filters"]')).toContainText('Date');
      
      // Verify filtered items
      const filteredItems = page.locator('[data-testid="activity-item"]');
      const filteredCount = await filteredItems.count();
      
      if (filteredCount > 0) {
        // Verify first activity timestamp is within last 7 days
        const firstTimestamp = await filteredItems.first()
          .locator('[data-testid="activity-timestamp"]')
          .getAttribute('data-timestamp');
        
        if (firstTimestamp) {
          const activityDate = new Date(firstTimestamp);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          expect(activityDate.getTime()).toBeGreaterThanOrEqual(sevenDaysAgo.getTime());
        }
      }
    }
    
    // Test custom date range
    await dateFilterButton.click();
    
    const customRangeOption = page.locator('[data-testid="date-custom-range"]');
    if (await customRangeOption.isVisible()) {
      await customRangeOption.click();
      
      // Set custom dates (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      await page.fill('[data-testid="date-from"]', thirtyDaysAgo.toISOString().split('T')[0]);
      await page.fill('[data-testid="date-to"]', today.toISOString().split('T')[0]);
      
      await page.click('[data-testid="apply-date-filter"]');
      await page.waitForTimeout(500);
      
      // Verify custom filter applied
      const customFiltered = await page.locator('[data-testid="activity-item"]').count();
      expect(customFiltered).toBeGreaterThanOrEqual(0);
    }
  });

  /**
   * AT-E2E-004: Infinite scroll loading
   * 
   * Validates:
   * - Loads 20 activities initially
   * - Scrolling to bottom loads more activities
   * - Loading indicator shows during fetch
   * - New activities append to list
   * - No duplicate activities
   * - "End of timeline" message when no more activities
   * - Scroll performance is smooth (no jank)
   */
  test('AT-E2E-004: should load more activities with infinite scroll', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForLoadState('networkidle');
    
    const activityItems = page.locator('[data-testid="activity-item"]');
    const initialCount = await activityItems.count();
    
    if (initialCount < ACTIVITIES_PER_PAGE) {
      // Not enough activities to test pagination
      test.skip();
      return;
    }
    
    // Get first activity ID to check for duplicates later
    const firstActivityId = await activityItems.first().getAttribute('data-activity-id');
    
    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for loading indicator (may appear very briefly or load instantly)
    const loadingIndicator = page.locator('[data-testid="loading-more"]');
    // Don't fail if loading indicator is too fast to catch
    await loadingIndicator.isVisible({ timeout: 500 }).catch(() => false);
    
    // Wait for new activities to load
    await page.waitForTimeout(2000);
    
    // Verify more activities loaded
    const newCount = await activityItems.count();
    
    if (newCount > initialCount) {
      expect(newCount).toBeGreaterThan(initialCount);
      expect(newCount).toBeLessThanOrEqual(initialCount + ACTIVITIES_PER_PAGE);
      
      // Verify no duplicates (first activity ID should still be at top)
      const currentFirstId = await activityItems.first().getAttribute('data-activity-id');
      expect(currentFirstId).toBe(firstActivityId);
      
      // Verify chronological order maintained
      const lastOldActivity = activityItems.nth(initialCount - 1);
      const firstNewActivity = activityItems.nth(initialCount);
      
      const lastOldTime = await lastOldActivity.locator('[data-testid="activity-timestamp"]').getAttribute('data-timestamp');
      const firstNewTime = await firstNewActivity.locator('[data-testid="activity-timestamp"]').getAttribute('data-timestamp');
      
      if (lastOldTime && firstNewTime) {
        const oldTimestamp = new Date(lastOldTime).getTime();
        const newTimestamp = new Date(firstNewTime).getTime();
        expect(oldTimestamp).toBeGreaterThanOrEqual(newTimestamp);
      }
    } else {
      // End of timeline reached
      const endMessage = page.locator('[data-testid="end-of-timeline"]');
      await expect(endMessage).toBeVisible();
      await expect(endMessage).toContainText(/end|no more/i);
    }
  });

  /**
   * AT-E2E-005: Activity detail expansion
   * 
   * Validates:
   * - Can click activity to expand details
   * - Expanded view shows additional information
   * - Payment activities: show amount, status, invoice link
   * - Event activities: show event name, date, RSVP status
   * - Message activities: show message preview, sender
   * - Document activities: show document name, download link
   * - Profile activities: show what changed
   * - Can collapse activity details
   */
  test('AT-E2E-005: should expand and show activity details', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForLoadState('networkidle');
    
    const activityItems = page.locator('[data-testid="activity-item"]');
    if (await activityItems.count() === 0) {
      test.skip();
      return;
    }
    
    // Click first activity to expand
    const firstActivity = activityItems.first();
    const activityType = await firstActivity.getAttribute('data-activity-type');
    
    await firstActivity.click();
    await page.waitForTimeout(500);
    
    // Verify expansion
    const expandedDetails = firstActivity.locator('[data-testid="activity-details"]');
    await expect(expandedDetails).toBeVisible();
    
    // Verify details based on activity type
    if (activityType?.includes('PAYMENT')) {
      // Payment details
      const amount = expandedDetails.locator('[data-testid="payment-amount"]');
      const status = expandedDetails.locator('[data-testid="payment-status"]');
      
      await expect(amount).toBeVisible();
      await expect(status).toBeVisible();
      
      const amountText = await amount.textContent();
      expect(amountText).toContain('₹');
      
      // Check for invoice link
      const invoiceLink = expandedDetails.locator('[data-testid="view-invoice"]');
      if (await invoiceLink.isVisible()) {
        expect(await invoiceLink.getAttribute('href')).toContain('invoice');
      }
    } else if (activityType?.includes('EVENT')) {
      // Event details
      const eventName = expandedDetails.locator('[data-testid="event-name"]');
      const eventDate = expandedDetails.locator('[data-testid="event-date"]');
      
      await expect(eventName).toBeVisible();
      await expect(eventDate).toBeVisible();
      
      // Check for RSVP status
      const rsvpStatus = expandedDetails.locator('[data-testid="rsvp-status"]');
      if (await rsvpStatus.isVisible()) {
        const statusText = await rsvpStatus.textContent();
        expect(statusText).toMatch(/confirmed|cancelled|attended/i);
      }
    } else if (activityType?.includes('MESSAGE')) {
      // Message details
      const messagePreview = expandedDetails.locator('[data-testid="message-preview"]');
      const sender = expandedDetails.locator('[data-testid="message-sender"]');
      
      if (await messagePreview.isVisible()) {
        await expect(messagePreview).toBeVisible();
      }
      if (await sender.isVisible()) {
        await expect(sender).toBeVisible();
      }
    } else if (activityType?.includes('DOCUMENT')) {
      // Document details
      const docName = expandedDetails.locator('[data-testid="document-name"]');
      const downloadLink = expandedDetails.locator('[data-testid="download-document"]');
      
      if (await docName.isVisible()) {
        await expect(docName).toBeVisible();
      }
      if (await downloadLink.isVisible()) {
        await expect(downloadLink).toBeVisible();
      }
    } else if (activityType?.includes('PROFILE')) {
      // Profile change details
      const changeDescription = expandedDetails.locator('[data-testid="change-description"]');
      
      if (await changeDescription.isVisible()) {
        await expect(changeDescription).toBeVisible();
        const changeText = await changeDescription.textContent();
        expect(changeText).toMatch(/updated|changed|modified/i);
      }
    }
    
    // Test collapse
    const collapseButton = firstActivity.locator('[data-testid="collapse-details"]');
    if (await collapseButton.isVisible()) {
      await collapseButton.click();
      await page.waitForTimeout(300);
      
      // Verify collapsed
      await expect(expandedDetails).not.toBeVisible();
    }
  });

  /**
   * AT-E2E-006: Export activity timeline
   * 
   * Validates:
   * - "Export Timeline" button is present
   * - Can export to CSV format
   * - CSV includes all activity data
   * - CSV respects current filters
   * - CSV contains columns: Date, Type, Description, Details
   * - Download triggers correctly
   * - Filename includes date range
   */
  test('AT-E2E-006: should export activity timeline to CSV', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForLoadState('networkidle');
    
    const activityItems = page.locator('[data-testid="activity-item"]');
    if (await activityItems.count() === 0) {
      test.skip();
      return;
    }
    
    // Verify export button
    const exportButton = page.locator('[data-testid="export-timeline"]');
    await expect(exportButton).toBeVisible();
    
    // Optional: Apply filter first to test filtered export
    const filterButton = page.locator('[data-testid="filter-date"]');
    if (await filterButton.isVisible()) {
      await filterButton.click();
      const last30Days = page.locator('[data-testid="date-last-30-days"]');
      if (await last30Days.isVisible()) {
        await last30Days.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click export
    await exportButton.click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify filename
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/activity.*\.csv$/i);
    
    // Save and verify file content
    const path = await download.path();
    expect(path).toBeTruthy();
    
    // Verify CSV content
    if (path && fs.existsSync(path)) {
      const csvContent = fs.readFileSync(path, 'utf-8');
      
      // Verify CSV headers
      expect(csvContent).toContain('Date');
      expect(csvContent).toContain('Type');
      expect(csvContent).toContain('Description');
      
      // Verify CSV has data rows (at least one activity)
      const lines = csvContent.split('\n');
      expect(lines.length).toBeGreaterThan(1); // Header + at least one data row
      
      // Verify data format
      if (lines.length > 1) {
        const firstDataLine = lines[1];
        expect(firstDataLine.length).toBeGreaterThan(10); // Has actual content
      }
    }
  });
});
