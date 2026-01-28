import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../server';
import { upload } from '@/lib/storage';

const router = express.Router();
const prisma = new PrismaClient();

// Upload KYC document
router.post('/upload', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentType, status = 'pending' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create KYC submission record (using investor application as proxy)
    const submission = await prisma.investorApplication.upsert({
      where: { userId },
      update: {
        fullName: req.body.fullName || '',
        email: req.user.email,
        phone: req.body.phone || '',
        linkedinProfile: req.body.linkedinProfile || '',
        investmentCapacity: req.body.investmentCapacity || '',
        investmentFocus: req.body.investmentFocus || '',
        accreditationStatus: status,
        kycDocumentPath: req.file.filename,
        submittedAt: new Date(),
        status: 'pending_review',
      },
      create: {
        userId,
        fullName: req.body.fullName || '',
        email: req.user.email,
        phone: req.body.phone || '',
        linkedinProfile: req.body.linkedinProfile || '',
        investmentCapacity: req.body.investmentCapacity || '',
        investmentFocus: req.body.investmentFocus || '',
        accreditationStatus: status,
        kycDocumentPath: req.file.filename,
        submittedAt: new Date(),
        status: 'pending_review',
      },
    });

    res.json({
      id: submission.id,
      documentPath: req.file.filename,
      status: submission.accreditationStatus,
    });
  } catch (error) {
    console.error('KYC upload error:', error);
    res.status(500).json({ error: 'Failed to upload KYC document' });
  }
});

// Get user's KYC status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const application = await prisma.investorApplication.findUnique({
      where: { userId },
      select: {
        id: true,
        accreditationStatus: true,
        kycDocumentPath: true,
        submittedAt: true,
        status: true,
      },
    });

    if (!application) {
      return res.json({ status: 'not_submitted' });
    }

    res.json({
      id: application.id,
      kycStatus: application.accreditationStatus,
      documentPath: application.kycDocumentPath,
      submittedAt: application.submittedAt,
      reviewStatus: application.status,
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({ error: 'Failed to get KYC status' });
  }
});

// Get all KYC submissions (admin only)
router.get('/submissions', authenticateToken, async (req, res) => {
  try {
    // Check admin role
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status && status !== 'all') {
      where.accreditationStatus = status;
    }

    const [submissions, total] = await Promise.all([
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
          kycDocumentPath: true,
          submittedAt: true,
          status: true,
        },
      }),
      prisma.investorApplication.count({ where }),
    ]);

    res.json({
      submissions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

// Update KYC status (admin only)
router.patch('/:submissionId/status', authenticateToken, async (req, res) => {
  try {
    // Check admin role
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { submissionId } = req.params;
    const { accreditationStatus, reviewNotes } = req.body;

    const updated = await prisma.investorApplication.update({
      where: { id: submissionId },
      data: {
        accreditationStatus,
        status: accreditationStatus === 'verified' ? 'approved' : 'pending_review',
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update KYC status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
