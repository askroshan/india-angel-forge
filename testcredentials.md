# India Angel Forum - Test Credentials

Complete test user credentials for testing the India Angel Forum platform locally.

**Last Updated:** February 3, 2026  
**Source:** `src/__tests__/fixtures/testData.ts` + `PROJECT_STATUS.md`

---

## Overview

8 test users covering all platform roles. All users have complete profiles and are ready for integration testing.

---

## Test Credentials

### 🔐 Admin User

| Field | Value |
|-------|-------|
| **Email** | `admin@indiaangelforum.test` |
| **Password** | `Admin@12345` |
| **Role** | Admin |
| **Full Name** | Admin User |
| **User ID** | admin-001 |
| **Access Level** | Full platform access, user management, event management, compliance oversight |

**Features to Test:**
- User management dashboard
- Role assignment
- Event creation and management
- Application review
- System statistics
- Audit logs

---

### 👮 Moderator User

| Field | Value |
|-------|-------|
| **Email** | `moderator@indiaangelforum.test` |
| **Password** | `Moderator@12345` |
| **Role** | Moderator |
| **Full Name** | Moderator User |
| **User ID** | moderator-001 |
| **Access Level** | Application screening, content moderation, event attendance management |

**Features to Test:**
- Founder application screening
- Content flags and moderation
- Event attendance tracking
- Application decision workflows

---

### ⚖️ Compliance Officer

| Field | Value |
|-------|-------|
| **Email** | `compliance@indiaangelforum.test` |
| **Password** | `Compliance@12345` |
| **Role** | Compliance Officer |
| **Full Name** | Compliance Officer |
| **User ID** | compliance-001 |
| **Access Level** | KYC verification, AML screening, accreditation review, compliance reporting |

**Features to Test:**
- KYC document review and verification
- AML screening and risk assessment
- Accreditation verification
- Compliance audit logs
- Investor verification workflows

---

### 💼 Standard Investor

| Field | Value |
|-------|-------|
| **Email** | `investor.standard@test.com` |
| **Password** | `Investor@12345` |
| **Role** | Standard Investor |
| **Full Name** | Rahul Sharma |
| **User ID** | investor-standard-001 |
| **Membership Type** | Standard Member |
| **Account Status** | Active |
| **Access Level** | Deal browsing, interest expression, portfolio tracking |

**Features to Test:**
- Browse available deals
- View deal details and documents
- Express interest in deals
- Track deal pipeline
- View portfolio
- Send direct messages
- Create discussion threads

---

### 🚀 Operator Angel

| Field | Value |
|-------|-------|
| **Email** | `operator.angel@test.com` |
| **Password** | `Operator@12345` |
| **Role** | Operator Angel |
| **Full Name** | Priya Patel |
| **User ID** | investor-operator-001 |
| **Membership Type** | Operator Angel |
| **Domain Expertise** | SaaS |
| **Years Experience** | 12 |
| **Account Status** | Active |
| **Access Level** | All investor features + advisory services |

**Features to Test:**
- Create advisory profile
- Track advisory hours
- Mentorship relationships
- All investor features

---

### 👨‍💼 Family Office

| Field | Value |
|-------|-------|
| **Email** | `family.office@test.com` |
| **Password** | `FamilyOffice@12345` |
| **Role** | Family Office |
| **Full Name** | Rajesh Mehta |
| **User ID** | investor-family-001 |
| **Membership Type** | Family Office |
| **Team Seats** | 3 |
| **Team Members** | rajesh@mehta.com, anjali@mehta.com, vikram@mehta.com |
| **Account Status** | Active |
| **Access Level** | All investor features + multi-user management |

**Features to Test:**
- Family office portfolio management
- Team member collaboration
- Multi-seat investment tracking
- Shared decision-making workflows
- All investor features

---

### 👨‍🏫 Founder

| Field | Value |
|-------|-------|
| **Email** | `founder@startup.test` |
| **Password** | `Founder@12345` |
| **Role** | Founder |
| **Full Name** | Amit Kumar |
| **User ID** | founder-001 |
| **Company** | TechStartup AI |
| **Application Status** | Forum Selected |
| **Industry** | AI & Deep Tech |
| **Fundraising Stage** | Seed |
| **Raising Amount** | ₹3 Crores |
| **Access Level** | Application tracking, pitch materials, investor outreach |

**Features to Test:**
- Track application status
- Upload pitch deck and documents
- View investor profiles
- Schedule pitch sessions
- Receive investor feedback
- Send direct messages
- Post investor updates

---

### 👤 Guest User (Regular Member)

| Field | Value |
|-------|-------|
| **Email** | `user@test.com` |
| **Password** | `User@12345` |
| **Role** | User |
| **Full Name** | Guest User |
| **User ID** | user-001 |
| **Access Level** | Educational content, public events |

**Features to Test:**
- Public content access
- Event registration
- Community forum browsing
- Basic profile creation

---

## Quick Test Matrix

| Feature | Admin | Moderator | Compliance | Investor | Operator | Family Office | Founder | Guest |
|---------|-------|-----------|-----------|----------|----------|--------------|---------|-------|
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Role Assignment | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Event Management | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Application Review | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| KYC Verification | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Browse Deals | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Express Interest | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Submit Investment | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create SPV | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Portfolio Tracking | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Direct Messages | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Upload Documents | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Pitch Management | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Advisory Services | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Mentorship | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## API Testing with cURL

### Admin Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@indiaangelforum.test",
    "password": "Admin@12345"
  }'
```

### Investor Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "investor.standard@test.com",
    "password": "Investor@12345"
  }'
```

### Compliance Officer Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "compliance@indiaangelforum.test",
    "password": "Compliance@12345"
  }'
```

---

## Frontend Testing URLs

| Feature | URL |
|---------|-----|
| **Home** | `http://localhost:8080/` |
| **Admin Dashboard** | `http://localhost:8080/admin` |
| **Deal Browsing** | `http://localhost:8080/deals` |
| **Portfolio** | `http://localhost:8080/portfolio` |
| **KYC Upload** | `http://localhost:8080/kyc-upload` |
| **Pitch Sessions** | `http://localhost:8080/pitch-sessions` |
| **Investor Directory** | `http://localhost:8080/investor-directory` |
| **Messages** | `http://localhost:8080/messages` |
| **Events** | `http://localhost:8080/events` |
| **Compliance Dashboard** | `http://localhost:8080/compliance` |

---

## Test Scenarios

### Scenario 1: Complete Investor Journey
1. Login as `investor.standard@test.com`
2. Browse available deals
3. Express interest in a deal
4. Upload KYC documents
5. Submit investment commitment
6. View portfolio

### Scenario 2: Compliance Verification
1. Login as `compliance@indiaangelforum.test`
2. Review KYC documents
3. Perform AML screening
4. Verify accreditation status
5. Generate compliance report

### Scenario 3: Admin Platform Management
1. Login as `admin@indiaangelforum.test`
2. View and manage users
3. Assign roles
4. Create events
5. Review applications
6. View audit logs

### Scenario 4: Founder Pitch Management
1. Login as `founder@startup.test`
2. Track application status
3. Upload pitch deck
4. Schedule pitch sessions
5. View interested investors
6. Send updates to investors

### Scenario 5: Operator Advisory Services
1. Login as `operator.angel@test.com`
2. Create advisory profile
3. Log advisory hours
4. View mentorship relationships
5. Browse and invest in deals
6. Manage portfolio

---

## Password Requirements

All test passwords follow platform security requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@, #, $, etc.)

Format: `Role@12345`

---

## Database Seeding

To populate the database with test users and data:

```bash
npm run test:seed
```

This command will:
- Create all 8 test users
- Generate founder applications
- Generate investor applications
- Create events
- Generate KYC documents
- Create deal opportunities

---

## Important Notes

⚠️ **Testing Only** - These credentials are for local testing/development only  
⚠️ **Never Commit Real Passwords** - These are test credentials, not production credentials  
✅ **All Users Verified** - All test users pass KYC/compliance checks  
✅ **Complete Profiles** - Each user has full profile data configured  
✅ **Test Data Included** - Associated companies, deals, and documents included

---

## Troubleshooting

### Login Not Working
- Verify user is created in database
- Check password is exact (case-sensitive)
- Clear browser localStorage and try again
- Check server logs for API errors

### Missing User Features
- Verify user role is correct
- Check role-based access control permissions
- Confirm user status is 'active'
- Check if compliance requirements are met (KYC, etc.)

### Password Reset
- Each test user can use "Forgot Password" feature
- Reset link sent to their test email address
- Or manually reset in database via Prisma Studio

---

## Additional Resources

- **Test Fixtures:** `src/__tests__/fixtures/testData.ts`
- **Test Files:** `src/__tests__/**/*.test.tsx`
- **E2E Tests:** `e2e/**/*.spec.ts`
- **API Docs:** `USER_STORIES.md`
- **Project Status:** `PROJECT_STATUS.md`

---

**Created:** February 3, 2026  
**Last Verified:** All 699 tests passing ✅
