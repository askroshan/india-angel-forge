/**
 * CMS Routes - Team Members, Partners, and Event Startups
 * Admin-only CRUD with multer file upload support
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateUser, requireRoles } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed.'));
    }
  },
});

// ==================== TEAM MEMBERS ====================

// GET /api/team-members (public)
router.get('/team-members', async (_req: Request, res: Response) => {
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

// GET /api/admin/team-members (admin - includes inactive)
router.get('/admin/team-members', authenticateUser, requireRoles(['admin']), async (_req: Request, res: Response) => {
  try {
    const members = await prisma.teamMember.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    res.json(members);
  } catch (error) {
    console.error('Get admin team members error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// POST /api/admin/team-members (admin)
router.post('/admin/team-members', authenticateUser, requireRoles(['admin']), upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const { name, role, bio, linkedinUrl, displayOrder, isActive } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: { message: 'Name and role are required', code: 'VALIDATION_ERROR' } });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const member = await prisma.teamMember.create({
      data: {
        name,
        role,
        bio: bio || null,
        photoUrl,
        linkedinUrl: linkedinUrl || null,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
      },
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/admin/team-members/:id (admin)
router.patch('/admin/team-members/:id', authenticateUser, requireRoles(['admin']), upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, bio, linkedinUrl, displayOrder, isActive } = req.body;

    const existing = await prisma.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Team member not found', code: 'NOT_FOUND' } });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (bio !== undefined) updateData.bio = bio || null;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl || null;
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
    if (req.file) {
      updateData.photoUrl = `/uploads/${req.file.filename}`;
      // Delete old photo if exists
      if (existing.photoUrl) {
        const oldPath = path.join(process.cwd(), 'public', existing.photoUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    const member = await prisma.teamMember.update({
      where: { id },
      data: updateData,
    });

    res.json(member);
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// DELETE /api/admin/team-members/:id (admin)
router.delete('/admin/team-members/:id', authenticateUser, requireRoles(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Team member not found', code: 'NOT_FOUND' } });
    }

    // Delete photo file if exists
    if (existing.photoUrl) {
      const filePath = path.join(process.cwd(), 'public', existing.photoUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.teamMember.delete({ where: { id } });
    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== PARTNERS ====================

// GET /api/partners (public)
router.get('/partners', async (_req: Request, res: Response) => {
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

// GET /api/admin/partners (admin - includes inactive)
router.get('/admin/partners', authenticateUser, requireRoles(['admin']), async (_req: Request, res: Response) => {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    res.json(partners);
  } catch (error) {
    console.error('Get admin partners error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// POST /api/admin/partners (admin)
router.post('/admin/partners', authenticateUser, requireRoles(['admin']), upload.single('logo'), async (req: Request, res: Response) => {
  try {
    const { name, websiteUrl, description, displayOrder, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ error: { message: 'Name is required', code: 'VALIDATION_ERROR' } });
    }

    const logoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const partner = await prisma.partner.create({
      data: {
        name,
        logoUrl,
        websiteUrl: websiteUrl || null,
        description: description || null,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
      },
    });

    res.status(201).json(partner);
  } catch (error) {
    console.error('Create partner error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/admin/partners/:id (admin)
router.patch('/admin/partners/:id', authenticateUser, requireRoles(['admin']), upload.single('logo'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, websiteUrl, description, displayOrder, isActive } = req.body;

    const existing = await prisma.partner.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Partner not found', code: 'NOT_FOUND' } });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl || null;
    if (description !== undefined) updateData.description = description || null;
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
    if (req.file) {
      updateData.logoUrl = `/uploads/${req.file.filename}`;
      if (existing.logoUrl) {
        const oldPath = path.join(process.cwd(), 'public', existing.logoUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    const partner = await prisma.partner.update({
      where: { id },
      data: updateData,
    });

    res.json(partner);
  } catch (error) {
    console.error('Update partner error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// DELETE /api/admin/partners/:id (admin)
router.delete('/admin/partners/:id', authenticateUser, requireRoles(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.partner.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Partner not found', code: 'NOT_FOUND' } });
    }

    if (existing.logoUrl) {
      const filePath = path.join(process.cwd(), 'public', existing.logoUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.partner.delete({ where: { id } });
    res.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    console.error('Delete partner error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// ==================== EVENT STARTUPS ====================

// GET /api/events/:eventId/startups (public)
router.get('/events/:eventId/startups', async (req: Request, res: Response) => {
  try {
    const startups = await prisma.eventStartup.findMany({
      where: { eventId: req.params.eventId },
      orderBy: { displayOrder: 'asc' },
    });
    res.json(startups);
  } catch (error) {
    console.error('Get event startups error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// POST /api/admin/events/:eventId/startups (admin)
router.post('/admin/events/:eventId/startups', authenticateUser, requireRoles(['admin']), upload.fields([
  { name: 'companyLogo', maxCount: 1 },
  { name: 'founderPhoto', maxCount: 1 },
]), async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { companyName, founderName, founderLinkedin, pitchDescription, industry, fundingStage, displayOrder } = req.body;

    if (!companyName || !founderName) {
      return res.status(400).json({ error: { message: 'Company name and founder name are required', code: 'VALIDATION_ERROR' } });
    }

    // Verify event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ error: { message: 'Event not found', code: 'NOT_FOUND' } });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const companyLogoUrl = files?.companyLogo?.[0] ? `/uploads/${files.companyLogo[0].filename}` : null;
    const founderPhotoUrl = files?.founderPhoto?.[0] ? `/uploads/${files.founderPhoto[0].filename}` : null;

    const startup = await prisma.eventStartup.create({
      data: {
        eventId,
        companyName,
        companyLogoUrl,
        founderName,
        founderPhotoUrl,
        founderLinkedin: founderLinkedin || null,
        pitchDescription: pitchDescription || null,
        industry: industry || null,
        fundingStage: fundingStage || null,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
      },
    });

    res.status(201).json(startup);
  } catch (error) {
    console.error('Create event startup error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// PATCH /api/admin/events/:eventId/startups/:id (admin)
router.patch('/admin/events/:eventId/startups/:id', authenticateUser, requireRoles(['admin']), upload.fields([
  { name: 'companyLogo', maxCount: 1 },
  { name: 'founderPhoto', maxCount: 1 },
]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyName, founderName, founderLinkedin, pitchDescription, industry, fundingStage, displayOrder } = req.body;

    const existing = await prisma.eventStartup.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Event startup not found', code: 'NOT_FOUND' } });
    }

    const updateData: Record<string, unknown> = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (founderName !== undefined) updateData.founderName = founderName;
    if (founderLinkedin !== undefined) updateData.founderLinkedin = founderLinkedin || null;
    if (pitchDescription !== undefined) updateData.pitchDescription = pitchDescription || null;
    if (industry !== undefined) updateData.industry = industry || null;
    if (fundingStage !== undefined) updateData.fundingStage = fundingStage || null;
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files?.companyLogo?.[0]) {
      updateData.companyLogoUrl = `/uploads/${files.companyLogo[0].filename}`;
      if (existing.companyLogoUrl) {
        const oldPath = path.join(process.cwd(), 'public', existing.companyLogoUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }
    if (files?.founderPhoto?.[0]) {
      updateData.founderPhotoUrl = `/uploads/${files.founderPhoto[0].filename}`;
      if (existing.founderPhotoUrl) {
        const oldPath = path.join(process.cwd(), 'public', existing.founderPhotoUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    const startup = await prisma.eventStartup.update({
      where: { id },
      data: updateData,
    });

    res.json(startup);
  } catch (error) {
    console.error('Update event startup error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

// DELETE /api/admin/events/:eventId/startups/:id (admin)
router.delete('/admin/events/:eventId/startups/:id', authenticateUser, requireRoles(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.eventStartup.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { message: 'Event startup not found', code: 'NOT_FOUND' } });
    }

    if (existing.companyLogoUrl) {
      const filePath = path.join(process.cwd(), 'public', existing.companyLogoUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    if (existing.founderPhotoUrl) {
      const filePath = path.join(process.cwd(), 'public', existing.founderPhotoUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.eventStartup.delete({ where: { id } });
    res.json({ message: 'Event startup deleted successfully' });
  } catch (error) {
    console.error('Delete event startup error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'SERVER_ERROR' } });
  }
});

export default router;
