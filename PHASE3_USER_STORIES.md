# Phase 3 User Stories: Deal Management, SPV & Portfolio

**Phase:** 3 of 5  
**Timeline:** Post Phase 2 (Transaction History, Activity Timeline, Financial Statements, Event Attendance ✅)  
**Status:** RED Phase - User Stories & Tests  
**Date:** February 2026  
**Methodology:** Strict TDD Red → Green → Refactor

---

## Overview

Phase 3 focuses on the **core investor deal flow** — browsing deals, expressing interest, managing the deal pipeline, creating/tracking SPVs, and the portfolio dashboard. These are the most critical investor features of the angel investment platform.

### Phase 3 Feature Groups (3 E2E Test Suites)

| Suite | File | Tests | User Stories |
|-------|------|-------|--------------|
| Deal Management | `deal-management.spec.ts` | 10 | US-DEAL-001 to US-DEAL-004 |
| SPV Management | `spv-management.spec.ts` | 10 | US-SPV-001 to US-SPV-004 |
| Portfolio Dashboard | `portfolio-dashboard.spec.ts` | 8 | US-PORTFOLIO-001 to US-PORTFOLIO-003 |
| **Total** | **3 files** | **28** | **11 stories** |

---

## Data Trace ID Convention

All trace IDs follow the format: `{FEATURE}-{TYPE}-{NUMBER}`

- **User Story IDs:** `US-DEAL-001`, `US-SPV-001`, `US-PORTFOLIO-001`
- **Test Case IDs:** `DEAL-E2E-001`, `SPV-E2E-001`, `PORT-E2E-001`
- **API Trace IDs:** `API-DEAL-001`, `API-SPV-001`, `API-PORT-001`

### Traceability Matrix

| User Story | Test Case(s) | API Route(s) | Frontend Component |
|-----------|-------------|-------------|-------------------|
| US-DEAL-001 | DEAL-E2E-001, DEAL-E2E-002, DEAL-E2E-003 | GET /api/deals | BrowseDeals.tsx |
| US-DEAL-002 | DEAL-E2E-004, DEAL-E2E-005 | GET /api/deals/:id, POST /api/deals/:id/interest | ExpressInterest.tsx |
| US-DEAL-003 | DEAL-E2E-006, DEAL-E2E-007, DEAL-E2E-008 | GET /api/deals/interests/my | DealPipeline.tsx |
| US-DEAL-004 | DEAL-E2E-009, DEAL-E2E-010 | Admin deal seeding/management | AdminDashboard (setup) |
| US-SPV-001 | SPV-E2E-001, SPV-E2E-002, SPV-E2E-003 | POST /api/spvs | CreateSPV.tsx |
| US-SPV-002 | SPV-E2E-004, SPV-E2E-005 | GET /api/spvs/:id | SPVDashboard.tsx |
| US-SPV-003 | SPV-E2E-006, SPV-E2E-007, SPV-E2E-008 | GET/PUT/DELETE /api/spvs/:id/members | TrackSPVAllocations.tsx |
| US-SPV-004 | SPV-E2E-009, SPV-E2E-010 | GET /api/deals/interests/my (SPV link) | DealPipeline.tsx (SPV section) |
| US-PORTFOLIO-001 | PORT-E2E-001, PORT-E2E-002, PORT-E2E-003 | GET /api/portfolio/companies | PortfolioDashboard.tsx |
| US-PORTFOLIO-002 | PORT-E2E-004, PORT-E2E-005, PORT-E2E-006 | GET /api/portfolio/companies (filters) | PortfolioDashboard.tsx |
| US-PORTFOLIO-003 | PORT-E2E-007, PORT-E2E-008 | GET /api/portfolio/updates | PortfolioDashboard.tsx |

---

## EPIC A: Deal Management

### US-DEAL-001: Browse Available Deals with Filters
**Trace ID:** `US-DEAL-001`  
**As an** verified investor  
**I want to** browse available deals with filtering and search  
**So that** I can find investment opportunities matching my criteria

**Acceptance Criteria:**
- [AC-1] Deal listing page shows all open deals with company name, sector, stage, amount, and valuation
- [AC-2] Search by company name filters results in real time
- [AC-3] Filter by sector narrows results to selected sector only
- [AC-4] Filter by funding stage narrows results to selected stage only
- [AC-5] Filter by check size range narrows results appropriately
- [AC-6] Sort by date (newest/oldest) and amount (high/low) reorders results
- [AC-7] Empty state shown when no deals match filters
- [AC-8] "View Deal Details" link navigates to individual deal page

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| DEAL-E2E-001 | Display deal listing with deal cards | AC-1 |
| DEAL-E2E-002 | Search and filter deals | AC-2, AC-3, AC-4, AC-5 |
| DEAL-E2E-003 | Sort deals and navigate to detail | AC-6, AC-8 |

---

### US-DEAL-002: Express Interest in a Deal
**Trace ID:** `US-DEAL-002`  
**As an** verified investor  
**I want to** express interest in a deal with my intended investment amount  
**So that** the deal sponsor is notified and I enter the deal pipeline

**Acceptance Criteria:**
- [AC-1] Deal detail page shows full deal information (company, amount, valuation, equity, min investment)
- [AC-2] Investment amount input validates against minimum investment
- [AC-3] Submitting interest with valid amount creates a DealInterest record
- [AC-4] Success confirmation shows deal added to pipeline with next steps
- [AC-5] "View Pipeline" button navigates to /investor/pipeline after success
- [AC-6] Validation error shown if amount is below minimum or empty

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| DEAL-E2E-004 | View deal detail and express interest | AC-1, AC-2, AC-3, AC-4 |
| DEAL-E2E-005 | Validate interest form errors | AC-6 |

---

### US-DEAL-003: Track Deal Pipeline
**Trace ID:** `US-DEAL-003`  
**As an** investor  
**I want to** view all deals I've expressed interest in with their current status  
**So that** I can track my deal pipeline and next actions

**Acceptance Criteria:**
- [AC-1] Pipeline page shows statistics cards: Total Interests, Pending, Accepted, Rejected, Total Commitment
- [AC-2] Each deal interest shows deal name, status badge, commitment amount, and date
- [AC-3] Filter by status (All/Pending/Accepted/Rejected) works correctly
- [AC-4] Accepted interests show SPV details and "Complete Commitment" action
- [AC-5] Rejected interests show rejection reason
- [AC-6] Empty pipeline shows "No Deals in Pipeline" with link to Browse Deals

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| DEAL-E2E-006 | View deal pipeline with statistics | AC-1, AC-2 |
| DEAL-E2E-007 | Filter pipeline by status | AC-3 |
| DEAL-E2E-008 | Pipeline shows accepted/rejected details | AC-4, AC-5 |

---

### US-DEAL-004: Admin Seeds Deals for Investor Browse
**Trace ID:** `US-DEAL-004`  
**As an** admin  
**I want** deals to be available in the system  
**So that** investors can browse and express interest

**Acceptance Criteria:**
- [AC-1] Deals exist in the database with valid company, sector, stage, amount, valuation data
- [AC-2] Deals API returns well-formed JSON with all required fields
- [AC-3] Admin can verify deals via API

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| DEAL-E2E-009 | API returns deals with correct data shape | AC-1, AC-2 |
| DEAL-E2E-010 | End-to-end deal interest lifecycle | AC-3, full flow |

---

## EPIC B: SPV Management

### US-SPV-001: Create SPV for a Deal
**Trace ID:** `US-SPV-001`  
**As a** lead investor  
**I want to** create a Special Purpose Vehicle for a deal  
**So that** I can pool investments from co-investors

**Acceptance Criteria:**
- [AC-1] Create SPV form shows all required fields: name, deal, target amount, carry %, hurdle rate, min investment
- [AC-2] Deal dropdown populates from available deals
- [AC-3] Selecting a deal shows deal summary (company, sector, stage, target)
- [AC-4] Form validates all required fields before submission
- [AC-5] Successful creation shows toast confirmation
- [AC-6] SPV record created in database with status "forming"

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| SPV-E2E-001 | Create SPV form displays correctly | AC-1, AC-2, AC-3 |
| SPV-E2E-002 | Submit SPV with valid data | AC-4, AC-5, AC-6 |
| SPV-E2E-003 | SPV form validation errors | AC-4 |

---

### US-SPV-002: View SPV Dashboard
**Trace ID:** `US-SPV-002`  
**As a** lead investor  
**I want to** view my SPV dashboard with fundraising progress  
**So that** I can monitor the SPV status and member participation

**Acceptance Criteria:**
- [AC-1] Dashboard shows SPV name, target amount, committed amount, member count, carry %
- [AC-2] Fundraising progress bar shows percentage raised vs target
- [AC-3] Member list shows each member's name, commitment, status (Confirmed/Pending)
- [AC-4] "Invite Co-Investors" button navigates to invite page

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| SPV-E2E-004 | View SPV dashboard with statistics | AC-1, AC-2 |
| SPV-E2E-005 | View SPV member list | AC-3, AC-4 |

---

### US-SPV-003: Track & Manage SPV Allocations
**Trace ID:** `US-SPV-003`  
**As a** lead investor  
**I want to** track payment status and manage allocations for my SPV  
**So that** I can ensure all members have paid and adjust allocations as needed

**Acceptance Criteria:**
- [AC-1] Track page shows commitment progress and payment progress bars
- [AC-2] SPV details card shows carry %, equity stake, min investment, total members
- [AC-3] Member list shows each member's commitment, paid amount, ownership %, payment status
- [AC-4] "Mark as Paid" updates member payment status
- [AC-5] "Remove" member removes them from SPV with confirmation dialog
- [AC-6] "Adjust Allocations" dialog allows editing commitment amount

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| SPV-E2E-006 | View SPV allocation tracking | AC-1, AC-2 |
| SPV-E2E-007 | Manage member payment status | AC-3, AC-4 |
| SPV-E2E-008 | Remove member and adjust allocation | AC-5, AC-6 |

---

### US-SPV-004: SPV Linked from Deal Pipeline
**Trace ID:** `US-SPV-004`  
**As an** investor  
**I want** accepted deals in my pipeline to show SPV information  
**So that** I can navigate directly to SPV details

**Acceptance Criteria:**
- [AC-1] Accepted deal interests in pipeline show SPV details section
- [AC-2] SPV name, target amount, and committed shown
- [AC-3] "Complete Commitment" navigable from pipeline

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| SPV-E2E-009 | Pipeline shows SPV for accepted deals | AC-1, AC-2 |
| SPV-E2E-010 | Full SPV lifecycle (create → view → track) | AC-3, integration |

---

## EPIC C: Portfolio Dashboard

### US-PORTFOLIO-001: View Portfolio Companies
**Trace ID:** `US-PORTFOLIO-001`  
**As an** investor  
**I want to** view my portfolio of invested companies  
**So that** I can track my investments and their performance

**Acceptance Criteria:**
- [AC-1] Dashboard shows summary: Total Portfolio Value, Total Invested, Unrealized Gain, Portfolio Status
- [AC-2] Company cards show name, sector, stage, investment amount, current value, ownership %
- [AC-3] Performance metrics (IRR, Multiple) shown per company
- [AC-4] Empty state shows "No portfolio companies yet" with link to browse deals

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| PORT-E2E-001 | View portfolio dashboard with summary | AC-1, AC-4 |
| PORT-E2E-002 | View portfolio company cards | AC-2, AC-3 |
| PORT-E2E-003 | Portfolio empty state and navigation | AC-4 |

---

### US-PORTFOLIO-002: Filter Portfolio Companies
**Trace ID:** `US-PORTFOLIO-002`  
**As an** investor  
**I want to** filter my portfolio by sector, stage, and status  
**So that** I can focus on specific types of investments

**Acceptance Criteria:**
- [AC-1] Sector filter dropdown works
- [AC-2] Stage filter dropdown works
- [AC-3] Status filter (Active/Exited) works
- [AC-4] Multiple filters combine correctly
- [AC-5] "Clear" resets all filters

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| PORT-E2E-004 | Filter portfolio by sector | AC-1 |
| PORT-E2E-005 | Filter portfolio by stage | AC-2 |
| PORT-E2E-006 | Filter portfolio by status | AC-3, AC-4, AC-5 |

---

### US-PORTFOLIO-003: View Portfolio Updates
**Trace ID:** `US-PORTFOLIO-003`  
**As an** investor  
**I want to** see latest updates for my portfolio companies  
**So that** I stay informed about company progress

**Acceptance Criteria:**
- [AC-1] Latest update shown on each company card (title, date, summary)
- [AC-2] "Portfolio Metrics Explained" info card visible

**E2E Tests:**
| Test ID | Test Name | Validates |
|---------|-----------|-----------|
| PORT-E2E-007 | Portfolio company shows latest update | AC-1 |
| PORT-E2E-008 | Portfolio info and metrics explanation | AC-2 |

---

## Implementation Plan (TDD)

### RED Phase (Current)
1. ✅ Write user stories with trace IDs
2. Write all 28 E2E tests — all should FAIL
3. Run tests, confirm RED state

### GREEN Phase
1. Build missing backend routes:
   - `POST /api/deals/:id/interest` — Express interest
   - `POST /api/spvs` — Create SPV
   - `GET /api/spvs/:id` — SPV details
   - `GET /api/spvs/:id/members` — SPV members
   - `PUT /api/spvs/:id/members/:memberId` — Update member
   - `DELETE /api/spvs/:id/members/:memberId` — Remove member
   - `PUT /api/spv-members/:memberId/allocation` — Adjust allocation
2. Fix API data shapes to match frontend expectations
3. Seed test data (deals, companies)
4. Fix frontend data handling
5. Run tests, confirm GREEN state

### REFACTOR Phase
1. Extract shared helpers
2. Clean up API response types
3. Ensure idempotent test execution
4. Run final verification

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@indiaangelforum.test | Admin@12345 |
| Investor | investor.standard@test.com | Investor@12345 |

---

## Dependencies

- Phase 2 complete ✅ (Transaction History, Activity Timeline, Financial Statements, Event Attendance)
- Prisma schema has Deal, DealInterest, Spv, SpvMember, PortfolioCompany, PortfolioUpdate models ✅
- Frontend pages exist for all features ✅
- Backend routes: ~60% missing, need implementation
