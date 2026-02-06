/**
 * Database Seed Script for India Angel Forum
 * Creates test users with proper password hashing for local testing
 * 
 * Run with: npx tsx prisma/seed/index.ts
 * Or: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedEventAttendance } from './event-attendance-seed';

const prisma = new PrismaClient();

// Test users with their roles and passwords
const testUsers = [
  {
    email: 'admin@indiaangelforum.test',
    password: 'Admin@12345',
    fullName: 'Admin User',
    roles: ['admin'],
  },
  {
    email: 'moderator@indiaangelforum.test',
    password: 'Moderator@12345',
    fullName: 'Moderator User',
    roles: ['moderator'],
  },
  {
    email: 'compliance@indiaangelforum.test',
    password: 'Compliance@12345',
    fullName: 'Compliance Officer',
    roles: ['compliance_officer'],
  },
  {
    email: 'investor.standard@test.com',
    password: 'Investor@12345',
    fullName: 'Rahul Sharma',
    roles: ['investor'],
  },
  {
    email: 'operator.angel@test.com',
    password: 'Operator@12345',
    fullName: 'Priya Patel',
    roles: ['investor', 'operator_angel'],
  },
  {
    email: 'family.office@test.com',
    password: 'FamilyOffice@12345',
    fullName: 'Rajesh Mehta',
    roles: ['investor', 'family_office'],
  },
  {
    email: 'founder@startup.test',
    password: 'Founder@12345',
    fullName: 'Amit Kumar',
    roles: ['founder'],
  },
  {
    email: 'user@test.com',
    password: 'User@12345',
    fullName: 'Guest User',
    roles: ['user'],
  },
];

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  for (const userData of testUsers) {
    const passwordHash = await hashPassword(userData.password);

    // Upsert user (create or update)
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        passwordHash,
        fullName: userData.fullName,
      },
      create: {
        email: userData.email,
        passwordHash,
        fullName: userData.fullName,
      },
    });

    // Delete existing roles and recreate
    await prisma.userRole.deleteMany({
      where: { userId: user.id },
    });

    // Create roles
    for (const role of userData.roles) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          role,
        },
      });
    }

    console.log(`✅ Created user: ${userData.email} (${userData.roles.join(', ')})`);
  }

  // Create some test events
  const events = [
    {
      title: 'Monthly Angel Forum - February 2026',
      description: 'Monthly pitch session featuring 5 curated startups across AI, FinTech, and HealthTech sectors.',
      eventDate: new Date('2026-02-15T18:00:00Z'),
      location: 'Taj Lands End, Mumbai',
      capacity: 50,
      registrationDeadline: new Date('2026-02-13T23:59:59Z'),
      status: 'upcoming',
    },
    {
      title: 'Deep Tech Sector Summit',
      description: 'Exclusive summit focusing on AI/ML, robotics, and quantum computing startups.',
      eventDate: new Date('2026-03-01T10:00:00Z'),
      location: 'ITC Grand Central, Mumbai',
      capacity: 100,
      registrationDeadline: new Date('2026-02-25T23:59:59Z'),
      status: 'upcoming',
    },
    {
      title: 'Founder-Investor Networking Night',
      description: 'Informal networking event for founders and investors to connect.',
      eventDate: new Date('2026-02-20T19:00:00Z'),
      location: 'The Leela, Mumbai',
      capacity: 75,
      registrationDeadline: new Date('2026-02-18T23:59:59Z'),
      status: 'upcoming',
    },
  ];

  for (const eventData of events) {
    await prisma.event.upsert({
      where: { id: eventData.title.toLowerCase().replace(/\s+/g, '-').slice(0, 36) },
      update: eventData,
      create: eventData,
    });
    console.log(`✅ Created event: ${eventData.title}`);
  }

  console.log('\n🎉 Database seeding completed!\n');
  console.log('Test Credentials:');
  console.log('─'.repeat(50));
  for (const user of testUsers) {
    console.log(`  ${user.fullName.padEnd(20)} | ${user.email.padEnd(35)} | ${user.password}`);
  }
  console.log('─'.repeat(50));

  // Seed Reference Data
  console.log('\n📚 Seeding reference data...\n');

  // Seed Industries (50 startup sectors)
  const industries = [
    // Technology & Digital
    { name: 'Artificial Intelligence & Machine Learning', code: 'ai-ml', description: 'AI/ML solutions, computer vision, NLP, deep learning', displayOrder: 1 },
    { name: 'Blockchain & Web3', code: 'blockchain-web3', description: 'Blockchain infrastructure, DeFi, NFTs, crypto services', displayOrder: 2 },
    { name: 'Cloud Computing & Infrastructure', code: 'cloud-infrastructure', description: 'Cloud services, hosting, infrastructure as a service', displayOrder: 3 },
    { name: 'Cybersecurity', code: 'cybersecurity', description: 'Security software, threat detection, data protection', displayOrder: 4 },
    { name: 'Data Analytics & Business Intelligence', code: 'data-analytics', description: 'Data platforms, analytics tools, visualization', displayOrder: 5 },
    { name: 'DevOps & Developer Tools', code: 'devops-tools', description: 'CI/CD, monitoring, testing, developer productivity', displayOrder: 6 },
    { name: 'Internet of Things (IoT)', code: 'iot', description: 'Connected devices, sensors, smart systems', displayOrder: 7 },
    { name: 'SaaS - B2B Software', code: 'saas-b2b', description: 'Enterprise software, productivity tools, CRM, ERP', displayOrder: 8 },
    { name: 'SaaS - B2C Software', code: 'saas-b2c', description: 'Consumer software, productivity apps, utilities', displayOrder: 9 },
    
    // Fintech
    { name: 'Digital Payments & Wallets', code: 'digital-payments', description: 'Payment gateways, wallets, UPI services', displayOrder: 10 },
    { name: 'Lending & Credit', code: 'lending-credit', description: 'Digital lending, P2P lending, BNPL, microfinance', displayOrder: 11 },
    { name: 'Wealth Management & Investment', code: 'wealthtech', description: 'Robo-advisors, mutual funds, stock trading platforms', displayOrder: 12 },
    { name: 'Insurance Technology (Insurtech)', code: 'insurtech', description: 'Digital insurance, claims processing, aggregators', displayOrder: 13 },
    { name: 'Neobanking & Digital Banking', code: 'neobanking', description: 'Digital-only banks, banking APIs, financial infrastructure', displayOrder: 14 },
    { name: 'Financial Infrastructure', code: 'fintech-infrastructure', description: 'Payment infrastructure, KYC/AML, accounting automation', displayOrder: 15 },
    
    // Healthcare
    { name: 'Telemedicine & Digital Health', code: 'telemedicine', description: 'Online consultations, remote monitoring, digital clinics', displayOrder: 16 },
    { name: 'Healthcare IT & Software', code: 'healthtech-software', description: 'Hospital management, EMR, diagnostic software', displayOrder: 17 },
    { name: 'MedTech & Medical Devices', code: 'medtech-devices', description: 'Medical devices, diagnostics, wearables', displayOrder: 18 },
    { name: 'Pharmaceuticals & Drug Discovery', code: 'pharma-biotech', description: 'Drug development, biotechnology, clinical research', displayOrder: 19 },
    { name: 'Fitness & Wellness', code: 'fitness-wellness', description: 'Fitness apps, yoga, mental health, nutrition', displayOrder: 20 },
    
    // E-commerce
    { name: 'E-commerce Marketplace', code: 'ecommerce-marketplace', description: 'Online marketplaces, multi-vendor platforms', displayOrder: 21 },
    { name: 'D2C Brands - Fashion & Apparel', code: 'd2c-fashion', description: 'Direct-to-consumer fashion, footwear, accessories', displayOrder: 22 },
    { name: 'D2C Brands - Food & Beverage', code: 'd2c-food-beverage', description: 'Food products, beverages, health foods', displayOrder: 23 },
    { name: 'D2C Brands - Beauty & Personal Care', code: 'd2c-beauty', description: 'Cosmetics, skincare, personal care products', displayOrder: 24 },
    { name: 'Quick Commerce & Delivery', code: 'quick-commerce', description: '10-minute delivery, hyperlocal commerce', displayOrder: 25 },
    { name: 'Retail Technology', code: 'retail-tech', description: 'POS systems, inventory management, retail analytics', displayOrder: 26 },
    
    // Education
    { name: 'EdTech - K-12 Education', code: 'edtech-k12', description: 'School education, test prep, tutoring platforms', displayOrder: 27 },
    { name: 'EdTech - Higher Education', code: 'edtech-higher-ed', description: 'University courses, degree programs, certifications', displayOrder: 28 },
    { name: 'Skill Development & Upskilling', code: 'skill-development', description: 'Vocational training, professional courses, coding bootcamps', displayOrder: 29 },
    { name: 'Language Learning', code: 'language-learning', description: 'Language apps, spoken English, foreign languages', displayOrder: 30 },
    
    // Agriculture
    { name: 'AgriTech - Farm Management', code: 'agritech-farming', description: 'Precision farming, farm equipment, agri-IoT', displayOrder: 31 },
    { name: 'AgriTech - Supply Chain', code: 'agritech-supply-chain', description: 'Agri marketplace, cold chain, farm-to-fork', displayOrder: 32 },
    { name: 'Rural Technology', code: 'rural-tech', description: 'Rural fintech, digital literacy, rural commerce', displayOrder: 33 },
    
    // Logistics
    { name: 'Logistics & Transportation', code: 'logistics-transport', description: 'Fleet management, freight aggregation, warehousing', displayOrder: 34 },
    { name: 'Supply Chain Management', code: 'supply-chain-mgmt', description: 'SCM software, inventory optimization, procurement', displayOrder: 35 },
    
    // Real Estate
    { name: 'PropTech & Real Estate', code: 'proptech', description: 'Property marketplaces, rental platforms, real estate tech', displayOrder: 36 },
    { name: 'Construction Technology', code: 'construction-tech', description: 'Construction management, building materials, prefab', displayOrder: 37 },
    
    // Mobility
    { name: 'Electric Vehicles & EV Infrastructure', code: 'ev-infrastructure', description: 'EV charging, battery technology, EV components', displayOrder: 38 },
    { name: 'Automotive Technology', code: 'automotive-tech', description: 'Connected cars, autonomous driving, auto-tech', displayOrder: 39 },
    { name: 'Mobility & Ride Sharing', code: 'mobility-rideshare', description: 'Ride sharing, bike rentals, micro-mobility', displayOrder: 40 },
    
    // Sustainability
    { name: 'Renewable Energy', code: 'renewable-energy', description: 'Solar, wind, hydro, renewable energy solutions', displayOrder: 41 },
    { name: 'Climate Technology', code: 'climate-tech', description: 'Carbon capture, climate monitoring, sustainability', displayOrder: 42 },
    { name: 'Waste Management & Recycling', code: 'waste-management', description: 'Recycling, waste-to-energy, circular economy', displayOrder: 43 },
    
    // Media
    { name: 'Content & Media', code: 'content-media', description: 'OTT platforms, podcasts, digital content creation', displayOrder: 44 },
    { name: 'Gaming & Esports', code: 'gaming-esports', description: 'Game development, esports, gaming platforms', displayOrder: 45 },
    { name: 'Creator Economy', code: 'creator-economy', description: 'Creator tools, monetization platforms, influencer tech', displayOrder: 46 },
    
    // Enterprise
    { name: 'Human Resources Technology', code: 'hr-tech', description: 'Recruitment, payroll, employee management, HR automation', displayOrder: 47 },
    { name: 'Marketing Technology (MarTech)', code: 'martech', description: 'Marketing automation, CRM, analytics, ad-tech', displayOrder: 48 },
    { name: 'Legal Technology', code: 'legal-tech', description: 'Legal platforms, contract management, compliance', displayOrder: 49 },
    { name: 'Social Impact & NGO Technology', code: 'social-impact', description: 'Social good, impact investing, NGO solutions', displayOrder: 50 },
  ];

  for (const industry of industries) {
    await prisma.industry.upsert({
      where: { code: industry.code },
      update: industry,
      create: industry,
    });
  }
  console.log(`✅ Created ${industries.length} industries`);

  // Seed Funding Stages
  const fundingStages = [
    { name: 'Pre-Seed', code: 'pre-seed', description: 'Initial funding, friends & family round', typicalMin: 1000000, typicalMax: 5000000, displayOrder: 1 },
    { name: 'Seed', code: 'seed', description: 'Product development, early traction', typicalMin: 5000000, typicalMax: 50000000, displayOrder: 2 },
    { name: 'Series A', code: 'series-a', description: 'Scaling operations, market expansion', typicalMin: 50000000, typicalMax: 250000000, displayOrder: 3 },
    { name: 'Series B', code: 'series-b', description: 'Market leadership, team expansion', typicalMin: 250000000, typicalMax: 1000000000, displayOrder: 4 },
    { name: 'Series C', code: 'series-c', description: 'Rapid growth, new markets', typicalMin: 1000000000, typicalMax: 4000000000, displayOrder: 5 },
    { name: 'Series D+', code: 'series-d-plus', description: 'Late-stage growth, pre-IPO', typicalMin: 4000000000, typicalMax: null, displayOrder: 6 },
    { name: 'Bridge Round', code: 'bridge', description: 'Gap funding between major rounds', typicalMin: null, typicalMax: null, displayOrder: 7 },
    { name: 'Growth Stage', code: 'growth', description: 'Private equity, growth capital', typicalMin: 1000000000, typicalMax: null, displayOrder: 8 },
  ];

  for (const stage of fundingStages) {
    await prisma.fundingStage.upsert({
      where: { code: stage.code },
      update: stage,
      create: stage,
    });
  }
  console.log(`✅ Created ${fundingStages.length} funding stages`);

  // Seed Event Types
  const eventTypes = [
    { name: 'Monthly Angel Forum', code: 'monthly-forum', description: 'Regular monthly networking and pitch sessions' },
    { name: 'Pitch Day', code: 'pitch-day', description: 'Startups pitch to investor panels' },
    { name: 'Networking Event', code: 'networking', description: 'Casual networking for members' },
    { name: 'Sector Deep Dive', code: 'sector-deep-dive', description: 'In-depth sessions on specific sectors' },
    { name: 'Workshop', code: 'workshop', description: 'Educational workshops and training' },
    { name: 'Masterclass', code: 'masterclass', description: 'Expert-led masterclasses' },
    { name: 'Demo Day', code: 'demo-day', description: 'Cohort or accelerator demo days' },
    { name: 'Fireside Chat', code: 'fireside-chat', description: 'Intimate conversations with industry leaders' },
    { name: 'Annual Conference', code: 'annual-conference', description: 'Large annual gathering' },
    { name: 'Virtual Event', code: 'virtual', description: 'Online events and webinars' },
  ];

  for (const eventType of eventTypes) {
    await prisma.eventType.upsert({
      where: { code: eventType.code },
      update: eventType,
      create: eventType,
    });
  }
  console.log(`✅ Created ${eventTypes.length} event types`);

  console.log('\n✨ Reference data seeding completed!\n');
  
  // Phase 2 Test Data: Payments, Activities for E2E Tests
  console.log('\n💳 Seeding Phase 2 test data...\n');
  
  // Get admin user for test data
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@indiaangelforum.test' },
  });
  
  if (adminUser) {
    // Delete existing test payments and activities first
    await prisma.payment.deleteMany({ where: { userId: adminUser.id } });
    await prisma.activityLog.deleteMany({ where: { userId: adminUser.id } });
    
    // Create sample payments for transaction history (20+ for pagination testing)
    const samplePayments = [
      // Recent payments (February 2026)
      { userId: adminUser.id, amount: 75000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'PENDING' as any, gateway: 'RAZORPAY' as any, description: 'Investment in HealthTech Startup', gatewayOrderId: 'order_TEST001', createdAt: new Date('2026-02-04T16:00:00Z') },
      { userId: adminUser.id, amount: 5000, currency: 'INR', type: 'EVENT_REGISTRATION' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Monthly Angel Forum - February 2026', gatewayOrderId: 'order_TEST002', gatewayPaymentId: 'pay_TEST002', createdAt: new Date('2026-02-01T12:00:00Z'), completedAt: new Date('2026-02-01T12:01:00Z') },
      { userId: adminUser.id, amount: 150000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Investment in AI/ML Startup', gatewayOrderId: 'order_TEST003', gatewayPaymentId: 'pay_TEST003', createdAt: new Date('2026-02-03T09:15:00Z'), completedAt: new Date('2026-02-03T09:20:00Z') },
      
      // January 2026 payments
      { userId: adminUser.id, amount: 100000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Investment in SaaS Startup B', gatewayOrderId: 'order_TEST004', gatewayPaymentId: 'pay_TEST004', createdAt: new Date('2026-01-28T14:30:00Z'), completedAt: new Date('2026-01-28T14:35:00Z') },
      { userId: adminUser.id, amount: 50000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Investment in Tech Startup A', gatewayOrderId: 'order_TEST005', gatewayPaymentId: 'pay_TEST005', createdAt: new Date('2026-01-25T10:00:00Z'), completedAt: new Date('2026-01-25T10:05:00Z') },
      { userId: adminUser.id, amount: 8000, currency: 'INR', type: 'EVENT_REGISTRATION' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Deep Tech Summit Registration', gatewayOrderId: 'order_TEST006', gatewayPaymentId: 'pay_TEST006', createdAt: new Date('2026-01-22T11:30:00Z'), completedAt: new Date('2026-01-22T11:32:00Z') },
      { userId: adminUser.id, amount: 200000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Investment in FinTech Startup', gatewayOrderId: 'order_TEST007', gatewayPaymentId: 'pay_TEST007', createdAt: new Date('2026-01-20T16:45:00Z'), completedAt: new Date('2026-01-20T16:50:00Z') },
      { userId: adminUser.id, amount: 3500, currency: 'INR', type: 'SUBSCRIPTION' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Quarterly Newsletter Subscription', gatewayOrderId: 'order_TEST008', gatewayPaymentId: 'pay_TEST008', createdAt: new Date('2026-01-18T08:20:00Z'), completedAt: new Date('2026-01-18T08:21:00Z') },
      { userId: adminUser.id, amount: 125000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Investment in EdTech Platform', gatewayOrderId: 'order_TEST009', gatewayPaymentId: 'pay_TEST009', createdAt: new Date('2026-01-15T13:10:00Z'), completedAt: new Date('2026-01-15T13:15:00Z') },
      { userId: adminUser.id, amount: 25000, currency: 'INR', type: 'MEMBERSHIP_FEE' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Annual Membership Fee 2026', gatewayOrderId: 'order_TEST010', gatewayPaymentId: 'pay_TEST010', createdAt: new Date('2026-01-10T09:00:00Z'), completedAt: new Date('2026-01-10T09:02:00Z') },
      { userId: adminUser.id, amount: 80000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Investment in CleanTech Startup', gatewayOrderId: 'order_TEST011', gatewayPaymentId: 'pay_TEST011', createdAt: new Date('2026-01-08T15:30:00Z'), completedAt: new Date('2026-01-08T15:35:00Z') },
      { userId: adminUser.id, amount: 6000, currency: 'INR', type: 'EVENT_REGISTRATION' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Networking Night - January', gatewayOrderId: 'order_TEST012', gatewayPaymentId: 'pay_TEST012', createdAt: new Date('2026-01-05T17:00:00Z'), completedAt: new Date('2026-01-05T17:01:00Z') },
      
      // December 2025 payments
      { userId: adminUser.id, amount: 175000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Investment in BioTech Startup', gatewayOrderId: 'order_TEST013', gatewayPaymentId: 'pay_TEST013', createdAt: new Date('2025-12-28T10:20:00Z'), completedAt: new Date('2025-12-28T10:25:00Z') },
      { userId: adminUser.id, amount: 95000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Investment in AgriTech Solution', gatewayOrderId: 'order_TEST014', gatewayPaymentId: 'pay_TEST014', createdAt: new Date('2025-12-22T14:15:00Z'), completedAt: new Date('2025-12-22T14:20:00Z') },
      { userId: adminUser.id, amount: 12000, currency: 'INR', type: 'EVENT_REGISTRATION' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Year-End Angel Conference', gatewayOrderId: 'order_TEST015', gatewayPaymentId: 'pay_TEST015', createdAt: new Date('2025-12-18T11:00:00Z'), completedAt: new Date('2025-12-18T11:02:00Z') },
      { userId: adminUser.id, amount: 110000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Investment in E-commerce Platform', gatewayOrderId: 'order_TEST016', gatewayPaymentId: 'pay_TEST016', createdAt: new Date('2025-12-15T09:45:00Z'), completedAt: new Date('2025-12-15T09:50:00Z') },
      { userId: adminUser.id, amount: 50000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'FAILED' as any, gateway: 'RAZORPAY' as any, description: 'Investment in Gaming Startup (Failed)', gatewayOrderId: 'order_TEST017', createdAt: new Date('2025-12-10T16:30:00Z') },
      { userId: adminUser.id, amount: 135000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Investment in IoT Solutions', gatewayOrderId: 'order_TEST018', gatewayPaymentId: 'pay_TEST018', createdAt: new Date('2025-12-08T13:20:00Z'), completedAt: new Date('2025-12-08T13:25:00Z') },
      
      // November 2025 payments
      { userId: adminUser.id, amount: 90000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Investment in LogisticsTech', gatewayOrderId: 'order_TEST019', gatewayPaymentId: 'pay_TEST019', createdAt: new Date('2025-11-25T10:00:00Z'), completedAt: new Date('2025-11-25T10:05:00Z') },
      { userId: adminUser.id, amount: 7500, currency: 'INR', type: 'EVENT_REGISTRATION' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Startup Pitch Event - November', gatewayOrderId: 'order_TEST020', gatewayPaymentId: 'pay_TEST020', createdAt: new Date('2025-11-20T15:30:00Z'), completedAt: new Date('2025-11-20T15:31:00Z') },
      { userId: adminUser.id, amount: 160000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Investment in Cybersecurity Startup', gatewayOrderId: 'order_TEST021', gatewayPaymentId: 'pay_TEST021', createdAt: new Date('2025-11-15T11:45:00Z'), completedAt: new Date('2025-11-15T11:50:00Z') },
      { userId: adminUser.id, amount: 45000, currency: 'INR', type: 'DEAL_COMMITMENT' as any, status: 'REFUNDED' as any, gateway: 'RAZORPAY' as any, description: 'Investment in MediaTech (Refunded)', gatewayOrderId: 'order_TEST022', gatewayPaymentId: 'pay_TEST022', refundAmount: 45000, refundReason: 'Deal cancelled by mutual agreement', createdAt: new Date('2025-11-10T14:00:00Z'), completedAt: new Date('2025-11-10T14:05:00Z'), refundedAt: new Date('2025-11-12T10:00:00Z') },
      { userId: adminUser.id, amount: 5000, currency: 'INR', type: 'OTHER' as any, status: 'COMPLETED' as any, gateway: 'RAZORPAY' as any, description: 'Document Processing Fee', gatewayOrderId: 'order_TEST023', gatewayPaymentId: 'pay_TEST023', createdAt: new Date('2025-11-05T09:30:00Z'), completedAt: new Date('2025-11-05T09:31:00Z') },
    ];
    
    for (const payment of samplePayments) {
      await prisma.payment.create({ data: payment });
    }
    console.log(`✅ Created ${samplePayments.length} sample payments`);
    
    // Create sample activities for activity timeline (25+ for infinite scroll testing)
    const sampleActivities = [
      // February 2026 activities
      { userId: adminUser.id, activityType: 'PAYMENT_CREATED', entityType: 'payment', entityId: 'payment-001', description: 'Payment created for HealthTech investment: ₹75,000', createdAt: new Date('2026-02-04T16:00:00Z') },
      { userId: adminUser.id, activityType: 'DEAL_COMMITTED', entityType: 'payment', entityId: 'payment-003', description: 'Committed ₹1,50,000 to AI/ML Startup', createdAt: new Date('2026-02-03T09:20:00Z') },
      { userId: adminUser.id, activityType: 'PAYMENT_COMPLETED', entityType: 'payment', entityId: 'payment-003', description: 'Payment completed: AI/ML Startup investment', createdAt: new Date('2026-02-03T09:21:00Z') },
      { userId: adminUser.id, activityType: 'EVENT_REGISTERED', entityType: 'event', entityId: 'monthly-angel-forum-february-2026', description: 'Registered for Monthly Angel Forum - February 2026', createdAt: new Date('2026-02-01T12:01:00Z') },
      { userId: adminUser.id, activityType: 'PAYMENT_COMPLETED', entityType: 'payment', entityId: 'payment-002', description: 'Event registration payment completed: ₹5,000', createdAt: new Date('2026-02-01T12:02:00Z') },
      
      // January 2026 activities
      { userId: adminUser.id, activityType: 'DEAL_COMMITTED', entityType: 'payment', entityId: 'payment-004', description: 'Committed ₹1,00,000 to SaaS Startup B', createdAt: new Date('2026-01-28T14:35:00Z') },
      { userId: adminUser.id, activityType: 'PAYMENT_COMPLETED', entityType: 'payment', entityId: 'payment-004', description: 'Investment payment completed for SaaS Startup B', createdAt: new Date('2026-01-28T14:36:00Z') },
      { userId: adminUser.id, activityType: 'DEAL_COMMITTED', entityType: 'payment', entityId: 'payment-005', description: 'Committed ₹50,000 to Tech Startup A', createdAt: new Date('2026-01-25T10:05:00Z') },
      { userId: adminUser.id, activityType: 'PAYMENT_COMPLETED', entityType: 'payment', entityId: 'payment-005', description: 'Tech Startup A investment finalized', createdAt: new Date('2026-01-25T10:06:00Z') },
      { userId: adminUser.id, activityType: 'EVENT_REGISTERED', entityType: 'event', entityId: 'deep-tech-summit', description: 'Registered for Deep Tech Summit', createdAt: new Date('2026-01-22T11:32:00Z') },
      { userId: adminUser.id, activityType: 'DEAL_COMMITTED', entityType: 'payment', entityId: 'payment-007', description: 'Committed ₹2,00,000 to FinTech Startup', createdAt: new Date('2026-01-20T16:50:00Z') },
      { userId: adminUser.id, activityType: 'PAYMENT_COMPLETED', entityType: 'payment', entityId: 'payment-007', description: 'FinTech investment payment successful', createdAt: new Date('2026-01-20T16:51:00Z') },
      { userId: adminUser.id, activityType: 'DEAL_COMMITTED', entityType: 'payment', entityId: 'payment-009', description: 'Committed ₹1,25,000 to EdTech Platform', createdAt: new Date('2026-01-15T13:15:00Z') },
      { userId: adminUser.id, activityType: 'PROFILE_UPDATED', entityType: 'user', entityId: adminUser.id, description: 'Updated investment portfolio preferences', createdAt: new Date('2026-01-12T10:00:00Z') },
      { userId: adminUser.id, activityType: 'PAYMENT_COMPLETED', entityType: 'payment', entityId: 'payment-010', description: 'Annual Membership Fee paid: ₹25,000', createdAt: new Date('2026-01-10T09:02:00Z') },
      { userId: adminUser.id, activityType: 'DEAL_COMMITTED', entityType: 'payment', entityId: 'payment-011', description: 'Committed ₹80,000 to CleanTech Startup', createdAt: new Date('2026-01-08T15:35:00Z') },
      { userId: adminUser.id, activityType: 'DOCUMENT_UPLOADED', entityType: 'document', entityId: 'doc-001', description: 'Uploaded updated PAN Card for verification', createdAt: new Date('2026-01-07T14:20:00Z') },
      { userId: adminUser.id, activityType: 'EVENT_REGISTERED', entityType: 'event', entityId: 'networking-night-jan', description: 'Registered for Networking Night - January', createdAt: new Date('2026-01-05T17:01:00Z') },
      
      // December 2025 activities
      { userId: adminUser.id, activityType: 'DEAL_COMMITTED', entityType: 'payment', entityId: 'payment-013', description: 'Committed ₹1,75,000 to BioTech Startup', createdAt: new Date('2025-12-28T10:25:00Z') },
      { userId: adminUser.id, activityType: 'PAYMENT_COMPLETED', entityType: 'payment', entityId: 'payment-013', description: 'BioTech investment payment processed', createdAt: new Date('2025-12-28T10:26:00Z') },
      { userId: adminUser.id, activityType: 'DEAL_COMMITTED', entityType: 'payment', entityId: 'payment-014', description: 'Committed ₹95,000 to AgriTech Solution', createdAt: new Date('2025-12-22T14:20:00Z') },
      { userId: adminUser.id, activityType: 'EVENT_REGISTERED', entityType: 'event', entityId: 'year-end-conference', description: 'Registered for Year-End Angel Conference', createdAt: new Date('2025-12-18T11:02:00Z') },
      { userId: adminUser.id, activityType: 'DEAL_COMMITTED', entityType: 'payment', entityId: 'payment-016', description: 'Committed ₹1,10,000 to E-commerce Platform', createdAt: new Date('2025-12-15T09:50:00Z') },
      { userId: adminUser.id, activityType: 'PAYMENT_FAILED', entityType: 'payment', entityId: 'payment-017', description: 'Payment failed for Gaming Startup investment', createdAt: new Date('2025-12-10T16:35:00Z') },
      { userId: adminUser.id, activityType: 'DEAL_COMMITTED', entityType: 'payment', entityId: 'payment-018', description: 'Committed ₹1,35,000 to IoT Solutions', createdAt: new Date('2025-12-08T13:25:00Z') },
      
      // November 2025 activities
      { userId: adminUser.id, activityType: 'DEAL_COMMITTED', entityType: 'payment', entityId: 'payment-019', description: 'Committed ₹90,000 to LogisticsTech', createdAt: new Date('2025-11-25T10:05:00Z') },
      { userId: adminUser.id, activityType: 'EVENT_REGISTERED', entityType: 'event', entityId: 'startup-pitch-nov', description: 'Registered for Startup Pitch Event', createdAt: new Date('2025-11-20T15:31:00Z') },
      { userId: adminUser.id, activityType: 'DEAL_COMMITTED', entityType: 'payment', entityId: 'payment-021', description: 'Committed ₹1,60,000 to Cybersecurity Startup', createdAt: new Date('2025-11-15T11:50:00Z') },
      { userId: adminUser.id, activityType: 'PAYMENT_REFUNDED', entityType: 'payment', entityId: 'payment-022', description: 'Refund processed for MediaTech investment: ₹45,000', createdAt: new Date('2025-11-12T10:00:00Z') },
      { userId: adminUser.id, activityType: 'PROFILE_UPDATED', entityType: 'user', entityId: adminUser.id, description: 'Updated contact information and investment thesis', createdAt: new Date('2025-11-08T16:00:00Z') },
    ];
    
    for (const activity of sampleActivities) {
      await prisma.activityLog.create({ data: activity });
    }
    console.log(`✅ Created ${sampleActivities.length} sample activities`);
  }

  // Seed Event Attendance records
  await seedEventAttendance();
  
  console.log('\n🎉 Phase 2 test data seeding completed!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
