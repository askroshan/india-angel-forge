# India Angel Forum - User Stories
## Complete Product Requirements Document

**Product:** India Angel Forum - Angel Investment Platform  
**Date:** January 25, 2026  
**Version:** 1.0  
**Status:** Active Development

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Admin User Stories](#admin-user-stories)
4. [Compliance Officer User Stories](#compliance-officer-user-stories)
5. [Investor User Stories](#investor-user-stories)
6. [Founder User Stories](#founder-user-stories)
7. [Moderator User Stories](#moderator-user-stories)
8. [Operator Angel User Stories](#operator-angel-user-stories)
9. [Acceptance Criteria](#acceptance-criteria)
10. [Technical Requirements](#technical-requirements)

---

## Overview

The India Angel Forum is a comprehensive platform connecting accredited angel investors with high-potential Indian startups. The platform facilitates deal flow, due diligence, investment commitments, SPV creation, and portfolio management while ensuring regulatory compliance.

### Key Features
- **Deal Management:** Browse, evaluate, and invest in curated startup opportunities
- **SPV Formation:** Create and manage Special Purpose Vehicles for syndicated investments
- **Compliance:** Comprehensive KYC, AML, and accreditation verification workflows
- **Portfolio Tracking:** Monitor investments and access company updates
- **Communication:** Direct messaging and discussion forums
- **Event Management:** Attend pitch sessions, forums, and networking events

---

## User Roles

### 1. Admin
Platform administrators who manage users, roles, events, and system configuration.

### 2. Compliance Officer
Specialized role focused on regulatory compliance, KYC verification, AML screening, and accreditation verification.

### 3. Investor
Angel investors who browse deals, make investments, and manage their portfolio. Sub-types include:
- **Standard Investor:** Individual angel investor
- **Operator Angel:** Active founder/operator who also invests
- **Family Office:** Professional investment management for wealthy families
- **Syndicate Lead:** Experienced investor who leads investment syndicates

### 4. Founder
Startup founders seeking investment who submit applications, pitch to investors, and provide updates.

### 5. Moderator
Community managers who screen applications, manage content, and ensure platform quality.

### 6. Member
General community members with access to educational content and events (not covered in this document).

---

## Admin User Stories

### US-ADMIN-001: User Management
**As an** Admin  
**I want to** view and search all platform users  
**So that** I can manage the user base effectively

**Acceptance Criteria:**
- GIVEN I'm logged in as an admin
- WHEN I navigate to /admin/users
- THEN I see a list of all users with their roles, email, and registration date
- AND I can search users by name or email
- AND I can filter users by role
- AND I can view detailed user profiles

**Implementation Status:** ✅ Complete  
**Test Coverage:** 15 test cases  
**Database Tables:** `users`, `user_roles`, `roles`

---

### US-ADMIN-002: Role Assignment
**As an** Admin  
**I want to** assign and remove user roles  
**So that** I can control platform access and permissions

**Acceptance Criteria:**
- GIVEN I'm viewing a user profile
- WHEN I assign a role (investor, founder, compliance_officer, moderator)
- THEN the role is added to the user
- AND the user receives an email notification
- AND an audit log entry is created
- AND I cannot remove the last admin role from myself

**Implementation Status:** ✅ Complete  
**Test Coverage:** 10 test cases  
**Database Tables:** `user_roles`, `audit_logs`

---

### US-ADMIN-003: Event Management
**As an** Admin  
**I want to** create and manage events  
**So that** investors and founders can attend forums, pitch sessions, and networking events

**Acceptance Criteria:**
- GIVEN I'm logged in as admin
- WHEN I create a new event with title, date, location, max attendees
- THEN the event is published
- AND users can register for the event
- AND I can view registrations
- AND I can edit or cancel events
- AND registered users are notified of changes

**Implementation Status:** ✅ Complete  
**Test Coverage:** 14 test cases  
**Database Tables:** `events`, `event_registrations`

---

### US-ADMIN-004: Application Review
**As an** Admin  
**I want to** review and approve investor/founder applications  
**So that** only qualified members join the platform

**Acceptance Criteria:**
- GIVEN I'm viewing pending applications
- WHEN I approve an application
- THEN the user's status changes to "approved"
- AND they gain access to member features
- AND they receive an approval email
- WHEN I reject with a reason
- THEN the applicant is notified with feedback

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 12 test cases  
**Database Tables:** `investor_applications`, `founder_applications`

---

### US-ADMIN-005: System Statistics
**As an** Admin  
**I want to** view platform analytics and statistics  
**So that** I can monitor platform health and growth

**Acceptance Criteria:**
- GIVEN I'm on the admin dashboard
- THEN I see total users by role
- AND total deals and investments
- AND event attendance statistics
- AND user growth over time charts
- AND I can filter by date range

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 10 test cases  
**Database Tables:** Aggregated from multiple tables

---

### US-ADMIN-006: Audit Logs
**As an** Admin  
**I want to** view comprehensive audit logs  
**So that** I can track all system changes and investigate issues

**Acceptance Criteria:**
- GIVEN I'm viewing audit logs
- THEN I see all actions with timestamp, user, action type, and details
- AND I can filter by user, action type, and date range
- AND I can export logs to CSV
- AND sensitive actions (role changes, deletions) are highlighted

**Implementation Status:** ✅ Complete  
**Test Coverage:** 12 test cases  
**Database Tables:** `audit_logs`

---

## Compliance Officer User Stories

### US-COMPLIANCE-001: Review KYC Documents
**As a** Compliance Officer  
**I want to** review and verify investor KYC documents  
**So that** we comply with regulatory requirements

**Acceptance Criteria:**
- GIVEN I'm logged in as compliance officer
- WHEN I navigate to /compliance/kyc
- THEN I see all pending KYC submissions
- AND I can view uploaded documents (ID, address proof, bank statement)
- AND I can verify documents with notes
- AND I can reject documents with detailed reasons
- AND investors are notified of verification status
- AND all actions are audit logged

**Implementation Status:** ✅ Complete  
**Test Coverage:** 18 test cases  
**Database Tables:** `kyc_documents`, `audit_logs`

---

### US-COMPLIANCE-002: Perform AML Screening
**As a** Compliance Officer  
**I want to** perform Anti-Money Laundering screening on investors  
**So that** we prevent financial crimes and comply with regulations

**Acceptance Criteria:**
- GIVEN an investor has submitted KYC documents
- WHEN I initiate AML screening
- THEN the system checks against PEP lists and sanctions databases
- AND results are displayed with risk scores
- AND I can flag suspicious activity
- AND I can clear investors after review
- AND flagged cases require detailed documentation
- AND screening history is maintained

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 12 test cases  
**Database Tables:** `aml_screening`, `audit_logs`

---

### US-COMPLIANCE-003: Verify Accredited Investor Status
**As a** Compliance Officer  
**I want to** verify that investors meet accreditation requirements  
**So that** only qualified investors can participate in deals

**Acceptance Criteria:**
- GIVEN an investor has submitted income/net worth documentation
- WHEN I review their accreditation application
- THEN I can verify:
  - Annual income >₹50 lakh for 2 years OR
  - Net worth >₹2 crore (excluding primary residence) OR
  - Professional certification (CA, CS, MBA from top institution)
- AND I can approve with expiry date (typically 1 year)
- AND I can reject with detailed reasons
- AND system sends verification certificate on approval
- AND re-verification is triggered before expiry

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 10 test cases  
**Database Tables:** `accreditation_verification`, `kyc_documents`

---

### US-COMPLIANCE-004: Access Audit Logs
**As a** Compliance Officer  
**I want to** access compliance-related audit logs  
**So that** I can track all compliance actions and generate reports

**Acceptance Criteria:**
- GIVEN I'm viewing compliance audit logs
- THEN I see all KYC, AML, and accreditation actions
- AND I can filter by investor, action type, and date
- AND I can generate compliance reports
- AND I can export to CSV/PDF for regulatory submission

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 8 test cases  
**Database Tables:** `audit_logs`

---

## Investor User Stories

### US-INVESTOR-001: Submit Application
**As a** prospective investor  
**I want to** submit an investment application  
**So that** I can join the angel network

**Acceptance Criteria:**
- GIVEN I'm a new user
- WHEN I fill out the application with:
  - Personal information (name, email, phone)
  - Investment profile (check size, sector preferences)
  - Experience (years investing, notable investments)
  - LinkedIn profile
- THEN my application is submitted for review
- AND I receive a confirmation email
- AND I can track my application status

**Implementation Status:** ✅ Complete  
**Test Coverage:** 10 test cases  
**Database Tables:** `investor_applications`

---

### US-INVESTOR-002: Upload KYC Documents
**As an** approved investor  
**I want to** upload my KYC documents  
**So that** I can complete verification and invest

**Acceptance Criteria:**
- GIVEN I'm an approved investor
- WHEN I upload:
  - Government-issued ID (Aadhaar, PAN, Passport)
  - Address proof (recent utility bill, bank statement)
  - Bank account details
- THEN documents are securely stored
- AND compliance team is notified for review
- AND I can see verification status
- AND I can reupload if rejected

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 10 test cases  
**Database Tables:** `kyc_documents`

---

### US-INVESTOR-003: Browse Available Deals
**As a** verified investor  
**I want to** browse all available investment opportunities  
**So that** I can discover startups to invest in

**Acceptance Criteria:**
- GIVEN I'm a verified investor
- WHEN I navigate to /deals
- THEN I see all active deals with:
  - Startup name, sector, stage
  - Amount raising, valuation
  - Deal terms (equity %, minimum check)
  - Brief description
- AND I can filter by sector, stage, check size
- AND I can search by startup name
- AND I can sort by date posted, amount raising

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 14 test cases  
**Database Tables:** `deals`, `companies`

---

### US-INVESTOR-004: Express Interest in Deal
**As a** verified investor  
**I want to** express interest in a deal  
**So that** I can receive more information and proceed with due diligence

**Acceptance Criteria:**
- GIVEN I'm viewing a deal
- WHEN I click "Express Interest"
- THEN I can specify my intended investment amount
- AND deal sponsor is notified
- AND I gain access to data room documents
- AND the deal moves to my pipeline

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 10 test cases  
**Database Tables:** `deal_interests`

---

### US-INVESTOR-005: Track Deal Pipeline
**As a** verified investor  
**I want to** track all deals in my pipeline  
**So that** I can manage my deal flow efficiently

**Acceptance Criteria:**
- GIVEN I've expressed interest in deals
- WHEN I navigate to /pipeline
- THEN I see all my deals organized by status:
  - Interested (expressed interest)
  - Due Diligence (reviewing documents)
  - Committed (submitted investment commitment)
  - Closed (deal completed)
- AND I can move deals between stages
- AND I can add notes to each deal
- AND I can see time in each stage

**Implementation Status:** ✅ Complete  
**Test Coverage:** 12 test cases  
**Database Tables:** `deal_interests`, `deals`

---

### US-INVESTOR-006: View Deal Documents
**As a** verified investor  
**I want to** access deal documents and data room  
**So that** I can perform due diligence

**Acceptance Criteria:**
- GIVEN I've expressed interest in a deal
- WHEN I access the data room
- THEN I can view/download:
  - Pitch deck
  - Financial statements (3 years)
  - Cap table
  - Term sheet
  - Due diligence questionnaire
  - Legal documents
- AND all document access is audit logged
- AND documents are version controlled

**Implementation Status:** ✅ Complete  
**Test Coverage:** 8 test cases  
**Database Tables:** `deal_documents`

---

### US-INVESTOR-007: Submit Investment Commitment
**As a** verified investor  
**I want to** submit my investment commitment  
**So that** I can participate in a deal

**Acceptance Criteria:**
- GIVEN I've completed due diligence
- WHEN I submit a commitment with:
  - Investment amount
  - Acceptance of terms
  - Participation in SPV (yes/no)
- THEN my commitment is recorded
- AND deal sponsor is notified
- AND payment instructions are sent
- AND status changes to "Committed"

**Implementation Status:** ✅ Complete  
**Test Coverage:** 10 test cases  
**Database Tables:** `investment_commitments`

---

### US-INVESTOR-008: Create SPV
**As a** syndicate lead investor  
**I want to** create a Special Purpose Vehicle  
**So that** I can pool investments from co-investors

**Acceptance Criteria:**
- GIVEN I'm a verified investor
- WHEN I create an SPV with:
  - SPV name
  - Associated deal
  - Target raise amount
  - Carry structure (%, hurdle rate)
  - Minimum investment per member
- THEN SPV is created
- AND I can invite co-investors
- AND SPV dashboard shows allocation status

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 18 test cases  
**Database Tables:** `spvs`, `spv_members`

---

### US-INVESTOR-009: Invite Co-Investors to SPV
**As an** SPV lead  
**I want to** invite other investors to join my SPV  
**So that** we can invest together

**Acceptance Criteria:**
- GIVEN I've created an SPV
- WHEN I invite investors via email
- THEN they receive invitation with SPV details
- AND they can accept and commit an amount
- AND I can see commitment status
- AND I can set a deadline for commitments
- AND I can adjust allocations if oversubscribed

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 12 test cases  
**Database Tables:** `spv_members`, `spv_invitations`

---

### US-INVESTOR-010: Track SPV Allocations
**As an** SPV lead  
**I want to** track all member commitments and allocations  
**So that** I can manage the SPV effectively

**Acceptance Criteria:**
- GIVEN I'm managing an SPV
- THEN I see:
  - Total committed vs. target
  - List of members with amounts
  - Payment status for each member
  - SPV pro-rata ownership calculation
- AND I can mark payments as received
- AND I can remove members before close
- AND I can adjust allocations

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 14 test cases  
**Database Tables:** `spv_members`, `spv_allocations`

---

### US-INVESTOR-011: View Portfolio Dashboard
**As a** verified investor  
**I want to** view my investment portfolio  
**So that** I can track all my investments in one place

**Acceptance Criteria:**
- GIVEN I have completed investments
- WHEN I navigate to /portfolio
- THEN I see:
  - All portfolio companies
  - Investment amount and date
  - Current valuation (if updated)
  - Ownership percentage
  - IRR and multiple
  - Latest company update
- AND I can filter by sector, stage, status

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 16 test cases  
**Database Tables:** `portfolio_companies`, `investments`

---

### US-INVESTOR-012: Track Portfolio Performance
**As a** verified investor  
**I want to** track the performance of my investments  
**So that** I can measure my returns

**Acceptance Criteria:**
- GIVEN I have portfolio companies
- THEN I see:
  - Total deployed capital
  - Total current value (mark-to-market)
  - Unrealized gains/losses
  - Realized returns (exits)
  - Portfolio IRR
  - Performance by sector/stage
- AND charts show performance over time

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 12 test cases  
**Database Tables:** `portfolio_companies`, `valuations`

---

### US-INVESTOR-013: Access Portfolio Company Updates
**As a** verified investor  
**I want to** receive and view updates from portfolio companies  
**So that** I stay informed about my investments

**Acceptance Criteria:**
- GIVEN I'm invested in companies
- WHEN a founder posts an update
- THEN I receive notification
- AND I can view update with:
  - Key metrics
  - Progress on milestones
  - Challenges and asks
  - Financial performance
- AND I can comment on updates
- AND I can see update history

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 10 test cases  
**Database Tables:** `portfolio_updates`, `update_comments`

---

### US-INVESTOR-014: Send Direct Messages
**As a** verified investor  
**I want to** send direct messages to founders and other investors  
**So that** I can communicate privately

**Acceptance Criteria:**
- GIVEN I'm viewing a user profile
- WHEN I send a message
- THEN the recipient receives a notification
- AND messages appear in their inbox
- AND we can have threaded conversations
- AND I can attach documents
- AND messages are searchable

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 16 test cases  
**Database Tables:** `messages`, `message_threads`

---

### US-INVESTOR-015: Create Discussion Threads
**As a** verified investor  
**I want to** create discussion threads on topics  
**So that** the community can share knowledge

**Acceptance Criteria:**
- GIVEN I'm on the community page
- WHEN I create a discussion with title and description
- THEN other members can view and reply
- AND I can tag topics (fundraising, due diligence, sector insights)
- AND I can upvote/downvote responses
- AND I can mark best answer

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 12 test cases  
**Database Tables:** `discussions`, `discussion_replies`

---

### US-INVESTOR-016: Set Communication Preferences
**As a** verified investor  
**I want to** control my notification preferences  
**So that** I receive relevant communications

**Acceptance Criteria:**
- GIVEN I'm in settings
- WHEN I configure preferences for:
  - New deal notifications (email, in-app)
  - Portfolio updates frequency
  - Message notifications
  - Event reminders
- THEN I only receive selected notification types
- AND I can enable/disable digest emails

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 10 test cases  
**Database Tables:** `user_preferences`, `notifications`

---

## Founder User Stories

### US-FOUNDER-001: Submit Founder Application
**As a** startup founder  
**I want to** submit an application to pitch my startup  
**So that** I can access angel investors

**Acceptance Criteria:**
- GIVEN I'm a new founder
- WHEN I submit application with:
  - Company information (name, website, stage)
  - Founder backgrounds
  - Problem and solution
  - Market size and traction
  - Fundraising details (amount, use of funds)
- THEN application is submitted for screening
- AND I receive confirmation email
- AND I can track application status

**Implementation Status:** ✅ Complete  
**Test Coverage:** 12 test cases  
**Database Tables:** `founder_applications`, `companies`

---

### US-FOUNDER-002: Track Application Status
**As a** founder  
**I want to** track my application status  
**So that** I know where I am in the process

**Acceptance Criteria:**
- GIVEN I've submitted an application
- WHEN I log in
- THEN I see status:
  - Submitted (under review)
  - Screening (moderator review)
  - Forum Selected (approved to pitch)
  - Declined (with feedback)
- AND I see next steps for each stage
- AND I receive email on status changes

**Implementation Status:** ✅ Complete  
**Test Coverage:** 10 test cases  
**Database Tables:** `founder_applications`

---

### US-FOUNDER-003: Access Investor Profiles
**As an** approved founder  
**I want to** view investor profiles  
**So that** I can target relevant investors

**Acceptance Criteria:**
- GIVEN I'm an approved founder
- WHEN I browse investor directory
- THEN I see investors with:
  - Investment focus (sectors, stages)
  - Check size range
  - Notable investments
  - Operating background (for operator angels)
- AND I can filter by sector, check size
- AND I can see who viewed my deal

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 8 test cases  
**Database Tables:** `users`, `investor_profiles`

---

### US-FOUNDER-004: Schedule Pitch Sessions
**As an** approved founder  
**I want to** schedule pitch sessions with interested investors  
**So that** I can present my startup

**Acceptance Criteria:**
- GIVEN investors have expressed interest
- WHEN I propose meeting times
- THEN investors can accept/decline
- AND accepted meetings appear in calendar
- AND automated reminders are sent
- AND I can attach pitch deck link

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 14 test cases  
**Database Tables:** `pitch_sessions`, `meeting_calendar`

---

### US-FOUNDER-005: Upload Pitch Deck and Documents
**As an** approved founder  
**I want to** upload pitch materials  
**So that** investors can review my startup

**Acceptance Criteria:**
- GIVEN I'm an approved founder
- WHEN I upload:
  - Pitch deck (PDF/PPT)
  - Financial model
  - Product demo video
  - Cap table
- THEN documents are stored in data room
- AND interested investors can access them
- AND I can see who viewed documents
- AND I can update documents

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 12 test cases  
**Database Tables:** `deal_documents`

---

### US-FOUNDER-006: Receive and Respond to Investor Feedback
**As an** approved founder  
**I want to** receive feedback from investors  
**So that** I can address concerns and improve my pitch

**Acceptance Criteria:**
- GIVEN investors have reviewed my deal
- WHEN they provide feedback/questions
- THEN I receive notifications
- AND I can respond to feedback
- AND I can see common objections
- AND feedback is threaded by investor

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 10 test cases  
**Database Tables:** `deal_feedback`, `feedback_responses`

---

## Moderator User Stories

### US-MODERATOR-001: Screen Founder Applications
**As a** moderator  
**I want to** review and screen founder applications  
**So that** only quality startups reach investors

**Acceptance Criteria:**
- GIVEN new applications are submitted
- WHEN I review an application
- THEN I can:
  - View complete application details
  - Check for completeness and quality
  - Approve for forum selection
  - Request more information
  - Decline with feedback
- AND founders are notified of decisions
- AND screening notes are saved

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 14 test cases  
**Database Tables:** `founder_applications`, `screening_notes`

---

### US-MODERATOR-002: Review Event Attendance
**As a** moderator  
**I want to** manage event attendance  
**So that** I can track who attends and mark no-shows

**Acceptance Criteria:**
- GIVEN an event is happening
- WHEN I view registrations
- THEN I can:
  - Mark attendees as "Attended"
  - Mark registrants as "No Show"
  - Check in attendees via QR code
  - View attendance statistics
- AND attendance history is tracked
- AND frequent no-shows can be flagged

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 10 test cases  
**Database Tables:** `event_registrations`

---

### US-MODERATOR-003: Manage Content Flags
**As a** moderator  
**I want to** review flagged content  
**So that** I can maintain platform quality

**Acceptance Criteria:**
- GIVEN users have flagged content
- WHEN I review flags
- THEN I can:
  - View flagged messages/posts
  - See flag reason and reporter
  - Remove inappropriate content
  - Warn or suspend users
  - Mark as false positive
- AND actions are audit logged
- AND users are notified of decisions

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 12 test cases  
**Database Tables:** `content_flags`, `moderation_actions`

---

## Operator Angel User Stories

### US-OPERATOR-001: Offer Advisory Services
**As an** operator angel  
**I want to** offer advisory services to portfolio companies  
**So that** I can add value beyond capital

**Acceptance Criteria:**
- GIVEN I'm an operator angel
- WHEN I create my advisory profile with:
  - Areas of expertise
  - Hourly rate or engagement terms
  - Availability
- THEN founders can discover my profile
- AND founders can request advisory sessions
- AND I can accept/decline requests

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 12 test cases  
**Database Tables:** `advisory_profiles`, `advisory_requests`

---

### US-OPERATOR-002: Track Advisory Hours
**As an** operator angel  
**I want to** track time spent advising portfolio companies  
**So that** I can manage my commitments

**Acceptance Criteria:**
- GIVEN I'm providing advisory services
- WHEN I log hours with:
  - Company name
  - Date and duration
  - Topic/focus area
  - Notes
- THEN hours are recorded
- AND I can see total hours by company
- AND I can generate reports
- AND companies can confirm hours

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 10 test cases  
**Database Tables:** `advisory_hours`, `time_logs`

---

### US-OPERATOR-003: Mentor Startups
**As an** operator angel  
**I want to** engage in ongoing mentorship relationships  
**So that** I can guide founders over time

**Acceptance Criteria:**
- GIVEN I'm matched with a founder
- WHEN I establish a mentorship
- THEN we can:
  - Schedule regular check-ins
  - Share documents and resources
  - Track mentorship goals
  - Log meeting notes
- AND mentorship effectiveness is tracked
- AND either party can end mentorship

**Implementation Status:** ⏳ Pending  
**Test Coverage:** 14 test cases  
**Database Tables:** `mentorships`, `mentorship_sessions`

---

## Acceptance Criteria

### General Principles
All user stories must meet these requirements:

1. **Authentication & Authorization**
   - Role-based access control enforced
   - Unauthorized access returns 403 Forbidden
   - Unauthenticated access redirects to login

2. **Data Validation**
   - All inputs validated on client and server
   - Appropriate error messages shown
   - Sanitization prevents XSS/SQL injection

3. **Audit Logging**
   - Sensitive actions logged to `audit_logs`
   - Logs include: user_id, action, entity_type, entity_id, timestamp, IP address

4. **Notifications**
   - Users notified of relevant actions via email and in-app
   - Notifications respect user preferences
   - Emails use professional templates

5. **Accessibility (WCAG 2.2 AA)**
   - Keyboard navigation supported
   - Screen reader compatible
   - Color contrast ratio ≥4.5:1
   - Form labels properly associated
   - Error messages announced

6. **Responsive Design**
   - Mobile-first approach
   - Works on mobile (375px), tablet (768px), desktop (1280px+)
   - Touch targets ≥44x44px
   - Readable text sizes

7. **Performance**
   - Page load <2 seconds
   - Interactive within 3 seconds
   - API responses <500ms (excluding heavy queries)
   - Images optimized and lazy-loaded

8. **Security**
   - All data encrypted in transit (HTTPS)
   - Sensitive data encrypted at rest
   - File uploads scanned for malware
   - Rate limiting on API endpoints
   - CSRF protection enabled

---

## Technical Requirements

### Frontend Stack
- **Framework:** React 18 with TypeScript
- **Routing:** React Router v6
- **State Management:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod validation
- **UI Components:** shadcn/ui + Tailwind CSS
- **Charts:** Recharts
- **Testing:** Vitest + React Testing Library + Playwright

### Backend Stack
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL 14+
- **Authentication:** JWT (7-day expiry)
- **File Storage:** Local filesystem (production: S3/cloud storage)
- **Email:** Resend API

### Database Schema
- **Users & Auth:** users, user_roles, roles, sessions
- **Applications:** investor_applications, founder_applications
- **Compliance:** kyc_documents, aml_screening, accreditation_verification, audit_logs
- **Deals:** deals, companies, deal_interests, investment_commitments, deal_documents
- **SPV:** spvs, spv_members, spv_allocations
- **Portfolio:** portfolio_companies, portfolio_updates, valuations
- **Events:** events, event_registrations, event_waitlist
- **Communication:** messages, message_threads, discussions, discussion_replies
- **Advisory:** advisory_profiles, advisory_requests, advisory_hours, mentorships

### API Endpoints Structure
```
/api/auth/*           - Authentication (login, register, logout)
/api/users/*          - User management (admin only)
/api/applications/*   - Application submission and review
/api/compliance/*     - KYC, AML, accreditation (compliance officers)
/api/deals/*          - Deal management and interests
/api/spvs/*           - SPV creation and management
/api/portfolio/*      - Portfolio tracking
/api/events/*         - Event management and registrations
/api/messages/*       - Direct messaging
/api/discussions/*    - Community discussions
/api/admin/*          - Admin functions (stats, audit logs)
```

### Testing Requirements
- **Unit Tests:** 80% code coverage
- **Integration Tests:** All API endpoints
- **E2E Tests:** Critical user journeys for each role
- **Accessibility Tests:** WCAG 2.2 AA compliance
- **Performance Tests:** Load testing for 1000 concurrent users

---

## Implementation Phases

### Phase 1: Critical Features (4 weeks)
- ✅ US-COMPLIANCE-001: Review KYC Documents
- ⏳ US-COMPLIANCE-002: Perform AML Screening
- ⏳ US-COMPLIANCE-003: Verify Accredited Investor Status
- ✅ US-ADMIN-001: User Management
- ✅ US-ADMIN-002: Role Assignment
- ✅ US-ADMIN-003: Event Management
- ⏳ US-INVESTOR-002: Upload KYC Documents
- ✅ US-INVESTOR-001: Submit Application

### Phase 2: Deal Management (4 weeks)
- ⏳ US-INVESTOR-003: Browse Available Deals
- ⏳ US-INVESTOR-004: Express Interest in Deal
- ✅ US-INVESTOR-005: Track Deal Pipeline
- ✅ US-INVESTOR-006: View Deal Documents
- ✅ US-INVESTOR-007: Submit Investment Commitment
- ✅ US-FOUNDER-001: Submit Founder Application
- ✅ US-FOUNDER-002: Track Application Status

### Phase 3: SPV & Portfolio (3 weeks)
- ⏳ US-INVESTOR-008: Create SPV
- ⏳ US-INVESTOR-009: Invite Co-Investors to SPV
- ⏳ US-INVESTOR-010: Track SPV Allocations
- ⏳ US-INVESTOR-011: View Portfolio Dashboard
- ⏳ US-INVESTOR-012: Track Portfolio Performance
- ⏳ US-INVESTOR-013: Access Portfolio Company Updates

### Phase 4: Founder & Communication (3 weeks)
- ⏳ US-FOUNDER-003: Access Investor Profiles
- ⏳ US-FOUNDER-004: Schedule Pitch Sessions
- ⏳ US-FOUNDER-005: Upload Pitch Deck
- ⏳ US-FOUNDER-006: Receive Investor Feedback
- ⏳ US-INVESTOR-014: Send Direct Messages
- ⏳ US-INVESTOR-015: Create Discussion Threads

### Phase 5: Platform Operations (2 weeks)
- ⏳ US-MODERATOR-001: Screen Founder Applications
- ⏳ US-MODERATOR-002: Review Event Attendance
- ⏳ US-MODERATOR-003: Manage Content Flags
- ⏳ US-ADMIN-004: Application Review
- ⏳ US-ADMIN-005: System Statistics
- ✅ US-ADMIN-006: Audit Logs

### Phase 6: Value-Add Features (2 weeks)
- ⏳ US-OPERATOR-001: Offer Advisory Services
- ⏳ US-OPERATOR-002: Track Advisory Hours
- ⏳ US-OPERATOR-003: Mentor Startups
- ⏳ US-INVESTOR-016: Set Communication Preferences

---

## Success Metrics

### User Engagement
- **Target:** 80% of approved investors complete KYC within 7 days
- **Target:** 60% of verified investors express interest in ≥1 deal per month
- **Target:** Average deal pipeline has 5-7 active opportunities per investor

### Platform Growth
- **Target:** 200 verified investors in first 6 months
- **Target:** 50 quality founder applications per quarter
- **Target:** 10-15 deals closed per quarter

### Compliance
- **Target:** 100% of investors KYC verified before first investment
- **Target:** AML screening completed within 48 hours
- **Target:** Zero regulatory violations

### User Satisfaction
- **Target:** Net Promoter Score (NPS) >50
- **Target:** <5% user complaint rate
- **Target:** 90% of founders rate platform 4/5 or higher

---

## Glossary

- **Accredited Investor:** Individual meeting income/net worth requirements to invest in private securities
- **AML:** Anti-Money Laundering - regulatory process to prevent financial crimes
- **Carry:** Performance fee charged by SPV lead (typically 15-20% of profits)
- **Data Room:** Secure repository of due diligence documents
- **Deal Flow:** Stream of investment opportunities
- **Due Diligence:** Investigation process before investment
- **IRR:** Internal Rate of Return - annualized return metric
- **KYC:** Know Your Customer - identity verification process
- **PEP:** Politically Exposed Person - higher risk for AML
- **Pro-rata:** Investment allocation proportional to commitment
- **SPV:** Special Purpose Vehicle - entity created for specific deal
- **Syndicate:** Group of investors investing together
- **Term Sheet:** Summary of investment terms

---

**Document Status:** Living Document - Updated as requirements evolve  
**Last Updated:** January 25, 2026  
**Next Review:** February 15, 2026  
**Owner:** Product Management Team
