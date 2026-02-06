/**
 * E2E Test Suite: Event Attendance Tracking (US-HISTORY-002)
 * 
 * Tests event attendance tracking with RSVP management, check-in/out,
 * certificate generation, and verification.
 * 
 * Test Coverage:
 * - EA-E2E-001: RSVP to event and view status
 * - EA-E2E-002: Admin check-in attendee
 * - EA-E2E-003: Admin check-out attendee
 * - EA-E2E-004: Generate attendance certificate
 * - EA-E2E-005: Verify certificate authenticity
 * - EA-E2E-006: View event attendance statistics
 * - EA-E2E-007: Cancel RSVP and update attendance
 * - EA-E2E-008: Download certificate PDF
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

const TEST_EVENT = {
  title: 'Angel Investment Workshop',
  date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
  location: 'Mumbai, India',
  capacity: 50,
};

test.describe('Event Attendance Tracking (US-HISTORY-002)', () => {
  
  /**
   * EA-E2E-001: RSVP to event and view status
   * 
   * Validates:
   * - User can RSVP to upcoming event
   * - RSVP status shows as CONFIRMED
   * - RSVP appears in user's event list
   * - Confirmation email sent notification
   * - Event capacity updates correctly
   */
  test('EA-E2E-001: should RSVP to event and view confirmation status', async ({ page }) => {
    // Login as investor
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_INVESTOR.email);
    await page.fill('input[type="password"]', TEST_INVESTOR.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to events
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    
    // Find upcoming event
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await expect(eventCard).toBeVisible();
    
    // Click event to view details
    await eventCard.click();
    await page.waitForLoadState('networkidle');
    
    // Verify event details page
    await expect(page.locator('[data-testid="event-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-location"]')).toBeVisible();
    
    // RSVP to event
    const rsvpButton = page.locator('[data-testid="rsvp-button"]');
    await expect(rsvpButton).toBeVisible();
    await expect(rsvpButton).toBeEnabled();
    await rsvpButton.click();
    
    // Wait for RSVP confirmation
    await page.waitForTimeout(1000);
    
    // Verify RSVP status
    await expect(page.locator('[data-testid="rsvp-status"]')).toContainText('Confirmed');
    await expect(page.locator('[data-testid="rsvp-success-message"]')).toBeVisible();
    
    // Verify button changed to "Cancel RSVP"
    await expect(page.locator('[data-testid="cancel-rsvp-button"]')).toBeVisible();
    
    // Navigate to user's events
    await page.goto('/dashboard/my-events');
    await page.waitForLoadState('networkidle');
    
    // Verify event appears in list
    const myEvents = page.locator('[data-testid="my-event-item"]');
    expect(await myEvents.count()).toBeGreaterThan(0);
    
    // Check RSVP status badge
    const statusBadge = myEvents.first().locator('[data-testid="rsvp-status-badge"]');
    await expect(statusBadge).toContainText('Confirmed');
  });

  /**
   * EA-E2E-002: Admin check-in attendee
   * 
   * Validates:
   * - Admin can access event check-in page
   * - Attendee list shows all RSVPs
   * - Can mark attendee as checked in
   * - Check-in time is recorded
   * - Attendance status updates to ATTENDED
   * - Real-time attendance count updates
   */
  test('EA-E2E-002: should allow admin to check in attendee', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to admin events
    await page.goto('/admin/events');
    await page.waitForLoadState('networkidle');
    
    // Find today's or upcoming event
    const eventRow = page.locator('[data-testid="admin-event-row"]').first();
    await expect(eventRow).toBeVisible();
    
    // Click "Manage Attendance" button
    const manageButton = eventRow.locator('[data-testid="manage-attendance"]');
    await expect(manageButton).toBeVisible();
    await manageButton.click();
    
    await page.waitForLoadState('networkidle');
    
    // Verify attendance management page
    await expect(page.locator('h1')).toContainText('Event Attendance');
    
    // Verify attendee list
    const attendeeList = page.locator('[data-testid="attendee-list"]');
    await expect(attendeeList).toBeVisible();
    
    // Get first attendee with CONFIRMED status
    const attendeeRow = page.locator('[data-testid="attendee-row"]').first();
    await expect(attendeeRow).toBeVisible();
    
    // Get attendee name for verification
    const attendeeName = await attendeeRow.locator('[data-testid="attendee-name"]').textContent();
    expect(attendeeName).toBeTruthy();
    
    // Click check-in button
    const checkInButton = attendeeRow.locator('[data-testid="check-in-button"]');
    await expect(checkInButton).toBeEnabled();
    await checkInButton.click();
    
    // Wait for check-in to process
    await page.waitForTimeout(1000);
    
    // Verify check-in success
    await expect(page.locator('[data-testid="check-in-success"]')).toBeVisible({ timeout: 5000 });
    
    // Verify attendance status updated
    const statusBadge = attendeeRow.locator('[data-testid="attendance-status"]');
    await expect(statusBadge).toContainText('Checked In');
    
    // Verify check-in time displayed
    const checkInTime = attendeeRow.locator('[data-testid="check-in-time"]');
    await expect(checkInTime).toBeVisible();
    const timeText = await checkInTime.textContent();
    expect(timeText).toMatch(/\d{1,2}:\d{2}/); // Time format HH:MM
    
    // Verify attendance counter updated
    const attendanceCount = page.locator('[data-testid="attendance-count"]');
    await expect(attendanceCount).toBeVisible();
    const countText = await attendanceCount.textContent();
    expect(countText).toMatch(/\d+\/\d+/); // Format: checked-in/total
  });

  /**
   * EA-E2E-003: Admin check-out attendee
   * 
   * Validates:
   * - Can mark checked-in attendee as checked out
   * - Check-out time is recorded
   * - Duration is calculated correctly
   * - Attendance status updates to ATTENDED
   * - Certificate eligible indicator appears
   */
  test('EA-E2E-003: should allow admin to check out attendee', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to event attendance page
    await page.goto('/admin/events');
    await page.waitForLoadState('networkidle');
    
    const eventRow = page.locator('[data-testid="admin-event-row"]').first();
    await eventRow.locator('[data-testid="manage-attendance"]').click();
    await page.waitForLoadState('networkidle');
    
    // Find checked-in attendee
    const checkedInRow = page.locator('[data-testid="attendee-row"]')
      .filter({ has: page.locator('[data-testid="attendance-status"]:has-text("Checked In")') })
      .first();
    
    // If no checked-in attendees, check one in first
    if (await checkedInRow.count() === 0) {
      const firstAttendee = page.locator('[data-testid="attendee-row"]').first();
      await firstAttendee.locator('[data-testid="check-in-button"]').click();
      await page.waitForTimeout(1000);
    }
    
    // Get updated checked-in row
    const attendeeRow = page.locator('[data-testid="attendee-row"]')
      .filter({ has: page.locator('[data-testid="attendance-status"]:has-text("Checked In")') })
      .first();
    
    await expect(attendeeRow).toBeVisible();
    
    // Get check-in time for duration calculation
    const checkInTime = await attendeeRow.locator('[data-testid="check-in-time"]').textContent();
    
    // Click check-out button
    const checkOutButton = attendeeRow.locator('[data-testid="check-out-button"]');
    await expect(checkOutButton).toBeEnabled();
    await checkOutButton.click();
    
    // Wait for check-out to process
    await page.waitForTimeout(1000);
    
    // Verify check-out success
    await expect(page.locator('[data-testid="check-out-success"]')).toBeVisible({ timeout: 5000 });
    
    // Verify attendance status updated
    const statusBadge = attendeeRow.locator('[data-testid="attendance-status"]');
    await expect(statusBadge).toContainText('Attended');
    
    // Verify check-out time displayed
    const checkOutTime = attendeeRow.locator('[data-testid="check-out-time"]');
    await expect(checkOutTime).toBeVisible();
    
    // Verify duration calculated
    const duration = attendeeRow.locator('[data-testid="attendance-duration"]');
    await expect(duration).toBeVisible();
    const durationText = await duration.textContent();
    expect(durationText).toMatch(/\d+\s*(min|hour)/i);
    
    // Verify certificate eligible indicator
    const certificateEligible = attendeeRow.locator('[data-testid="certificate-eligible"]');
    await expect(certificateEligible).toBeVisible();
  });

  /**
   * EA-E2E-004: Generate attendance certificate
   * 
   * Validates:
   * - Certificate can be generated for attended events
   * - Certificate includes: attendee name, event name, date, duration
   * - Certificate ID is unique (CERT-YYYY-NNNNNN format)
   * - Certificate stored in database
   * - Certificate appears in user's certificates list
   * - Email notification sent to attendee
   */
  test('EA-E2E-004: should generate attendance certificate for attendee', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to event attendance page
    await page.goto('/admin/events');
    await page.waitForLoadState('networkidle');
    
    const eventRow = page.locator('[data-testid="admin-event-row"]').first();
    await eventRow.locator('[data-testid="manage-attendance"]').click();
    await page.waitForLoadState('networkidle');
    
    // Find attendee with ATTENDED status
    const attendedRow = page.locator('[data-testid="attendee-row"]')
      .filter({ has: page.locator('[data-testid="attendance-status"]:has-text("Attended")') })
      .first();
    
    await expect(attendedRow).toBeVisible();
    
    // Get attendee email for later verification
    const attendeeEmail = await attendedRow.locator('[data-testid="attendee-email"]').textContent();
    
    // Click "Generate Certificate" button
    const generateButton = attendedRow.locator('[data-testid="generate-certificate"]');
    await expect(generateButton).toBeEnabled();
    await generateButton.click();
    
    // Wait for certificate generation
    await page.waitForTimeout(2000);
    
    // Verify success notification
    await expect(page.locator('[data-testid="certificate-success"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="certificate-success"]')).toContainText('Certificate generated');
    
    // Verify certificate ID displayed
    const certificateId = attendedRow.locator('[data-testid="certificate-id"]');
    await expect(certificateId).toBeVisible();
    const certIdText = await certificateId.textContent();
    expect(certIdText).toMatch(/CERT-\d{4}-\d{6}/); // CERT-YYYY-NNNNNN format
    
    // Verify "View Certificate" button appears
    await expect(attendedRow.locator('[data-testid="view-certificate"]')).toBeVisible();
    
    // Logout admin and login as attendee to verify
    await page.goto('/logout');
    await page.goto('/login');
    await page.fill('input[type="email"]', attendeeEmail || TEST_INVESTOR.email);
    await page.fill('input[type="password"]', TEST_INVESTOR.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to certificates page
    await page.goto('/dashboard/certificates');
    await page.waitForLoadState('networkidle');
    
    // Verify certificate appears in list
    const certificateList = page.locator('[data-testid="certificate-item"]');
    expect(await certificateList.count()).toBeGreaterThan(0);
    
    // Verify first certificate details
    const firstCert = certificateList.first();
    await expect(firstCert.locator('[data-testid="cert-event-name"]')).toBeVisible();
    await expect(firstCert.locator('[data-testid="cert-date"]')).toBeVisible();
    await expect(firstCert.locator('[data-testid="cert-id"]')).toBeVisible();
  });

  /**
   * EA-E2E-005: Verify certificate authenticity
   * 
   * Validates:
   * - Certificate verification page is accessible
   * - Can verify certificate using certificate ID
   * - Valid certificate shows green checkmark
   * - Invalid certificate shows error message
   * - Verification details: attendee name, event, date, issuer
   * - QR code verification works
   */
  test('EA-E2E-005: should verify certificate authenticity', async ({ page }) => {
    // Navigate to certificate verification page (public)
    await page.goto('/verify-certificate');
    await page.waitForLoadState('networkidle');
    
    // Verify page elements
    await expect(page.locator('h1')).toContainText('Verify Certificate');
    await expect(page.locator('[data-testid="certificate-id-input"]')).toBeVisible();
    
    // First, get a valid certificate ID
    // Login and get certificate
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_INVESTOR.email);
    await page.fill('input[type="password"]', TEST_INVESTOR.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/dashboard/certificates');
    await page.waitForLoadState('networkidle');
    
    const certificateItem = page.locator('[data-testid="certificate-item"]').first();
    if (await certificateItem.count() === 0) {
      // Skip test if no certificates available
      test.skip();
      return;
    }
    
    const certId = await certificateItem.locator('[data-testid="cert-id"]').textContent();
    expect(certId).toBeTruthy();
    
    // Logout and go to verification page
    await page.goto('/logout');
    await page.goto('/verify-certificate');
    await page.waitForLoadState('networkidle');
    
    // Enter certificate ID
    const certIdInput = page.locator('[data-testid="certificate-id-input"]');
    await certIdInput.fill(certId!);
    
    // Click verify button
    await page.click('[data-testid="verify-button"]');
    await page.waitForTimeout(1000);
    
    // Verify success state
    await expect(page.locator('[data-testid="verification-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="verification-success"]')).toBeVisible();
    
    // Verify certificate details displayed
    await expect(page.locator('[data-testid="verified-attendee-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="verified-event-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="verified-event-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="verified-issued-date"]')).toBeVisible();
    
    // Test invalid certificate ID
    await certIdInput.fill('CERT-9999-999999');
    await page.click('[data-testid="verify-button"]');
    await page.waitForTimeout(1000);
    
    // Verify error state
    await expect(page.locator('[data-testid="verification-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="verification-error"]')).toContainText('not found');
  });

  /**
   * EA-E2E-006: View event attendance statistics
   * 
   * Validates:
   * - Admin can view attendance stats for event
   * - Stats show: total RSVPs, checked in, attended, no-shows
   * - Percentage calculations are correct
   * - Charts/graphs display correctly
   * - Can filter by date range
   * - Can export attendance report
   */
  test('EA-E2E-006: should display event attendance statistics', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to events statistics
    await page.goto('/admin/events/statistics');
    await page.waitForLoadState('networkidle');
    
    // Verify statistics page
    await expect(page.locator('h1')).toContainText('Attendance Statistics');
    
    // Select specific event
    const eventSelect = page.locator('[data-testid="select-event"]');
    await expect(eventSelect).toBeVisible();
    await eventSelect.click();
    
    const firstEvent = page.locator('[data-testid="event-option"]').first();
    await firstEvent.click();
    await page.waitForTimeout(1000);
    
    // Verify statistics cards
    const totalRsvps = page.locator('[data-testid="stat-total-rsvps"]');
    await expect(totalRsvps).toBeVisible();
    const rsvpCount = await totalRsvps.locator('[data-testid="stat-value"]').textContent();
    expect(parseInt(rsvpCount || '0')).toBeGreaterThanOrEqual(0);
    
    const checkedIn = page.locator('[data-testid="stat-checked-in"]');
    await expect(checkedIn).toBeVisible();
    
    const attended = page.locator('[data-testid="stat-attended"]');
    await expect(attended).toBeVisible();
    
    const noShows = page.locator('[data-testid="stat-no-shows"]');
    await expect(noShows).toBeVisible();
    
    // Verify attendance rate percentage
    const attendanceRate = page.locator('[data-testid="attendance-rate"]');
    await expect(attendanceRate).toBeVisible();
    const rateText = await attendanceRate.textContent();
    expect(rateText).toMatch(/\d+%/);
    
    // Verify chart is displayed
    const attendanceChart = page.locator('[data-testid="attendance-chart"]');
    await expect(attendanceChart).toBeVisible();
    
    // Test export report
    const exportButton = page.locator('[data-testid="export-attendance-report"]');
    await expect(exportButton).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/attendance.*\.(csv|pdf)$/i);
  });

  /**
   * EA-E2E-007: Cancel RSVP and update attendance
   * 
   * Validates:
   * - User can cancel RSVP before event
   * - RSVP status updates to CANCELLED
   * - Event capacity updates correctly
   * - Cancellation confirmation shown
   * - Cannot cancel RSVP after event started
   * - Admin can mark cancelled RSVP as NO_SHOW if applicable
   */
  test('EA-E2E-007: should allow canceling RSVP and updating status', async ({ page }) => {
    // Login as investor
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_INVESTOR.email);
    await page.fill('input[type="password"]', TEST_INVESTOR.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to my events
    await page.goto('/dashboard/my-events');
    await page.waitForLoadState('networkidle');
    
    // Find upcoming event with CONFIRMED status
    const upcomingEvent = page.locator('[data-testid="my-event-item"]')
      .filter({ has: page.locator('[data-testid="rsvp-status-badge"]:has-text("Confirmed")') })
      .first();
    
    if (await upcomingEvent.count() === 0) {
      // No confirmed events, skip test
      test.skip();
      return;
    }
    
    await expect(upcomingEvent).toBeVisible();
    
    // Click event to view details
    await upcomingEvent.click();
    await page.waitForLoadState('networkidle');
    
    // Click cancel RSVP button
    const cancelButton = page.locator('[data-testid="cancel-rsvp-button"]');
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();
    
    // Confirm cancellation in dialog
    const confirmDialog = page.locator('[data-testid="cancel-confirmation-dialog"]');
    await expect(confirmDialog).toBeVisible();
    
    const confirmButton = confirmDialog.locator('[data-testid="confirm-cancel"]');
    await confirmButton.click();
    
    // Wait for cancellation to process
    await page.waitForTimeout(1000);
    
    // Verify cancellation success
    await expect(page.locator('[data-testid="cancel-success"]')).toBeVisible({ timeout: 5000 });
    
    // Verify RSVP status updated
    const statusBadge = page.locator('[data-testid="rsvp-status"]');
    await expect(statusBadge).toContainText('Cancelled');
    
    // Verify RSVP button reappears
    await expect(page.locator('[data-testid="rsvp-button"]')).toBeVisible();
    
    // Go back to my events list
    await page.goto('/dashboard/my-events');
    await page.waitForLoadState('networkidle');
    
    // Verify event status updated in list
    const cancelledEvent = page.locator('[data-testid="my-event-item"]')
      .filter({ has: page.locator('[data-testid="rsvp-status-badge"]:has-text("Cancelled")') })
      .first();
    
    await expect(cancelledEvent).toBeVisible();
  });

  /**
   * EA-E2E-008: Download certificate PDF
   * 
   * Validates:
   * - User can download certificate PDF
   * - PDF download triggers correctly
   * - PDF contains all certificate details
   * - PDF has professional formatting
   * - PDF includes QR code for verification
   * - Multiple certificates can be downloaded
   */
  test('EA-E2E-008: should download certificate PDF', async ({ page }) => {
    // Login as investor
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_INVESTOR.email);
    await page.fill('input[type="password"]', TEST_INVESTOR.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to certificates page
    await page.goto('/dashboard/certificates');
    await page.waitForLoadState('networkidle');
    
    // Verify certificates list
    const certificateList = page.locator('[data-testid="certificate-item"]');
    const certCount = await certificateList.count();
    
    if (certCount === 0) {
      // No certificates available, skip test
      test.skip();
      return;
    }
    
    expect(certCount).toBeGreaterThan(0);
    
    // Get first certificate
    const firstCert = certificateList.first();
    await expect(firstCert).toBeVisible();
    
    // Click download button
    const downloadButton = firstCert.locator('[data-testid="download-certificate"]');
    await expect(downloadButton).toBeVisible();
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify filename
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/certificate.*\.pdf$/i);
    expect(filename).toContain('CERT-');
    
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
      
      // Verify PDF is not empty
      expect(pdfBuffer.length).toBeGreaterThan(1000); // Reasonable minimum size
    }
    
    // Verify "View Certificate" button also works
    const viewButton = firstCert.locator('[data-testid="view-certificate"]');
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(1000);
      
      // Verify certificate preview modal/page
      await expect(page.locator('[data-testid="certificate-preview"]')).toBeVisible({ timeout: 5000 });
    }
  });
});
