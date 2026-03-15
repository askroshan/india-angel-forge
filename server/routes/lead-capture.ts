/**
 * US-NEW-001: Lead Capture API
 *
 * POST /api/lead-capture     — submit visitor email (no auth)
 * GET  /api/admin/lead-captures — list all leads (admin only)
 */

import { Router } from 'express';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { prisma } from '../../db';
import { z } from 'zod';

const router = Router();

const leadSchema = z.object({
  email: z.string().email({ message: 'Valid email is required' }),
  name: z.string().optional(),
  interest: z.enum(['investor', 'founder', 'general']).optional(),
  source: z.string().optional(),
});

/**
 * POST /api/lead-capture
 * Public — visitors submit their email interest
 */
router.post('/', async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: parsed.error.errors[0].message,
    });
  }
  const { email, name, interest, source } = parsed.data;

  try {
    // Upsert so duplicate submissions return 200 without crashing
    const existing = await prisma.leadCapture.findUnique({ where: { email } });
    if (existing) {
      return res.status(200).json({ success: true, data: existing, existing: true });
    }

    const lead = await prisma.leadCapture.create({
      data: {
        email,
        fullName: name,
        interest: interest ?? 'general',
        source: source ?? 'landing_page',
      },
    });

    return res.status(201).json({ success: true, data: lead });
  } catch (error) {
    console.error('Error creating lead capture:', error);
    return res.status(500).json({ success: false, error: 'Failed to save interest' });
  }
});

export default router;
