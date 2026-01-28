import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../server';
import { upload, deleteFile } from '@/lib/storage';

const router = express.Router();
const prisma = new PrismaClient();

// Get pitch sessions for founder
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const sessions = await prisma.pitchSession.findMany({
      where: { founderId: userId },
      orderBy: { scheduledDate: 'desc' },
    });

    res.json(sessions);
  } catch (error) {
    console.error('Get pitch sessions error:', error);
    res.status(500).json({ error: 'Failed to get pitch sessions' });
  }
});

// Create pitch session
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const founderId = req.user.userId;
    const { investorId, scheduledDate, duration, meetingLink, notes } = req.body;

    const session = await prisma.pitchSession.create({
      data: {
        founderId,
        investorId,
        scheduledDate: new Date(scheduledDate),
        duration,
        meetingLink,
        notes,
        status: 'scheduled',
      },
    });

    res.json(session);
  } catch (error) {
    console.error('Create pitch session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update pitch session
router.patch('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, notes, outcome } = req.body;

    const session = await prisma.pitchSession.update({
      where: { id: sessionId },
      data: {
        ...(status && { status }),
        ...(notes && { notes }),
        ...(outcome && { outcome }),
      },
    });

    res.json(session);
  } catch (error) {
    console.error('Update pitch session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Get pitch materials for founder
router.get('/materials', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const materials = await prisma.pitchMaterial.findMany({
      where: { founderId: userId },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(materials);
  } catch (error) {
    console.error('Get pitch materials error:', error);
    res.status(500).json({ error: 'Failed to get pitch materials' });
  }
});

// Upload pitch material
router.post('/materials', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const founderId = req.user.userId;
    const { materialType, title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const material = await prisma.pitchMaterial.create({
      data: {
        founderId,
        materialType,
        title,
        description,
        filePath: req.file.filename,
        fileSize: req.file.size,
        uploadedAt: new Date(),
      },
    });

    res.json(material);
  } catch (error) {
    console.error('Upload pitch material error:', error);
    res.status(500).json({ error: 'Failed to upload material' });
  }
});

// Delete pitch material
router.delete('/materials/:materialId', authenticateToken, async (req, res) => {
  try {
    const { materialId } = req.params;
    const userId = req.user.userId;

    const material = await prisma.pitchMaterial.findUnique({
      where: { id: materialId },
    });

    if (!material || material.founderId !== userId) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Delete file from storage
    if (material.filePath) {
      await deleteFile(material.filePath);
    }

    await prisma.pitchMaterial.delete({
      where: { id: materialId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete pitch material error:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

export default router;
