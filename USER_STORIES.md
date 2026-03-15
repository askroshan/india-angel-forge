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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 26 test cases (26/26 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 10 test cases (10/10 passing - 100%)  
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

  US-ADMIN-007 — Application Approve/Reject from Modal

  As an Admin, I want Approve and Reject buttons directly within the Application Details modal so that I can take action without navigating away.

  GIVEN I open Application Details for any pending application

  THEN I see Approve (green) and Reject with reason (red) buttons

  AND the modal is scrollable to show all fields + action buttons

  AND clicking Approve sends approval email and changes status

  AND clicking Reject opens a reason input and sends rejection email

  **Implementation Status:** ✅ Complete  

  US-ADMIN-008 — Fix Membership Management Page

  As an Admin, I want the Membership Management page to display membership plans, subscriber counts, and revenue so that I can manage platform subscriptions.

  GIVEN I navigate to /admin/membership

  THEN I see a list of membership tiers (Associate, Full Member, Lead Angel)

  AND I see active subscriber count, revenue per tier

  AND I can create, edit, or deactivate membership plans

  **Implementation Status:** ✅ Complete — B5 fix: seed plan names updated to `Associate`, `Full Member`, `Lead Angel`  

  US-ADMIN-009 — Fix Invoice Management Page

  As an Admin, I want the Invoice Management page to list all generated invoices with retry functionality so that I can manage payment failures.

  GIVEN I navigate to /admin/invoices

  THEN I see all invoices with status (paid, failed, pending)

  AND I can retry failed invoices

  AND I can download individual invoice PDFs

  AND I can filter by date, status, user

  **Implementation Status:** ✅ Complete — B4 fix: status counts always render (removed conditional wrapper, added `?? 0` fallbacks)  

  US-ADMIN-010 — INR Currency Consistency in System Statistics

  As an Admin, I want all monetary values in System Statistics to be displayed in INR (₹) so that data is consistent with the Indian platform context.

  GIVEN I view System Statistics

  THEN Total Investment shows ₹ format (e.g., ₹2.3 Cr)

  AND user counts by role reflect actual distinct role assignments without double-counting

  US-ADMIN-011 — User Role Filter for Investor Sub-types

  As an Admin, I want to filter users by Investor, Operator Angel, Family Office, and Founder roles in User Role Management so that I can view platform members by investment type.

  GIVEN I use Filter by Role on /admin/users

  THEN the dropdown includes: Investor, Operator Angel, Family Office, Founder (in addition to existing options)

  **Implementation Status:** ✅ Complete — B1 fix: `User.roles: string[]` array, filter/counts use `.includes()`, all role badges rendered  

  US-ADMIN-012 — Investor KYC Verification Status Counts

  As an Admin, I want the Investor Management page to accurately show Verified and Pending KYC counts so that I can monitor compliance completion.

  GIVEN I view /admin/investors

  THEN Verified count = number of investors with approved KYC

  AND Pending count = number with submitted but not yet verified KYC

  US-ADMIN-013 — Company Management — Fix API and Add Company Creation

  As an Admin, I want to view and manage all founder company profiles from /admin/companies so that I can oversee startup registrations.

  GIVEN I navigate to /admin/companies

  THEN the page loads without API errors

  AND lists all companies with founder name, sector, stage, status

  AND I can search by name, sector, location

  AND I can view/edit company details

  US-ADMIN-014 — Certificate PDF Generation

  As an Admin, I want the system to generate and store certificate PDFs on event check-out so that attendees can download proof of attendance.

  GIVEN an attendee completes check-in AND check-out at an event

  THEN a certificate PDF is automatically generated and stored

  AND the Certificate button on attendance management downloads the PDF

  AND the attendee receives the certificate on their /certificates page

  AND /verify-certificate/{code} validates the certificate publicly

  US-ADMIN-015 — Message Subjects in Communication Audit

  As an Admin, I want messages in the Communication Audit log to show meaningful subjects or first-line previews so that I can identify conversations without opening each one.

  GIVEN I view /admin/communications

  THEN each thread shows a subject or auto-generated first-message preview

  AND I can filter by sender, recipient, date range

  AND I can export conversation logs to CSV

  US-ADMIN-016 — Activity Timeline — Diverse Activity Types

  As an Admin, I want the Activity Timeline to show all platform activity types (deal interests, payments, event check-ins, KYC submissions, profile updates) so that I have a complete audit trail.

  GIVEN I view /activity

  THEN I see activities of types: Deal, Payment, Event, Document, Profile, KYC, AML

  AND I can filter by activity type

  AND I can filter by user

  AND I can export filtered activity to CSV

  US-ADMIN-017 — Admin Deal Oversight View

  As an Admin, I want read-only access to browse all active deals so that I can oversee investment activity without needing an investor application.

  GIVEN I am logged in as admin

  WHEN I navigate to /admin/deals

  THEN I see all active deals with amounts, investor interests, commitments

  AND I can view deal details, data room access logs

  AND I cannot commit to deals (read-only)

  **Implementation Status:** ✅ Complete — B3 fix: created `AdminDeals.tsx` page + `GET /api/admin/deals` endpoint + route registered in `App.tsx`  
  **Test Coverage:** 12 test cases  
  **Database Tables:** `deals`, `deal_interests`, `investment_commitments`

  ---

  ### US-ADMIN-018: View and Edit Any User Profile
  **As an** Admin  
  **I want to** view and edit any user's profile details  
  **So that** I can correct user information and manage account details

  **Acceptance Criteria:**
  - GIVEN I am on /admin/users
  - WHEN I click "View/Edit" on any user card
  - THEN a dialog opens showing the user's full name, email, and assigned roles
  - AND I can edit full name and email
  - AND clicking Save updates the profile via PATCH /api/admin/users/:id
  - AND roles are shown read-only (use Change Role for role changes)
  - AND a success toast is shown after saving

  **Implementation Status:** ✅ Complete  
  **API Endpoints:** `GET /api/admin/users/:id`, `PATCH /api/admin/users/:id`  
  **Frontend:** View/Edit button + edit dialog in `UserRoleManagement.tsx`  
  **Database Tables:** `users`

  ---

  ### US-INFRA-001: Dynamic Port Configuration
  **As a** Developer  
  **I want** the Vite dev server port and Playwright base URL to be driven by environment variables  
  **So that** the platform can run on any port without code changes

  **Acceptance Criteria:**
  - GIVEN `VITE_PORT` and `API_PORT` env vars are set
  - THEN Vite dev server starts on `VITE_PORT` (default 8082)
  - AND the API proxy targets `API_PORT` (default 3001)
  - AND Playwright uses `BASE_URL` / `API_URL` env vars for baseURL and webServer health checks
  - AND all e2e spec files read URLs from env vars with localhost fallbacks

  **Implementation Status:** ✅ Complete  
  **Files changed:** `vite.config.ts`, `playwright.config.ts`, `e2e/test-debug.spec.ts`, `e2e/event-crud-full.spec.ts`, `e2e/admin-operations.spec.ts`

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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 26 test cases (26/26 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 24 test cases (24/24 passing - 100%)  
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

  **Implementation Status:** ✅ Complete — B6 fix: `/api/admin/audit-logs` now merges `auditLog` + `activityLog` tables  
  **Test Coverage:** 9 test cases  
  **Database Tables:** `audit_logs`, `activity_logs`

  ---

  ### US-COMPLIANCE-005: Compliance Dashboard
  **As a** Compliance Officer  
  **I want to** view a centralised compliance dashboard  
  **So that** I can quickly see all outstanding actions across KYC, AML, and accreditation workflows

  **Acceptance Criteria:**
  - GIVEN I navigate to `/compliance`
  - THEN I see KPI cards: Pending KYC, Pending AML, Pending Accreditations, Audit Log count
  - AND I can navigate directly to each compliance workflow from the dashboard
  - AND urgent items (pending count > 0) are highlighted with an alert icon
  - AND the page is only accessible to compliance_officer and admin roles

  **Implementation Status:** ✅ Complete  
  **API Endpoint:** `GET /api/compliance/dashboard`  
  **Frontend Component:** `src/pages/compliance/ComplianceDashboard.tsx` → `/compliance`  
  **Database Tables:** `kyc_documents`, `aml_screenings`, `accreditations`, `audit_logs`

  ---

  ### US-COMPLIANCE-006: Dedicated Compliance Audit Logs
  **As a** Compliance Officer  
  **I want to** view a compliance-specific audit log page  
  **So that** I can track all KYC, AML, and accreditation actions I or other officers have taken

  **Acceptance Criteria:**
  - GIVEN I navigate to `/compliance/audit-logs`
  - THEN I see all compliance actions (verify_kyc, reject_kyc, initiate_aml_screening, clear_aml_screening, flag_aml_screening, verify_accreditation, reject_accreditation)
  - AND I can filter by action type
  - AND I can search by officer name or email
  - AND I can export filtered results to CSV
  - AND the page is only accessible to compliance_officer and admin roles

  **Implementation Status:** ✅ Complete  
  **API Endpoint:** `GET /api/compliance/audit-logs`  
  **Frontend Component:** `src/pages/compliance/AuditLogs.tsx` → `/compliance/audit-logs`  
  **Database Tables:** `audit_logs`

  ---

  ### US-COMPLIANCE-007: Initiate AML Screening
  **As a** Compliance Officer  
  **I want to** initiate AML screening for investors who have completed KYC  
  **So that** I can ensure investors are screened against PEP lists and sanctions databases before they invest

  **Acceptance Criteria:**
  - GIVEN I'm on the AML Screening Dashboard
  - WHEN I click "Initiate New Screening"
  - THEN I see a dialog listing investors with verified KYC but no AML screening
  - AND I can click "Screen" next to each investor to run the screening
  - AND the screening result (clear/flagged) is recorded with a match score and provider
  - AND the screening appears in the AML Screening list

  **Implementation Status:** ✅ Complete  
  **API Endpoints:** `POST /api/compliance/aml-screening`, `GET /api/compliance/unscreened-investors`  
  **Frontend Component:** `src/pages/compliance/AMLScreeningDashboard.tsx` — Initiate Screening dialog  
  **Database Tables:** `aml_screenings`, `audit_logs`

  ---

  ### US-COMPLIANCE-008: KYC Document URL Fix  
  **As a** Compliance Officer  
  **I want to** view and download investor documents without broken URLs  
  **So that** I can complete document verification efficiently

  **Acceptance Criteria:**
  - GIVEN I'm on the KYC Review Dashboard
  - WHEN I click "View" or download on a document
  - THEN the document opens at the correct URL (no double `/uploads/` prefix)

  **Implementation Status:** ✅ Complete — BUG-CO-002 fixed: `filePath` field already contains `/uploads/` prefix  
  **Frontend Component:** `src/pages/compliance/KYCReviewDashboard.tsx`

  ---

  ### US-COMPLIANCE-009: KYC Verify/Reject with Correct HTTP Method
  **As a** Compliance Officer  
  **I want to** verify or reject KYC documents with persisted notes  
  **So that** investors are properly notified and records are complete

  **Acceptance Criteria:**
  - GIVEN I'm viewing a pending KYC document
  - WHEN I approve/submit the verify or reject action
  - THEN the API call uses PUT (not PATCH) to match the backend endpoint
  - AND rejection reason is sent as the `notes` field (not `rejectionReason`)
  - AND an audit log entry is created for the action

  **Implementation Status:** ✅ Complete — BUG-CO-001 fixed  
  **API Endpoint:** `PUT /api/compliance/kyc-review/:id`  
  **Frontend Component:** `src/pages/compliance/KYCReviewDashboard.tsx`

  ---

  ### US-COMPLIANCE-010: Accreditation Documents Modal  
  **As a** Compliance Officer  
  **I want to** view submitted KYC documents when reviewing an accreditation application  
  **So that** I can verify the investor's income or net worth claims

  **Acceptance Criteria:**
  - GIVEN I'm viewing an accreditation application on `/compliance/accreditation`
  - WHEN I click "View Documents"
  - THEN I see the investor's submitted KYC documents (not an empty list)
  - AND I can download each document

  **Implementation Status:** ✅ Complete — BUG-CO-004 fixed: KYC documents fetched and included in accreditation response  
  **API Endpoint:** `GET /api/compliance/accreditation`  
  **Frontend Component:** `src/pages/compliance/AccreditationVerification.tsx`  
  **Database Tables:** `accreditations`, `kyc_documents`

  ---

  ### US-COMPLIANCE-011: Compliance Navigation Links
  **As a** Compliance Officer  
  **I want to** access all compliance tools from the main navigation  
  **So that** I can quickly switch between workflows without manual URL entry

  **Acceptance Criteria:**
  - GIVEN I'm logged in as a compliance_officer
  - THEN the navigation dropdown shows: Compliance Dashboard, KYC Review, AML Screening, Accreditation, Audit Logs
  - AND each link navigates to the correct compliance page
  - AND these links are NOT shown to investors, founders, or moderators

  **Implementation Status:** ✅ Complete — BUG-CO-007 fixed  
  **Frontend Component:** `src/components/Navigation.tsx`

  ---

  ### US-COMPLIANCE-012: AML Screening PATCH→PUT Fix
  **As a** Compliance Officer  
  **I want to** clear or flag AML screenings successfully  
  **So that** screening results are persisted in the database

  **Acceptance Criteria:**
  - GIVEN I'm on the AML Screening Dashboard
  - WHEN I clear or flag an investor's AML screening
  - THEN the API call uses PUT (not PATCH) to match the backend endpoint
  - AND flagged reasons are stored and displayed
  - AND an audit log entry captures the action

  **Implementation Status:** ✅ Complete — BUG-CO-003 fixed  
  **API Endpoint:** `PUT /api/compliance/aml-screening/:id`  
  **Frontend Component:** `src/pages/compliance/AMLScreeningDashboard.tsx`

  ---

  ### US-COMPLIANCE-013: Compliance Dashboard Route
  **As a** Compliance Officer  
  **I want to** access a centralised dashboard at `/compliance`  
  **So that** I have a home page for all compliance work

  **Acceptance Criteria:**
  - GIVEN I navigate to `/compliance`
  - THEN the page loads (no 404)
  - AND I see the Compliance Dashboard with KPI cards
  - GIVEN I navigate to `/compliance/audit-logs`
  - THEN the page loads showing compliance audit log entries

  **Implementation Status:** ✅ Complete — BUG-CO-006 fixed  
  **Frontend Components:** `ComplianceDashboard.tsx`, `AuditLogs.tsx`  
  **Routes added in:** `src/App.tsx`

  ---

  ### US-COMPLIANCE-014: AML Screening Response Shape
  **As a** Compliance Officer  
  **I want to** see investor names and screening details in the AML Screening Dashboard  
  **So that** I can identify which investor each screening row belongs to

  **Acceptance Criteria:**
  - GIVEN AML screenings exist in the database
  - WHEN I view the AML Screening Dashboard
  - THEN each row shows investorName, investorEmail, screeningDate, matchScore, screeningProvider
  - AND flaggedReasons are shown for flagged screenings

  **Implementation Status:** ✅ Complete — AML GET endpoint now maps fields properly; AMLScreening Prisma model extended  
  **API Endpoint:** `GET /api/compliance/aml-screening`  
  **Database Tables:** `aml_screenings` (new fields: provider, match_score, flagged_reasons, screening_results)

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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 8 test cases (8/8 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 25 test cases (25/25 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 14 test cases (14/14 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 16 test cases (16/16 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 9 test cases (9/9 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 16 test cases (16/16 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 16 test cases (16/16 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 13 test cases (13/13 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 11 test cases (11/11 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 13 test cases (13/13 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 17 test cases (17/17 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 13 test cases (13/13 passing - 100%)  
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

  **Implementation Status:** ✅ Complete (BUG-FOUNDER-001 fixed 2026-03-15: endpoint corrected to `/api/founders/applications`, field mapping fixed, data-testid added)  
  **Test Coverage:** 17 E2E test cases (`e2e/founder-bugs.spec.ts`)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 10 test cases (10/10 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 14 test cases (14/14 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 12 test cases (12/12 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 7 test cases (7/7 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 18 test cases (18/18 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 12 test cases (12/12 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 13 test cases (13/13 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 13 test cases (13/13 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 10 test cases (10/10 passing - 100%)  
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

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** 13 test cases (13/13 passing - 100%)  
  **Database Tables:** `mentorships`, `mentorship_sessions`

  ---

  ### US-OA-004: Deal Sourcing / Network Referrals
  **As an** operator angel  
  **I want to** refer startups from my network to the India Angel Forum  
  **So that** I can expand deal flow while leveraging my operator network

  **Acceptance Criteria:**
  - GIVEN I'm logged in as an operator angel
  - WHEN I navigate to `/operator/deal-sourcing`
  - THEN I can:
    - View all my previously submitted referrals with their status
    - Click "Submit Referral" to open a form
  - AND the form requires: company name, sector, funding stage, description, founder name, founder email
  - AND website is optional
  - WHEN I submit the referral
  - THEN it is saved with `SUBMITTED` status
  - AND I see it in my referrals list with date and status badge
  - AND the stats panel updates (total, under review, accepted counts)
  - WHEN an admin reviews my referral
  - THEN the status updates to `UNDER_REVIEW`, `ACCEPTED`, or `REJECTED`
  - AND any admin notes are visible on my referral
  - AND only operator angels / admins can access this page

  **Error Scenarios:**
  - IF I submit without required fields → validation errors shown inline
  - IF I'm a standard investor → 403 Access Denied on the page and API

  **Implementation Status:** ✅ Complete (2026-03-13)  
  **Test Coverage:** E2E tests (operator-angel.spec.ts — submit, list, admin review, access control)  
  **Database Tables:** `deal_referrals`  
  **API Endpoints:**
  - `GET /api/operator/deal-referrals` — list operator's own referrals
  - `POST /api/operator/deal-referrals` — submit new referral
  - `PATCH /api/admin/deal-referrals/:id` — admin update status/notes

  ---

  ### US-OA-005: Operator Performance Overview
  **As an** operator angel  
  **I want to** see a summary of my platform engagement and impact  
  **So that** I can understand and communicate my contributions to the forum

  **Acceptance Criteria:**
  - GIVEN I'm logged in as an operator angel
  - WHEN I navigate to `/operator/performance`
  - THEN I see a metrics dashboard with:
    - Total deal referrals submitted (all time)
    - Referrals accepted (with acceptance rate %)
    - Events attended (with upcoming count)
    - Engagement score (derived from events + referrals)
  - AND I see an activity summary list with natural language descriptions
  - AND metrics are based on real database records
  - AND only operator angels / admins can access this page

  **Error Scenarios:**
  - IF I'm a standard investor → 403 Access Denied on the page and API

  **Implementation Status:** ✅ Complete (2026-03-13)  
  **Test Coverage:** E2E tests (operator-angel.spec.ts — metrics display, API response, access control)  
  **Database Tables:** `deal_referrals`, `event_attendance`  
  **API Endpoints:**
  - `GET /api/operator/performance-summary` — aggregated engagement metrics

  ---



  ### US-AUTH-001: Role-Based Route Protection
  **As a** platform user  
  **I want** routes to be protected based on my role  
  **So that** I can only access pages I'm authorized to view

  **Acceptance Criteria:**
  - GIVEN I'm logged in with a specific role
  - WHEN I navigate to a protected route
  - THEN access is granted only if my role is authorized
  - AND unauthorized access shows a 403 Forbidden page
  - AND unauthenticated access redirects to /auth
  - AND the 403 page explains the access denial with helpful guidance
  - AND a link is provided to return to appropriate dashboard

  **Route Authorization Matrix:**
  | Route Pattern | Allowed Roles |
  |--------------|---------------|
  | `/admin/*` | admin |
  | `/compliance/*` | compliance_officer, admin |
  | `/investor/*` | investor, operator_angel, family_office, admin |
  | `/founder/*` | founder, admin |
  | `/moderator/*` | moderator, admin |
  | `/operator/*` | operator_angel, admin |

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** E2E tests (authorization.spec.ts — role-based route guards verified across all 5 browser projects)  
  **Database Tables:** `user_roles`

  ---

  ### US-AUTH-002: API Endpoint Authorization
  **As a** backend system  
  **I want** API endpoints to verify user roles before processing requests  
  **So that** sensitive data is protected from unauthorized access

  **Acceptance Criteria:**
  - GIVEN a user makes an API request with a valid JWT
  - WHEN the endpoint requires a specific role
  - THEN the middleware checks the user's roles from the JWT
  - AND returns 403 Forbidden if role is not authorized
  - AND returns 401 Unauthorized if no valid token
  - AND successful authorization proceeds to the handler
  - AND authorization failures are logged for security audit

  **API Authorization Matrix:**
  | Endpoint Pattern | Required Roles |
  |-----------------|----------------|
  | `GET/PUT/DELETE /api/admin/*` | admin |
  | `GET/PUT /api/compliance/*` | compliance_officer, admin |
  | `GET/PUT/DELETE /api/applications/founders` | admin, moderator |
  | `GET/PUT/DELETE /api/applications/investors` | admin, moderator |
  | `GET/POST /api/deals` | investor, operator_angel, family_office, admin |
  | `GET/POST /api/commitments` | investor, operator_angel, family_office |
  | `GET/POST /api/pitch/*` | founder |
  | `GET/PUT /api/company/*` | founder |

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** E2E tests (authorization.spec.ts — 403 enforcement on all protected routes)  
  **Database Tables:** `user_roles`, `audit_logs`

  ---

  ### US-AUTH-003: Forbidden Access Page (WCAG 2.2 AA)
  **As a** user who attempts to access an unauthorized page  
  **I want** to see a clear, accessible error page  
  **So that** I understand why I cannot access the page and what to do next

  **Acceptance Criteria:**
  - GIVEN I navigate to a page I'm not authorized to view
  - THEN I see a 403 Forbidden page with:
    - Clear heading "Access Denied" (h1)
    - Explanation of why access was denied
    - My current role displayed
    - Link to return to my dashboard
    - Contact support link if access seems incorrect
  - AND the page is fully keyboard navigable
  - AND the page announces correctly to screen readers
  - AND color contrast meets WCAG 2.2 AA (≥4.5:1)
  - AND the page is responsive (mobile, tablet, desktop)
  - AND focus is managed properly (no focus trap)

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** E2E tests (authorization.spec.ts — AccessDenied page verified with heading, role display, keyboard nav, WCAG 2.2 AA contrast)  
  **Database Tables:** None

  ---

  ### US-AUTH-004: Admin Dashboard Data Verification
  **As an** Admin  
  **I want** the admin dashboard to display accurate real-time data  
  **So that** I can make informed decisions about platform management

  **Acceptance Criteria:**
  - GIVEN I'm logged in as admin
  - WHEN I view the admin dashboard
  - THEN I see accurate counts of:
    - Total users by role
    - Pending applications (founder + investor)
    - Active events with registration counts
    - Recent audit log entries
  - AND data refreshes when I navigate back to the page
  - AND loading states are shown while fetching
  - AND errors are displayed if data fetch fails
  - AND empty states are shown when no data exists

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** E2E tests (admin-operations.spec.ts — dashboard stats, user counts, event counts verified)  
  **Database Tables:** `users`, `user_roles`, `applications`, `events`, `audit_logs`

  ---

  ### US-AUTH-005: Compliance Dashboard Data Verification
  **As a** Compliance Officer  
  **I want** the compliance dashboard to display accurate KYC/AML data  
  **So that** I can efficiently process verification requests

  **Acceptance Criteria:**
  - GIVEN I'm logged in as compliance officer
  - WHEN I view the compliance dashboard
  - THEN I see:
    - Pending KYC reviews with document counts
    - Pending AML screenings with risk flags
    - Upcoming accreditation expirations
    - Recent compliance actions
  - AND I can filter by status (pending, approved, rejected)
  - AND I can sort by date submitted or priority
  - AND the UI updates after taking actions

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** E2E tests (compliance-kyc.spec.ts — KYC/AML/accreditation data verified)  
  **Database Tables:** `kyc_documents`, `aml_screenings`, `accreditations`

  ---

  ### US-AUTH-006: Investor Dashboard Data Verification
  **As an** Investor  
  **I want** my dashboard to display my personalized investment data  
  **So that** I can track my deal pipeline and portfolio

  **Acceptance Criteria:**
  - GIVEN I'm logged in as an investor (standard, operator_angel, or family_office)
  - WHEN I view the investor dashboard/deals page
  - THEN I see:
    - Available deals matching my preferences
    - My expressed interests with status
    - My commitments with payment status
    - My portfolio companies with valuations
  - AND only deals I have access to are shown
  - AND my KYC/accreditation status is visible
  - AND I see prompts if KYC is incomplete

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** E2E tests (crud-operations.spec.ts, deal-management.spec.ts — deal browsing, interests, commitments, portfolio verified)  
  **Database Tables:** `deals`, `deal_interests`, `commitments`, `portfolio_companies`

  ---

  ### US-AUTH-007: Founder Dashboard Data Verification
  **As a** Founder  
  **I want** my dashboard to display my company and fundraising data  
  **So that** I can manage my fundraising journey

  **Acceptance Criteria:**
  - GIVEN I'm logged in as a founder
  - WHEN I view the founder dashboard
  - THEN I see:
    - My application status
    - My company profile (if approved)
    - My pitch sessions (scheduled and past)
    - My fundraising round progress
    - Investor interest in my company
  - AND I see prompts to complete profile if incomplete
  - AND I see next steps based on my status

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** E2E tests (application-crud-full.spec.ts — application status, pitch sessions, company profile verified)  
  **Database Tables:** `founder_applications`, `companies`, `pitch_sessions`, `fundraising_rounds`

  ---

  ### US-AUTH-008: Moderator Dashboard Data Verification
  **As a** Moderator  
  **I want** to view pending moderation tasks  
  **So that** I can maintain platform quality

  **Acceptance Criteria:**
  - GIVEN I'm logged in as a moderator
  - WHEN I view the moderator dashboard
  - THEN I see:
    - Pending founder applications to screen
    - Pending investor applications to screen
    - Content flags requiring review
    - Event attendance to manage
  - AND items are prioritized by submission date
  - AND I can take action directly from the list

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** E2E tests (admin-registrations.spec.ts, application-crud-full.spec.ts — moderation tasks verified)  
  **Database Tables:** `founder_applications`, `investor_applications`, `content_flags`

  ---

  ### US-AUTH-009: Operator Angel Dashboard Data Verification
  **As an** Operator Angel  
  **I want** to see both investment and advisory data  
  **So that** I can manage my dual role effectively

  **Acceptance Criteria:**
  - GIVEN I'm logged in as an operator angel
  - WHEN I view the operator dashboard
  - THEN I see:
    - Available deals (as an investor)
    - My advisory profile and requests
    - My mentorship relationships
    - Advisory hours logged this month
  - AND I can switch between investor and advisory views
  - AND metrics show my impact as an advisor

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** E2E tests (authorization.spec.ts, crud-operations.spec.ts — advisory profiles, deal access, mentorship verified)  
  **Database Tables:** `deals`, `advisory_profiles`, `mentorships`, `advisory_hours`

  ---

  ### US-AUTH-010: Admin Login to Dashboard Flow
  **As an** Admin  
  **I want** to log in and be able to access the admin dashboard  
  **So that** I can manage the platform after authenticating

  **Acceptance Criteria:**
  - GIVEN I am on the login page at /auth
  - WHEN I enter valid admin credentials (admin@indiaangelforum.test / Admin@12345)
  - AND I click "Sign In"
  - THEN I am redirected to my dashboard
  - AND when I navigate to /admin, I see the admin dashboard
  - AND I do NOT see the AccessDenied page
  - AND my roles are properly stored in localStorage
  - AND subsequent visits to /admin work correctly

  **Error Scenarios:**
  - IF I use wrong email → shows "Invalid credentials" error
  - IF I use wrong password → shows "Invalid credentials" error
  - IF I use non-admin credentials and visit /admin → shows AccessDenied with my actual role
  - IF my session expires → redirected to /auth

  **Test Credentials:**
  - Email: `admin@indiaangelforum.test`
  - Password: `Admin@12345`
  - Expected roles: `['admin']`

  **Bug Fix (Feb 2026):**
  The AdminDashboard component was making a redundant API call to `/api/auth/check-role` to verify 
  admin role, but the apiClient didn't have the auth token set. This caused "Access token required" 
  errors and showed AccessDenied even when ProtectedRoute correctly verified the admin role.

  **Resolution:** 
  - Removed redundant API role check from AdminDashboard.tsx
  - AdminDashboard now uses `user.roles` from AuthContext directly (set by ProtectedRoute)
  - ProtectedRoute is the single source of truth for role verification

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** E2E tests (Playwright)  
  **E2E Test File:** e2e/authorization.spec.ts  
  **Database Tables:** `users`, `user_roles`

  ---

  ### US-AUTH-011: AccessDenied Page Shows User's Current Role
  **As a** user who attempts to access an unauthorized page  
  **I want** to see my current role on the AccessDenied page  
  **So that** I understand why I'm denied and can verify I'm logged in correctly

  **Acceptance Criteria:**
  - GIVEN I'm logged in with a non-admin role (e.g., investor)
  - WHEN I navigate to an admin-only page (/admin)
  - THEN I see the AccessDenied page
  - AND the page shows "Your current role: Investor" (my actual role)
  - AND the page shows "Required role: Admin" (the role needed)
  - AND there's a link back to my appropriate dashboard
  - AND the information is readable and accessible

  **Implementation Status:** ✅ Complete  
  **Test Coverage:** E2E tests (authorization.spec.ts — AccessDenied page shows current role vs required role)  
  **Database Tables:** `user_roles`

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

  ### Phase 1: Critical Features (4 weeks) ✅ COMPLETE
  - ✅ US-COMPLIANCE-001: Review KYC Documents (14/14 tests - 100%)
  - ✅ US-COMPLIANCE-002: Perform AML Screening (26/26 tests - 100%)
  - ✅ US-COMPLIANCE-003: Verify Accredited Investor Status (24/24 tests - 100%)
  - ✅ US-ADMIN-001: User Management (15/15 tests - 100%)
  - ✅ US-ADMIN-002: Role Assignment (15/15 tests - 100%)
  - ✅ US-ADMIN-003: Event Management (19/19 tests - 100%)
  - ✅ US-INVESTOR-002: Upload KYC Documents (8/8 tests - 100%)
  - ✅ US-INVESTOR-001: Submit Application (26/26 tests - 100%)

  ### Phase 2: Deal Management (4 weeks) ✅ COMPLETE
  - ✅ US-INVESTOR-003: Browse Available Deals (25/25 tests - 100%)
  - ✅ US-INVESTOR-004: Express Interest in Deal (14/14 tests - 100%)
  - ✅ US-INVESTOR-005: Track Deal Pipeline (10/10 tests - 100%)
  - ✅ US-INVESTOR-006: View Deal Documents (2/2 tests - 100%)
  - ✅ US-INVESTOR-007: Submit Investment Commitment (7/7 tests - 100%)
  - ✅ US-FOUNDER-001: Submit Founder Application (17/17 tests - 100%) [BUG-FOUNDER-001 fixed]
  - ✅ US-FOUNDER-002: Track Application Status (8/8 tests - 100%)

  ### Phase 3: SPV & Portfolio (3 weeks) ✅ COMPLETE
  - ✅ US-INVESTOR-008: Create SPV (16/16 tests - 100%)
  - ✅ US-INVESTOR-009: Invite Co-Investors to SPV (9/9 tests - 100%)
  - ✅ US-INVESTOR-010: Track SPV Allocations (16/16 tests - 100%)
  - ✅ US-INVESTOR-011: View Portfolio Dashboard (16/16 tests - 100%)
  - ✅ US-INVESTOR-012: Track Portfolio Performance (13/13 tests - 100%)
  - ✅ US-INVESTOR-013: Access Portfolio Company Updates (11/11 tests - 100%)

  ### Phase 4: Founder & Communication (3 weeks) ✅ COMPLETE
  - ✅ US-FOUNDER-003: Access Investor Profiles (10/10 tests - 100%)
  - ✅ US-FOUNDER-004: Schedule Pitch Sessions (14/14 tests - 100%)
  - ✅ US-FOUNDER-005: Upload Pitch Deck (12/12 tests - 100%)
  - ✅ US-FOUNDER-006: Receive Investor Feedback (7/7 tests - 100%)
  - ✅ US-INVESTOR-014: Send Direct Messages (13/13 tests - 100%)
  - ✅ US-INVESTOR-015: Create Discussion Threads (17/17 tests - 100%)

  ### Phase 5: Platform Operations (2 weeks) ✅ COMPLETE
  - ✅ US-MODERATOR-001: Screen Founder Applications (18/18 tests - 100%)
  - ✅ US-MODERATOR-002: Review Event Attendance (12/12 tests - 100%)
  - ✅ US-MODERATOR-003: Manage Content Flags (13/13 tests - 100%)
  - ✅ US-ADMIN-004: Application Review (26/26 tests - 100%)
  - ✅ US-ADMIN-005: System Statistics (10/10 tests - 100%)
  - ✅ US-ADMIN-006: Audit Logs (9/9 tests - 100%)

  ### Phase 6: Value-Add Features (2 weeks) ✅ COMPLETE
  - ✅ US-OPERATOR-001: Offer Advisory Services (13/13 tests - 100%)
  - ✅ US-OPERATOR-002: Track Advisory Hours (10/10 tests - 100%)
  - ✅ US-OPERATOR-003: Mentor Startups (13/13 tests - 100%)
  - ✅ US-INVESTOR-016: Set Communication Preferences (13/13 tests - 100%)

  ### Phase 7: Moderator Panel & India Compliance (2026-03-13-Moderator) ✅ COMPLETE

  #### Bug Fixes
  - ✅ BUG-MOD-01: Content flags table missing — Added ContentFlag Prisma model, migration, and `/api/moderator/flags` API routes
  - ✅ BUG-MOD-02: Discount code crash (`undefined.toLocaleString()`) — Flattened discount API response to root-level fields (`discountedPrice`, `discountAmount`, `originalPrice`)
  - ✅ BUG-MOD-03: Persona redirect to wrong port (8080→3002) — Fixed `APP_BASE_URL` default in `server/routes/identity-verification.ts`
  - ✅ BUG-MOD-04: Event attendance shows only 3 of 5 records — Changed RSVP filter from `{ in: ['CONFIRMED', 'WAITLIST'] }` to `{ not: 'CANCELLED' }`
  - ✅ BUG-MOD-05: No moderator panel link in navigation — Added `data-testid="nav-moderator-panel"` link in `Navigation.tsx` for moderator role
  - ✅ BUG-MOD-06: Moderator sub-routes returning 404 — Added `/moderator/users`, `/moderator/reports`, `/moderator/attendance`, `/moderator/compliance` routes (both API and frontend)

  #### Moderator User Stories
  - ✅ US-MOD-101: Moderator panel accessible from navigation (21 E2E tests)
  - ✅ US-MOD-102: Manage content flags — create, review, resolve flags with reason categories (SPAM, HARASSMENT, INAPPROPRIATE, MISINFORMATION, OTHER)
  - ✅ US-MOD-103: User management — paginated user list with search, warn/suspend dialogs (`/moderator/users`)
  - ✅ US-MOD-104: Moderator can issue warnings logged in audit trail (API: `POST /api/moderator/users/:id/warn`)
  - ✅ US-MOD-105: Moderation reports — flag stats by reason, resolution breakdown, application stats, CSV export (`/moderator/reports`)
  - ✅ US-MOD-106: Content flag lifecycle — pending → reviewed with resolution (REMOVED, WARNING_ISSUED, USER_SUSPENDED, FALSE_POSITIVE)
  - ✅ US-MOD-107: Moderator flag statistics — counts by reason via `GET /api/moderator/flags/stats`
  - ✅ US-MOD-108: All-events attendance view — paginated across all events with per-event CSV download (`/moderator/attendance`)

  #### India Regulatory Compliance User Stories
  - ✅ US-REG-001: SEBI AIF Compliance Check — verify AIF category (Cat I/II/III), minimum ticket size, accredited investor status (`/moderator/compliance` → SEBI tab)
  - ✅ US-REG-002: FEMA/FDI Screening — screen foreign investment by sector, determine FDI cap, RBI approval requirement, automatic/approval-required/prohibited status
  - ✅ US-REG-003: DPIIT Startup Verification — record DPIIT certificate number, verify startup recognition, flag 80-IAC tax benefit eligibility
  - ✅ US-REG-004: Compliance dashboard with tabbed UI — unified `/moderator/compliance` page with SEBI, FEMA, DPIIT, AML tabs
  - ✅ US-REG-005: AML Screening Summary — total screened, flagged, cleared, pending counts with recent flag details

  ### Phase 8: Operator Angel (2026-03-13-OperatorAngel) ✅ COMPLETE

  #### Bug Fixes
  - ✅ BUG-OA-001: My Registrations blank after RSVP — `MyRegistrations.tsx` filtered by `isFuture()` only. Fixed to show BOTH upcoming events and past events (last 90 days) in separate sections. Also fixed `useCancelRegistration` to dispatch to `DELETE /api/events/:id/rsvp` for attendance-sourced records. Added `data-testid="upcoming-registrations-section"` and `data-testid="past-registrations-section"`.
  - ✅ BUG-OA-002: Persona identity verification redirects to port 3002 — Fixed `APP_BASE_URL` default fallback from `http://localhost:3002` to `http://localhost:8082` in `server/routes/identity-verification.ts`.
  - ✅ BUG-OA-003: Admin application status update silently failing — `AdminDashboard.tsx` `updateApplicationStatus()` called `/api/applications/investors/:id` (non-existent path). Fixed to use correct admin endpoint `/api/admin/applications/investors/:id`.

  #### Operator Angel User Stories
  - ✅ US-OA-004: Deal Sourcing / Network Referrals — Operators can submit startup referrals from their network. New Prisma model `DealReferral`. Page at `/operator/deal-sourcing`. Admin can review/approve/reject via `PATCH /api/admin/deal-referrals/:id`.
  - ✅ US-OA-005: Operator Performance Overview — Operators see engagement metrics (total referrals, accepted referrals, events attended, engagement score) at `/operator/performance`. Backed by `GET /api/operator/performance-summary`.

  ### Phase 9: Founder Role Bugs (2026-03-13-FounderBugs) ✅ COMPLETE

  #### Bug Fixes
  - ✅ BUG-FOUNDER-001 (CRITICAL): Founder application form submits to wrong endpoint — `FounderApplicationForm.tsx` `onSubmit()` called `/api/applications/founder` (route does not exist → 404 silently) and sent snake_case field names incompatible with the server. Fixed: updated to call `/api/founders/applications` with correct camelCase field mapping (`company_name` → `companyName`, `founder_name` → `fullName`, `founder_email` → `email`, `industry_sector` → `industry`, `stage` → `fundingStage`, `amount_raising` → `fundingRequired`, etc.). Also added `data-testid` attributes (`field-company-name`, `field-founder-name`, `field-founder-email`, `field-founder-phone`, `field-amount-raising`, `btn-submit-founder-application`, `input-*`) for full E2E traceability.
  - ✅ BUG-FOUNDER-002 (HIGH): Events page "My Registrations" blank for Founder — same root cause as BUG-OA-001. `GET /api/events/my-registrations` only queried `event_registrations` table; Founder's RSVPs were in `event_attendance` (RSVP flow). Fix already applied in Phase 8 (BUG-OA-001 fix). Confirmed: 1 attendance record returned for `founder@startup.test`, `_source: 'attendance'`. API, UI, and E2E tests all green.
  - ✅ BUG-FOUNDER-003 (HIGH): Persona Identity Verification redirects to wrong port — same root cause as BUG-OA-002. `APP_BASE_URL` defaulted to `http://localhost:3002` (Docker port). Fix already applied in Phase 8 (BUG-OA-002 fix). Confirmed: `POST /api/verification/start` returns `inquiryUrl` containing `localhost:8082`, not `3002`.

  #### Founder User Stories (Re-verified)
  - ✅ US-FOUNDER-001: Submit Founder Application — complete end-to-end flow verified: form submits to `/api/founders/applications`, DB record persists with `SUBMITTED` status, admin can view and update via `/api/admin/applications/founders`. **17 new E2E tests in `e2e/founder-bugs.spec.ts`** covering API CRUD, UI form submission, persisted DB records, authorization (403/401), and admin review flow.




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

  ## Investor (Primary) — Phase 8 User Stories (US-INV-101 to US-INV-118)

  > Branch: `2026-03-14-Investor` · Migration: `20260314152013_add_investor_profile`

  ### US-INV-101: View Deal Detail Page
  **As an** investor  
  **I want to** click a deal and see its full details  
  **So that** I can make an informed investment decision

  **Acceptance Criteria:**
  - GIVEN I navigate to `/deals/:dealId`
  - THEN I see company name, sector, stage, deal size, min investment, valuation, status
  - AND I see a SEBI regulatory disclosure (US-INV-113)
  - AND I see an "Express Interest" button if I haven't already

  **Implementation Status:** ✅ Complete (`src/pages/investor/DealDetail.tsx`, slug-lookup in `GET /api/deals/:id`)  
  **Bug Fixed:** B1 — No DealDetail component / no `/deals/:dealId` route

  ---

  ### US-INV-102: View SPV List
  **As an** investor  
  **I want to** browse all SPVs I'm eligible to join  
  **So that** I can evaluate co-investment opportunities

  **Acceptance Criteria:**
  - GIVEN I navigate to `/investor/spv`
  - THEN I see a list of SPVs with target/committed/members/carry

  **Implementation Status:** ✅ Complete (`src/pages/investor/InvestorSPVList.tsx`)  
  **Bug Fixed:** B2 — Route `/investor/spv` was missing from App.tsx

  ---

  ### US-INV-103: View My Commitments
  **As an** investor  
  **I want to** see all my investment commitments  
  **So that** I can track what I've committed

  **Acceptance Criteria:**
  - GIVEN I navigate to `/investor/commitments`
  - THEN I see a list of my commitments with totals

  **Implementation Status:** ✅ Complete (`src/pages/investor/InvestorCommitments.tsx`)  
  **Bug Fixed:** B2 — Route `/investor/commitments` was missing from App.tsx

  ---

  ### US-INV-104: Portfolio Performance Charts
  **As an** investor  
  **I want to** see performance metrics for my portfolio  
  **So that** I can measure IRR, sector/stage breakdown, and time-series returns

  **Acceptance Criteria:**
  - GIVEN I navigate to `/investor/portfolio/performance`
  - THEN the page loads without an error (returns data or empty state)
  - AND `GET /api/portfolio/performance` returns `{ overview, by_sector, by_stage, performance_over_time }`

  **Implementation Status:** ✅ Complete (110-line endpoint added to `server.ts`)  
  **Bug Fixed:** B3 — `GET /api/portfolio/performance` endpoint was missing

  ---

  ### US-INV-105 / US-INV-106: Transaction History, Certificates, Activity
  **As an** investor  
  **I want to** access `/investor/transactions`, `/investor/certificates`, `/investor/activity`  
  **So that** all my financial history routes work

  **Implementation Status:** ✅ Complete (3 alias routes added to `App.tsx`)  
  **Bug Fixed:** B2 — Routes were undeclared

  ---

  ### US-INV-107: Investor Dashboard KPIs
  **As an** investor  
  **I want to** see a summary dashboard  
  **So that** I can see key metrics at a glance

  **Acceptance Criteria:**
  - GIVEN I navigate to `/investor/dashboard`
  - THEN I see KPI cards: Portfolio Value, Total Committed, Portfolio Companies, Active Deals, My Interests, Active SPVs, Unread Messages, Pending KYC

  **Implementation Status:** ✅ Complete (`src/pages/investor/InvestorDashboard.tsx`, `GET /api/investor/dashboard`)

  ---

  ### US-INV-108: Real User Roles in Messaging Recipient Dropdown
  **As an** investor  
  **I want to** see real user roles and emails in the message recipient dropdown  
  **So that** I can find the right person to contact

  **Acceptance Criteria:**
  - GIVEN I open the new message form
  - THEN each user displays as `Full Name (role) — email@example.com`
  - AND `/api/users` returns real roles (not hardcoded 'user'), sorted by name

  **Implementation Status:** ✅ Complete (fixed `GET /api/users` in `server.ts` + `DirectMessages.tsx`)  
  **Bug Fixed:** B4/B5 — `GET /api/users` used hardcoded `role: 'user'` and newest-first sort

  ---

  ### US-INV-109: Email in Messaging Recipients
  **As an** investor  
  **I want to** see the email address next to each user's name/role when composing a message  
  **So that** I'm certain I'm contacting the right person

  **Implementation Status:** ✅ Complete (`DirectMessages.tsx` display updated)

  ---

  ### US-INV-110: Investor Navigation Links
  **As an** investor  
  **I want to** see investor-specific navigation items in my account menu  
  **So that** I can navigate my features quickly

  **Acceptance Criteria:**
  - GIVEN I'm logged in as an investor
  - THEN the navigation dropdown includes: Dashboard, Portfolio, Deal Pipeline, KYC, Messages

  **Implementation Status:** ✅ Complete (`src/components/Navigation.tsx` updated with investor nav links)  
  **Bug Fixed:** B6 — Navigation had no investor-specific links

  ---

  ### US-INV-111: Withdraw Deal Interest
  **As an** investor  
  **I want to** cancel a deal interest I expressed  
  **So that** I can remove it from my pipeline

  **Acceptance Criteria:**
  - GIVEN I have a `pending` deal interest in `/investor/pipeline`
  - THEN I see a "Withdraw Interest" button
  - WHEN I click it, the interest is deleted via `DELETE /api/deals/interests/:id`

  **Implementation Status:** ✅ Complete (`DealPipeline.tsx` updated with `withdrawInterest()` + button)

  ---

  ### US-INV-112: Investor Profile (InvestorProfile Model)
  **As an** investor  
  **I want to** have a dedicated profile with India-specific regulatory fields  
  **So that** the platform can manage my accreditation status, KYC, and tax details

  **Acceptance Criteria:**
  - GIVEN the `investor_profiles` table exists
  - THEN `GET /api/investor/profile` returns my profile (auto-created on first fetch)
  - AND `PATCH /api/investor/profile` persists updates

  **Implementation Status:** ✅ Complete (Prisma model `InvestorProfile`, migration `20260314152013_add_investor_profile`, GET/PATCH endpoints)  
  **Bug Fixed:** B7 — No `investor_profiles` table existed

  ---

  ### US-INV-113: SEBI Disclosure on Deal Detail
  **As an** investor  
  **I want to** see a SEBI regulatory disclosure on every deal page  
  **So that** I'm informed of my legal rights and the platform's compliance obligations

  **Implementation Status:** ✅ Complete (`[data-testid="sebi-disclosure"]` in `DealDetail.tsx`)

  ---

  ### US-INV-114 / US-INV-115: PAN, Demat, NRI / FEMA Status
  **As an** investor  
  **I want to** record my PAN number, demat account, NRI status, and FEMA applicability  
  **So that** the platform complies with SEBI / RBI regulations

  **Implementation Status:** ✅ Complete (`InvestorProfilePage.tsx` — Identity & Regulatory section)

  ---

  ### US-INV-116: TDS Information
  **As an** investor  
  **I want to** see my year-to-date TDS deducted  
  **So that** I can reconcile tax records

  **Implementation Status:** ✅ Complete (`InvestorProfilePage.tsx` — TDS section, `tdsDeductedYtd` field in `InvestorProfile`)

  ---

  ### US-INV-117: eSign Reference
  **As an** investor  
  **I want to** record and view my eSign reference  
  **So that** I can track my electronically signed documents

  **Implementation Status:** ✅ Complete (`InvestorProfilePage.tsx` — eSign section, `eSignReference` field)

  ---

  ### US-INV-118: Nominee Details
  **As an** investor  
  **I want to** record my investment nominee name and relation  
  **So that** my investments are transferable in case of death

  **Implementation Status:** ✅ Complete (`InvestorProfilePage.tsx` — Nominee section, `nomineeName` + `nomineeRelation` fields)

  ---

  **Document Status:** ✅ ALL USER STORIES COMPLETE — Phase 8 investor primary features + India compliance added  
  **Last Updated:** March 14, 2026  
  **Implementation Complete:** March 14, 2026 (branch: 2026-03-14-Investor)  
  **Owner:** Product Management Team

  ---

  ## Investor Secondary — B8/B9/B10 + US-INV-201..209

  ### B8 Fix: RSVP endpoints missing
  **Bug:** `POST /api/events/:id/rsvp` and related endpoints did not exist  
  **Fix:** Added `GET/POST/DELETE /api/events/:id/rsvp` + `GET /api/events/:id/my-rsvp`  
  **Implementation Status:** ✅ Complete (server.ts)

  ---

  ### B9 Fix: InvestorApplicationForm not pre-filling from auth
  **Bug:** Form defaultValues were empty strings; user had to retype name and email  
  **Fix:** `useAuth()` + `useEffect` to pre-fill `full_name` and `email` from JWT  
  **Implementation Status:** ✅ Complete (`InvestorApplicationForm.tsx`)

  ---

  ### B10 Fix: Unapproved investor navigated away from Deals
  **Bug:** `DealsPage` called `toast + navigate('/apply/investor')` — no persistence  
  **Fix:** Sets `accessRestricted = true`, loads public deals, shows inline `OnboardingBanner`  
  **Implementation Status:** ✅ Complete (`DealsPage.tsx`)

  ---

  ### US-INV-201: Onboarding Banner / Checklist
  **As an** unapproved investor  
  **I want to** see my onboarding progress as a checklist  
  **So that** I know exactly what steps remain before I can access deals  
  **Implementation Status:** ✅ Complete (`OnboardingBanner.tsx`, shown on ApplyInvestor + DealsPage)

  ---

  ### US-INV-202: Application Form Auto-populate (= B9)
  **As an** investor  
  **I want to** have my name and email pre-filled in the application form  
  **So that** I don't have to retype information already in my account  
  **Implementation Status:** ✅ Complete (`InvestorApplicationForm.tsx`)

  ---

  ### US-INV-203: Application Status Tracking
  **As an** investor  
  **I want to** check the status of my investor application  
  **So that** I know whether it is pending, under review, approved, or rejected  
  **Implementation Status:** ✅ Complete (`/apply/investor/status` → `ApplicationStatus.tsx`)

  ---

  ### US-INV-204: Reliable RSVP Persisted to DB (= B8)
  **As an** investor  
  **I want to** RSVP to events and have that persisted  
  **So that** my attendance is recorded  
  **Implementation Status:** ✅ Complete (`POST /api/events/:id/rsvp`, `EventAttendance` table)

  ---

  ### US-INV-205: Dietary Requirements in RSVP
  **As an** investor  
  **I want to** specify dietary requirements when RSVPing to an event  
  **So that** the organiser can accommodate my needs  
  **Implementation Status:** ✅ Complete (`dietaryRequirements` field added to `EventAttendance`; input in `EventDetail.tsx`)

  ---

  ### US-INV-207: Public Deal Preview for Unapproved Investors
  **As an** unapproved investor  
  **I want to** see a limited public preview of available deals  
  **So that** I am motivated to complete my application  
  **Implementation Status:** ✅ Complete (`GET /api/deals/public` — max 6 open deals, shown in `DealsPage` when `accessRestricted`)

  ---

  ### US-INV-208: SEBI Accredited Investor Self-Declaration
  **As an** investor applying for access  
  **I want to** declare that I meet SEBI accreditation criteria  
  **So that** the platform complies with SEBI regulations  
  **Implementation Status:** ✅ Complete (`sebi_declaration` checkbox + DB field on `InvestorApplication`)

  ---

  ### US-INV-209: PAN Number Field on Application
  **As an** investor applying for access  
  **I want to** provide my PAN number during the application  
  **So that** my identity can be verified for regulatory compliance  
  **Implementation Status:** ✅ Complete (`pan_number` field + validation in `InvestorApplicationForm.tsx`)

  ---

  **Document Status:** ✅ ALL USER STORIES COMPLETE — Phase 9 investor secondary features added  
  **Last Updated:** March 14, 2026  
  **Implementation Complete:** March 14, 2026 (branch: 2026-03-14-InvestorSec)  
  **Owner:** Product Management Team

  ---

  ## Phase 10: Family Office Role — Bug Fixes & New Features

  > Branch: `2026-03-14-FamilyOffice` | Test user: `family.office@test.com` / `FamilyOffice@12345` (Rajesh Mehta)

  ### Bug Fixes

  #### B1: Event RSVP Persists to DB
  **Reported:** RSVP UI showed success but no DB record created for FO user  
  **Root Cause:** Pre-existing fix from PR #12 (US-INV-204/205) — endpoints were already correct  
  **Implementation Status:** ✅ Verified via E2E test `FO-B1-001` — RSVP confirmed in DB

  #### B2: "In Progress" Status Without Application Record
  **Reported:** Deals page displayed "In Progress" badge on Step 1 of onboarding when no application existed  
  **Root Cause:** `OnboardingBanner.tsx` showed "In Progress" for `step.status === "current"` even when `!isSubmitted`  
  **Fix:** Added conditional: `step.id === 1 && !isSubmitted ? "Not Started" : "In Progress"`  
  **File:** `src/components/investor/OnboardingBanner.tsx`  
  **Implementation Status:** ✅ Complete

  #### B3: `/investor/financial-statements` and `/investor/membership` Return 404
  **Reported:** Routes `/investor/financial-statements` and `/investor/membership` were not registered  
  **Fix:** Added redirect routes in `App.tsx`:  
  - `/investor/financial-statements` → redirects to `/financial-statements`  
  - `/investor/membership` → redirects to `/membership`  
  **File:** `src/App.tsx`  
  **Implementation Status:** ✅ Complete

  #### B4: `/investor/spvs` (Plural) Returns 404
  **Reported:** `/investor/spvs` (plural) returned 404 while only `/investor/spv` (singular) existed  
  **Fix:** Added `<Navigate to="/investor/spv" replace />` for `/investor/spvs`  
  **File:** `src/App.tsx`  
  **Implementation Status:** ✅ Complete

  ---

  ### New User Stories

  ### US-FO-01: Family Office Application Form — Entity & Investment Details
  **As a** Family Office investor  
  **I want to** provide entity-specific details (trust name, entity type, AUM, beneficiaries, investment mandate) during my membership application  
  **So that** the forum can properly onboard and categorize my family office structure  
  **Acceptance Criteria:**
  - Family Office section appears conditionally when "Family Office" is selected as membership type
  - Entity Name, Entity Type (TRUST/HUF/LLP/INDIVIDUAL), AUM Managed (₹ Crores), Number of Beneficiaries, Trustee Names, Investment Mandate (GROWTH_EQUITY/SEED/DEBT/MIXED) fields collected
  - Fields persisted to `investor_applications` DB table via `POST /api/applications/investor`
  - E2E: `FO-FO01-001`, `FO-FO01-002`, `FO-FO01-API-001`  
  **Implementation Status:** ✅ Complete
  - Schema: New columns on `InvestorApplication` model
  - Migration: `20260314182559_add_family_office_fields_and_members`
  - API: `POST /api/applications/investor` (also fixes form 404 bug)
  - UI: `InvestorApplicationForm.tsx` — conditional FO section

  ---

  ### US-FO-02: Family Office Financial Statements View
  **As a** Family Office investor  
  **I want to** access financial statements at `/investor/financial-statements`  
  **So that** I have a dedicated path that matches my navigation expectations  
  **Acceptance Criteria:**
  - `/investor/financial-statements` route resolves without 404
  - Redirects to `/financial-statements` content
  - E2E: `FO-B3-001`  
  **Implementation Status:** ✅ Complete (redirect route added in `App.tsx`)

  ---

  ### US-FO-03: Family Office Deals Access
  **As a** Family Office investor  
  **I want to** browse investment deals with contextual FO-specific deal view  
  **So that** I can assess opportunities appropriate for a family office mandate  
  **Implementation Status:** ✅ Inherited from investor role — Deals page accessible with investor+family_office roles

  ---

  ### US-FO-04: Onboarding Checklist — Correct Step Status
  **As a** Family Office investor who has not yet submitted an application  
  **I want to** see "Not Started" (not "In Progress") on Step 1 of the onboarding banner  
  **So that** I get an accurate status indicator that encourages me to start, not believe something is in progress  
  **Acceptance Criteria:**
  - Step 1 badge shows "Not Started" when `applicationStatus` is null
  - Step 1 badge shows "In Progress" only when a later step is current (e.g. KYC)
  - E2E: `FO-B2-001`  
  **Implementation Status:** ✅ Complete (`OnboardingBanner.tsx` bug fix)

  ---

  ### US-FO-05: Family Office Multi-Seat Member Management
  **As a** Family Office primary investor  
  **I want to** invite family members or trustees as co-investors under my umbrella account with VIEWER or MANAGER roles  
  **So that** multiple family members can access deal information without separate paid memberships  
  **Acceptance Criteria:**
  - `GET /api/family-office/members` — list active co-investors  
  - `POST /api/family-office/members` — add co-investor by email with role VIEWER/MANAGER  
  - `DELETE /api/family-office/members/:id` — soft-delete (sets `isActive = false`)  
  - UI page at `/investor/family-office/members`  
  - VIEWER: read-only access; MANAGER: can commit to deals  
  - E2E: `FO-FO05-001` through `FO-FO05-004`  
  **Implementation Status:** ✅ Complete
  - Schema: New `FamilyOfficeMember` model in `prisma/schema.prisma`
  - Migration: `20260314182559_add_family_office_fields_and_members`
  - API: 3 new endpoints in `server.ts`
  - UI: `src/pages/investor/FamilyOfficeMembers.tsx`
  - Route: `/investor/family-office/members` in `App.tsx`

  ---

  ### US-FO-06: DPIIT/SEBI Angel Fund Compliance Tracking
  **As a** Family Office investor co-investing alongside the IAF Angel Fund  
  **I want to** track and generate FEMA Form 10 and SEBI AIF Schedule III disclosure forms for my co-investments  
  **So that** I meet DPIIT/SEBI regulatory obligations without missing deadlines  
  **Acceptance Criteria:**
  - `GET /api/family-office/compliance-forms` returns all compliance filings for the user; auto-creates PENDING filings for new investment commitments (NRI → FEMA Form 10, Family Office entity → AIF Schedule III)  
  - `POST /api/family-office/compliance-forms` allows manual creation of a filing (formType: `FEMA_FORM10` | `AIF_SCHEDULE3`)  
  - `PATCH /api/family-office/compliance-forms/:id` updates filing status (`PENDING` | `FILED` | `OVERDUE` | `NOT_REQUIRED`) and stores the official filing reference number  
  - `GET /api/family-office/compliance-forms/:id/generate` returns pre-filled form data (investorName, pan, FCRN, company, sector, amount, regulatory declarations, generatedAt timestamp)  
  - FEMA Form 10 data includes: investorName, fcrnNumber, companyName, amount, regulatoryRef (`FEMA 20(R)/2017-RB Schedule 1`), filingDeadline  
  - AIF Schedule III data includes: entityName, aifCategory, portfolioCompany, investmentAmount, reportingPeriod, regulatoryRef (`SEBI AIF Regulations 2012 — Schedule III`)  
  - All 4 endpoints return 401 without auth token  
  - Compliance Forms page rendered at `/investor/family-office/compliance-forms` with `data-testid="compliance-forms-page"`  
  - Page shows FEMA section (`data-testid="fema-forms-section"`) and AIF section (`data-testid="aif-forms-section"`) when filings exist  
  - Each filing card has `data-testid="generate-btn-{id}"` and `data-testid="mark-filed-btn-{id}"`  
  - E2E: `FO-FO06-001` through `FO-FO06-008`  
  **Implementation Status:** ✅ Complete
  - Schema: `ComplianceFiling` model in `prisma/schema.prisma`; back-relations on `User` and `InvestmentCommitment`
  - Migration: `20260314193113_add_compliance_filings`
  - API: 4 new endpoints in `server.ts` (`GET`, `POST`, `PATCH`, `GET /:id/generate`)
  - UI: `src/pages/investor/ComplianceFormsPage.tsx`
  - Route: `/investor/family-office/compliance-forms` in `App.tsx`
  - Tests: `e2e/fo-compliance-forms.spec.ts` (FO-FO06-001 → FO-FO06-008)

  ---

  ### US-FO-07: KYC Expiry Alert Banner
  **As a** Family Office investor  
  **I want to** see a prominent amber alert banner on my dashboard when my KYC is expiring within 30 days  
  **So that** I can renew before losing access to deals  
  **Acceptance Criteria:**
  - `GET /api/family-office/kyc-status` returns `kycStatus`, `kycExpiresAt`, `daysUntilExpiry`, `requiresRefresh`
  - `requiresRefresh = true` when KYC expiry ≤ 30 days  
  - Amber banner with renewal link shown when `requiresRefresh = true`  
  - Banner auto-hides when not expiring soon  
  - E2E: `FO-FO07-001`, `FO-FO07-002`  
  **Implementation Status:** ✅ Complete
  - Schema: `kycExpiresAt`, `kycReminderSentAt` columns on `InvestorApplication`
  - API: `GET /api/family-office/kyc-status` in `server.ts`
  - UI: `src/components/investor/KYCExpiryBanner.tsx`
  - Integration: Imported in `InvestorDashboard.tsx`

  ---

  ### US-FO-08: Investment Committee Report
  **As a** Family Office primary investor  
  **I want to** generate and print an Investment Committee Report summarising my portfolio, commitments, and SPV memberships  
  **So that** I can present a comprehensive overview to my trustees and investment committee  
  **Acceptance Criteria:**
  - `GET /api/family-office/committee-report` returns report data (summary, portfolioCompanies, commitments, spvMemberships)
  - Report includes: portfolio companies, deployed capital, commitment statuses, active SPVs  
  - Printable via `window.print()` button  
  - E2E: `FO-FO08-001`  
  **Implementation Status:** ✅ Complete
  - API: `GET /api/family-office/committee-report` in `server.ts`
  - UI: `src/components/investor/InvestmentCommitteeReport.tsx`

  ---

  ### US-FO-09: NRI Compliance Fields
  **As an** NRI investor with Family Office status  
  **I want to** declare my NRI status and provide FCRA/RBI compliance details during application  
  **So that** my investments are processed in compliance with FEMA and RBI guidelines  
  **Acceptance Criteria:**
  - NRI section shown conditionally when `is_nri` checkbox is checked  
  - FCRN Number, Bank Account Type (NRE/NRO/RESIDENT), RBI compliance declaration collected  
  - Fields persisted to `investor_applications` DB table  
  - E2E: `FO-FO09-001`, `FO-FO09-002`, `FO-FO09-003`  
  **Implementation Status:** ✅ Complete
  - Schema: `isNri`, `fcrnNumber`, `bankAccountType`, `rbiComplianceFlag` columns on `InvestorApplication`
  - API: Fields accepted by `POST /api/applications/investor`
  - UI: NRI section in `InvestorApplicationForm.tsx`

  ---

  **Document Status:** ✅ ALL USER STORIES COMPLETE — Phase 10 Family Office features added  
  **Last Updated:** March 14, 2026  
  **Implementation Complete:** March 14, 2026 (branch: `2026-03-14-FamilyOffice`)  
  **Owner:** Product Management Team
