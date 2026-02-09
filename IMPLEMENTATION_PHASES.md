# Implementation Phases - Enhanced Platform Features

**Date**: February 5, 2026  
**Methodology**: Strict TDD (Red-Green-Refactor)  
**Quality**: Zero errors, OWASP Top 25, WCAG 2.2 AA

---

## Overview

**Total User Stories**: 35  
**Total Estimated Effort**: 140+ story points  
**Timeline**: 5 phases over 12 weeks (2 weeks per phase + 2-week buffer)  
**Current State**: Payment system complete, basic platform functional

---

## PHASE 1: Foundation & Critical Infrastructure (Weeks 1-2)
**Focus**: Email system, PDF invoicing, seed data single source of truth  
**Stories**: 8 | **Effort**: 28 points | **Priority**: CRITICAL

### Database Changes
```prisma
model Industry {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  icon        String?
  displayOrder Int     @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  companies   Company[]
  deals       Deal[]
  applications FounderApplication[]
}

model FundingStage {
  id           String   @id @default(cuid())
  name         String   @unique
  code         String   @unique // "pre-seed", "seed", "series-a"
  description  String?
  typicalMin   Int?     // Minimum typical amount in INR
  typicalMax   Int?     // Maximum typical amount in INR
  displayOrder Int      @default(0)
  isActive     Boolean  @default(true)
  
  companies    Company[]
  deals        Deal[]
  applications FounderApplication[]
}

model EventType {
  id          String  @id @default(cuid())
  name        String  @unique
  description String?
  isActive    Boolean @default(true)
  
  events Event[]
}

model EmailTemplate {
  id          String   @id @default(cuid())
  name        String   @unique // "payment-success", "payment-failed"
  subject     String
  htmlBody    String   @db.Text
  textBody    String?  @db.Text
  variables   Json?    // List of {{variable}} names
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model EmailLog {
  id          String   @id @default(cuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  to          String
  subject     String
  templateName String?
  status      EmailStatus
  provider    String   // "emailit"
  providerId  String?  // External message ID
  error       String?
  sentAt      DateTime @default(now())
  openedAt    DateTime?
  clickedAt   DateTime?
}

enum EmailStatus {
  PENDING
  SENT
  DELIVERED
  OPENED
  CLICKED
  FAILED
  BOUNCED
}

model Invoice {
  id              String   @id @default(cuid())
  invoiceNumber   String   @unique // INV-2026-02-00001
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  paymentId       String   @unique
  payment         Payment  @relation(fields: [paymentId], references: [id])
  
  // Invoice details
  issueDate       DateTime @default(now())
  dueDate         DateTime?
  
  // Buyer details
  buyerName       String
  buyerEmail      String
  buyerPhone      String?
  buyerPAN        String?
  buyerAddress    String?
  
  // Seller details (India Angel Forum)
  sellerName      String   @default("India Angel Forum")
  sellerGST       String?
  sellerPAN       String?
  sellerAddress   String?
  
  // Line items
  lineItems       Json     // [{description, quantity, unitPrice, amount}]
  
  // Amounts
  subtotal        Int      // Amount in paise
  cgst            Int      @default(0)
  sgst            Int      @default(0)
  igst            Int      @default(0)
  tds             Int      @default(0)
  totalAmount     Int      // Final amount
  
  // PDF
  pdfPath         String?  // S3/local path to generated PDF
  pdfGeneratedAt  DateTime?
  
  // Status
  status          InvoiceStatus @default(DRAFT)
  notes           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum InvoiceStatus {
  DRAFT
  ISSUED
  PAID
  CANCELLED
  REFUNDED
}
```

### Implementation Tasks

#### 1.1 Email Service Setup (US-NOTIFY-001, 002, 003, 004)
- [ ] **TDD RED**: Write E2E tests for email sending on payment events
- [ ] **TDD GREEN**: Implement EmailIt integration service
  - Install: `npm install emailit-sdk` (or HTTP client)
  - Create `server/services/email.service.ts`
  - Methods: sendEmail(), sendTemplate(), getStatus()
- [ ] **TDD GREEN**: Create email templates (Handlebars/EJS)
  - `templates/emails/payment-success.html`
  - `templates/emails/payment-failed.html`
  - `templates/emails/refund-processed.html`
  - `templates/emails/invoice-generated.html`
- [ ] **TDD GREEN**: Add email hooks to payment endpoints
  - After order creation → send confirmation
  - After verification success → send success + invoice
  - After verification failure → send failure email
  - After refund → send refund notification
- [ ] **TDD REFACTOR**: Extract email service, add retry logic, queue system
- [ ] **QUALITY**: Add EmailLog audit trail, test deliverability

**Tests**: 15 E2E tests (email sending, template rendering, failure handling)

#### 1.2 PDF Invoice Generation (US-INVOICE-001, 002)
- [ ] **TDD RED**: Write tests for invoice PDF generation
- [ ] **TDD GREEN**: Install dependencies
  - `npm install pdfkit @types/pdfkit`
- [ ] **TDD GREEN**: Create `server/services/invoice.service.ts`
  - Methods: generateInvoice(), getInvoice(), regenerateInvoice()
  - PDF layout: Header, buyer/seller, line items, tax breakdown, footer
  - Generate unique invoice numbers (INV-YYYY-MM-NNNNN)
- [ ] **TDD GREEN**: Add invoice generation to payment success flow
  - Create Invoice record in database
  - Generate PDF file
  - Store in `/invoices/` directory or S3
  - Attach PDF to success email
- [ ] **TDD GREEN**: Add invoice download endpoint
  - `GET /api/invoices/:id/download`
  - `GET /api/invoices/:paymentId`
- [ ] **TDD REFACTOR**: Optimize PDF generation, add caching
- [ ] **QUALITY**: Test PDF rendering, validate tax calculations

**Tests**: 12 E2E tests (PDF generation, download, tax calculations, invoice numbers)

#### 1.3 Seed Data Single Source of Truth (US-INDUSTRY-001, 002, US-SEED-001, 002)
- [ ] **TDD RED**: Write tests for reference data endpoints
- [ ] **TDD GREEN**: Create migration for reference tables
  - Industry (50 startup sectors)
  - FundingStage (Pre-seed to Series F)
  - EventType (Networking, Workshop, Pitch, etc.)
- [ ] **TDD GREEN**: Create seed data in `prisma/seed/index.ts`
  - Import 50 Indian startup industries from NSE/BSE
  - Sectors: AI, Fintech, Healthcare, Agritech, Edtech, etc.
  - Create 8-10 funding stages with typical ranges
  - Create 5-7 event types
- [ ] **TDD GREEN**: Create reference data API endpoints
  - `GET /api/reference/industries` (public, cached)
  - `GET /api/reference/funding-stages` (public, cached)
  - `GET /api/reference/event-types` (public, cached)
  - `POST /api/admin/reference/industries` (admin only)
  - `PUT /api/admin/reference/industries/:id` (admin only)
- [ ] **TDD GREEN**: Replace hardcoded dropdowns
  - Update `FounderApplicationForm.tsx` - fetch industries
  - Update `InvestorApplicationForm.tsx` - fetch industries
  - Update `Portfolio.tsx` - fetch industries
  - Update all forms with funding stage dropdowns
- [ ] **TDD REFACTOR**: Add React Query caching, optimize API calls
- [ ] **QUALITY**: Ensure all dropdowns use seed data, no hardcoding

**Tests**: 18 E2E tests (CRUD reference data, dropdown population, caching)

### Deliverables
- ✅ Email service fully integrated (EmailIt)
- ✅ 4 email templates created and tested
- ✅ PDF invoice generation working
- ✅ Invoice download endpoint functional
- ✅ 3 reference data tables seeded
- ✅ All dropdowns using database seed data
- ✅ Admin UI to manage reference data
- ✅ 45 E2E tests passing
- ✅ Zero TypeScript/ESLint errors
- ✅ Documentation updated

---

## PHASE 2: User Experience & History (Weeks 3-4)
**Focus**: Transaction history, event attendance, user statements  
**Stories**: 6 | **Effort**: 22 points | **Priority**: HIGH

### Database Changes
```prisma
model ActivityLog {
  id          String       @id @default(cuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id])
  activityType ActivityType
  entityType  String       // "Payment", "Event", "Application", "Deal"
  entityId    String
  description String
  metadata    Json?
  createdAt   DateTime     @default(now())
  
  @@index([userId, createdAt])
  @@index([activityType, createdAt])
}

enum ActivityType {
  PAYMENT_CREATED
  PAYMENT_COMPLETED
  PAYMENT_FAILED
  PAYMENT_REFUNDED
  EVENT_REGISTERED
  EVENT_ATTENDED
  EVENT_CANCELLED
  APPLICATION_SUBMITTED
  APPLICATION_APPROVED
  APPLICATION_REJECTED
  DEAL_INTEREST_EXPRESSED
  DEAL_COMMITTED
  MESSAGE_SENT
  MESSAGE_RECEIVED
  DOCUMENT_UPLOADED
  DOCUMENT_SHARED
}
```

### Implementation Tasks

#### 2.1 Enhanced Transaction History (US-HISTORY-001)
- [ ] **TDD RED**: Write tests for paginated transaction history with filters
- [ ] **TDD GREEN**: Enhance payment history endpoint
  - Add pagination (limit/offset or cursor-based)
  - Add filters: status, type, date range, gateway, amount range
  - Add sorting: date, amount
  - Add search by transaction ID, gateway ID
- [ ] **TDD GREEN**: Create `src/pages/TransactionHistory.tsx`
  - Table with all payment columns
  - Filter sidebar with all options
  - Export to CSV button
  - Download invoice button per row
  - Retry payment button for failed
  - Cancel pending button
- [ ] **TDD GREEN**: Add activity logging for payments
  - Log payment creation, completion, failure, refund
  - Store in ActivityLog table
- [ ] **TDD REFACTOR**: Optimize queries with indexes, add caching
- [ ] **QUALITY**: Responsive design, mobile-friendly filters

**Tests**: 10 E2E tests (pagination, filters, sorting, search, actions)

#### 2.2 Event Attendance History (US-HISTORY-002)
- [ ] **TDD RED**: Write tests for event history
- [ ] **TDD GREEN**: Create event history endpoint
  - `GET /api/events/my-history`
  - Returns: upcoming, past, cancelled events
  - Include: registration status, payment status, attendance
- [ ] **TDD GREEN**: Add attendance tracking to Event model
  - New field: `attendees: User[]` (many-to-many)
  - Admin marks attendance manually or QR code scan
- [ ] **TDD GREEN**: Create `src/pages/EventHistory.tsx`
  - Tabs: Upcoming, Past, Cancelled
  - Shows event cards with details
  - Download certificate button (if attended)
  - View event materials link
  - Shows payment status for paid events
- [ ] **TDD GREEN**: Event certificate generation
  - PDF certificate with user name, event name, date
  - Endpoint: `GET /api/events/:id/certificate`
- [ ] **TDD REFACTOR**: Reuse event card component
- [ ] **QUALITY**: Add calendar integration (ICS download)

**Tests**: 8 E2E tests (event history, filtering, certificates)

#### 2.3 User Financial Statement (US-REPORT-002)
- [ ] **TDD RED**: Write tests for financial statement generation
- [ ] **TDD GREEN**: Create financial statement endpoint
  - `GET /api/statements/financial`
  - Query params: startDate, endDate
  - Returns: all payments, refunds, net amount, breakdown by type
- [ ] **TDD GREEN**: Create `src/pages/FinancialStatement.tsx`
  - Date range picker
  - Summary cards: Total paid, Total refunded, Net amount
  - Breakdown charts: By type, By month, By gateway
  - Detailed transaction list
  - Export to PDF button
- [ ] **TDD GREEN**: PDF statement generation
  - Similar to invoice but comprehensive
  - Shows all transactions in date range
  - Includes charts/graphs
- [ ] **TDD REFACTOR**: Reuse invoice PDF utilities
- [ ] **QUALITY**: Tax-friendly format, annual statement option

**Tests**: 8 E2E tests (statement generation, PDF export, date ranges)

#### 2.4 Combined Activity Timeline (US-HISTORY-003)
- [ ] **TDD RED**: Write tests for activity timeline
- [ ] **TDD GREEN**: Create activity logging middleware
  - Log all major user actions to ActivityLog
  - Hook into: payments, events, applications, deals, messages
- [ ] **TDD GREEN**: Create activity timeline endpoint
  - `GET /api/activity/timeline`
  - Pagination support
  - Filter by activity type
  - Date range filter
- [ ] **TDD GREEN**: Create `src/pages/ActivityTimeline.tsx`
  - Vertical timeline with icons
  - Filter sidebar
  - Infinite scroll or pagination
  - Shows milestone badges
- [ ] **TDD REFACTOR**: Optimize timeline queries
- [ ] **QUALITY**: Real-time updates with polling

**Tests**: 6 E2E tests (timeline display, filtering, pagination)

### Deliverables
- ✅ Enhanced payment history with filters and search
- ✅ Event attendance tracking and history
- ✅ Event certificate generation
- ✅ User financial statement with PDF export
- ✅ Activity timeline view
- ✅ Activity logging throughout platform
- ✅ 32 E2E tests passing
- ✅ Mobile-responsive designs
- ✅ Zero errors/warnings

---

## PHASE 3: Admin Financial Controls (Weeks 5-6)
**Focus**: Partial refunds, reconciliation, financial reports  
**Stories**: 8 | **Effort**: 29 points | **Priority**: HIGH

### Database Changes
```prisma
model ReconciliationReport {
  id              String   @id @default(cuid())
  reportDate      DateTime
  gateway         PaymentGateway
  
  // Counts
  totalPayments   Int
  reconciledCount Int
  discrepancyCount Int
  
  // Amounts (in paise)
  expectedAmount  Int
  actualAmount    Int
  discrepancyAmount Int
  
  // Fees
  gatewayFees     Int
  taxOnFees       Int
  netSettlement   Int
  
  // Status
  status          ReconciliationStatus
  runBy           String?
  runAt           DateTime
  
  // Details
  discrepancies   Json?    // Array of {paymentId, issue, amount}
  summary         Json?
  
  createdAt       DateTime @default(now())
  
  @@index([reportDate, gateway])
}

enum ReconciliationStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}

// Extend PaymentRefund model
model PaymentRefund {
  // ... existing fields ...
  isPartial       Boolean  @default(false)
  originalAmount  Int      // Original payment amount
  // refundedAmount already exists (amount field)
  remainingAmount Int?     // For partial refunds
}
```

### Implementation Tasks

#### 3.1 Partial Refund System (US-REFUND-002)
- [ ] **TDD RED**: Write tests for partial refunds
- [ ] **TDD GREEN**: Enhance refund endpoint
  - Support partial refund amounts
  - Validate: refund ≤ (payment amount - previous refunds)
  - Calculate remainingAmount
  - Update payment status to PARTIALLY_REFUNDED
- [ ] **TDD GREEN**: Update admin refund UI
  - Add "Partial Refund" option
  - Amount input with validation
  - Show refund history for payment
  - Show remaining refundable amount
- [ ] **TDD GREEN**: Enhanced invoice for partial refunds
  - Show original amount
  - Show refunded amount(s)
  - Show current balance
  - Generate credit note PDF
- [ ] **TDD GREEN**: Email notification for partial refunds
  - New template: `templates/emails/partial-refund.html`
  - Include: partial amount, reason, remaining balance
- [ ] **TDD REFACTOR**: Consolidate refund logic
- [ ] **QUALITY**: Test multiple partial refunds on same payment

**Tests**: 10 E2E tests (partial refunds, validation, invoice updates)

#### 3.2 Payment Reconciliation (US-RECONCILE-001, 002)
- [ ] **TDD RED**: Write tests for reconciliation reports
- [ ] **TDD GREEN**: Create reconciliation service
  - `server/services/reconciliation.service.ts`
  - Method: reconcileDaily(gateway, date)
  - Fetch gateway settlement report via API
  - Compare with local payment records
  - Identify discrepancies
- [ ] **TDD GREEN**: Create reconciliation endpoints
  - `POST /api/admin/reconciliation/run` - Run manual reconciliation
  - `GET /api/admin/reconciliation/reports` - List reports
  - `GET /api/admin/reconciliation/reports/:id` - Get report details
  - `GET /api/admin/reconciliation/discrepancies` - View all discrepancies
- [ ] **TDD GREEN**: Create admin reconciliation UI
  - `src/pages/admin/Reconciliation.tsx`
  - Date picker for reconciliation
  - Gateway selector
  - Run reconciliation button
  - Report table with status indicators
  - Discrepancy drill-down
  - Export to Excel
- [ ] **TDD GREEN**: Implement cron job for daily auto-reconciliation
  - Use node-cron or similar
  - Run at 2 AM daily
  - Email admin if discrepancies found
- [ ] **TDD REFACTOR**: Optimize gateway API calls
- [ ] **QUALITY**: Handle API rate limits, retry failed reconciliations

**Tests**: 12 E2E tests (manual reconciliation, auto reconciliation, discrepancy handling)

#### 3.3 Financial Dashboard & Reports (US-REPORT-001, 003, 004)
- [ ] **TDD RED**: Write tests for financial dashboard endpoints
- [ ] **TDD GREEN**: Create financial analytics service
  - Calculate: total revenue, success rate, refund rate, avg transaction
  - Group by: gateway, payment type, time period
  - Generate trend data for charts
- [ ] **TDD GREEN**: Create dashboard endpoints
  - `GET /api/admin/analytics/dashboard` - Overall metrics
  - `GET /api/admin/analytics/revenue-trend` - Time series data
  - `GET /api/admin/analytics/gateway-breakdown` - Gateway stats
  - `GET /api/admin/analytics/user-ltv` - Lifetime value per user
- [ ] **TDD GREEN**: Create admin dashboard UI
  - `src/pages/admin/FinancialDashboard.tsx`
  - Summary cards: Revenue, Success rate, Refunds, Avg value
  - Charts: Revenue trend (line), Gateway breakdown (pie), Type breakdown (bar)
  - Top users table
  - Recent transactions
  - Failed payments list
- [ ] **TDD GREEN**: User-specific financial report for admin
  - Search user by email
  - View all user payments, refunds
  - User lifetime value
  - Export user statement
- [ ] **TDD GREEN**: Tax report generation
  - `GET /api/admin/reports/tax` - Generate tax reports
  - TDS report: Users with TDS deductions
  - GST report: CGST/SGST/IGST breakdown
  - Quarter-wise summaries
  - Export in government formats (CSV/Excel)
- [ ] **TDD REFACTOR**: Optimize analytics queries with materialized views
- [ ] **QUALITY**: Real-time dashboard updates, caching layer

**Tests**: 15 E2E tests (dashboard metrics, charts, user reports, tax reports)

### Deliverables
- ✅ Partial refund system functional
- ✅ Credit notes generated for partial refunds
- ✅ Daily auto-reconciliation running
- ✅ Reconciliation dashboard for admins
- ✅ Financial analytics dashboard with charts
- ✅ User-specific financial reports
- ✅ Tax report generation
- ✅ 37 E2E tests passing
- ✅ Excel export functionality
- ✅ Cron jobs configured

---

## PHASE 4: Communication Platform (Weeks 7-8)
**Focus**: Investor-founder messaging, communication logging  
**Stories**: 5 | **Effort**: 22 points | **Priority**: MEDIUM

### Database Changes
```prisma
model Message {
  id          String      @id @default(cuid())
  threadId    String
  thread      MessageThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  
  senderId    String
  sender      User        @relation("SentMessages", fields: [senderId], references: [id])
  
  content     String      @db.Text
  attachments Json?       // [{fileName, fileUrl, fileSize, mimeType}]
  
  isRead      Boolean     @default(false)
  readAt      DateTime?
  
  isEdited    Boolean     @default(false)
  editedAt    DateTime?
  
  isDeleted   Boolean     @default(false)
  deletedAt   DateTime?
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  @@index([threadId, createdAt])
  @@index([senderId])
}

model MessageThread {
  id            String    @id @default(cuid())
  subject       String?
  
  // Participants
  participant1Id String
  participant1   User     @relation("ThreadsAsParticipant1", fields: [participant1Id], references: [id])
  participant2Id String
  participant2   User     @relation("ThreadsAsParticipant2", fields: [participant2Id], references: [id])
  
  // Status
  isBlocked     Boolean   @default(false)
  blockedBy     String?   // userId who blocked
  blockedAt     DateTime?
  
  // Last message
  lastMessageAt DateTime  @default(now())
  lastMessagePreview String?
  
  // Unread counts
  unreadCountP1 Int       @default(0)
  unreadCountP2 Int       @default(0)
  
  messages      Message[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([participant1Id, participant2Id])
  @@index([participant1Id, lastMessageAt])
  @@index([participant2Id, lastMessageAt])
}

model NotificationPreference {
  id          String  @id @default(cuid())
  userId      String  @unique
  user        User    @relation(fields: [userId], references: [id])
  
  // Email notifications
  emailPayments       Boolean @default(true)
  emailMessages       Boolean @default(true)
  emailEvents         Boolean @default(true)
  emailApplications   Boolean @default(true)
  emailDeals          Boolean @default(true)
  emailMarketing      Boolean @default(false)
  
  // In-app notifications
  inAppMessages       Boolean @default(true)
  inAppEvents         Boolean @default(true)
  inAppPayments       Boolean @default(true)
  inAppApplications   Boolean @default(true)
  
  // Frequency
  emailFrequency      NotificationFrequency @default(IMMEDIATE)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum NotificationFrequency {
  IMMEDIATE
  DAILY_DIGEST
  WEEKLY_DIGEST
  NONE
}
```

### Implementation Tasks

#### 4.1 Direct Messaging System (US-COMM-001, 002, 003)
- [ ] **TDD RED**: Write tests for messaging endpoints
- [ ] **TDD GREEN**: Create messaging service
  - `server/services/message.service.ts`
  - Methods: sendMessage(), getThreads(), getMessages(), markAsRead()
- [ ] **TDD GREEN**: Create messaging endpoints
  - `POST /api/messages/threads` - Create or get thread
  - `GET /api/messages/threads` - List user's threads
  - `GET /api/messages/threads/:id` - Get thread messages
  - `POST /api/messages/threads/:id/messages` - Send message
  - `PUT /api/messages/:id/read` - Mark as read
  - `POST /api/messages/threads/:id/block` - Block user
  - `DELETE /api/messages/:id` - Delete message (soft delete)
- [ ] **TDD GREEN**: File attachment support
  - Handle multipart/form-data
  - Upload to S3 or local storage
  - Max 10MB per file
  - Validate file types (images, PDFs, docs)
- [ ] **TDD GREEN**: Create messaging UI components
  - `src/components/messaging/MessageInbox.tsx` - Inbox list
  - `src/components/messaging/MessageThread.tsx` - Thread view
  - `src/components/messaging/MessageComposer.tsx` - Rich text editor
  - `src/pages/Messages.tsx` - Main messaging page
- [ ] **TDD GREEN**: Real-time updates with polling
  - Poll for new messages every 10 seconds when on messages page
  - Update unread count in navigation badge
  - Show "typing..." indicator (optional)
- [ ] **TDD GREEN**: Email notifications for messages
  - New template: `templates/emails/new-message.html`
  - Send when message received (check user preferences)
  - Include message preview and reply link
- [ ] **TDD REFACTOR**: Optimize thread queries, add message pagination
- [ ] **QUALITY**: Rich text formatting (bold, italic, links)

**Tests**: 15 E2E tests (send message, thread creation, read status, blocking, attachments)

#### 4.2 Communication Audit Log (US-COMM-004)
- [ ] **TDD RED**: Write tests for admin communication monitoring
- [ ] **TDD GREEN**: Create admin messaging endpoints
  - `GET /api/admin/messages/audit` - View all messages (flagged only)
  - `GET /api/admin/messages/reported` - View reported messages
  - `POST /api/admin/messages/:id/flag` - Flag message
  - `DELETE /api/admin/messages/:id` - Delete message permanently
- [ ] **TDD GREEN**: Add reporting feature
  - Button to report inappropriate message
  - Reason selection: Spam, Harassment, Fraud, Other
  - Reported messages visible to admin
- [ ] **TDD GREEN**: Create admin messaging UI
  - `src/pages/admin/MessageAudit.tsx`
  - List of flagged/reported messages
  - User information
  - Action buttons: Delete, Warn user, Block user
  - Export logs
- [ ] **TDD GREEN**: Privacy controls
  - Admin cannot see all messages by default
  - Only flagged/reported messages visible
  - Audit log for admin actions
- [ ] **TDD REFACTOR**: Add message search for admin
- [ ] **QUALITY**: GDPR compliance, message retention policy

**Tests**: 8 E2E tests (reporting, admin review, deletion)

#### 4.3 Notification Preferences (Cross-cutting)
- [ ] **TDD RED**: Write tests for notification preferences
- [ ] **TDD GREEN**: Create preferences endpoint
  - `GET /api/notifications/preferences` - Get user preferences
  - `PUT /api/notifications/preferences` - Update preferences
- [ ] **TDD GREEN**: Create preferences UI
  - `src/pages/NotificationPreferences.tsx`
  - Toggle switches for each notification type
  - Email frequency selector
  - Save button
- [ ] **TDD GREEN**: Respect preferences in notification service
  - Check preferences before sending email
  - Implement daily/weekly digest batching
  - Queue notifications for batch sending
- [ ] **TDD REFACTOR**: Centralize notification logic
- [ ] **QUALITY**: Default preferences for new users

**Tests**: 5 E2E tests (update preferences, respect in sending)

### Deliverables
- ✅ Full messaging system functional
- ✅ File attachments working (10MB limit)
- ✅ Real-time updates via polling
- ✅ Email notifications for messages
- ✅ Admin audit and moderation tools
- ✅ Message reporting feature
- ✅ User notification preferences
- ✅ 28 E2E tests passing
- ✅ Privacy-compliant design
- ✅ Responsive messaging UI

---

## PHASE 5: Quality, Security & Accessibility (Weeks 9-10)
**Focus**: Zero errors, OWASP compliance, WCAG 2.2 AA, mobile responsiveness  
**Stories**: 8 (Quality requirements) | **Effort**: Ongoing | **Priority**: CRITICAL

### Implementation Tasks

#### 5.1 Zero Errors & Warnings (US-QUALITY-001)
- [ ] **Resolve TypeScript Errors**
  - Run `npx tsc --noEmit`
  - Fix all type errors
  - Add proper types for all API responses
  - Add types for all props
  - No `any` types (use `unknown` if needed)
- [ ] **Resolve ESLint Errors**
  - Run `npm run lint`
  - Fix all errors
  - Address warnings or add eslint-disable with justification
  - Configure stricter rules: no-console, no-debugger
- [ ] **Remove Debug Code**
  - Remove all `console.log` statements
  - Remove all `debugger` statements
  - Use proper logging library (winston/pino)
- [ ] **Code Quality**
  - All functions have JSDoc comments
  - Complex logic has inline comments
  - TODOs converted to tickets or removed
  - Dead code removed
- [ ] **Pre-commit Hooks**
  - Install Husky + lint-staged
  - Run linter on staged files
  - Run type check before commit
  - Run tests before push

**Deliverables**: Zero errors, zero warnings, clean code

#### 5.2 Responsive Design (US-QUALITY-002)
- [ ] **Mobile Breakpoints**
  - Test all pages at 320px, 375px, 414px (mobile)
  - Test all pages at 768px, 1024px (tablet)
  - Test all pages at 1280px, 1920px (desktop)
- [ ] **Touch Targets**
  - All buttons minimum 44x44px
  - All clickable elements have adequate spacing
  - No overlapping touch targets
- [ ] **Layout**
  - No horizontal scrolling
  - Proper text wrapping
  - Images scale responsively
  - Tables convert to cards on mobile
  - Forms stack vertically on mobile
- [ ] **Navigation**
  - Hamburger menu on mobile
  - Bottom navigation bar (optional)
  - Breadcrumbs hide on mobile
- [ ] **Typography**
  - Base font size 16px
  - Headings scale appropriately
  - Line height 1.5 for body text
  - Readable line lengths (60-70 characters)
- [ ] **Device Testing**
  - iOS Safari (iPhone 12, iPad)
  - Android Chrome (Pixel, Samsung)
  - Desktop: Chrome, Firefox, Safari, Edge

**Deliverables**: All pages mobile-responsive, tested on real devices

#### 5.3 OWASP Top 25 Security (US-QUALITY-003)
- [ ] **Input Validation**
  - Zod schemas for all API endpoints
  - Server-side validation (never trust client)
  - Sanitize all user input (DOMPurify for HTML)
  - SQL injection prevention (Prisma parameterized queries)
- [ ] **Authentication & Authorization**
  - JWT token expiration enforced
  - Refresh token rotation
  - Password strength requirements (zxcvbn)
  - Brute force protection (rate limiting)
  - Session management secure
- [ ] **XSS Prevention**
  - React automatic escaping (verify)
  - DOMPurify for rich text content
  - Content Security Policy headers
  - No eval() or dangerouslySetInnerHTML without sanitization
- [ ] **CSRF Protection**
  - CSRF tokens for state-changing requests
  - SameSite cookie attribute
  - Double-submit cookie pattern
- [ ] **Security Headers** (Helmet.js already installed)
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security: max-age=31536000
  - Content-Security-Policy: strict policy
  - Referrer-Policy: strict-origin-when-cross-origin
- [ ] **Rate Limiting** (express-rate-limit already installed)
  - Login: 5 attempts per 15 minutes
  - Registration: 3 per hour
  - API: 100 requests per 15 minutes
  - Payment: 10 per hour
- [ ] **Sensitive Data**
  - All passwords hashed (bcrypt)
  - Sensitive data encrypted (AES-256-GCM)
  - No secrets in client-side code
  - Environment variables for all config
  - .env not committed to git
- [ ] **File Upload Security**
  - File type validation (MIME type + extension)
  - File size limits enforced
  - Virus scanning (ClamAV integration)
  - Files stored outside web root
  - Random filenames (no user-supplied names)
- [ ] **API Security**
  - Authentication required on all protected routes
  - Role-based authorization enforced
  - No sensitive data in error messages
  - Proper HTTP status codes
- [ ] **Dependency Security**
  - Run `npm audit` and fix all vulnerabilities
  - Use Snyk or Dependabot for monitoring
  - Keep dependencies updated
- [ ] **Security Testing**
  - Run OWASP ZAP scan
  - Penetration testing (manual)
  - Security code review
  - Threat modeling completed

**Deliverables**: All OWASP Top 25 controls implemented and documented

#### 5.4 WCAG 2.2 AA Compliance (US-QUALITY-004)
- [ ] **Keyboard Accessibility**
  - All interactive elements keyboard accessible
  - Tab order logical (follows visual order)
  - Focus indicators visible (2px outline)
  - Skip to main content link
  - Keyboard shortcuts documented
  - No keyboard traps
- [ ] **Screen Reader Support**
  - All images have alt text (descriptive, not "image")
  - ARIA labels on icon-only buttons
  - ARIA live regions for dynamic content
  - Form labels properly associated
  - Error messages linked to inputs (aria-describedby)
  - Page titles descriptive and unique
  - Landmarks: header, nav, main, aside, footer
- [ ] **Color & Contrast**
  - Color contrast ratio ≥ 4.5:1 for normal text
  - Color contrast ratio ≥ 3:1 for large text (18pt+)
  - Color not sole indicator (use icons + text)
  - Focus indicators ≥ 3:1 contrast
- [ ] **Forms**
  - Labels for all inputs
  - Required fields marked (not just asterisk)
  - Error messages clear and specific
  - Error summary at top of form
  - Autocomplete attributes for common fields
  - Fieldsets and legends for groups
- [ ] **Responsive & Zoom**
  - Text can zoom to 200% without loss of content
  - No horizontal scrolling at 200% zoom
  - Touch targets minimum 44x44px
  - Spacing between interactive elements
- [ ] **Content**
  - Headings in logical order (h1 → h2 → h3)
  - Lists use proper markup (ul, ol, li)
  - Tables have proper headers (th scope)
  - Language declared (html lang="en")
  - Page has h1
- [ ] **Motion & Animation**
  - Respect prefers-reduced-motion
  - No auto-playing videos
  - Pause/stop controls for animations
  - No flashing content (seizure risk)
- [ ] **Testing**
  - Automated: Run axe DevTools on all pages
  - Automated: Run Lighthouse accessibility audit
  - Manual: Navigate entire site with keyboard only
  - Manual: Test with screen reader (NVDA, JAWS, VoiceOver)
  - Manual: Test with browser extensions (Wave, Axe)
  - User testing: Test with users with disabilities

**Deliverables**: WCAG 2.2 AA compliant, axe score 100%

#### 5.5 Comprehensive Testing
- [ ] **Unit Tests** (Vitest)
  - All services have unit tests
  - All utilities have unit tests
  - All hooks have unit tests
  - Coverage ≥ 80% for critical paths
- [ ] **E2E Tests** (Playwright)
  - All user stories have E2E tests
  - Happy paths covered
  - Error paths covered
  - Edge cases covered
  - Total: 150+ E2E tests passing
- [ ] **API Tests**
  - All endpoints have API tests
  - Authentication tested
  - Authorization tested
  - Validation tested
- [ ] **Performance Tests**
  - Load testing with k6 or Artillery
  - 1000 concurrent users
  - Response time < 500ms for API
  - Page load < 2s
- [ ] **Accessibility Tests**
  - Automated axe tests in E2E suite
  - Manual WCAG checklist completed

**Deliverables**: 80%+ code coverage, all E2E tests passing

### Deliverables
- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors/warnings
- ✅ All pages mobile-responsive
- ✅ OWASP Top 25 fully implemented
- ✅ WCAG 2.2 AA compliant
- ✅ 150+ E2E tests passing
- ✅ 80%+ code coverage
- ✅ Pre-commit hooks configured
- ✅ Security scan passed
- ✅ Accessibility audit passed
- ✅ Performance benchmarks met

---

## Summary

| Phase | Focus | Stories | Effort | Duration | Tests |
|-------|-------|---------|--------|----------|-------|
| Phase 1 | Email, Invoices, Seed Data | 8 | 28 pts | Weeks 1-2 | 45 |
| Phase 2 | User History & Experience | 6 | 22 pts | Weeks 3-4 | 32 |
| Phase 3 | Admin Financial Controls | 8 | 29 pts | Weeks 5-6 | 37 |
| Phase 4 | Communication Platform | 5 | 22 pts | Weeks 7-8 | 28 |
| Phase 5 | Quality & Compliance | 8 | Ongoing | Weeks 9-10 | All |
| **Total** | | **35** | **140+ pts** | **12 weeks** | **150+** |

---

## Dependencies & Prerequisites

### Phase 1 Prerequisites
- Payment system complete ✅
- Database migrations working ✅
- EmailIt API key (placeholder in .env, actual key needed before deployment)
- pdfkit installed
- Local file storage directories created (/uploads, /invoices, /attachments)

### Phase 2 Prerequisites
- Phase 1 complete (email system needed for notifications)
- Activity logging infrastructure from Phase 1

### Phase 3 Prerequisites
- Phase 1 complete (email for reconciliation alerts)
- Gateway API access (Razorpay, Stripe settlement APIs)
- Cron job scheduler (node-cron)

### Phase 4 Prerequisites
- Local file storage configured (/uploads directory)
- Phase 1 complete (email notifications)
- Polling infrastructure (10-second intervals)

### Phase 5 Prerequisites
- All phases 1-4 complete
- Testing infrastructure ready
- CI/CD pipeline configured

---

## Risk Mitigation

### Technical Risks
1. **EmailIt API limits** - Implement queue, use fallback SMTP
2. **PDF generation performance** - Cache, generate async, use worker threads
3. **Reconciliation API rate limits** - Implement backoff, cache reports
4. **Local storage disk space** - Implement file size limits, compression, cleanup policies, monitor disk usage
5. **Real-time messaging scale** - Start with polling (10s), migrate to WebSocket if >1000 concurrent users

### Schedule Risks
1. **Phase 1 critical path** - Can't proceed without email system
2. **Testing time underestimated** - Allocate full Phase 5 for quality
3. **Security audit delays** - Run continuous security scans, don't wait until end

### Quality Risks
1. **Technical debt accumulation** - Mandatory REFACTOR step in TDD
2. **Accessibility afterthought** - Build accessible from start, not retrofit
3. **Mobile responsiveness** - Test on mobile throughout, not just Phase 5

---

## Success Criteria

### Per Phase
- ✅ All user stories in phase completed
- ✅ All E2E tests passing
- ✅ Zero TypeScript/ESLint errors
- ✅ Code reviewed and merged
- ✅ Documentation updated
- ✅ Demo to stakeholders

### Overall
- ✅ 35 user stories implemented
- ✅ 150+ E2E tests passing
- ✅ 80%+ code coverage
- ✅ OWASP Top 25 compliant
- ✅ WCAG 2.2 AA compliant
- ✅ Mobile-responsive
- ✅ Performance benchmarks met
- ✅ Security audit passed
- ✅ User acceptance testing passed
- ✅ Production deployment successful

---

## Next Steps

1. **✅ Plan approved** - 12-week timeline, local storage, EmailIt, 50 sectors
2. **Set up local directories** - Create /uploads, /invoices, /attachments folders
3. **Get EmailIt API key** - Sign up and add to .env (placeholder already added)
4. **Review industry sectors** - See [INDUSTRY_SECTORS_SEED_DATA.md](INDUSTRY_SECTORS_SEED_DATA.md) for 50 curated sectors
5. **Start Phase 1 Sprint 1** - Begin with US-NOTIFY-001 (email on payment creation)

**Ready to begin implementation when you approve.**
