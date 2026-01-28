import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../server';
import { upload, deleteFile } from '@/lib/storage';

const router = express.Router();
const prisma = new PrismaClient();

// Get shared documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sharedWith } = req.query;

    let documents;

    if (sharedWith === 'investor') {
      // Get documents shared with this investor
      documents = await prisma.sharedDocument.findMany({
        where: { sharedWithId: userId },
        orderBy: { sharedAt: 'desc' },
        include: {
          sharedBy: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      });
    } else {
      // Get documents shared by this user (founder)
      documents = await prisma.sharedDocument.findMany({
        where: { sharedById: userId },
        orderBy: { sharedAt: 'desc' },
        include: {
          sharedWith: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      });
    }

    res.json(documents);
  } catch (error) {
    console.error('Get shared documents error:', error);
    res.status(500).json({ error: 'Failed to get shared documents' });
  }
});

// Share document
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const sharedById = req.user.userId;
    const { sharedWithId, title, description, documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const document = await prisma.sharedDocument.create({
      data: {
        sharedById,
        sharedWithId,
        title,
        description,
        documentType,
        filePath: req.file.filename,
        fileSize: req.file.size,
        sharedAt: new Date(),
      },
    });

    res.json(document);
  } catch (error) {
    console.error('Share document error:', error);
    res.status(500).json({ error: 'Failed to share document' });
  }
});

// Delete shared document
router.delete('/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.userId;

    const document = await prisma.sharedDocument.findUnique({
      where: { id: documentId },
    });

    if (!document || document.sharedById !== userId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from storage
    if (document.filePath) {
      await deleteFile(document.filePath);
    }

    await prisma.sharedDocument.delete({
      where: { id: documentId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete shared document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Get investor directory (for founders to find investors)
router.get('/investors', authenticateToken, async (req, res) => {
  try {
    const { search, focus, capacity } = req.query;

    const where: any = {
      status: 'approved',
    };

    if (search) {
      where.OR = [
        { fullName: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (focus) {
      where.investmentFocus = { contains: String(focus), mode: 'insensitive' };
    }

    if (capacity) {
      where.investmentCapacity = String(capacity);
    }

    const investors = await prisma.investorApplication.findMany({
      where,
      select: {
        userId: true,
        fullName: true,
        investmentCapacity: true,
        investmentFocus: true,
        linkedinProfile: true,
      },
      take: 50,
    });

    res.json(investors);
  } catch (error) {
    console.error('Get investors error:', error);
    res.status(500).json({ error: 'Failed to get investors' });
  }
});

export default router;
