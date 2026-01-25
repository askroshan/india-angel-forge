# India Angel Forum - Architecture Gaps Analysis

## Executive Summary

This document identifies architectural, security, performance, maintainability, and operational gaps in the India Angel Forum platform - an angel investor network connecting accredited investors with early-stage startups.

---

## 1. Testing Infrastructure

### Critical Gaps

| Gap | Severity | Impact |
|-----|----------|--------|
| No unit tests present | 🔴 Critical | Zero code coverage, high regression risk |
| No integration tests | 🔴 Critical | API interactions untested |
| No E2E tests | 🔴 Critical | User flows unvalidated |
| No test configuration | 🔴 Critical | No Vitest/Jest setup |

### Recommendations

- Add Vitest for unit/integration testing
- Add Playwright or Cypress for E2E testing
- Implement test coverage thresholds (minimum 70%)
- Create test utilities for Supabase mocking

---

## 2. TypeScript Configuration

### Identified Gaps

| Setting | Current | Recommended |
|---------|---------|-------------|
| `strictNullChecks` | `false` | `true` |
| `noImplicitAny` | `false` | `true` |
| `noUnusedLocals` | `false` | `true` |
| `noUnusedParameters` | `false` | `true` |

### Impact

- Runtime null/undefined errors not caught at compile time
- Type safety significantly weakened
- Dead code accumulates without warnings
- Potential for `any` types propagating through codebase

---

## 3. Security Concerns

### 3.1 Edge Functions Security

| Function | `verify_jwt` | Risk Level |
|----------|--------------|------------|
| `create-membership-checkout` | `false` | 🟡 Medium |
| `send-membership-confirmation` | `false` | 🟡 Medium |
| `check-subscription` | `false` | 🟡 Medium |
| `customer-portal` | `false` | 🟡 Medium |
| `stripe-webhook` | `false` | ✅ Expected |
| `send-event-confirmation` | `false` | 🟡 Medium |
| `send-event-cancellation` | `false` | 🟡 Medium |
| `send-event-reminders` | `false` | 🟡 Medium |
| `notify-waitlist` | `false` | 🟡 Medium |
| `submit-founder-application` | `false` | 🟡 Medium |
| `submit-investor-application` | `false` | 🟡 Medium |

**Note:** While some functions do implement manual JWT verification (seen in `send-event-confirmation`), the configuration disables it at the Supabase level, creating inconsistency.

### 3.2 Client-Side Security

- **CORS Headers**: All edge functions use `Access-Control-Allow-Origin: "*"` - should be restricted to specific domains
- **Environment Variables**: No `.env.example` file to document required variables
- **API Keys**: Supabase keys exposed on client - ensure RLS policies are comprehensive

### 3.3 Missing Security Features

- [ ] Content Security Policy (CSP) headers
- [ ] Rate limiting on frontend (only backend implemented)
- [ ] Input sanitization middleware
- [ ] HTTPS enforcement documentation
- [ ] Security headers configuration (X-Frame-Options, X-Content-Type-Options)

---

## 4. Error Handling & Logging

### Current State

- Console.log/error statements scattered throughout codebase (20+ instances)
- No structured logging framework
- No error boundary components
- Inconsistent error messaging to users

### Identified Issues

```
src/pages/AdminDashboard.tsx:58 - console.error
src/pages/NotFound.tsx:8 - console.error
src/pages/Investors.tsx:56 - console.error
src/pages/PaymentSuccess.tsx:28,34 - console.error
src/pages/Membership.tsx:64,88 - console.error
src/hooks/useEvents.ts:191,244 - console.error
src/components/ProtectedRoute.tsx:31,37 - console.error
... and more
```

### Recommendations

- Implement centralized logging service (e.g., Sentry, LogRocket)
- Create React Error Boundary components
- Add structured error types and handling
- Remove console statements in production builds

---

## 5. State Management

### Current Architecture

- React Query for server state ✅
- React Context for auth state ✅
- No global client state management

### Gaps

- **No offline support**: No service worker or offline data caching
- **No optimistic updates**: Missing in mutation hooks (partially implemented)
- **Query invalidation**: Could be more granular
- **No request deduplication configuration**: Default React Query settings

---

## 6. Code Organization & Architecture

### 6.1 Missing Architectural Patterns

| Pattern | Status | Impact |
|---------|--------|--------|
| Repository pattern | ❌ Missing | Direct Supabase calls in hooks |
| Service layer | ❌ Missing | Business logic mixed with UI |
| DTO/Entity separation | ❌ Missing | Database types used directly |
| Dependency injection | ❌ Missing | Hard-coded dependencies |

### 6.2 Component Structure Issues

- **Large components**: `FounderApplicationForm.tsx` (645 lines), `AdminDashboard.tsx` (382 lines)
- **Mixed concerns**: Forms contain business logic, API calls, and UI
- **No component documentation**: Missing JSDoc/TSDoc comments

### 6.3 File Organization Recommendations

```
src/
├── api/           # API layer (missing)
├── services/      # Business logic (missing)
├── types/         # Shared types (missing - using generated types)
├── utils/         # Utility functions (only lib/utils.ts exists)
├── constants/     # Constants (missing)
└── __tests__/     # Tests (missing)
```

---

## 7. Performance Gaps

### 7.1 Bundle Optimization

- **No code splitting**: Routes not lazy loaded
- **No bundle analysis**: No webpack-bundle-analyzer or similar
- **Large dependencies**: Full Radix UI imports, Recharts

### 7.2 Image Optimization

- **No image optimization**: Missing lazy loading, srcset, WebP support
- **No CDN configuration**: Images served directly

### 7.3 Data Fetching

- **No pagination**: Events, applications lists not paginated
- **No infinite scroll**: Could improve UX for large lists
- **Missing caching headers**: Edge functions don't set cache control

### 7.4 Recommendations

```tsx
// Example: Lazy loading routes
const Events = lazy(() => import('./pages/Events'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
```

---

## 8. Accessibility (A11y)

### Missing A11y Features

- [ ] Skip navigation links
- [ ] ARIA labels audit needed
- [ ] Focus management on route changes
- [ ] Screen reader announcements for dynamic content
- [ ] Keyboard navigation testing
- [ ] Color contrast verification
- [ ] Form error announcements

---

## 9. DevOps & Infrastructure

### 9.1 CI/CD Pipeline

- **No CI/CD configuration**: Missing GitHub Actions, GitLab CI, etc.
- **No automated deployments**: Manual process required
- **No staging environment**: Direct to production

### 9.2 Missing Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| `.env.example` | Environment documentation | ❌ Missing |
| `.nvmrc` | Node version pinning | ❌ Missing |
| `Dockerfile` | Containerization | ❌ Missing |
| `.github/workflows/` | CI/CD pipelines | ❌ Missing |
| `CONTRIBUTING.md` | Contribution guidelines | ❌ Missing |
| `CHANGELOG.md` | Version history | ❌ Missing |

### 9.3 Database Migrations

- Migrations exist but lack rollback procedures
- No seed data scripts for development
- Migration naming convention could include descriptions

---

## 10. Documentation

### Missing Documentation

- [ ] API documentation (OpenAPI/Swagger)
- [ ] Component library documentation (Storybook)
- [ ] Architecture decision records (ADRs)
- [ ] Runbook for production issues
- [ ] Onboarding documentation for developers
- [ ] Database schema documentation

---

## 11. Monitoring & Observability

### Current State: None

### Required Additions

- [ ] Application Performance Monitoring (APM)
- [ ] Error tracking (Sentry recommended)
- [ ] User analytics (privacy-compliant)
- [ ] Health check endpoints
- [ ] Uptime monitoring
- [ ] Database query performance monitoring

---

## 12. Authentication & Authorization

### 12.1 Current Implementation

- ✅ Supabase Auth integration
- ✅ Role-based access control (RBAC) via `user_roles` table
- ✅ `has_role` RPC function

### 12.2 Gaps

- **Admin route not protected properly**: `/admin` uses `ProtectedRoute` but doesn't pass `requireAdmin={true}`
- **Role caching**: Admin role checked on every protected route visit
- **Session management**: No idle timeout or session invalidation UI
- **OAuth providers**: Only email/password - no social logins

### 12.3 Code Issue

```tsx
// Current (App.tsx)
<Route path="/admin" element={
  <ProtectedRoute>  // Missing requireAdmin prop
    <AdminDashboard />
  </ProtectedRoute>
} />

// Should be
<Route path="/admin" element={
  <ProtectedRoute requireAdmin={true}>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

---

## 13. Form Handling

### Current State

- React Hook Form with Zod validation ✅
- Server-side validation in edge functions ✅

### Gaps

- **No form state persistence**: Form data lost on navigation/refresh
- **No draft saving**: Long forms (founder application) have no autosave
- **Duplicate validation**: Same rules defined client and server side
- **No file upload progress**: Missing upload progress indicators

---

## 14. API Design

### 14.1 Edge Functions Inconsistencies

- **Response format**: Inconsistent error response structures
- **Status codes**: Some functions return 200 with error in body
- **Logging**: Different logging patterns per function

### 14.2 Missing API Features

- [ ] Versioning strategy
- [ ] Request/response validation middleware
- [ ] API rate limiting responses (429 status)
- [ ] Pagination standards

---

## 15. Third-Party Integrations

### Current Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| Supabase | Database & Auth | ✅ Active |
| Stripe | Payments | ✅ Active |
| Resend | Email | ✅ Active |

### Integration Gaps

- **Stripe webhook security**: Should verify webhook signatures
- **Email templates**: Hard-coded HTML in functions
- **No retry logic**: Failed API calls not retried

---

## 16. Priority Matrix

### Immediate (P0) - Security & Stability

1. Enable strict TypeScript configuration
2. Fix admin route protection
3. Add error boundaries
4. Implement centralized error tracking

### Short-term (P1) - Quality & Testing

1. Set up testing infrastructure
2. Add unit tests for critical paths
3. Implement E2E tests for auth flow
4. Add CI/CD pipeline

### Medium-term (P2) - Performance & UX

1. Implement route-based code splitting
2. Add pagination to list views
3. Optimize images and assets
4. Add offline support

### Long-term (P3) - Scalability & Maintainability

1. Implement service layer architecture
2. Add comprehensive API documentation
3. Create component documentation (Storybook)
4. Implement comprehensive monitoring

---

## 17. Technical Debt Inventory

| Item | Location | Effort | Priority |
|------|----------|--------|----------|
| Console statements cleanup | Multiple files | Low | Medium |
| Large component refactoring | Forms, Dashboard | Medium | Medium |
| Type safety improvements | Throughout | High | High |
| Test coverage | New | High | High |
| Documentation | New | Medium | Medium |
| Code splitting | App.tsx | Low | Medium |
| Error handling standardization | Throughout | Medium | High |

---

## Appendix: File-by-File Issues

### High Priority Files

1. **`tsconfig.json`** - Weak type checking
2. **`supabase/config.toml`** - JWT verification disabled
3. **`src/App.tsx`** - Missing lazy loading, admin protection
4. **`src/integrations/supabase/client.ts`** - No error handling for missing env vars

### Medium Priority Files

1. **`src/components/forms/FounderApplicationForm.tsx`** - 645 lines, needs splitting
2. **`src/pages/AdminDashboard.tsx`** - 382 lines, mixed concerns
3. **`src/hooks/useEvents.ts`** - 279 lines, could be split

---

## 18. Product & Compliance Feature Gaps (India Angel Investing)

This section identifies feature gaps required to operate a compliant angel investing platform in India, supporting **all three operating models** (Direct Angels, Syndicate/SPV, AIF mode), **NRI/foreign investors**, and **best-practice KYC/AML**.

### References (India Regulatory Framework)

| Regulation | Relevance | Official Source |
|------------|-----------|-----------------|
| SEBI AIF Regulations 2012 | AIF mode operations, angel fund structure | https://www.sebi.gov.in/legal/regulations/jun-2024/securities-and-exchange-board-of-india-alternative-investment-funds-regulations-2012-last-amended-on-june-25-2024-_83780.html |
| SEBI Accredited Investor Framework | Investor eligibility verification | https://www.sebi.gov.in/legal/circulars/aug-2021/framework-for-accredited-investors_52024.html |
| RBI KYC Master Direction | KYC/AML requirements | https://www.rbi.org.in/scripts/BS_ViewMasDirections.aspx?id=12071 |
| RBI Payment Aggregator Guidelines | Escrow/nodal account concepts | https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=11668 |
| Companies Act 2013 (Section 42) | Private placement restrictions | https://www.mca.gov.in/content/mca/global/en/acts-rules.html |
| FEMA/FDI Policy | Foreign investor restrictions | https://dpiit.gov.in/foreign-direct-investment/foreign-direct-investment-policy |
| DPDP Act 2023 | Data privacy requirements | https://www.meity.gov.in |

---

### 18.1 Deal Flow & Investment Lifecycle

| Gap | Severity | Current State | Required |
|-----|----------|---------------|----------|
| No Deal entity/pipeline | 🔴 Critical | Only `founder_applications` exists | Deal object with status lifecycle (Draft → Live → Closing → Closed → Exited) |
| No member-gated deal pages | 🔴 Critical | Membership only gates billing UI | Deal detail with tiered access (public teaser vs member-only data room) |
| No interest/soft-commit workflow | 🔴 Critical | None | Expression of interest, commitment range, timeline, mode preference |
| No allocation management | 🔴 Critical | None | Pro-rata, first-come, lead allocation; over-subscription handling |
| No closing workflow | 🔴 Critical | None | Document execution, capital call, funding confirmation, allotment |
| No diligence collaboration | 🟡 Medium | Marketing mentions "pods" | Q&A threads, checklist tracking, red-flag tagging, investment memo |
| No term sheet tooling | 🟡 Medium | None | Template library, version tracking, negotiation workflow |

**Evidence:**
- Marketing claims deal rooms exist: [src/pages/Investors.tsx](src/pages/Investors.tsx) mentions "Deal Rooms & SPVs"
- Only founder applications implemented: [src/components/forms/FounderApplicationForm.tsx](src/components/forms/FounderApplicationForm.tsx)

---

### 18.2 Operating Models Support

#### 18.2.1 Direct Angels Mode (Coordination-First)

| Gap | Severity | Required Feature |
|-----|----------|------------------|
| No lead investor assignment | 🟡 Medium | Designate lead, track intros, diligence notes |
| No founder-investor matching | 🟡 Medium | Interest signals, meeting scheduling |
| No deal coordination tools | 🟡 Medium | Shared diligence, term alignment, closing coordination |

#### 18.2.2 Syndicate/SPV Mode (Allocation-First)

| Gap | Severity | Required Feature |
|-----|----------|------------------|
| No SPV entity management | 🔴 Critical | SPV creation workflow, bank account setup, compliance calendar |
| No allocation engine | 🔴 Critical | Commitment capture, allocation rules, cap management |
| No capital call workflow | 🔴 Critical | Call notices, payment instructions, funding status tracking |
| No carry/fee disclosure | 🟡 Medium | Fee structure acceptance, carry waterfall modeling |
| No distribution workflow | 🟡 Medium | Exit proceeds, waterfall calculation, payout execution |
| No investor registry | 🟡 Medium | Unit/share ledger, transfer restrictions, tax reporting |

#### 18.2.3 AIF Mode (Distribution-First)

| Gap | Severity | Required Feature |
|-----|----------|------------------|
| No AIF integration | 🔴 Critical | Redirect/handoff to AIF manager portal |
| No commitment tracking | 🔴 Critical | Capital call status, unit allotment, NAV updates |
| No investor reporting | 🟡 Medium | Statements, portfolio performance, distribution notices |
| No PPM/subscription docs | 🟡 Medium | Document vault, e-sign workflow, compliance tracking |

---

### 18.3 KYC/AML & Investor Onboarding (In-House, Best Practice)

| Gap | Severity | Current State | Required |
|-----|----------|---------------|----------|
| No KYC document collection | 🔴 Critical | DB fields exist but no UI | PAN, Aadhaar, address proof upload with validation |
| No accreditation verification | 🔴 Critical | Self-reported ranges only | Net worth/income evidence, admin verification, expiry/renewal |
| No investor eligibility state machine | 🔴 Critical | Binary approved/rejected | Applied → Under Review → KYC Pending → Approved → Active |
| No source of funds capture | 🟡 Medium | None | SOF questionnaire, wealth source declaration |
| No PEP/sanctions self-declaration | 🟡 Medium | None | PEP status, sanctions exposure attestation |
| No risk scoring | 🟡 Medium | None | Low/Medium/High risk classification, EDD triggers |
| No re-KYC workflow | 🟡 Medium | None | Periodic refresh, event-based triggers (address change, large ticket) |
| No beneficial ownership capture | 🟡 Medium | None | For entity investors: UBO declaration, control structure |

**Evidence:**
- DB has `pan_document_url`, `aadhaar_document_url`, `bank_statement_url` columns in `investor_applications`
- UI form doesn't collect these: [src/components/forms/InvestorApplicationForm.tsx](src/components/forms/InvestorApplicationForm.tsx)

---

### 18.4 NRI/Foreign Investor Support

| Gap | Severity | Current State | Required |
|-----|----------|---------------|----------|
| No residency classification | 🔴 Critical | None | Resident Indian / NRI / OCI / Foreign Entity / US Person flags |
| No tax residency capture | 🔴 Critical | None | FATCA/CRS declarations, tax ID (TIN) collection |
| No route-based restrictions | 🔴 Critical | None | Policy engine: "AIF only" for certain foreign categories |
| No FEMA/FDI checklist | 🟡 Medium | None | Per-deal compliance checklist, counsel export pack |
| No remittance tracking | 🟡 Medium | None | Inward remittance proofs, bank advice capture, FIRC |
| No enhanced KYC for non-residents | 🟡 Medium | None | Passport, overseas address proof, source of funds |

**Recommended Default:** NRI/foreign investors should default to **AIF mode** where available; direct/SPV routes require explicit FEMA compliance workflow.

---

### 18.5 Escrow & Virtual Accounts (Bank Escrow + VA Mapping)

**Goal:** Implement "no funds on platform" architecture using scheduled bank escrow with per-investor virtual accounts for deterministic reconciliation.

| Gap | Severity | Required Feature |
|-----|----------|------------------|
| No escrow account abstraction | 🔴 Critical | Bank details, operating rules, signatories, per-deal/SPV mapping |
| No virtual account management | 🔴 Critical | Unique VA per investor per deal, lifecycle (active/expired), mapping |
| No bank transaction ingestion | 🔴 Critical | API/SFTP/statement import, normalized transaction ledger |
| No reconciliation engine | 🔴 Critical | VA → investor+deal auto-match, exception queue, maker-checker |
| No release workflow | 🔴 Critical | Close conditions gating, approvals, evidence attachments, immutable snapshot |
| No refund workflow | 🔴 Critical | Refund-to-verified-account, approval workflow, payout reconciliation |
| No audit pack generation | 🟡 Medium | Per-deal: inflows, allocations, approvals, release/refund proofs |

**Acceptance Criteria:**
- Assign unique VA per investor per deal/SPV mapped to one underlying escrow account
- Auto-reconcile incoming credits by VA; unmatched → exception queue (no silent allocation)
- Enforce maker-checker release: escrow→SPV/startup only after close conditions + approvals
- Refunds only to verified investor bank account/source with full tracking
- Generate downloadable audit packs for counsel/auditors

---

### 18.6 Data Room & Document Security

| Gap | Severity | Current State | Required |
|-----|----------|---------------|----------|
| No NDA clickwrap per deal | 🔴 Critical | None | Accept NDA before data room access, version tracking |
| No per-deal access grants | 🔴 Critical | None | Invite list, access control, revocation |
| No secure document storage | 🟡 Medium | Basic Supabase storage | Expiring links, download limits, watermarking |
| No download audit trail | 🟡 Medium | None | Who downloaded what, when, IP/device |
| No DLP controls | 🟡 Medium | None | Prevent forwarding, screenshot detection (best effort) |

---

### 18.7 Compliance, Audit & Legal

| Gap | Severity | Current State | Required |
|-----|----------|---------------|----------|
| No immutable audit log | 🔴 Critical | None | Critical actions: status changes, access grants, allocations, approvals |
| No compliance officer role | 🔴 Critical | Only admin exists | Dedicated role with compliance queue, escalation workflow |
| No Terms/Privacy pages | 🟡 Medium | Links are "#" | Actual legal pages with versioned acceptance logs |
| No conflict of interest capture | 🟡 Medium | None | Per-deal/member COI declarations, attestations |
| No grievance mechanism | 🟡 Medium | Mentioned in About | Complaint intake, SLA tracking, resolution workflow |
| No DPDP readiness | 🟡 Medium | None | Consent capture, DSAR workflow, retention/deletion, breach response |
| No regulatory disclosures | 🟡 Medium | Generic text only | Risk warnings at key points (pre-purchase, pre-deal, pre-investment) |

**Evidence:**
- Footer links to "#" for Terms/Privacy: [src/components/Footer.tsx](src/components/Footer.tsx)
- Only admin role exists: [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts) shows `app_role: "admin" | "moderator" | "user"`

---

### 18.8 Portfolio & Reporting

| Gap | Severity | Current State | Required |
|-----|----------|---------------|----------|
| No user-linked portfolio | 🔴 Critical | Static marketing content | Personal portfolio with transactions, documents, performance |
| No investment tracking | 🔴 Critical | None | Per-deal: committed, funded, current value, multiples |
| No tax document generation | 🟡 Medium | None | Capital gains statements, TDS certificates (where applicable) |
| No pro-rata management | 🟡 Medium | None | Follow-on rights tracking, notification workflow |
| No governance tracking | 🟡 Medium | None | Board observer rights, resolution voting, consent management |

**Evidence:**
- Portfolio page is static marketing: [src/pages/Portfolio.tsx](src/pages/Portfolio.tsx)

---

### 18.9 Admin Operations

| Gap | Severity | Current State | Required |
|-----|----------|---------------|----------|
| No unified deal pipeline | 🔴 Critical | Separate apps + events | Single view: applications → deals → allocations → closings |
| No KYC review queue | 🔴 Critical | None | Document verification, risk scoring, approval workflow |
| No allocation tools | 🔴 Critical | None | Allocation rules, override controls, investor communications |
| No compliance reporting | 🟡 Medium | None | Regulatory exports, audit-ready reports |
| No member access reviews | 🟡 Medium | None | Automated offboarding when membership lapses |

**Evidence:**
- Admin only manages events + application statuses: [src/pages/AdminDashboard.tsx](src/pages/AdminDashboard.tsx)

---

### 18.10 Feature Priority Matrix (India Compliance)

#### P0 - Must Have (Pre-Launch for Investment Features)

1. Deal entity + lifecycle management
2. Investor eligibility state machine (KYC workflow)
3. Accreditation verification (net worth/income evidence)
4. Bank escrow + VA mapping + reconciliation
5. NDA clickwrap + data room access control
6. Immutable audit log for compliance-critical actions
7. Compliance officer role + queue

#### P1 - Should Have (First 3 Months)

1. SPV management (entity, allocations, capital calls)
2. NRI/foreign investor classification + route restrictions
3. Source of funds + PEP declarations
4. Release/refund workflows with maker-checker
5. Portfolio tracking (user-linked investments)
6. DPDP consent/notice center

#### P2 - Nice to Have (First 6 Months)

1. AIF integration (commitment, capital call, reporting)
2. Term sheet tooling + e-sign
3. Diligence collaboration (Q&A, checklists)
4. Tax document generation
5. Secondary transfer workflow
6. Advanced analytics (IRR/MOIC)

---

### 18.11 Design Decisions Required

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Escrow partner | Bank escrow with VA vs aggregator | Bank escrow with per-investor-per-deal VAs |
| KYC approach | In-house docs vs vendor API | In-house with manual verification (MVP) |
| NRI default route | Direct/SPV/AIF | AIF-first; direct/SPV with explicit FEMA workflow |
| SPV structure | Company/LLP/Trust | LLP (common for angel SPVs in India) |
| AIF integration depth | Redirect-only vs status callbacks | Redirect + status callbacks for commitment/units |
| Data room security | Supabase Storage vs dedicated provider | Supabase Storage with RLS + watermarking (MVP) |

---

*Document generated: January 24, 2026*
*Review recommended: Quarterly*
