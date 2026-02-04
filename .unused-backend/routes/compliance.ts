import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../../server';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to check admin/compliance role
const requireCompliance = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user?.roles.includes('admin') && !req.user?.roles.includes('compliance')) {
    return res.status(403).json({ error: 'Compliance team access required' });
  }
  next();
};

// Get accreditation verifications
router.get('/accreditation', authenticateToken, requireCompliance, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status && status !== 'all') {
      where.accreditationStatus = status;
    }

    const [verifications, total] = await Promise.all([
      prisma.investorApplication.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          userId: true,
          fullName: true,
          email: true,
          phone: true,
          accreditationStatus: true,
          submittedAt: true,
          status: true,
        },
      }),
      prisma.investorApplication.count({ where }),
    ]);

    res.json({
      verifications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get accreditation error:', error);
    res.status(500).json({ error: 'Failed to get accreditation data' });
  }
});

// Update accreditation status
router.patch('/accreditation/:applicationId', authenticateToken, requireCompliance, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { accreditationStatus, notes } = req.body;

    const updated = await prisma.investorApplication.update({
      where: { id: applicationId },
      data: {
        accreditationStatus,
        status: accreditationStatus === 'verified' ? 'approved' : 'pending_review',
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update accreditation error:', error);
    res.status(500).json({ error: 'Failed to update accreditation' });
  }
});

// Get AML screening data
router.get('/aml-screening', authenticateToken, requireCompliance, async (req, res) => {
  try {
    const { riskLevel, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Using investor applications as proxy for AML screening
    // In production, create a dedicated aml_screening table
    const where: Record<string, unknown> = {};
    
    const [screenings, total] = await Promise.all([
      prisma.investorApplication.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          userId: true,
          fullName: true,
          email: true,
          accreditationStatus: true,
          submittedAt: true,
          status: true,
        },
      }),
      prisma.investorApplication.count({ where }),
    ]);

    // Format as AML screening data
    const formattedScreenings = screenings.map(screening => ({
      id: screening.id,
      userId: screening.userId,
      fullName: screening.fullName,
      email: screening.email,
      riskLevel: screening.accreditationStatus === 'verified' ? 'low' : 'medium',
      screeningStatus: screening.status,
      lastScreenedAt: screening.submittedAt,
      flags: [],
      verified: screening.accreditationStatus === 'verified',
    }));

    res.json({
      screenings: formattedScreenings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get AML screening error:', error);
    res.status(500).json({ error: 'Failed to get AML screening data' });
  }
});

// Update AML screening status
router.patch('/aml-screening/:userId', authenticateToken, requireCompliance, async (req, res) => {
  try {
    const { userId } = req.params;
    const { riskLevel, status, notes } = req.body;

    // Find user's application first
    const application = await prisma.investorApplication.findFirst({
      where: { userId },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Update investor application as proxy
    const updated = await prisma.investorApplication.update({
      where: { id: application.id },
      data: {
        accreditationStatus: riskLevel === 'low' ? 'verified' : 'pending',
        status: status || 'pending_review',
      },
    });

    res.json({
      userId: updated.userId,
      riskLevel,
      status: updated.status,
      verified: updated.accreditationStatus === 'verified',
    });
  } catch (error) {
    console.error('Update AML screening error:', error);
    res.status(500).json({ error: 'Failed to update AML screening' });
  }
});

// KYC Review endpoints
router.get('/kyc-review', authenticateToken, requireCompliance, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const [reviews, total] = await Promise.all([
      prisma.investorApplication.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          userId: true,
          fullName: true,
          email: true,
          phone: true,
          accreditationStatus: true,
          submittedAt: true,
          status: true,
        },
      }),
      prisma.investorApplication.count({ where }),
    ]);

    res.json({
      reviews,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get KYC review error:', error);
    res.status(500).json({ error: 'Failed to get KYC reviews' });
  }
});

// Approve/reject KYC
router.patch('/kyc-review/:applicationId', authenticateToken, requireCompliance, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, reviewNotes } = req.body;

    const updated = await prisma.investorApplication.update({
      where: { id: applicationId },
      data: {
        status,
        accreditationStatus: status === 'approved' ? 'verified' : 'pending',
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update KYC review error:', error);
    res.status(500).json({ error: 'Failed to update KYC review' });
  }
});

export default router;
