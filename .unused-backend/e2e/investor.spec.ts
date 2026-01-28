/**
 * E2E Tests for Investor User Stories
 * Tests all investor-related features:
 * - Browse and view deals
 * - Express interest in deals
 * - Track deal pipeline
 * - View deal documents
 * - Create and manage SPVs
 * - Investment commitments
 */

import { test, expect, Page } from '@playwright/test';
import { testUsers } from '../fixtures/testData';

async function loginAsInvestor(page: Page) {
  await page.goto('/auth');
  await page.fill('[name="email"]', testUsers.investor.email);
  await page.fill('[name="password"]', testUsers.investor.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

test.describe('US-INVESTOR-001: Browse Deals', () => {
  test('should display available deals', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/deals');
    
    await expect(page.locator('h1')).toContainText('Investment Deals');
    
    // Check deals are displayed
    const deals = page.locator('[data-testid="deal-card"]');
    await expect(deals.first()).toBeVisible();
  });
  
  test('should filter deals by industry', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/deals');
    
    // Select industry filter
    await page.selectOption('[data-testid="industry-filter"]', 'Technology');
    await page.waitForTimeout(500);
    
    // Check filtered results
    const deals = page.locator('[data-testid="deal-card"]');
    const count = await deals.count();
    
    if (count > 0) {
      const industry = await deals.first().locator('[data-testid="industry"]').textContent();
      expect(industry).toContain('Technology');
    }
  });
  
  test('should search deals by company name', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/deals');
    
    await page.fill('[data-testid="search-input"]', 'Tech');
    await page.waitForTimeout(500);
    
    const deals = page.locator('[data-testid="deal-card"]');
    const count = await deals.count();
    
    if (count > 0) {
      const title = await deals.first().locator('[data-testid="deal-title"]').textContent();
      expect(title?.toLowerCase()).toContain('tech');
    }
  });
});

test.describe('US-INVESTOR-002: View Deal Details', () => {
  test('should display comprehensive deal information', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/deals');
    
    // Click first deal
    const firstDeal = page.locator('[data-testid="deal-card"]').first();
    await firstDeal.click();
    
    // Check deal details are visible
    await expect(page.locator('[data-testid="company-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="deal-size"]')).toBeVisible();
    await expect(page.locator('[data-testid="min-investment"]')).toBeVisible();
    await expect(page.locator('[data-testid="description"]')).toBeVisible();
    
    // Check highlights section
    await expect(page.locator('[data-testid="highlights"]')).toBeVisible();
    
    // Check risk factors
    await expect(page.locator('[data-testid="risk-factors"]')).toBeVisible();
  });
  
  test('should show investment terms and conditions', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/deals');
    
    await page.locator('[data-testid="deal-card"]').first().click();
    
    // Scroll to terms section
    await page.locator('[data-testid="terms-section"]').scrollIntoViewIfNeeded();
    
    await expect(page.locator('[data-testid="terms-section"]')).toBeVisible();
  });
});

test.describe('US-INVESTOR-003: Express Interest in Deal', () => {
  test('should allow investor to express interest', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/deals');
    
    await page.locator('[data-testid="deal-card"]').first().click();
    
    // Click express interest button
    await page.click('[data-testid="express-interest"]');
    
    // Fill commitment amount
    await page.fill('[data-testid="commitment-amount"]', '1000000');
    
    // Add notes
    await page.fill('[data-testid="interest-notes"]', 'Interested in participating. Strong founding team and market opportunity.');
    
    // Submit interest
    await page.click('[data-testid="submit-interest"]');
    
    await expect(page.locator('.toast')).toContainText('Interest submitted successfully');
  });
  
  test('should validate commitment amount', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/deals');
    
    await page.locator('[data-testid="deal-card"]').first().click();
    await page.click('[data-testid="express-interest"]');
    
    // Try to submit with amount below minimum
    await page.fill('[data-testid="commitment-amount"]', '100000');
    await page.click('[data-testid="submit-interest"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="amount-error"]')).toContainText('minimum investment');
  });
});

test.describe('US-INVESTOR-004: Track Deal Pipeline', () => {
  test('should display all deal interests', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/investor/pipeline');
    
    await expect(page.locator('h1')).toContainText('Deal Pipeline');
    
    // Check statistics
    await expect(page.locator('[data-testid="total-interests"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="accepted-count"]')).toBeVisible();
  });
  
  test('should filter pipeline by status', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/investor/pipeline');
    
    // Filter by accepted
    await page.selectOption('[data-testid="status-filter"]', 'accepted');
    await page.waitForTimeout(500);
    
    const interests = page.locator('[data-testid="interest-card"]');
    const count = await interests.count();
    
    if (count > 0) {
      const status = await interests.first().locator('[data-testid="status-badge"]').textContent();
      expect(status).toContain('Accepted');
    }
  });
  
  test('should show SPV details for accepted interests', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/investor/pipeline');
    
    await page.selectOption('[data-testid="status-filter"]', 'accepted');
    await page.waitForTimeout(500);
    
    const interests = page.locator('[data-testid="interest-card"]');
    const count = await interests.count();
    
    if (count > 0) {
      // Check if SPV section is visible
      const spvSection = interests.first().locator('[data-testid="spv-details"]');
      if (await spvSection.isVisible()) {
        await expect(spvSection.locator('[data-testid="spv-name"]')).toBeVisible();
      }
    }
  });
});

test.describe('US-INVESTOR-005: View Deal Documents', () => {
  test('should access deal documents after expressing interest', async ({ page }) => {
    await loginAsInvestor(page);
    
    // Go to a deal with existing interest
    await page.goto('/investor/pipeline');
    
    const firstInterest = page.locator('[data-testid="interest-card"]').first();
    if (await firstInterest.isVisible()) {
      // Get deal ID and navigate to documents
      await firstInterest.locator('[data-testid="view-documents"]').click();
      
      // Should show documents page
      await expect(page.locator('h1')).toContainText('Deal Documents');
      
      // Check documents are listed
      const documents = page.locator('[data-testid="document-card"]');
      await expect(documents.first()).toBeVisible();
    }
  });
  
  test('should download a document', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/investor/pipeline');
    
    const firstInterest = page.locator('[data-testid="interest-card"]').first();
    if (await firstInterest.isVisible()) {
      await firstInterest.locator('[data-testid="view-documents"]').click();
      
      const firstDocument = page.locator('[data-testid="document-card"]').first();
      if (await firstDocument.isVisible()) {
        const downloadPromise = page.waitForEvent('download');
        await firstDocument.locator('[data-testid="download-button"]').click();
        const download = await downloadPromise;
        
        expect(download).toBeTruthy();
      }
    }
  });
  
  test('should deny access to documents without interest', async ({ page }) => {
    await loginAsInvestor(page);
    
    // Try to access documents without expressing interest
    await page.goto('/investor/documents/non-existent-deal');
    
    // Should show access denied or redirect
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
  });
});

test.describe('US-INVESTOR-006: Create SPV', () => {
  test('should create SPV for accepted deal interest', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/investor/pipeline');
    
    // Find accepted interest
    await page.selectOption('[data-testid="status-filter"]', 'accepted');
    await page.waitForTimeout(500);
    
    const acceptedInterest = page.locator('[data-testid="interest-card"]').first();
    if (await acceptedInterest.isVisible()) {
      // Click create SPV
      await acceptedInterest.locator('[data-testid="create-spv"]').click();
      
      // Fill SPV details
      await page.fill('[data-testid="spv-name"]', 'Test Investment SPV');
      await page.fill('[data-testid="target-amount"]', '20000000');
      await page.fill('[data-testid="carry-percentage"]', '20');
      await page.fill('[data-testid="description"]', 'SPV for collective investment in this opportunity');
      
      // Submit
      await page.click('[data-testid="create-spv-submit"]');
      
      await expect(page.locator('.toast')).toContainText('SPV created successfully');
    }
  });
  
  test('should validate SPV creation fields', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/investor/create-spv');
    
    // Try to submit without required fields
    await page.click('[data-testid="create-spv-submit"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
  });
});

test.describe('US-INVESTOR-007: Invite Co-Investors to SPV', () => {
  test('should invite co-investors to SPV', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/investor/spv-dashboard');
    
    // Select first SPV
    const firstSPV = page.locator('[data-testid="spv-card"]').first();
    if (await firstSPV.isVisible()) {
      await firstSPV.click();
      
      // Click invite button
      await page.click('[data-testid="invite-co-investor"]');
      
      // Fill invitation form
      await page.fill('[data-testid="investor-email"]', testUsers.investor2.email);
      await page.fill('[data-testid="commitment-amount"]', '5000000');
      
      // Send invitation
      await page.click('[data-testid="send-invitation"]');
      
      await expect(page.locator('.toast')).toContainText('Invitation sent');
    }
  });
  
  test('should show SPV members list', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/investor/spv-dashboard');
    
    const firstSPV = page.locator('[data-testid="spv-card"]').first();
    if (await firstSPV.isVisible()) {
      await firstSPV.click();
      
      // Check members section
      await expect(page.locator('[data-testid="members-list"]')).toBeVisible();
      
      // Check lead investor is shown
      const leadBadge = page.locator('[data-testid="lead-investor-badge"]');
      await expect(leadBadge).toBeVisible();
    }
  });
  
  test('should show fundraising progress', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/investor/spv-dashboard');
    
    const firstSPV = page.locator('[data-testid="spv-card"]').first();
    if (await firstSPV.isVisible()) {
      await firstSPV.click();
      
      // Check progress bar
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      await expect(page.locator('[data-testid="committed-amount"]')).toBeVisible();
      await expect(page.locator('[data-testid="target-amount"]')).toBeVisible();
    }
  });
});

test.describe('US-INVESTOR-008: Investment Commitment', () => {
  test('should complete investment commitment', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/investor/pipeline');
    
    // Find accepted interest
    await page.selectOption('[data-testid="status-filter"]', 'accepted');
    await page.waitForTimeout(500);
    
    const acceptedInterest = page.locator('[data-testid="interest-card"]').first();
    if (await acceptedInterest.isVisible()) {
      await acceptedInterest.locator('[data-testid="commit-button"]').click();
      
      // Review commitment details
      await expect(page.locator('[data-testid="commitment-amount"]')).toBeVisible();
      
      // Accept terms
      await page.check('[data-testid="terms-checkbox"]');
      
      // Submit commitment
      await page.click('[data-testid="submit-commitment"]');
      
      await expect(page.locator('.toast')).toContainText('Commitment submitted');
    }
  });
  
  test('should require terms acceptance', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/investor/pipeline');
    
    await page.selectOption('[data-testid="status-filter"]', 'accepted');
    await page.waitForTimeout(500);
    
    const acceptedInterest = page.locator('[data-testid="interest-card"]').first();
    if (await acceptedInterest.isVisible()) {
      await acceptedInterest.locator('[data-testid="commit-button"]').click();
      
      // Try to submit without accepting terms
      await page.click('[data-testid="submit-commitment"]');
      
      // Should show error
      await expect(page.locator('[data-testid="terms-error"]')).toBeVisible();
    }
  });
});

test.describe('Accessibility: Investor Pages', () => {
  test('Deals page should be accessible', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/deals');
    
    // Check heading structure
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThan(0);
    
    // Check all images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
  
  test('Pipeline page should have keyboard navigation', async ({ page }) => {
    await loginAsInvestor(page);
    await page.goto('/investor/pipeline');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT'];
    expect(interactiveTags).toContain(focusedElement);
  });
});

test.describe('Responsive Design: Investor Pages', () => {
  test('Deals page should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginAsInvestor(page);
    await page.goto('/deals');
    
    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
    
    // Check mobile menu
    const mobileMenu = page.locator('[data-testid="mobile-menu"], [aria-label="Menu"]');
    await expect(mobileMenu).toBeVisible();
  });
  
  test('Pipeline page should adapt to tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await loginAsInvestor(page);
    await page.goto('/investor/pipeline');
    
    await expect(page.locator('main')).toBeVisible();
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
});
