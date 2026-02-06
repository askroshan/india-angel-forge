/**
 * India Angel Forum - Backend API Server
 * Express.js server with PostgreSQL via Prisma
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { emailService } from './server/services/email.service';
import { invoiceService } from './server/services/invoice.service';
import { invoiceQueueService } from './server/services/invoice-queue.service';
import { invoiceCleanupService } from './server/services/invoice-cleanup.service';
import { adminDigestService } from './server/services/admin-digest.service';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bull';
import { ExpressAdapter } from '@bull-board/express';
import paymentsHistoryRouter from './server/routes/payments-history';
import eventAttendanceRouter from './server/routes/event-attendance';
import certificatesRouter from './server/routes/certificates';

dotenv.config();

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { userId: string; email: string; roles?: string[] };
}

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.API_PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

// Middleware
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

    res.json({
      data: {
        token,
        user: { id: user.id, email: user.email, fullName: user.fullName },
      },
      error: null,
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
      createdAt: u.createdAt,
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== EVENTS ROUTES (PUBLIC) ====================

app.get('/api/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { eventDate: 'asc' },
    });
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
    res.json(registrations);
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
      include: { registrations: true },
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

// ==================== DEALS ROUTES ====================

app.get('/api/deals', authenticateToken, async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(deals);
  } catch (error) {
    console.error('Get deals error:', error);
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
    res.json(interests);
  } catch (error) {
    console.error('Get deal interests error:', error);
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
    res.json(deal);
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
      application_id: req.params.id,
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

// ==================== COMPLIANCE ROUTES ====================

app.get('/api/compliance/kyc-review', authenticateToken, requireRole(['compliance_officer', 'admin']), async (req, res) => {
  try {
    const kycDocuments = await prisma.kYCDocument.findMany({
      include: { user: true },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(kycDocuments);
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
    res.json(screenings);
  } catch (error) {
    console.error('Get AML screenings error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.put('/api/compliance/aml-screening/:id', authenticateToken, requireRole(['compliance_officer', 'admin']), async (req, res) => {
  try {
    const { status, riskLevel, notes } = req.body;
    const reviewedBy = getUserId(req);
    
    const screening = await prisma.aMLScreening.update({
      where: { id: String(req.params.id) },
      data: { 
        status, 
        riskLevel,
        reviewNotes: notes,
        reviewedBy,
        reviewedAt: new Date(),
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
    const userId = getUserId(req);
    const accreditation = await prisma.accreditation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(accreditation || { status: 'not_started' });
  } catch (error) {
    console.error('Get accreditation error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== KYC DOCUMENTS ROUTES ====================

app.get('/api/kyc/documents', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const documents = await prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(documents);
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
    
    // Get companies the user has invested in
    const commitments = await prisma.commitment.findMany({
      where: { userId, status: 'completed' },
      include: { deal: true },
    });
    
    const companies = commitments.map(c => ({
      id: c.deal.id,
      name: c.deal.companyName,
      sector: c.deal.sector,
      investmentAmount: c.amount,
      investmentDate: c.createdAt,
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
    res.json(updates);
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

app.get('/api/admin/audit-logs', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(logs);
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
      include: { roles: true },
    });
    res.json(investors.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      roles: u.roles.map(r => r.role),
      createdAt: u.createdAt,
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

// ==================== EVENT CRUD ROUTES (ADMIN) ====================

// Get all events (admin)
app.get('/api/admin/events', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: { registrations: true, waitlist: true }
        }
      },
      orderBy: { eventDate: 'desc' },
    });
    res.json(events);
  } catch (error) {
    console.error('Get admin events error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Create event (admin)
app.post('/api/admin/events', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
  try {
    const { title, description, eventDate, location, capacity, registrationDeadline, status } = req.body;
    
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
    const { title, description, eventDate, location, capacity, registrationDeadline, status } = req.body;
    
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (eventDate !== undefined) updateData.eventDate = new Date(eventDate);
    if (location !== undefined) updateData.location = location;
    if (capacity !== undefined) updateData.capacity = capacity ? parseInt(capacity, 10) : null;
    if (registrationDeadline !== undefined) updateData.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
    if (status !== undefined) updateData.status = status;
    
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

// Get all event registrations (admin)
app.get('/api/admin/event-registrations', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
  try {
    const { eventId } = req.query;
    const where = eventId ? { eventId: eventId as string } : {};
    
    const registrations = await prisma.eventRegistration.findMany({
      where,
      include: {
        event: { select: { title: true, eventDate: true } },
        user: { select: { email: true, fullName: true } },
      },
      orderBy: { registeredAt: 'desc' },
    });
    res.json(registrations);
  } catch (error) {
    console.error('Get admin event registrations error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== EVENT REGISTRATION ROUTES (USER) ====================

// Register for an event
app.post('/api/events/register', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { eventId, fullName, email, phone, company, dietaryRequirements, notes } = req.body;
    
    if (!eventId || !fullName || !email) {
      return res.status(400).json({ error: { message: 'Event ID, full name, and email are required', code: 'VALIDATION_ERROR' } });
    }
    
    // Check if event exists and has capacity
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } },
    });
    
    if (!event) {
      return res.status(404).json({ error: { message: 'Event not found', code: 'NOT_FOUND' } });
    }
    
    // Check registration deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ error: { message: 'Registration deadline has passed', code: 'DEADLINE_PASSED' } });
    }
    
    // Check capacity
    if (event.capacity && event._count.registrations >= event.capacity) {
      return res.status(400).json({ error: { message: 'Event is at full capacity', code: 'CAPACITY_FULL' } });
    }
    
    // Check if already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    
    if (existingRegistration) {
      return res.status(400).json({ error: { message: 'You are already registered for this event', code: 'ALREADY_REGISTERED' } });
    }
    
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        fullName,
        email,
        phone,
        company,
        dietaryRequirements,
        notes,
      },
      include: { event: true },
    });
    
    res.status(201).json(registration);
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Cancel event registration
app.delete('/api/events/registrations/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: String(req.params.id) },
    });
    
    if (!registration) {
      return res.status(404).json({ error: { message: 'Registration not found', code: 'NOT_FOUND' } });
    }
    
    if (registration.userId !== userId) {
      return res.status(403).json({ error: { message: 'Not authorized to cancel this registration', code: 'FORBIDDEN' } });
    }
    
    await prisma.eventRegistration.delete({
      where: { id: String(req.params.id) },
    });
    
    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// Get registration count for an event (public)
app.get('/api/events/:id/registration-count', async (req, res) => {
  try {
    const count = await prisma.eventRegistration.count({
      where: { eventId: req.params.id },
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
      success: true,
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
    let invoicePath = '';
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

/**
 * GET /api/payments/history
 * Get payment history for authenticated user
 */
app.get('/api/payments/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ payments });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to retrieve payment history' });
  }
});

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
          jobId: job.id?.toString(),
          paymentId: job.data.paymentId,
          userId: job.data.userId,
          userEmail: user?.email || 'unknown',
          userName: user?.fullName || 'Unknown User',
          amount: job.data.totalAmount,
          attempts: job.attemptsMade,
          lastError: job.failedReason,
          failedAt: job.processedOn ? new Date(job.processedOn) : new Date(job.timestamp),
        };
      })
    );

    res.json({ failedInvoices });
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
    const { paymentId } = req.params;

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

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullAdapter(invoiceQueueService.getQueue())],
  serverAdapter: serverAdapter,
});

// Bull Board requires admin authentication
app.use('/admin/queues', authenticateToken, requireRole(['admin']), serverAdapter.getRouter());

// ==================== PAYMENTS HISTORY ROUTES ====================

app.use('/api/payments', paymentsHistoryRouter);

// ==================== EVENT ATTENDANCE ROUTES ====================

app.use('/api/events', eventAttendanceRouter);

// ==================== CERTIFICATE ROUTES ====================

app.use('/api/certificates', certificatesRouter);

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
