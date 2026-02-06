/**
 * Event Attendance Routes
 * 
 * Manages event RSVP, check-in/out, and attendance tracking
 * 
 * @module routes/event-attendance
 */

import { Router } from 'express';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { prisma } from '../../db';
import { z } from 'zod';

const router = Router();

/**
 * GET /api/events/:eventId/my-rsvp
 * 
 * Get current user's RSVP status for an event
 */
router.get('/:eventId/my-rsvp', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user!.id;

    const attendance = await prisma.eventAttendance.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    return res.json({
      success: true,
      data: { attendance },
    });
  } catch (error) {
    console.error('Error fetching RSVP status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch RSVP status',
    });
  }
});

/**
 * POST /api/events/:eventId/rsvp
 * 
 * RSVP to an event
 */
router.post('/:eventId/rsvp', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user!.id;
    
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, capacity: true, eventDate: true },
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }
    
    // Check if event has passed
    if (new Date(event.eventDate) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot RSVP to past events',
      });
    }
    
    // Check if already RSVPed
    const existing = await prisma.eventAttendance.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Already RSVPed to this event',
      });
    }
    
    // Check capacity
    if (event.capacity) {
      const confirmedCount = await prisma.eventAttendance.count({
        where: {
          eventId,
          rsvpStatus: 'CONFIRMED',
        },
      });
      
      if (confirmedCount >= event.capacity) {
        // Add to waitlist
        const attendance = await prisma.eventAttendance.create({
          data: {
            userId,
            eventId,
            rsvpStatus: 'WAITLIST',
          },
        });
        
        return res.json({
          success: true,
          data: { attendance, message: 'Added to waitlist' },
        });
      }
    }
    
    // Create confirmed RSVP
    const attendance = await prisma.eventAttendance.create({
      data: {
        userId,
        eventId,
        rsvpStatus: 'CONFIRMED',
      },
    });
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        activityType: 'EVENT_REGISTERED',
        entityType: 'event',
        entityId: eventId,
        description: `Registered for event: ${event.title}`,
      },
    });
    
    return res.json({
      success: true,
      data: { attendance },
    });
  } catch (error) {
    console.error('Error creating RSVP:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to RSVP to event',
    });
  }
});

/**
 * DELETE /api/events/:eventId/rsvp
 * 
 * Cancel RSVP
 */
router.delete('/:eventId/rsvp', authenticateUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user!.id;
    
    const attendance = await prisma.eventAttendance.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: 'RSVP not found',
      });
    }
    
    // Update to CANCELLED
    await prisma.eventAttendance.update({
      where: { userId_eventId: { userId, eventId } },
      data: { rsvpStatus: 'CANCELLED' },
    });
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        activityType: 'EVENT_CANCELLED',
        entityType: 'event',
        entityId: eventId,
        description: 'Cancelled event registration',
      },
    });
    
    return res.json({
      success: true,
      message: 'RSVP cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling RSVP:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel RSVP',
    });
  }
});

/**
 * GET /api/events/:eventId/attendance
 * 
 * Get attendance list for an event (admin only)
 */
router.get('/:eventId/attendance', authenticateUser, requireRoles(['admin']), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const attendees = await prisma.eventAttendance.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    
    return res.json({
      success: true,
      data: { attendees },
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance',
    });
  }
});

/**
 * POST /api/events/:eventId/attendance/check-in
 * 
 * Check in an attendee (admin only)
 */
router.post('/:eventId/attendance/check-in', authenticateUser, requireRoles(['admin']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;
    
    const attendance = await prisma.eventAttendance.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found',
      });
    }
    
    if (attendance.rsvpStatus !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        error: 'Can only check in confirmed attendees',
      });
    }
    
    // Update with check-in time
    const updated = await prisma.eventAttendance.update({
      where: { userId_eventId: { userId, eventId } },
      data: {
        checkInTime: new Date(),
        attendanceStatus: 'ATTENDED',
      },
    });
    
    return res.json({
      success: true,
      data: { attendance: updated },
    });
  } catch (error) {
    console.error('Error checking in attendee:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check in attendee',
    });
  }
});

/**
 * POST /api/events/:eventId/attendance/check-out
 * 
 * Check out an attendee (admin only)
 */
router.post('/:eventId/attendance/check-out', authenticateUser, requireRoles(['admin']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;
    
    const attendance = await prisma.eventAttendance.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found',
      });
    }
    
    if (!attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        error: 'Attendee has not checked in yet',
      });
    }
    
    // Update with check-out time
    const updated = await prisma.eventAttendance.update({
      where: { userId_eventId: { userId, eventId } },
      data: {
        checkOutTime: new Date(),
      },
    });
    
    return res.json({
      success: true,
      data: { attendance: updated },
    });
  } catch (error) {
    console.error('Error checking out attendee:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check out attendee',
    });
  }
});

/**
 * GET /api/events/:eventId/statistics
 * 
 * Get attendance statistics for an event (admin only)
 */
router.get('/:eventId/statistics', authenticateUser, requireRoles(['admin']), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Get counts by status
    const [total, confirmed, waitlist, cancelled, noShow, attended, partial, absent] = await Promise.all([
      prisma.eventAttendance.count({ where: { eventId } }),
      prisma.eventAttendance.count({ where: { eventId, rsvpStatus: 'CONFIRMED' } }),
      prisma.eventAttendance.count({ where: { eventId, rsvpStatus: 'WAITLIST' } }),
      prisma.eventAttendance.count({ where: { eventId, rsvpStatus: 'CANCELLED' } }),
      prisma.eventAttendance.count({ where: { eventId, rsvpStatus: 'NO_SHOW' } }),
      prisma.eventAttendance.count({ where: { eventId, attendanceStatus: 'ATTENDED' } }),
      prisma.eventAttendance.count({ where: { eventId, attendanceStatus: 'PARTIAL' } }),
      prisma.eventAttendance.count({ where: { eventId, attendanceStatus: 'ABSENT' } }),
    ]);
    
    // Count checked in (has checkInTime)
    const checkedIn = await prisma.eventAttendance.count({
      where: {
        eventId,
        checkInTime: { not: null },
      },
    });
    
    // Calculate attendance rate
    const attendanceRate = confirmed > 0 ? (attended / confirmed) * 100 : 0;
    
    return res.json({
      success: true,
      data: {
        total,
        rsvp: {
          confirmed,
          waitlist,
          cancelled,
          noShow,
        },
        attendance: {
          checkedIn,
          attended,
          partial,
          absent,
        },
        attendanceRate: Math.round(attendanceRate * 10) / 10,
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

export default router;
