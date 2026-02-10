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
import { seedFinancialStatements } from './financial-statements-seed';

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
    email: 'investor.standard2@test.com',
    password: 'Investor@12345',
    fullName: 'Priya Mehta',
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

  // ==================== EVENTS: Delete all existing, seed exactly 30 ====================
  console.log('\n📅 Seeding 30 events (cleaning up old events with cascade)...\n');
  
  // Delete all existing events — cascade deletes registrations, attendance, waitlist, startups
  // Delete certificates first (they reference attendance)
  await prisma.certificate.deleteMany({});
  await prisma.eventStartup.deleteMany({});
  await prisma.eventAttendance.deleteMany({});
  await prisma.eventRegistration.deleteMany({});
  await prisma.eventWaitlist.deleteMany({});
  await prisma.event.deleteMany({});
  console.log('🗑️  Cleared all old events and cascading data');

  const events = [
    // Upcoming events (Mumbai — needed by E2E: 'Angel Forum', 'Mumbai' city filter, 'Taj Lands End' venue)
    { title: 'Monthly Angel Forum - February 2026', description: 'Monthly pitch session featuring 5 curated startups across AI, FinTech, and HealthTech sectors.', eventDate: new Date('2026-02-15T18:00:00Z'), location: 'Taj Lands End, Mumbai', capacity: 50, registrationDeadline: new Date('2026-02-13T23:59:59Z'), status: 'upcoming', city: 'Mumbai', venue: 'Taj Lands End', address: 'Bandstand, Bandra West, Mumbai 400050', mapLatitude: 19.0440, mapLongitude: 72.8198 },
    { title: 'Deep Tech Sector Summit', description: 'Exclusive summit focusing on AI/ML, robotics, and quantum computing startups.', eventDate: new Date('2026-03-01T10:00:00Z'), location: 'ITC Grand Central, Mumbai', capacity: 100, registrationDeadline: new Date('2026-02-25T23:59:59Z'), status: 'upcoming', city: 'Mumbai', venue: 'ITC Grand Central', address: 'Dr. Babasaheb Ambedkar Road, Parel, Mumbai 400012', mapLatitude: 19.0056, mapLongitude: 72.8423 },
    { title: 'Founder-Investor Networking Night', description: 'Informal networking event for founders and investors to connect.', eventDate: new Date('2026-02-20T19:00:00Z'), location: 'The Leela, Mumbai', capacity: 75, registrationDeadline: new Date('2026-02-18T23:59:59Z'), status: 'upcoming', city: 'Mumbai', venue: 'The Leela Mumbai', address: 'Sahar, Andheri East, Mumbai 400059', mapLatitude: 19.1095, mapLongitude: 72.8689 },
    { title: 'Angel Forum - March 2026', description: 'Monthly angel forum with special focus on healthcare and biotech startups seeking seed funding.', eventDate: new Date('2026-03-15T18:00:00Z'), location: 'Taj Lands End, Mumbai', capacity: 50, registrationDeadline: new Date('2026-03-13T23:59:59Z'), status: 'upcoming', city: 'Mumbai', venue: 'Taj Lands End', address: 'Bandstand, Bandra West, Mumbai 400050', mapLatitude: 19.0440, mapLongitude: 72.8198 },
    { title: 'FinTech Innovation Summit', description: 'Day-long summit exploring the latest in digital payments, neobanking, and embedded finance.', eventDate: new Date('2026-03-20T09:00:00Z'), location: 'Hyatt Regency, Mumbai', capacity: 120, registrationDeadline: new Date('2026-03-18T23:59:59Z'), status: 'upcoming', city: 'Mumbai', venue: 'Hyatt Regency', address: 'Sahar Airport Road, Andheri East, Mumbai 400099', mapLatitude: 19.1136, mapLongitude: 72.8697 },
    // Upcoming events (Bengaluru)
    { title: 'Bengaluru Startup Pitch Day', description: 'Pitch day featuring 10 early-stage startups from the Bengaluru ecosystem.', eventDate: new Date('2026-03-10T14:00:00Z'), location: 'The Oberoi, Bengaluru', capacity: 80, registrationDeadline: new Date('2026-03-08T23:59:59Z'), status: 'upcoming', city: 'Bengaluru', venue: 'The Oberoi', address: '37-39, Mahatma Gandhi Road, Bengaluru 560001', mapLatitude: 12.9716, mapLongitude: 77.5946 },
    { title: 'SaaS Growth Masterclass', description: 'Expert-led masterclass on scaling B2B SaaS companies from ₹1Cr to ₹100Cr ARR.', eventDate: new Date('2026-04-05T10:00:00Z'), location: 'ITC Gardenia, Bengaluru', capacity: 60, registrationDeadline: new Date('2026-04-03T23:59:59Z'), status: 'upcoming', city: 'Bengaluru', venue: 'ITC Gardenia', address: '1, Residency Road, Bengaluru 560025', mapLatitude: 12.9698, mapLongitude: 77.5968 },
    // Upcoming events (Delhi)
    { title: 'Delhi Angel Investor Meet', description: 'Quarterly angel investor meet to discuss portfolio strategies and new deal flow.', eventDate: new Date('2026-03-25T17:00:00Z'), location: 'The Imperial, New Delhi', capacity: 40, registrationDeadline: new Date('2026-03-23T23:59:59Z'), status: 'upcoming', city: 'Delhi', venue: 'The Imperial', address: 'Janpath, Connaught Place, New Delhi 110001', mapLatitude: 28.6129, mapLongitude: 77.2295 },
    { title: 'AgriTech Forum North India', description: 'Exploring investment opportunities in agriculture technology and rural innovation.', eventDate: new Date('2026-04-12T10:00:00Z'), location: 'ITC Maurya, New Delhi', capacity: 90, registrationDeadline: new Date('2026-04-10T23:59:59Z'), status: 'upcoming', city: 'Delhi', venue: 'ITC Maurya', address: 'Diplomatic Enclave, Sardar Patel Marg, New Delhi 110021', mapLatitude: 28.5987, mapLongitude: 77.1749 },
    // Upcoming events (Hyderabad, Chennai, Pune)
    { title: 'Hyderabad HealthTech Connect', description: 'Connecting healthtech startups with investors and hospital networks.', eventDate: new Date('2026-04-08T14:00:00Z'), location: 'Taj Falaknuma Palace, Hyderabad', capacity: 50, registrationDeadline: new Date('2026-04-06T23:59:59Z'), status: 'upcoming', city: 'Hyderabad', venue: 'Taj Falaknuma Palace', address: 'Engine Bowli, Falaknuma, Hyderabad 500053', mapLatitude: 17.3326, mapLongitude: 78.4671 },
    { title: 'Chennai Startup Ecosystem Summit', description: 'Annual gathering of Chennai startup community with investor panels and startup showcases.', eventDate: new Date('2026-04-15T09:00:00Z'), location: 'ITC Grand Chola, Chennai', capacity: 150, registrationDeadline: new Date('2026-04-13T23:59:59Z'), status: 'upcoming', city: 'Chennai', venue: 'ITC Grand Chola', address: '63, Anna Salai, Guindy, Chennai 600032', mapLatitude: 13.0105, mapLongitude: 80.2218 },
    { title: 'Pune Angel Forum Q2', description: 'Quarterly angel forum featuring Pune-based deep tech and manufacturing startups.', eventDate: new Date('2026-04-20T18:00:00Z'), location: 'JW Marriott, Pune', capacity: 60, registrationDeadline: new Date('2026-04-18T23:59:59Z'), status: 'upcoming', city: 'Pune', venue: 'JW Marriott', address: 'Senapati Bapat Road, Pune 411053', mapLatitude: 18.5362, mapLongitude: 73.8317 },

    // Completed / Past events (for history)
    { title: 'Monthly Angel Forum - January 2026', description: 'January edition featuring e-commerce and logistics startups.', eventDate: new Date('2026-01-18T18:00:00Z'), location: 'Taj Lands End, Mumbai', capacity: 50, status: 'completed', city: 'Mumbai', venue: 'Taj Lands End', address: 'Bandstand, Bandra West, Mumbai 400050', mapLatitude: 19.0440, mapLongitude: 72.8198 },
    { title: 'Annual Angel Summit 2025', description: 'Year-end summit reviewing 2025 deals and portfolio performance across all sectors.', eventDate: new Date('2025-12-15T10:00:00Z'), location: 'The Oberoi, Mumbai', capacity: 200, status: 'completed', city: 'Mumbai', venue: 'The Oberoi', address: 'Nariman Point, Mumbai 400021', mapLatitude: 18.9256, mapLongitude: 72.8242 },
    { title: 'CleanTech Investment Day', description: 'Full-day event focused on renewable energy, EV, and sustainability startups.', eventDate: new Date('2025-12-08T09:00:00Z'), location: 'Hilton, Chennai', capacity: 80, status: 'completed', city: 'Chennai', venue: 'Hilton Chennai', address: '124/1, JN Salai, Guindy, Chennai 600032', mapLatitude: 13.0067, mapLongitude: 80.2206 },
    { title: 'EdTech Founders Forum', description: 'Discussion forum for EdTech founders on scaling in the Indian market.', eventDate: new Date('2025-11-20T15:00:00Z'), location: 'Taj Coromandel, Chennai', capacity: 60, status: 'completed', city: 'Chennai', venue: 'Taj Coromandel', address: '37, Mahatma Gandhi Road, Nungambakkam, Chennai 600034', mapLatitude: 13.0569, mapLongitude: 80.2425 },
    { title: 'Bengaluru VC Roundtable', description: 'Roundtable discussion with top VCs on market trends and investment thesis for 2026.', eventDate: new Date('2025-11-10T14:00:00Z'), location: 'The Ritz-Carlton, Bengaluru', capacity: 30, status: 'completed', city: 'Bengaluru', venue: 'The Ritz-Carlton', address: '99, Residency Road, Bengaluru 560025', mapLatitude: 12.9692, mapLongitude: 77.6040 },
    { title: 'Cybersecurity Investment Workshop', description: 'Workshop on evaluating cybersecurity startups and understanding the threat landscape.', eventDate: new Date('2025-10-25T10:00:00Z'), location: 'JW Marriott, Pune', capacity: 40, status: 'completed', city: 'Pune', venue: 'JW Marriott', address: 'Senapati Bapat Road, Pune 411053', mapLatitude: 18.5362, mapLongitude: 73.8317 },
    { title: 'Monthly Angel Forum - October 2025', description: 'October forum with 5 pre-screened startups in consumer internet and retail tech.', eventDate: new Date('2025-10-18T18:00:00Z'), location: 'Taj Lands End, Mumbai', capacity: 50, status: 'completed', city: 'Mumbai', venue: 'Taj Lands End', address: 'Bandstand, Bandra West, Mumbai 400050', mapLatitude: 19.0440, mapLongitude: 72.8198 },
    { title: 'PropTech Pitch Night', description: 'Evening pitch session for real estate technology and construction tech startups.', eventDate: new Date('2025-10-05T19:00:00Z'), location: 'The Leela Palace, Delhi', capacity: 50, status: 'completed', city: 'Delhi', venue: 'The Leela Palace', address: 'Diplomatic Enclave, Chanakyapuri, New Delhi 110023', mapLatitude: 28.5930, mapLongitude: 77.1730 },
    { title: 'Women in Angel Investing', description: 'Special forum celebrating women angel investors and women-led startups.', eventDate: new Date('2025-09-20T15:00:00Z'), location: 'Taj Falaknuma Palace, Hyderabad', capacity: 60, status: 'completed', city: 'Hyderabad', venue: 'Taj Falaknuma Palace', address: 'Engine Bowli, Falaknuma, Hyderabad 500053', mapLatitude: 17.3326, mapLongitude: 78.4671 },
    { title: 'Monthly Angel Forum - September 2025', description: 'September edition with logistics and supply chain startups.', eventDate: new Date('2025-09-15T18:00:00Z'), location: 'Taj Lands End, Mumbai', capacity: 50, status: 'completed', city: 'Mumbai', venue: 'Taj Lands End', address: 'Bandstand, Bandra West, Mumbai 400050', mapLatitude: 19.0440, mapLongitude: 72.8198 },
    { title: 'AI/ML Startup Showcase', description: 'Showcase of top 8 AI/ML startups with live product demos and investor Q&A.', eventDate: new Date('2025-09-05T10:00:00Z'), location: 'ITC Gardenia, Bengaluru', capacity: 100, status: 'completed', city: 'Bengaluru', venue: 'ITC Gardenia', address: '1, Residency Road, Bengaluru 560025', mapLatitude: 12.9698, mapLongitude: 77.5968 },
    { title: 'Gaming & Esports Investment Night', description: 'Exploring the booming Indian gaming and esports investment opportunity.', eventDate: new Date('2025-08-22T19:00:00Z'), location: 'Sofitel, Mumbai', capacity: 45, status: 'completed', city: 'Mumbai', venue: 'Sofitel BKC', address: 'C-57, Bandra Kurla Complex, Mumbai 400098', mapLatitude: 19.0644, mapLongitude: 72.8634 },
    { title: 'Monthly Angel Forum - August 2025', description: 'August forum featuring biotech and pharmaceutical startups.', eventDate: new Date('2025-08-18T18:00:00Z'), location: 'Taj Lands End, Mumbai', capacity: 50, status: 'completed', city: 'Mumbai', venue: 'Taj Lands End', address: 'Bandstand, Bandra West, Mumbai 400050', mapLatitude: 19.0440, mapLongitude: 72.8198 },
    { title: 'EV & Mobility Summit', description: 'Summit on electric vehicles, autonomous driving, and future of mobility in India.', eventDate: new Date('2025-08-05T09:00:00Z'), location: 'HICC, Hyderabad', capacity: 120, status: 'completed', city: 'Hyderabad', venue: 'HICC', address: 'Madhapur, Hyderabad 500081', mapLatitude: 17.4486, mapLongitude: 78.3785 },
    { title: 'Rural Innovation Forum', description: 'Exploring tech-driven solutions for rural India — agritech, rural fintech, and more.', eventDate: new Date('2025-07-25T10:00:00Z'), location: 'Vivanta, Pune', capacity: 70, status: 'completed', city: 'Pune', venue: 'Vivanta Pune', address: 'Blue Ridge, Hinjewadi, Pune 411057', mapLatitude: 18.5890, mapLongitude: 73.7380 },
    { title: 'Monthly Angel Forum - July 2025', description: 'July forum with D2C brands and consumer startups.', eventDate: new Date('2025-07-18T18:00:00Z'), location: 'Taj Lands End, Mumbai', capacity: 50, status: 'completed', city: 'Mumbai', venue: 'Taj Lands End', address: 'Bandstand, Bandra West, Mumbai 400050', mapLatitude: 19.0440, mapLongitude: 72.8198 },
    { title: 'Climate Tech & Sustainability Forum', description: 'Investor forum on climate tech, carbon credits, and sustainability-focused startups.', eventDate: new Date('2025-07-08T14:00:00Z'), location: 'ITC Grand Chola, Chennai', capacity: 80, status: 'completed', city: 'Chennai', venue: 'ITC Grand Chola', address: '63, Anna Salai, Guindy, Chennai 600032', mapLatitude: 13.0105, mapLongitude: 80.2218 },
    { title: 'Monthly Angel Forum - June 2025', description: 'June edition showcasing Web3 and blockchain startups solving real-world problems.', eventDate: new Date('2025-06-18T18:00:00Z'), location: 'Taj Lands End, Mumbai', capacity: 50, status: 'completed', city: 'Mumbai', venue: 'Taj Lands End', address: 'Bandstand, Bandra West, Mumbai 400050', mapLatitude: 19.0440, mapLongitude: 72.8198 },
  ];

  // Create all 30 events
  const createdEvents = [];
  for (const eventData of events) {
    const event = await prisma.event.create({ data: eventData });
    createdEvents.push(event);
    console.log(`✅ Created event: ${eventData.title}`);
  }
  console.log(`\n📊 Created ${createdEvents.length} events total`);

  // ==================== SEED EVENT REGISTRATIONS ====================
  console.log('\n📝 Seeding event registrations...\n');
  
  // Get all users for creating registrations
  const allUsers = await prisma.user.findMany();
  
  // Create EventRegistration records for each event (3-8 per event)
  let totalRegistrations = 0;
  for (const event of createdEvents) {
    // Pick 3-8 random users per event
    const regCount = Math.min(allUsers.length, Math.floor(Math.random() * 6) + 3);
    const shuffled = [...allUsers].sort(() => Math.random() - 0.5);
    const selectedUsers = shuffled.slice(0, regCount);
    
    for (const user of selectedUsers) {
      try {
        await prisma.eventRegistration.create({
          data: {
            eventId: event.id,
            userId: user.id,
            fullName: user.fullName,
            email: user.email,
            status: 'registered',
          },
        });
        totalRegistrations++;
      } catch {
        // Skip duplicates
        continue;
      }
    }
  }
  console.log(`✅ Created ${totalRegistrations} event registrations across ${createdEvents.length} events`);

  // Seed Team Members
  const teamMembers = [
    {
      name: 'Vikram Mehta',
      role: 'Managing Partner',
      bio: 'Vikram brings 20+ years of experience in venture capital and angel investing across India. Previously led investments at Sequoia Capital India.',
      linkedinUrl: 'https://linkedin.com/in/vikram-mehta',
      displayOrder: 1,
      isActive: true,
    },
    {
      name: 'Anita Desai',
      role: 'Head of Investments',
      bio: 'Anita specializes in deep-tech and AI/ML startups. Former CTO at a leading Indian unicorn with expertise in evaluating technology-driven businesses.',
      linkedinUrl: 'https://linkedin.com/in/anita-desai',
      displayOrder: 2,
      isActive: true,
    },
    {
      name: 'Rajesh Iyer',
      role: 'Director of Operations',
      bio: 'Rajesh oversees forum operations and event management. Previously ran operations for TiE Mumbai chapter for 8 years.',
      linkedinUrl: 'https://linkedin.com/in/rajesh-iyer',
      displayOrder: 3,
      isActive: true,
    },
  ];

  await prisma.teamMember.deleteMany({});
  for (const member of teamMembers) {
    await prisma.teamMember.create({ data: member });
  }
  console.log(`✅ Created ${teamMembers.length} team members`);

  // Seed Partners
  const partners = [
    {
      name: 'Mumbai Angels Network',
      description: 'One of India\'s premier angel investing platforms with 500+ members and 200+ investments.',
      websiteUrl: 'https://mumbaiangels.com',
      displayOrder: 1,
      isActive: true,
    },
    {
      name: 'NASSCOM',
      description: 'India\'s technology industry body representing the $245 billion IT-BPM sector.',
      websiteUrl: 'https://nasscom.in',
      displayOrder: 2,
      isActive: true,
    },
    {
      name: 'Startup India',
      description: 'Government of India initiative to catalyze startup culture and build a strong ecosystem.',
      websiteUrl: 'https://startupindia.gov.in',
      displayOrder: 3,
      isActive: true,
    },
    {
      name: 'IIT Bombay E-Cell',
      description: 'IIT Bombay\'s Entrepreneurship Cell fostering the startup ecosystem in India since 2002.',
      websiteUrl: 'https://ecell.in',
      displayOrder: 4,
      isActive: true,
    },
  ];

  await prisma.partner.deleteMany({});
  for (const partner of partners) {
    await prisma.partner.create({ data: partner });
  }
  console.log(`✅ Created ${partners.length} partners`);

  // Seed Event Startups (for the first event)
  const firstEventId = createdEvents[0].id;
  const eventStartups = [
    {
      eventId: firstEventId,
      companyName: 'MediScan AI',
      founderName: 'Dr. Kavitha Rao',
      founderLinkedin: 'https://linkedin.com/in/kavitha-rao',
      pitchDescription: 'AI-powered diagnostic imaging platform that detects early-stage cancers with 98% accuracy. Already deployed in 15 hospitals across India.',
      industry: 'Healthcare AI',
      fundingStage: 'Seed',
      displayOrder: 1,
    },
    {
      eventId: firstEventId,
      companyName: 'FinFlow',
      founderName: 'Arjun Nair',
      founderLinkedin: 'https://linkedin.com/in/arjun-nair',
      pitchDescription: 'Embedded finance platform enabling any SaaS company to offer lending products. Processing ₹50Cr+ monthly through partner integrations.',
      industry: 'FinTech',
      fundingStage: 'Pre-Seed',
      displayOrder: 2,
    },
    {
      eventId: firstEventId,
      companyName: 'GreenRoute Logistics',
      founderName: 'Meera Sharma',
      founderLinkedin: 'https://linkedin.com/in/meera-sharma',
      pitchDescription: 'Electric vehicle-based last-mile delivery network. Carbon-neutral logistics covering 8 major Indian cities with 500+ EV fleet.',
      industry: 'CleanTech / Logistics',
      fundingStage: 'Seed',
      displayOrder: 3,
    },
  ];

  // Clear existing startups for this event and recreate
  await prisma.eventStartup.deleteMany({
    where: { eventId: firstEventId },
  });
  for (const startup of eventStartups) {
    await prisma.eventStartup.create({
      data: startup,
    });
  }
  console.log(`✅ Created ${eventStartups.length} event startups`);

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
  
  // Seed Financial Statements
  await seedFinancialStatements();
  
  // ==================== MEMBERSHIP PLANS & CONFIG ====================
  console.log('\n💳 Seeding membership plans, discount codes, and config...\n');

  // Clear existing membership data (safe for dev/test)
  await prisma.membershipPlanChangeLog.deleteMany({});
  await prisma.userMembership.deleteMany({});
  await prisma.discountCode.deleteMany({});
  await prisma.membershipPlan.deleteMany({});
  await prisma.identityVerification.deleteMany({});
  await prisma.systemConfig.deleteMany({});

  // Create Membership Plans
  const standardPlan = await prisma.membershipPlan.create({
    data: {
      name: 'Standard Member',
      slug: 'standard-annual',
      price: 60000,
      billingCycle: 'ANNUAL',
      features: [
        'Access to monthly angel forums',
        'Deal flow access (5 deals/month)',
        'Networking events',
        'Quarterly investment reports',
        'Email support',
      ],
      isActive: true,
      displayOrder: 1,
    },
  });
  console.log(`✅ Created plan: ${standardPlan.name} (₹${standardPlan.price})`);

  const premiumPlan = await prisma.membershipPlan.create({
    data: {
      name: 'Premium Member',
      slug: 'premium-annual',
      price: 120000,
      billingCycle: 'ANNUAL',
      features: [
        'All Standard features',
        'Unlimited deal flow access',
        'Priority event seating',
        'Monthly 1-on-1 advisory sessions',
        'Co-investment opportunities',
        'Exclusive deep-dive sector reports',
        'Priority support line',
      ],
      isActive: true,
      displayOrder: 2,
    },
  });
  console.log(`✅ Created plan: ${premiumPlan.name} (₹${premiumPlan.price})`);

  const introductoryPlan = await prisma.membershipPlan.create({
    data: {
      name: 'Introductory',
      slug: 'introductory-free',
      price: 0,
      billingCycle: 'ANNUAL',
      features: [
        'Access to monthly angel forums',
        'Limited deal flow (2 deals/month)',
        'Networking events (general)',
        'Community access',
      ],
      isActive: true,
      displayOrder: 0,
    },
  });
  console.log(`✅ Created plan: ${introductoryPlan.name} (₹${introductoryPlan.price})`);

  // Create Discount Codes
  const adminId = adminUser?.id || 'seed-admin';
  const discountCodes = [
    {
      code: 'EARLY2026',
      discountType: 'PERCENTAGE' as const,
      discountValue: 20,
      maxUses: 100,
      currentUses: 0,
      validFrom: new Date('2025-12-01'),
      validUntil: new Date('2026-06-30'),
      applicablePlanIds: [standardPlan.id, premiumPlan.id],
      isActive: true,
      createdBy: adminId,
      description: 'Early bird 20% discount for 2026',
    },
    {
      code: 'FOUNDING50',
      discountType: 'FIXED_AMOUNT' as const,
      discountValue: 50000,
      maxUses: 25,
      currentUses: 0,
      validFrom: new Date('2025-01-01'),
      validUntil: null,
      applicablePlanIds: [premiumPlan.id],
      isActive: true,
      createdBy: adminId,
      description: 'Founding member ₹50,000 off Premium',
    },
    {
      code: 'FREE100',
      discountType: 'PERCENTAGE' as const,
      discountValue: 100,
      maxUses: 10,
      currentUses: 0,
      validFrom: new Date('2025-01-01'),
      validUntil: new Date('2026-12-31'),
      applicablePlanIds: [standardPlan.id],
      isActive: true,
      createdBy: adminId,
      description: '100% off Standard (10 invitees)',
    },
  ];

  for (const dc of discountCodes) {
    await prisma.discountCode.create({ data: dc });
    console.log(`✅ Created discount code: ${dc.code}`);
  }

  // System Config
  const systemConfigs = [
    { key: 'membership.introductory_enabled', value: 'false', description: 'Enable introductory pricing for all plans' },
    { key: 'membership.introductory_price', value: '0', description: 'Introductory price override (when enabled)' },
    { key: 'persona.monthly_quota', value: '500', description: 'Max Persona verifications per month' },
    { key: 'persona.monthly_used', value: '0', description: 'Verifications used this month (auto-reset)' },
    { key: 'membership.razorpay_enabled', value: 'true', description: 'Enable Razorpay payment gateway for memberships' },
    { key: 'membership.stripe_enabled', value: 'false', description: 'Enable Stripe payment gateway for memberships' },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.create({ data: config });
    console.log(`✅ Created config: ${config.key} = ${config.value || '(empty)'}`);
  }

  // Create a sample verified investor with membership
  const sampleInvestor = await prisma.user.findUnique({
    where: { email: 'investor.standard@test.com' },
  });

  if (sampleInvestor) {
    // Create identity verification
    await prisma.identityVerification.create({
      data: {
        userId: sampleInvestor.id,
        provider: 'persona',
        providerInquiryId: `inq_seed_${Date.now()}`,
        status: 'COMPLETED',
        verifiedAt: new Date('2025-12-15'),
      },
    });
    console.log(`✅ Created identity verification for ${sampleInvestor.email}`);

    // Create membership
    const membershipStart = new Date('2026-01-10');
    const membershipEnd = new Date('2027-01-10');
    await prisma.userMembership.create({
      data: {
        userId: sampleInvestor.id,
        planId: standardPlan.id,
        status: 'ACTIVE',
        startDate: membershipStart,
        endDate: membershipEnd,
        autoRenew: false,
      },
    });
    console.log(`✅ Created active membership for ${sampleInvestor.email}`);

    // Log activation
    await prisma.membershipPlanChangeLog.create({
      data: {
        userId: sampleInvestor.id,
        newPlanId: standardPlan.id,
        changeType: 'ACTIVATION',
        newPrice: standardPlan.price,
        changedBy: sampleInvestor.id,
      },
    });
  }

  console.log('\n✨ Membership seed data completed!\n');
  
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
