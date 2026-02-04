/**
 * India Angel Forum - Backend API Server
 * Express.js server with PostgreSQL via Prisma
 */

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.API_PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: { message: 'Access token required', code: 'UNAUTHORIZED' } });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: { message: 'Invalid token', code: 'FORBIDDEN' } });
    }
    (req as any).user = user;
    next();
  });
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
    const userId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;

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

app.get('/api/admin/users', authenticateToken, async (req, res) => {
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

// ==================== EVENTS ROUTES ====================

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

app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
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
    const userId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
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

app.get('/api/deals/:id', authenticateToken, async (req, res) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.id },
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

app.get('/api/deals/interests', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const interests = await prisma.dealInterest.findMany({
      where: { userId },
      include: { deal: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(interests);
  } catch (error) {
    console.error('Get deal interests error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== COMMITMENTS ROUTES ====================

app.get('/api/commitments', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
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

// ==================== COMPLIANCE ROUTES ====================

app.get('/api/compliance/kyc-review', authenticateToken, async (req, res) => {
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

app.put('/api/compliance/kyc-review/:id', authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const reviewedBy = (req as any).user.userId;
    
    const document = await prisma.kYCDocument.update({
      where: { id: req.params.id },
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

app.get('/api/compliance/aml-screening', authenticateToken, async (req, res) => {
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

app.put('/api/compliance/aml-screening/:id', authenticateToken, async (req, res) => {
  try {
    const { status, riskLevel, notes } = req.body;
    const reviewedBy = (req as any).user.userId;
    
    const screening = await prisma.aMLScreening.update({
      where: { id: req.params.id },
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
    const userId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
    
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
    const userId = (req as any).user.userId;
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
    const founderId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
    const materials = await prisma.pitchMaterial.findMany({
      where: { founderId: userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(materials);
  } catch (error) {
    console.error('Get pitch materials error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

app.post('/api/pitch/materials', authenticateToken, async (req, res) => {
  try {
    const founderId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
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
    const userId = (req as any).user.userId;
    const { roundType, targetAmount, raisedAmount, valuation, status } = req.body;
    
    const company = await prisma.company.findFirst({
      where: { founderId: userId },
    });
    
    if (!company) {
      return res.status(400).json({ error: { message: 'Company profile required', code: 'COMPANY_REQUIRED' } });
    }
    
    const round = await prisma.fundraisingRound.create({
      data: {
        companyId: company.id,
        roundType,
        targetAmount,
        raisedAmount: raisedAmount || 0,
        valuation,
        status: status || 'active',
      },
    });
    res.json(round);
  } catch (error) {
    console.error('Create fundraising round error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== ADMIN ROUTES ====================

app.get('/api/admin/audit-logs', authenticateToken, async (req, res) => {
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

app.get('/api/admin/investors', authenticateToken, async (req, res) => {
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
    const userId = (req as any).user.userId;
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

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
