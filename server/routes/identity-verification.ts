/**
 * Identity Verification Routes (Persona Integration)
 *
 * Provides identity verification initiation, status checking,
 * and Persona webhook handling. Uses hosted flow (redirect-based)
 * for minimal latency and no frontend SDK dependency.
 *
 * User Stories: US-MEMB-008, US-MEMB-009
 * E2E Tests: MEMB-E2E-016, MEMB-E2E-017
 *
 * @module routes/identity-verification
 */

import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { prisma } from '../../db';
import crypto from 'crypto';

const router = Router();

const PERSONA_API_KEY = process.env.PERSONA_API_KEY || '';
const PERSONA_TEMPLATE_ID = process.env.PERSONA_TEMPLATE_ID || '';
const PERSONA_WEBHOOK_SECRET = process.env.PERSONA_WEBHOOK_SECRET || '';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8080';

// ============================================================================
// POST /api/verification/start — Initiate Persona verification
// ============================================================================
router.post('/start', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    // Check if already verified
    const existing = await prisma.identityVerification.findFirst({
      where: { userId, status: 'COMPLETED' },
    });
    if (existing) {
      return res.json({
        success: true,
        alreadyVerified: true,
        verification: {
          status: existing.status,
          verifiedAt: existing.verifiedAt,
        },
      });
    }

    // Check monthly quota
    const quotaUsed = await prisma.systemConfig.findUnique({
      where: { key: 'persona.monthly_used' },
    });
    const quotaLimit = await prisma.systemConfig.findUnique({
      where: { key: 'persona.monthly_quota' },
    });

    const used = parseInt(quotaUsed?.value || '0');
    const limit = parseInt(quotaLimit?.value || '500');

    if (used >= limit) {
      return res.status(429).json({
        success: false,
        error: 'Monthly verification quota exceeded. Please try again next month.',
      });
    }

    // Check for pending verification
    const pending = await prisma.identityVerification.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (pending && pending.providerInquiryId) {
      // Return existing pending inquiry
      const inquiryUrl = PERSONA_API_KEY
        ? `https://withpersona.com/verify?inquiry-id=${pending.providerInquiryId}`
        : `${APP_BASE_URL}/membership?verification=pending&id=${pending.id}`;

      return res.json({
        success: true,
        alreadyVerified: false,
        inquiryUrl,
        verificationId: pending.id,
      });
    }

    // Create Persona inquiry (or mock for testing)
    let inquiryId: string;
    let inquiryUrl: string;

    if (PERSONA_API_KEY && PERSONA_API_KEY !== 'test_mock') {
      // Production: Call Persona API
      const response = await fetch('https://withpersona.com/api/v1/inquiries', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PERSONA_API_KEY}`,
          'Content-Type': 'application/json',
          'Persona-Version': '2023-01-05',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              'inquiry-template-id': PERSONA_TEMPLATE_ID,
              'reference-id': userId,
              'redirect-uri': `${APP_BASE_URL}/membership?verification=complete`,
              fields: {
                'email-address': { type: 'string', value: userEmail },
              },
            },
          },
        }),
      });

      const result = await response.json();
      inquiryId = result.data?.id || `inq_${Date.now()}`;
      inquiryUrl = `https://withpersona.com/verify?inquiry-id=${inquiryId}`;
    } else {
      // Test/mock mode
      inquiryId = `inq_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      inquiryUrl = `${APP_BASE_URL}/membership?verification=mock&id=${inquiryId}`;
    }

    // Create verification record
    const verification = await prisma.identityVerification.create({
      data: {
        userId,
        provider: 'persona',
        providerInquiryId: inquiryId,
        status: 'PENDING',
      },
    });

    // Increment monthly usage
    await prisma.systemConfig.upsert({
      where: { key: 'persona.monthly_used' },
      update: { value: String(used + 1) },
      create: { key: 'persona.monthly_used', value: '1' },
    });

    return res.json({
      success: true,
      alreadyVerified: false,
      inquiryUrl,
      verificationId: verification.id,
    });
  } catch (error) {
    console.error('Error starting verification:', error);
    return res.status(500).json({ success: false, error: 'Failed to start verification' });
  }
});

// ============================================================================
// GET /api/verification/status — Current user's verification status
// ============================================================================
router.get('/status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;

    const verification = await prisma.identityVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      verification: verification
        ? {
            id: verification.id,
            status: verification.status,
            provider: verification.provider,
            verifiedAt: verification.verifiedAt,
            createdAt: verification.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch verification status' });
  }
});

// ============================================================================
// POST /api/verification/webhook/persona — Persona webhook callback
// ============================================================================
router.post('/webhook/persona', async (req, res) => {
  try {
    // Verify webhook signature if secret is configured
    if (PERSONA_WEBHOOK_SECRET && PERSONA_WEBHOOK_SECRET !== 'test_mock') {
      const signature = req.headers['persona-signature'] as string;
      if (signature) {
        const hmac = crypto.createHmac('sha256', PERSONA_WEBHOOK_SECRET);
        hmac.update(JSON.stringify(req.body));
        const expected = hmac.digest('hex');
        if (signature !== expected) {
          return res.status(401).json({ error: 'Invalid webhook signature' });
        }
      }
    }

    const { data } = req.body;
    const eventType = data?.attributes?.name || req.body.event_type;
    const inquiryId = data?.attributes?.payload?.data?.id || data?.relationships?.inquiry?.data?.id || req.body.inquiry_id;

    if (!inquiryId) {
      return res.status(400).json({ error: 'Missing inquiry ID' });
    }

    const verification = await prisma.identityVerification.findFirst({
      where: { providerInquiryId: inquiryId },
    });

    if (!verification) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    // Map Persona event to status
    let status: 'COMPLETED' | 'FAILED' | 'EXPIRED' = 'PENDING' as any;
    if (
      eventType === 'inquiry.completed' ||
      eventType === 'inquiry.approved' ||
      eventType === 'completed'
    ) {
      status = 'COMPLETED';
    } else if (eventType === 'inquiry.failed' || eventType === 'inquiry.declined' || eventType === 'failed') {
      status = 'FAILED';
    } else if (eventType === 'inquiry.expired' || eventType === 'expired') {
      status = 'EXPIRED';
    }

    await prisma.identityVerification.update({
      where: { id: verification.id },
      data: {
        status,
        verifiedAt: status === 'COMPLETED' ? new Date() : undefined,
        metadata: req.body,
      },
    });

    // Log activity if completed
    if (status === 'COMPLETED') {
      await prisma.activityLog.create({
        data: {
          userId: verification.userId,
          activityType: 'IDENTITY_VERIFIED',
          entityType: 'identity_verification',
          entityId: verification.id,
          description: 'Identity verified via Persona',
        },
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error processing Persona webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============================================================================
// POST /api/verification/mock-complete — Test endpoint for E2E
// Only available in non-production
// ============================================================================
router.post('/mock-complete', authenticateUser, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const userId = req.user!.id;

    // Find or create a verification and mark it complete
    let verification = await prisma.identityVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (verification) {
      verification = await prisma.identityVerification.update({
        where: { id: verification.id },
        data: { status: 'COMPLETED', verifiedAt: new Date() },
      });
    } else {
      verification = await prisma.identityVerification.create({
        data: {
          userId,
          provider: 'persona',
          providerInquiryId: `inq_mock_${Date.now()}`,
          status: 'COMPLETED',
          verifiedAt: new Date(),
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId,
        activityType: 'IDENTITY_VERIFIED',
        entityType: 'identity_verification',
        entityId: verification.id,
        description: 'Identity verified (mock/test)',
      },
    });

    return res.json({
      success: true,
      verification: {
        id: verification.id,
        status: verification.status,
        verifiedAt: verification.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Error mock-completing verification:', error);
    return res.status(500).json({ success: false, error: 'Failed to mock-complete' });
  }
});

export default router;
