# Test Coverage Analysis - India Angel Forum

**Generated:** February 4, 2026  
**Analysis Type:** User Stories & E2E Test Coverage Assessment

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total User Stories** | 59 |
| **Completed Stories** | 51 (86%) |
| **In Progress Stories** | 8 (14%) |
| **Total Documented Tests** | 699 |
| **E2E Test Cases** | 95 |
| **E2E Test Coverage** | ~13.6% of stories |

---

## User Stories by Role

### Admin (6 stories)
- ✅ US-ADMIN-001: User Management (15/15 tests)
- ✅ US-ADMIN-002: Role Assignment (10/10 tests)
- ✅ US-ADMIN-003: Event Management (14/14 tests) - **Full E2E CRUD**
- ✅ US-ADMIN-004: Application Review (26/26 tests)
- ✅ US-ADMIN-005: System Statistics (10/10 tests)
- ✅ US-ADMIN-006: Audit Logs (12/12 tests)

**E2E Coverage:** Event Management only (13 tests)

---

### Compliance Officer (4 stories)
- ✅ US-COMPLIANCE-001: Review KYC Documents (18/18 tests) - **Partial E2E**
- ✅ US-COMPLIANCE-002: Perform AML Screening (26/26 tests) - **Partial E2E**
- ✅ US-COMPLIANCE-003: Verify Accredited Investor Status (24/24 tests)
- ✅ US-COMPLIANCE-004: Access Audit Logs (9/9 tests)

**E2E Coverage:** KYC & AML - Read/Update only (7 tests)

---

### Investor (16 stories)
- ✅ US-INVESTOR-001: Submit Application (10/10 tests)
- ✅ US-INVESTOR-002: Upload KYC Documents (8/8 tests)
- ✅ US-INVESTOR-003: Browse Available Deals (25/25 tests)
- ✅ US-INVESTOR-004: Express Interest in Deal (14/14 tests) - **Partial E2E**
- ✅ US-INVESTOR-005: Track Deal Pipeline (12/12 tests)
- ✅ US-INVESTOR-006: View Deal Documents (8/8 tests)
- ✅ US-INVESTOR-007: Submit Investment Commitment (10/10 tests) - **NO E2E**
- ✅ US-INVESTOR-008: Create SPV (16/16 tests) - **NO E2E**
- ✅ US-INVESTOR-009: Invite Co-Investors to SPV (9/9 tests) - **NO E2E**
- ✅ US-INVESTOR-010: Track SPV Allocations (16/16 tests) - **NO E2E**
- ✅ US-INVESTOR-011: View Portfolio Dashboard (16/16 tests)
- ✅ US-INVESTOR-012: Track Portfolio Performance (13/13 tests)
- ✅ US-INVESTOR-013: Access Portfolio Company Updates (11/11 tests) - **NO E2E**
- ✅ US-INVESTOR-014: Send Direct Messages (13/13 tests) - **NO E2E**
- ✅ US-INVESTOR-015: Create Discussion Threads (17/17 tests) - **NO E2E**
- ✅ US-INVESTOR-016: Set Communication Preferences (13/13 tests)

**E2E Coverage:** Deal Interest Read only (3 tests) = 1.3 E2E tests per story

---

### Founder (6 stories)
- ✅ US-FOUNDER-001: Submit Founder Application (12/12 tests) - **Minimal E2E**
- ✅ US-FOUNDER-002: Track Application Status (10/10 tests) - **Minimal E2E**
- ✅ US-FOUNDER-003: Access Investor Profiles (10/10 tests)
- ✅ US-FOUNDER-004: Schedule Pitch Sessions (14/14 tests)
- ✅ US-FOUNDER-005: Upload Pitch Deck and Documents (12/12 tests)
- ✅ US-FOUNDER-006: Receive Investor Feedback (7/7 tests)

**E2E Coverage:** Application status read only (2 tests)

---

### Moderator (3 stories)
- ✅ US-MODERATOR-001: Screen Founder Applications (18/18 tests) - **Partial E2E**
- ✅ US-MODERATOR-002: Review Event Attendance (12/12 tests)
- ✅ US-MODERATOR-003: Manage Content Flags (13/13 tests)

**E2E Coverage:** Application review (5 tests) - Read/Update only

---

### Operator Angel (3 stories)
- ✅ US-OPERATOR-001: Offer Advisory Services (13/13 tests)
- ✅ US-OPERATOR-002: Track Advisory Hours (10/10 tests)
- ✅ US-OPERATOR-003: Mentor Startups (13/13 tests)

**E2E Coverage:** ❌ ZERO - No E2E tests

---

### Authorization & Security (8 stories)
- 🔄 US-AUTH-001: Role-Based Route Protection - **Full E2E** (35 tests)
- 🔄 US-AUTH-002: API Endpoint Authorization - Covered via CRUD
- 🔄 US-AUTH-003: Forbidden Access Page - **Accessibility testing** (6 tests)
- 🔄 US-AUTH-004: Admin Dashboard Data Verification - **NO E2E** ⚠️
- 🔄 US-AUTH-005: Compliance Dashboard Data Verification - **NO E2E** ⚠️
- 🔄 US-AUTH-006: Investor Dashboard Data Verification - **NO E2E** ⚠️
- 🔄 US-AUTH-007: Founder Dashboard Data Verification - **NO E2E**
- 🔄 US-AUTH-008: Moderator Dashboard Data Verification - **NO E2E**
- ✅ US-AUTH-010: Admin Login to Dashboard Flow - **E2E** (5 tests)
- ✅ US-AUTH-011: AccessDenied Shows Current Role - **E2E** (5 tests)

---

## E2E Test Files

### authorization.spec.ts (48 tests)
```
US-AUTH-001: Role-Based Route Protection (35 tests)
  ├── Admin Routes (7 tests)
  ├── Compliance Routes (4 tests)
  ├── Investor Routes (6 tests)
  ├── Founder Routes (3 tests)
  ├── Moderator Routes (3 tests)
  └── Operator Angel Routes (3 tests)

US-AUTH-003: Forbidden Access Page - WCAG 2.2 AA (6 tests)
  ├── Heading & explanation
  ├── Role display
  ├── Navigation links
  ├── Keyboard navigation
  ├── Color contrast
  └── Responsive design

US-AUTH-010: Admin Login Flow (5 tests)
  ├── Successful login & redirect
  ├── Token storage
  ├── Subsequent visits
  ├── Wrong email handling
  └── Wrong password handling

US-AUTH-011: AccessDenied Role Display (5 tests)
  ├── Investor role shown
  ├── Founder role shown
  ├── Compliance role shown
  ├── Dashboard link shown
  └── Required role shown
```

### crud-operations.spec.ts (47 tests)
```
US-ADMIN-003: Event Management CRUD (13 tests)
  ├── CREATE: 3 tests (basic, validation, minimal)
  ├── READ: 3 tests (list, details, public access)
  ├── UPDATE: 3 tests (title, location, capacity)
  ├── DELETE: 2 tests (delete, verify)
  └── AUTHORIZATION: 2 tests (investor cannot modify)

US-INVESTOR-001: Event Registration (9 tests)
  ├── CREATE: 4 tests (register, duplicate prevention)
  ├── READ: 2 tests (view registrations)
  └── AUTHORIZATION: 3 tests (unauthenticated access)

US-COMPLIANCE-001: KYC Review (4 tests)
  ├── READ: 2 tests (view submissions)
  ├── UPDATE: 2 tests (approve, reject)
  └── AUTHORIZATION: 2 tests (investor cannot view)

US-COMPLIANCE-002: AML Screening (3 tests)
  ├── READ: 2 tests (view screenings)
  └── UPDATE: 1 test (update status)

US-FOUNDER-001: Founder Application (3 tests)
  ├── Page accessibility
  ├── Form validation
  └── Status tracking

US-INVESTOR-004: Deal Interest (3 tests)
  ├── READ: 2 tests (view interests, pipeline)
  └── AUTHORIZATION: 1 test (founder cannot access)

US-MODERATOR-001: Application Screening (5 tests)
  ├── READ: 3 tests (view applications)
  └── UPDATE: 2 tests (approve, reject)
```

---

## CRUD Coverage by Role

### Admin
| Operation | Coverage | Tests | Notes |
|-----------|----------|-------|-------|
| **CREATE** | 50% | 4 | Events only |
| **READ** | 67% | 4 | Events, registrations, KYC, AML |
| **UPDATE** | 60% | 3 | Event details, KYC/AML status |
| **DELETE** | 33% | 2 | Events only |
| **OVERALL** | **52.5%** | 13 | ⚠️ User & role management untested |

### Compliance
| Operation | Coverage | Tests | Notes |
|-----------|----------|-------|-------|
| **CREATE** | 0% | 0 | Not tested |
| **READ** | 50% | 2 | KYC & AML submissions |
| **UPDATE** | 67% | 2 | KYC & AML status changes |
| **DELETE** | 0% | 0 | Not tested |
| **OVERALL** | **29%** | 4 | ⚠️ READ-only focus |

### Investor
| Operation | Coverage | Tests | Notes |
|-----------|----------|-------|-------|
| **CREATE** | 0% | 0 | ⚠️ No CREATE tests |
| **READ** | 27% | 3 | Interests & registrations only |
| **UPDATE** | 0% | 0 | ⚠️ No UPDATE tests |
| **DELETE** | 0% | 0 | ⚠️ No DELETE tests |
| **OVERALL** | **7%** | 3 | ⚠️ Severely under-tested |

### Founder
| Operation | Coverage | Tests | Notes |
|-----------|----------|-------|-------|
| **CREATE** | 0% | 0 | ⚠️ No CREATE tests |
| **READ** | 17% | 1 | Application status only |
| **UPDATE** | 0% | 0 | ⚠️ No UPDATE tests |
| **DELETE** | 0% | 0 | ⚠️ No DELETE tests |
| **OVERALL** | **4%** | 1 | ⚠️ Severely under-tested |

### Moderator
| Operation | Coverage | Tests | Notes |
|-----------|----------|-------|-------|
| **CREATE** | 0% | 0 | Not tested |
| **READ** | 33% | 1 | Applications only |
| **UPDATE** | 67% | 2 | Application status changes |
| **DELETE** | 0% | 0 | Not tested |
| **OVERALL** | **25%** | 3 | ⚠️ Limited coverage |

### Operator Angel
| Operation | Coverage | Tests | Notes |
|-----------|----------|-------|-------|
| **CREATE** | 0% | 0 | ⚠️ ALL ZERO |
| **READ** | 0% | 0 | ⚠️ ALL ZERO |
| **UPDATE** | 0% | 0 | ⚠️ ALL ZERO |
| **DELETE** | 0% | 0 | ⚠️ ALL ZERO |
| **OVERALL** | **0%** | 0 | 🚨 CRITICAL - No E2E coverage |

---

## Critical Gaps

### 🚨 P0 - Critical (3 stories)

#### 1. US-AUTH-004: Admin Dashboard Data Verification
- **Status:** 🔄 In Progress
- **Impact:** Cannot verify admin dashboard shows accurate data
- **Missing Tests:**
  - Total user counts by role
  - Pending applications count
  - Active events list with registrations
  - Audit log entries display
  - Data refresh on navigation
- **Affected UI:** Admin dashboard at `/admin`
- **Test Estimate:** 4-6 hours

#### 2. US-AUTH-005: Compliance Dashboard Data Verification
- **Status:** 🔄 In Progress
- **Impact:** Cannot verify compliance dashboard functionality
- **Missing Tests:**
  - Pending KYC reviews display
  - Pending AML screenings display
  - Risk flag visibility
  - Accreditation expiration alerts
  - Recent actions list
  - Filter and sort functionality
- **Affected UI:** Compliance dashboard
- **Test Estimate:** 3-4 hours

#### 3. US-AUTH-006: Investor Dashboard Data Verification
- **Status:** 🔄 In Progress
- **Impact:** Cannot verify investor dashboard shows deals & portfolio
- **Missing Tests:**
  - Available deals display
  - Expressed interests list
  - Commitment status visibility
  - Portfolio companies display
  - KYC/accreditation status prompts
- **Affected UI:** Investor dashboard at `/investor/deals`
- **Test Estimate:** 4-6 hours

---

### ⚠️ P1 - High Priority (6+ stories)

#### 4. US-INVESTOR-007-010: Investment Operations (4 stories)
- **Missing:** Full CRUD for commitments and SPV operations
- **Impact:** Core investment features untested in E2E
- **Stories Affected:**
  - US-INVESTOR-007: Submit Investment Commitment (0 E2E tests)
  - US-INVESTOR-008: Create SPV (0 E2E tests)
  - US-INVESTOR-009: Invite Co-Investors (0 E2E tests)
  - US-INVESTOR-010: Track SPV Allocations (0 E2E tests)
- **Test Estimate:** 8-12 hours

#### 5. US-ADMIN-001-002: User & Role Management (2 stories)
- **Missing:** CREATE/UPDATE/DELETE operations
- **Impact:** No E2E tests for user management interface
- **Stories Affected:**
  - US-ADMIN-001: User Management (0 CRUD E2E tests)
  - US-ADMIN-002: Role Assignment (0 CRUD E2E tests)
- **Test Estimate:** 6-8 hours

#### 6. US-OPERATOR-001-003: Operator Angel (3 stories)
- **Missing:** ALL CRUD operations
- **Impact:** Entire role has zero E2E test coverage
- **Stories Affected:**
  - US-OPERATOR-001: Offer Advisory Services (0 tests)
  - US-OPERATOR-002: Track Advisory Hours (0 tests)
  - US-OPERATOR-003: Mentor Startups (0 tests)
- **Test Estimate:** 6-8 hours

---

## Operations Required by User Story

### US-INVESTOR-007: Submit Investment Commitment
```
Operations Needed:
├── CREATE
│   └── Investor submits commitment with amount, terms acceptance
├── READ
│   ├── View commitment details
│   └── Check payment instructions
├── UPDATE
│   └── Update commitment status (SUBMITTED → PAID)
└── DELETE
    └── Cancel commitment (if allowed pre-close)

E2E Tests Missing: All 4 operations
```

### US-INVESTOR-008: Create SPV
```
Operations Needed:
├── CREATE
│   └── SPV with name, deal, target raise, carry structure
├── READ
│   ├── View SPV details
│   └── View member list & allocations
├── UPDATE
│   ├── Update SPV details
│   └── Adjust allocations
└── DELETE
    └── Delete SPV (if no commitments)

E2E Tests Missing: All 4 operations
```

### US-INVESTOR-009: Invite Co-Investors
```
Operations Needed:
├── CREATE
│   └── Send SPV invitations to investors
├── READ
│   ├── View sent invitations
│   └── Track invitation status
├── UPDATE
│   ├── Resend invitation
│   └── Update deadline
└── DELETE
    └── Revoke invitation

E2E Tests Missing: All 4 operations
```

### US-ADMIN-001: User Management
```
Operations Needed:
├── CREATE
│   └── Create new user (if admin signup enabled)
├── READ
│   ├── List all users ✅ (tested in unit tests)
│   ├── Search users
│   └── View user details
├── UPDATE
│   └── Update user information
└── DELETE
    └── Delete user account

E2E Tests Missing: CREATE, UPDATE, DELETE
```

### US-OPERATOR-001: Offer Advisory Services
```
Operations Needed:
├── CREATE
│   └── Create advisory profile
├── READ
│   ├── View advisory profile
│   ├── View advisory requests
│   └── View matching startups
├── UPDATE
│   ├── Update advisory profile
│   └── Update availability
└── DELETE
    └── Deactivate advisory profile

E2E Tests Missing: ALL 4 operations (0 tests)
```

### US-OPERATOR-002: Track Advisory Hours
```
Operations Needed:
├── CREATE
│   └── Log advisory hours with company, date, duration
├── READ
│   ├── View hours by company
│   └── View monthly hours
├── UPDATE
│   └── Edit logged hours
└── DELETE
    └── Delete hours entry

E2E Tests Missing: ALL 4 operations (0 tests)
```

---

## Test Execution Checklist

### E2E Test Files
- [x] `e2e/authorization.spec.ts` - 48 tests (✅ running)
- [x] `e2e/crud-operations.spec.ts` - 47 tests (✅ running)
- [ ] (NEEDED) `e2e/dashboards.spec.ts` - Dashboard verification tests
- [ ] (NEEDED) `e2e/investor-operations.spec.ts` - Commitments & SPV tests
- [ ] (NEEDED) `e2e/user-management.spec.ts` - Admin user management tests
- [ ] (NEEDED) `e2e/operator-angel.spec.ts` - Operator Angel tests

---

## Recommendations

### Immediate (This Week)
1. **Create dashboard E2E tests** (US-AUTH-004, 005, 006)
   - Priority: CRITICAL
   - Effort: 12-16 hours
   - Impact: Verify core admin/compliance/investor interfaces

2. **Create investment operations E2E tests** (US-INVESTOR-007-010)
   - Priority: HIGH
   - Effort: 8-12 hours
   - Impact: Verify revenue-critical features

### Next Week
3. **Create user & role management E2E tests** (US-ADMIN-001-002)
   - Priority: HIGH
   - Effort: 6-8 hours
   - Impact: Verify user management interface

4. **Create comprehensive Operator Angel tests** (US-OPERATOR-001-003)
   - Priority: HIGH
   - Effort: 6-8 hours
   - Impact: Complete Operator Angel role coverage

### Ongoing
5. **Add E2E tests for communication features** (US-INVESTOR-014-015)
   - Priority: MEDIUM
   - Effort: 6-8 hours

6. **Add E2E tests for founder operations**
   - Priority: MEDIUM
   - Effort: 8-10 hours

---

## Statistics Summary

| Metric | Value |
|--------|-------|
| Total User Stories | 59 |
| Stories with E2E Tests | 11 (18%) |
| Stories without E2E Tests | 48 (82%) |
| Total E2E Test Cases | 95 |
| Avg E2E Tests per Story | 1.6 |
| Admin Stories E2E Coverage | 1/6 (17%) |
| Investor Stories E2E Coverage | 1/16 (6%) |
| Founder Stories E2E Coverage | 1/6 (17%) |
| Moderator Stories E2E Coverage | 1/3 (33%) |
| Compliance Stories E2E Coverage | 2/4 (50%) |
| Operator Angel Stories E2E Coverage | 0/3 (0%) |
| Authorization Stories E2E Coverage | 6/8 (75%) |

---

## Next Steps

1. ✅ Read full analysis in `TEST_COVERAGE_ANALYSIS.json`
2. 📋 Prioritize tests by impact (dashboards first)
3. 🧪 Create new E2E test files for gaps
4. 📊 Run tests and track coverage improvements
5. 🎯 Aim for 80%+ E2E coverage for all user-facing features

---

**Generated:** February 4, 2026  
**For:** India Angel Forum Development Team  
**Next Review:** After implementing P0 and P1 recommendations
