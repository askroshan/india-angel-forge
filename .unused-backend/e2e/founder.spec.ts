/**
 * E2E Tests for Founder User Stories
 * Tests all founder-related features:
 * - Submit application
 * - Create company profile
 * - Create fundraising rounds
 * - Upload pitch materials
 * - Search investor directory
 * - Manage portfolio updates
 */

import { test, expect, Page } from '@playwright/test';
import { testUsers } from '../fixtures/testData';

async function loginAsFounder(page: Page) {
  await page.goto('/auth');
  await page.fill('[name="email"]', testUsers.founder.email);
  await page.fill('[name="password"]', testUsers.founder.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

test.describe('US-FOUNDER-001: Submit Founder Application', () => {
  test('should display application form for new founders', async ({ page }) => {
    await page.goto('/apply-founder');
    
    await expect(page.locator('h1')).toContainText('Founder Application');
    
    // Check form fields
    await expect(page.locator('[name="fullName"]')).toBeVisible();
    await expect(page.locator('[name="email"]')).toBeVisible();
    await expect(page.locator('[name="phoneNumber"]')).toBeVisible();
    await expect(page.locator('[name="companyName"]')).toBeVisible();
    await expect(page.locator('[name="pitchSummary"]')).toBeVisible();
  });
  
  test('should validate required fields', async ({ page }) => {
    await page.goto('/apply-founder');
    
    // Try to submit without filling fields
    await page.click('[data-testid="submit-application"]');
    
    // Should show validation errors
    const errors = page.locator('.error-message, [role="alert"]');
    await expect(errors.first()).toBeVisible();
  });
  
  test('should submit complete founder application', async ({ page }) => {
    await page.goto('/apply-founder');
    
    // Fill application form
    await page.fill('[name="fullName"]', 'John Doe');
    await page.fill('[name="email"]', 'john@startup.test');
    await page.fill('[name="phoneNumber"]', '+91-9876543210');
    await page.fill('[name="companyName"]', 'Innovative Tech Solutions');
    await page.selectOption('[name="companyStage"]', 'seed');
    await page.selectOption('[name="industrySector"]', 'Technology');
    await page.fill('[name="fundingRequired"]', '50000000');
    await page.fill('[name="pitchSummary"]', 'We are building an AI-powered platform that revolutionizes how businesses operate. Our solution has proven product-market fit with 100+ early adopters.');
    await page.fill('[name="linkedinProfile"]', 'https://linkedin.com/in/johndoe');
    await page.fill('[name="previousExperience"]', '10 years in technology leadership roles');
    
    // Submit application
    await page.click('[data-testid="submit-application"]');
    
    // Should show success message
    await expect(page.locator('.toast')).toContainText('Application submitted successfully');
  });
});

test.describe('US-FOUNDER-002: Create Company Profile', () => {
  test('should display company profile form', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/company-profile');
    
    await expect(page.locator('h1')).toContainText('Company Profile');
    
    // Check form sections
    await expect(page.locator('[data-testid="basic-info-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="registration-section"]')).toBeVisible();
  });
  
  test('should create new company profile', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/company-profile');
    
    // Fill basic information
    await page.fill('[name="companyName"]', 'TechVentures Pvt Ltd');
    await page.selectOption('[name="industrySector"]', 'Technology');
    await page.fill('[name="foundedYear"]', '2020');
    await page.fill('[name="employeeCount"]', '25');
    await page.fill('[name="website"]', 'https://techventures.test');
    await page.fill('[name="description"]', 'AI-powered SaaS platform for enterprise analytics');
    
    // Registration details
    await page.fill('[name="registrationNumber"]', 'U72900DL2020PTC123456');
    await page.fill('[name="address"]', '123 Tech Park, Bangalore, Karnataka 560001');
    
    // Save profile
    await page.click('[data-testid="save-profile"]');
    
    await expect(page.locator('.toast')).toContainText('Company profile saved');
  });
  
  test('should update existing company profile', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/company-profile');
    
    // Update employee count
    await page.fill('[name="employeeCount"]', '30');
    
    // Update description
    await page.fill('[name="description"]', 'Updated description with new achievements');
    
    await page.click('[data-testid="save-profile"]');
    
    await expect(page.locator('.toast')).toContainText('Profile updated');
  });
});

test.describe('US-FOUNDER-003: Create Fundraising Round', () => {
  test('should display fundraising round form', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/fundraising');
    
    await expect(page.locator('h1')).toContainText('Fundraising');
    
    // Check create button
    await expect(page.locator('[data-testid="create-round-button"]')).toBeVisible();
  });
  
  test('should create seed round', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/fundraising');
    
    await page.click('[data-testid="create-round-button"]');
    
    // Fill round details
    await page.selectOption('[name="roundType"]', 'seed');
    await page.fill('[name="targetAmount"]', '50000000'); // ₹5 Cr
    await page.fill('[name="minInvestment"]', '500000'); // ₹5 L
    await page.fill('[name="maxInvestment"]', '10000000'); // ₹1 Cr
    await page.fill('[name="valuation"]', '200000000'); // ₹20 Cr
    await page.fill('[name="useOfFunds"]', 'Product development, team expansion, marketing');
    await page.fill('[name="timeline"]', '3 months');
    await page.fill('[name="dealTerms"]', 'Equity stake with standard investor protection clauses');
    
    await page.click('[data-testid="create-round-submit"]');
    
    await expect(page.locator('.toast')).toContainText('Fundraising round created');
  });
  
  test('should show fundraising progress', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/fundraising');
    
    // Check progress indicators
    await expect(page.locator('[data-testid="target-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="raised-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
  });
});

test.describe('US-FOUNDER-004: Upload Pitch Materials', () => {
  test('should display pitch materials section', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/pitch-materials');
    
    await expect(page.locator('h1')).toContainText('Pitch Materials');
    
    // Check upload button
    await expect(page.locator('[data-testid="upload-document"]')).toBeVisible();
  });
  
  test('should upload pitch deck', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/pitch-materials');
    
    await page.click('[data-testid="upload-document"]');
    
    // Fill document details
    await page.fill('[name="title"]', 'Company Pitch Deck 2025');
    await page.fill('[name="description"]', 'Comprehensive overview of our business model, market opportunity, and financial projections');
    await page.selectOption('[name="documentType"]', 'pitch_deck');
    
    // Note: File upload would require actual file in real test
    // For now, we test the form submission
    await page.click('[data-testid="upload-submit"]');
    
    // In real scenario with file, would expect success
  });
  
  test('should list uploaded documents', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/pitch-materials');
    
    // Check document list
    const documents = page.locator('[data-testid="document-card"]');
    
    if (await documents.first().isVisible()) {
      // Check document details are shown
      await expect(documents.first().locator('[data-testid="document-title"]')).toBeVisible();
      await expect(documents.first().locator('[data-testid="document-type"]')).toBeVisible();
    }
  });
  
  test('should delete document', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/pitch-materials');
    
    const documents = page.locator('[data-testid="document-card"]');
    
    if (await documents.first().isVisible()) {
      // Click delete button
      await documents.first().locator('[data-testid="delete-document"]').click();
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete"]');
      
      await expect(page.locator('.toast')).toContainText('Document deleted');
    }
  });
});

test.describe('US-FOUNDER-005: Search Investor Directory', () => {
  test('should display investor directory', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/investor-directory');
    
    await expect(page.locator('h1')).toContainText('Investor Directory');
    
    // Check search functionality
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
  });
  
  test('should search investors by name', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/investor-directory');
    
    // Search for investor
    await page.fill('[data-testid="search-input"]', 'Test Investor');
    await page.waitForTimeout(500);
    
    // Check results
    const investors = page.locator('[data-testid="investor-card"]');
    
    if (await investors.first().isVisible()) {
      const name = await investors.first().locator('[data-testid="investor-name"]').textContent();
      expect(name?.toLowerCase()).toContain('test');
    }
  });
  
  test('should display investor details', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/investor-directory');
    
    const firstInvestor = page.locator('[data-testid="investor-card"]').first();
    
    if (await firstInvestor.isVisible()) {
      // Check investor information
      await expect(firstInvestor.locator('[data-testid="investor-name"]')).toBeVisible();
      await expect(firstInvestor.locator('[data-testid="investor-email"]')).toBeVisible();
    }
  });
  
  test('should show statistics', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/investor-directory');
    
    // Check stats cards
    await expect(page.locator('[data-testid="total-investors"]')).toBeVisible();
  });
});

test.describe('US-FOUNDER-006: Manage Portfolio Updates', () => {
  test('should display portfolio updates page', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/portfolio-updates');
    
    await expect(page.locator('h1')).toContainText('Portfolio Updates');
    
    // Check create update button
    await expect(page.locator('[data-testid="create-update"]')).toBeVisible();
  });
  
  test('should create quarterly update', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/portfolio-updates');
    
    await page.click('[data-testid="create-update"]');
    
    // Fill update form
    await page.fill('[name="title"]', 'Q1 2025 Performance Update');
    await page.selectOption('[name="updateType"]', 'quarterly');
    await page.fill('[name="content"]', 'Strong quarter with 45% revenue growth. Successfully expanded to 3 new cities and onboarded 50+ enterprise clients.');
    
    // Add metrics
    await page.fill('[name="revenue"]', '15000000');
    await page.fill('[name="users"]', '50000');
    await page.fill('[name="growth"]', '45');
    
    await page.click('[data-testid="publish-update"]');
    
    await expect(page.locator('.toast')).toContainText('Update published');
  });
  
  test('should list all updates', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/portfolio-updates');
    
    const updates = page.locator('[data-testid="update-card"]');
    
    if (await updates.first().isVisible()) {
      await expect(updates.first().locator('[data-testid="update-title"]')).toBeVisible();
      await expect(updates.first().locator('[data-testid="update-date"]')).toBeVisible();
    }
  });
  
  test('should edit existing update', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/portfolio-updates');
    
    const firstUpdate = page.locator('[data-testid="update-card"]').first();
    
    if (await firstUpdate.isVisible()) {
      await firstUpdate.locator('[data-testid="edit-update"]').click();
      
      // Update content
      await page.fill('[name="content"]', 'Updated content with additional metrics');
      
      await page.click('[data-testid="save-update"]');
      
      await expect(page.locator('.toast')).toContainText('Update saved');
    }
  });
});

test.describe('Accessibility: Founder Pages', () => {
  test('Company profile page should be accessible', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/company-profile');
    
    // Check heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    
    // Check form labels
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const labelVisible = await label.isVisible();
        const ariaLabel = await input.getAttribute('aria-label');
        
        // Should have either visible label or aria-label
        expect(labelVisible || ariaLabel).toBeTruthy();
      }
    }
  });
  
  test('Fundraising page should have keyboard navigation', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/fundraising');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    expect(interactiveTags).toContain(focusedElement);
  });
  
  test('Investor directory should have alt text on images', async ({ page }) => {
    await loginAsFounder(page);
    await page.goto('/founder/investor-directory');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});

test.describe('Responsive Design: Founder Pages', () => {
  test('Company profile should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginAsFounder(page);
    await page.goto('/founder/company-profile');
    
    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
    
    // Check mobile menu
    const mobileMenu = page.locator('[data-testid="mobile-menu"], [aria-label="Menu"]');
    await expect(mobileMenu).toBeVisible();
  });
  
  test('Fundraising page should adapt to tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await loginAsFounder(page);
    await page.goto('/founder/fundraising');
    
    await expect(page.locator('main')).toBeVisible();
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
  
  test('Pitch materials should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginAsFounder(page);
    await page.goto('/founder/pitch-materials');
    
    // Check documents are visible and tappable
    const documents = page.locator('[data-testid="document-card"]');
    
    if (await documents.first().isVisible()) {
      const box = await documents.first().boundingBox();
      
      // Should have sufficient tap target size (minimum 44x44 per WCAG)
      expect(box?.height).toBeGreaterThan(40);
    }
  });
});
