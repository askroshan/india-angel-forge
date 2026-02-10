/**
 * Admin Membership Management Routes
 *
 * Provides admin CRUD for membership plans, discount codes,
 * subscriber management, change logs, verification dashboard,
 * and system config.
 *
 * User Stories: US-MEMB-001, US-MEMB-002, US-MEMB-007, US-MEMB-009, US-MEMB-011
 * E2E Tests: MEMB-E2E-001 through MEMB-E2E-004, MEMB-E2E-010, MEMB-E2E-012 through MEMB-E2E-014, MEMB-E2E-017
 * E2E Tests: DISC-E2E-001 through DISC-E2E-004
 *
 * @module routes/admin-membership
 */

import { Router } from 'express';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { prisma } from '../../db';
import { z } from 'zod';

const router = Router();

// All routes require admin
router.use(authenticateUser, requireRoles(['admin']));

// ============================================================================
// MEMBERSHIP PLANS CRUD
// ============================================================================

/**
 * GET /api/admin/membership/plans — List all plans (including inactive)
 * data-testid trace: plan-row, plan-name, plan-price, plan-toggle-active
 */
router.get('/plans', async (_req, res) => {
  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { memberships: true } },
      },
    });

    return res.json({
      success: true,
      plans: plans.map((p) => ({
        ...p,
        price: Number(p.price),
        subscriberCount: p._count.memberships,
      })),
    });
  } catch (error) {
    console.error('Error fetching admin plans:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

/**
 * POST /api/admin/membership/plans — Create plan
 */
const createPlanSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().default('INR'),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']).default('ANNUAL'),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().default(0),
});

router.post('/plans', async (req, res) => {
  try {
    const data = createPlanSchema.parse(req.body);

    const plan = await prisma.membershipPlan.create({
      data: {
        ...data,
        features: data.features || [],
      },
    });

    // Log the plan creation
    await prisma.membershipPlanChangeLog.create({
      data: {
        userId: req.user!.id,
        newPlanId: plan.id,
        changeType: 'PRICE_CHANGE',
        newPrice: data.price,
        changedBy: req.user!.id,
        reason: `Plan created: ${data.name}`,
      },
    });

    return res.status(201).json({
      success: true,
      plan: { ...plan, price: Number(plan.price) },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating plan:', error);
    return res.status(500).json({ success: false, error: 'Failed to create plan' });
  }
});

/**
 * PUT /api/admin/membership/plans/:id — Update plan
 */
const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().optional(),
});

router.put('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updatePlanSchema.parse(req.body);

    const existing = await prisma.membershipPlan.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data,
    });

    // Log price changes
    if (data.price !== undefined && Number(existing.price) !== data.price) {
      await prisma.membershipPlanChangeLog.create({
        data: {
          userId: req.user!.id,
          newPlanId: id,
          changeType: 'PRICE_CHANGE',
          oldPrice: existing.price,
          newPrice: data.price,
          changedBy: req.user!.id,
          reason: `Price changed from ₹${Number(existing.price)} to ₹${data.price}`,
        },
      });
    }

    return res.json({
      success: true,
      plan: { ...plan, price: Number(plan.price) },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating plan:', error);
    return res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

/**
 * DELETE /api/admin/membership/plans/:id — Soft delete (deactivate)
 */
router.delete('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await prisma.membershipPlan.findUnique({ where: { id } });
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Check for active subscribers
    const activeCount = await prisma.userMembership.count({
      where: { planId: id, status: 'ACTIVE' },
    });
    if (activeCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete plan with ${activeCount} active subscriber(s). Deactivate instead.`,
      });
    }

    // Check for any subscribers at all (hard vs soft delete)
    const totalCount = await prisma.userMembership.count({
      where: { planId: id },
    });

    if (totalCount > 0) {
      // Soft delete — has historical subscribers
      await prisma.membershipPlan.update({
        where: { id },
        data: { isActive: false },
      });
      return res.json({ success: true, message: 'Plan deactivated' });
    } else {
      // Hard delete — no subscribers ever
      await prisma.membershipPlan.delete({ where: { id } });
      return res.json({ success: true, message: 'Plan deleted' });
    }
  } catch (error) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete plan' });
  }
});

// ============================================================================
// DISCOUNT CODES CRUD
// ============================================================================

/**
 * GET /api/admin/membership/discount-codes
 * data-testid trace: discount-row, discount-code, discount-value, discount-uses
 */
router.get('/discount-codes', async (_req, res) => {
  try {
    const codes = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      discountCodes: codes.map((c) => ({
        ...c,
        discountValue: Number(c.discountValue),
        minPurchaseAmount: c.minPurchaseAmount ? Number(c.minPurchaseAmount) : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch discount codes' });
  }
});

/**
 * POST /api/admin/membership/discount-codes
 */
const createDiscountSchema = z.object({
  code: z.string().min(1).transform((v) => v.toUpperCase()),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive(),
  maxUses: z.number().positive().optional(),
  validFrom: z.string().transform((v) => new Date(v)),
  validUntil: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  applicablePlanIds: z.array(z.string()).default([]),
  minPurchaseAmount: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
});

router.post('/discount-codes', async (req, res) => {
  try {
    const data = createDiscountSchema.parse(req.body);

    // Validate percentage <= 100
    if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
      return res.status(400).json({ success: false, error: 'Percentage discount cannot exceed 100%' });
    }

    const code = await prisma.discountCode.create({
      data: {
        ...data,
        createdBy: req.user!.id,
      },
    });

    return res.status(201).json({
      success: true,
      discountCode: { ...code, discountValue: Number(code.discountValue) },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating discount code:', error);
    return res.status(500).json({ success: false, error: 'Failed to create discount code' });
  }
});

/**
 * PUT /api/admin/membership/discount-codes/:id
 */
const updateDiscountSchema = z.object({
  description: z.string().optional(),
  discountValue: z.number().positive().optional(),
  maxUses: z.number().positive().optional().nullable(),
  validUntil: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : undefined)),
  isActive: z.boolean().optional(),
});

router.put('/discount-codes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateDiscountSchema.parse(req.body);

    const code = await prisma.discountCode.update({
      where: { id },
      data,
    });

    return res.json({
      success: true,
      discountCode: { ...code, discountValue: Number(code.discountValue) },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating discount code:', error);
    return res.status(500).json({ success: false, error: 'Failed to update discount code' });
  }
});

/**
 * DELETE /api/admin/membership/discount-codes/:id
 */
router.delete('/discount-codes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Check if any memberships reference this code
    const usageCount = await prisma.userMembership.count({
      where: { discountCodeId: id },
    });
    if (usageCount > 0) {
      // Soft delete — has been used
      await prisma.discountCode.update({
        where: { id },
        data: { isActive: false },
      });
      return res.json({ success: true, message: 'Discount code deactivated' });
    } else {
      // Hard delete — never used
      await prisma.discountCode.delete({ where: { id } });
      return res.json({ success: true, message: 'Discount code deleted' });
    }
  } catch (error) {
    console.error('Error deleting discount code:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete discount code' });
  }
});

// ============================================================================
// MEMBERSHIPS (Subscriber list)
// ============================================================================

/**
 * GET /api/admin/membership/memberships
 */
router.get('/memberships', async (req, res) => {
  try {
    const { status, planId, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (planId) where.planId = planId;

    const skip = (Number(page) - 1) * Number(limit);

    const [memberships, total] = await Promise.all([
      prisma.userMembership.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          plan: { select: { id: true, name: true, price: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.userMembership.count({ where }),
    ]);

    return res.json({
      success: true,
      memberships: memberships.map((m) => ({
        ...m,
        proratedAmount: m.proratedAmount ? Number(m.proratedAmount) : null,
        plan: { ...m.plan, price: Number(m.plan.price) },
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching memberships:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch memberships' });
  }
});

// ============================================================================
// CHANGE LOG
// ============================================================================

/**
 * GET /api/admin/membership/changelog
 */
router.get('/changelog', async (req, res) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.membershipPlanChangeLog.findMany({
        include: {
          oldPlan: { select: { name: true } },
          newPlan: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.membershipPlanChangeLog.count(),
    ]);

    return res.json({
      success: true,
      changelog: logs.map((l) => ({
        ...l,
        oldPrice: l.oldPrice ? Number(l.oldPrice) : null,
        newPrice: l.newPrice ? Number(l.newPrice) : null,
        proratedAmount: l.proratedAmount ? Number(l.proratedAmount) : null,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching changelog:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch changelog' });
  }
});

// ============================================================================
// VERIFICATION DASHBOARD
// ============================================================================

/**
 * GET /api/admin/membership/verifications
 * data-testid trace: verification-row, verification-status
 */
router.get('/verifications', async (req, res) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [verifications, total] = await Promise.all([
      prisma.identityVerification.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.identityVerification.count({ where }),
    ]);

    // Get monthly usage from SystemConfig
    const quotaUsed = await prisma.systemConfig.findUnique({
      where: { key: 'persona.monthly_used' },
    });
    const quotaLimit = await prisma.systemConfig.findUnique({
      where: { key: 'persona.monthly_quota' },
    });

    return res.json({
      success: true,
      verifications,
      quota: {
        used: parseInt(quotaUsed?.value || '0'),
        limit: parseInt(quotaLimit?.value || '500'),
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch verifications' });
  }
});

// ============================================================================
// SYSTEM CONFIG
// ============================================================================

/**
 * GET /api/admin/membership/system-config
 * data-testid trace: config-introductory-toggle, config-introductory-price, config-persona-quota
 */
router.get('/system-config', async (_req, res) => {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: 'membership.',
        },
      },
    });

    const personaConfigs = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: 'persona.',
        },
      },
    });

    return res.json({
      success: true,
      config: [...configs, ...personaConfigs].reduce(
        (acc, c) => {
          acc[c.key] = c.value;
          return acc;
        },
        {} as Record<string, string>,
      ),
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch config' });
  }
});

/**
 * PUT /api/admin/membership/system-config/:key
 */
const updateConfigSchema = z.object({
  value: z.string(),
});

router.put('/system-config/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = updateConfigSchema.parse(req.body);

    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { value, updatedBy: req.user!.id },
      create: { key, value, updatedBy: req.user!.id },
    });

    return res.json({ success: true, config });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid input' });
    }
    console.error('Error updating config:', error);
    return res.status(500).json({ success: false, error: 'Failed to update config' });
  }
});

export default router;
