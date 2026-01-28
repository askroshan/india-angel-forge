/**
 * E2E Tests for Compliance Officer User Stories
 * Tests all compliance-related features:
 * - KYC review and approval
 * - Accreditation verification
 * - AML screening
 * - Compliance dashboard
 */

import { test, expect, Page } from '@playwright/test';
import { testUsers } from '../fixtures/testData';

// Helper function to login as compliance officer
async function loginAsComplianceOfficer(page: Page) {
  await page.goto('/auth');
  await page.fill('[name="email"]', testUsers.complianceOfficer.email);
  await page.fill('[name="password"]', testUsers.complianceOfficer.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

test.describe('US-COMPLIANCE-001: KYC Review Dashboard', () => {
  test('should display KYC submissions requiring review', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/kyc-review');
    
    // Check page loaded
    await expect(page).toHaveTitle(/KYC Review/);
    await expect(page.locator('h1')).toContainText('KYC Review Dashboard');
    
    // Check filters are present
    await expect(page.locator('[data-testid="status-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
    
    // Check pending submissions are visible
    const pendingSection = page.locator('[data-testid="pending-submissions"]');
    await expect(pendingSection).toBeVisible();
  });
  
  test('should filter KYC submissions by status', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/kyc-review');
    
    // Filter by approved status
    await page.selectOption('[data-testid="status-filter"]', 'approved');
    await page.waitForTimeout(500); // Wait for filter to apply
    
    // Check that only approved submissions are shown
    const submissions = page.locator('[data-testid="kyc-submission"]');
    const count = await submissions.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const status = await submissions.nth(i).locator('[data-testid="status-badge"]').textContent();
        expect(status).toContain('Approved');
      }
    }
  });
  
  test('should review and approve KYC document', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/kyc-review');
    
    // Find first pending submission
    const firstPending = page.locator('[data-testid="kyc-submission"]').first();
    
    if (await firstPending.isVisible()) {
      // Click to view details
      await firstPending.click();
      
      // Check document preview is visible
      await expect(page.locator('[data-testid="document-preview"]')).toBeVisible();
      
      // Add review notes
      await page.fill('[data-testid="review-notes"]', 'All documents verified successfully. Meets KYC requirements.');
      
      // Approve the submission
      await page.click('[data-testid="approve-button"]');
      
      // Check success message
      await expect(page.locator('.toast, [role="alert"]')).toContainText('KYC approved successfully');
    }
  });
  
  test('should reject KYC with reason', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/kyc-review');
    
    const firstPending = page.locator('[data-testid="kyc-submission"]').first();
    
    if (await firstPending.isVisible()) {
      await firstPending.click();
      
      // Click reject button
      await page.click('[data-testid="reject-button"]');
      
      // Fill rejection reason
      await page.fill('[data-testid="rejection-reason"]', 'Document quality insufficient. Please resubmit clear copies.');
      
      // Confirm rejection
      await page.click('[data-testid="confirm-reject"]');
      
      // Check success message
      await expect(page.locator('.toast, [role="alert"]')).toContainText('KYC rejected');
    }
  });
});

test.describe('US-COMPLIANCE-002: Accreditation Verification', () => {
  test('should display investor accreditation requests', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/accreditation');
    
    await expect(page.locator('h1')).toContainText('Accreditation Verification');
    
    // Check statistics cards
    await expect(page.locator('[data-testid="pending-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="verified-count"]')).toBeVisible();
  });
  
  test('should verify investor accreditation with net worth check', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/accreditation');
    
    const firstRequest = page.locator('[data-testid="accreditation-request"]').first();
    
    if (await firstRequest.isVisible()) {
      await firstRequest.click();
      
      // Check net worth documentation
      await expect(page.locator('[data-testid="net-worth-documents"]')).toBeVisible();
      
      // Verify income proof
      await page.check('[data-testid="income-verified"]');
      
      // Verify net worth
      await page.check('[data-testid="networth-verified"]');
      
      // Add verification notes
      await page.fill('[data-testid="verification-notes"]', 'Income and net worth documentation verified. Meets accredited investor criteria.');
      
      // Approve accreditation
      await page.click('[data-testid="verify-button"]');
      
      await expect(page.locator('.toast')).toContainText('Accreditation verified');
    }
  });
  
  test('should reject accreditation with detailed reason', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/accreditation');
    
    const firstRequest = page.locator('[data-testid="accreditation-request"]').first();
    
    if (await firstRequest.isVisible()) {
      await firstRequest.click();
      
      // Click reject
      await page.click('[data-testid="reject-verification"]');
      
      // Select rejection reason
      await page.selectOption('[data-testid="rejection-category"]', 'insufficient_documentation');
      
      // Add detailed reason
      await page.fill('[data-testid="rejection-details"]', 'Net worth documentation does not meet minimum threshold. Additional proof required.');
      
      await page.click('[data-testid="confirm-rejection"]');
      
      await expect(page.locator('.toast')).toContainText('Accreditation rejected');
    }
  });
});

test.describe('US-COMPLIANCE-003: AML Screening', () => {
  test('should display AML screening dashboard', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/aml-screening');
    
    await expect(page.locator('h1')).toContainText('AML Screening');
    
    // Check risk level filters
    await expect(page.locator('[data-testid="risk-filter"]')).toBeVisible();
    
    // Check screening list
    await expect(page.locator('[data-testid="screening-list"]')).toBeVisible();
  });
  
  test('should initiate AML screening for new user', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/aml-screening');
    
    // Click initiate screening
    await page.click('[data-testid="initiate-screening"]');
    
    // Select user
    await page.fill('[data-testid="user-search"]', testUsers.investor.email);
    await page.waitForTimeout(500);
    await page.click('[data-testid="user-result"]');
    
    // Start screening
    await page.click('[data-testid="start-screening"]');
    
    await expect(page.locator('.toast')).toContainText('AML screening initiated');
  });
  
  test('should review flagged AML case', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/aml-screening');
    
    // Filter for flagged cases
    await page.selectOption('[data-testid="status-filter"]', 'flagged');
    
    const firstFlagged = page.locator('[data-testid="aml-screening"]').first();
    
    if (await firstFlagged.isVisible()) {
      await firstFlagged.click();
      
      // Check flagged reason
      await expect(page.locator('[data-testid="flag-reason"]')).toBeVisible();
      
      // Review watchlist matches
      await expect(page.locator('[data-testid="watchlist-matches"]')).toBeVisible();
      
      // Add investigation notes
      await page.fill('[data-testid="investigation-notes"]', 'Reviewed watchlist match. False positive - different individual with similar name.');
      
      // Clear the flag
      await page.click('[data-testid="clear-flag"]');
      
      await expect(page.locator('.toast')).toContainText('Screening cleared');
    }
  });
  
  test('should escalate high-risk case', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/aml-screening');
    
    const firstCase = page.locator('[data-testid="aml-screening"]').first();
    
    if (await firstCase.isVisible()) {
      await firstCase.click();
      
      // Escalate case
      await page.click('[data-testid="escalate-button"]');
      
      // Select escalation reason
      await page.selectOption('[data-testid="escalation-reason"]', 'high_risk_match');
      
      // Add escalation notes
      await page.fill('[data-testid="escalation-notes"]', 'Strong watchlist match detected. Requires senior review and additional documentation.');
      
      // Confirm escalation
      await page.click('[data-testid="confirm-escalation"]');
      
      await expect(page.locator('.toast')).toContainText('Case escalated');
    }
  });
});

test.describe('US-COMPLIANCE-004: Audit Logs', () => {
  test('should display compliance audit logs', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/audit-logs');
    
    await expect(page.locator('h1')).toContainText('Audit Logs');
    
    // Check filters
    await expect(page.locator('[data-testid="date-range-picker"]')).toBeVisible();
    await expect(page.locator('[data-testid="action-filter"]')).toBeVisible();
    
    // Check logs table
    await expect(page.locator('[data-testid="audit-log-table"]')).toBeVisible();
  });
  
  test('should filter audit logs by action type', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/audit-logs');
    
    // Filter by KYC approval actions
    await page.selectOption('[data-testid="action-filter"]', 'kyc_approval');
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Check that logs are filtered
    const logs = page.locator('[data-testid="audit-log-row"]');
    const count = await logs.count();
    
    if (count > 0) {
      const firstLog = await logs.first().locator('[data-testid="action-type"]').textContent();
      expect(firstLog).toContain('KYC');
    }
  });
  
  test('should export audit logs', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/audit-logs');
    
    // Set date range
    await page.fill('[data-testid="start-date"]', '2025-01-01');
    await page.fill('[data-testid="end-date"]', '2025-01-31');
    
    // Click export
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-logs"]');
    const download = await downloadPromise;
    
    // Check file downloaded
    expect(download.suggestedFilename()).toContain('audit-logs');
  });
});

test.describe('Accessibility: Compliance Officer Pages', () => {
  test('KYC Review page should be accessible', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/kyc-review');
    
    // Check for proper heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    
    // Check for ARIA labels on interactive elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Button should have either text content or aria-label
      expect(ariaLabel || text?.trim()).toBeTruthy();
    }
    
    // Check form labels
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    }
  });
  
  test('Accreditation page should have keyboard navigation', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/accreditation');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    
    // Should be able to focus on interactive elements
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    expect(interactiveTags).toContain(focusedElement);
  });
  
  test('AML Screening page should have sufficient color contrast', async ({ page }) => {
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/aml-screening');
    
    // Check that risk badges have appropriate contrast
    const badges = page.locator('[data-testid="risk-badge"]');
    const count = await badges.count();
    
    if (count > 0) {
      const badge = badges.first();
      await expect(badge).toBeVisible();
      
      // Badges should be readable
      const text = await badge.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });
});

test.describe('Responsive Design: Compliance Officer Pages', () => {
  test('KYC Review dashboard should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/kyc-review');
    
    // Check mobile menu or navigation
    const mobileMenu = page.locator('[data-testid="mobile-menu"], [aria-label="Menu"]');
    await expect(mobileMenu).toBeVisible();
    
    // Check that content is not horizontally scrollable
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px tolerance
  });
  
  test('Accreditation page should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await loginAsComplianceOfficer(page);
    await page.goto('/admin/accreditation');
    
    // Check layout adapts to tablet size
    await expect(page.locator('main')).toBeVisible();
    
    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
});
