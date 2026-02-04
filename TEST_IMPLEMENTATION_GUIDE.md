# Test Coverage Gaps - Detailed Implementation Guide

**Generated:** February 4, 2026

---

## Priority 1: Critical Dashboards (16 hours)

### US-AUTH-004: Admin Dashboard Data Verification
**File:** `e2e/dashboards.spec.ts`

```typescript
test.describe('US-AUTH-004: Admin Dashboard Data Verification', () => {
  
  test('admin dashboard displays total user count by role', async ({ page }) => {
    // GIVEN: Admin is logged in
    // WHEN: Admin visits /admin
    // THEN: Should display:
    //   - Total Users (count)
    //   - Investors (count)
    //   - Founders (count)
    //   - Compliance Officers (count)
    //   - Moderators (count)
    // AND: Numbers should match database counts
  });

  test('admin dashboard shows pending applications count', async ({ page }) => {
    // Should display:
    //   - Pending Investor Applications (count)
    //   - Pending Founder Applications (count)
    // AND: Clicking should navigate to applications page
  });

  test('admin dashboard displays active events', async ({ page }) => {
    // Should display:
    //   - Total Active Events
    //   - Total Event Registrations
    //   - Upcoming Events List (title, date, attendee count)
  });

  test('admin dashboard shows recent audit logs', async ({ page }) => {
    // Should display:
    //   - Last 10 audit log entries
    //   - User, action, timestamp for each
    //   - Link to view full audit logs
  });

  test('admin dashboard data refreshes on page navigation', async ({ page }) => {
    // WHEN: Admin navigates away and returns to /admin
    // THEN: Data should update to reflect current state
  });
});
```

**Estimated Time:** 4-6 hours
**Test Cases:** 5-7
**API Endpoints to Test:**
- GET `/api/admin/stats/users`
- GET `/api/admin/stats/applications`
- GET `/api/admin/stats/events`
- GET `/api/admin/audit-logs?limit=10`

---

### US-AUTH-005: Compliance Dashboard Data Verification
**File:** `e2e/dashboards.spec.ts` (or split to `e2e/compliance-dashboard.spec.ts`)

```typescript
test.describe('US-AUTH-005: Compliance Dashboard Data Verification', () => {
  
  test('compliance dashboard displays pending KYC reviews', async ({ page }) => {
    // Should show:
    //   - Total Pending KYC: X
    //   - List with investor name, submission date, document type
    // AND: Clicking should navigate to KYC review page
  });

  test('compliance dashboard displays pending AML screenings', async ({ page }) => {
    // Should show:
    //   - Total Pending AML: X
    //   - List with investor name, screening date, risk level
    // AND: Risk flags should be visually highlighted
  });

  test('compliance dashboard shows accreditation expiration alerts', async ({ page }) => {
    // Should highlight:
    //   - Expiring within 30 days (yellow)
    //   - Already expired (red)
    // AND: Should link to investor profile for re-verification
  });

  test('compliance dashboard displays recent compliance actions', async ({ page }) => {
    // Should show:
    //   - Last 10 compliance actions
    //   - User, action, investor, timestamp
    //   - Status (approved/rejected/pending)
  });

  test('compliance dashboard filter by status works', async ({ page }) => {
    // GIVEN: Multiple KYC/AML submissions with different statuses
    // WHEN: Filter by status (pending, approved, rejected)
    // THEN: Should show only matching items
  });

  test('compliance dashboard sort functionality works', async ({ page }) => {
    // Should support sorting by:
    //   - Date submitted (oldest/newest)
    //   - Investor name (A-Z/Z-A)
    //   - Risk level (high/low)
  });
});
```

**Estimated Time:** 3-4 hours
**Test Cases:** 6
**API Endpoints:**
- GET `/api/compliance/dashboard`
- GET `/api/compliance/kyc-review?status=pending`
- GET `/api/compliance/aml-screenings?status=pending`
- GET `/api/compliance/accreditations?expiring=true`

---

### US-AUTH-006: Investor Dashboard Data Verification
**File:** `e2e/dashboards.spec.ts`

```typescript
test.describe('US-AUTH-006: Investor Dashboard Data Verification', () => {
  
  test('investor dashboard displays available deals matching preferences', async ({ page }) => {
    // Should show:
    //   - Available Deals count
    //   - List filtered by investor preferences
    //   - Deal title, amount, stage, sector
    // AND: Should respect investor's investment preferences
  });

  test('investor dashboard shows expressed interests', async ({ page }) => {
    // Should display:
    //   - My Interests (count)
    //   - List with deal name, status, interest date
    //   - Link to view details
  });

  test('investor dashboard displays investment commitments', async ({ page }) => {
    // Should show:
    //   - Committed Deals
    //   - Amount committed, payment status, close date
    //   - Link to payment instructions if pending
  });

  test('investor dashboard shows portfolio overview', async ({ page }) => {
    // Should display:
    //   - Portfolio Companies (count)
    //   - Total Invested amount
    //   - Current Portfolio Value
    //   - Unrealized Gains/Losses
  });

  test('investor dashboard shows KYC/accreditation status prompts', async ({ page }) => {
    // If KYC pending:
    //   - "Complete your KYC to start investing" with link
    // If Accreditation pending:
    //   - "Verify accreditation to invest in premium deals"
    // If Complete:
    //   - Green checkmark "Verified investor"
  });

  test('investor dashboard displays recommended deals', async ({ page }) => {
    // Should show:
    //   - "Deals matching your profile"
    //   - Based on sectors, check size, stage preferences
  });
});
```

**Estimated Time:** 4-6 hours
**Test Cases:** 6
**API Endpoints:**
- GET `/api/deals?status=active`
- GET `/api/deals/interests`
- GET `/api/investor/commitments`
- GET `/api/portfolio/summary`
- GET `/api/investor/profile/verification-status`

---

## Priority 2: Investment Operations (12 hours)

### US-INVESTOR-007: Submit Investment Commitment
**File:** `e2e/investor-operations.spec.ts`

```typescript
test.describe('US-INVESTOR-007: Submit Investment Commitment', () => {
  
  test.describe('CREATE Commitment', () => {
    test('investor can submit investment commitment', async ({ page }) => {
      // GIVEN: Investor has completed due diligence
      // WHEN: Investor navigates to deal and clicks "Commit"
      // THEN: Modal/form appears with fields:
      //   - Investment Amount
      //   - Participation in SPV (yes/no)
      //   - Accept Terms checkbox
      // AND: Can submit and receives confirmation
      // AND: Deal status changes to "Committed"
    });

    test('investor cannot commit without required fields', async ({ page }) => {
      // Should show validation errors for:
      //   - Missing amount
      //   - Terms not accepted
      //   - Invalid amount (zero, negative, below minimum)
    });

    test('investor cannot commit more than available in round', async ({ page }) => {
      // If round has $100k capacity and $80k committed:
      //   - Should only allow commitment up to $20k
      //   - Should show remaining capacity
    });
  });

  test.describe('READ Commitment', () => {
    test('investor can view committed deals', async ({ page }) => {
      // Should show:
      //   - Committed deals list
      //   - Amount, commitment date, payment status
      //   - Payment instructions link
    });

    test('investor can view commitment details', async ({ page }) => {
      // Should display:
      //   - Commitment amount
      //   - Participation in SPV (yes/no)
      //   - Payment due date
      //   - Payment instructions
      //   - Investor's pro-rata allocation
    });
  });

  test.describe('UPDATE Commitment', () => {
    test('investor can update commitment amount before payment', async ({ page }) => {
      // If commitment not yet paid:
      //   - Can increase/decrease amount (within limits)
      //   - Changes reflected immediately
    });

    test('investor cannot update commitment after payment', async ({ page }) => {
      // If payment received:
      //   - Update button disabled
      //   - "Locked after payment" message shown
    });
  });

  test.describe('DELETE Commitment', () => {
    test('investor can cancel commitment before payment', async ({ page }) => {
      // If not yet paid:
      //   - Can cancel with "Retract Commitment" button
      //   - Removes from committed deals
      //   - Confirms with modal before deletion
    });

    test('investor cannot cancel commitment after payment', async ({ page }) => {
      // If payment received:
      //   - Button disabled with reason: "Cannot retract after payment"
    });
  });
});
```

**Estimated Time:** 3-4 hours
**Test Cases:** 10-12
**Key Flows:**
- Browse deals → Find deal → Click express interest → Complete DD → Submit commitment
- View committed deals → View details → Manage commitment (update/cancel)

---

### US-INVESTOR-008-010: SPV Management
**File:** `e2e/investor-operations.spec.ts` (continued)

```typescript
test.describe('US-INVESTOR-008-010: SPV Management', () => {
  
  test.describe('CREATE SPV', () => {
    test('investor can create SPV for deal', async ({ page }) => {
      // WHEN: Investor clicks "Create SPV" on deal page
      // THEN: Modal shows form with:
      //   - SPV Name
      //   - Associated Deal (pre-filled)
      //   - Target Raise Amount
      //   - Minimum Investment per Member
      //   - Carry % (investor's performance fee)
      //   - Hurdle Rate
      // AND: SPV created with status "open"
      // AND: Investor becomes SPV lead
    });

    test('SPV requires minimum fields', async ({ page }) => {
      // Validation for:
      //   - SPV name (required, unique)
      //   - Target raise (required, > 0)
      //   - Carry % (0-30%, default 20%)
    });
  });

  test.describe('INVITE Co-Investors', () => {
    test('SPV lead can invite investors', async ({ page }) => {
      // GIVEN: SPV created and open for commitments
      // WHEN: Click "Invite Investors"
      // THEN: Form allows:
      //   - Email address input
      //   - Custom message
      //   - Allocation amount (optional)
      //   - Deadline for response
      // AND: Invitation sent with SPV details
    });

    test('invited investors receive email with SPV details', async ({ page }) => {
      // Email should include:
      //   - SPV name and deal
      //   - Raise target and minimum investment
      //   - Carry structure
      //   - Invitation link
    });

    test('invited investor can accept SPV invitation', async ({ page }) => {
      // GIVEN: Investor receives invitation email
      // WHEN: Clicks "Join SPV" link
      // THEN: Can submit commitment for SPV
      // AND: Added to SPV members list
      // AND: SPV lead sees accepted invitation
    });

    test('SPV lead can track invitation status', async ({ page }) => {
      // Should show:
      //   - Pending invitations
      //   - Accepted invitations with amounts
      //   - Declined invitations
      //   - Expiration dates
    });
  });

  test.describe('MANAGE SPV Allocations', () => {
    test('SPV lead can view member allocations', async ({ page }) => {
      // Should display:
      //   - Member name
      //   - Committed amount
      //   - Pro-rata ownership %
      //   - Payment status
      //   - Carried amount (if deal exits)
    });

    test('SPV lead can adjust allocations if oversubscribed', async ({ page }) => {
      // If committed amount > target:
      //   - Can pro-rata reduction
      //   - Can invite additional investors
      //   - Can increase target
    });

    test('SPV lead can mark payments as received', async ({ page }) => {
      // WHEN: Click "Mark as Paid" for member
      // THEN: Payment status changes to "Received"
      // AND: Audit log entry created
      // AND: Investor notified of payment receipt
    });

    test('SPV can be closed when fully committed', async ({ page }) => {
      // WHEN: All committed amounts received
      // AND: Click "Close SPV"
      // THEN: SPV locked, no new invitations
      // AND: Fund transfer can proceed
    });
  });

  test.describe('READ SPV Details', () => {
    test('SPV lead can view SPV dashboard', async ({ page }) => {
      // Shows:
      //   - Committed vs. Target
      //   - Member list
      //   - Payment status summary
      //   - Deal details
    });

    test('SPV members can view SPV details (read-only)', async ({ page }) => {
      // Can see:
      //   - SPV structure and carry
      //   - Member list (anonymized)
      //   - Their own commitment & allocation
      //   - Deal details
    });
  });
});
```

**Estimated Time:** 5-6 hours
**Test Cases:** 12-14

---

## Priority 3: User & Role Management (8 hours)

### US-ADMIN-001-002: User & Role Management
**File:** `e2e/user-management.spec.ts`

```typescript
test.describe('US-ADMIN-001-002: User & Role Management', () => {
  
  test.describe('CREATE User', () => {
    test('admin can create new user manually', async ({ page }) => {
      // IF: Manual user creation is enabled
      // WHEN: Admin visits /admin/users/create
      // THEN: Form with fields:
      //   - Email (required, unique)
      //   - First Name
      //   - Last Name
      //   - Roles (multi-select)
      //   - Status (active/inactive)
      // AND: User created and sent invitation email
    });

    test('admin cannot create duplicate email', async ({ page }) => {
      // Should show validation error:
      //   - "Email already exists"
    });

    test('admin must select at least one role', async ({ page }) => {
      // Should require role selection with error:
      //   - "Must assign at least one role"
    });
  });

  test.describe('READ Users', () => {
    test('admin can view paginated user list', async ({ page }) => {
      // Should display:
      //   - User email
      //   - First/Last name
      //   - Assigned roles (badges)
      //   - Account status
      //   - Registration date
      //   - Last login date
      // AND: Pagination controls (10/25/50 per page)
    });

    test('admin can search users by email or name', async ({ page }) => {
      // WHEN: Type in search box
      // THEN: Table filters in real-time
      // AND: Shows matching users only
      // AND: Shows "X results" count
    });

    test('admin can filter users by role', async ({ page }) => {
      // WHEN: Select role filter
      // THEN: Shows only users with that role
      // AND: Can filter by multiple roles
    });

    test('admin can sort users by column', async ({ page }) => {
      // Can sort by:
      //   - Email (A-Z)
      //   - Registration Date (newest/oldest)
      //   - Last Login (most recent)
    });

    test('admin can view user detail profile', async ({ page }) => {
      // Should show:
      //   - Full profile information
      //   - All assigned roles with status
      //   - KYC/accreditation status (if investor)
      //   - Last login & IP address
      //   - Account creation date
      //   - Action buttons (edit, deactivate, reset password)
    });
  });

  test.describe('UPDATE User', () => {
    test('admin can update user information', async ({ page }) => {
      // WHEN: Edit user details
      // THEN: Can update:
      //   - First/Last name
      //   - Status (active/inactive)
      // AND: Changes saved and audit logged
    });

    test('admin can assign new role to user', async ({ page }) => {
      // WHEN: Click "Add Role" on user detail
      // THEN: Modal to select role
      // AND: New role added to user
      // AND: User sent notification email
      // AND: Audit log created
    });

    test('admin can remove role from user', async ({ page }) => {
      // WHEN: Click "Remove" next to role
      // THEN: Role removed after confirmation
      // AND: Cannot remove last admin from admin user
      // AND: User notified
      // AND: Audit log created
    });

    test('admin can deactivate user account', async ({ page }) => {
      // WHEN: Click "Deactivate" button
      // THEN: Account marked inactive
      // AND: User cannot login
      // AND: User sent notification
      // AND: Can be reactivated later
    });

    test('admin can reset user password', async ({ page }) => {
      // WHEN: Click "Reset Password"
      // THEN: Password reset email sent
      // AND: User can set new password
      // AND: Audit log created
    });
  });

  test.describe('DELETE User', () => {
    test('admin can delete inactive user', async ({ page }) => {
      // IF: User is inactive for 90+ days
      // WHEN: Click "Delete Account"
      // THEN: Confirmation modal appears
      // AND: On confirm, user account deleted
      // AND: Audit log created
      // AND: User data retention follows policy
    });

    test('admin cannot delete active user', async ({ page }) => {
      // WHEN: Try to delete active user
      // THEN: Button disabled with reason:
      //   - "Must deactivate user first"
    });

    test('admin cannot delete last admin', async ({ page }) => {
      // WHEN: Try to delete only admin user
      // THEN: Error message:
      //   - "Cannot delete the last admin account"
    });
  });

  test.describe('Bulk Role Assignment', () => {
    test('admin can bulk assign role to multiple users', async ({ page }) => {
      // WHEN: Select multiple users with checkboxes
      // THEN: "Bulk Actions" dropdown appears
      // AND: Can select "Add Role"
      // AND: Choose role and apply to all selected
      // AND: Audit log entries created for each
    });

    test('admin can bulk deactivate users', async ({ page }) => {
      // WHEN: Select multiple users
      // AND: Click "Bulk Actions" → "Deactivate"
      // THEN: All selected users deactivated
      // AND: Confirmation modal with count
      // AND: Audit logs created
    });
  });
});
```

**Estimated Time:** 6-8 hours
**Test Cases:** 14-18

---

## Priority 4: Operator Angel (8 hours)

### US-OPERATOR-001-003: Operator Angel Features
**File:** `e2e/operator-angel.spec.ts`

```typescript
test.describe('US-OPERATOR-001-003: Operator Angel Features', () => {
  
  test.describe('US-OPERATOR-001: Create & Manage Advisory Profile', () => {
    test('operator angel can create advisory profile', async ({ page }) => {
      // WHEN: Operator angel visits /operator/advisory
      // THEN: Can create profile with:
      //   - Areas of expertise (multi-select)
      //   - Hourly rate or engagement terms
      //   - Availability hours per month
      //   - Bio/description
      //   - LinkedIn profile
      // AND: Profile published and visible to founders
    });

    test('operator angel can update advisory profile', async ({ page }) => {
      // WHEN: Edit profile
      // THEN: Can update any field
      // AND: Changes saved and published immediately
      // AND: Audit log created
    });

    test('operator angel can view advisory requests', async ({ page }) => {
      // Should show:
      //   - Pending requests (awaiting acceptance)
      //   - Accepted requests (in progress)
      //   - Completed requests
      //   - Each with founder name, company, request date
    });

    test('operator angel can accept/decline advisory request', async ({ page }) => {
      // WHEN: View pending request
      // THEN: Can "Accept" or "Decline"
      // AND: Founder notified of response
      // AND: Audit log created
      // AND: If accepted, session scheduled
    });

    test('operator angel can deactivate advisory profile', async ({ page }) => {
      // WHEN: Click "Deactivate Profile"
      // THEN: Profile hidden from founders
      // AND: Pending requests put on hold
      // AND: Can reactivate later
    });
  });

  test.describe('US-OPERATOR-002: Track Advisory Hours', () => {
    test('operator angel can log advisory hours', async ({ page }) => {
      // WHEN: Click "Log Hours" on portfolio or advisory
      // THEN: Form with:
      //   - Company name (dropdown from portfolio)
      //   - Date and duration (hours)
      //   - Topic/focus area (expertise tags)
      //   - Notes
      // AND: Hours recorded in system
    });

    test('operator angel can view hours by company', async ({ page }) => {
      // Should show:
      //   - Total hours per company
      //   - Monthly breakdown
      //   - Topic breakdown (% time per area)
      // AND: Charts showing hours trends
    });

    test('operator angel can generate hours report', async ({ page }) => {
      // WHEN: Select date range
      // THEN: Can download report showing:
      //   - Total hours logged
      //   - Hours by company
      //   - Hours by topic
      //   - Estimated value at hourly rate
    });

    test('company founder can confirm logged hours', async ({ page }) => {
      // WHEN: Founder views advisor activity
      // THEN: Can see logged hours
      // AND: Can confirm or dispute hours
      // AND: Confirmation/dispute affects advisor credibility
    });

    test('operator angel cannot log hours without company', async ({ page }) => {
      // If no portfolio companies:
      //   - Form disabled with message: "Must have portfolio companies to log hours"
    });
  });

  test.describe('US-OPERATOR-003: Manage Mentorships', () => {
    test('operator angel can establish mentorship', async ({ page }) => {
      // WHEN: Founder requests mentorship
      // THEN: Operator can accept with:
      //   - Frequency (weekly, bi-weekly, monthly)
      //   - Duration (3/6/12 months)
      //   - Mentorship goals
      // AND: Mentorship created and visible to both
    });

    test('operator angel can schedule mentorship sessions', async ({ page }) => {
      // WHEN: Click "Schedule Session" on mentorship
      // THEN: Calendar to select:
      //   - Date and time
      //   - Meeting format (video, in-person, phone)
      //   - Duration
      //   - Topics to discuss
      // AND: Meeting calendar invites sent
      // AND: Reminders sent before meeting
    });

    test('operator angel can log mentorship notes', async ({ page }) => {
      // AFTER: Mentorship session
      // WHEN: Click "Add Notes"
      // THEN: Can record:
      //   - Topics discussed
      //   - Advice given
      //   - Action items for founder
      //   - Follow-up needed
      // AND: Founder can view notes
      // AND: Notes audit logged
    });

    test('operator angel can track mentorship progress', async ({ page }) => {
      // Should show:
      //   - Sessions completed
      //   - Progress toward goals
      //   - Founder feedback (ratings)
      //   - Summary of impact
    });

    test('either party can end mentorship', async ({ page }) => {
      // WHEN: Click "End Mentorship"
      // THEN: Confirmation modal
      // AND: Both parties notified
      // AND: Mentorship moved to completed
      // AND: Can be reviewed/rated
    });

    test('operator angel can view all mentorships', async ({ page }) => {
      // Should show:
      //   - List of all mentorships
      //   - Status (active, completed)
      //   - Company name
      //   - Duration and progress
      //   - Last session date
      //   - Founder rating
    });
  });
});
```

**Estimated Time:** 6-8 hours
**Test Cases:** 16-18

---

## Summary of Required Tests

| Priority | User Stories | Test Cases | Hours | File |
|----------|-------------|-----------|-------|------|
| P0 | US-AUTH-004, 005, 006 | 15-20 | 12-16 | `dashboards.spec.ts` |
| P1 | US-INVESTOR-007-010 | 22-28 | 8-12 | `investor-operations.spec.ts` |
| P1 | US-ADMIN-001-002 | 14-18 | 6-8 | `user-management.spec.ts` |
| P1 | US-OPERATOR-001-003 | 16-18 | 6-8 | `operator-angel.spec.ts` |
| **TOTAL** | **8 stories** | **67-84** | **32-44 hours** | **4 files** |

---

## Test Execution Checklist

- [ ] Create `e2e/dashboards.spec.ts` (15-20 tests)
- [ ] Create `e2e/investor-operations.spec.ts` (22-28 tests)
- [ ] Create `e2e/user-management.spec.ts` (14-18 tests)
- [ ] Create `e2e/operator-angel.spec.ts` (16-18 tests)
- [ ] Run all E2E tests: `npm run test:e2e`
- [ ] Review test failures and fix implementation issues
- [ ] Add performance tests for dashboard loads
- [ ] Add accessibility tests for new forms
- [ ] Update test coverage report

---

**Total E2E Tests Currently:** 95  
**Total E2E Tests After:** 162-179 (+67-84 tests)  
**Test Coverage Improvement:** 13.6% → 25-27%

