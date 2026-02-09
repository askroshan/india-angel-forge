# Phase 4 User Stories: Admin Operations, Compliance & KYC, Investor Messaging

**Phase:** 4 of 5  
**Timeline:** Post Phase 3 (Deal Management, SPV Management, Portfolio Dashboard ✅)  
**Status:** RED Phase - User Stories & Tests  
**Date:** February 2026  
**Methodology:** Strict TDD Red → Green → Refactor

---

## Overview

Phase 4 focuses on **platform administration, compliance workflows, and investor communication** — the admin panel operations (application review, audit logs, user roles, system statistics), compliance officer features (KYC document review, accreditation verification), investor document upload (KYC Upload), and direct messaging between users.

### Phase 4 Feature Groups (3 E2E Test Suites)

| Suite | File | Tests | User Stories |
|-------|------|-------|--------------|
| Admin Operations | `admin-operations.spec.ts` | 10 | US-ADMIN-001 to US-ADMIN-004 |
| Compliance & KYC | `compliance-kyc.spec.ts` | 10 | US-COMP-001 to US-COMP-003 |
| Investor Messaging | `investor-messaging.spec.ts` | 8 | US-MSG-001 to US-MSG-003 |
| **Total** | **3 files** | **28** | **10 stories** |

---

## Data Trace ID Convention

All trace IDs follow the format: `{FEATURE}-{TYPE}-{NUMBER}`

- **User Story IDs:** `US-ADMIN-001`, `US-COMP-001`, `US-MSG-001`
- **Test Case IDs:** `ADMIN-E2E-001`, `COMP-E2E-001`, `MSG-E2E-001`
- **API Trace IDs:** `API-ADMIN-001`, `API-COMP-001`, `API-MSG-001`

### Traceability Matrix

| User Story | Test Case(s) | API Route(s) | Frontend Component |
|-----------|-------------|-------------|-------------------|
| US-ADMIN-001 | ADMIN-E2E-001, ADMIN-E2E-002, ADMIN-E2E-003 | GET /api/admin/applications, PATCH /api/admin/applications/:id/approve, PATCH /api/admin/applications/:id/reject | ApplicationReview.tsx |
| US-ADMIN-002 | ADMIN-E2E-004, ADMIN-E2E-005 | GET /api/admin/audit-logs | AuditLogs.tsx |
| US-ADMIN-003 | ADMIN-E2E-006, ADMIN-E2E-007 | GET /api/admin/users, PATCH /api/admin/users/:id/role | UserRoleManagement.tsx |
| US-ADMIN-004 | ADMIN-E2E-008, ADMIN-E2E-009, ADMIN-E2E-010 | GET /api/admin/statistics | SystemStatistics.tsx |
| US-COMP-001 | COMP-E2E-001, COMP-E2E-002, COMP-E2E-003 | GET /api/kyc/documents, POST /api/kyc/documents | KYCUpload.tsx |
| US-COMP-002 | COMP-E2E-004, COMP-E2E-005, COMP-E2E-006, COMP-E2E-007 | GET /api/compliance/kyc-review, PUT /api/compliance/kyc-review/:id | KYCReviewDashboard.tsx |
| US-COMP-003 | COMP-E2E-008, COMP-E2E-009, COMP-E2E-010 | GET /api/compliance/accreditation, PATCH /api/compliance/accreditation/:id/approve, PATCH /api/compliance/accreditation/:id/reject | AccreditationVerification.tsx |
| US-MSG-001 | MSG-E2E-001, MSG-E2E-002, MSG-E2E-003 | GET /api/messages/threads, GET /api/messages/threads/:id/messages | DirectMessages.tsx |
| US-MSG-002 | MSG-E2E-004, MSG-E2E-005, MSG-E2E-006 | POST /api/messages, POST /api/messages/threads | DirectMessages.tsx |
| US-MSG-003 | MSG-E2E-007, MSG-E2E-008 | GET /api/messages/threads (search), GET /api/users | DirectMessages.tsx |

---

## EPIC A: Admin Platform Operations

### US-ADMIN-001: Review and Process Member Applications
**Trace ID:** `US-ADMIN-001`  
**As an** admin  
**I want to** review investor and founder applications and approve or reject them  
**So that** I can control platform membership and ensure quality applicants

**Acceptance Criteria:**
- [AC-1] Application Review page shows heading "Application Review" and list of applications
- [AC-2] Each application card shows full name, email, application type (Investor/Founder), and status badge
- [AC-3] Filter by application type (All/Investor/Founder) narrows the list
- [AC-4] "View Details" button opens a dialog with complete application information
- [AC-5] "Approve" button approves a pending application and shows success toast
- [AC-6] "Reject" button opens rejection dialog with reason field; submitting rejects the application
- [AC-7] Empty state shows "No applications found" when no applications match filter

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| ADMIN-E2E-001 | Display application review page with applications | AC-1, AC-2, AC-7 |
| ADMIN-E2E-002 | Filter applications by type and view details | AC-3, AC-4 |
| ADMIN-E2E-003 | Approve and reject applications | AC-5, AC-6 |

---

### US-ADMIN-002: View and Search Audit Logs
**Trace ID:** `US-ADMIN-002`  
**As an** admin  
**I want to** view all system audit logs with filtering and search  
**So that** I can monitor platform activity and investigate compliance events

**Acceptance Criteria:**
- [AC-1] Audit Logs page shows heading "Audit Logs" and summary cards (Total Logs, Today, This Week)
- [AC-2] Log entries display action, user, resource type, timestamp, and details
- [AC-3] Search by user name or email filters log entries
- [AC-4] Filter by action type narrows the list
- [AC-5] "Export CSV" button is visible and functional

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| ADMIN-E2E-004 | Display audit logs page with entries | AC-1, AC-2 |
| ADMIN-E2E-005 | Filter and search audit logs | AC-3, AC-4, AC-5 |

---

### US-ADMIN-003: Manage User Roles
**Trace ID:** `US-ADMIN-003`  
**As an** admin  
**I want to** assign and change user roles across the platform  
**So that** users have appropriate access permissions

**Acceptance Criteria:**
- [AC-1] User Role Management page shows heading "User Role Management"
- [AC-2] User list shows each user with name, email, current role badge, and join date
- [AC-3] Role statistics cards show count per role (Administrator, Moderator, Compliance Officer, User)
- [AC-4] Search by email or name filters the user list
- [AC-5] "Change Role" button opens dialog with role selector and "Assign Role" button
- [AC-6] Assigning role updates user's role and shows success toast
- [AC-7] Access denied shown for non-admin users

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| ADMIN-E2E-006 | Display user role management with user list | AC-1, AC-2, AC-3 |
| ADMIN-E2E-007 | Search users and change role | AC-4, AC-5, AC-6 |

---

### US-ADMIN-004: View System Statistics Dashboard
**Trace ID:** `US-ADMIN-004`  
**As an** admin  
**I want to** view system-wide statistics including users, deals, investment totals, and events  
**So that** I can monitor platform health and growth

**Acceptance Criteria:**
- [AC-1] System Statistics page shows heading "System Statistics"
- [AC-2] Four summary cards: Total Users, Total Deals, Total Investment, Total Events
- [AC-3] Users by Role breakdown card shows count per role
- [AC-4] Event Statistics card shows total events and total attendees
- [AC-5] User Growth section shows month-over-month data
- [AC-6] Error state shows "Failed to load statistics" message
- [AC-7] Loading state shows "Loading statistics..." message

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| ADMIN-E2E-008 | Display system statistics with summary cards | AC-1, AC-2 |
| ADMIN-E2E-009 | View users by role and event statistics | AC-3, AC-4 |
| ADMIN-E2E-010 | API returns statistics with correct data shape | AC-5, full flow |

---

## EPIC B: Compliance & KYC

### US-COMP-001: Investor Uploads KYC Documents
**Trace ID:** `US-COMP-001`  
**As an** investor  
**I want to** upload my KYC documents (PAN, Aadhaar, Bank Statement, Income Proof)  
**So that** I can get verified and access investment features

**Acceptance Criteria:**
- [AC-1] KYC Upload page shows heading "KYC Document Upload" with 4 document cards
- [AC-2] Each document card shows type (PAN Card, Aadhaar Card, Bank Statement, Income Proof), description, and status badge
- [AC-3] Document status shows "Not Uploaded", "Pending Review", "Verified", or "Rejected"
- [AC-4] Upload button triggers file selection and uploads document via API
- [AC-5] Verified documents show green "Verified" badge
- [AC-6] Rejected documents show red "Rejected" badge with reason and re-upload option

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| COMP-E2E-001 | Display KYC upload page with document cards | AC-1, AC-2, AC-3 |
| COMP-E2E-002 | View document status badges | AC-3, AC-5, AC-6 |
| COMP-E2E-003 | API returns KYC documents with correct data shape | AC-4 |

---

### US-COMP-002: Compliance Officer Reviews KYC Documents
**Trace ID:** `US-COMP-002`  
**As a** compliance officer  
**I want to** review KYC document submissions, verify or reject them  
**So that** investor identity verification is thorough and compliant

**Acceptance Criteria:**
- [AC-1] KYC Review Dashboard shows heading "KYC Document Review" with document list
- [AC-2] Each document shows investor name, email, document type, status, upload date
- [AC-3] Filter by status (All/Pending/Verified/Rejected) narrows the list
- [AC-4] Filter by document type (All/PAN/Aadhaar/Bank Statement/Income Proof) narrows list
- [AC-5] Search by investor name or email filters results
- [AC-6] "Verify" action on a pending document verifies it and shows success toast
- [AC-7] "Reject" action opens rejection dialog; submitting rejects with reason
- [AC-8] Access denied shown for non-compliance/non-admin users

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| COMP-E2E-004 | Display KYC review dashboard with documents | AC-1, AC-2 |
| COMP-E2E-005 | Filter KYC documents by status and type | AC-3, AC-4, AC-5 |
| COMP-E2E-006 | Verify a KYC document | AC-6 |
| COMP-E2E-007 | Reject a KYC document with reason | AC-7 |

---

### US-COMP-003: Compliance Officer Verifies Accreditation
**Trace ID:** `US-COMP-003`  
**As a** compliance officer  
**I want to** review and approve/reject investor accreditation applications  
**So that** only qualified investors access deal features

**Acceptance Criteria:**
- [AC-1] Accreditation Verification page shows heading "Accreditation Verification" with application list
- [AC-2] Each application shows investor name, email, verification method (Income/Net Worth/Professional), status badge
- [AC-3] Filter by status (All/Pending/Approved/Rejected/Expired) narrows list
- [AC-4] "Approve" opens dialog with expiry date field; submitting approves with expiry
- [AC-5] "Reject" opens dialog with reason field; submitting rejects with reason
- [AC-6] "View Documents" opens dialog showing submitted documentation
- [AC-7] Financial details shown (annual income, net worth) where applicable

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| COMP-E2E-008 | Display accreditation verification with applications | AC-1, AC-2, AC-3 |
| COMP-E2E-009 | Approve accreditation with expiry date | AC-4, AC-7 |
| COMP-E2E-010 | Reject accreditation with reason | AC-5, AC-6 |

---

## EPIC C: Investor Messaging

### US-MSG-001: View Message Threads and Conversations
**Trace ID:** `US-MSG-001`  
**As an** investor  
**I want to** view my message threads and read conversations  
**So that** I can communicate with founders and other platform users

**Acceptance Criteria:**
- [AC-1] Direct Messages page shows heading "Direct Messages" with thread list
- [AC-2] Each thread shows other participant name, last message preview, time, and unread count
- [AC-3] Selecting a thread loads the conversation with message bubbles
- [AC-4] Messages show sender name, content, and timestamp
- [AC-5] Empty state shows "No conversations yet" when no threads exist

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| MSG-E2E-001 | Display direct messages page with threads or empty state | AC-1, AC-5 |
| MSG-E2E-002 | View thread list with participant info | AC-2 |
| MSG-E2E-003 | Select thread and view messages | AC-3, AC-4 |

---

### US-MSG-002: Send Messages and Start Conversations
**Trace ID:** `US-MSG-002`  
**As an** investor  
**I want to** send messages in existing threads and start new conversations  
**So that** I can discuss investment opportunities with founders

**Acceptance Criteria:**
- [AC-1] Message input field and "Send" button visible when a thread is selected
- [AC-2] Typing a message and clicking Send creates a new message in the thread
- [AC-3] "New Message" button opens a dialog to start a new conversation
- [AC-4] New conversation dialog allows selecting a recipient and entering initial message
- [AC-5] Starting conversation creates a new thread and navigates to it

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| MSG-E2E-004 | Send message in existing thread | AC-1, AC-2 |
| MSG-E2E-005 | Open new conversation dialog | AC-3, AC-4 |
| MSG-E2E-006 | Start new conversation and verify thread creation | AC-5 |

---

### US-MSG-003: Search Messages and List Users
**Trace ID:** `US-MSG-003`  
**As an** investor  
**I want to** search through my messages and find users to message  
**So that** I can efficiently manage my communications

**Acceptance Criteria:**
- [AC-1] Search input filters threads by participant name or message content
- [AC-2] Users API returns available platform users for new conversation dialog
- [AC-3] Thread list updates in real-time as new messages arrive

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| MSG-E2E-007 | Search and filter message threads | AC-1 |
| MSG-E2E-008 | API returns threads and users with correct data shape | AC-2, AC-3 |

---

## Implementation Plan (TDD)

### RED Phase (Current)
1. ✅ Write user stories with trace IDs
2. Write all 28 E2E tests — all should FAIL
3. Run tests, confirm RED state

### GREEN Phase
1. Build missing backend routes:
   - `GET /api/admin/applications` — List all investor + founder applications
   - `PATCH /api/admin/applications/:id/approve` — Approve application
   - `PATCH /api/admin/applications/:id/reject` — Reject application with reason
   - `PATCH /api/admin/users/:id/role` — Change user role
   - `GET /api/admin/statistics` — Aggregate system statistics
   - `PATCH /api/compliance/accreditation/:id/approve` — Approve accreditation
   - `PATCH /api/compliance/accreditation/:id/reject` — Reject accreditation
   - `GET /api/messages/threads` — List user's message threads
   - `GET /api/messages/threads/:id/messages` — Get thread messages
   - `POST /api/messages` — Send message in thread
   - `POST /api/messages/threads` — Start new conversation
   - `GET /api/users` — List platform users for messaging
2. Seed test data (applications, KYC documents, accreditations, audit logs, messages)
3. Fix API data shapes to match frontend expectations
4. Fix frontend data handling if needed
5. Run tests, confirm GREEN state

### REFACTOR Phase
1. Extract shared helpers
2. Clean up API response types
3. Ensure idempotent test execution
4. Run final verification: 88 tests (Phase 2: 32 + Phase 3: 28 + Phase 4: 28)

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@indiaangelforum.test | Admin@12345 |
| Investor | investor.standard@test.com | Investor@12345 |
| Compliance Officer | Seeded via test setup | (admin also has compliance access) |

---

## Dependencies

- Phase 2 complete ✅ (Transaction History, Activity Timeline, Financial Statements, Event Attendance)
- Phase 3 complete ✅ (Deal Management, SPV Management, Portfolio Dashboard)
- Prisma schema has all required models ✅ (AuditLog, Message, MessageThread, KYCDocument, Accreditation, InvestorApplication, FounderApplication, UserRole)
- Frontend pages exist for all features ✅
- Backend routes: ~40% existing, need implementation for applications, statistics, accreditation actions, messaging
