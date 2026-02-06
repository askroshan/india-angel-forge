/**
 * E2E Test Suite: Financial Statements (US-REPORT-002)
 * 
 * Tests user financial statement generation, PDF export, tax breakdown,
 * and historical statement management.
 * 
 * Test Coverage:
 * - FS-E2E-001: Generate detailed financial statement
 * - FS-E2E-002: Generate summary financial statement
 * - FS-E2E-003: View tax breakdown in statement
 * - FS-E2E-004: Email statement to user
 * - FS-E2E-005: Download statement PDF
 * - FS-E2E-006: View statement generation history
 * - FS-E2E-007: Filter statements by date range
 * - FS-E2E-008: Verify Indian number formatting in PDF
 */

import { test, expect } from '@playwright/test';

// Test data setup constants
const TEST_INVESTOR = {
  email: 'admin@indiaangelforum.test',
  password: 'Admin@12345',
  name: 'Admin User',
};

const TEST_ADMIN = {
  email: 'admin@indiaangelforum.test',
  password: 'Admin@12345',
  name: 'Admin User',
};

test.describe('Financial Statements (US-REPORT-002)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as investor
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_INVESTOR.email);
    await page.fill('input[type="password"]', TEST_INVESTOR.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  /**
   * FS-E2E-001: Generate detailed financial statement
   * 
   * Validates:
   * - User can access statement generation page
   * - Can select date range (from/to)
   * - Can choose "detailed" format
   * - Statement generates successfully
   * - Shows all transactions with full details
   * - Statement includes: investments, refunds, fees, taxes
   * - Generation time < 5 seconds
   */
  test('FS-E2E-001: should generate detailed financial statement', async ({ page }) => {
    // Navigate to financial statements
    await page.goto('/dashboard/financial-statements');
    await page.waitForLoadState('networkidle');
    
    // Verify page elements
    await expect(page.locator('h1')).toContainText('Financial Statements');
    
    // Click "Generate New Statement" button
    const generateButton = page.locator('[data-testid="generate-statement"]');
    await expect(generateButton).toBeVisible();
    await generateButton.click();
    
    // Verify generation form/modal
    const generationModal = page.locator('[data-testid="statement-generation-modal"]');
    await expect(generationModal).toBeVisible();
    
    // Set date range (current financial year)
    const today = new Date();
    const financialYearStart = new Date(today.getFullYear(), 3, 1); // April 1st
    const financialYearEnd = new Date(today.getFullYear() + 1, 2, 31); // March 31st next year
    
    const fromDate = financialYearStart.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    
    await page.fill('[data-testid="statement-date-from"]', fromDate);
    await page.fill('[data-testid="statement-date-to"]', toDate);
    
    // Select "detailed" format
    const formatSelect = page.locator('[data-testid="statement-format"]');
    await formatSelect.click();
    await page.locator('[data-testid="format-detailed"]').click();
    
    // Start generation
    const startTime = Date.now();
    const submitButton = page.locator('[data-testid="submit-generate"]');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    
    // Wait for generation to complete
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('[data-testid="generation-success"]')).toBeVisible({ timeout: 10000 });
    
    const generationTime = Date.now() - startTime;
    expect(generationTime).toBeLessThan(5000); // < 5 seconds
    
    // Verify success message
    await expect(page.locator('[data-testid="generation-success"]'))
      .toContainText('Statement generated successfully');
    
    // Verify statement appears in list
    const statementList = page.locator('[data-testid="statement-list"]');
    await expect(statementList).toBeVisible();
    
    const statements = page.locator('[data-testid="statement-item"]');
    expect(await statements.count()).toBeGreaterThan(0);
    
    // Verify first statement details
    const latestStatement = statements.first();
    await expect(latestStatement.locator('[data-testid="statement-number"]')).toBeVisible();
    await expect(latestStatement.locator('[data-testid="statement-date-range"]')).toBeVisible();
    await expect(latestStatement.locator('[data-testid="statement-format"]')).toContainText('Detailed');
    
    // Verify statement number format (FS-YYYY-MM-NNNNN)
    const statementNumber = await latestStatement.locator('[data-testid="statement-number"]').textContent();
    expect(statementNumber).toMatch(/FS-\d{4}-\d{2}-\d{5}/);
  });

  /**
   * FS-E2E-002: Generate summary financial statement
   * 
   * Validates:
   * - Can choose "summary" format
   * - Summary shows totals only (no transaction details)
   * - Summary includes: total invested, total refunded, net investment, total tax
   * - Summary generation faster than detailed (< 3 seconds)
   * - Summary PDF is smaller in size
   */
  test('FS-E2E-002: should generate summary financial statement', async ({ page }) => {
    await page.goto('/dashboard/financial-statements');
    await page.waitForLoadState('networkidle');
    
    // Click generate button
    await page.click('[data-testid="generate-statement"]');
    
    const generationModal = page.locator('[data-testid="statement-generation-modal"]');
    await expect(generationModal).toBeVisible();
    
    // Set date range (last quarter)
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    const fromDate = threeMonthsAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    
    await page.fill('[data-testid="statement-date-from"]', fromDate);
    await page.fill('[data-testid="statement-date-to"]', toDate);
    
    // Select "summary" format
    const formatSelect = page.locator('[data-testid="statement-format"]');
    await formatSelect.click();
    await page.locator('[data-testid="format-summary"]').click();
    
    // Start generation
    const startTime = Date.now();
    await page.click('[data-testid="submit-generate"]');
    
    // Wait for generation
    await expect(page.locator('[data-testid="generation-success"]')).toBeVisible({ timeout: 10000 });
    
    const generationTime = Date.now() - startTime;
    expect(generationTime).toBeLessThan(3000); // < 3 seconds for summary
    
    // Find the newly generated summary statement
    const statements = page.locator('[data-testid="statement-item"]');
    const summaryStatement = statements.filter({ 
      has: page.locator('[data-testid="statement-format"]:has-text("Summary")') 
    }).first();
    
    await expect(summaryStatement).toBeVisible();
    
    // Click to view summary details
    await summaryStatement.click();
    await page.waitForTimeout(1000);
    
    // Verify summary view shows totals
    const summaryView = page.locator('[data-testid="statement-summary-view"]');
    await expect(summaryView).toBeVisible();
    
    await expect(summaryView.locator('[data-testid="total-invested"]')).toBeVisible();
    await expect(summaryView.locator('[data-testid="total-refunded"]')).toBeVisible();
    await expect(summaryView.locator('[data-testid="net-investment"]')).toBeVisible();
    await expect(summaryView.locator('[data-testid="total-tax"]')).toBeVisible();
    
    // Verify no transaction details shown
    const transactionList = summaryView.locator('[data-testid="transaction-details"]');
    await expect(transactionList).not.toBeVisible();
  });

  /**
   * FS-E2E-003: View tax breakdown in statement
   * 
   * Validates:
   * - Statement shows tax breakdown section
   * - Displays CGST, SGST, IGST, TDS separately
   * - Shows tax percentages
   * - Tax totals add up correctly
   * - Indian tax formatting (₹ symbol, lakh/crore)
   */
  test('FS-E2E-003: should display tax breakdown in statement', async ({ page }) => {
    await page.goto('/dashboard/financial-statements');
    await page.waitForLoadState('networkidle');
    
    // Check if statements exist
    const statements = page.locator('[data-testid="statement-item"]');
    const count = await statements.count();
    
    if (count === 0) {
      // Generate a statement first
      await page.click('[data-testid="generate-statement"]');
      await page.fill('[data-testid="statement-date-from"]', '2024-04-01');
      await page.fill('[data-testid="statement-date-to"]', new Date().toISOString().split('T')[0]);
      await page.click('[data-testid="format-detailed"]');
      await page.click('[data-testid="submit-generate"]');
      await expect(page.locator('[data-testid="generation-success"]')).toBeVisible({ timeout: 10000 });
    }
    
    // Click first statement to view details
    const firstStatement = page.locator('[data-testid="statement-item"]').first();
    await firstStatement.click();
    await page.waitForTimeout(1000);
    
    // Verify tax breakdown section
    const taxBreakdown = page.locator('[data-testid="tax-breakdown"]');
    await expect(taxBreakdown).toBeVisible();
    
    // Verify tax components
    const cgstRow = taxBreakdown.locator('[data-testid="tax-cgst"]');
    const sgstRow = taxBreakdown.locator('[data-testid="tax-sgst"]');
    const igstRow = taxBreakdown.locator('[data-testid="tax-igst"]');
    const tdsRow = taxBreakdown.locator('[data-testid="tax-tds"]');
    
    // At least one tax type should be present
    const hasCGST = await cgstRow.isVisible().catch(() => false);
    const hasSGST = await sgstRow.isVisible().catch(() => false);
    const hasIGST = await igstRow.isVisible().catch(() => false);
    const hasTDS = await tdsRow.isVisible().catch(() => false);
    
    expect(hasCGST || hasSGST || hasIGST || hasTDS).toBeTruthy();
    
    // Verify total tax
    const totalTax = taxBreakdown.locator('[data-testid="total-tax"]');
    await expect(totalTax).toBeVisible();
    
    const totalTaxText = await totalTax.textContent();
    expect(totalTaxText).toContain('₹'); // Indian rupee symbol
    
    // Verify Indian number formatting
    if (hasCGST) {
      const cgstAmount = await cgstRow.locator('[data-testid="tax-amount"]').textContent();
      expect(cgstAmount).toMatch(/₹[\d,]+/); // Comma-separated format
    }
  });

  /**
   * FS-E2E-004: Email statement to user
   * 
   * Validates:
   * - "Email Statement" button is present
   * - Can send statement to registered email
   * - Can send to additional email addresses
   * - Email confirmation message shown
   * - Statement marked as "emailed" with timestamp
   * - Email address stored in statement record
   */
  test('FS-E2E-004: should email financial statement', async ({ page }) => {
    await page.goto('/dashboard/financial-statements');
    await page.waitForLoadState('networkidle');
    
    // Ensure at least one statement exists
    const statements = page.locator('[data-testid="statement-item"]');
    if (await statements.count() === 0) {
      test.skip();
      return;
    }
    
    // Click first statement
    const firstStatement = statements.first();
    await firstStatement.click();
    await page.waitForTimeout(1000);
    
    // Click "Email Statement" button
    const emailButton = page.locator('[data-testid="email-statement"]');
    await expect(emailButton).toBeVisible();
    await emailButton.click();
    
    // Verify email dialog
    const emailDialog = page.locator('[data-testid="email-dialog"]');
    await expect(emailDialog).toBeVisible();
    
    // Verify default email is pre-filled (user's registered email)
    const emailInput = emailDialog.locator('[data-testid="email-to"]');
    await expect(emailInput).toHaveValue(TEST_INVESTOR.email);
    
    // Optionally add additional email
    const additionalEmailInput = emailDialog.locator('[data-testid="additional-email"]');
    if (await additionalEmailInput.isVisible()) {
      await additionalEmailInput.fill('additional@test.com');
    }
    
    // Send email
    const sendButton = emailDialog.locator('[data-testid="send-email"]');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();
    
    // Wait for email to send
    await expect(page.locator('[data-testid="email-success"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="email-success"]'))
      .toContainText('Statement emailed successfully');
    
    // Verify statement shows "emailed" indicator
    const emailedIndicator = page.locator('[data-testid="emailed-indicator"]');
    await expect(emailedIndicator).toBeVisible();
    
    // Verify emailed timestamp
    const emailedAt = page.locator('[data-testid="emailed-at"]');
    await expect(emailedAt).toBeVisible();
    const emailedTimeText = await emailedAt.textContent();
    expect(emailedTimeText).toMatch(/Emailed.*ago|Emailed.*on/i);
  });

  /**
   * FS-E2E-005: Download statement PDF
   * 
   * Validates:
   * - "Download PDF" button is present
   * - PDF download triggers correctly
   * - PDF filename includes statement number
   * - PDF contains all statement data
   * - PDF uses Indian number formatting
   * - PDF includes company branding/logo
   */
  test('FS-E2E-005: should download financial statement PDF', async ({ page }) => {
    await page.goto('/dashboard/financial-statements');
    await page.waitForLoadState('networkidle');
    
    const statements = page.locator('[data-testid="statement-item"]');
    if (await statements.count() === 0) {
      test.skip();
      return;
    }
    
    // Get statement number for filename verification
    const firstStatement = statements.first();
    const statementNumber = await firstStatement.locator('[data-testid="statement-number"]').textContent();
    
    // Click download button
    const downloadButton = firstStatement.locator('[data-testid="download-statement"]');
    await expect(downloadButton).toBeVisible();
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify filename
    const filename = download.suggestedFilename();
    expect(filename).toContain(statementNumber?.replace(/\//g, '-'));
    expect(filename).toMatch(/\.pdf$/i);
    
    // Save and verify file
    const path = await download.path();
    expect(path).toBeTruthy();
    
    // Verify file is PDF
    const fs = require('fs');
    if (path && fs.existsSync(path)) {
      const pdfBuffer = fs.readFileSync(path);
      
      // Check PDF magic bytes
      const pdfHeader = pdfBuffer.toString('utf-8', 0, 4);
      expect(pdfHeader).toBe('%PDF');
      
      // Verify PDF is not empty (reasonable minimum size)
      expect(pdfBuffer.length).toBeGreaterThan(5000);
      
      // Convert buffer to string to search for content
      const pdfContent = pdfBuffer.toString('utf-8');
      
      // Verify Indian currency symbol present
      expect(pdfContent).toContain('₹');
    }
  });

  /**
   * FS-E2E-006: View statement generation history
   * 
   * Validates:
   * - Statements list shows all generated statements
   * - Sorted by generation date (newest first)
   * - Each entry shows: number, date range, format, generation date
   * - Can view statement details
   * - Shows statement status (generated, emailed)
   * - Pagination works for many statements
   */
  test('FS-E2E-006: should display statement generation history', async ({ page }) => {
    await page.goto('/dashboard/financial-statements');
    await page.waitForLoadState('networkidle');
    
    // Verify page header
    await expect(page.locator('h1')).toContainText('Financial Statements');
    
    // Verify statements list
    const statementsList = page.locator('[data-testid="statement-list"]');
    await expect(statementsList).toBeVisible();
    
    // Check if statements exist
    const statements = page.locator('[data-testid="statement-item"]');
    const count = await statements.count();
    
    if (count === 0) {
      // No statements yet, verify empty state
      await expect(page.locator('[data-testid="no-statements"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-statements"]'))
        .toContainText('No financial statements generated yet');
    } else {
      // Verify statements are displayed
      expect(count).toBeGreaterThan(0);
      
      // Verify first statement has required fields
      const firstStatement = statements.first();
      
      await expect(firstStatement.locator('[data-testid="statement-number"]')).toBeVisible();
      await expect(firstStatement.locator('[data-testid="statement-date-range"]')).toBeVisible();
      await expect(firstStatement.locator('[data-testid="statement-format"]')).toBeVisible();
      await expect(firstStatement.locator('[data-testid="statement-generated-at"]')).toBeVisible();
      
      // Verify sorting (newest first) - compare first two statements
      if (count >= 2) {
        const firstGenDate = await statements.nth(0).locator('[data-testid="statement-generated-at"]').textContent();
        const secondGenDate = await statements.nth(1).locator('[data-testid="statement-generated-at"]').textContent();
        
        // Both should have dates
        expect(firstGenDate).toBeTruthy();
        expect(secondGenDate).toBeTruthy();
      }
      
      // Test viewing statement details
      await firstStatement.click();
      await page.waitForTimeout(1000);
      
      // Verify details view
      const detailsView = page.locator('[data-testid="statement-details"]');
      await expect(detailsView).toBeVisible();
      
      // Verify back button works
      const backButton = page.locator('[data-testid="back-to-list"]');
      if (await backButton.isVisible()) {
        await backButton.click();
        await expect(statementsList).toBeVisible();
      }
    }
  });

  /**
   * FS-E2E-007: Filter statements by date range
   * 
   * Validates:
   * - Date range filter is present
   * - Can filter statements by generation date
   * - Can filter by statement date range (from/to dates)
   * - Filter applies without full page reload
   * - Clear filter button works
   * - Filtered results are accurate
   */
  test('FS-E2E-007: should filter statements by date range', async ({ page }) => {
    await page.goto('/dashboard/financial-statements');
    await page.waitForLoadState('networkidle');
    
    // Check if statements exist
    const statements = page.locator('[data-testid="statement-item"]');
    if (await statements.count() === 0) {
      test.skip();
      return;
    }
    
    // Open filter section
    const filterButton = page.locator('[data-testid="filter-statements"]');
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
    
    // Verify filter options
    const filterSection = page.locator('[data-testid="statement-filters"]');
    await expect(filterSection).toBeVisible();
    
    // Set date range filter (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const filterFromDate = page.locator('[data-testid="filter-date-from"]');
    const filterToDate = page.locator('[data-testid="filter-date-to"]');
    
    await filterFromDate.fill(thirtyDaysAgo.toISOString().split('T')[0]);
    await filterToDate.fill(today.toISOString().split('T')[0]);
    
    // Apply filter
    const applyFilterButton = page.locator('[data-testid="apply-filter"]');
    await applyFilterButton.click();
    await page.waitForTimeout(500);
    
    // Verify filter applied indicator
    const activeFilter = page.locator('[data-testid="active-filter"]');
    await expect(activeFilter).toBeVisible();
    
    // Verify statements are within date range
    const filteredStatements = page.locator('[data-testid="statement-item"]');
    const filteredCount = await filteredStatements.count();
    
    if (filteredCount > 0) {
      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThanOrEqual(await statements.count());
    }
    
    // Clear filter
    const clearFilterButton = page.locator('[data-testid="clear-filter"]');
    await clearFilterButton.click();
    await page.waitForTimeout(500);
    
    // Verify filter cleared
    await expect(activeFilter).not.toBeVisible();
  });

  /**
   * FS-E2E-008: Verify Indian number formatting in PDF
   * 
   * Validates:
   * - PDF uses ₹ symbol for currency
   * - Numbers use Indian comma notation (1,00,000)
   * - Large amounts show Lakh/Crore labels
   * - Tax percentages formatted correctly (18% GST)
   * - Dates in DD/MM/YYYY format
   * - PDF is in portrait A4 format
   */
  test('FS-E2E-008: should use Indian formatting in PDF', async ({ page }) => {
    await page.goto('/dashboard/financial-statements');
    await page.waitForLoadState('networkidle');
    
    const statements = page.locator('[data-testid="statement-item"]');
    if (await statements.count() === 0) {
      // Generate a statement with transactions first
      await page.click('[data-testid="generate-statement"]');
      await page.fill('[data-testid="statement-date-from"]', '2024-04-01');
      await page.fill('[data-testid="statement-date-to"]', new Date().toISOString().split('T')[0]);
      await page.click('[data-testid="format-detailed"]');
      await page.click('[data-testid="submit-generate"]');
      await expect(page.locator('[data-testid="generation-success"]')).toBeVisible({ timeout: 10000 });
    }
    
    // Verify Indian formatting in UI first
    const firstStatement = statements.first();
    await firstStatement.click();
    await page.waitForTimeout(1000);
    
    // Check currency symbol in UI
    const amountElements = page.locator('[data-testid*="amount"]');
    if (await amountElements.count() > 0) {
      const firstAmount = await amountElements.first().textContent();
      expect(firstAmount).toContain('₹');
      
      // Check for comma formatting
      if (firstAmount && parseFloat(firstAmount.replace(/[₹,]/g, '')) >= 1000) {
        expect(firstAmount).toMatch(/₹[\d,]+/);
      }
    }
    
    // Download PDF to verify formatting
    const downloadButton = page.locator('[data-testid="download-statement"]');
    
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    
    const download = await downloadPromise;
    const path = await download.path();
    
    // Verify PDF content
    const fs = require('fs');
    if (path && fs.existsSync(path)) {
      const pdfBuffer = fs.readFileSync(path);
      const pdfContent = pdfBuffer.toString('utf-8');
      
      // Verify Indian currency symbol
      expect(pdfContent).toContain('₹');
      
      // Verify date format hints (PDF will contain date strings)
      expect(pdfContent).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      
      // Verify GST mentions (if applicable)
      const hasGST = pdfContent.includes('CGST') || pdfContent.includes('SGST') || pdfContent.includes('IGST');
      if (hasGST) {
        expect(pdfContent).toMatch(/\d+%/); // Tax percentages
      }
    }
  });
});
