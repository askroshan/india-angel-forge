/**
 * Test Data Factory for India Angel Forum
 * Generates test data for all user roles and scenarios
 */

export type UserRole = 'admin' | 'moderator' | 'compliance_officer' | 'standard_investor' | 'operator_angel' | 'family_office' | 'founder' | 'user';

export interface TestUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  password: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface TestFounderApplication {
  id: string;
  user_id?: string;
  company_name: string;
  founder_email: string;
  founder_name: string;
  founder_phone: string;
  industry_sector: string;
  stage: 'Pre-seed' | 'Seed' | 'Series A';
  status: 'submitted' | 'screening' | 'forum-selected' | 'rejected' | 'funded';
  amount_raising: string;
  business_model: string;
  problem_statement: string;
  solution_description: string;
  target_market: string;
  unique_value_proposition: string;
  use_of_funds: string;
}

export interface TestInvestorApplication {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  membership_type: 'Standard Member' | 'Operator Angel' | 'Family Office';
  investment_thesis: string;
  preferred_sectors: string[];
  typical_check_size: string;
  investment_experience: string;
  net_worth_range: string;
  annual_income_range: string;
  status: 'submitted' | 'under_review' | 'kyc_pending' | 'approved' | 'rejected';
}

export interface TestEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_type: 'Monthly Forum' | 'Sector Summit' | 'Demo Day' | 'Networking';
  event_date: string;
  event_time: string;
  location: string;
  capacity: number;
  registration_deadline: string;
  is_members_only: boolean;
  is_featured: boolean;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
}

export interface TestKYCDocument {
  id: string;
  investor_id: string;
  document_type: 'pan' | 'aadhaar' | 'bank_statement' | 'income_proof';
  file_path: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  uploaded_at: string;
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
}

/**
 * Test Users - One for each role
 */
export const testUsers: Record<UserRole, TestUser> = {
  admin: {
    id: 'admin-001',
    email: 'admin@indiaangelforum.test',
    full_name: 'Admin User',
    role: 'admin',
    password: 'Admin@12345',
    created_at: '2025-01-01T00:00:00Z',
  },
  moderator: {
    id: 'moderator-001',
    email: 'moderator@indiaangelforum.test',
    full_name: 'Moderator User',
    role: 'moderator',
    password: 'Moderator@12345',
    created_at: '2025-01-01T00:00:00Z',
  },
  compliance_officer: {
    id: 'compliance-001',
    email: 'compliance@indiaangelforum.test',
    full_name: 'Compliance Officer',
    role: 'compliance_officer',
    password: 'Compliance@12345',
    created_at: '2025-01-01T00:00:00Z',
  },
  standard_investor: {
    id: 'investor-standard-001',
    email: 'investor.standard@test.com',
    full_name: 'Rahul Sharma',
    role: 'standard_investor',
    password: 'Investor@12345',
    created_at: '2025-01-15T00:00:00Z',
    metadata: {
      membership_type: 'Standard Member',
      membership_status: 'active',
      subscription_id: 'sub_standard_001',
    },
  },
  operator_angel: {
    id: 'investor-operator-001',
    email: 'operator.angel@test.com',
    full_name: 'Priya Patel',
    role: 'operator_angel',
    password: 'Operator@12345',
    created_at: '2025-01-15T00:00:00Z',
    metadata: {
      membership_type: 'Operator Angel',
      membership_status: 'active',
      subscription_id: 'sub_operator_001',
      operator_domain: 'SaaS',
      years_experience: 12,
    },
  },
  family_office: {
    id: 'investor-family-001',
    email: 'family.office@test.com',
    full_name: 'Rajesh Mehta',
    role: 'family_office',
    password: 'FamilyOffice@12345',
    created_at: '2025-01-15T00:00:00Z',
    metadata: {
      membership_type: 'Family Office',
      membership_status: 'active',
      subscription_id: 'sub_family_001',
      seats: 3,
      team_members: ['rajesh@mehta.com', 'anjali@mehta.com', 'vikram@mehta.com'],
    },
  },
  founder: {
    id: 'founder-001',
    email: 'founder@startup.test',
    full_name: 'Amit Kumar',
    role: 'founder',
    password: 'Founder@12345',
    created_at: '2025-01-20T00:00:00Z',
    metadata: {
      company: 'TechStartup AI',
      application_status: 'forum-selected',
    },
  },
  user: {
    id: 'user-001',
    email: 'user@test.com',
    full_name: 'Guest User',
    role: 'user',
    password: 'User@12345',
    created_at: '2025-01-25T00:00:00Z',
  },
};

/**
 * Test Founder Applications
 */
export const testFounderApplications: TestFounderApplication[] = [
  {
    id: 'founder-app-001',
    user_id: testUsers.founder.id,
    company_name: 'TechStartup AI',
    founder_email: 'amit@techstartup.ai',
    founder_name: 'Amit Kumar',
    founder_phone: '+91-9876543210',
    industry_sector: 'AI & Deep Tech',
    stage: 'Seed',
    status: 'forum-selected',
    amount_raising: '₹3 Crores',
    business_model: 'B2B SaaS with usage-based pricing',
    problem_statement: 'SMEs struggle with manual document processing, losing 20+ hours/week',
    solution_description: 'AI-powered document intelligence platform that automates extraction and processing',
    target_market: 'Indian SMEs with 50-500 employees, starting with BFSI and Healthcare',
    unique_value_proposition: 'First multilingual solution supporting 10+ Indian languages with 95% accuracy',
    use_of_funds: 'Product development (40%), Sales & Marketing (35%), Team expansion (25%)',
  },
  {
    id: 'founder-app-002',
    company_name: 'HealthTech Solutions',
    founder_email: 'priya@healthtech.in',
    founder_name: 'Priya Singh',
    founder_phone: '+91-9123456789',
    industry_sector: 'Healthcare',
    stage: 'Pre-seed',
    status: 'submitted',
    amount_raising: '₹1.5 Crores',
    business_model: 'Marketplace with subscription for healthcare providers',
    problem_statement: 'Tier 2/3 cities lack access to specialist doctors',
    solution_description: 'Telemedicine platform connecting specialists with patients via video',
    target_market: 'Tier 2/3 cities, 50M+ potential patients',
    unique_value_proposition: 'Vernacular interface, offline-first architecture for low bandwidth',
    use_of_funds: 'Technology (50%), Doctor onboarding (30%), Operations (20%)',
  },
  {
    id: 'founder-app-003',
    company_name: 'FinFlow Payment Systems',
    founder_email: 'vikram@finflow.co',
    founder_name: 'Vikram Reddy',
    founder_phone: '+91-9988776655',
    industry_sector: 'Fintech',
    stage: 'Seed',
    status: 'screening',
    amount_raising: '₹5 Crores',
    business_model: 'Transaction fees + SaaS subscription',
    problem_statement: 'SMEs face cash flow challenges due to payment delays',
    solution_description: 'Working capital financing platform integrated with accounting software',
    target_market: 'Manufacturing and trading SMEs, ₹1000 Cr TAM',
    unique_value_proposition: 'Real-time credit decisioning using UPI transaction data',
    use_of_funds: 'Lending capital (50%), Technology (30%), Compliance (20%)',
  },
];

/**
 * Test Investor Applications
 */
export const testInvestorApplications: TestInvestorApplication[] = [
  {
    id: 'investor-app-001',
    user_id: testUsers.standard_investor.id,
    full_name: 'Rahul Sharma',
    email: 'rahul.sharma@test.com',
    phone: '+91-9876543210',
    membership_type: 'Standard Member',
    investment_thesis: 'Early-stage B2B SaaS with strong unit economics',
    preferred_sectors: ['SaaS', 'AI & Deep Tech', 'Fintech'],
    typical_check_size: '₹10-25 Lakhs',
    investment_experience: 'Angel invested in 5 startups, 2 successful exits',
    net_worth_range: '₹10-20 Crores',
    annual_income_range: '₹2-5 Crores',
    status: 'approved',
  },
  {
    id: 'investor-app-002',
    user_id: testUsers.operator_angel.id,
    full_name: 'Priya Patel',
    email: 'priya.patel@test.com',
    phone: '+91-9123456789',
    membership_type: 'Operator Angel',
    investment_thesis: 'SaaS companies where I can add operational value',
    preferred_sectors: ['SaaS', 'B2B Tech'],
    typical_check_size: '₹15-30 Lakhs',
    investment_experience: 'Ex-VP Product at unicorn, 3 angel investments',
    net_worth_range: '₹8-15 Crores',
    annual_income_range: '₹3-5 Crores',
    status: 'approved',
  },
  {
    id: 'investor-app-003',
    user_id: testUsers.family_office.id,
    full_name: 'Rajesh Mehta',
    email: 'rajesh@mehtafamily.com',
    phone: '+91-9988776655',
    membership_type: 'Family Office',
    investment_thesis: 'Growth-stage companies with proven traction, sector agnostic',
    preferred_sectors: ['Consumer', 'Fintech', 'Healthcare', 'Climate Tech'],
    typical_check_size: '₹50 Lakhs - ₹2 Crores',
    investment_experience: '15+ years, invested in 40+ companies, managing ₹200 Cr portfolio',
    net_worth_range: '₹100+ Crores',
    annual_income_range: '₹10+ Crores',
    status: 'approved',
  },
  {
    id: 'investor-app-004',
    full_name: 'Sneha Gupta',
    email: 'sneha.gupta@test.com',
    phone: '+91-9112233445',
    membership_type: 'Standard Member',
    investment_thesis: 'Women-led startups solving consumer problems',
    preferred_sectors: ['Consumer', 'D2C', 'Healthcare'],
    typical_check_size: '₹5-15 Lakhs',
    investment_experience: 'First-time angel investor, corporate background',
    net_worth_range: '₹8-10 Crores',
    annual_income_range: '₹2-3 Crores',
    status: 'kyc_pending',
  },
];

/**
 * Test Events
 */
export const testEvents: TestEvent[] = [
  {
    id: 'event-001',
    title: 'January 2026 Monthly Forum',
    slug: 'january-2026-monthly-forum',
    description: 'Monthly pitch forum featuring 6 pre-vetted startups across AI, Fintech, and Healthcare sectors',
    event_type: 'Monthly Forum',
    event_date: '2026-02-15',
    event_time: '14:00:00',
    location: 'Bangalore - Koramangala Hub',
    capacity: 100,
    registration_deadline: '2026-02-13T23:59:59Z',
    is_members_only: true,
    is_featured: true,
    status: 'published',
  },
  {
    id: 'event-002',
    title: 'AI & Deep Tech Sector Summit',
    slug: 'ai-deeptech-sector-summit-2026',
    description: 'Deep dive into AI/ML investment opportunities with expert panels and startup showcases',
    event_type: 'Sector Summit',
    event_date: '2026-03-10',
    event_time: '09:00:00',
    location: 'Mumbai - BKC Convention Center',
    capacity: 200,
    registration_deadline: '2026-03-08T23:59:59Z',
    is_members_only: false,
    is_featured: true,
    status: 'published',
  },
  {
    id: 'event-003',
    title: 'Q1 Demo Day 2026',
    slug: 'q1-demo-day-2026',
    description: 'Quarterly demo day featuring top 10 startups from our forum pipeline',
    event_type: 'Demo Day',
    event_date: '2026-03-28',
    event_time: '15:00:00',
    location: 'Delhi NCR - Gurugram',
    capacity: 150,
    registration_deadline: '2026-03-26T23:59:59Z',
    is_members_only: true,
    is_featured: false,
    status: 'published',
  },
];

/**
 * Test KYC Documents
 */
export const testKYCDocuments: TestKYCDocument[] = [
  {
    id: 'kyc-001',
    investor_id: testUsers.standard_investor.id,
    document_type: 'pan',
    file_path: 'kyc/investor-standard-001/pan_card.pdf',
    verification_status: 'verified',
    uploaded_at: '2025-01-16T10:00:00Z',
    verified_at: '2025-01-16T15:00:00Z',
    verified_by: testUsers.compliance_officer.id,
  },
  {
    id: 'kyc-002',
    investor_id: testUsers.standard_investor.id,
    document_type: 'aadhaar',
    file_path: 'kyc/investor-standard-001/aadhaar_masked.pdf',
    verification_status: 'verified',
    uploaded_at: '2025-01-16T10:05:00Z',
    verified_at: '2025-01-16T15:00:00Z',
    verified_by: testUsers.compliance_officer.id,
  },
  {
    id: 'kyc-003',
    investor_id: testUsers.standard_investor.id,
    document_type: 'bank_statement',
    file_path: 'kyc/investor-standard-001/bank_statement_6months.pdf',
    verification_status: 'verified',
    uploaded_at: '2025-01-16T10:10:00Z',
    verified_at: '2025-01-16T15:05:00Z',
    verified_by: testUsers.compliance_officer.id,
  },
  {
    id: 'kyc-004',
    investor_id: 'investor-app-004',
    document_type: 'pan',
    file_path: 'kyc/investor-app-004/pan_card.pdf',
    verification_status: 'pending',
    uploaded_at: '2025-01-24T14:00:00Z',
  },
  {
    id: 'kyc-005',
    investor_id: 'investor-app-004',
    document_type: 'aadhaar',
    file_path: 'kyc/investor-app-004/aadhaar_masked.pdf',
    verification_status: 'pending',
    uploaded_at: '2025-01-24T14:05:00Z',
  },
];

/**
 * Helper function to get test user by role
 */
export function getTestUserByRole(role: UserRole): TestUser {
  return testUsers[role];
}

/**
 * Helper function to create authenticated session mock
 */
export function createMockSession(user: TestUser) {
  return {
    access_token: `mock-token-${user.id}`,
    refresh_token: `mock-refresh-${user.id}`,
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: {
      id: user.id,
      email: user.email,
      user_metadata: {
        full_name: user.full_name,
        ...user.metadata,
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: user.created_at,
    },
  };
}

/**
 * Helper function to get applications by status
 */
export function getFounderApplicationsByStatus(status: TestFounderApplication['status']) {
  return testFounderApplications.filter(app => app.status === status);
}

export function getInvestorApplicationsByStatus(status: TestInvestorApplication['status']) {
  return testInvestorApplications.filter(app => app.status === status);
}

/**
 * Helper function to get KYC documents by status
 */
export function getKYCDocumentsByStatus(status: TestKYCDocument['verification_status']) {
  return testKYCDocuments.filter(doc => doc.verification_status === status);
}
