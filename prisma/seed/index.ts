/**
 * Database Seed Script for India Angel Forum
 * Creates test users with proper password hashing for local testing
 * 
 * Run with: npx tsx prisma/seed/index.ts
 * Or: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
