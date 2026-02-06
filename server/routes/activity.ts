import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * Activity Timeline API Routes
 * 
 * Unified activity feed combining payments, events, messages, documents, and profile updates.
 * Provides filtering, pagination, and CSV export.
 * 
 * Routes:
 * - GET /api/activity: Get activity feed with filters
 * - GET /api/activity/export/csv: Export activity to CSV
 * 
 * E2E Tests: AT-E2E-001 to AT-E2E-006
 */

// Zod schema for activity filters
const activityFiltersSchema = z.object({
  activityType: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.string().optional().transform((val) => {
    if (!val) return 20;
    const num = parseInt(val, 10);
    return isNaN(num) ? 20 : Math.min(num, 100);
  }),
});

/**
 * Format activity for display
 * 
 * @param activity - Activity record
 * @returns Formatted activity object
 */
function formatActivity(activity: any) {
  return {
    id: activity.id,
    type: activity.activityType,
    description: activity.description,
    timestamp: activity.createdAt.toISOString(),
    metadata: activity.metadata || {},
  };
}

/**
 * GET /api/activity
 * Get user's activity timeline
 * 
 * Returns unified feed of all user activities with filtering and cursor-based pagination.
 * 
 * Query params:
 * - activityType: string (optional) - Filter by activity type
 * - dateFrom: ISO date string (optional) - Filter from date
 * - dateTo: ISO date string (optional) - Filter to date
 * - cursor: string (optional) - Cursor for pagination (activity ID)
 * - limit: number (optional) - Items per page (default 20, max 100)
 * 
 * Response:
 * - success: boolean
 * - data: Array of activities
 * - pagination: { hasMore, nextCursor }
 * 
 * E2E Tests: AT-E2E-001, AT-E2E-002, AT-E2E-003, AT-E2E-004
 */
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = activityFiltersSchema.parse(req.query);

    // Build where clause
    const where: any = {
      userId: req.user!.id,
    };

    if (filters.activityType) {
      where.activityType = filters.activityType;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    // Cursor-based pagination
    const cursorOptions: any = {
      take: filters.limit + 1, // Take one extra to check if there's more
      orderBy: {
        createdAt: 'desc',
      },
    };

    if (filters.cursor) {
      cursorOptions.cursor = {
        id: parseInt(filters.cursor, 10),
      };
      cursorOptions.skip = 1; // Skip the cursor itself
    }

    // Fetch activities
    const activities = await prisma.activity.findMany({
      where,
      ...cursorOptions,
    });

    // Check if there are more results
    const hasMore = activities.length > filters.limit;
    if (hasMore) {
      activities.pop(); // Remove the extra item
    }

    const nextCursor = hasMore && activities.length > 0 
      ? activities[activities.length - 1].id.toString() 
      : null;

    const formattedActivities = activities.map(formatActivity);

    res.json({
      success: true,
      data: formattedActivities,
      pagination: {
        hasMore,
        nextCursor,
        count: formattedActivities.length,
      },
    });
  } catch (error: any) {
    console.error('Get activity error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filter parameters',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity',
      code: 'FETCH_ERROR',
    });
  }
});

/**
 * GET /api/activity/export/csv
 * Export activity timeline to CSV
 * 
 * Exports all activities (with filters) to CSV format.
 * 
 * Query params:
 * - activityType: string (optional) - Filter by activity type
 * - dateFrom: ISO date string (optional) - Filter from date
 * - dateTo: ISO date string (optional) - Filter to date
 * 
 * Response:
 * - CSV file download
 * 
 * E2E Tests: AT-E2E-005, AT-E2E-006
 */
router.get('/export/csv', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = activityFiltersSchema.parse(req.query);

    // Build where clause (same as main query but without pagination)
    const where: any = {
      userId: req.user!.id,
    };

    if (filters.activityType) {
      where.activityType = filters.activityType;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    // Fetch all activities (no pagination for export)
    const activities = await prisma.activity.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate CSV
    const csvHeaders = ['Date', 'Time', 'Type', 'Description'];
    const csvRows = activities.map((activity) => {
      const date = new Date(activity.createdAt);
      return [
        date.toLocaleDateString('en-IN'),
        date.toLocaleTimeString('en-IN'),
        activity.activityType,
        `"${(activity.description || '').replace(/"/g, '""')}"`, // Escape quotes
      ].join(',');
    });

    const csv = [csvHeaders.join(','), ...csvRows].join('\n');

    // Set headers for file download
    const filename = `activity-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(csv);
  } catch (error: any) {
    console.error('Export activity CSV error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filter parameters',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to export activity',
      code: 'EXPORT_ERROR',
    });
  }
});

export default router;
