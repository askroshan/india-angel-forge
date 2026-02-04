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
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
