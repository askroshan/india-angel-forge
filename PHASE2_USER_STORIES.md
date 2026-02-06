# Phase 2 User Stories: Transaction History & User Experience

**Phase:** 2 of 5  
**Timeline:** Weeks 3-4  
**Status:** RED Phase - User Stories & Tests  
**Date:** February 5, 2026

---

## Overview

Phase 2 focuses on giving users visibility into their financial activity, event participation, and providing admin tools for financial reporting. Following TDD methodology, we start by writing detailed user stories and E2E tests before implementation.

---

## EPIC 4: Transaction & Activity History

### US-HISTORY-001: Enhanced Transaction History with Pagination & Filters

**As an** investor or founder  
**I want to** view my complete transaction history with advanced filtering  
**So that** I can track my financial activity on the platform

#### Acceptance Criteria

**Display & Pagination:**
- [ ] Transaction list shows: date, type, description, amount, status, gateway
- [ ] Paginated view (20 transactions per page)
- [ ] Infinite scroll OR load more button
- [ ] Total count displayed ("Showing 20 of 150")
- [ ] Sort by: date (default newest first), amount (high to low)
- [ ] Mobile responsive table/card view

**Filtering:**
- [ ] Filter by date range (last 7 days, 30 days, 3 months, 6 months, 1 year, custom)
- [ ] Filter by transaction type (membership, deal commitment, event registration, refund)
- [ ] Filter by status (completed, pending, failed, refunded, partially refunded)
- [ ] Filter by payment gateway (Razorpay, Stripe, PayU, etc.)
- [ ] Filter by amount range (min-max)
- [ ] Multiple filters can be applied simultaneously
- [ ] Clear all filters button
- [ ] Filter state persists in URL query params

**Search:**
- [ ] Search by transaction ID (exact match)
- [ ] Search by description (fuzzy search)
- [ ] Search results highlighted
- [ ] No results message with suggestions

**Transaction Details:**
- [ ] Click transaction to expand detailed view
- [ ] Shows: full transaction ID, gateway order ID, gateway payment ID, timestamp, fee breakdown
- [ ] Tax details (CGST, SGST, IGST, TDS) if applicable
- [ ] Refund history if refunded
- [ ] Related documents (invoice, receipt)
- [ ] Copy transaction ID button

**Export:**
- [ ] Export filtered results to CSV
- [ ] Export filtered results to PDF
- [ ] Export includes all filtered transactions (not just current page)
- [ ] PDF formatted as financial statement
- [ ] CSV includes all transaction fields

**Performance:**
- [ ] Initial load < 2 seconds
- [ ] Filter application < 500ms
- [ ] Pagination/infinite scroll < 500ms
- [ ] Database query uses indexes for performance

**Security:**
- [ ] Users can only view their own transactions
- [ ] Admin can view all transactions with user filter
- [ ] Sensitive data (full card numbers) never displayed
- [ ] API endpoints require authentication

#### Technical Notes

**Database:**
- Query `Payment` table with userId filter
- Include relations: user, invoice, refunds
- Use cursor-based pagination for infinite scroll
- Add indexes on: userId, createdAt, status, type

**API Endpoints:**
```
GET /api/payments/history?userId=xxx&page=1&limit=20&status=COMPLETED&type=MEMBERSHIP&dateFrom=xxx&dateTo=xxx&gateway=RAZORPAY&sortBy=createdAt&sortOrder=desc

Response: {
  transactions: Payment[],
  total: number,
  page: number,
  limit: number,
  hasMore: boolean
}
```

**Frontend:**
- React Query for caching and pagination
- Debounce filter inputs (300ms)
- Optimistic UI updates
- Error boundaries for graceful failures

#### E2E Tests (10 tests)

1. **TC-HISTORY-001**: Display transaction list with pagination
   - Create 25 test payments for user
   - Verify first 20 displayed
   - Verify pagination controls present
   - Verify total count displayed

2. **TC-HISTORY-002**: Filter by date range (last 30 days)
   - Create payments with various dates
   - Apply "last 30 days" filter
   - Verify only last 30 days shown
   - Verify count updated

3. **TC-HISTORY-003**: Filter by transaction type (DEAL_COMMITMENT)
   - Create multiple payment types
   - Apply type filter
   - Verify only filtered type shown
   - Verify other types hidden

4. **TC-HISTORY-004**: Filter by status (COMPLETED)
   - Create payments with various statuses
   - Apply status filter
   - Verify only completed shown

5. **TC-HISTORY-005**: Multiple filters simultaneously
   - Apply type, status, and date filters together
   - Verify all filters applied (AND logic)
   - Clear filters button resets all

6. **TC-HISTORY-006**: Search by transaction ID
   - Search for specific transaction ID
   - Verify exact match displayed
   - Verify other transactions hidden

7. **TC-HISTORY-007**: Sort by amount (high to low)
   - Create payments with various amounts
   - Apply sort
   - Verify descending order

8. **TC-HISTORY-008**: Expand transaction details
   - Click transaction row
   - Verify detailed view shown
   - Verify all fields present (gateway IDs, timestamps, tax)

9. **TC-HISTORY-009**: Export to CSV
   - Apply filters
   - Click export CSV
   - Verify CSV downloaded
   - Verify CSV contains filtered data only

10. **TC-HISTORY-010**: Export to PDF
    - Apply filters
    - Click export PDF
    - Verify PDF downloaded
    - Verify PDF formatted as statement

**Priority**: High  
**Estimated Effort**: 8 points  
**Dependencies**: Phase 1 Payment models

---

### US-HISTORY-002: Event Attendance Tracking with Certificates

**As an** investor or founder  
**I want to** view my event attendance history and download certificates  
**So that** I can track my participation and showcase my engagement

#### Acceptance Criteria

**Event Attendance List:**
- [ ] List shows: event name, date, location/virtual, RSVP status, attendance status
- [ ] Grouped by: upcoming, past attended, past missed
- [ ] Shows event thumbnail/image
- [ ] Shows attendee count
- [ ] Filter by: event type, date range, attendance status
- [ ] Search by event name
- [ ] Sort by: date, name

**RSVP Management:**
- [ ] View RSVP status (CONFIRMED, WAITLIST, CANCELLED)
- [ ] Cancel RSVP button (if cancellation allowed)
- [ ] Add to calendar button (Google, Outlook, iCal)
- [ ] Receive reminders (24h before, 1h before)

**Attendance Tracking:**
- [ ] Check-in tracked automatically for virtual events (join Zoom/Meet)
- [ ] QR code check-in for physical events
- [ ] Manual check-in by admin
- [ ] Check-out time recorded
- [ ] Duration attended calculated
- [ ] Partial attendance tracked (joined late/left early)

**Certificate Generation:**
- [ ] Certificate auto-generated after event completion
- [ ] Certificate includes: attendee name, event name, date, organizer signature
- [ ] PDF format with professional design
- [ ] Unique certificate ID for verification
- [ ] Download button in event history
- [ ] Share on LinkedIn option
- [ ] Certificate shows attendance duration

**Verification:**
- [ ] Public certificate verification page
- [ ] Enter certificate ID to verify authenticity
- [ ] Shows: event name, attendee name (if public), date, verification status
- [ ] QR code on certificate links to verification page

**Statistics:**
- [ ] Total events attended (all time, this year, this month)
- [ ] Total attendance hours
- [ ] Event types attended (breakdown)
- [ ] Attendance rate (attended vs RSVP'd)
- [ ] Networking stats (connections made at events)

**Notifications:**
- [ ] Email with certificate after event
- [ ] RSVP confirmation email
- [ ] Event reminder emails
- [ ] Certificate ready notification

#### Technical Notes

**Database Schema:**
```prisma
model EventAttendance {
  id            String   @id @default(cuid())
  userId        String
  eventId       String
  rsvpStatus    RsvpStatus  // CONFIRMED, WAITLIST, CANCELLED, NO_SHOW
  attendanceStatus AttendanceStatus  // ATTENDED, PARTIAL, ABSENT
  checkInTime   DateTime?
  checkOutTime  DateTime?
  certificateId String?   @unique
  certificateUrl String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          User     @relation(fields: [userId], references: [id])
  event         Event    @relation(fields: [eventId], references: [id])
}

model Certificate {
  id            String   @id @default(cuid())
  certificateId String   @unique  // Readable ID like CERT-2026-001234
  userId        String
  eventId       String
  attendeeNam   String
  eventName     String
  eventDate     DateTime
  duration      Int      // minutes attended
  issuedAt      DateTime @default(now())
  pdfUrl        String
  verificationUrl String
  
  user          User     @relation(fields: [userId], references: [id])
  event         Event    @relation(fields: [eventId], references: [id])
}

enum RsvpStatus {
  CONFIRMED
  WAITLIST
  CANCELLED
  NO_SHOW
}

enum AttendanceStatus {
  ATTENDED
  PARTIAL
  ABSENT
}
```

**API Endpoints:**
```
GET /api/events/attendance?userId=xxx&filter=upcoming|past|attended
GET /api/events/attendance/:attendanceId
POST /api/events/:eventId/rsvp
DELETE /api/events/:eventId/rsvp
POST /api/events/:eventId/checkin
POST /api/events/:eventId/checkout
GET /api/certificates/:certificateId/download
GET /api/certificates/verify/:certificateId
```

**Certificate Generation:**
- Use pdfkit (reuse from invoice service)
- Template with event branding
- Include QR code linking to verification
- Store in /certificates directory
- Async generation via queue (like invoices)

#### E2E Tests (8 tests)

1. **TC-EVENT-001**: Display event attendance list
   - Create test events with attendance records
   - Verify grouped by upcoming/past
   - Verify all details displayed

2. **TC-EVENT-002**: Filter by event type
   - Create various event types
   - Apply filter
   - Verify filtered results

3. **TC-EVENT-003**: RSVP to event
   - Navigate to event
   - Click RSVP
   - Verify status updated to CONFIRMED
   - Verify email sent

4. **TC-EVENT-004**: Cancel RSVP
   - RSVP to event
   - Click cancel
   - Verify status updated to CANCELLED
   - Verify can re-RSVP

5. **TC-EVENT-005**: Check-in to event
   - Admin marks attendance
   - Verify attendance status updated
   - Verify check-in time recorded

6. **TC-EVENT-006**: Generate certificate after event
   - Complete event attendance
   - Trigger certificate generation
   - Verify certificate PDF created
   - Verify download link works

7. **TC-EVENT-007**: Download certificate
   - Navigate to past attended event
   - Click download certificate
   - Verify PDF downloaded
   - Verify contains correct data

8. **TC-EVENT-008**: Verify certificate authenticity
   - Navigate to verification page
   - Enter certificate ID
   - Verify details displayed
   - Test with invalid ID shows error

**Priority**: High  
**Estimated Effort**: 8 points  
**Dependencies**: Event models, Certificate generation service

---

### US-REPORT-002: User Financial Statement with PDF Export

**As an** investor or founder  
**I want to** generate and download my financial statement  
**So that** I can provide it to my accountant or for tax purposes

#### Acceptance Criteria

**Statement Overview:**
- [ ] Summary section: total invested, total refunded, net investment
- [ ] Breakdown by: membership fees, deal commitments, event fees
- [ ] Tax summary: total CGST, SGST, IGST, TDS deducted
- [ ] Period selector: current year, last year, custom date range, all time
- [ ] Account holder info: name, email, PAN (if provided), address

**Transaction Details:**
- [ ] All transactions listed chronologically
- [ ] Each transaction shows: date, description, invoice number, amount, tax, total
- [ ] Refunds shown with negative amounts
- [ ] Pending payments shown separately
- [ ] Failed payments excluded by default (option to include)

**PDF Export:**
- [ ] Professional statement format
- [ ] Company letterhead/branding
- [ ] Statement number and generation date
- [ ] Digital signature/watermark
- [ ] Page numbers (Page X of Y)
- [ ] Footer with terms and company details
- [ ] Table of contents for multi-page statements
- [ ] Password protection option

**Format Options:**
- [ ] Detailed (all transactions) vs Summary (totals only)
- [ ] Include/exclude tax breakdown
- [ ] Include/exclude pending payments
- [ ] Include/exclude failed payments
- [ ] Language: English (default), Hindi

**Email Statement:**
- [ ] Option to email PDF to self
- [ ] Option to email to accountant (additional email)
- [ ] Email includes statement as attachment
- [ ] Email body has summary

**Statement History:**
- [ ] Previously generated statements saved
- [ ] Re-download past statements
- [ ] Statement generation logged in activity
- [ ] Statements retained for 7 years (compliance)

**Real-time vs Historical:**
- [ ] Real-time: generates on-demand with latest data
- [ ] Historical: retrieves previously generated statement for same period
- [ ] Indicator if data has changed since last generation

#### Technical Notes

**Statement Service:**
```typescript
class FinancialStatementService {
  async generateStatement(userId, options: {
    dateFrom?: Date,
    dateTo?: Date,
    format: 'detailed' | 'summary',
    includeTax: boolean,
    includePending: boolean,
    includeFailed: boolean
  }): Promise<{ id, statementNumber, pdfUrl }>
  
  async emailStatement(statementId, recipientEmails: string[]): Promise<void>
  
  async getStatementHistory(userId): Promise<Statement[]>
}
```

**Database:**
```prisma
model FinancialStatement {
  id                String   @id @default(cuid())
  statementNumber   String   @unique  // FS-YYYY-MM-NNNNN
  userId            String
  dateFrom          DateTime
  dateTo            DateTime
  totalInvested     Decimal
  totalRefunded     Decimal
  netInvestment     Decimal
  totalTax          Decimal
  format            String   // detailed | summary
  pdfUrl            String
  generatedAt       DateTime @default(now())
  emailedTo         String[] // Array of emails sent to
  
  user              User     @relation(fields: [userId], references: [id])
}
```

**API Endpoints:**
```
POST /api/statements/generate
  Body: { dateFrom, dateTo, format, includeTax, includePending, includeFailed }
  
GET /api/statements/history?userId=xxx

GET /api/statements/:statementId/download

POST /api/statements/:statementId/email
  Body: { recipientEmails: string[] }
```

#### E2E Tests (8 tests)

1. **TC-STATEMENT-001**: Generate detailed statement for current year
   - Select current year
   - Select detailed format
   - Click generate
   - Verify PDF created
   - Verify summary values correct

2. **TC-STATEMENT-002**: Generate summary statement
   - Select summary format
   - Verify only totals shown (no transaction details)
   - Verify faster generation

3. **TC-STATEMENT-003**: Custom date range
   - Select custom dates
   - Verify only transactions in range included
   - Verify totals correct for range

4. **TC-STATEMENT-004**: Include/exclude tax breakdown
   - Generate with tax
   - Verify CGST/SGST/IGST shown
   - Generate without tax
   - Verify tax section hidden

5. **TC-STATEMENT-005**: Include pending payments
   - Have pending payment in date range
   - Generate with includePending=true
   - Verify pending shown separately
   - Generate with false, verify excluded

6. **TC-STATEMENT-006**: Download statement PDF
   - Generate statement
   - Click download
   - Verify PDF contains all sections
   - Verify formatting correct

7. **TC-STATEMENT-007**: Email statement to self
   - Generate statement
   - Click email
   - Enter email address
   - Verify email received with PDF attachment

8. **TC-STATEMENT-008**: View statement history
   - Generate multiple statements
   - Navigate to history
   - Verify all listed with dates/ranges
   - Re-download past statement

**Priority**: High  
**Estimated Effort**: 6 points  
**Dependencies**: Phase 1 Invoice service, Transaction history

---

### US-HISTORY-003: Combined Activity Timeline with Filtering

**As a** platform user  
**I want to** view all my activity in one unified timeline  
**So that** I can see my complete engagement history

#### Acceptance Criteria

**Timeline Display:**
- [ ] Chronological feed of all activities (newest first)
- [ ] Activity types: payments, refunds, events, messages, documents, profile changes
- [ ] Each item shows: icon, title, description, timestamp (relative and absolute)
- [ ] Grouped by date (Today, Yesterday, Last 7 days, Last 30 days, Older)
- [ ] Infinite scroll OR load more

**Activity Types:**
- [ ] Payments: "Paid ₹X for [description]" with amount, status, receipt
- [ ] Refunds: "Refund of ₹X processed" with details
- [ ] Events: "RSVP'd to [event]", "Attended [event]", "Certificate earned"
- [ ] Messages: "Sent message to [user]", "Received message from [user]"
- [ ] Documents: "Uploaded [document]", "Document shared"
- [ ] Profile: "Updated profile", "Completed KYC"
- [ ] Deals: "Committed ₹X to [deal]", "Deal closed"
- [ ] Applications: "Submitted application", "Application approved"

**Filtering:**
- [ ] Filter by activity type (multi-select)
- [ ] Filter by date range
- [ ] Search by keywords
- [ ] Show only important activities (payments, events)
- [ ] Clear filters button

**Activity Details:**
- [ ] Click activity to see full details
- [ ] Quick actions: view receipt, download certificate, reply to message
- [ ] Related items linked (payment → invoice → refund chain)

**Export:**
- [ ] Export activity log as CSV
- [ ] Export includes all filtered activities
- [ ] Admin can export for audit purposes

**Privacy:**
- [ ] User sees only their own activities
- [ ] Admin sees all with user filter
- [ ] Sensitive data redacted in logs

#### Technical Notes

**Leverage existing ActivityLog model:**
```prisma
// Already exists from Phase 1
model ActivityLog {
  id            String   @id @default(cuid())
  userId        String
  activityType  ActivityType
  entityType    String
  entityId      String
  description   String
  metadata      Json?
  createdAt     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id])
}
```

**API Endpoints:**
```
GET /api/activity?userId=xxx&types[]=PAYMENT&types[]=EVENT&dateFrom=xxx&dateTo=xxx&search=xxx&limit=50&cursor=xxx

Response: {
  activities: ActivityLog[],
  nextCursor: string | null,
  hasMore: boolean
}
```

**Frontend:**
- Use React Query with infinite query
- Virtualized list for performance (react-virtual)
- Activity type icons and colors
- Timestamp formatting (relative: "2 hours ago")

#### E2E Tests (6 tests)

1. **TC-TIMELINE-001**: Display activity timeline
   - Create activities of various types
   - Verify chronological order
   - Verify grouped by date
   - Verify relative timestamps

2. **TC-TIMELINE-002**: Filter by activity type (payments only)
   - Apply activity type filter
   - Verify only payment activities shown
   - Verify other types hidden

3. **TC-TIMELINE-003**: Filter by date range
   - Apply date filter (last 7 days)
   - Verify only recent activities shown

4. **TC-TIMELINE-004**: Search by keyword
   - Search "membership"
   - Verify matching activities shown
   - Verify non-matching hidden

5. **TC-TIMELINE-005**: Expand activity details
   - Click activity
   - Verify details panel opens
   - Verify all metadata shown
   - Verify quick actions present

6. **TC-TIMELINE-006**: Infinite scroll loading
   - Create 100+ activities
   - Scroll to bottom
   - Verify more activities loaded
   - Verify smooth scrolling

**Priority**: Medium  
**Estimated Effort**: 5 points  
**Dependencies**: ActivityLog model (Phase 1), all other features generate logs

---

## Success Criteria

Phase 2 is complete when:
- [ ] All 4 user stories implemented with acceptance criteria met
- [ ] All 32 E2E tests written and passing (10 + 8 + 8 + 6)
- [ ] Database schema updated and migrated
- [ ] API endpoints documented and tested
- [ ] Frontend components responsive and accessible
- [ ] Performance targets met (< 2s initial load, < 500ms interactions)
- [ ] Code coverage > 70%
- [ ] Documentation complete
- [ ] Code reviewed and refactored

## Timeline

- **Week 3 Days 1-2**: RED Phase (this document + E2E tests)
- **Week 3 Days 3-5**: GREEN Phase (US-HISTORY-001 implementation)
- **Week 4 Days 1-2**: GREEN Phase (US-HISTORY-002 + US-REPORT-002)
- **Week 4 Day 3**: GREEN Phase (US-HISTORY-003)
- **Week 4 Days 4-5**: REFACTOR Phase + documentation

## Next Steps

1. Review and approve these user stories
2. Write E2E tests for all stories (RED phase)
3. Update database schema with new models
4. Begin GREEN phase implementation

---

**Status**: 🔴 RED Phase - Ready for test writing  
**Author**: GitHub Copilot  
**Date**: February 5, 2026
