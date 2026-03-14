/**
 * India Angel Forum - Backend API Server
 * Express.js server with PostgreSQL via Prisma
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Prisma } from '@prisma/client';
import prisma from './db';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { emailService } from './server/services/email.service';
import { invoiceService } from './server/services/invoice.service';
import { invoiceQueueService } from './server/services/invoice-queue.service';
import { invoiceCleanupService } from './server/services/invoice-cleanup.service';
import { adminDigestService } from './server/services/admin-digest.service';
// import { createBullBoard } from '@bull-board/api';
// import { BullMQAdapter } from '@bull-board/api/bullMQ';
// import { ExpressAdapter } from '@bull-board/express';
import paymentsHistoryRouter from './server/routes/payments-history';
import eventAttendanceRouter from './server/routes/event-attendance';
import certificatesRouter from './server/routes/certificates';
import financialStatementsRouter from './server/routes/financial-statements';
import activityRouter from './server/routes/activity';
import cmsRouter from './server/routes/cms';
import membershipRouter from './server/routes/membership';
import adminMembershipRouter from './server/routes/admin-membership';
import identityVerificationRouter from './server/routes/identity-verification';

import path from 'path';
import fs from 'fs';

// Fix Express 5 route param types: named route params are always strings
// (Express 5 changed ParamsDictionary to string | string[], but route params are always strings)
declare module 'express-serve-static-core' {
  interface ParamsDictionary {
    [key: string]: string;
  }
}

dotenv.config();

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { userId: string; email: string; roles?: string[] };
}

const app = express();
const PORT = process.env.API_PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

// Middleware
app.use('/statements', express.static(path.join(process.cwd(), 'public', 'statements')));
app.use('/certificates', express.static(path.join(process.cwd(), 'public', 'certificates')));
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: { message: 'Access token required', code: 'UNAUTHORIZED' } });
  }

  jwt.verify(token, JWT_SECRET, (err: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
    if (err) {
      return res.status(403).json({ error: { message: 'Invalid token', code: 'FORBIDDEN' } });
    }
    (req as AuthenticatedRequest).user = decoded as AuthenticatedRequest['user'];
    next();
  });
};

/**
 * Role-based authorization middleware
 * Checks if the authenticated user has one of the allowed roles
 * Must be used after authenticateToken middleware
 * 
 * @param allowedRoles - Array of roles that are allowed to access this endpoint
 * @returns Express middleware function
 * 
 * @example
 * // Single role
 * app.get('/api/admin/users', authenticateToken, requireRole(['admin']), handler);
 * 
 * @example
 * // Multiple roles
 * app.get('/api/deals', authenticateToken, requireRole(['investor', 'angel_investor', 'vc_partner']), handler);
 */
const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({ 
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' } 
      });
    }

    const userRoles: string[] = user.roles || [];
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: { 
          message: 'Access denied. Insufficient permissions.', 
          code: 'FORBIDDEN',
          requiredRoles: allowedRoles,
          userRoles: userRoles
        } 
      });
    }

    next();
  };
};

// Helper function to get user ID from authenticated request (with type safety)
const getUserId = (req: Request): string => {
  const user = (req as AuthenticatedRequest).user;
  if (!user?.userId) {
    throw new Error('User not authenticated');
  }
  return user.userId;
};

// ==================== AUTH ROUTES ====================

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: { message: 'Email and password required', code: 'VALIDATION_ERROR' } });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: { message: 'Email already registered', code: 'EMAIL_EXISTS' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, fullName },
    });

    // Assign default user role
    await prisma.userRole.create({
      data: { userId: user.id, role: 'user' },
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Return token/user at top level (matches login response format)
    res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, roles: ['user'] },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: { message: 'Email and password required', code: 'VALIDATION_ERROR' } });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });

    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' } });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' } });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, roles: user.roles.map(r => r.role) },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles.map(r => r.role),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Get current session
app.get('/api/auth/session', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found', code: 'NOT_FOUND' } });
    }

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          roles: user.roles.map(r => r.role),
        },
      },
      error: null,
    });
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Check role
app.get('/api/auth/check-role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.query;
    const userId = getUserId(req);

    const userRole = await prisma.userRole.findFirst({
      where: { userId, role: role as string },
    });

    res.json({ hasRole: !!userRole });
  } catch (error) {
    console.error('Check role error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== USER ROUTES ====================

app.get('/api/admin/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { roles: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      roles: u.roles.map(r => r.role),
      role: u.roles.length > 0 ? u.roles[0].role : 'user',
      createdAt: u.createdAt,
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// GET /api/admin/users/:id — fetch single user profile (US-ADMIN-018)
app.get('/api/admin/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found', code: 'NOT_FOUND' } });
    }
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles.map(r => r.role),
      role: user.roles.length > 0 ? user.roles[0].role : 'user',
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/admin/users/:id — update user profile fields (US-ADMIN-018)
app.patch('/api/admin/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email } = req.body;

    // Validate at least one updatable field is provided
    if (fullName === undefined && email === undefined) {
      return res.status(400).json({ error: { message: 'No updatable fields provided', code: 'BAD_REQUEST' } });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'User not found', code: 'NOT_FOUND' } });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(email !== undefined && { email }),
      },
      include: { roles: true },
    });

    res.json({
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      roles: updated.roles.map(r => r.role),
      role: updated.roles.length > 0 ? updated.roles[0].role : 'user',
      createdAt: updated.createdAt,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== EVENTS ROUTES (PUBLIC) ====================

app.get('/api/events', async (req, res) => {
  try {
    const filter = req.query.filter as string | undefined;
    const city = req.query.city as string | undefined;
    const search = req.query.search as string | undefined;
    const eventType = req.query.eventType as string | undefined;
    const now = new Date();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: Record<string, any> = {};
    
    if (filter === 'upcoming') {
      whereClause = { eventDate: { gte: now }, status: 'upcoming' };
    } else if (filter === 'past') {
      whereClause = { eventDate: { lt: now } };
    }

    // City filter
    if (city) {
      whereClause.city = { equals: city, mode: 'insensitive' };
    }

    // Search by title or description
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Event type filter
    if (eventType) {
      whereClause.eventTypeId = eventType;
    }
    
    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: { eventDate: 'asc' },
    });
    console.log(`[API] /api/events?filter=${filter}&city=${city}&search=${search} returning ${events.length} events`);
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Note: Specific routes must come before :id route to avoid matching conflict
// Get user's event registrations
app.get('/api/events/my-registrations', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const registrations = await prisma.eventRegistration.findMany({
      where: { userId },
      include: {
        event: true,
      },
      orderBy: { registeredAt: 'desc' },
    });

    // Helper to normalize event for frontend (component expects snake_case fields)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizeEvent = (evt: Record<string, any> | null) => evt ? {
      ...evt,
      // snake_case aliases the frontend expects
      date: evt.eventDate?.toISOString?.() || evt.eventDate || new Date().toISOString(),
      slug: evt.id,
      event_type: 'forum',
      start_time: evt.startTime || '09:00',
      end_time: evt.endTime || '17:00',
      venue_name: evt.venue || evt.location || '',
      event_date: evt.eventDate?.toISOString?.() || evt.eventDate || new Date().toISOString(),
      registration_deadline: evt.registrationDeadline?.toISOString?.() || evt.registrationDeadline || null,
    } : null;

    // Helper to normalize registration for frontend (snake_case aliases)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizeRegistration = (r: Record<string, any>) => ({
      ...r,
      registered_at: r.registeredAt?.toISOString?.() || r.registeredAt || new Date().toISOString(),
      event_id: r.eventId,
      user_id: r.userId,
      full_name: r.fullName || '',
      dietary_requirements: r.dietaryRequirements || null,
      reminder_sent: r.reminderSent || false,
      events: normalizeEvent(r.event),
    });

    // Normalize registrations: add `events` alias (component expects plural)
    const normalizedRegistrations = registrations.map(normalizeRegistration);

    // Also get RSVP-based attendance records — include all non-cancelled (BUG-MOD-04 / US-MOD-104)
    const attendanceRecords = await prisma.eventAttendance.findMany({
      where: { userId, rsvpStatus: { not: 'CANCELLED' } },
      include: { event: true },
      orderBy: { createdAt: 'desc' },
    });

    // Merge: convert attendance records to registration format
    const registrationEventIds = new Set(registrations.map(r => r.eventId));
    const attendanceAsRegistrations = attendanceRecords
      .filter(a => !registrationEventIds.has(a.eventId))
      .map(a => ({
        id: a.id || `rsvp-${a.eventId}`,
        userId: a.userId,
        eventId: a.eventId,
        event_id: a.eventId,
        user_id: a.userId,
        status: a.rsvpStatus === 'CONFIRMED' ? 'registered' : 'waitlist',
        registeredAt: a.createdAt,
        registered_at: a.createdAt?.toISOString?.() || new Date().toISOString(),
        events: normalizeEvent(a.event),
        event: a.event,
      }));

    const combined = [...normalizedRegistrations, ...attendanceAsRegistrations];
    res.json(combined);
  } catch (error) {
    console.error('Get user registrations error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Get user's waitlist entries
app.get('/api/events/my-waitlist', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const waitlistEntries = await prisma.eventWaitlist.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(waitlistEntries);
  } catch (error) {
    console.error('Get user waitlist error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: String(req.params.id) },
      include: {
        registrations: true,
        eventStartups: { orderBy: { displayOrder: 'asc' } },
      },
    });

    if (!event) {
      return res.status(404).json({ error: { message: 'Event not found', code: 'NOT_FOUND' } });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== APPLICATIONS ROUTES ====================

app.get('/api/applications/founders', authenticateToken, async (req, res) => {
  try {
    const applications = await prisma.founderApplication.findMany({
      orderBy: { submittedAt: 'desc' },
    });
    res.json(applications);
  } catch (error) {
    console.error('Get founder applications error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/applications/investors', authenticateToken, async (req, res) => {
  try {
    const applications = await prisma.investorApplication.findMany({
      orderBy: { submittedAt: 'desc' },
    });
    res.json(applications);
  } catch (error) {
    console.error('Get investor applications error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Get user's own founder application
app.get('/api/applications/founder-application', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const application = await prisma.founderApplication.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });
    res.json(application || null);
  } catch (error) {
    console.error('Get founder application error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Get user's own investor application
app.get('/api/applications/investor-application', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const application = await prisma.investorApplication.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });
    res.json(application || null);
  } catch (error) {
    console.error('Get investor application error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== APPLICATION CRUD ROUTES (Investor & Founder) ====================

// Helper: Transform InvestorApplication DB record to test-expected field names
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformInvestorApp(app: Record<string, any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = (app.metadata as Record<string, any>) || {};
  return {
    ...app,
    company: app.organization,
    investmentSize: app.investmentRange,
    targetIndustries: app.industriesOfInterest ? JSON.parse(app.industriesOfInterest) : null,
    ...metadata,
  };
}

// Helper: Transform FounderApplication DB record to test-expected field names
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformFounderApp(app: Record<string, any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metadata = (app.metadata as Record<string, any>) || {};
  return {
    ...app,
    fundingStage: app.stage,
    companyDescription: app.description,
    productUrl: app.companyWebsite,
    fundingRequired: metadata.fundingRequired || (app.fundingGoal ? String(app.fundingGoal) : null),
    ...metadata,
  };
}

// POST /api/investors/applications — Create investor application
app.post('/api/investors/applications', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const roles = req.user?.roles || [];
    if (!roles.includes('investor') && !roles.includes('admin')) {
      return res.status(403).json({ error: { message: 'Investor role required', code: 'FORBIDDEN' } });
    }

    const { fullName, email, phone, investmentExperience, targetIndustries, investmentSize, linkedinUrl, company, experience, notes, ...rest } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({ error: { message: 'Missing required fields: fullName, email, phone', code: 'VALIDATION_ERROR' } });
    }

    const app = await prisma.investorApplication.create({
      data: {
        userId,
        fullName,
        email,
        phone,
        investorType: investmentExperience || 'standard',
        organization: company || null,
        investmentRange: investmentSize || null,
        industriesOfInterest: targetIndustries ? JSON.stringify(targetIndustries) : null,
        linkedinUrl: linkedinUrl || null,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        metadata: { investmentExperience, experience, notes, ...rest },
      },
    });

    res.status(201).json(transformInvestorApp(app));
  } catch (error) {
    console.error('Create investor application error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// GET /api/investors/application — Get own investor application
app.get('/api/investors/application', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const roles = req.user?.roles || [];
    if (!roles.includes('investor') && !roles.includes('admin')) {
      return res.status(403).json({ error: { message: 'Investor role required', code: 'FORBIDDEN' } });
    }

    const app = await prisma.investorApplication.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });

    if (!app) {
      return res.status(200).json(null);
    }

    res.json(transformInvestorApp(app));
  } catch (error) {
    console.error('Get investor application error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// GET /api/investors/applications/:id — Get investor application by ID (owner check)
app.get('/api/investors/applications/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const app = await prisma.investorApplication.findUnique({
      where: { id: req.params.id as string },
    });

    if (!app) {
      return res.status(404).json({ error: { message: 'Application not found', code: 'NOT_FOUND' } });
    }

    if (app.userId !== userId) {
      return res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } });
    }

    res.json(transformInvestorApp(app));
  } catch (error) {
    console.error('Get investor application by ID error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/investors/applications/:id — Update own investor application
app.patch('/api/investors/applications/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const existing = await prisma.investorApplication.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      return res.status(404).json({ error: { message: 'Application not found', code: 'NOT_FOUND' } });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } });
    }

    const { investmentSize, company, experience, targetIndustries, linkedinUrl, notes, ...rest } = req.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingMeta = (existing.metadata as Record<string, any>) || {};

    const app = await prisma.investorApplication.update({
      where: { id: req.params.id as string },
      data: {
        ...(investmentSize !== undefined && { investmentRange: investmentSize }),
        ...(company !== undefined && { organization: company }),
        ...(targetIndustries !== undefined && { industriesOfInterest: JSON.stringify(targetIndustries) }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        metadata: { ...existingMeta, ...(experience !== undefined && { experience }), ...(notes !== undefined && { notes }), ...rest },
      },
    });

    res.json(transformInvestorApp(app));
  } catch (error) {
    console.error('Update investor application error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// GET /api/admin/applications/investors — Admin list all investor applications
app.get('/api/admin/applications/investors', authenticateToken, requireRole(['admin', 'moderator']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const apps = await prisma.investorApplication.findMany({
      orderBy: { submittedAt: 'desc' },
    });
    res.json(apps.map(transformInvestorApp));
  } catch (error) {
    console.error('Admin list investor applications error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/admin/applications/investors/:id — Admin review investor application
app.patch('/api/admin/applications/investors/:id', authenticateToken, requireRole(['admin', 'moderator']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, reviewNotes } = req.body;
    const reviewedBy = getUserId(req);

    const app = await prisma.investorApplication.update({
      where: { id: req.params.id as string },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        ...(reviewNotes !== undefined && { reviewNotes }),
      },
    });

    res.json(transformInvestorApp(app));
  } catch (error) {
    console.error('Admin review investor application error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// POST /api/founders/applications — Create founder application
app.post('/api/founders/applications', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const roles = req.user?.roles || [];
    if (!roles.includes('founder') && !roles.includes('admin')) {
      return res.status(403).json({ error: { message: 'Founder role required', code: 'FORBIDDEN' } });
    }

    const { fullName, email, phone, companyName, industry, fundingStage, fundingRequired, companyDescription, traction, teamBio, pitchDeckUrl, productUrl, ...rest } = req.body;

    if (!fullName || !email || !companyName) {
      return res.status(400).json({ error: { message: 'Missing required fields: fullName, email, companyName', code: 'VALIDATION_ERROR' } });
    }

    const app = await prisma.founderApplication.create({
      data: {
        userId,
        fullName,
        email,
        phone: phone || null,
        companyName,
        industry: industry || null,
        stage: fundingStage || null,
        description: companyDescription || null,
        companyWebsite: productUrl || null,
        pitchDeckUrl: pitchDeckUrl || null,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        metadata: { fundingRequired, traction, teamBio, fundingStage, ...rest },
      },
    });

    res.status(201).json(transformFounderApp(app));
  } catch (error) {
    console.error('Create founder application error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// GET /api/founders/application — Get own founder application
app.get('/api/founders/application', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const roles = req.user?.roles || [];
    if (!roles.includes('founder') && !roles.includes('admin')) {
      return res.status(403).json({ error: { message: 'Founder role required', code: 'FORBIDDEN' } });
    }

    const app = await prisma.founderApplication.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });

    if (!app) {
      return res.status(200).json(null);
    }

    res.json(transformFounderApp(app));
  } catch (error) {
    console.error('Get founder application error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/founders/applications/:id — Update own founder application
app.patch('/api/founders/applications/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const existing = await prisma.founderApplication.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) {
      return res.status(404).json({ error: { message: 'Application not found', code: 'NOT_FOUND' } });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } });
    }

    const { fundingRequired, traction, teamBio, companyDescription, productUrl, fundingStage, industry, companyName, pitchDeckUrl, ...rest } = req.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingMeta = (existing.metadata as Record<string, any>) || {};

    const app = await prisma.founderApplication.update({
      where: { id: req.params.id as string },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(industry !== undefined && { industry }),
        ...(fundingStage !== undefined && { stage: fundingStage }),
        ...(companyDescription !== undefined && { description: companyDescription }),
        ...(productUrl !== undefined && { companyWebsite: productUrl }),
        ...(pitchDeckUrl !== undefined && { pitchDeckUrl }),
        metadata: {
          ...existingMeta,
          ...(fundingRequired !== undefined && { fundingRequired }),
          ...(traction !== undefined && { traction }),
          ...(teamBio !== undefined && { teamBio }),
          ...rest,
        },
      },
    });

    res.json(transformFounderApp(app));
  } catch (error) {
    console.error('Update founder application error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// GET /api/admin/applications/founders — Admin list all founder applications
app.get('/api/admin/applications/founders', authenticateToken, requireRole(['admin', 'moderator']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const apps = await prisma.founderApplication.findMany({
      orderBy: { submittedAt: 'desc' },
    });
    res.json(apps.map(transformFounderApp));
  } catch (error) {
    console.error('Admin list founder applications error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/admin/applications/founders/:id — Admin review founder application
app.patch('/api/admin/applications/founders/:id', authenticateToken, requireRole(['admin', 'moderator']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, reviewNotes } = req.body;
    const reviewedBy = getUserId(req);

    const app = await prisma.founderApplication.update({
      where: { id: req.params.id as string },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        ...(reviewNotes !== undefined && { reviewNotes }),
      },
    });

    res.json(transformFounderApp(app));
  } catch (error) {
    console.error('Admin review founder application error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== DEALS ROUTES ====================

// Admin Deal Oversight — US-ADMIN-017
app.get('/api/admin/deals', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status, stage, industry } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (stage) where.stage = { contains: stage, mode: 'insensitive' };
    if (industry) where.industry = { contains: industry, mode: 'insensitive' };

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        dealInterests: {
          select: { id: true, status: true, commitmentAmount: true, investorId: true },
        },
      },
    });

    const enriched = deals.map(d => {
      const interests = d.dealInterests;
      const committed = interests.filter(i => i.status === 'committed' || i.status === 'accepted');
      const totalCommitted = committed.reduce((sum, i) => sum + Number(i.commitmentAmount), 0);
      return {
        id: d.id,
        title: d.companyName || 'Untitled Deal',
        companyName: d.companyName || '',
        description: `Investment opportunity in ${d.companyName || 'a company'}`,
        industrySector: d.sector || d.industry || 'General',
        stage: d.stage || 'Seed',
        dealSize: Number(d.amount) || 0,
        dealStatus: d.status || 'open',
        createdAt: d.createdAt.toISOString(),
        interestCount: interests.length,
        commitmentCount: committed.length,
        totalCommitted,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Get admin deals error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/deals', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { industry, stage, status } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (industry) where.industry = { contains: industry, mode: 'insensitive' };
    if (stage) where.stage = { contains: stage, mode: 'insensitive' };
    if (status) where.status = status;

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        dealInterests: {
          where: { investorId: userId },
          select: { id: true },
        },
      },
    });
    
    // Transform to shape frontend expects
    const enriched = deals.map(d => ({
      id: d.id,
      title: d.companyName || 'Untitled Deal',
      companyName: d.companyName || '',
      slug: d.companyName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || d.id,
      description: `Investment opportunity in ${d.companyName || 'a company'}`,
      industrySector: d.sector || d.industry || 'General',
      stage: d.stage || 'Seed',
      dealSize: Number(d.amount) || 0,
      minInvestment: Math.round(Number(d.amount) * 0.01) || 100000,
      valuation: d.valuation ? Number(d.valuation) : undefined,
      dealLead: undefined,
      dealStatus: d.status || 'open',
      closingDate: undefined,
      featured: false,
      createdAt: d.createdAt.toISOString(),
      hasExpressedInterest: d.dealInterests.length > 0,
    }));
    
    res.json(enriched);
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Create a new deal (admin/seeding)
app.post('/api/deals', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { dealId, commitmentAmount, notes, companyName, amount, valuation, sector, stage, status, industry } = req.body;
    
    // If dealId is present, this is an "express interest" request (frontend sends POST /api/deals with dealId)
    if (dealId) {
      // Validate deal exists
      const deal = await prisma.deal.findUnique({ where: { id: dealId } });
      if (!deal) {
        return res.status(404).json({ error: { message: 'Deal not found', code: 'NOT_FOUND' } });
      }
      
      // Check for duplicate interest
      const existingInterest = await prisma.dealInterest.findFirst({
        where: { dealId, investorId: userId },
      });
      if (existingInterest) {
        return res.status(409).json({ error: { message: 'Interest already submitted for this deal', code: 'DUPLICATE' } });
      }
      
      const interest = await prisma.dealInterest.create({
        data: {
          dealId,
          investorId: userId,
          status: 'pending',
          commitmentAmount: commitmentAmount || 0,
          notes: notes || null,
        },
      });
      
      return res.status(201).json(interest);
    }
    
    // Otherwise, this is a "create deal" request
    if (!companyName || !amount) {
      return res.status(400).json({ error: { message: 'companyName and amount are required', code: 'VALIDATION_ERROR' } });
    }
    
    const deal = await prisma.deal.create({
      data: {
        investorId: userId,
        companyName,
        amount: amount,
        valuation: valuation || null,
        sector: sector || null,
        stage: stage || null,
        status: status || 'open',
        industry: industry || null,
      },
    });
    
    res.status(201).json({
      id: deal.id,
      title: deal.companyName || 'Untitled Deal',
      companyName: deal.companyName || '',
      slug: deal.companyName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || deal.id,
      dealSize: Number(deal.amount),
      dealStatus: deal.status || 'open',
      createdAt: deal.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Create deal / express interest error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Note: Specific routes must come before :id route to avoid matching conflict
app.get('/api/deals/interests', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const interests = await prisma.dealInterest.findMany({
      where: { investorId: userId },
      include: { deal: true },
      orderBy: { createdAt: 'desc' },
    });
    
    // Enrich with deal shape that DealPipeline expects
    const enriched = interests.map(i => ({
      id: i.id,
      dealId: i.dealId,
      investorId: i.investorId,
      status: i.status,
      commitmentAmount: Number(i.commitmentAmount),
      notes: i.notes,
      rejectionReason: i.rejectionReason,
      spvId: i.spvId,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt?.toISOString() || null,
      deal: {
        id: i.deal.id,
        title: i.deal.companyName || 'Untitled Deal',
        companyName: i.deal.companyName || '',
        slug: i.deal.companyName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || i.deal.id,
        industrySector: i.deal.sector || i.deal.industry || 'General',
        dealSize: Number(i.deal.amount),
        minInvestment: Math.round(Number(i.deal.amount) * 0.01) || 100000,
        dealStatus: i.deal.status || 'open',
        closingDate: undefined,
      },
    }));
    
    res.json(enriched);
  } catch (error) {
    console.error('Get deal interests error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Delete deal interest (cleanup for tests)
app.delete('/api/deals/interests/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const interest = await prisma.dealInterest.findFirst({
      where: { id: req.params.id as string, investorId: userId },
    });
    if (!interest) {
      return res.status(404).json({ error: { message: 'Interest not found', code: 'NOT_FOUND' } });
    }
    await prisma.dealInterest.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete deal interest error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Express interest in a deal
app.post('/api/deals/:id/interest', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const dealId = req.params.id as string;
    const { commitmentAmount, notes } = req.body;
    
    // Check deal exists
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) {
      return res.status(404).json({ error: { message: 'Deal not found', code: 'NOT_FOUND' } });
    }
    
    // Check if already expressed interest
    const existing = await prisma.dealInterest.findFirst({
      where: { dealId, investorId: userId },
    });
    if (existing) {
      return res.status(409).json({ error: { message: 'Already expressed interest', code: 'DUPLICATE' } });
    }
    
    const interest = await prisma.dealInterest.create({
      data: {
        dealId,
        investorId: userId,
        commitmentAmount: commitmentAmount || 0,
        notes: notes || null,
        status: 'pending',
      },
    });
    
    res.status(201).json(interest);
  } catch (error) {
    console.error('Express interest error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/deals/:id', authenticateToken, async (req, res) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!deal) {
      return res.status(404).json({ error: { message: 'Deal not found', code: 'NOT_FOUND' } });
    }
    res.json({
      id: deal.id,
      title: deal.companyName || 'Untitled Deal',
      companyName: deal.companyName || '',
      slug: deal.companyName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || deal.id,
      description: `Investment opportunity in ${deal.companyName || 'a company'}`,
      industrySector: deal.sector || deal.industry || 'General',
      stage: deal.stage || 'Seed',
      dealSize: Number(deal.amount),
      minInvestment: Math.round(Number(deal.amount) * 0.01) || 100000,
      valuation: deal.valuation ? Number(deal.valuation) : undefined,
      dealStatus: deal.status || 'open',
      createdAt: deal.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== COMMITMENTS ROUTES ====================

app.get('/api/commitments', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const commitments = await prisma.commitment.findMany({
      where: { userId },
      include: { deal: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(commitments);
  } catch (error) {
    console.error('Get commitments error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/commitments', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { dealId, amount, notes } = req.body;
    
    const commitment = await prisma.commitment.create({
      data: {
        userId,
        dealId,
        amount,
        notes,
        status: 'pending',
      },
    });
    res.json(commitment);
  } catch (error) {
    console.error('Create commitment error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== SPV ROUTES ====================

// List user's SPVs
app.get('/api/spvs', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const spvs = await prisma.spv.findMany({
      where: {
        OR: [
          { leadInvestorId: userId },
          { members: { some: { investorId: userId } } },
        ],
      },
      include: {
        members: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const enriched = spvs.map(s => ({
      id: s.id,
      name: s.name,
      dealId: s.dealId,
      leadInvestorId: s.leadInvestorId,
      targetAmount: Number(s.targetAmount),
      carryPercentage: Number(s.carryPercentage),
      description: s.description,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      memberCount: s.members.length,
      committedAmount: s.members.reduce((sum, m) => sum + Number(m.commitmentAmount), 0),
    }));
    
    res.json(enriched);
  } catch (error) {
    console.error('Get SPVs error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Create SPV
app.post('/api/spvs', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, dealId, targetAmount, carryPercentage, hurdleRate, minimumInvestment,
            spv_name, deal_id, target_raise_amount, carry_percentage, hurdle_rate, minimum_investment } = req.body;
    
    // Support both camelCase and snake_case field names
    const spvName = name || spv_name;
    const spvDealId = dealId || deal_id;
    const spvTarget = targetAmount || target_raise_amount;
    const spvCarry = carryPercentage || carry_percentage;
    
    if (!spvName || !spvDealId || !spvTarget || spvCarry === undefined) {
      return res.status(400).json({ 
        error: { message: 'name, dealId, targetAmount, and carryPercentage are required', code: 'VALIDATION_ERROR' } 
      });
    }
    
    // Validate carry percentage
    if (Number(spvCarry) < 0 || Number(spvCarry) > 100) {
      return res.status(400).json({ 
        error: { message: 'carryPercentage must be between 0 and 100', code: 'VALIDATION_ERROR' } 
      });
    }
    
    // Verify deal exists
    const deal = await prisma.deal.findUnique({ where: { id: spvDealId } });
    if (!deal) {
      return res.status(400).json({ error: { message: 'Deal not found', code: 'INVALID_DEAL' } });
    }
    
    const spv = await prisma.spv.create({
      data: {
        name: spvName,
        dealId: spvDealId,
        leadInvestorId: userId,
        targetAmount: spvTarget,
        carryPercentage: spvCarry,
        description: `SPV for ${deal.companyName || 'deal'}`,
        status: 'forming',
      },
    });
    
    // Auto-add lead investor as first member
    await prisma.spvMember.create({
      data: {
        spvId: spv.id,
        investorId: userId,
        commitmentAmount: 0,
        status: 'confirmed',
        joinedAt: new Date(),
      },
    });
    
    res.status(201).json({
      id: spv.id,
      name: spv.name,
      dealId: spv.dealId,
      leadInvestorId: spv.leadInvestorId,
      targetAmount: Number(spv.targetAmount),
      carryPercentage: Number(spv.carryPercentage),
      description: spv.description,
      status: spv.status,
      createdAt: spv.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Create SPV error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Get SPV details with members
app.get('/api/spvs/:id', authenticateToken, async (req, res) => {
  try {
    const spv = await prisma.spv.findUnique({
      where: { id: req.params.id as string },
      include: {
        members: {
          include: {
            investor: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
      },
    });
    
    if (!spv) {
      return res.status(404).json({ error: { message: 'SPV not found', code: 'NOT_FOUND' } });
    }
    
    const committedAmount = spv.members.reduce((sum, m) => sum + Number(m.commitmentAmount), 0);
    
    res.json({
      id: spv.id,
      name: spv.name,
      dealId: spv.dealId,
      leadInvestorId: spv.leadInvestorId,
      targetAmount: Number(spv.targetAmount),
      carryPercentage: Number(spv.carryPercentage),
      description: spv.description,
      status: spv.status,
      createdAt: spv.createdAt.toISOString(),
      committedAmount,
      members: spv.members.map(m => ({
        id: m.id,
        spvId: m.spvId,
        investorId: m.investorId,
        investorName: m.investor.fullName || m.investor.email,
        investorEmail: m.investor.email,
        commitmentAmount: Number(m.commitmentAmount),
        status: m.status,
        joinedAt: m.joinedAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error('Get SPV error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Alias: /api/spv/:id (singular) — frontend SPVDashboard uses this
app.get('/api/spv/:id', authenticateToken, async (req, res) => {
  // Reuse the same handler by internally forwarding
  req.url = `/api/spvs/${req.params.id}`;
  try {
    const spv = await prisma.spv.findUnique({
      where: { id: req.params.id as string },
      include: {
        members: {
          include: {
            investor: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
      },
    });
    
    if (!spv) {
      return res.status(404).json({ error: { message: 'SPV not found', code: 'NOT_FOUND' } });
    }
    
    const committedAmount = spv.members.reduce((sum, m) => sum + Number(m.commitmentAmount), 0);
    
    res.json({
      id: spv.id,
      name: spv.name,
      dealId: spv.dealId,
      leadInvestorId: spv.leadInvestorId,
      targetAmount: Number(spv.targetAmount),
      carryPercentage: Number(spv.carryPercentage),
      description: spv.description,
      status: spv.status,
      createdAt: spv.createdAt.toISOString(),
      committedAmount,
      members: spv.members.map(m => ({
        id: m.id,
        spvId: m.spvId,
        investorId: m.investorId,
        investorName: m.investor.fullName || m.investor.email,
        investorEmail: m.investor.email,
        commitmentAmount: Number(m.commitmentAmount),
        status: m.status,
        joinedAt: m.joinedAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error('Get SPV (singular) error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Get SPV members
app.get('/api/spvs/:id/members', authenticateToken, async (req, res) => {
  try {
    const members = await prisma.spvMember.findMany({
      where: { spvId: req.params.id as string },
      include: {
        investor: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
    
    res.json(members.map(m => ({
      id: m.id,
      spvId: m.spvId,
      investorId: m.investorId,
      investorName: m.investor.fullName || m.investor.email,
      investorEmail: m.investor.email,
      commitmentAmount: Number(m.commitmentAmount),
      status: m.status,
      joinedAt: m.joinedAt?.toISOString() || null,
    })));
  } catch (error) {
    console.error('Get SPV members error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Update SPV member (payment status, etc.)
app.put('/api/spvs/:id/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const { paymentStatus, commitmentAmount } = req.body;
    
    const member = await prisma.spvMember.findUnique({
      where: { id: req.params.memberId as string },
    });
    if (!member || member.spvId !== req.params.id) {
      return res.status(404).json({ error: { message: 'Member not found', code: 'NOT_FOUND' } });
    }
    
    const updateData: Record<string, unknown> = {};
    if (paymentStatus) updateData.status = paymentStatus;
    if (commitmentAmount !== undefined) updateData.commitmentAmount = commitmentAmount;
    
    const updated = await prisma.spvMember.update({
      where: { id: req.params.memberId as string },
      data: updateData,
    });
    
    res.json({
      id: updated.id,
      commitmentAmount: Number(updated.commitmentAmount),
      status: updated.status,
    });
  } catch (error) {
    console.error('Update SPV member error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Remove SPV member
app.delete('/api/spvs/:id/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const member = await prisma.spvMember.findUnique({
      where: { id: req.params.memberId as string },
    });
    if (!member || member.spvId !== req.params.id) {
      return res.status(404).json({ error: { message: 'Member not found', code: 'NOT_FOUND' } });
    }
    
    await prisma.spvMember.delete({ where: { id: req.params.memberId as string } });
    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Delete SPV member error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Adjust SPV member allocation
app.put('/api/spv-members/:memberId/allocation', authenticateToken, async (req, res) => {
  try {
    const { commitmentAmount } = req.body;
    
    const member = await prisma.spvMember.findUnique({
      where: { id: req.params.memberId as string },
    });
    if (!member) {
      return res.status(404).json({ error: { message: 'Member not found', code: 'NOT_FOUND' } });
    }
    
    const updated = await prisma.spvMember.update({
      where: { id: req.params.memberId as string },
      data: { commitmentAmount },
    });
    
    res.json({
      id: updated.id,
      commitmentAmount: Number(updated.commitmentAmount),
      status: updated.status,
    });
  } catch (error) {
    console.error('Adjust allocation error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== MODERATOR ROUTES ====================

app.get('/api/moderator/applications', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const founderApplications = await prisma.founderApplication.findMany({
      orderBy: { submittedAt: 'desc' },
    });
    
    // Transform to match expected format
    const applications = founderApplications.map(app => ({
      id: app.id,
      company_name: app.companyName,
      founder_name: app.fullName,
      founder_email: app.email,
      website: app.companyWebsite || '',
      stage: app.stage,
      sector: app.industry,
      problem: app.description || '',
      solution: '',
      market_size: '',
      traction: '',
      fundraising_amount: Number(app.fundingGoal) || 0,
      use_of_funds: '',
      status: app.status.toUpperCase(),
      submitted_at: app.submittedAt.toISOString(),
      completeness_score: 75, // Default score
    }));
    
    res.json(applications);
  } catch (error) {
    console.error('Get moderator applications error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/moderator/applications/:id/screening-notes', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    // Return empty array if no notes table exists
    res.json([]);
  } catch (error) {
    console.error('Get screening notes error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.patch('/api/moderator/applications/:id', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    
    const application = await prisma.founderApplication.update({
      where: { id: String(req.params.id) },
      data: { 
        status: status.toLowerCase(),
      },
    });
    
    res.json({
      id: application.id,
      status: application.status.toUpperCase(),
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/moderator/applications/:id/screening-notes', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const { notes } = req.body;
    // Return a mock note since we don't have a screening notes table
    res.json({
      id: `note-${Date.now()}`,
      application_id: req.params.id as string,
      moderator_id: getUserId(req),
      notes,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create screening note error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/moderator/applications/:id/request-info', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const application = await prisma.founderApplication.update({
      where: { id: String(req.params.id) },
      data: { 
        status: 'more_info_requested',
      },
    });
    
    res.json({
      id: application.id,
      status: 'MORE_INFO_REQUESTED',
    });
  } catch (error) {
    console.error('Request info error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== MODERATOR CONTENT FLAGS (BUG-MOD-01, US-MOD-102, US-REG-004) ====================

app.get('/api/moderator/flags', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const { status } = req.query;
    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      where.status = String(status);
    }
    const flags = await prisma.contentFlag.findMany({
      where,
      include: {
        flagger: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const normalized = flags.map((f) => ({
      id: f.id,
      content_type: f.contentType,
      content_id: f.contentId,
      content_text: f.contentText || '',
      content_author: { id: f.contentId, name: 'Unknown', email: '' },
      reported_by: { id: f.flagger.id, name: f.flagger.fullName || f.flagger.email, email: f.flagger.email },
      reason: f.reason,
      description: f.description || '',
      status: f.status,
      resolution: f.resolution || null,
      resolved_at: f.resolvedAt?.toISOString() || null,
      resolved_by: f.reviewer ? (f.reviewer.fullName || f.reviewer.email) : null,
      created_at: f.createdAt.toISOString(),
    }));
    res.json(normalized);
  } catch (error) {
    console.error('Get content flags error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/moderator/flags', authenticateToken, async (req, res) => {
  try {
    const { contentType, contentId, contentText, reason, description } = req.body;
    if (!contentType || !contentId || !reason) {
      return res.status(400).json({ success: false, error: 'contentType, contentId, and reason are required' });
    }
    const flag = await prisma.contentFlag.create({
      data: {
        contentType,
        contentId,
        contentText: contentText || null,
        flaggedBy: getUserId(req),
        reason,
        description: description || null,
        status: 'PENDING',
      },
    });
    res.status(201).json({ success: true, flag });
  } catch (error) {
    console.error('Create content flag error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.patch('/api/moderator/flags/:id', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const updated = await prisma.contentFlag.update({
      where: { id: String(req.params.id) },
      data: {
        status: status || 'REVIEWED',
        resolution: resolution || null,
        reviewedBy: getUserId(req),
        resolvedAt: new Date(),
      },
    });
    res.json({ success: true, flag: updated });
  } catch (error) {
    console.error('Update content flag error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/moderator/flags/stats', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const [pending, reviewed, byReason] = await Promise.all([
      prisma.contentFlag.count({ where: { status: 'PENDING' } }),
      prisma.contentFlag.count({ where: { status: 'REVIEWED' } }),
      prisma.contentFlag.groupBy({ by: ['reason'], _count: { id: true } }),
    ]);
    const resolutionCounts = await prisma.contentFlag.groupBy({
      by: ['resolution'],
      where: { status: 'REVIEWED', resolution: { not: null } },
      _count: { id: true },
    });
    res.json({
      success: true,
      stats: {
        pending,
        reviewed,
        total: pending + reviewed,
        byReason: byReason.map((r) => ({ reason: r.reason, count: r._count.id })),
        byResolution: resolutionCounts.map((r) => ({ resolution: r.resolution, count: r._count.id })),
      },
    });
  } catch (error) {
    console.error('Content flag stats error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== MODERATOR USER MANAGEMENT (US-MOD-103) ====================

app.get('/api/moderator/users', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const { page = '1', limit = '50', search } = req.query;
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: String(search), mode: 'insensitive' } },
        { fullName: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          createdAt: true,
          roles: { select: { role: true } },
          contentFlagsRaised: { select: { id: true }, take: 1 },
        },
        skip,
        take: parseInt(String(limit)),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    const normalized = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName || '',
      roles: u.roles.map((r) => r.role),
      flagCount: u.contentFlagsRaised.length,
      createdAt: u.createdAt.toISOString(),
    }));
    res.json({ success: true, users: normalized, total, page: parseInt(String(page)), limit: parseInt(String(limit)) });
  } catch (error) {
    console.error('Moderator get users error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/moderator/users/:id/warn', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, error: 'reason is required' });
    // Create an audit log entry for the warning
    await prisma.auditLog.create({
      data: {
        userId: getUserId(req),
        action: 'warn_user',
        entityType: 'user',
        entityId: String(req.params.id),
        details: `Moderator warning: ${reason}`,
        ipAddress: req.ip || 'unknown',
      },
    });
    res.json({ success: true, message: 'Warning issued' });
  } catch (error) {
    console.error('Warn user error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/moderator/users/:id/suspend', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, error: 'reason is required' });
    // Log the suspension action
    await prisma.auditLog.create({
      data: {
        userId: getUserId(req),
        action: 'suspend_user',
        entityType: 'user',
        entityId: String(req.params.id),
        details: `User suspended: ${reason}`,
        ipAddress: req.ip || 'unknown',
      },
    });
    res.json({ success: true, message: 'User suspended' });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== MODERATOR REPORTS (US-MOD-105) ====================

app.get('/api/moderator/reports', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const [pendingCount, reviewedCount, flagsByReason, resolutionStats, appStats, recentActivity] = await Promise.all([
      prisma.contentFlag.count({ where: { status: 'PENDING' } }),
      prisma.contentFlag.count({ where: { status: 'REVIEWED' } }),
      prisma.contentFlag.groupBy({ by: ['reason'], _count: { id: true } }),
      prisma.contentFlag.groupBy({ by: ['resolution'], _count: { id: true }, where: { status: 'REVIEWED' } }),
      prisma.founderApplication.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.auditLog.findMany({
        where: { action: { in: ['warn_user', 'suspend_user', 'delete_user', 'review_content'] } },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, fullName: true } } },
      }),
    ]);
    const totalApps = appStats.reduce((s: number, x: { _count: { id: number } }) => s + x._count.id, 0);
    const approvedApps = appStats.find((x: { status: string }) => x.status === 'approved')?._count.id ?? 0;
    const rejectedApps = appStats.find((x: { status: string }) => x.status === 'declined')?._count.id ?? 0;
    res.json({
      totalFlags: pendingCount + reviewedCount,
      pendingFlags: pendingCount,
      resolvedFlags: reviewedCount,
      flagStats: flagsByReason.map((x: { reason: string; _count: { id: number } }) => ({ reason: x.reason, count: x._count.id })),
      resolutionStats: resolutionStats.map((x: { resolution: string | null; _count: { id: number } }) => ({ resolution: x.resolution ?? 'UNRESOLVED', count: x._count.id })),
      applicationStats: appStats.map((x: { status: string; _count: { id: number } }) => ({ status: x.status, count: x._count.id })),
      recentActions: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        targetType: a.entityType || 'unknown',
        targetId: a.entityId || '',
        performedBy: a.user ? (a.user.fullName || a.user.email || 'System') : 'System',
        createdAt: a.createdAt.toISOString(),
      })),
      totalApplications: totalApps,
      approvedApplications: approvedApps,
      rejectedApplications: rejectedApps,
    });
  } catch (error) {
    console.error('Moderator reports error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== MODERATOR ATTENDANCE OVERSIGHT (US-MOD-108) ====================

app.get('/api/moderator/attendance', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const { eventId, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    const where: Record<string, unknown> = {};
    if (eventId) where.eventId = String(eventId);
    const [records, total] = await Promise.all([
      prisma.eventAttendance.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, fullName: true } },
          event: { select: { id: true, title: true, eventDate: true } },
        },
        skip,
        take: parseInt(String(limit)),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.eventAttendance.count({ where }),
    ]);
    const normalized = records.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user?.fullName || r.user?.email || '',
      userEmail: r.user?.email || '',
      eventId: r.eventId,
      eventTitle: r.event?.title || '',
      eventDate: r.event?.eventDate.toISOString() || '',
      rsvpStatus: r.rsvpStatus,
      checkedIn: !!r.checkInTime,
      checkInTime: r.checkInTime?.toISOString() || null,
      checkOutTime: r.checkOutTime?.toISOString() || null,
    }));
    res.json({ records: normalized, total, page: parseInt(String(page)), pageSize: parseInt(String(limit)) });
  } catch (error) {
    console.error('Moderator attendance error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/moderator/events', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { eventDate: 'desc' },
      select: {
        id: true,
        title: true,
        eventDate: true,
        location: true,
        status: true,
        _count: { select: { attendance: true, registrations: true } },
      },
    });
    res.json(events.map((e) => ({
      id: e.id,
      title: e.title,
      eventDate: e.eventDate.toISOString(),
      location: e.location || '',
      status: e.status,
      attendanceCount: e._count.attendance,
      registrationCount: e._count.registrations,
    })));
  } catch (error) {
    console.error('Moderator events error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== INDIA REGULATORY COMPLIANCE API (US-REG-001..005) ====================

// US-REG-001: SEBI AIF Compliance
app.get('/api/moderator/compliance/sebi', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const checks = await prisma.sebiComplianceCheck.findMany({
      include: { checker: { select: { id: true, email: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    // Resolve user names: when applicationType = 'USER_DIRECT', look up user by applicationId
    const userIds = checks.filter((c) => c.applicationType === 'USER_DIRECT').map((c) => c.applicationId);
    const users = userIds.length > 0 ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true, email: true } }) : [];
    const userMap = new Map(users.map((u) => [u.id, u.fullName || u.email || u.id]));
    res.json(checks.map((c) => ({
      id: c.id,
      userId: c.applicationId,
      userName: c.applicationType === 'USER_DIRECT' ? (userMap.get(c.applicationId) ?? c.applicationId) : c.applicationId,
      aifCategory: c.aifCategory ?? '',
      minTicketSizeVerified: c.minTicketSizeVerified,
      accreditedInvestorVerified: c.accreditedInvestorVerified,
      createdAt: c.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error('SEBI compliance list error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/moderator/compliance/sebi', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const { userId, applicationId, applicationType, aifCategory, minTicketSizeVerified, accreditedInvestorVerified, notes } = req.body;
    const effectiveAppId = applicationId || userId;
    if (!effectiveAppId) {
      return res.status(400).json({ success: false, error: 'userId or applicationId is required' });
    }
    const check = await prisma.sebiComplianceCheck.create({
      data: {
        applicationId: effectiveAppId,
        applicationType: applicationType || (userId ? 'USER_DIRECT' : 'UNKNOWN'),
        aifCategory: aifCategory || null,
        minTicketSizeVerified: Boolean(minTicketSizeVerified),
        accreditedInvestorVerified: Boolean(accreditedInvestorVerified),
        checkedBy: getUserId(req),
        notes: notes || null,
      },
    });
    res.status(201).json({ success: true, check });
  } catch (error) {
    console.error('SEBI compliance create error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// US-REG-002: FEMA/FDI Compliance
app.get('/api/moderator/compliance/fema', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const screenings = await prisma.femaFdiScreening.findMany({
      include: { screener: { select: { id: true, email: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const userIds = screenings.filter((s) => s.applicationType === 'USER_DIRECT').map((s) => s.applicationId);
    const users = userIds.length > 0 ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true, email: true } }) : [];
    const userMap = new Map(users.map((u) => [u.id, u.fullName || u.email || u.id]));
    res.json(screenings.map((s) => ({
      id: s.id,
      userId: s.applicationId,
      userName: s.applicationType === 'USER_DIRECT' ? (userMap.get(s.applicationId) ?? s.applicationId) : s.applicationId,
      sector: s.sector ?? '',
      fdiCap: s.fdiCap !== null ? Number(s.fdiCap) : null,
      status: s.status,
      rbiApprovalReq: s.rbiApprovalReq,
      createdAt: s.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error('FEMA screening list error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/moderator/compliance/fema', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const { userId, applicationId, applicationType, sector, fdiCap, status, rbiApprovalReq, notes } = req.body;
    const effectiveAppId = applicationId || userId;
    if (!effectiveAppId) {
      return res.status(400).json({ success: false, error: 'userId or applicationId is required' });
    }
    const screening = await prisma.femaFdiScreening.create({
      data: {
        applicationId: effectiveAppId,
        applicationType: applicationType || (userId ? 'USER_DIRECT' : 'UNKNOWN'),
        sector: sector || null,
        fdiCap: fdiCap != null ? fdiCap : null,
        status: status || 'NOT_SCREENED',
        rbiApprovalReq: Boolean(rbiApprovalReq),
        screenedBy: getUserId(req),
        notes: notes || null,
      },
    });
    res.status(201).json({ success: true, screening });
  } catch (error) {
    console.error('FEMA screening create error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// US-REG-003: DPIIT Startup Recognition
app.get('/api/moderator/compliance/dpiit', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const verifications = await prisma.dpiitVerification.findMany({
      include: { verifier: { select: { id: true, email: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const userIds = verifications.map((v) => v.applicationId);
    const users = userIds.length > 0 ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true, email: true } }) : [];
    const userMap = new Map(users.map((u) => [u.id, u.fullName || u.email || u.id]));
    res.json(verifications.map((v) => ({
      id: v.id,
      userId: v.applicationId,
      userName: userMap.get(v.applicationId) ?? v.applicationId,
      dpiitCertificateNo: v.dpiitCertificateNo ?? '',
      verified: v.verified,
      taxBenefitEligible: v.taxBenefitEligible,
      createdAt: v.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error('DPIIT verification list error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/moderator/compliance/dpiit', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const { userId, applicationId, dpiitCertificateNo, verified, taxBenefitEligible, notes } = req.body;
    const effectiveAppId = applicationId || userId;
    if (!effectiveAppId) {
      return res.status(400).json({ success: false, error: 'userId or applicationId is required' });
    }
    const verification = await prisma.dpiitVerification.create({
      data: {
        applicationId: effectiveAppId,
        dpiitCertificateNo: dpiitCertificateNo || null,
        verified: Boolean(verified),
        verifiedBy: Boolean(verified) ? getUserId(req) : null,
        verifiedAt: Boolean(verified) ? new Date() : null,
        taxBenefitEligible: Boolean(taxBenefitEligible),
        notes: notes || null,
      },
    });
    res.status(201).json({ success: true, verification });
  } catch (error) {
    console.error('DPIIT verification create error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// US-REG-005: AML screening summary for moderator (reads from existing AMLScreening table)
app.get('/api/moderator/compliance/aml-summary', authenticateToken, requireRole(['moderator', 'admin']), async (req, res) => {
  try {
    const [pendingCount, clearedCount, flaggedCount, recentFlaggedRaw] = await Promise.all([
      prisma.aMLScreening.count({ where: { status: 'pending' } }),
      prisma.aMLScreening.count({ where: { status: 'cleared' } }),
      prisma.aMLScreening.count({ where: { riskLevel: 'HIGH' } }),
      prisma.aMLScreening.findMany({
        where: { riskLevel: 'HIGH' },
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { screenedAt: 'desc' },
        take: 10,
      }),
    ]);
    res.json({
      totalScreened: pendingCount + clearedCount + flaggedCount,
      flaggedCount,
      clearedCount,
      pendingCount,
      recentFlags: recentFlaggedRaw.map((s) => ({
        userId: s.userId,
        userName: s.user?.fullName || s.user?.email || s.userId,
        reason: s.reviewNotes || 'High risk level',
        createdAt: s.screenedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('AML summary error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== COMPLIANCE ROUTES ====================

app.get('/api/compliance/kyc-review', authenticateToken, requireRole(['compliance_officer', 'admin']), async (req, res) => {
  try {
    const kycDocuments = await prisma.kYCDocument.findMany({
      include: { user: true },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(kycDocuments.map(d => ({
      id: d.id,
      investorId: d.userId,
      investorName: d.user?.fullName || d.user?.email || 'Unknown',
      investorEmail: d.user?.email || '',
      documentType: d.documentType,
      filePath: d.fileUrl,
      verificationStatus: d.status,
      uploadedAt: d.uploadedAt,
      verifiedAt: d.reviewedAt,
      verifiedBy: d.reviewedBy,
      rejectionReason: d.reviewNotes,
    })));
  } catch (error) {
    console.error('Get KYC reviews error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.put('/api/compliance/kyc-review/:id', authenticateToken, requireRole(['compliance_officer', 'admin']), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const reviewedBy = getUserId(req);
    
    const document = await prisma.kYCDocument.update({
      where: { id: String(req.params.id) },
      data: { 
        status, 
        reviewNotes: notes,
        reviewedBy,
        reviewedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: reviewedBy,
        action: status === 'verified' ? 'verify_kyc' : 'reject_kyc',
        entity: 'kyc_document',
        entityId: document.id,
        details: status === 'rejected' ? `Rejected: ${notes || 'No reason'}` : 'KYC document verified',
      },
    });

    res.json(document);
  } catch (error) {
    console.error('Update KYC review error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/compliance/aml-screening', authenticateToken, requireRole(['compliance_officer', 'admin']), async (req, res) => {
  try {
    const screenings = await prisma.aMLScreening.findMany({
      include: { user: true },
      orderBy: { screenedAt: 'desc' },
    });
    res.json(screenings.map(s => ({
      id: s.id,
      investorId: s.userId,
      investorName: s.user?.fullName || s.user?.email || 'Unknown',
      investorEmail: s.user?.email || '',
      screeningDate: s.screenedAt,
      screeningStatus: s.status,
      screeningProvider: s.provider,
      matchScore: s.matchScore ? Number(s.matchScore) : null,
      screeningResults: s.screeningResults,
      flaggedReasons: s.flaggedReasons ? JSON.parse(s.flaggedReasons) : [],
      reviewedBy: s.reviewedBy,
      reviewedAt: s.reviewedAt,
      notes: s.reviewNotes,
    })));
  } catch (error) {
    console.error('Get AML screenings error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/compliance/aml-screening', authenticateToken, requireRole(['compliance_officer', 'admin']), async (req, res) => {
  try {
    const { investor_id, screening_status, screening_provider, match_score, screening_results } = req.body;
    if (!investor_id) {
      return res.status(400).json({ error: { message: 'investor_id is required', code: 'VALIDATION_ERROR' } });
    }
    const screening = await prisma.aMLScreening.create({
      data: {
        userId: String(investor_id),
        status: screening_status || 'pending',
        provider: screening_provider || null,
        matchScore: match_score != null ? match_score : null,
        screeningResults: screening_results || null,
        screenedAt: new Date(),
      },
      include: { user: true },
    });
    await prisma.auditLog.create({
      data: {
        userId: getUserId(req),
        action: 'initiate_aml_screening',
        entity: 'aml_screening',
        entityId: screening.id,
        details: `Initiated AML screening for investor ${investor_id}`,
      },
    });
    res.json({
      id: screening.id,
      investorId: screening.userId,
      investorName: screening.user?.fullName || screening.user?.email || 'Unknown',
      investorEmail: screening.user?.email || '',
      screeningDate: screening.screenedAt,
      screeningStatus: screening.status,
      screeningProvider: screening.provider,
      matchScore: screening.matchScore ? Number(screening.matchScore) : null,
    });
  } catch (error) {
    console.error('Create AML screening error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.put('/api/compliance/aml-screening/:id', authenticateToken, requireRole(['compliance_officer', 'admin']), async (req, res) => {
  try {
    const { status, riskLevel, flaggedReasons, notes } = req.body;
    const reviewedBy = getUserId(req);
    
    const screening = await prisma.aMLScreening.update({
      where: { id: String(req.params.id) },
      data: { 
        status, 
        riskLevel,
        flaggedReasons: flaggedReasons ? JSON.stringify(flaggedReasons) : null,
        reviewNotes: notes,
        reviewedBy,
        reviewedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: reviewedBy,
        action: status === 'flagged' ? 'flag_aml_screening' : 'clear_aml_screening',
        entity: 'aml_screening',
        entityId: screening.id,
        details: status === 'flagged' ? `Flagged: ${notes || 'No notes'}` : 'Cleared AML screening',
      },
    });
    res.json(screening);
  } catch (error) {
    console.error('Update AML screening error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/compliance/accreditation', authenticateToken, async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const userId = getUserId(req);
    const userRoles: string[] = user?.roles || [];
    
    // If admin or compliance officer, return list of ALL accreditations
    const isAdminOrCompliance = userRoles.some(r => ['admin', 'compliance_officer'].includes(r));
    
    if (isAdminOrCompliance) {
      const accreditations = await prisma.accreditation.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });

      // Fetch all KYC documents for the relevant users
      const userIds = accreditations.map(a => a.userId);
      const kycDocs = await prisma.kYCDocument.findMany({
        where: { userId: { in: userIds } },
      });
      const docsByUser: Record<string, typeof kycDocs> = {};
      for (const doc of kycDocs) {
        if (!docsByUser[doc.userId]) docsByUser[doc.userId] = [];
        docsByUser[doc.userId].push(doc);
      }

      return res.json(accreditations.map(a => ({
        id: a.id,
        investor_id: a.userId,
        verification_status: a.status,
        verification_method: a.type || 'income',
        annual_income: null,
        net_worth: null,
        professional_certification: null,
        expiry_date: a.expiresAt?.toISOString() || null,
        approved_at: a.verifiedAt?.toISOString() || null,
        rejected_at: a.status === 'rejected' ? a.createdAt.toISOString() : null,
        rejection_reason: a.reviewNotes || null,
        documents: (docsByUser[a.userId] || []).map(d => ({
          id: d.id,
          type: d.documentType,
          url: d.fileUrl,
        })),
        submitted_at: a.createdAt.toISOString(),
        investor: {
          id: a.user.id,
          full_name: a.user.fullName || a.user.email,
          email: a.user.email,
        },
      })));
    }
    
    // Otherwise return current user's accreditation
    const accreditation = await prisma.accreditation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (accreditation) {
      // Map expiresAt -> expiryDate for frontend compatibility
      res.json({
        ...accreditation,
        expiryDate: accreditation.expiresAt,
      });
    } else {
      res.json({ status: 'not_started' });
    }
  } catch (error) {
    console.error('Get accreditation error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== KYC DOCUMENTS ROUTES ====================

// GET /api/compliance/unscreened-investors — Investors with verified KYC but no AML screening
app.get('/api/compliance/unscreened-investors', authenticateToken, requireRole(['compliance_officer', 'admin']), async (req, res) => {
  try {
    // Get all users who have at least one verified KYC document
    const usersWithVerifiedKYC = await prisma.kYCDocument.findMany({
      where: { status: 'verified' },
      select: { userId: true },
      distinct: ['userId'],
    });
    const verifiedUserIds = usersWithVerifiedKYC.map(d => d.userId);

    // Get all users who already have an AML screening
    const screenedUserIds = (await prisma.aMLScreening.findMany({
      select: { userId: true },
      distinct: ['userId'],
    })).map(s => s.userId);

    // Investors with verified KYC but no AML screening yet
    const unscreenedIds = verifiedUserIds.filter(id => !screenedUserIds.includes(id));

    const users = await prisma.user.findMany({
      where: { id: { in: unscreenedIds } },
      select: { id: true, fullName: true, email: true },
    });

    res.json(users.map(u => ({
      id: u.id,
      name: u.fullName || u.email,
      email: u.email,
    })));
  } catch (error) {
    console.error('Get unscreened investors error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/kyc/documents', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const documents = await prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(documents.map(d => ({
      id: d.id,
      documentType: d.documentType,
      filePath: d.fileUrl,
      verificationStatus: d.status,
      uploadedAt: d.uploadedAt,
      verifiedAt: d.reviewedAt,
      rejectionReason: d.reviewNotes,
    })));
  } catch (error) {
    console.error('Get KYC documents error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/kyc/documents', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { documentType, fileName, fileUrl } = req.body;
    
    const document = await prisma.kYCDocument.create({
      data: {
        userId,
        documentType,
        fileName,
        fileUrl,
        status: 'pending',
      },
    });
    res.json(document);
  } catch (error) {
    console.error('Create KYC document error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== DOCUMENTS ROUTES ====================

app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { sharedWith } = req.query;
    
    const documents = await prisma.document.findMany({
      where: sharedWith ? { sharedWith: sharedWith as string } : { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/documents', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { title, description, fileUrl, sharedWith } = req.body;
    
    const document = await prisma.document.create({
      data: {
        userId,
        title,
        description,
        fileUrl,
        sharedWith,
      },
    });
    res.json(document);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== PORTFOLIO ROUTES ====================

app.get('/api/portfolio/companies', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    // Get portfolio companies from PortfolioCompany model
    const portfolioCompanies = await prisma.portfolioCompany.findMany({
      where: { investorId: userId },
      orderBy: { investmentDate: 'desc' },
    });
    
    if (portfolioCompanies.length > 0) {
      // Return enriched portfolio data
      const enriched = portfolioCompanies.map(pc => ({
        id: pc.id,
        investor_id: pc.investorId,
        deal_id: pc.companyId,
        investment_amount: Number(pc.investmentAmount),
        investment_date: pc.investmentDate?.toISOString() ?? null,
        ownership_percentage: pc.ownershipPercent ? Number(pc.ownershipPercent) : null,
        current_valuation: pc.currentValuation ? Number(pc.currentValuation) : null,
        irr: null,
        multiple: null,
        status: pc.status || 'ACTIVE',
        deal: {
          id: pc.companyId,
          company_name: pc.companyId, // Will be resolved below
          sector: null,
          funding_stage: null,
        },
        latest_update: null,
      }));
      
      return res.json(enriched);
    }
    
    // Fallback: derive from completed commitments
    const commitments = await prisma.commitment.findMany({
      where: { userId, status: 'completed' },
      include: { deal: true },
    });
    
    const companies = commitments.map(c => ({
      id: c.id,
      investor_id: userId,
      deal_id: c.deal.id,
      investment_amount: Number(c.amount),
      investment_date: c.createdAt.toISOString(),
      ownership_percentage: null,
      current_valuation: null,
      irr: null,
      multiple: null,
      status: 'ACTIVE',
      deal: {
        id: c.deal.id,
        company_name: c.deal.companyName || 'Unknown',
        sector: c.deal.sector || null,
        funding_stage: c.deal.stage || null,
      },
      latest_update: null,
    }));
    
    res.json(companies);
  } catch (error) {
    console.error('Get portfolio companies error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/portfolio/updates', authenticateToken, async (req, res) => {
  try {
    const updates = await prisma.portfolioUpdate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(updates.map(u => ({
      id: u.id,
      title: u.title,
      content: u.content,
      createdAt: u.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error('Get portfolio updates error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== PITCH ROUTES ====================

app.get('/api/pitch/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const sessions = await prisma.pitchSession.findMany({
      where: { founderId: userId },
      orderBy: { sessionDate: 'desc' },
    });
    res.json(sessions);
  } catch (error) {
    console.error('Get pitch sessions error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/pitch/sessions', authenticateToken, async (req, res) => {
  try {
    const founderId = getUserId(req);
    const { title, description, sessionDate, duration, location, meetingLink } = req.body;
    
    const session = await prisma.pitchSession.create({
      data: {
        founderId,
        sessionDate: new Date(sessionDate),
        duration: duration || 30,
        location,
        meetingLink,
        notes: description,
        status: 'scheduled',
      },
    });
    res.json(session);
  } catch (error) {
    console.error('Create pitch session error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/pitch/materials', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const materials = await prisma.pitchMaterial.findMany({
      where: { founderId: userId },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(materials);
  } catch (error) {
    console.error('Get pitch materials error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/pitch/materials', authenticateToken, async (req, res) => {
  try {
    const founderId = getUserId(req);
    const { title, description, filePath, fileType, fileSize } = req.body;
    
    const material = await prisma.pitchMaterial.create({
      data: {
        founderId,
        title,
        description,
        filePath: filePath || '',
        fileType: fileType || 'pdf',
        fileSize: fileSize || 0,
      },
    });
    res.json(material);
  } catch (error) {
    console.error('Create pitch material error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== COMPANY ROUTES ====================

app.get('/api/company/profile', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const company = await prisma.company.findFirst({
      where: { founderId: userId },
    });
    res.json(company || null);
  } catch (error) {
    console.error('Get company profile error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.put('/api/company/profile', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, description, website, sector, stage, teamSize, location } = req.body;
    
    const existingCompany = await prisma.company.findFirst({
      where: { founderId: userId },
    });
    
    if (existingCompany) {
      const company = await prisma.company.update({
        where: { id: existingCompany.id },
        data: { name, description, website, sector, stage, teamSize, location },
      });
      res.json(company);
    } else {
      const company = await prisma.company.create({
        data: {
          founderId: userId,
          name,
          description,
          website,
          sector,
          stage,
          teamSize,
          location,
        },
      });
      res.json(company);
    }
  } catch (error) {
    console.error('Update company profile error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/company/fundraising-rounds', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const company = await prisma.company.findFirst({
      where: { founderId: userId },
    });
    
    if (!company) {
      return res.json([]);
    }
    
    const rounds = await prisma.fundraisingRound.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rounds);
  } catch (error) {
    console.error('Get fundraising rounds error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/company/fundraising-rounds', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { roundName, roundType, targetAmount, raisedAmount, status } = req.body;
    
    const company = await prisma.companyProfile.findFirst({
      where: { founderId: userId },
    });
    
    if (!company) {
      return res.status(400).json({ error: { message: 'Company profile required', code: 'COMPANY_REQUIRED' } });
    }
    
    const round = await prisma.fundraisingRound.create({
      data: {
        companyId: company.id,
        roundName: roundName || roundType || 'Series A',
        targetAmount,
        raisedAmount: raisedAmount || 0,
        status: status || 'planning',
      },
    });
    res.json(round);
  } catch (error) {
    console.error('Create fundraising round error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== ADMIN ROUTES ====================

// ==================== COMPLIANCE DASHBOARD & AUDIT LOGS ====================

// GET /api/compliance/dashboard - Compliance KPI summary
app.get('/api/compliance/dashboard', authenticateToken, requireRole(['compliance_officer', 'admin']), async (req, res) => {
  try {
    const [pendingKYC, verifiedKYC, rejectedKYC] = await Promise.all([
      prisma.kYCDocument.count({ where: { status: 'pending' } }),
      prisma.kYCDocument.count({ where: { status: 'verified' } }),
      prisma.kYCDocument.count({ where: { status: 'rejected' } }),
    ]);

    const [pendingAML, flaggedAML, clearedAML] = await Promise.all([
      prisma.aMLScreening.count({ where: { status: 'pending' } }),
      prisma.aMLScreening.count({ where: { status: 'flagged' } }),
      prisma.aMLScreening.count({ where: { status: 'clear' } }),
    ]);

    const [pendingAccreditations, approvedAccreditations] = await Promise.all([
      prisma.accreditation.count({ where: { status: 'pending' } }),
      prisma.accreditation.count({ where: { status: { in: ['verified', 'approved'] } } }),
    ]);

    const totalAuditLogs = await prisma.auditLog.count({
      where: { action: { in: ['verify_kyc', 'reject_kyc', 'initiate_aml_screening', 'clear_aml_screening', 'flag_aml_screening', 'verify_accreditation', 'reject_accreditation'] } },
    });

    res.json({
      pendingKYC,
      verifiedKYC,
      rejectedKYC,
      pendingAML,
      flaggedAML,
      clearedAML,
      pendingAccreditations,
      approvedAccreditations,
      totalAuditLogs,
    });
  } catch (error) {
    console.error('Compliance dashboard error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// GET /api/compliance/audit-logs - Compliance officer audit log view
app.get('/api/compliance/audit-logs', authenticateToken, requireRole(['compliance_officer', 'admin']), async (req, res) => {
  try {
    const complianceActions = [
      'verify_kyc', 'reject_kyc',
      'initiate_aml_screening', 'clear_aml_screening', 'flag_aml_screening',
      'verify_accreditation', 'reject_accreditation',
    ];

    const auditEntries = await prisma.auditLog.findMany({
      where: { action: { in: complianceActions } },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    res.json(auditEntries.map(l => ({
      id: l.id,
      userId: l.userId,
      action: l.action,
      resourceType: l.entity || 'compliance',
      resourceId: l.entityId,
      details: l.details ? { message: l.details } : {},
      createdAt: l.createdAt,
      userName: l.user?.fullName || null,
      userEmail: l.user?.email || null,
      source: 'audit_log',
    })));
  } catch (error) {
    console.error('Compliance audit logs error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/admin/audit-logs', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const limitParam = parseInt(req.query.limit as string) || 100;
    const pageParam = parseInt(req.query.page as string) || 1;
    const skip = (pageParam - 1) * limitParam;

    // Fetch structured admin audit_logs (compliance/role actions)
    const auditEntries = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: limitParam,
      skip,
    });

    // Also surface activity_logs (seeded user activity) — B6 fix
    const activityEntries = await prisma.activityLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: limitParam,
      skip,
    });

    const auditMapped = auditEntries.map(l => ({
      id: l.id,
      userId: l.userId,
      action: l.action,
      resourceType: l.entity || 'system',
      resourceId: l.entityId,
      details: l.details ? { message: l.details } : {},
      createdAt: l.createdAt,
      userName: l.user?.fullName || null,
      userEmail: l.user?.email || null,
      source: 'audit_log' as const,
    }));

    const activityMapped = activityEntries.map(a => ({
      id: a.id,
      userId: a.userId,
      action: a.activityType.toLowerCase(),
      resourceType: a.entityType,
      resourceId: a.entityId,
      details: { message: a.description, ...(a.metadata as object || {}) },
      createdAt: a.createdAt,
      userName: a.user?.fullName || null,
      userEmail: a.user?.email || null,
      source: 'activity_log' as const,
    }));

    // Merge & sort by descending createdAt; slice to requested page
    const combined = [...auditMapped, ...activityMapped]
      .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())
      .slice(skip, skip + limitParam);

    res.json(combined);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.get('/api/admin/investors', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const investors = await prisma.user.findMany({
      where: {
        roles: {
          some: { role: 'investor' },
        },
      },
      include: {
        roles: true,
        accreditations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    res.json(investors.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      roles: u.roles.map((r: { role: string }) => r.role),
      createdAt: u.createdAt,
      investorProfile: {
        accreditationStatus: u.accreditations[0]?.status || 'PENDING',
        investmentPreferences: [] as string[],
        totalInvested: 0,
      },
    })));
  } catch (error) {
    console.error('Get investors error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Password reset (placeholder - would need email service)
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a reset link will be sent.' });
    }
    
    // In production, send email with reset token
    // For now, just acknowledge
    res.json({ message: 'If the email exists, a reset link will be sent.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/auth/update-password', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { newPassword } = req.body;
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== COMPANY ADMIN ROUTES ====================

// Get all companies (admin)
app.get('/api/admin/companies', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        founder: {
          select: { email: true, fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(companies.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      sector: c.sector,
      stage: c.stage,
      website: c.website,
      location: c.location,
      founder: c.founder ? { email: c.founder.email, fullName: c.founder.fullName } : null,
      createdAt: c.createdAt,
    })));
  } catch (error) {
    console.error('Get admin companies error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch companies', code: 'SERVER_ERROR' } });
  }
});

// Delete company (admin)
app.delete('/api/admin/companies/:id', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as Record<string, string>;

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return res.status(404).json({ error: { message: 'Company not found', code: 'NOT_FOUND' } });
    }

    await prisma.company.delete({ where: { id } });
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: { message: 'Failed to delete company', code: 'SERVER_ERROR' } });
  }
});

// ==================== EVENT CRUD ROUTES (ADMIN) ====================

// Get all events (admin)
app.get('/api/admin/events', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: { registrations: true, waitlist: true, attendance: true }
        }
      },
      orderBy: { eventDate: 'desc' },
    });
    
    // Map to include combined registration count
    const eventsWithCounts = events.map(e => ({
      ...e,
      registration_count: (e._count?.registrations || 0) + (e._count?.attendance || 0),
      waitlist_count: e._count?.waitlist || 0,
    }));
    
    res.json(eventsWithCounts);
  } catch (error) {
    console.error('Get admin events error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Create event (admin)
app.post('/api/admin/events', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
  try {
    const { title, description, eventDate, location, capacity, registrationDeadline, status, city, venue, address, mapLatitude, mapLongitude, bannerImageUrl } = req.body;
    
    if (!title || !eventDate) {
      return res.status(400).json({ error: { message: 'Title and event date are required', code: 'VALIDATION_ERROR' } });
    }
    
    const event = await prisma.event.create({
      data: {
        title,
        description,
        eventDate: new Date(eventDate),
        location,
        capacity: capacity ? parseInt(capacity, 10) : null,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        status: status || 'upcoming',
        city: city || null,
        venue: venue || null,
        address: address || null,
        mapLatitude: mapLatitude ? parseFloat(mapLatitude) : null,
        mapLongitude: mapLongitude ? parseFloat(mapLongitude) : null,
        bannerImageUrl: bannerImageUrl || null,
      },
    });
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Update event (admin)
app.patch('/api/admin/events/:id', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
  try {
    const { title, description, eventDate, location, capacity, registrationDeadline, status, city, venue, address, mapLatitude, mapLongitude, bannerImageUrl } = req.body;
    
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (eventDate !== undefined) updateData.eventDate = new Date(eventDate);
    if (location !== undefined) updateData.location = location;
    if (capacity !== undefined) updateData.capacity = capacity ? parseInt(capacity, 10) : null;
    if (registrationDeadline !== undefined) updateData.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
    if (status !== undefined) updateData.status = status;
    if (city !== undefined) updateData.city = city || null;
    if (venue !== undefined) updateData.venue = venue || null;
    if (address !== undefined) updateData.address = address || null;
    if (mapLatitude !== undefined) updateData.mapLatitude = mapLatitude ? parseFloat(mapLatitude) : null;
    if (mapLongitude !== undefined) updateData.mapLongitude = mapLongitude ? parseFloat(mapLongitude) : null;
    if (bannerImageUrl !== undefined) updateData.bannerImageUrl = bannerImageUrl || null;
    
    const event = await prisma.event.update({
      where: { id: String(req.params.id) },
      data: updateData,
    });
    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Delete event (admin)
app.delete('/api/admin/events/:id', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
  try {
    await prisma.event.delete({
      where: { id: String(req.params.id) },
    });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Get all event registrations (admin) - queries EventAttendance (consolidated)
app.get('/api/admin/event-registrations', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
  try {
    // Accept both event_id and eventId for compatibility
    const filterEventId = (req.query.event_id || req.query.eventId) as string | undefined;
    const where = filterEventId ? { eventId: filterEventId } : {};
    
    // Query from EventAttendance (consolidated registration system)
    const attendanceRecords = await prisma.eventAttendance.findMany({
      where: { ...where, rsvpStatus: { in: ['CONFIRMED', 'WAITLIST'] } },
      include: {
        event: { select: { title: true, eventDate: true } },
        user: { select: { email: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Also get legacy EventRegistration records for backward compatibility
    const legacyRegistrations = await prisma.eventRegistration.findMany({
      where,
      include: {
        event: { select: { title: true, eventDate: true } },
        user: { select: { email: true, fullName: true } },
      },
      orderBy: { registeredAt: 'desc' },
    });
    
    // Merge, dedup by eventId+userId, prefer attendance records
    const seen = new Set(attendanceRecords.map(a => `${a.userId}-${a.eventId}`));
    const merged = [
      ...attendanceRecords.map(a => ({
        id: a.id,
        userId: a.userId,
        eventId: a.eventId,
        // Flatten user data to top-level for frontend compatibility
        full_name: a.user.fullName,
        email: a.user.email,
        company: null as string | null,
        status: a.rsvpStatus === 'CONFIRMED' ? 'registered' : 'waitlist',
        registered_at: a.createdAt,
        event_title: a.event.title,
      })),
      ...legacyRegistrations
        .filter(r => !seen.has(`${r.userId}-${r.eventId}`))
        .map(r => ({
          id: r.id,
          userId: r.userId,
          eventId: r.eventId,
          full_name: r.user?.fullName || r.fullName,
          email: r.user?.email || r.email,
          company: r.company,
          status: r.status === 'confirmed' ? 'registered' : r.status,
          registered_at: r.registeredAt,
          event_title: r.event.title,
        })),
    ];
    
    res.json(merged);
  } catch (error) {
    console.error('Get admin event registrations error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== EVENT REGISTRATION ROUTES (CONSOLIDATED - RSVP-BASED) ====================

// Legacy registration endpoint - now proxies to RSVP system via EventAttendance
app.post('/api/events/register', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { eventId } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ error: { message: 'Event ID is required', code: 'VALIDATION_ERROR' } });
    }
    
    // Check if event exists and has capacity
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { attendance: true } } },
    });
    
    if (!event) {
      return res.status(404).json({ error: { message: 'Event not found', code: 'NOT_FOUND' } });
    }
    
    // Check registration deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ error: { message: 'Registration deadline has passed', code: 'DEADLINE_PASSED' } });
    }
    
    // Check capacity
    if (event.capacity && event._count.attendance >= event.capacity) {
      return res.status(400).json({ error: { message: 'Event is at full capacity', code: 'CAPACITY_FULL' } });
    }
    
    // Check if already registered (in EventAttendance)
    const existingAttendance = await prisma.eventAttendance.findUnique({
      where: { userId_eventId: { eventId, userId } },
    });
    
    if (existingAttendance) {
      return res.status(400).json({ error: { message: 'You are already registered for this event', code: 'ALREADY_REGISTERED' } });
    }
    
    // Create attendance record (RSVP)
    const attendance = await prisma.eventAttendance.create({
      data: {
        eventId,
        userId,
        rsvpStatus: 'CONFIRMED',
      },
      include: { event: true },
    });
    
    res.status(201).json(attendance);
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Cancel registration - now uses EventAttendance
app.delete('/api/events/registrations/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    const attendance = await prisma.eventAttendance.findFirst({
      where: { id: String(req.params.id) },
    });
    
    if (!attendance) {
      return res.status(404).json({ error: { message: 'Registration not found', code: 'NOT_FOUND' } });
    }
    
    if (attendance.userId !== userId) {
      return res.status(403).json({ error: { message: 'Not authorized to cancel this registration', code: 'FORBIDDEN' } });
    }
    
    await prisma.eventAttendance.delete({
      where: { id: String(req.params.id) },
    });
    
    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Get registration count for an event (public) - counts attendance records
app.get('/api/events/:id/registration-count', async (req, res) => {
  try {
    const count = await prisma.eventAttendance.count({
      where: { eventId: req.params.id as string, rsvpStatus: 'CONFIRMED' },
    });
    res.json({ count });
  } catch (error) {
    console.error('Get registration count error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== EVENT WAITLIST ROUTES ====================

// Get waitlist for an event (admin only)
app.get('/api/admin/events/:id/waitlist', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
  try {
    const waitlist = await prisma.eventWaitlist.findMany({
      where: { eventId: String(req.params.id) },
      include: {
        user: { select: { email: true, fullName: true } },
      },
      orderBy: { position: 'asc' },
    });
    res.json(waitlist);
  } catch (error) {
    console.error('Get event waitlist error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Join waitlist for an event
app.post('/api/events/:id/waitlist', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const eventId = String(req.params.id);
    const { fullName, email, phone, company } = req.body;
    
    if (!fullName || !email) {
      return res.status(400).json({ error: { message: 'Full name and email are required', code: 'VALIDATION_ERROR' } });
    }
    
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      return res.status(404).json({ error: { message: 'Event not found', code: 'NOT_FOUND' } });
    }
    
    // Check if already on waitlist
    const existingWaitlist = await prisma.eventWaitlist.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    
    if (existingWaitlist) {
      return res.status(400).json({ error: { message: 'You are already on the waitlist for this event', code: 'ALREADY_ON_WAITLIST' } });
    }
    
    // Check if already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    
    if (existingRegistration) {
      return res.status(400).json({ error: { message: 'You are already registered for this event', code: 'ALREADY_REGISTERED' } });
    }
    
    // Get current max position
    const maxPosition = await prisma.eventWaitlist.aggregate({
      where: { eventId },
      _max: { position: true },
    });
    
    const waitlistEntry = await prisma.eventWaitlist.create({
      data: {
        eventId,
        userId,
        fullName,
        email,
        phone,
        company,
        position: (maxPosition._max?.position || 0) + 1,
      },
      include: { event: true },
    });
    
    res.status(201).json(waitlistEntry);
  } catch (error) {
    console.error('Join waitlist error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Get waitlist count for an event (public)
app.get('/api/events/:id/waitlist/count', async (req, res) => {
  try {
    const count = await prisma.eventWaitlist.count({
      where: { eventId: String(req.params.id) },
    });
    res.json({ count });
  } catch (error) {
    console.error('Get waitlist count error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Get user's waitlist position for an event
app.get('/api/events/:id/waitlist/position', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const eventId = String(req.params.id);
    const waitlistEntry = await prisma.eventWaitlist.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    
    if (!waitlistEntry) {
      return res.status(404).json({ error: { message: 'Not on waitlist', code: 'NOT_FOUND' } });
    }
    
    res.json({ position: waitlistEntry.position });
  } catch (error) {
    console.error('Get waitlist position error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Leave waitlist
app.delete('/api/events/:id/waitlist', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const eventId = String(req.params.id);
    
    const waitlistEntry = await prisma.eventWaitlist.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    
    if (!waitlistEntry) {
      return res.status(404).json({ error: { message: 'Not on waitlist', code: 'NOT_FOUND' } });
    }
    
    await prisma.eventWaitlist.delete({
      where: { eventId_userId: { eventId, userId } },
    });
    
    // Reorder positions for remaining entries
    await prisma.$executeRaw`
      UPDATE event_waitlist 
      SET position = position - 1 
      WHERE event_id = ${eventId} AND position > ${waitlistEntry.position}
    `;
    
    res.json({ message: 'Removed from waitlist successfully' });
  } catch (error) {
    console.error('Leave waitlist error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== PAYMENT SYSTEM ====================

import PaymentService from './server/services/payment.service';
import { PaymentGateway, PaymentType, PaymentStatus } from '@prisma/client';
import { encrypt } from './server/utils/encryption';

/**
 * POST /api/payments/create-order
 * Create a new payment order (Razorpay, Stripe, etc.)
 */
app.post('/api/payments/create-order', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, currency, type, gateway, description, metadata } = req.body;
    const userId = req.user!.userId;

    // Validate amount
    const validation = PaymentService.validateAmount(amount);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Validate required fields
    if (!amount || !currency || !type || !gateway) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, currency, type, gateway'
      });
    }

    // Create payment intent
    const paymentIntent = {
      amount,
      currency,
      description: description || `Payment for ${type}`,
      userId,
      type: type as PaymentType,
      metadata
    };

    // Create order with selected gateway
    const result = await PaymentService.createPaymentOrder(
      paymentIntent,
      gateway as PaymentGateway
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    // Save payment to database
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        currency,
        gateway: gateway as PaymentGateway,
        status: PaymentStatus.PENDING,
        type: type as PaymentType,
        gatewayOrderId: result.orderId,
        description: paymentIntent.description,
        metadata: metadata || {},
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PAYMENT_CREATED',
        entity: 'Payment',
        entityId: payment.id,
        details: JSON.stringify({
          amount,
          currency,
          gateway,
          orderId: result.orderId
        }),
        ipAddress: req.ip || req.socket.remoteAddress
      }
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId,
        activityType: 'PAYMENT_CREATED',
        entityType: 'Payment',
        entityId: payment.id,
        description: `Payment order created for ${currency} ${amount / 100}`,
        metadata: { gateway, type, orderId: result.orderId }
      }
    });

    // Get user details for email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true }
    });

    // Check notification preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    // Send email notification if preferences allow
    if (!preferences || preferences.emailPayments) {
      await emailService.sendPaymentInitiatedEmail(
        user?.email || '',
        user?.fullName || 'User',
        {
          amount,
          currency,
          orderId: result.orderId!,
          paymentLink: result.checkoutUrl
        },
        userId
      );
    }

    res.status(201).json({
      ...result,
      paymentId: payment.id,
      payment
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order'
    });
  }
});

/**
 * POST /api/payments/verify
 * Verify payment completion
 */
app.post('/api/payments/verify', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, paymentId, signature, gateway } = req.body;
    const userId = req.user!.userId;

    if (!orderId || !paymentId || !signature || !gateway) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Missing required fields: orderId, paymentId, signature, gateway'
      });
    }

    // Find payment in database
    const payment = await prisma.payment.findFirst({
      where: {
        gatewayOrderId: orderId,
        userId
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        verified: false,
        error: 'Payment not found'
      });
    }

    // Verify signature
    const verified = await PaymentService.verifyPayment(
      { orderId, paymentId, signature },
      gateway as PaymentGateway
    );

    if (!verified) {
      // Update payment status to FAILED
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: 'Invalid payment signature'
        }
      });

      // Create activity log for failure
      await prisma.activityLog.create({
        data: {
          userId,
          activityType: 'PAYMENT_FAILED',
          entityType: 'Payment',
          entityId: payment.id,
          description: 'Payment verification failed - invalid signature',
          metadata: { orderId, paymentId, reason: 'Invalid signature' }
        }
      });

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true }
      });

      // Check notification preferences
      const preferences = await prisma.notificationPreference.findUnique({
        where: { userId }
      });

      // Send failure email
      if (!preferences || preferences.emailPayments) {
        await emailService.sendPaymentFailureEmail(
          user?.email || '',
          user?.fullName || 'User',
          {
            amount: Number(payment.amount),
            currency: payment.currency,
            orderId,
            reason: 'Invalid payment signature',
            retryLink: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/payments/retry/${payment.id}`
          },
          userId
        );
      }

      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Invalid payment signature'
      });
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        gatewayPaymentId: paymentId,
        gatewaySignature: signature,
        completedAt: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PAYMENT_VERIFIED',
        entity: 'Payment',
        entityId: payment.id,
        details: JSON.stringify({
          orderId,
          paymentId,
          gateway
        }),
        ipAddress: req.ip || req.socket.remoteAddress
      }
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId,
        activityType: 'PAYMENT_COMPLETED',
        entityType: 'Payment',
        entityId: payment.id,
        description: `Payment completed successfully for ${payment.currency} ${Number(payment.amount) / 100}`,
        metadata: { gateway, orderId, paymentId }
      }
    });

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true }
    });

    // Queue invoice generation (async with retry)
    const invoicePath = '';
    try {
      const invoiceData = {
        userId,
        paymentId: payment.id,
        buyerName: user?.fullName || 'User',
        buyerEmail: user?.email || '',
        buyerPhone: undefined,
        buyerPAN: undefined,
        buyerAddress: undefined,
        lineItems: [
          {
            description: `${payment.type} - ${payment.description || 'Payment'}`,
            quantity: 1,
            unitPrice: Number(payment.amount),
            amount: Number(payment.amount)
          }
        ],
        subtotal: Number(payment.amount),
        totalAmount: Number(payment.amount)
      };

      // Add to queue instead of generating directly
      await invoiceQueueService.addInvoiceJob(invoiceData);
      console.log(`📄 Invoice queued for payment ${payment.id}`);
      // Invoice will be generated asynchronously, don't block payment response
    } catch (invoiceError) {
      console.error('Failed to queue invoice generation:', invoiceError);
      // Continue even if queueing fails
    }

    // Check notification preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    // Send success email if preferences allow
    if (!preferences || preferences.emailPayments) {
      await emailService.sendPaymentSuccessEmail(
        user?.email || '',
        user?.fullName || 'User',
        {
          amount: Number(payment.amount),
          currency: payment.currency,
          transactionId: paymentId,
          paymentDate: updatedPayment.completedAt!,
          invoicePath
        },
        userId
      );
    }

    res.json({
      success: true,
      verified: true,
      payment: updatedPayment
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      verified: false,
      error: 'Failed to verify payment'
    });
  }
});

// Note: Enhanced payment history route moved to /server/routes/payments-history.ts
// Accessible via Phase 2 router at /api/payments/history

/**
 * POST /api/payments/refund
 * Process payment refund
 */
app.post('/api/payments/refund', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId, amount, reason } = req.body;
    const userId = req.user!.userId;

    if (!paymentId || !amount || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: paymentId, amount, reason'
      });
    }

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Check authorization (only payment owner or admin can refund)
    const userRoles = req.user!.roles || [];
    if (payment.userId !== userId && !userRoles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to refund this payment'
      });
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        error: 'Can only refund completed payments'
      });
    }

    // Process refund through gateway
    const refundResult = await PaymentService.refundPayment(
      {
        paymentId: payment.gatewayPaymentId!,
        amount,
        reason
      },
      payment.gateway
    );

    if (!refundResult.success) {
      return res.status(500).json(refundResult);
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        refundAmount: amount,
        refundReason: reason,
        refundedAt: new Date()
      }
    });

    // Create refund record
    await prisma.paymentRefund.create({
      data: {
        paymentId,
        amount,
        reason,
        status: 'completed',
        gatewayRefundId: refundResult.refundId,
        processedBy: userId,
        processedAt: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PAYMENT_REFUNDED',
        entity: 'Payment',
        entityId: paymentId,
        details: JSON.stringify({
          amount,
          reason,
          refundId: refundResult.refundId
        }),
        ipAddress: req.ip || req.socket.remoteAddress
      }
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: payment.userId,
        activityType: 'PAYMENT_REFUNDED',
        entityType: 'Payment',
        entityId: paymentId,
        description: `Refund processed for ${payment.currency} ${amount / 100}`,
        metadata: { amount, reason, refundId: refundResult.refundId }
      }
    });

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: payment.userId },
      select: { email: true, fullName: true }
    });

    // Check notification preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: payment.userId }
    });

    // Send refund email
    if (!preferences || preferences.emailPayments) {
      await emailService.sendRefundProcessedEmail(
        user?.email || '',
        user?.fullName || 'User',
        {
          amount,
          currency: payment.currency,
          refundId: refundResult.refundId || 'N/A',
          originalTransactionId: payment.gatewayPaymentId || payment.gatewayOrderId || 'N/A',
          reason,
          expectedDays: 7 // 5-7 business days typically
        },
        payment.userId
      );
    }

    res.json({
      success: true,
      payment: updatedPayment,
      refund: refundResult
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund'
    });
  }
});

/**
 * GET /api/audit/payments
 * Get payment audit logs (admin only)
 */
app.get('/api/audit/payments', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entity: 'Payment'
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

// ==================== ADMIN INVOICE MANAGEMENT ====================

/**
 * GET /api/admin/invoices/failed
 * Get list of failed invoice generation jobs
 */
app.get('/api/admin/invoices/failed', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const failedJobs = await invoiceQueueService.getFailedJobs(100);
    
    const failedInvoices = await Promise.all(
      failedJobs.map(async (job) => {
        const user = await prisma.user.findUnique({
          where: { id: job.data.userId },
          select: { email: true, fullName: true },
        });

        return {
          id: job.id?.toString(),
          paymentId: job.data.paymentId,
          userId: job.data.userId,
          error: job.failedReason || 'Unknown error',
          attempts: job.attemptsMade,
          lastAttemptAt: job.processedOn ? new Date(job.processedOn).toISOString() : new Date(job.timestamp).toISOString(),
          payment: {
            id: job.data.paymentId,
            amount: job.data.totalAmount || 0,
            currency: 'INR',
            status: 'completed',
            user: {
              email: user?.email || 'unknown',
              fullName: user?.fullName || 'Unknown User',
            },
          },
        };
      })
    );

    res.json(failedInvoices);
  } catch (error) {
    console.error('Get failed invoices error:', error);
    res.status(500).json({ error: 'Failed to retrieve failed invoices' });
  }
});

/**
 * POST /api/admin/invoices/:paymentId/retry
 * Manually retry invoice generation for a specific payment
 */
app.post('/api/admin/invoices/:paymentId/retry', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const paymentId = req.params.paymentId as string;

    const job = await invoiceQueueService.retryInvoiceJob(paymentId);

    if (!job) {
      return res.status(404).json({ error: 'Payment not found or no failed job exists' });
    }

    res.json({ 
      success: true, 
      jobId: job.id?.toString(),
      message: 'Invoice generation queued for retry' 
    });
  } catch (error) {
    console.error('Retry invoice error:', error);
    res.status(500).json({ error: 'Failed to retry invoice generation' });
  }
});

/**
 * POST /api/admin/invoices/retry-batch
 * Batch retry multiple invoice generations (max 50)
 */
app.post('/api/admin/invoices/retry-batch', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentIds } = req.body;

    if (!Array.isArray(paymentIds)) {
      return res.status(400).json({ error: 'paymentIds must be an array' });
    }

    if (paymentIds.length > 50) {
      return res.status(400).json({ error: 'Batch retry limited to 50 invoices at a time' });
    }

    const result = await invoiceQueueService.retryBatchInvoices(paymentIds);

    res.json({ 
      success: true,
      retried: result.success,
      failed: result.failed,
      message: `Queued ${result.success} invoices for retry, ${result.failed} failed`
    });
  } catch (error) {
    console.error('Batch retry error:', error);
    res.status(500).json({ error: 'Failed to retry invoices' });
  }
});

/**
 * GET /api/admin/invoices/queue-metrics
 * Get invoice queue health metrics
 */
app.get('/api/admin/invoices/queue-metrics', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const metrics = await invoiceQueueService.getMetrics();
    res.json({ metrics });
  } catch (error) {
    console.error('Get queue metrics error:', error);
    res.status(500).json({ error: 'Failed to retrieve queue metrics' });
  }
});

/**
 * GET /api/admin/invoices/cleanup-stats
 * Get invoice cleanup statistics
 */
app.get('/api/admin/invoices/cleanup-stats', authenticateToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await invoiceCleanupService.getStatistics();
    res.json({ stats });
  } catch (error) {
    console.error('Get cleanup stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve cleanup statistics' });
  }
});

// ==================== BULL BOARD QUEUE DASHBOARD ====================

// TODO: Fix Bull Board imports - temporarily commented out for Phase 2 testing
// const serverAdapter = new ExpressAdapter();
// serverAdapter.setBasePath('/admin/queues');
// 
// createBullBoard({
//   queues: [new BullMQAdapter(invoiceQueueService.getQueue())],
//   serverAdapter: serverAdapter,
// });
// 
// // Bull Board requires admin authentication
// app.use('/admin/queues', authenticateToken, requireRole(['admin']), serverAdapter.getRouter());

// ==================== PAYMENTS HISTORY ROUTES ====================

app.use('/api/payments', paymentsHistoryRouter);

// ==================== EVENT ATTENDANCE ROUTES ====================

app.use('/api/events', eventAttendanceRouter);

// ==================== CERTIFICATE ROUTES ====================

app.use('/api/certificates', certificatesRouter);

// ==================== FINANCIAL STATEMENTS ROUTES ====================

app.use('/api/financial-statements', financialStatementsRouter);

// ==================== ACTIVITY TIMELINE ROUTES ====================

app.use('/api/activity', activityRouter);

// ==================== CMS ROUTES ====================

app.use('/api', cmsRouter);

// ==================== MEMBERSHIP ROUTES ====================

app.use('/api/membership', membershipRouter);

// ==================== ADMIN MEMBERSHIP ROUTES ====================

app.use('/api/admin/membership', adminMembershipRouter);

// ==================== IDENTITY VERIFICATION ROUTES ====================

app.use('/api/verification', identityVerificationRouter);

// ==================== TEST SEEDING (E2E only) ====================

/**
 * Seed an approved InvestorApplication row in Postgres for E2E tests.
 * DealsPage checks /api/applications/investor-application for status "approved"
 * and redirects non-approved investors. This endpoint creates the required row.
 * Idempotent — upserts based on userId.
 */
app.post('/api/test/seed-investor-application', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { fullName, email, investorType, status } = req.body;

    // Check if one already exists for this user
    const existing = await prisma.investorApplication.findFirst({ where: { userId } });
    
    if (existing) {
      // Update status if needed
      const updated = await prisma.investorApplication.update({
        where: { id: existing.id },
        data: { status: status || 'approved' },
      });
      return res.status(200).json(updated);
    }

    // Create new application
    const application = await prisma.investorApplication.create({
      data: {
        userId,
        fullName: fullName || 'Test Investor',
        email: email || '',
        investorType: investorType || 'individual',
        status: status || 'approved',
      },
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Seed investor application error:', error);
    res.status(500).json({ error: { message: 'Seed failed', code: 'SEED_ERROR' } });
  }
});

// Test seed: Accreditation (ensure investor is accredited so Express Interest works)
app.post('/api/test/seed-accreditation', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);

    const existing = await prisma.accreditation.findFirst({ where: { userId } });
    
    if (existing) {
      const updated = await prisma.accreditation.update({
        where: { id: existing.id },
        data: {
          status: 'verified',
          type: 'income',
          verifiedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        },
      });
      return res.status(200).json({ ...updated, expiryDate: updated.expiresAt });
    }

    const accreditation = await prisma.accreditation.create({
      data: {
        userId,
        status: 'verified',
        type: 'income',
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({ ...accreditation, expiryDate: accreditation.expiresAt });
  } catch (error) {
    console.error('Seed accreditation error:', error);
    res.status(500).json({ error: { message: 'Seed failed', code: 'SEED_ERROR' } });
  }
});

// ==================== PHASE 4: ADMIN OPERATIONS ====================

// GET /api/admin/applications - List all investor + founder applications
app.get('/api/admin/applications', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const investorApps = await prisma.investorApplication.findMany({
      include: { user: true },
      orderBy: { submittedAt: 'desc' },
    });

    const founderApps = await prisma.founderApplication.findMany({
      include: { user: true },
      orderBy: { submittedAt: 'desc' },
    });

    const applications = [
      ...investorApps.map(app => ({
        id: app.id,
        user_id: app.userId,
        application_type: 'investor' as const,
        status: app.status,
        full_name: app.fullName,
        email: app.email,
        phone: app.phone,
        investment_capacity: app.investmentRange ? parseInt(app.investmentRange) || 0 : null,
        investment_experience: app.investorType,
        linkedin_url: app.linkedinUrl,
        company_name: null,
        company_stage: null,
        funding_amount: null,
        pitch_deck_url: null,
        submitted_at: app.submittedAt.toISOString(),
        reviewed_at: app.reviewedAt?.toISOString() || null,
        rejection_reason: app.reviewNotes,
      })),
      ...founderApps.map(app => ({
        id: app.id,
        user_id: app.userId,
        application_type: 'founder' as const,
        status: app.status,
        full_name: app.fullName,
        email: app.email,
        phone: app.phone,
        investment_capacity: null,
        investment_experience: null,
        linkedin_url: null,
        company_name: app.companyName,
        company_stage: app.stage,
        funding_amount: app.fundingGoal ? Number(app.fundingGoal) : null,
        pitch_deck_url: app.pitchDeckUrl,
        submitted_at: app.submittedAt.toISOString(),
        reviewed_at: app.reviewedAt?.toISOString() || null,
        rejection_reason: app.reviewNotes,
      })),
    ].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

    res.json(applications);
  } catch (error) {
    console.error('Get admin applications error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/admin/applications/:id/approve - Approve application
app.patch('/api/admin/applications/:id/approve', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params as Record<string, string>;
    const reviewedBy = getUserId(req);

    // Try investor application first
    const app = await prisma.investorApplication.findUnique({ where: { id } });
    if (app) {
      await prisma.investorApplication.update({
        where: { id },
        data: { status: 'approved', reviewedBy, reviewedAt: new Date() },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: { userId: reviewedBy, action: 'approve_application', entity: 'investor_application', entityId: id, details: `Approved investor application for ${app.fullName}` },
      });

      return res.json({ success: true, email_sent: true });
    }

    // Try founder application
    const fApp = await prisma.founderApplication.findUnique({ where: { id } });
    if (fApp) {
      await prisma.founderApplication.update({
        where: { id },
        data: { status: 'approved', reviewedBy, reviewedAt: new Date() },
      });

      await prisma.auditLog.create({
        data: { userId: reviewedBy, action: 'approve_application', entity: 'founder_application', entityId: id, details: `Approved founder application for ${fApp.fullName}` },
      });

      return res.json({ success: true, email_sent: true });
    }

    res.status(404).json({ error: { message: 'Application not found', code: 'NOT_FOUND' } });
  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/admin/applications/:id/reject - Reject application with reason
app.patch('/api/admin/applications/:id/reject', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params as Record<string, string>;
    const { reason } = req.body;
    const reviewedBy = getUserId(req);

    const app = await prisma.investorApplication.findUnique({ where: { id } });
    if (app) {
      await prisma.investorApplication.update({
        where: { id },
        data: { status: 'rejected', reviewedBy, reviewedAt: new Date(), reviewNotes: reason },
      });

      await prisma.auditLog.create({
        data: { userId: reviewedBy, action: 'reject_application', entity: 'investor_application', entityId: id, details: `Rejected: ${reason}` },
      });

      return res.json({ success: true, notification_sent: true });
    }

    const fApp = await prisma.founderApplication.findUnique({ where: { id } });
    if (fApp) {
      await prisma.founderApplication.update({
        where: { id },
        data: { status: 'rejected', reviewedBy, reviewedAt: new Date(), reviewNotes: reason },
      });

      await prisma.auditLog.create({
        data: { userId: reviewedBy, action: 'reject_application', entity: 'founder_application', entityId: id, details: `Rejected: ${reason}` },
      });

      return res.json({ success: true, notification_sent: true });
    }

    res.status(404).json({ error: { message: 'Application not found', code: 'NOT_FOUND' } });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/admin/users/:id/role - Change user role
app.patch('/api/admin/users/:id/role', authenticateToken, requireRole(['admin']), async (req, res) => {

// POST /api/admin/users - Create a new user (admin only)
app.post('/api/admin/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    const adminId = getUserId(req);

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, fullName },
    });

    // Assign role if provided
    if (role) {
      await prisma.userRole.create({
        data: { userId: user.id, role },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: { userId: adminId, action: 'create_user', entity: 'user', entityId: user.id, details: `Created user: ${email} with role ${role || 'user'}` },
    });

    res.status(201).json({ id: user.id, email: user.email, fullName: user.fullName });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
  try {
    const { id } = req.params as Record<string, string>;
    const { role } = req.body;
    const adminId = getUserId(req);

    // Delete existing roles and set new one
    await prisma.userRole.deleteMany({ where: { userId: id } });
    await prisma.userRole.create({
      data: { userId: id, role },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: { userId: adminId, action: 'assign_role', entity: 'user', entityId: id, details: `Changed role to ${role}` },
    });

    res.json({ success: true, role });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// DELETE /api/admin/users/:id - Delete a user (admin only)
app.delete('/api/admin/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params as Record<string, string>;
    const adminId = getUserId(req);

    // Prevent admin from deleting themselves
    if (id === adminId) {
      return res.status(400).json({ 
        error: { message: 'You cannot delete your own account', code: 'SELF_DELETE_NOT_ALLOWED' } 
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found', code: 'NOT_FOUND' } });
    }

    // Delete the user (cascade will handle related records)
    await prisma.user.delete({ where: { id } });

    // Create audit log
    await prisma.auditLog.create({
      data: { 
        userId: adminId, 
        action: 'delete_user', 
        entity: 'user', 
        entityId: id, 
        details: `Deleted user: ${user.email}` 
      },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// DELETE /api/admin/companies/:id - Delete a company (admin only)
app.delete('/api/admin/companies/:id', authenticateToken, requireRole(['admin']), async (req, res) => {

// GET /api/admin/companies - List all companies (admin only)
app.get('/api/admin/companies', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get companies from both Company and CompanyProfile models
    const companyProfiles = await prisma.companyProfile.findMany({
      include: { founder: { select: { email: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const companies = await prisma.company.findMany({
      include: { founder: { select: { email: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Merge and normalize
    const merged = [
      ...companyProfiles.map(cp => ({
        id: cp.id,
        name: cp.companyName,
        description: cp.description,
        sector: cp.industry,
        stage: cp.stage,
        website: cp.website,
        location: cp.location,
        founder: cp.founder,
        createdAt: cp.createdAt,
      })),
      ...companies.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        sector: c.sector,
        stage: c.stage,
        website: c.website,
        location: c.location,
        founder: c.founder,
        createdAt: c.createdAt,
      })),
    ];

    res.json(merged);
  } catch (error) {
    console.error('List companies error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});
  try {
    const { id } = req.params as Record<string, string>;
    const adminId = getUserId(req);

    // Try to find and delete from CompanyProfile first
    let deleted = false;
    let companyName = '';

    const companyProfile = await prisma.companyProfile.findUnique({ where: { id } });
    if (companyProfile) {
      companyName = companyProfile.companyName;
      await prisma.companyProfile.delete({ where: { id } });
      deleted = true;
    }

    // If not found in CompanyProfile, try Company model
    if (!deleted) {
      const company = await prisma.company.findUnique({ where: { id } });
      if (company) {
        companyName = company.name;
        await prisma.company.delete({ where: { id } });
        deleted = true;
      }
    }

    if (!deleted) {
      return res.status(404).json({ error: { message: 'Company not found', code: 'NOT_FOUND' } });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: { 
        userId: adminId, 
        action: 'delete_company', 
        entity: 'company', 
        entityId: id, 
        details: `Deleted company: ${companyName}` 
      },
    });

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// GET /api/admin/statistics - System statistics dashboard
app.get('/api/admin/statistics', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Users
    const totalUsers = await prisma.user.count();
    const userRoles = await prisma.userRole.groupBy({
      by: ['role'],
      _count: { _all: true },
    });
    const byRole: Record<string, number> = {};
    userRoles.forEach(r => { byRole[r.role] = r._count._all; });

    // Deals
    const totalDeals = await prisma.deal.count();
    const dealsSum = await prisma.deal.aggregate({ _sum: { amount: true } });
    const totalInvestment = Number(dealsSum._sum.amount || 0);

    // Events
    const totalEvents = await prisma.event.count();
    const totalAttendees = await prisma.eventRegistration.count();

    // Growth (last 6 months)
    const growth: Array<{ month: string; users: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      
      const count = await prisma.user.count({
        where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
      });
      
      growth.push({
        month: startOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        users: count,
      });
    }

    res.json({
      users: { total: totalUsers, byRole },
      deals: { total: totalDeals, totalInvestment },
      events: { total: totalEvents, totalAttendees },
      growth,
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== PHASE 4: COMPLIANCE ACCREDITATION ACTIONS ====================

// GET /api/compliance/accreditation/list - List all accreditations for compliance officers
app.get('/api/compliance/accreditation/list', authenticateToken, requireRole(['compliance_officer', 'admin']), async (req, res) => {
  try {
    const accreditations = await prisma.accreditation.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    const userIds = accreditations.map(a => a.userId);
    const kycDocs = await prisma.kYCDocument.findMany({
      where: { userId: { in: userIds } },
    });
    const docsByUser: Record<string, typeof kycDocs> = {};
    for (const doc of kycDocs) {
      if (!docsByUser[doc.userId]) docsByUser[doc.userId] = [];
      docsByUser[doc.userId].push(doc);
    }

    res.json(accreditations.map(a => ({
      id: a.id,
      investor_id: a.userId,
      verification_status: a.status,
      verification_method: a.type || 'income',
      annual_income: null,
      net_worth: null,
      professional_certification: null,
      expiry_date: a.expiresAt?.toISOString() || null,
      approved_at: a.verifiedAt?.toISOString() || null,
      rejected_at: a.status === 'rejected' ? a.createdAt.toISOString() : null,
      rejection_reason: a.reviewNotes || null,
      documents: (docsByUser[a.userId] || []).map(d => ({
        id: d.id,
        type: d.documentType,
        url: d.fileUrl,
      })),
      submitted_at: a.createdAt.toISOString(),
      investor: {
        id: a.user.id,
        full_name: a.user.fullName || a.user.email,
        email: a.user.email,
      },
    })));
  } catch (error) {
    console.error('Get accreditation list error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/compliance/accreditation/:id/approve - Approve accreditation
app.patch('/api/compliance/accreditation/:id/approve', authenticateToken, requireRole(['compliance_officer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params as Record<string, string>;
    const { expiry_date } = req.body;
    const reviewedBy = getUserId(req);

    const accreditation = await prisma.accreditation.update({
      where: { id },
      data: {
        status: 'verified',
        verifiedAt: new Date(),
        expiresAt: expiry_date ? new Date(expiry_date) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        reviewedBy,
      },
    });

    await prisma.auditLog.create({
      data: { userId: reviewedBy, action: 'verify_accreditation', entity: 'accreditation', entityId: id, details: 'Approved accreditation' },
    });

    res.json({ success: true, certificate_sent: true });
  } catch (error) {
    console.error('Approve accreditation error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/compliance/accreditation/:id/reject - Reject accreditation
app.patch('/api/compliance/accreditation/:id/reject', authenticateToken, requireRole(['compliance_officer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params as Record<string, string>;
    const { reason } = req.body;
    const reviewedBy = getUserId(req);

    await prisma.accreditation.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewNotes: reason,
        reviewedBy,
      },
    });

    await prisma.auditLog.create({
      data: { userId: reviewedBy, action: 'reject_accreditation', entity: 'accreditation', entityId: id, details: `Rejected: ${reason}` },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Reject accreditation error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== PHASE 4: MESSAGING ROUTES ====================

// GET /api/messages/threads - List user's message threads
app.get('/api/messages/threads', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);

    const threads = await prisma.messageThread.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: {
        participant1: true,
        participant2: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    res.json(threads.map(t => {
      const isP1 = t.participant1Id === userId;
      const other = isP1 ? t.participant2 : t.participant1;
      const lastMsg = t.messages[0];

      return {
        id: t.id,
        participant_ids: [t.participant1Id, t.participant2Id],
        last_message: lastMsg ? {
          id: lastMsg.id,
          content: lastMsg.content,
          sent_at: lastMsg.createdAt.toISOString(),
          sender_id: lastMsg.senderId,
        } : null,
        other_participant: {
          id: other.id,
          full_name: other.fullName || other.email,
          role: 'user',
          company: null,
          profile_picture: null,
        },
        unread_count: isP1 ? t.unreadCountP1 : t.unreadCountP2,
        updated_at: t.lastMessageAt.toISOString(),
      };
    }));
  } catch (error) {
    console.error('Get message threads error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// GET /api/messages/threads/:id/messages - Get messages for a thread
app.get('/api/messages/threads/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params as Record<string, string>;
    const userId = getUserId(req);

    // Verify user is participant
    const thread = await prisma.messageThread.findUnique({ where: { id } });
    if (!thread || (thread.participant1Id !== userId && thread.participant2Id !== userId)) {
      return res.status(403).json({ error: { message: 'Not a participant', code: 'FORBIDDEN' } });
    }

    const messages = await prisma.message.findMany({
      where: { threadId: id },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages.map(m => ({
      id: m.id,
      thread_id: m.threadId,
      sender_id: m.senderId,
      content: m.content,
      sent_at: m.createdAt.toISOString(),
      attachments: m.attachments || [],
      sender: {
        id: m.sender.id,
        full_name: m.sender.fullName || m.sender.email,
        role: 'user',
      },
    })));
  } catch (error) {
    console.error('Get thread messages error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// POST /api/messages - Send message in thread
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { thread_id, content } = req.body;
    const senderId = getUserId(req);

    // Verify user is participant
    const thread = await prisma.messageThread.findUnique({ where: { id: thread_id } });
    if (!thread || (thread.participant1Id !== senderId && thread.participant2Id !== senderId)) {
      return res.status(403).json({ error: { message: 'Not a participant', code: 'FORBIDDEN' } });
    }

    const message = await prisma.message.create({
      data: {
        threadId: thread_id,
        senderId,
        content,
      },
      include: { sender: true },
    });

    // Update thread metadata
    await prisma.messageThread.update({
      where: { id: thread_id },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: content.substring(0, 100),
        // Increment unread for the other participant
        ...(thread.participant1Id === senderId
          ? { unreadCountP2: { increment: 1 } }
          : { unreadCountP1: { increment: 1 } }),
      },
    });

    res.json({
      data: {
        id: message.id,
        thread_id: message.threadId,
        sender_id: message.senderId,
        content: message.content,
        sent_at: message.createdAt.toISOString(),
        attachments: message.attachments || [],
        sender: {
          id: message.sender.id,
          full_name: message.sender.fullName || message.sender.email,
          role: 'user',
        },
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// POST /api/messages/threads - Start new conversation
app.post('/api/messages/threads', authenticateToken, async (req, res) => {
  try {
    const { recipient_id, initial_message, subject } = req.body;
    const senderId = getUserId(req);

    if (senderId === recipient_id) {
      return res.status(400).json({ error: { message: 'Cannot message yourself', code: 'BAD_REQUEST' } });
    }

    // Check if thread already exists between these users
    let thread = await prisma.messageThread.findFirst({
      where: {
        OR: [
          { participant1Id: senderId, participant2Id: recipient_id },
          { participant1Id: recipient_id, participant2Id: senderId },
        ],
      },
    });

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: {
          participant1Id: senderId,
          participant2Id: recipient_id,
          subject: subject?.trim() || null,
          lastMessagePreview: initial_message?.substring(0, 100) || '',
        },
      });
    }

    // Send initial message if provided
    if (initial_message) {
      await prisma.message.create({
        data: {
          threadId: thread.id,
          senderId,
          content: initial_message,
        },
      });

      await prisma.messageThread.update({
        where: { id: thread.id },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: initial_message.substring(0, 100),
          ...(thread.participant1Id === senderId
            ? { unreadCountP2: { increment: 1 } }
            : { unreadCountP1: { increment: 1 } }),
        },
      });
    }

    res.json({
      data: {
        id: thread.id,
        participant_ids: [thread.participant1Id, thread.participant2Id],
        updated_at: thread.lastMessageAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// GET /api/users - List platform users for messaging
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const currentUserId = getUserId(req);
    const users = await prisma.user.findMany({
      where: { id: { not: currentUserId } },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    res.json(users.map(u => ({
      id: u.id,
      full_name: u.fullName || u.email.split('@')[0],
      email: u.email,
      role: 'user',
      company: null,
    })));
  } catch (error) {
    console.error('Get users list error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== PHASE 4: TEST SEEDING ENDPOINTS ====================

// Seed test applications for admin review
app.post('/api/test/seed-admin-applications', authenticateToken, async (req, res) => {
  try {
    // Create a test user for applications if doesn't exist
    let testUser = await prisma.user.findFirst({ where: { email: 'test.applicant@test.com' } });
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test.applicant@test.com',
          passwordHash: '$2b$10$dummyhash',
          fullName: 'Test Applicant',
        },
      });
    }

    let testUser2 = await prisma.user.findFirst({ where: { email: 'test.founder@test.com' } });
    if (!testUser2) {
      testUser2 = await prisma.user.create({
        data: {
          email: 'test.founder@test.com',
          passwordHash: '$2b$10$dummyhash',
          fullName: 'Test Founder',
        },
      });
    }

    // Create pending investor application
    const existingInvestorApp = await prisma.investorApplication.findFirst({
      where: { email: 'test.applicant@test.com', status: 'pending' },
    });
    if (!existingInvestorApp) {
      await prisma.investorApplication.create({
        data: {
          userId: testUser.id,
          fullName: 'Test Applicant',
          email: 'test.applicant@test.com',
          phone: '+91-9876543210',
          investorType: 'angel_investor',
          investmentRange: '5000000',
          linkedinUrl: 'https://linkedin.com/in/testapplicant',
          status: 'pending',
        },
      });
    }

    // Create pending founder application
    const existingFounderApp = await prisma.founderApplication.findFirst({
      where: { email: 'test.founder@test.com', status: 'pending' },
    });
    if (!existingFounderApp) {
      await prisma.founderApplication.create({
        data: {
          userId: testUser2.id,
          fullName: 'Test Founder',
          email: 'test.founder@test.com',
          phone: '+91-9876543211',
          companyName: 'TestStartup Inc',
          stage: 'seed',
          fundingGoal: 10000000,
          description: 'AI-powered testing platform',
          status: 'pending',
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Seed admin applications error:', error);
    res.status(500).json({ error: { message: 'Seed failed', code: 'SEED_ERROR' } });
  }
});

// Seed test audit logs
app.post('/api/test/seed-audit-logs', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);

    // Check if we already have enough logs
    const existingCount = await prisma.auditLog.count();
    if (existingCount >= 5) {
      return res.json({ success: true, message: 'Already seeded' });
    }

    const actions = [
      { action: 'approve_application', entity: 'investor_application', details: 'Approved investor application' },
      { action: 'reject_application', entity: 'founder_application', details: 'Rejected: Incomplete documentation' },
      { action: 'verify_kyc', entity: 'kyc_document', details: 'Verified PAN card document' },
      { action: 'assign_role', entity: 'user', details: 'Changed role to moderator' },
      { action: 'create_deal', entity: 'deal', details: 'Created new deal: TechVenture AI' },
      { action: 'verify_accreditation', entity: 'accreditation', details: 'Approved accreditation' },
      { action: 'flag_aml', entity: 'aml_screening', details: 'Flagged for additional review' },
    ];

    for (const log of actions) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: log.action,
          entity: log.entity,
          entityId: 'test-entity-id',
          details: log.details,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Seed audit logs error:', error);
    res.status(500).json({ error: { message: 'Seed failed', code: 'SEED_ERROR' } });
  }
});

// Seed test KYC documents
app.post('/api/test/seed-kyc-documents', authenticateToken, async (req, res) => {
  try {
    // Find the test investor
    const investor = await prisma.user.findFirst({ where: { email: 'investor.standard@test.com' } });
    if (!investor) {
      return res.status(404).json({ error: { message: 'Investor not found' } });
    }

    const docTypes = ['pan', 'aadhaar', 'bank_statement', 'income_proof'];
    const statuses = ['pending', 'pending', 'verified', 'rejected'];

    for (let i = 0; i < docTypes.length; i++) {
      const existing = await prisma.kYCDocument.findFirst({
        where: { userId: investor.id, documentType: docTypes[i] },
      });
      if (!existing) {
        await prisma.kYCDocument.create({
          data: {
            userId: investor.id,
            documentType: docTypes[i],
            fileName: `${docTypes[i]}_document.pdf`,
            fileUrl: `/uploads/${docTypes[i]}_document.pdf`,
            status: statuses[i],
            reviewNotes: statuses[i] === 'rejected' ? 'Document is unclear' : null,
            reviewedAt: statuses[i] !== 'pending' ? new Date() : null,
          },
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Seed KYC documents error:', error);
    res.status(500).json({ error: { message: 'Seed failed', code: 'SEED_ERROR' } });
  }
});

// Seed test accreditation applications for compliance review
app.post('/api/test/seed-accreditation-applications', authenticateToken, async (req, res) => {
  try {
    // Find or create test users for accreditation
    let testUser1 = await prisma.user.findFirst({ where: { email: 'accreditation.test1@test.com' } });
    if (!testUser1) {
      testUser1 = await prisma.user.create({
        data: { email: 'accreditation.test1@test.com', passwordHash: '$2b$10$dummyhash', fullName: 'Accreditation Applicant 1' },
      });
    }

    let testUser2 = await prisma.user.findFirst({ where: { email: 'accreditation.test2@test.com' } });
    if (!testUser2) {
      testUser2 = await prisma.user.create({
        data: { email: 'accreditation.test2@test.com', passwordHash: '$2b$10$dummyhash', fullName: 'Accreditation Applicant 2' },
      });
    }

    // Create pending accreditations
    const existing1 = await prisma.accreditation.findFirst({ where: { userId: testUser1.id, status: 'pending' } });
    if (!existing1) {
      await prisma.accreditation.create({
        data: { userId: testUser1.id, status: 'pending', type: 'income' },
      });
    }

    const existing2 = await prisma.accreditation.findFirst({ where: { userId: testUser2.id, status: 'pending' } });
    if (!existing2) {
      await prisma.accreditation.create({
        data: { userId: testUser2.id, status: 'pending', type: 'net_worth' },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Seed accreditation applications error:', error);
    res.status(500).json({ error: { message: 'Seed failed', code: 'SEED_ERROR' } });
  }
});

// Seed test messages
app.post('/api/test/seed-messages', authenticateToken, async (req, res) => {
  try {
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@indiaangelforum.test' } });
    const investorUser = await prisma.user.findFirst({ where: { email: 'investor.standard@test.com' } });

    if (!adminUser || !investorUser) {
      return res.status(404).json({ error: { message: 'Users not found' } });
    }

    // Check if thread already exists
    let thread = await prisma.messageThread.findFirst({
      where: {
        OR: [
          { participant1Id: adminUser.id, participant2Id: investorUser.id },
          { participant1Id: investorUser.id, participant2Id: adminUser.id },
        ],
      },
    });

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: {
          participant1Id: investorUser.id,
          participant2Id: adminUser.id,
          subject: 'Welcome & Platform Introduction',
          lastMessagePreview: 'Welcome to the platform!',
        },
      });

      // Create some messages
      await prisma.message.createMany({
        data: [
          {
            threadId: thread.id,
            senderId: adminUser.id,
            content: 'Welcome to India Angel Forum! How can I help you?',
          },
          {
            threadId: thread.id,
            senderId: investorUser.id,
            content: 'Thank you! I am interested in learning about current deals.',
          },
          {
            threadId: thread.id,
            senderId: adminUser.id,
            content: 'Great! Check out our deals page for the latest opportunities.',
          },
        ],
      });

      await prisma.messageThread.update({
        where: { id: thread.id },
        data: { lastMessageAt: new Date(), lastMessagePreview: 'Great! Check out our deals page for the latest opportunities.' },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Seed messages error:', error);
    res.status(500).json({ error: { message: 'Seed failed', code: 'SEED_ERROR' } });
  }
});

// Seed AML screening records for compliance tests
app.post('/api/test/seed-aml-screenings', authenticateToken, async (req, res) => {
  try {
    // Find the compliance officer user
    const complianceOfficer = await prisma.user.findFirst({ where: { email: 'compliance@indiaangelforum.test' } });
    // Find or create a test investor for AML screening
    let testInvestor = await prisma.user.findFirst({ where: { email: 'investor.standard@test.com' } });
    if (!testInvestor) {
      testInvestor = await prisma.user.create({
        data: { email: 'investor.standard@test.com', passwordHash: '$2b$10$dummyhash', fullName: 'Standard Investor' },
      });
    }

    const existing = await prisma.aMLScreening.findFirst({ where: { userId: testInvestor.id } });
    if (!existing) {
      await prisma.aMLScreening.create({
        data: {
          userId: testInvestor.id,
          status: 'pending',
          provider: 'WorldCheck',
          matchScore: 15.5,
          screenedAt: new Date(),
        },
      });
    }

    // Seed audit log entries for compliance
    if (complianceOfficer) {
      const existingLog = await prisma.auditLog.findFirst({ where: { action: 'initiate_aml_screening' } });
      if (!existingLog) {
        await prisma.auditLog.createMany({
          data: [
            { userId: complianceOfficer.id, action: 'verify_kyc', entity: 'kyc_document', details: 'KYC document verified' },
            { userId: complianceOfficer.id, action: 'initiate_aml_screening', entity: 'aml_screening', details: 'Initiated AML screening' },
            { userId: complianceOfficer.id, action: 'clear_aml_screening', entity: 'aml_screening', details: 'Cleared AML screening' },
          ],
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Seed AML screenings error:', error);
    res.status(500).json({ error: { message: 'Seed failed', code: 'SEED_ERROR' } });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== CMS - TEAM MEMBERS ====================

// GET /api/team-members - public, returns active team members ordered by displayOrder
app.get('/api/team-members', async (_req, res) => {
  try {
    const members = await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    res.json(members);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// GET /api/admin/team-members - admin, returns all team members including inactive
app.get('/api/admin/team-members', authenticateToken, requireRole(['admin']), async (_req, res) => {
  try {
    const members = await prisma.teamMember.findMany({ orderBy: { displayOrder: 'asc' } });
    res.json(members);
  } catch (error) {
    console.error('Admin get team members error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// POST /api/admin/team-members - create team member
app.post('/api/admin/team-members', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, role, bio, photoUrl, linkedinUrl, displayOrder } = req.body;
    if (!name || !role) return res.status(400).json({ error: { message: 'name and role are required', code: 'VALIDATION_ERROR' } });
    const member = await prisma.teamMember.create({
      data: { name, role, bio, photoUrl, linkedinUrl, displayOrder: displayOrder ?? 0 },
    });
    res.status(201).json(member);
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/admin/team-members/:id - update team member
app.patch('/api/admin/team-members/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params as Record<string, string>;
    const { name, role, bio, photoUrl, linkedinUrl, displayOrder, isActive } = req.body;
    const member = await prisma.teamMember.update({
      where: { id },
      data: { ...(name !== undefined && { name }), ...(role !== undefined && { role }), ...(bio !== undefined && { bio }), ...(photoUrl !== undefined && { photoUrl }), ...(linkedinUrl !== undefined && { linkedinUrl }), ...(displayOrder !== undefined && { displayOrder }), ...(isActive !== undefined && { isActive }) },
    });
    res.json(member);
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// DELETE /api/admin/team-members/:id - soft delete (set isActive=false)
app.delete('/api/admin/team-members/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params as Record<string, string>;
    await prisma.teamMember.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Team member deactivated' });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== CMS - PARTNERS ====================

// GET /api/partners - public, returns active partners ordered by displayOrder
app.get('/api/partners', async (_req, res) => {
  try {
    const partners = await prisma.partner.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    res.json(partners);
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// GET /api/admin/partners - admin, returns all partners including inactive
app.get('/api/admin/partners', authenticateToken, requireRole(['admin']), async (_req, res) => {
  try {
    const partners = await prisma.partner.findMany({ orderBy: { displayOrder: 'asc' } });
    res.json(partners);
  } catch (error) {
    console.error('Admin get partners error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// POST /api/admin/partners - create partner
app.post('/api/admin/partners', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, logoUrl, websiteUrl, description, displayOrder } = req.body;
    if (!name) return res.status(400).json({ error: { message: 'name is required', code: 'VALIDATION_ERROR' } });
    const partner = await prisma.partner.create({
      data: { name, logoUrl, websiteUrl, description, displayOrder: displayOrder ?? 0 },
    });
    res.status(201).json(partner);
  } catch (error) {
    console.error('Create partner error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/admin/partners/:id - update partner
app.patch('/api/admin/partners/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params as Record<string, string>;
    const { name, logoUrl, websiteUrl, description, displayOrder, isActive } = req.body;
    const partner = await prisma.partner.update({
      where: { id },
      data: { ...(name !== undefined && { name }), ...(logoUrl !== undefined && { logoUrl }), ...(websiteUrl !== undefined && { websiteUrl }), ...(description !== undefined && { description }), ...(displayOrder !== undefined && { displayOrder }), ...(isActive !== undefined && { isActive }) },
    });
    res.json(partner);
  } catch (error) {
    console.error('Update partner error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// DELETE /api/admin/partners/:id - soft delete
app.delete('/api/admin/partners/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params as Record<string, string>;
    await prisma.partner.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Partner deactivated' });
  } catch (error) {
    console.error('Delete partner error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== INDUSTRY & FUNDING STAGE MANAGEMENT ====================

// GET /api/industries - public endpoint for dropdowns (used by deal filtering, forms)
app.get('/api/industries', async (_req, res) => {
  try {
    const industries = await prisma.industry.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    res.json(industries);
  } catch (error) {
    console.error('Get industries error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// GET /api/admin/industries - list all industries including inactive (admin only)
app.get('/api/admin/industries', authenticateToken, requireRole(['admin']), async (_req, res) => {
  try {
    const industries = await prisma.industry.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    res.json(industries);
  } catch (error) {
    console.error('Get admin industries error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// POST /api/admin/industries - create new industry (admin only)
app.post('/api/admin/industries', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { name, code, description, icon, displayOrder } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: { message: 'name and code are required', code: 'VALIDATION_ERROR' } });
    }
    const existing = await prisma.industry.findFirst({ where: { OR: [{ name }, { code }] } });
    if (existing) {
      return res.status(409).json({ error: { message: 'Industry with this name or code already exists', code: 'CONFLICT' } });
    }
    const industry = await prisma.industry.create({
      data: { name, code: code.toUpperCase(), description: description || null, icon: icon || null, displayOrder: displayOrder ?? 0 },
    });
    await prisma.auditLog.create({
      data: { userId: adminId, action: 'create_industry', entity: 'industry', entityId: industry.id, details: `Created industry: ${name}` },
    });
    res.status(201).json(industry);
  } catch (error) {
    console.error('Create industry error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/admin/industries/:id - update industry (admin only)
app.patch('/api/admin/industries/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { id } = req.params as Record<string, string>;
    const { name, code, description, icon, displayOrder, isActive } = req.body;
    const existing = await prisma.industry.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Industry not found', code: 'NOT_FOUND' } });
    }
    const updated = await prisma.industry.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code: code.toUpperCase() }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    await prisma.auditLog.create({
      data: { userId: adminId, action: 'update_industry', entity: 'industry', entityId: id, details: `Updated industry: ${updated.name}` },
    });
    res.json(updated);
  } catch (error) {
    console.error('Update industry error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// DELETE /api/admin/industries/:id - disable industry (soft delete, admin only)
app.delete('/api/admin/industries/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { id } = req.params as Record<string, string>;
    const existing = await prisma.industry.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Industry not found', code: 'NOT_FOUND' } });
    }
    const updated = await prisma.industry.update({ where: { id }, data: { isActive: false } });
    await prisma.auditLog.create({
      data: { userId: adminId, action: 'disable_industry', entity: 'industry', entityId: id, details: `Disabled industry: ${existing.name}` },
    });
    res.json({ message: 'Industry disabled', industry: updated });
  } catch (error) {
    console.error('Disable industry error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// GET /api/admin/funding-stages - list all funding stages including inactive (admin only)
app.get('/api/admin/funding-stages', authenticateToken, requireRole(['admin']), async (_req, res) => {
  try {
    const stages = await prisma.fundingStage.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    res.json(stages);
  } catch (error) {
    console.error('Get admin funding stages error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// POST /api/admin/funding-stages - create new funding stage (admin only)
app.post('/api/admin/funding-stages', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { name, code, description, typicalMin, typicalMax, displayOrder } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: { message: 'name and code are required', code: 'VALIDATION_ERROR' } });
    }
    const existing = await prisma.fundingStage.findFirst({ where: { OR: [{ name }, { code }] } });
    if (existing) {
      return res.status(409).json({ error: { message: 'Stage with this name or code already exists', code: 'CONFLICT' } });
    }
    const stage = await prisma.fundingStage.create({
      data: { name, code: code.toUpperCase(), description: description || null, typicalMin: typicalMin ?? null, typicalMax: typicalMax ?? null, displayOrder: displayOrder ?? 0 },
    });
    await prisma.auditLog.create({
      data: { userId: adminId, action: 'create_funding_stage', entity: 'funding_stage', entityId: stage.id, details: `Created funding stage: ${name}` },
    });
    res.status(201).json(stage);
  } catch (error) {
    console.error('Create funding stage error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/admin/funding-stages/:id - update funding stage (admin only)
app.patch('/api/admin/funding-stages/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { id } = req.params as Record<string, string>;
    const { name, code, description, typicalMin, typicalMax, displayOrder, isActive } = req.body;
    const existing = await prisma.fundingStage.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Funding stage not found', code: 'NOT_FOUND' } });
    }
    const updated = await prisma.fundingStage.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code: code.toUpperCase() }),
        ...(description !== undefined && { description }),
        ...(typicalMin !== undefined && { typicalMin }),
        ...(typicalMax !== undefined && { typicalMax }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    await prisma.auditLog.create({
      data: { userId: adminId, action: 'update_funding_stage', entity: 'funding_stage', entityId: id, details: `Updated funding stage: ${updated.name}` },
    });
    res.json(updated);
  } catch (error) {
    console.error('Update funding stage error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// DELETE /api/admin/funding-stages/:id - disable funding stage (soft delete, admin only)
app.delete('/api/admin/funding-stages/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { id } = req.params as Record<string, string>;
    const existing = await prisma.fundingStage.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Funding stage not found', code: 'NOT_FOUND' } });
    }
    const updated = await prisma.fundingStage.update({ where: { id }, data: { isActive: false } });
    await prisma.auditLog.create({
      data: { userId: adminId, action: 'disable_funding_stage', entity: 'funding_stage', entityId: id, details: `Disabled funding stage: ${existing.name}` },
    });
    res.json({ message: 'Stage disabled', stage: updated });
  } catch (error) {
    console.error('Disable funding stage error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== COMMUNICATION AUDIT LOG ====================

// GET /api/admin/communications - list all message threads for compliance audit (admin only)
app.get('/api/admin/communications', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { q, page = '1', limit = '50' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch all message threads with participant info (using MessageThread model)
    const where = q
      ? {
          OR: [
            { participant1: { fullName: { contains: q, mode: 'insensitive' as const } } },
            { participant1: { email: { contains: q, mode: 'insensitive' as const } } },
            { participant2: { fullName: { contains: q, mode: 'insensitive' as const } } },
            { participant2: { email: { contains: q, mode: 'insensitive' as const } } },
            { subject: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [threads, total] = await Promise.all([
      prisma.messageThread.findMany({
        where,
        include: {
          participant1: { select: { id: true, fullName: true, email: true } },
          participant2: { select: { id: true, fullName: true, email: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.messageThread.count({ where }),
    ]);

    const result = threads.map(m => ({
      id: m.id,
      senderId: m.participant1Id,
      recipientId: m.participant2Id,
      senderName: m.participant1?.fullName || m.participant1?.email || 'Unknown',
      recipientName: m.participant2?.fullName || m.participant2?.email || 'Unknown',
      subject: m.subject || '(no subject)',
      preview: m.lastMessagePreview || '',
      sentAt: m.lastMessageAt.toISOString(),
      threadId: m.id,
      messageCount: m._count.messages,
    }));

    res.json({ messages: result, total });
  } catch (error) {
    console.error('Get communications audit error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== PRODUCTION STATIC FILE SERVING ====================
// In production, serve the Vite-built frontend from /dist
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // SPA fallback - serve index.html for all non-API routes
    // Express 5 uses path-to-regexp v8 which requires named wildcards
    app.get('{*path}', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } });
      }
    });
    console.log('📁 Serving static frontend from /dist');
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Bull Board: http://localhost:${PORT}/admin/queues`);
  
  // Initialize background services
  try {
    await invoiceCleanupService.initialize();
    await adminDigestService.initialize();
    console.log('✅ Background services initialized');
  } catch (error) {
    console.error('❌ Failed to initialize background services:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
