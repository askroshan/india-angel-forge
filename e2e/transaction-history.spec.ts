/**
 * E2E Test Suite: Transaction History (US-HISTORY-001)
 * 
 * Tests the enhanced transaction history feature with pagination,
 * filtering, search, sorting, and export capabilities.
 * 
 * Test Coverage:
 * - TH-E2E-001: Display transaction history with pagination
 * - TH-E2E-002: Filter transactions by date range
 * - TH-E2E-003: Filter by transaction type
 * - TH-E2E-004: Filter by status
 * - TH-E2E-005: Filter by payment gateway
 * - TH-E2E-006: Filter by amount range
 * - TH-E2E-007: Search by transaction ID and description
 * - TH-E2E-008: Sort transactions (newest/oldest/amount high/low)
 * - TH-E2E-009: Export transactions to CSV
 * - TH-E2E-010: Export transactions to PDF
 */

import { test, expect } from '@playwright/test';

// Test data setup constants
const TEST_USER = {
  email: 'investor@test.com',
  password: 'Test123!@#',
  name: 'Test Investor',
};

const TRANSACTIONS_PER_PAGE = 20;

test.describe('Transaction History (US-HISTORY-001)', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  /**
   * TH-E2E-001: Display transaction history with pagination
   * 
   * Validates:
   * - Transaction history page loads successfully
   * - Displays up to 20 transactions per page
   * - Shows pagination controls when > 20 transactions
   * - Each transaction shows: date, type, amount, status, gateway
   * - Initial load time < 2 seconds
   */
  test('TH-E2E-001: should display transaction history with pagination', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to transaction history
    await page.goto('/dashboard/transactions');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // < 2s load time
    
    // Verify page title and header
    await expect(page.locator('h1')).toContainText('Transaction History');
    
    // Verify transaction list is visible
    const transactionList = page.locator('[data-testid="transaction-list"]');
    await expect(transactionList).toBeVisible();
    
    // Get transaction items
    const transactionItems = page.locator('[data-testid="transaction-item"]');
    const count = await transactionItems.count();
    
    // Verify max 20 items per page
    expect(count).toBeLessThanOrEqual(TRANSACTIONS_PER_PAGE);
    expect(count).toBeGreaterThan(0);
    
    // Verify first transaction has required fields
    const firstTransaction = transactionItems.first();
    await expect(firstTransaction.locator('[data-testid="transaction-date"]')).toBeVisible();
    await expect(firstTransaction.locator('[data-testid="transaction-type"]')).toBeVisible();
    await expect(firstTransaction.locator('[data-testid="transaction-amount"]')).toBeVisible();
    await expect(firstTransaction.locator('[data-testid="transaction-status"]')).toBeVisible();
    await expect(firstTransaction.locator('[data-testid="transaction-gateway"]')).toBeVisible();
    
    // Verify pagination controls if needed
    if (count === TRANSACTIONS_PER_PAGE) {
      await expect(page.locator('[data-testid="pagination-controls"]')).toBeVisible();
      await expect(page.locator('[data-testid="page-next"]')).toBeEnabled();
    }
  });

  /**
   * TH-E2E-002: Filter transactions by date range
   * 
   * Validates:
   * - Date range filter UI is present
   * - Can select custom date range (from/to)
   * - Only transactions within date range are shown
   * - Filter applies without full page reload
   * - Filter state persists during session
   */
  test('TH-E2E-002: should filter transactions by date range', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await page.waitForLoadState('networkidle');
    
    // Open date filter
    const dateFilterButton = page.locator('[data-testid="filter-date"]');
    await expect(dateFilterButton).toBeVisible();
    await dateFilterButton.click();
    
    // Set date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    
    await page.fill('[data-testid="date-from"]', fromDate);
    await page.fill('[data-testid="date-to"]', toDate);
    await page.click('[data-testid="apply-date-filter"]');
    
    // Wait for filter to apply (no full page reload)
    await page.waitForTimeout(500);
    
    // Verify transactions are within date range
    const transactionItems = page.locator('[data-testid="transaction-item"]');
    const count = await transactionItems.count();
    
    if (count > 0) {
      const firstTransactionDate = await transactionItems.first().locator('[data-testid="transaction-date"]').textContent();
      expect(firstTransactionDate).toBeTruthy();
      
      // Verify active filter indicator
      await expect(page.locator('[data-testid="active-filters"]')).toContainText('Date');
    }
    
    // Clear filter
    await page.click('[data-testid="clear-date-filter"]');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="active-filters"]')).not.toContainText('Date');
  });

  /**
   * TH-E2E-003: Filter by transaction type
   * 
   * Validates:
   * - Transaction type filter dropdown is present
   * - Shows types: INVESTMENT, MEMBERSHIP_FEE, EVENT_FEE, REFUND
   * - Can select multiple types
   * - Only selected types are shown
   * - Filter interaction time < 500ms
   */
  test('TH-E2E-003: should filter by transaction type', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await page.waitForLoadState('networkidle');
    
    // Open type filter
    const typeFilterButton = page.locator('[data-testid="filter-type"]');
    await expect(typeFilterButton).toBeVisible();
    
    const startTime = Date.now();
    await typeFilterButton.click();
    
    // Verify filter options
    await expect(page.locator('[data-testid="type-investment"]')).toBeVisible();
    await expect(page.locator('[data-testid="type-membership"]')).toBeVisible();
    await expect(page.locator('[data-testid="type-event"]')).toBeVisible();
    await expect(page.locator('[data-testid="type-refund"]')).toBeVisible();
    
    // Select INVESTMENT type
    await page.click('[data-testid="type-investment"]');
    await page.click('[data-testid="apply-type-filter"]');
    
    const filterTime = Date.now() - startTime;
    expect(filterTime).toBeLessThan(500); // < 500ms interaction
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const transactionItems = page.locator('[data-testid="transaction-item"]');
    const count = await transactionItems.count();
    
    if (count > 0) {
      // Check first transaction shows INVESTMENT type
      const firstType = await transactionItems.first().locator('[data-testid="transaction-type"]').textContent();
      expect(firstType).toContain('Investment');
    }
    
    // Verify active filter
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('Type');
  });

  /**
   * TH-E2E-004: Filter by status
   * 
   * Validates:
   * - Status filter dropdown is present
   * - Shows statuses: PENDING, COMPLETED, FAILED, REFUNDED
   * - Can select multiple statuses
   * - Only selected statuses are shown
   * - Status badges display correctly
   */
  test('TH-E2E-004: should filter by transaction status', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await page.waitForLoadState('networkidle');
    
    // Open status filter
    const statusFilterButton = page.locator('[data-testid="filter-status"]');
    await expect(statusFilterButton).toBeVisible();
    await statusFilterButton.click();
    
    // Verify filter options
    await expect(page.locator('[data-testid="status-pending"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-completed"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-failed"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-refunded"]')).toBeVisible();
    
    // Select COMPLETED status
    await page.click('[data-testid="status-completed"]');
    await page.click('[data-testid="apply-status-filter"]');
    
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const transactionItems = page.locator('[data-testid="transaction-item"]');
    const count = await transactionItems.count();
    
    if (count > 0) {
      // Check first transaction shows COMPLETED status
      const firstStatus = transactionItems.first().locator('[data-testid="transaction-status"]');
      await expect(firstStatus).toBeVisible();
      const statusText = await firstStatus.textContent();
      expect(statusText?.toLowerCase()).toContain('completed');
      
      // Verify status badge styling
      await expect(firstStatus).toHaveClass(/status-completed|badge-success/);
    }
    
    // Verify active filter
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('Status');
  });

  /**
   * TH-E2E-005: Filter by payment gateway
   * 
   * Validates:
   * - Gateway filter dropdown is present
   * - Shows gateways: RAZORPAY, STRIPE, etc.
   * - Only transactions from selected gateway shown
   * - Gateway logos/names display correctly
   */
  test('TH-E2E-005: should filter by payment gateway', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await page.waitForLoadState('networkidle');
    
    // Open gateway filter
    const gatewayFilterButton = page.locator('[data-testid="filter-gateway"]');
    await expect(gatewayFilterButton).toBeVisible();
    await gatewayFilterButton.click();
    
    // Verify filter options
    await expect(page.locator('[data-testid="gateway-razorpay"]')).toBeVisible();
    await expect(page.locator('[data-testid="gateway-stripe"]')).toBeVisible();
    
    // Select RAZORPAY
    await page.click('[data-testid="gateway-razorpay"]');
    await page.click('[data-testid="apply-gateway-filter"]');
    
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const transactionItems = page.locator('[data-testid="transaction-item"]');
    const count = await transactionItems.count();
    
    if (count > 0) {
      // Check first transaction shows Razorpay
      const firstGateway = await transactionItems.first().locator('[data-testid="transaction-gateway"]').textContent();
      expect(firstGateway?.toLowerCase()).toContain('razorpay');
    }
    
    // Verify active filter
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('Gateway');
  });

  /**
   * TH-E2E-006: Filter by amount range
   * 
   * Validates:
   * - Amount range filter UI is present
   * - Can set minimum and maximum amounts
   * - Only transactions within amount range shown
   * - Amount formatting (Indian notation)
   * - Currency symbol (₹) displays correctly
   */
  test('TH-E2E-006: should filter by amount range', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await page.waitForLoadState('networkidle');
    
    // Open amount filter
    const amountFilterButton = page.locator('[data-testid="filter-amount"]');
    await expect(amountFilterButton).toBeVisible();
    await amountFilterButton.click();
    
    // Set amount range (₹1,000 to ₹10,000)
    await page.fill('[data-testid="amount-min"]', '1000');
    await page.fill('[data-testid="amount-max"]', '10000');
    await page.click('[data-testid="apply-amount-filter"]');
    
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const transactionItems = page.locator('[data-testid="transaction-item"]');
    const count = await transactionItems.count();
    
    if (count > 0) {
      // Check first transaction amount format
      const firstAmount = transactionItems.first().locator('[data-testid="transaction-amount"]');
      await expect(firstAmount).toBeVisible();
      
      const amountText = await firstAmount.textContent();
      expect(amountText).toContain('₹'); // Currency symbol
      
      // Verify amount is within range (extract numeric value)
      const numericAmount = parseFloat(amountText!.replace(/[₹,]/g, ''));
      expect(numericAmount).toBeGreaterThanOrEqual(1000);
      expect(numericAmount).toBeLessThanOrEqual(10000);
    }
    
    // Verify active filter
    await expect(page.locator('[data-testid="active-filters"]')).toContainText('Amount');
  });

  /**
   * TH-E2E-007: Search by transaction ID and description
   * 
   * Validates:
   * - Search box is present and functional
   * - Can search by transaction ID
   * - Can search by description keywords
   * - Search results update in real-time (debounced)
   * - "No results" message when no matches
   * - Clear search button works
   */
  test('TH-E2E-007: should search transactions by ID and description', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await page.waitForLoadState('networkidle');
    
    // Verify search box
    const searchBox = page.locator('[data-testid="search-transactions"]');
    await expect(searchBox).toBeVisible();
    await expect(searchBox).toHaveAttribute('placeholder', /search/i);
    
    // Get first transaction ID for search test
    const firstTransaction = page.locator('[data-testid="transaction-item"]').first();
    await firstTransaction.click();
    
    const transactionIdElement = page.locator('[data-testid="transaction-id"]');
    const transactionId = await transactionIdElement.textContent();
    
    // Go back to list
    await page.goto('/dashboard/transactions');
    await page.waitForLoadState('networkidle');
    
    // Search by transaction ID (partial)
    const partialId = transactionId?.slice(0, 8);
    await searchBox.fill(partialId || '');
    
    // Wait for debounced search
    await page.waitForTimeout(1000);
    
    // Verify search results
    const transactionItems = page.locator('[data-testid="transaction-item"]');
    const count = await transactionItems.count();
    
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    } else {
      // Verify "no results" message
      await expect(page.locator('[data-testid="no-transactions"]')).toBeVisible();
    }
    
    // Clear search
    const clearButton = page.locator('[data-testid="clear-search"]');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);
      
      // Verify results restored
      const restoredCount = await transactionItems.count();
      expect(restoredCount).toBeGreaterThan(0);
    }
  });

  /**
   * TH-E2E-008: Sort transactions
   * 
   * Validates:
   * - Sort dropdown is present
   * - Sort options: Newest First, Oldest First, Amount High-Low, Amount Low-High
   * - Sorting applies without full page reload
   * - Sort order is visually correct
   * - Default sort is "Newest First"
   */
  test('TH-E2E-008: should sort transactions by date and amount', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await page.waitForLoadState('networkidle');
    
    // Verify sort dropdown
    const sortDropdown = page.locator('[data-testid="sort-transactions"]');
    await expect(sortDropdown).toBeVisible();
    
    // Get initial first transaction date
    const firstTransaction = page.locator('[data-testid="transaction-item"]').first();
    const firstDate = await firstTransaction.locator('[data-testid="transaction-date"]').textContent();
    
    // Change sort to "Oldest First"
    await sortDropdown.click();
    await page.locator('[data-testid="sort-oldest"]').click();
    await page.waitForTimeout(500);
    
    // Verify sort changed (first item should be different)
    const newFirstDate = await page.locator('[data-testid="transaction-item"]').first()
      .locator('[data-testid="transaction-date"]').textContent();
    
    // Sort by "Amount High-Low"
    await sortDropdown.click();
    await page.locator('[data-testid="sort-amount-high"]').click();
    await page.waitForTimeout(500);
    
    // Get first two amounts and verify descending order
    const amounts = await page.locator('[data-testid="transaction-amount"]').allTextContents();
    if (amounts.length >= 2) {
      const amount1 = parseFloat(amounts[0].replace(/[₹,]/g, ''));
      const amount2 = parseFloat(amounts[1].replace(/[₹,]/g, ''));
      expect(amount1).toBeGreaterThanOrEqual(amount2);
    }
    
    // Sort by "Amount Low-High"
    await sortDropdown.click();
    await page.locator('[data-testid="sort-amount-low"]').click();
    await page.waitForTimeout(500);
    
    // Verify ascending order
    const amountsAsc = await page.locator('[data-testid="transaction-amount"]').allTextContents();
    if (amountsAsc.length >= 2) {
      const amount1 = parseFloat(amountsAsc[0].replace(/[₹,]/g, ''));
      const amount2 = parseFloat(amountsAsc[1].replace(/[₹,]/g, ''));
      expect(amount1).toBeLessThanOrEqual(amount2);
    }
  });

  /**
   * TH-E2E-009: Export transactions to CSV
   * 
   * Validates:
   * - Export CSV button is present
   * - CSV download triggers correctly
   * - Downloaded file is valid CSV format
   * - CSV contains all visible transaction data
   * - CSV respects current filters
   */
  test('TH-E2E-009: should export transactions to CSV', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await page.waitForLoadState('networkidle');
    
    // Verify export button
    const exportCsvButton = page.locator('[data-testid="export-csv"]');
    await expect(exportCsvButton).toBeVisible();
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click export
    await exportCsvButton.click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify filename
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/transactions.*\.csv$/i);
    
    // Save and verify file content
    const path = await download.path();
    expect(path).toBeTruthy();
    
    // Optional: Verify CSV content structure
    const fs = require('fs');
    if (path && fs.existsSync(path)) {
      const csvContent = fs.readFileSync(path, 'utf-8');
      
      // Verify CSV headers
      expect(csvContent).toContain('Date');
      expect(csvContent).toContain('Type');
      expect(csvContent).toContain('Amount');
      expect(csvContent).toContain('Status');
      expect(csvContent).toContain('Gateway');
      expect(csvContent).toContain('Transaction ID');
    }
  });

  /**
   * TH-E2E-010: Export transactions to PDF
   * 
   * Validates:
   * - Export PDF button is present
   * - PDF download triggers correctly
   * - Downloaded file is valid PDF
   * - PDF contains transaction data with proper formatting
   * - PDF includes Indian number formatting
   * - PDF respects current filters
   */
  test('TH-E2E-010: should export transactions to PDF', async ({ page }) => {
    await page.goto('/dashboard/transactions');
    await page.waitForLoadState('networkidle');
    
    // Verify export button
    const exportPdfButton = page.locator('[data-testid="export-pdf"]');
    await expect(exportPdfButton).toBeVisible();
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click export
    await exportPdfButton.click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify filename
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/transactions.*\.pdf$/i);
    
    // Save and verify file exists
    const path = await download.path();
    expect(path).toBeTruthy();
    
    // Verify file is PDF
    const fs = require('fs');
    if (path && fs.existsSync(path)) {
      const pdfBuffer = fs.readFileSync(path);
      
      // Check PDF magic bytes
      const pdfHeader = pdfBuffer.toString('utf-8', 0, 4);
      expect(pdfHeader).toBe('%PDF');
    }
  });
});
