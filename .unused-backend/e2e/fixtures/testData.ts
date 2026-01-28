/**
 * Test data fixtures for E2E tests
 * Includes test users for all roles with realistic data
 */

export const testUsers = {
  admin: {
    email: 'admin@indiaangelforum.test',
    password: 'AdminTest@123',
    fullName: 'Admin User',
    role: 'admin',
  },
  complianceOfficer: {
    email: 'compliance@indiaangelforum.test',
    password: 'Compliance@123',
    fullName: 'Compliance Officer',
    role: 'compliance_officer',
  },
  investor: {
    email: 'investor@indiaangelforum.test',
    password: 'Investor@123',
    fullName: 'Test Investor',
    role: 'investor',
  },
  investor2: {
    email: 'investor2@indiaangelforum.test',
    password: 'Investor2@123',
    fullName: 'Co-Investor Test',
    role: 'investor',
  },
  founder: {
    email: 'founder@indiaangelforum.test',
    password: 'Founder@123',
    fullName: 'Test Founder',
    role: 'founder',
  },
  founder2: {
    email: 'founder2@indiaangelforum.test',
    password: 'Founder2@123',
    fullName: 'Startup Founder',
    role: 'founder',
  },
};

export const testCompanies = {
  techStartup: {
    companyName: 'TechVentures Pvt Ltd',
    industrySector: 'Technology',
    foundedYear: 2020,
    employeeCount: 25,
    website: 'https://techventures.test',
    description: 'AI-powered SaaS platform for enterprise analytics',
    registrationNumber: 'U72900DL2020PTC123456',
    address: '123 Tech Park, Bangalore, Karnataka 560001',
  },
  healthcareStartup: {
    companyName: 'HealthTech Solutions',
    industrySector: 'Healthcare',
    foundedYear: 2021,
    employeeCount: 15,
    website: 'https://healthtech.test',
    description: 'Digital health platform connecting patients with doctors',
    registrationNumber: 'U85100MH2021PTC345678',
    address: '456 Medical Complex, Mumbai, Maharashtra 400001',
  },
};

export const testFundraisingRounds = {
  techSeedRound: {
    roundType: 'seed',
    targetAmount: 50000000, // ₹5 Cr
    minInvestment: 500000, // ₹5 L
    maxInvestment: 10000000, // ₹1 Cr
    valuation: 200000000, // ₹20 Cr
    useOfFunds: 'Product development, team expansion, marketing',
    timeline: '3 months',
    dealTerms: 'Equity stake with standard investor protection clauses',
  },
  healthcareSeriesA: {
    roundType: 'series_a',
    targetAmount: 150000000, // ₹15 Cr
    minInvestment: 2000000, // ₹20 L
    maxInvestment: 30000000, // ₹3 Cr
    valuation: 600000000, // ₹60 Cr
    useOfFunds: 'Market expansion, technology infrastructure, regulatory compliance',
    timeline: '6 months',
    dealTerms: 'Preferred shares with liquidation preference',
  },
};

export const testDeals = {
  openDeal: {
    title: 'TechVentures Seed Round',
    slug: 'techventures-seed-2025',
    dealStatus: 'open',
    dealSize: 50000000,
    minInvestment: 500000,
    description: 'Seeking seed funding to scale our AI analytics platform',
    highlights: ['100+ enterprise clients', '300% YoY growth', 'Proven product-market fit'],
    riskFactors: ['Market competition', 'Regulatory changes', 'Technology risks'],
    closingDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
  },
  closingSoonDeal: {
    title: 'HealthTech Series A',
    slug: 'healthtech-series-a-2025',
    dealStatus: 'closing_soon',
    dealSize: 150000000,
    minInvestment: 2000000,
    description: 'Series A funding for nationwide healthcare expansion',
    highlights: ['50,000+ active users', 'Break-even achieved', 'Strategic partnerships'],
    riskFactors: ['Regulatory compliance', 'Competition from established players'],
    closingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
};

export const testDocuments = {
  pitchDeck: {
    title: 'TechVentures Pitch Deck 2025',
    description: 'Company overview, market analysis, financial projections',
    fileType: 'application/pdf',
    documentType: 'pitch_deck',
  },
  financials: {
    title: 'FY2024 Financial Statements',
    description: 'Audited financial statements for fiscal year 2024',
    fileType: 'application/pdf',
    documentType: 'financials',
  },
  termSheet: {
    title: 'Term Sheet',
    description: 'Investment terms and conditions',
    fileType: 'application/pdf',
    documentType: 'legal',
  },
};

export const testKYCDocuments = {
  passport: {
    documentType: 'passport',
    documentNumber: 'A1234567',
    expiryDate: new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000), // 5 years from now
  },
  aadhar: {
    documentType: 'aadhar',
    documentNumber: '1234-5678-9012',
  },
  pan: {
    documentType: 'pan',
    documentNumber: 'ABCDE1234F',
  },
};

export const testApplications = {
  founderApplication: {
    fullName: 'Test Founder',
    email: 'founder@indiaangelforum.test',
    phoneNumber: '+91-9876543210',
    companyName: 'TechVentures Pvt Ltd',
    companyStage: 'seed',
    industrySector: 'Technology',
    fundingRequired: 50000000,
    pitchSummary: 'We are building an AI-powered analytics platform that helps enterprises make data-driven decisions. Our unique approach combines machine learning with intuitive visualization.',
    linkedinProfile: 'https://linkedin.com/in/testfounder',
    previousExperience: 'Former tech lead at major SaaS company, 10+ years experience',
  },
  investorApplication: {
    fullName: 'Test Investor',
    email: 'investor@indiaangelforum.test',
    phoneNumber: '+91-9876543211',
    investmentRange: '5000000-50000000', // ₹50L - ₹5Cr
    focusAreas: ['Technology', 'Healthcare', 'FinTech'],
    experienceYears: 5,
    previousInvestments: 15,
    accreditationStatus: 'accredited',
    netWorth: 100000000, // ₹10 Cr
    investmentPhilosophy: 'Focus on early-stage startups with strong founding teams and clear path to profitability',
  },
};

export const testEvents = {
  networkingEvent: {
    title: 'Q1 2025 Investor-Founder Networking',
    description: 'Exclusive networking event for our community members',
    eventType: 'networking',
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    location: 'The Grand Hotel, Bangalore',
    maxAttendees: 100,
    registrationFee: 5000,
    isVirtual: false,
  },
  pitchEvent: {
    title: 'Monthly Pitch Session - February 2025',
    description: '5 selected startups present to angel investors',
    eventType: 'pitch',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    location: 'Virtual (Zoom)',
    maxAttendees: 50,
    registrationFee: 0,
    isVirtual: true,
  },
};

export const testSPVs = {
  techventuresSPV: {
    name: 'TechVentures Investment SPV',
    targetAmount: 20000000, // ₹2 Cr
    carryPercentage: 20,
    description: 'Special Purpose Vehicle for collective investment in TechVentures seed round',
  },
};

export const testPortfolioUpdates = {
  quarterlyUpdate: {
    title: 'Q4 2024 Performance Update',
    updateType: 'quarterly',
    content: 'Strong quarter with 45% revenue growth. Expanded to 3 new cities.',
    metrics: {
      revenue: 15000000,
      users: 50000,
      growth: 45,
    },
  },
};

export const testAMLScreening = {
  passed: {
    screening_status: 'cleared',
    risk_level: 'low',
    screening_date: new Date(),
    notes: 'All checks passed successfully',
  },
  flagged: {
    screening_status: 'flagged',
    risk_level: 'medium',
    screening_date: new Date(),
    notes: 'Requires manual review - name match found in watchlist',
    flagged_reason: 'Potential name similarity with watchlist entry',
  },
};

export default {
  testUsers,
  testCompanies,
  testFundraisingRounds,
  testDeals,
  testDocuments,
  testKYCDocuments,
  testApplications,
  testEvents,
  testSPVs,
  testPortfolioUpdates,
  testAMLScreening,
};
