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
