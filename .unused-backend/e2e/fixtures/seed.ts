/**
 * Database seeder for E2E tests
 * Creates test users and initial data in the database
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { testUsers, testCompanies, testFundraisingRounds, testDeals } from './testData';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🧹 Clearing database...');
  
  // Delete in correct order to respect foreign key constraints
  await prisma.investmentCommitment.deleteMany();
  await prisma.dealDocument.deleteMany();
  await prisma.dealInterest.deleteMany();
  await prisma.spvMember.deleteMany();
  await prisma.spv.deleteMany();
  await prisma.sharedDocument.deleteMany();
  await prisma.portfolioUpdate.deleteMany();
  await prisma.portfolioCompany.deleteMany();
  await prisma.pitchMaterial.deleteMany();
  await prisma.pitchSession.deleteMany();
  await prisma.dueDiligenceItem.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.fundraisingRound.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.investorApplication.deleteMany();
  await prisma.founderApplication.deleteMany();
  await prisma.eventWaitlist.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  
  console.log('✅ Database cleared');
}

async function seedRoles() {
  console.log('🌱 Seeding roles...');
  
  const roles = ['admin', 'compliance_officer', 'investor', 'founder'];
  
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `${roleName} role`,
      },
    });
  }
  
  console.log('✅ Roles seeded');
}

async function seedUsers() {
  console.log('🌱 Seeding users...');
  
  const users = [];
  
  for (const [key, userData] of Object.entries(testUsers)) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        fullName: userData.fullName,
        emailVerified: true,
      },
    });
    
    // Get role
    const role = await prisma.role.findUnique({
      where: { name: userData.role },
    });
    
    if (role) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }
    
    users.push(user);
    console.log(`  ✓ Created ${userData.role}: ${userData.email}`);
  }
  
  console.log('✅ Users seeded');
  return users;
}

async function seedCompaniesAndDeals() {
  console.log('🌱 Seeding companies and deals...');
  
  const founder = await prisma.user.findUnique({
    where: { email: testUsers.founder.email },
  });
  
  if (!founder) {
    console.log('❌ Founder not found');
    return;
  }
  
  // Create company profile
  const company = await prisma.companyProfile.create({
    data: {
      userId: founder.id,
      companyName: testCompanies.techStartup.companyName,
      industrySector: testCompanies.techStartup.industrySector,
      foundedYear: testCompanies.techStartup.foundedYear,
      employeeCount: testCompanies.techStartup.employeeCount,
      website: testCompanies.techStartup.website,
      description: testCompanies.techStartup.description,
      registrationNumber: testCompanies.techStartup.registrationNumber,
      address: testCompanies.techStartup.address,
    },
  });
  
  console.log('  ✓ Created company profile');
  
  // Create fundraising round
  const round = await prisma.fundraisingRound.create({
    data: {
      companyId: company.id,
      roundType: testFundraisingRounds.techSeedRound.roundType,
      targetAmount: testFundraisingRounds.techSeedRound.targetAmount,
      minInvestment: testFundraisingRounds.techSeedRound.minInvestment,
      maxInvestment: testFundraisingRounds.techSeedRound.maxInvestment,
      valuation: testFundraisingRounds.techSeedRound.valuation,
      useOfFunds: testFundraisingRounds.techSeedRound.useOfFunds,
      timeline: testFundraisingRounds.techSeedRound.timeline,
    },
  });
  
  console.log('  ✓ Created fundraising round');
  
  // Create deal
  const deal = await prisma.deal.create({
    data: {
      investorId: founder.id, // The founder creates the deal
      companyId: company.id,
      title: testDeals.openDeal.title,
      slug: testDeals.openDeal.slug,
      companyName: company.companyName,
      industrySector: company.industrySector || '',
      dealStatus: testDeals.openDeal.dealStatus,
      dealSize: testDeals.openDeal.dealSize,
      minInvestment: testDeals.openDeal.minInvestment,
      description: testDeals.openDeal.description,
      closingDate: testDeals.openDeal.closingDate,
    },
  });
  
  console.log('  ✓ Created deal');
  console.log('✅ Companies and deals seeded');
  
  return { company, round, deal };
}

async function seedApplications() {
  console.log('🌱 Seeding applications...');
  
  const founder = await prisma.user.findUnique({
    where: { email: testUsers.founder2.email },
  });
  
  const investor = await prisma.user.findUnique({
    where: { email: testUsers.investor2.email },
  });
  
  if (founder) {
    await prisma.founderApplication.create({
      data: {
        userId: founder.id,
        fullName: founder.fullName,
        email: founder.email,
        phoneNumber: '+91-9876543210',
        companyName: 'New Startup Inc',
        companyStage: 'seed',
        industrySector: 'Technology',
        fundingRequired: 30000000,
        pitchSummary: 'Building next-gen SaaS platform',
        status: 'pending',
      },
    });
    console.log('  ✓ Created founder application');
  }
  
  if (investor) {
    await prisma.investorApplication.create({
      data: {
        userId: investor.id,
        fullName: investor.fullName,
        email: investor.email,
        phoneNumber: '+91-9876543211',
        investmentRange: '5000000-50000000',
        focusAreas: ['Technology', 'Healthcare'],
        experienceYears: 5,
        accreditationStatus: 'pending',
        status: 'pending',
      },
    });
    console.log('  ✓ Created investor application');
  }
  
  console.log('✅ Applications seeded');
}

async function seedEvents() {
  console.log('🌱 Seeding events...');
  
  const admin = await prisma.user.findUnique({
    where: { email: testUsers.admin.email },
  });
  
  if (!admin) {
    console.log('❌ Admin not found');
    return;
  }
  
  await prisma.event.create({
    data: {
      title: 'Q1 2025 Investor-Founder Networking',
      slug: 'q1-2025-networking',
      description: 'Exclusive networking event for our community members',
      eventType: 'networking',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      location: 'The Grand Hotel, Bangalore',
      maxAttendees: 100,
      registrationFee: 5000,
      isVirtual: false,
      organizerId: admin.id,
      status: 'upcoming',
    },
  });
  
  console.log('  ✓ Created event');
  console.log('✅ Events seeded');
}

async function main() {
  try {
    console.log('🚀 Starting database seed...\n');
    
    await clearDatabase();
    await seedRoles();
    const users = await seedUsers();
    await seedCompaniesAndDeals();
    await seedApplications();
    await seedEvents();
    
    console.log('\n✅ Database seed completed successfully!');
    console.log('\n📝 Test credentials:');
    console.log('  Admin: admin@indiaangelforum.test / AdminTest@123');
    console.log('  Compliance: compliance@indiaangelforum.test / Compliance@123');
    console.log('  Investor: investor@indiaangelforum.test / Investor@123');
    console.log('  Founder: founder@indiaangelforum.test / Founder@123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
