/**
 * Event Attendance Seed Data
 * 
 * Creates sample EventAttendance records for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedEventAttendance() {
  console.log('🎫 Seeding Event Attendance records...');

  try {
    // Get sample users and events  
    const users = await prisma.user.findMany({
      take: 20,
    });

    const events = await prisma.event.findMany({
      where: {
        status: { in: ['published', 'upcoming'] },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    if (users.length === 0 || events.length === 0) {
      console.log('⚠️  No users or events found. Skipping event attendance seeding.');
      return;
    }

    // Create attendance records for each event
    let createdCount = 0;
    for (const event of events) {
      // Select 10-15 random users for this event
      const attendeeCount = Math.floor(Math.random() * 6) + 10; // 10-15
      const selectedUsers = users.slice(0, attendeeCount);

      for (const [index, user] of selectedUsers.entries()) {
        // Vary the RSVP status
        let rsvpStatus: 'CONFIRMED' | 'WAITLIST' | 'NO_SHOW' = 'CONFIRMED';
        if (index >= attendeeCount - 2) {
          rsvpStatus = 'NO_SHOW';
        } else if (index >= attendeeCount - 4) {
          rsvpStatus = 'WAITLIST';
        }

        // For CONFIRMED attendees, some are checked in/out
        let checkInTime: Date | null = null;
        let checkOutTime: Date | null = null;
        let attendanceStatus: 'ATTENDED' | 'PARTIAL' | 'ABSENT' | null = null;

        if (rsvpStatus === 'CONFIRMED') {
          // 70% chance of check-in
          if (Math.random() > 0.3) {
            const eventDate = new Date(event.eventDate);
            checkInTime = new Date(eventDate.getTime() - Math.random() * 30 * 60000); // Within 30 min before event

            // 80% of checked-in attendees also check out
            if (Math.random() > 0.2) {
              const duration = Math.random() * 120 + 60; // 60-180 minutes
              checkOutTime = new Date(checkInTime.getTime() + duration * 60000);
              attendanceStatus = 'ATTENDED';
            } else {
              attendanceStatus = 'PARTIAL';
            }
          } else {
            attendanceStatus = 'ABSENT';
          }
        }

        try {
          await prisma.eventAttendance.create({
            data: {
              userId: user.id,
              eventId: event.id,
              rsvpStatus,
              attendanceStatus,
              checkInTime,
              checkOutTime,
            },
          });
          createdCount++;
        } catch (error) {
          // Skip if duplicate (userId-eventId unique constraint)
          continue;
        }
      }
    }

    console.log(`✅ Created ${createdCount} event attendance records`);
  } catch (error) {
    console.error('❌ Error seeding event attendance:', error);
    throw error;
  }
}
