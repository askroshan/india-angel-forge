# India Angel Forum — Test Credentials

Complete test user credentials for the India Angel Forum platform.

**Last Updated:** February 9, 2026
**Source of Truth:** `prisma/seed/index.ts` (database seed script)
**E2E Test Suite:** 1233/1233 passing across 5 browser projects

---

## Seeded Users (9 accounts)

All users below are created by `npx tsx prisma/seed/index.ts`. Passwords are bcrypt-hashed in PostgreSQL.

---

### 🔐 1. Admin

| Field | Value |
|-------|-------|
| **Email** | `admin@indiaangelforum.test` |
| **Password** | `Admin@12345` |
| **Full Name** | Admin User |
| **Roles** | `admin` |

**Access:** Full platform — user management, role assignment, event CRUD, application review, deal creation, system statistics, audit logs, payments, messaging.

**Used in E2E tests:** `admin-operations`, `authorization`, `crud-operations`, `deal-management`, `spv-management`, `investor-messaging`, `portfolio-dashboard`, `transaction-history`, `activity-timeline`, `financial-statements`, `compliance-kyc`, `event-attendance`, `event-crud-full`.

---

### 👮 2. Moderator

| Field | Value |
|-------|-------|
| **Email** | `moderator@indiaangelforum.test` |
| **Password** | `Moderator@12345` |
| **Full Name** | Moderator User |
| **Roles** | `moderator` |

**Access:** Application screening (founder/investor), content moderation, event attendance management.

**Used in E2E tests:** `authorization`, `crud-operations`, `application-crud-full`, `event-crud-full`.

---

### ⚖️ 3. Compliance Officer

| Field | Value |
|-------|-------|
| **Email** | `compliance@indiaangelforum.test` |
| **Password** | `Compliance@12345` |
| **Full Name** | Compliance Officer |
| **Roles** | `compliance_officer` |

**Access:** KYC document review & verification, AML screening & risk assessment, accreditation review, compliance audit logs.

**Used in E2E tests:** `authorization`, `crud-operations`, `compliance-kyc`.

---

### 💼 4. Standard Investor (Primary)

| Field | Value |
|-------|-------|
| **Email** | `investor.standard@test.com` |
| **Password** | `Investor@12345` |
| **Full Name** | Rahul Sharma |
| **Roles** | `investor` |

**Access:** Browse deals, express interest, commit to deals, create SPVs, portfolio tracking, messaging, KYC upload, event registration.

**Used in E2E tests:** `authorization`, `crud-operations`, `admin-operations`, `deal-management`, `spv-management`, `investor-messaging`, `portfolio-dashboard`, `compliance-kyc` (KYC seed target).

---

### 💼 5. Standard Investor (Secondary)

| Field | Value |
|-------|-------|
| **Email** | `investor.standard2@test.com` |
| **Password** | `Investor@12345` |
| **Full Name** | Priya Mehta |
| **Roles** | `investor` |

**Access:** Same as Standard Investor. Used as a second investor for multi-user test scenarios.

**Used in E2E tests:** `application-crud-full`.

---

### 🚀 6. Operator Angel

| Field | Value |
|-------|-------|
| **Email** | `operator.angel@test.com` |
| **Password** | `Operator@12345` |
| **Full Name** | Priya Patel |
| **Roles** | `investor`, `operator_angel` |

**Access:** All investor features + advisory services, mentorship.

**Used in E2E tests:** `authorization`, `crud-operations`.

---

### 👨‍💼 7. Family Office

| Field | Value |
|-------|-------|
| **Email** | `family.office@test.com` |
| **Password** | `FamilyOffice@12345` |
| **Full Name** | Rajesh Mehta |
| **Roles** | `investor`, `family_office` |

**Access:** All investor features + multi-seat team management.

**Used in E2E tests:** `authorization`.

---

### 👨‍🏫 8. Founder

| Field | Value |
|-------|-------|
| **Email** | `founder@startup.test` |
| **Password** | `Founder@12345` |
| **Full Name** | Amit Kumar |
| **Roles** | `founder` |

**Access:** Application tracking, pitch deck upload, pitch sessions, investor outreach, company profile, investor updates.

**Used in E2E tests:** `authorization`, `crud-operations`, `application-crud-full`, `event-crud-full`.

---

### 👤 9. Guest / Regular User

| Field | Value |
|-------|-------|
| **Email** | `user@test.com` |
| **Password** | `User@12345` |
| **Full Name** | Guest User |
| **Roles** | `user` |

**Access:** Public content, event browsing & registration, community forum.

**Used in E2E tests:** `authorization`.

---

## Dynamically Created Test Users

These users are **not** in the seed file. They are created on-the-fly by E2E test seed endpoints (`/api/test/seed-*`) during test runs. They have dummy password hashes and cannot be used for manual login.

| Email | Full Name | Created By |
|-------|-----------|------------|
| `test.applicant@test.com` | Test Applicant | `/api/test/seed-admin-applications` |
| `test.founder@test.com` | Test Founder | `/api/test/seed-admin-applications` |
| `accreditation.test1@test.com` | Accreditation Applicant 1 | `/api/test/seed-accreditation-applications` |
| `accreditation.test2@test.com` | Accreditation Applicant 2 | `/api/test/seed-accreditation-applications` |

Additionally, many E2E test files (e.g. `payment-razorpay`, `email-notifications`) create ephemeral users via `/api/auth/signup` with randomized emails like `investor_<timestamp>@test.com`. These are throwaway and not reusable.

---

## Quick Reference Table

| # | Role | Email | Password |
|---|------|-------|----------|
| 1 | Admin | `admin@indiaangelforum.test` | `Admin@12345` |
| 2 | Moderator | `moderator@indiaangelforum.test` | `Moderator@12345` |
| 3 | Compliance Officer | `compliance@indiaangelforum.test` | `Compliance@12345` |
| 4 | Investor (Primary) | `investor.standard@test.com` | `Investor@12345` |
| 5 | Investor (Secondary) | `investor.standard2@test.com` | `Investor@12345` |
| 6 | Operator Angel | `operator.angel@test.com` | `Operator@12345` |
| 7 | Family Office | `family.office@test.com` | `FamilyOffice@12345` |
| 8 | Founder | `founder@startup.test` | `Founder@12345` |
| 9 | Guest / User | `user@test.com` | `User@12345` |

---

## Access Control Matrix

| Feature | Admin | Moderator | Compliance | Investor | Op. Angel | Family Office | Founder | Guest |
|---------|:-----:|:---------:|:----------:|:--------:|:---------:|:-------------:|:-------:|:-----:|
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Role Assignment | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System Statistics | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Application Review | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Event Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Event Attendance | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| KYC Verification | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AML Screening | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Accreditation Review | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Browse Deals | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Express Interest | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Commit to Deals | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create SPV | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Portfolio Tracking | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Transaction History | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Financial Statements | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Certificates | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Activity Timeline | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Direct Messages | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Upload Documents | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Pitch Management | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Company Profile | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Event Registration | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Public Content | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## API Testing with cURL

### Login (any user)

```bash
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@indiaangelforum.test", "password": "Admin@12345"}' | jq .
```

### Use the token

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@indiaangelforum.test", "password": "Admin@12345"}' | jq -r '.token')

# Example: Get events
curl -s http://localhost:3001/api/events \
  -H "Authorization: Bearer $TOKEN" | jq .

# Example: Get payment history
curl -s http://localhost:3001/api/payments/history \
  -H "Authorization: Bearer $TOKEN" | jq .

# Example: Get admin statistics
curl -s http://localhost:3001/api/admin/statistics \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Frontend URLs

| Page | URL | Required Role |
|------|-----|---------------|
| Home | `http://localhost:8080/` | Public |
| Login | `http://localhost:8080/login` | Public |
| Events | `http://localhost:8080/events` | Public |
| Admin Dashboard | `http://localhost:8080/admin` | `admin` |
| Deals | `http://localhost:8080/deals` | `investor` |
| Investor Deals | `http://localhost:8080/investor/deals` | `investor` |
| Deal Pipeline | `http://localhost:8080/investor/pipeline` | `investor` |
| Portfolio | `http://localhost:8080/investor/portfolio` | `investor` |
| Portfolio Performance | `http://localhost:8080/investor/portfolio/performance` | `investor` |
| KYC Upload | `http://localhost:8080/investor/kyc` | `investor` |
| Messages | `http://localhost:8080/investor/messages` | `investor` |
| Transaction History | `http://localhost:8080/transaction-history` | Authenticated |
| Financial Statements | `http://localhost:8080/financial-statements` | Authenticated |
| Certificates | `http://localhost:8080/certificates` | Authenticated |
| Activity Timeline | `http://localhost:8080/activity` | Authenticated |
| Compliance — KYC Review | `http://localhost:8080/compliance/kyc-review` | `compliance_officer` |
| Compliance — AML | `http://localhost:8080/compliance/aml-screening` | `compliance_officer` |
| Compliance — Accreditation | `http://localhost:8080/compliance/accreditation` | `compliance_officer` |
| Moderator — Applications | `http://localhost:8080/moderator/applications` | `moderator` |
| Moderator — Content | `http://localhost:8080/moderator/content` | `moderator` |
| Founder — Application Status | `http://localhost:8080/founder/application-status` | `founder` |
| Founder — Pitch Sessions | `http://localhost:8080/founder/pitch-sessions` | `founder` |
| Founder — Pitch Materials | `http://localhost:8080/founder/pitch-materials` | `founder` |
| Founder — Company Profile | `http://localhost:8080/founder/company-profile` | `founder` |
| Founder — Investor Updates | `http://localhost:8080/founder/investor-updates` | `founder` |
| Apply as Investor | `http://localhost:8080/apply/investor` | Public |
| Apply as Founder | `http://localhost:8080/apply/founder` | Public |
| Membership | `http://localhost:8080/membership` | Authenticated |
| Certificate Verification | `http://localhost:8080/verify-certificate` | Public |

---

## Seeded Test Data

The seed script also creates:

| Data | Count | Details |
|------|-------|---------|
| **Events** | 3 | Monthly Angel Forum, Deep Tech Summit, Networking Night |
| **Industries** | 50 | AI/ML, Blockchain, FinTech, HealthTech, etc. |
| **Funding Stages** | 8 | Pre-Seed through Series D+, Bridge, Growth |
| **Event Types** | 10 | Monthly Forum, Pitch Day, Networking, Workshop, etc. |
| **Payments** (admin) | 23 | Nov 2025 – Feb 2026, various types/statuses/amounts |
| **Activity Logs** (admin) | 30 | Payment, deal, event, profile, document activities |
| **Event Attendance** | Varies | Seeded via `event-attendance-seed.ts` |
| **Financial Statements** | Varies | Seeded via `financial-statements-seed.ts` |

---

## How to Seed

```bash
# From project root
npx tsx prisma/seed/index.ts
```

This will:
1. Upsert all 9 test users with bcrypt-hashed passwords
2. Assign correct roles to each user
3. Create 3 test events
4. Seed 50 industries, 8 funding stages, 10 event types
5. Create 23 sample payments and 30 activity logs for the admin user
6. Seed event attendance and financial statement records

---

## Password Format

All passwords follow: `RoleName@12345`

Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character.

---

## Ports

| Service | Port |
|---------|------|
| **Backend API** | `http://localhost:3001` |
| **Frontend (Vite)** | `http://localhost:8080` |
| **PostgreSQL** | `localhost:5432` |

⚠️ The cURL examples use port **3001** (direct API). The frontend proxies `/api/*` requests to port 3001 automatically.

---

## Important Notes

- ⚠️ **Local/test use only** — never use these credentials in production
- ✅ All 9 users verified working in 1233 E2E tests (Feb 9, 2026)
- ✅ Passwords are bcrypt-hashed in PostgreSQL (not plaintext)
- ✅ JWT tokens expire after 7 days (configurable via `JWT_EXPIRES_IN`)
- ✅ Login response includes `token` + `user` object with `id`, `email`, `fullName`, `roles[]`
