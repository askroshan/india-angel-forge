import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../server';

const router = express.Router();
const prisma = new PrismaClient();

// Get founder application status
router.get('/founder-application', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const application = await prisma.founderApplication.findUnique({
      where: { userId },
    });

    if (!application) {
      return res.json({ status: 'not_submitted' });
    }

    res.json(application);
  } catch (error) {
    console.error('Get founder application error:', error);
    res.status(500).json({ error: 'Failed to get application' });
  }
});

// Submit founder application
router.post('/founder-application', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      fullName,
      email,
      phone,
      linkedinProfile,
      companyName,
      companyDescription,
      industry,
      pitchDeckUrl,
      fundingStage,
      fundingAmount,
    } = req.body;

    const application = await prisma.founderApplication.upsert({
      where: { userId },
      update: {
        fullName,
        email,
        phone,
        linkedinProfile,
        companyName,
        companyDescription,
        industry,
        pitchDeckUrl,
        fundingStage,
        fundingAmount,
        submittedAt: new Date(),
        status: 'pending_review',
      },
      create: {
        userId,
        fullName,
        email,
        phone,
        linkedinProfile,
        companyName,
        companyDescription,
        industry,
        pitchDeckUrl,
        fundingStage,
        fundingAmount,
        submittedAt: new Date(),
        status: 'pending_review',
      },
    });

    res.json(application);
  } catch (error) {
    console.error('Submit founder application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get investor application status
router.get('/investor-application', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const application = await prisma.investorApplication.findUnique({
      where: { userId },
    });

    if (!application) {
      return res.json({ status: 'not_submitted' });
    }

    res.json(application);
  } catch (error) {
    console.error('Get investor application error:', error);
    res.status(500).json({ error: 'Failed to get application' });
  }
});

// Submit investor application
router.post('/investor-application', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      fullName,
      email,
      phone,
      linkedinProfile,
      investmentCapacity,
      investmentFocus,
      accreditationStatus,
    } = req.body;

    const application = await prisma.investorApplication.upsert({
      where: { userId },
      update: {
        fullName,
        email,
        phone,
        linkedinProfile,
        investmentCapacity,
        investmentFocus,
        accreditationStatus: accreditationStatus || 'pending',
        submittedAt: new Date(),
        status: 'pending_review',
      },
      create: {
        userId,
        fullName,
        email,
        phone,
        linkedinProfile,
        investmentCapacity,
        investmentFocus,
        accreditationStatus: accreditationStatus || 'pending',
        submittedAt: new Date(),
        status: 'pending_review',
      },
    });

    res.json(application);
  } catch (error) {
    console.error('Submit investor application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get all applications (admin only)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { type, status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    if (type === 'founder' || !type) {
      const where: any = {};
      if (status && status !== 'all') {
        where.status = status;
      }

      const [founders, total] = await Promise.all([
        prisma.founderApplication.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { submittedAt: 'desc' },
        }),
        prisma.founderApplication.count({ where }),
      ]);

      return res.json({
        type: 'founder',
        applications: founders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    }

    if (type === 'investor') {
      const where: any = {};
      if (status && status !== 'all') {
        where.status = status;
      }

      const [investors, total] = await Promise.all([
        prisma.investorApplication.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { submittedAt: 'desc' },
        }),
        prisma.investorApplication.count({ where }),
      ]);

      return res.json({
        type: 'investor',
        applications: investors,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    }

    res.status(400).json({ error: 'Invalid type' });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

// Update application status (admin only)
router.patch('/:type/:applicationId/status', authenticateToken, async (req, res) => {
  try {
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { type, applicationId } = req.params;
    const { status } = req.body;

    if (type === 'founder') {
      const updated = await prisma.founderApplication.update({
        where: { id: applicationId },
        data: { status },
      });
      return res.json(updated);
    }

    if (type === 'investor') {
      const updated = await prisma.investorApplication.update({
        where: { id: applicationId },
        data: { status },
      });
      return res.json(updated);
    }

    res.status(400).json({ error: 'Invalid type' });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
