# Enhanced Payment & Platform Features - User Stories

## Product Owner: Detailed Numbered User Stories
**Date**: February 5, 2026  
**Epic**: Complete Angel Investment Platform with Communications & Reporting

---

## EPIC 1: Transaction Email Notifications & Invoicing

### US-NOTIFY-001: Email Notification on Payment Creation
**As an** investor  
**I want to** receive an email when I initiate a payment  
**So that** I have confirmation and can track my transaction

**Acceptance Criteria:**
- [ ] Email sent immediately after payment order creation
- [ ] Email contains: amount, currency, payment ID, order ID, date/time
- [ ] Email includes payment link if payment pending
- [ ] Email template is professional and branded
- [ ] Email is sent even if payment fails to create (with error message)
- [ ] Unsubscribe link included per CAN-SPAM compliance
- [ ] Email delivery logged in database

**Priority**: High  
**Estimated Effort**: 3 points

---

### US-NOTIFY-002: Email Notification on Payment Success
**As an** investor  
**I want to** receive an email when my payment is successful  
**So that** I have proof of payment

**Acceptance Criteria:**
- [ ] Email sent immediately after payment verification
- [ ] Email contains: payment confirmation, amount paid, transaction ID
- [ ] Email includes invoice as PDF attachment
- [ ] Invoice shows: investor details, deal/membership details, tax breakdown
- [ ] Email includes next steps (what happens after payment)
- [ ] Receipt number generated (sequential, unique)
- [ ] PDF invoice stored in database for future retrieval

**Priority**: High  
**Estimated Effort**: 5 points

---

### US-NOTIFY-003: Email Notification on Payment Failure
**As an** investor  
**I want to** receive an email if my payment fails  
**So that** I can retry or use alternative payment method

**Acceptance Criteria:**
- [ ] Email sent when payment verification fails
- [ ] Email explains reason for failure (if available from gateway)
- [ ] Email provides troubleshooting tips
- [ ] Email includes retry link
- [ ] Alternative payment methods suggested
- [ ] Support contact information provided

**Priority**: Medium  
**Estimated Effort**: 2 points

---

### US-NOTIFY-004: Email Notification on Refund Processing
**As an** investor  
**I want to** receive an email when a refund is processed  
**So that** I know when to expect funds back

**Acceptance Criteria:**
- [ ] Email sent when refund is initiated
- [ ] Email contains: refund amount, reason, expected timeline
- [ ] Email sent when refund is completed
- [ ] Email includes updated invoice showing refund
- [ ] Refund reference number included
- [ ] Timeline: 5-7 business days mentioned

**Priority**: High  
**Estimated Effort**: 3 points

---

### US-INVOICE-001: Generate PDF Invoice on Payment Success
**As an** investor  
**I want** a PDF invoice generated automatically  
**So that** I have documentation for tax purposes

**Acceptance Criteria:**
- [ ] PDF generated immediately after payment success
- [ ] Invoice includes: company logo, invoice number, date
- [ ] Buyer details: name, email, PAN, address
- [ ] Seller details: India Angel Forum details, GST number
- [ ] Line items: description, quantity, unit price, total
- [ ] Tax breakdown: CGST, SGST/IGST, TDS (if applicable)
- [ ] Payment method shown
- [ ] Total amount in words
- [ ] Digital signature/watermark
- [ ] Unique invoice number (format: INV-YYYY-MM-NNNNN)

**Priority**: High  
**Estimated Effort**: 5 points

---

### US-INVOICE-002: Download Invoice from Payment History
**As an** investor  
**I want to** download invoices from my payment history  
**So that** I can access them for accounting

**Acceptance Criteria:**
- [ ] Download button in payment history for completed payments
- [ ] PDF regenerated on-demand if not stored
- [ ] Invoice shows same data as original
- [ ] Download tracked in audit log
- [ ] Works for all historical payments
- [ ] Bulk download option for multiple invoices

**Priority**: Medium  
**Estimated Effort**: 3 points

---

## EPIC 2: Admin Refund & Reconciliation

### US-REFUND-001: Admin Initiates Full Refund
**As an** admin  
**I want to** initiate full refunds for any payment  
**So that** I can handle cancellations and disputes

**Acceptance Criteria:**
- [ ] Admin can view all payments with refund option
- [ ] Refund reason required (dropdown + free text)
- [ ] Confirmation dialog with warning
- [ ] Refund processes through original payment gateway
- [ ] Payment status updates to REFUNDED
- [ ] Email sent to user about refund
- [ ] Audit log entry created with admin ID
- [ ] Cannot refund already refunded payments

**Priority**: High  
**Estimated Effort**: 3 points

---

### US-REFUND-002: Admin Initiates Partial Refund
**As an** admin  
**I want to** issue partial refunds  
**So that** I can handle pro-rata cancellations

**Acceptance Criteria:**
- [ ] Admin specifies refund amount (must be ≤ original amount)
- [ ] Refund amount validated against payment amount
- [ ] Partial refund reason required
- [ ] Multiple partial refunds allowed (total ≤ original)
- [ ] Payment status shows PARTIALLY_REFUNDED
- [ ] Remaining balance shown
- [ ] Email notification sent
- [ ] Updated invoice generated showing partial refund

**Priority**: Medium  
**Estimated Effort**: 4 points

---

### US-RECONCILE-001: Daily Payment Reconciliation Report
**As an** admin  
**I want to** view daily reconciliation report  
**So that** I can verify all payments match gateway records

**Acceptance Criteria:**
- [ ] Report shows all payments for selected date range
- [ ] Grouped by: gateway, status, currency
- [ ] Totals: expected vs actual
- [ ] Discrepancies highlighted
- [ ] Export to CSV/Excel
- [ ] Includes: payment ID, gateway ID, amount, status, fees
- [ ] Shows unmatched webhooks
- [ ] Filter by gateway, status, date range

**Priority**: High  
**Estimated Effort**: 5 points

---

### US-RECONCILE-002: Auto-Reconciliation with Gateway
**As a** system  
**I want to** auto-reconcile payments with gateway APIs  
**So that** discrepancies are detected automatically

**Acceptance Criteria:**
- [ ] Cron job runs daily at configured time
- [ ] Fetches settlement reports from Razorpay API
- [ ] Fetches Stripe balance transactions
- [ ] Compares with local payment records
- [ ] Marks payments as RECONCILED or DISCREPANCY
- [ ] Sends alert email to admin if discrepancies found
- [ ] Logs all reconciliation attempts
- [ ] Manual re-reconciliation option

**Priority**: Medium  
**Estimated Effort**: 8 points

---

## EPIC 3: Financial Reports

### US-REPORT-001: Overall Financial Dashboard
**As an** admin  
**I want to** view overall financial dashboard  
**So that** I can monitor platform revenue

**Acceptance Criteria:**
- [ ] Total revenue (all time, YTD, MTD)
- [ ] Revenue by gateway
- [ ] Revenue by payment type (membership, deals, events)
- [ ] Success rate percentage
- [ ] Average transaction value
- [ ] Failed payment count and reasons
- [ ] Refund percentage
- [ ] Charts: revenue trend, gateway breakdown, type breakdown
- [ ] Real-time updates
- [ ] Export to PDF

**Priority**: High  
**Estimated Effort**: 8 points

---

### US-REPORT-002: User Financial Statement
**As an** investor/founder  
**I want to** view my complete financial statement  
**So that** I can track my investments

**Acceptance Criteria:**
- [ ] All payments listed with dates
- [ ] All refunds listed
- [ ] Net amount invested shown
- [ ] Breakdown by: membership fees, deal commitments, events
- [ ] Download as PDF statement
- [ ] Filter by date range
- [ ] Search by transaction ID
- [ ] Shows pending payments
- [ ] Shows failed payments with retry option

**Priority**: High  
**Estimated Effort**: 5 points

---

### US-REPORT-003: Admin User Financial Report
**As an** admin  
**I want to** view any user's financial report  
**So that** I can assist with queries

**Acceptance Criteria:**
- [ ] Search user by email/name
- [ ] View all user payments
- [ ] View all user refunds
- [ ] View user payment methods
- [ ] Export user statement to PDF/CSV
- [ ] Shows lifetime value
- [ ] Shows payment history timeline
- [ ] Can initiate refund from this view

**Priority**: Medium  
**Estimated Effort**: 4 points

---

### US-REPORT-004: Tax Report Generation
**As an** admin  
**I want to** generate tax reports  
**So that** I can file taxes correctly

**Acceptance Criteria:**
- [ ] TDS report: all users with TDS deducted
- [ ] GST report: CGST, SGST, IGST breakdown
- [ ] Form 26AS data export
- [ ] User-wise tax summary
- [ ] Quarter-wise breakdown
- [ ] Export in government-specified formats
- [ ] PAN-wise grouping
- [ ] NRI vs domestic investor breakdown

**Priority**: High  
**Estimated Effort**: 8 points

---

## EPIC 4: User Transaction & Event History

### US-HISTORY-001: View Complete Transaction History
**As a** user  
**I want to** view all my transactions  
**So that** I can track my financial activity

**Acceptance Criteria:**
- [ ] Paginated list of all payments
- [ ] Shows: date, amount, type, status, payment method
- [ ] Filter by: status, type, date range, gateway
- [ ] Search by transaction ID
- [ ] Sort by: date, amount
- [ ] Download invoice for each completed payment
- [ ] Retry option for failed payments
- [ ] Cancel option for pending payments
- [ ] Shows refunds separately

**Priority**: High  
**Estimated Effort**: 5 points

---

### US-HISTORY-002: View Event Attendance History
**As a** user  
**I want to** view all events I attended  
**So that** I can track my participation

**Acceptance Criteria:**
- [ ] List of all registered events
- [ ] Shows: event name, date, location, status
- [ ] Filter: upcoming, past, cancelled
- [ ] Shows registration status (confirmed, waitlisted, cancelled)
- [ ] Download event certificate (if applicable)
- [ ] Shows payment status for paid events
- [ ] Links to event materials/recordings
- [ ] Shows networking connections made at event

**Priority**: Medium  
**Estimated Effort**: 4 points

---

### US-HISTORY-003: Combined Activity Timeline
**As a** user  
**I want to** view timeline of all my activities  
**So that** I can see complete platform engagement

**Acceptance Criteria:**
- [ ] Timeline view: latest first
- [ ] Includes: payments, events, applications, messages
- [ ] Visual timeline with icons
- [ ] Filter by activity type
- [ ] Date range filter
- [ ] Export timeline to PDF
- [ ] Shows key milestones (first investment, total invested, etc.)
- [ ] Responsive design for mobile

**Priority**: Low  
**Estimated Effort**: 5 points

---

## EPIC 5: Investor-Founder Communication

### US-COMM-001: Send Message from Investor to Founder
**As an** investor  
**I want to** message founders of companies I'm interested in  
**So that** I can ask questions before investing

**Acceptance Criteria:**
- [ ] Message button on company profile
- [ ] Rich text editor for message
- [ ] File attachment support (max 10MB)
- [ ] Character limit: 5000
- [ ] Email notification to founder
- [ ] In-platform notification
- [ ] Message thread creation
- [ ] Cannot message if blocked by founder
- [ ] Message logged in database

**Priority**: High  
**Estimated Effort**: 5 points

---

### US-COMM-002: Reply to Messages
**As a** founder  
**I want to** reply to investor messages  
**So that** I can answer their questions

**Acceptance Criteria:**
- [ ] View all received messages
- [ ] Reply button on each message
- [ ] Thread view (conversation history)
- [ ] Mark as read/unread
- [ ] Archive message option
- [ ] Block user option (stops future messages)
- [ ] Email notification on new message
- [ ] Response time tracked (for analytics)

**Priority**: High  
**Estimated Effort**: 4 points

---

### US-COMM-003: Message Inbox with Filters
**As a** user  
**I want to** manage my messages efficiently  
**So that** I can stay organized

**Acceptance Criteria:**
- [ ] Inbox view with unread count
- [ ] Sent messages folder
- [ ] Archived messages folder
- [ ] Filter: unread, read, archived
- [ ] Search messages by keyword
- [ ] Sort by: date, sender
- [ ] Bulk actions: mark read, archive, delete
- [ ] Notification badge on unread
- [ ] Desktop notifications (optional)

**Priority**: Medium  
**Estimated Effort**: 5 points

---

### US-COMM-004: Communication Audit Log
**As an** admin  
**I want to** view all platform communications  
**So that** I can monitor for abuse

**Acceptance Criteria:**
- [ ] View all messages sent on platform
- [ ] Filter by user, date range
- [ ] Search by keyword
- [ ] Flag inappropriate content
- [ ] Delete messages if needed
- [ ] View reported messages
- [ ] Export communication logs
- [ ] Privacy: admin can only view if flagged/reported

**Priority**: Medium  
**Estimated Effort**: 4 points

---

### US-COMM-005: Video Call Integration
**As an** investor and founder  
**I want to** schedule video calls  
**So that** I can discuss investment opportunities

**Acceptance Criteria:**
- [ ] Schedule call button in message thread
- [ ] Calendar integration
- [ ] Generate meeting link (Zoom/Google Meet integration)
- [ ] Email reminder 24h and 1h before
- [ ] In-platform notification
- [ ] Call history logged
- [ ] Notes can be added after call
- [ ] Call recording option (with consent)

**Priority**: Low  
**Estimated Effort**: 8 points

---

## EPIC 6: Industry Sectors Expansion

### US-INDUSTRY-001: Comprehensive Industry Sectors List
**As a** founder  
**I want to** select from all Indian industry sectors  
**So that** my company is categorized correctly

**Acceptance Criteria:**
- [ ] All 20+ major sectors available
- [ ] Subcategories for each sector (100+ total)
- [ ] Based on NSE/BSE industry classification
- [ ] Includes: Technology, Healthcare, Fintech, Agriculture, Manufacturing, etc.
- [ ] Multi-select option (company can be in multiple sectors)
- [ ] Search/filter in dropdown
- [ ] Popular sectors shown first
- [ ] "Other" option with free text

**Priority**: High  
**Estimated Effort**: 3 points

---

### US-INDUSTRY-002: Seed Data as Single Source of Truth
**As a** developer  
**I want** all form options from seed data  
**So that** data is consistent across platform

**Acceptance Criteria:**
- [ ] Industries table in database
- [ ] FundingStages table in database
- [ ] EventTypes table in database
- [ ] InvestorTypes table in database
- [ ] All dropdowns query database
- [ ] Seed migration creates all options
- [ ] Admin can add/edit options
- [ ] Options versioned (historical data preserved)
- [ ] No hardcoded options in frontend

**Priority**: High  
**Estimated Effort**: 5 points

---

### US-INDUSTRY-003: Industry-based Filtering
**As an** investor  
**I want to** filter deals by industry  
**So that** I can find relevant opportunities

**Acceptance Criteria:**
- [ ] Multi-select industry filter on deals page
- [ ] Shows deal count per industry
- [ ] Works with other filters (stage, location, etc.)
- [ ] URL parameters for bookmarking filtered view
- [ ] Save filter preferences
- [ ] Clear all filters button
- [ ] Responsive filter panel

**Priority**: Medium  
**Estimated Effort**: 3 points

---

## EPIC 7: Seed Data Management

### US-SEED-001: Admin Manage Industries
**As an** admin  
**I want to** add/edit/disable industries  
**So that** I can keep options updated

**Acceptance Criteria:**
- [ ] Admin UI to manage industries
- [ ] Add new industry with name, description, icon
- [ ] Edit existing industry
- [ ] Disable industry (don't delete, preserve historical data)
- [ ] Reorder industries (for display priority)
- [ ] Bulk import from CSV
- [ ] Audit log of changes
- [ ] Cannot delete industry in use

**Priority**: Medium  
**Estimated Effort**: 5 points

---

### US-SEED-002: Admin Manage Funding Stages
**As an** admin  
**I want to** manage funding stage options  
**So that** they reflect market reality

**Acceptance Criteria:**
- [ ] CRUD for funding stages
- [ ] Stages: Pre-seed, Seed, Series A-F, Bridge, IPO
- [ ] Typical amount range for each stage
- [ ] Description for each stage
- [ ] Enable/disable stages
- [ ] Used in founder application form
- [ ] Used in deal filtering

**Priority**: Medium  
**Estimated Effort**: 3 points

---

## Quality Requirements (Cross-Cutting)

### US-QUALITY-001: Zero Errors and Warnings
**As a** developer  
**I want** zero TypeScript and lint errors  
**So that** code quality is maintained

**Acceptance Criteria:**
- [ ] `npm run lint` returns 0 errors
- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] ESLint warnings addressed or explicitly ignored with comments
- [ ] No console.log in production code
- [ ] All TODO comments have tickets
- [ ] Pre-commit hooks enforce quality

**Priority**: High  
**Estimated Effort**: Ongoing

---

### US-QUALITY-002: Responsive Design
**As a** user  
**I want** platform to work on all devices  
**So that** I can access from mobile/tablet

**Acceptance Criteria:**
- [ ] All pages work on mobile (320px+)
- [ ] All pages work on tablet (768px+)
- [ ] All pages work on desktop (1024px+)
- [ ] Touch-friendly buttons (44x44px minimum)
- [ ] No horizontal scrolling
- [ ] Readable font sizes (16px+ body)
- [ ] Tested on iOS Safari, Chrome, Firefox
- [ ] Images responsive (srcset/picture element)

**Priority**: High  
**Estimated Effort**: Ongoing

---

### US-QUALITY-003: OWASP Top 25 Security
**As a** security officer  
**I want** OWASP Top 25 compliance  
**So that** platform is secure

**Acceptance Criteria:**
- [ ] All 25 OWASP controls documented and implemented
- [ ] Security scan passes (npm audit, Snyk)
- [ ] Penetration testing completed
- [ ] Security headers configured (Helmet.js)
- [ ] Rate limiting on all endpoints
- [ ] Input validation everywhere
- [ ] XSS prevention
- [ ] CSRF tokens
- [ ] SQL injection prevention
- [ ] Authentication tested

**Priority**: High  
**Estimated Effort**: Ongoing

---

### US-QUALITY-004: WCAG 2.2 AA Compliance
**As a** user with disabilities  
**I want** accessible platform  
**So that** I can use all features

**Acceptance Criteria:**
- [ ] All interactive elements keyboard accessible
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Alt text on all images
- [ ] ARIA labels where needed
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Form labels properly associated
- [ ] Error messages accessible
- [ ] Screen reader tested
- [ ] Automated accessibility scan passes (axe)

**Priority**: High  
**Estimated Effort**: Ongoing

---

## Summary

**Total User Stories**: 35  
**Epics**: 7  
- Email Notifications & Invoicing: 6 stories
- Admin Refund & Reconciliation: 4 stories  
- Financial Reports: 4 stories
- User History: 3 stories
- Communications: 5 stories
- Industry Expansion: 3 stories
- Seed Data Management: 2 stories
- Quality Requirements: 4 stories (cross-cutting)

**Total Estimated Effort**: 140+ story points

**Implementation Order** (by priority):
1. **Phase 1 (Sprint 1)**: Email notifications, Invoice generation, Admin refunds
2. **Phase 2 (Sprint 2)**: Financial reports, User history, Industry expansion
3. **Phase 3 (Sprint 3)**: Communications platform, Seed data management
4. **Phase 4 (Sprint 4)**: Reconciliation automation, Advanced features
5. **Ongoing**: Quality, Security, Accessibility

**TDD Approach**: For each user story:
1. Write acceptance tests (RED)
2. Implement feature (GREEN)
3. Refactor code (REFACTOR)
4. Update documentation
5. Review and merge
