/**
 * US-NEW-005: Referral Code System
 *
 * POST /api/referrals/generate   — create or return existing code (auth)
 * GET  /api/referrals/my-code    — get the caller's referral code (auth)
 * POST /api/referrals/validate   — validate a code exists (public)
 */

import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { prisma } from '../../db';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

/** Generates a URL-safe 8-character uppercase code */
function generateCode(): string {
  return crypto.randomBytes(6).toString('base64url').toUpperCase().slice(0, 8);
}

/**
 * POST /api/referrals/generate
 * Creates (or returns existing) referral code for the authenticated user
 */
router.post('/generate', authenticateUser, async (req, res) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    // Use upsert to avoid race conditions when multiple requests arrive simultaneously
    let code = generateCode();
    let tries = 0;
    while (tries < 10) {
      const conflict = await prisma.referralCode.findUnique({ where: { code } });
      if (!conflict) break;
      code = generateCode();
      tries++;
    }

    const referralCode = await prisma.referralCode.upsert({
      where: { userId },
      update: {},  // don't overwrite existing code
      create: { userId, code },
    });

    return res.status(201).json({ success: true, data: referralCode });
  } catch (error) {
    console.error('Error generating referral code:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate referral code' });
  }
});

/**
 * GET /api/referrals/my-code
 * Returns the caller's referral code (creates one if none exists)
 */
router.get('/my-code', authenticateUser, async (req, res) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    let referralCode = await prisma.referralCode.findUnique({
      where: { userId },
      include: { uses: true },
    });

    if (!referralCode) {
      let code = generateCode();
      let tries = 0;
      while (tries < 10) {
        const conflict = await prisma.referralCode.findUnique({ where: { code } });
        if (!conflict) break;
        code = generateCode();
        tries++;
      }
      referralCode = await prisma.referralCode.create({
        data: { userId, code },
        include: { uses: true },
      });
    }

    return res.json({ success: true, data: referralCode });
  } catch (error) {
    console.error('Error fetching referral code:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch referral code' });
  }
});

/**
 * POST /api/referrals/validate
 * Public — check whether a code is valid
 */
router.post('/validate', async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, error: 'Code is required' });
  }

  try {
    const referralCode = await prisma.referralCode.findUnique({ where: { code } });
    if (!referralCode) {
      return res.status(404).json({ success: false, data: { valid: false }, error: 'Invalid referral code' });
    }
    return res.json({ success: true, data: { valid: true, code: referralCode.code } });
  } catch (error) {
    console.error('Error validating referral code:', error);
    return res.status(500).json({ success: false, error: 'Failed to validate code' });
  }
});

export default router;
