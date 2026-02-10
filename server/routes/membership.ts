/**
 * Membership API Routes (User-Facing)
 *
 * Provides membership plan browsing, subscription, plan changes,
 * discount code application, and cancellation.
 *
 * User Stories: US-MEMB-003, US-MEMB-004, US-MEMB-005, US-MEMB-006, US-MEMB-010
 * E2E Tests: MEMB-E2E-005 through MEMB-E2E-011, MEMB-E2E-015, MEMB-E2E-016
 *
 * @module routes/membership
 */

import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { prisma } from '../../db';
import { z } from 'zod';
import { PaymentService } from '../services/payment.service';
import { PaymentGateway } from '@prisma/client';

const router = Router();

// ============================================================================
// GET /api/membership/plans — Public: list active plans
// data-testid trace: plan-card, plan-name, plan-price
// ============================================================================
router.get('/plans', async (_req, res) => {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    // Check introductory pricing override
    const introConfig = await prisma.systemConfig.findUnique({
      where: { key: 'membership.introductory_enabled' },
    });
    const introPriceConfig = await prisma.systemConfig.findUnique({
      where: { key: 'membership.introductory_price' },
    });

    const introductoryEnabled = introConfig?.value === 'true';
    const introductoryPrice = introPriceConfig ? parseFloat(introPriceConfig.value) : 0;

    const formattedPlans = plans.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: introductoryEnabled ? introductoryPrice : Number(p.price),
      originalPrice: Number(p.price),
      currency: p.currency,
      billingCycle: p.billingCycle,
      features: p.features,
      introductoryPricing: introductoryEnabled,
    }));

    return res.json({ success: true, plans: formattedPlans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

// ============================================================================
// GET /api/membership/my-membership — Current user's active membership
// data-testid trace: membership-status, membership-plan-name, membership-expiry
// ============================================================================
router.get('/my-membership', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;

    const membership = await prisma.userMembership.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: {
        plan: true,
        discountCode: { select: { code: true, discountType: true, discountValue: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const verification = await prisma.identityVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      membership: membership
        ? {
            id: membership.id,
            status: membership.status,
            planName: membership.plan.name,
            planSlug: membership.plan.slug,
            price: Number(membership.plan.price),
            currency: membership.plan.currency,
            billingCycle: membership.plan.billingCycle,
            startDate: membership.startDate,
            endDate: membership.endDate,
            autoRenew: membership.autoRenew,
            discountCode: membership.discountCode?.code || null,
          }
        : null,
      verification: verification
        ? {
            status: verification.status,
            provider: verification.provider,
            verifiedAt: verification.verifiedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching membership:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch membership' });
  }
});

// ============================================================================
// POST /api/membership/apply-discount — Validate & calculate discount
// data-testid trace: discount-input, apply-discount-btn, discount-applied-amount
// ============================================================================
const applyDiscountSchema = z.object({
  code: z.string().min(1),
  planId: z.string().min(1),
});

router.post('/apply-discount', authenticateUser, async (req, res) => {
  try {
    const { code, planId } = applyDiscountSchema.parse(req.body);

    const discount = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount || !discount.isActive) {
      return res.status(404).json({ success: false, error: 'Invalid discount code' });
    }

    // Check validity dates
    const now = new Date();
    if (discount.validFrom > now) {
      return res.status(400).json({ success: false, error: 'Discount code not yet active' });
    }
    if (discount.validUntil && discount.validUntil < now) {
      return res.status(400).json({ success: false, error: 'Discount code has expired' });
    }

    // Check max uses
    if (discount.maxUses && discount.currentUses >= discount.maxUses) {
      return res.status(400).json({ success: false, error: 'Discount code usage limit reached' });
    }

    // Check applicable plans
    if (discount.applicablePlanIds.length > 0 && !discount.applicablePlanIds.includes(planId)) {
      return res.status(400).json({ success: false, error: 'Discount code not applicable to this plan' });
    }

    // Get plan price
    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    const planPrice = Number(plan.price);

    // Check introductory override
    const introConfig = await prisma.systemConfig.findUnique({
      where: { key: 'membership.introductory_enabled' },
    });
    const introPriceConfig = await prisma.systemConfig.findUnique({
      where: { key: 'membership.introductory_price' },
    });
    const effectivePrice =
      introConfig?.value === 'true' ? parseFloat(introPriceConfig?.value || '0') : planPrice;

    // Calculate discount
    let discountAmount = 0;
    if (discount.discountType === 'PERCENTAGE') {
      discountAmount = (effectivePrice * Number(discount.discountValue)) / 100;
    } else {
      discountAmount = Number(discount.discountValue);
    }

    // Check min purchase
    if (discount.minPurchaseAmount && effectivePrice < Number(discount.minPurchaseAmount)) {
      return res.status(400).json({
        success: false,
        error: `Minimum purchase amount is ₹${Number(discount.minPurchaseAmount).toLocaleString()}`,
      });
    }

    const finalPrice = Math.max(0, effectivePrice - discountAmount);

    return res.json({
      success: true,
      discount: {
        code: discount.code,
        discountType: discount.discountType,
        discountValue: Number(discount.discountValue),
        discountAmount: Math.round(discountAmount * 100) / 100,
        originalPrice: effectivePrice,
        finalPrice: Math.round(finalPrice * 100) / 100,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
    }
    console.error('Error applying discount:', error);
    return res.status(500).json({ success: false, error: 'Failed to apply discount' });
  }
});

// ============================================================================
// POST /api/membership/subscribe — Create subscription + payment order
// data-testid trace: subscribe-btn
// ============================================================================
const subscribeSchema = z.object({
  planId: z.string().min(1),
  discountCode: z.string().optional(),
  gateway: z.enum(['RAZORPAY', 'STRIPE']).optional(),
});

router.post('/subscribe', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { planId, discountCode, gateway } = subscribeSchema.parse(req.body);

    // Check identity verification
    const verification = await prisma.identityVerification.findFirst({
      where: { userId, status: 'COMPLETED' },
    });
    if (!verification) {
      return res.status(403).json({
        success: false,
        error: 'Identity verification required before subscribing',
        code: 'VERIFICATION_REQUIRED',
      });
    }

    // Check no active membership
    const existing = await prisma.userMembership.findFirst({
      where: { userId, status: 'ACTIVE' },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active membership. Use plan change instead.',
      });
    }

    // Get plan
    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return res.status(404).json({ success: false, error: 'Plan not found or inactive' });
    }

    // Calculate price (with introductory override)
    let price = Number(plan.price);
    const introConfig = await prisma.systemConfig.findUnique({
      where: { key: 'membership.introductory_enabled' },
    });
    const introPriceConfig = await prisma.systemConfig.findUnique({
      where: { key: 'membership.introductory_price' },
    });
    if (introConfig?.value === 'true') {
      price = parseFloat(introPriceConfig?.value || '0');
    }

    // Apply discount code
    let discountCodeRecord = null;
    if (discountCode) {
      discountCodeRecord = await prisma.discountCode.findUnique({
        where: { code: discountCode.toUpperCase() },
      });
      if (discountCodeRecord && discountCodeRecord.isActive) {
        let discountAmount = 0;
        if (discountCodeRecord.discountType === 'PERCENTAGE') {
          discountAmount = (price * Number(discountCodeRecord.discountValue)) / 100;
        } else {
          discountAmount = Number(discountCodeRecord.discountValue);
        }
        price = Math.max(0, price - discountAmount);
      }
    }

    const now = new Date();
    const endDate = new Date(now);
    if (plan.billingCycle === 'ANNUAL') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // If price is 0, skip payment and activate directly
    if (price <= 0) {
      const membership = await prisma.userMembership.create({
        data: {
          userId,
          planId,
          status: 'ACTIVE',
          startDate: now,
          endDate,
          discountCodeId: discountCodeRecord?.id,
          proratedAmount: 0,
        },
      });

      // Log the change
      await prisma.membershipPlanChangeLog.create({
        data: {
          userId,
          newPlanId: planId,
          changeType: 'ACTIVATION',
          newPrice: 0,
          changedBy: userId,
          reason: discountCode ? `Activated with discount code ${discountCode}` : 'Free activation',
        },
      });

      // Increment discount usage
      if (discountCodeRecord) {
        await prisma.discountCode.update({
          where: { id: discountCodeRecord.id },
          data: { currentUses: { increment: 1 } },
        });
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId,
          activityType: 'MEMBERSHIP_ACTIVATED',
          entityType: 'membership',
          entityId: membership.id,
          description: `Membership activated: ${plan.name} (free)`,
        },
      });

      return res.json({
        success: true,
        membership: {
          id: membership.id,
          status: membership.status,
          planName: plan.name,
          startDate: membership.startDate,
          endDate: membership.endDate,
        },
        paymentRequired: false,
      });
    }

    // Create payment order via existing payment service
    const selectedGateway = (gateway as PaymentGateway) || 'RAZORPAY';
    const paymentResult = await PaymentService.createPaymentOrder(
      {
        amount: price,
        currency: plan.currency,
        description: `Membership: ${plan.name}`,
        userId,
        type: 'MEMBERSHIP_FEE',
        metadata: { planId, discountCode: discountCode || null },
      },
      selectedGateway,
    );

    if (!paymentResult.success) {
      return res.status(500).json({ success: false, error: 'Failed to create payment order' });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: price,
        currency: plan.currency,
        gateway: selectedGateway,
        status: 'PENDING',
        type: 'MEMBERSHIP_FEE',
        gatewayOrderId: paymentResult.orderId,
        description: `Membership: ${plan.name}`,
        metadata: { planId, discountCode: discountCode || null, endDate: endDate.toISOString() },
      },
    });

    return res.json({
      success: true,
      paymentRequired: true,
      payment: {
        id: payment.id,
        orderId: paymentResult.orderId,
        amount: price,
        currency: plan.currency,
        gateway: selectedGateway,
        key: (paymentResult as any).key,
      },
      plan: { name: plan.name, endDate },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: error.errors });
    }
    console.error('Error subscribing:', error);
    return res.status(500).json({ success: false, error: 'Failed to subscribe' });
  }
});

// ============================================================================
// POST /api/membership/verify-payment — Verify payment & activate membership
// ============================================================================
const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1),
  orderId: z.string().min(1),
  gatewayPaymentId: z.string().min(1),
  signature: z.string().min(1),
});

router.post('/verify-payment', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { paymentId, orderId, gatewayPaymentId, signature } = verifyPaymentSchema.parse(req.body);

    // Get the payment record
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Verify with gateway
    const verified = await PaymentService.verifyPayment(
      { orderId, paymentId: gatewayPaymentId, signature },
      payment.gateway,
    );

    if (!verified) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED', failureReason: 'Signature verification failed' },
      });
      return res.status(400).json({ success: false, error: 'Payment verification failed' });
    }

    // Mark payment complete
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        gatewayPaymentId,
        gatewaySignature: signature,
        completedAt: new Date(),
      },
    });

    // Activate membership
    const meta = payment.metadata as any;
    const plan = await prisma.membershipPlan.findUnique({ where: { id: meta.planId } });

    const membership = await prisma.userMembership.create({
      data: {
        userId,
        planId: meta.planId,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(meta.endDate),
        paymentId: payment.id,
        discountCodeId: meta.discountCodeId || undefined,
      },
    });

    // Log change
    await prisma.membershipPlanChangeLog.create({
      data: {
        userId,
        newPlanId: meta.planId,
        changeType: 'ACTIVATION',
        newPrice: payment.amount,
        changedBy: userId,
        reason: 'Payment verified and membership activated',
      },
    });

    // Increment discount usage if applicable
    if (meta.discountCode) {
      await prisma.discountCode.updateMany({
        where: { code: meta.discountCode.toUpperCase() },
        data: { currentUses: { increment: 1 } },
      });
    }

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId,
        activityType: 'MEMBERSHIP_ACTIVATED',
        entityType: 'membership',
        entityId: membership.id,
        description: `Membership activated: ${plan?.name || 'Unknown'} - ₹${Number(payment.amount).toLocaleString()}`,
      },
    });

    return res.json({
      success: true,
      membership: {
        id: membership.id,
        status: membership.status,
        planName: plan?.name,
        startDate: membership.startDate,
        endDate: membership.endDate,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid input' });
    }
    console.error('Error verifying payment:', error);
    return res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
});

// ============================================================================
// POST /api/membership/change-plan — Prorated plan change
// data-testid trace: change-plan-btn
// ============================================================================
const changePlanSchema = z.object({
  newPlanId: z.string().min(1),
});

router.post('/change-plan', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { newPlanId } = changePlanSchema.parse(req.body);

    // Get current active membership
    const current = await prisma.userMembership.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
    });
    if (!current) {
      return res.status(400).json({ success: false, error: 'No active membership to change' });
    }

    const newPlan = await prisma.membershipPlan.findUnique({ where: { id: newPlanId } });
    if (!newPlan || !newPlan.isActive) {
      return res.status(404).json({ success: false, error: 'New plan not found or inactive' });
    }

    if (current.planId === newPlanId) {
      return res.status(400).json({ success: false, error: 'Already on this plan' });
    }

    // Proration calculation
    const now = new Date();
    const totalDays = Math.ceil(
      (current.endDate.getTime() - current.startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const remainingDays = Math.max(
      0,
      Math.ceil((current.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const oldPrice = Number(current.plan.price);
    const newPrice = Number(newPlan.price);
    const dailyRateOld = oldPrice / totalDays;
    const creditAmount = Math.round(remainingDays * dailyRateOld * 100) / 100;
    const proratedCharge = Math.max(0, Math.round((newPrice - creditAmount) * 100) / 100);

    const changeType = newPrice > oldPrice ? 'UPGRADE' : 'DOWNGRADE';

    // Cancel old membership
    await prisma.userMembership.update({
      where: { id: current.id },
      data: { status: 'CANCELLED' },
    });

    // Create new membership (keep same end date)
    const newMembership = await prisma.userMembership.create({
      data: {
        userId,
        planId: newPlanId,
        status: 'ACTIVE',
        startDate: now,
        endDate: current.endDate,
        proratedAmount: proratedCharge,
      },
    });

    // Log change
    await prisma.membershipPlanChangeLog.create({
      data: {
        userId,
        oldPlanId: current.planId,
        newPlanId,
        changeType,
        oldPrice,
        newPrice,
        proratedAmount: proratedCharge,
        changedBy: userId,
        reason: `${changeType}: ${current.plan.name} → ${newPlan.name}`,
        metadata: { remainingDays, creditAmount, totalDays },
      },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId,
        activityType: 'MEMBERSHIP_PLAN_CHANGED',
        entityType: 'membership',
        entityId: newMembership.id,
        description: `Plan changed from ${current.plan.name} to ${newPlan.name} (prorated: ₹${proratedCharge.toLocaleString()})`,
      },
    });

    return res.json({
      success: true,
      membership: {
        id: newMembership.id,
        status: newMembership.status,
        planName: newPlan.name,
        startDate: newMembership.startDate,
        endDate: newMembership.endDate,
      },
      proration: {
        oldPlan: current.plan.name,
        newPlan: newPlan.name,
        changeType,
        remainingDays,
        creditAmount,
        proratedCharge,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid input' });
    }
    console.error('Error changing plan:', error);
    return res.status(500).json({ success: false, error: 'Failed to change plan' });
  }
});

// ============================================================================
// POST /api/membership/cancel — Cancel membership
// data-testid trace: cancel-btn
// ============================================================================
const cancelSchema = z.object({
  reason: z.string().optional(),
});

router.post('/cancel', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { reason } = cancelSchema.parse(req.body || {});

    const membership = await prisma.userMembership.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
    });
    if (!membership) {
      return res.status(400).json({ success: false, error: 'No active membership to cancel' });
    }

    await prisma.userMembership.update({
      where: { id: membership.id },
      data: { status: 'CANCELLED' },
    });

    await prisma.membershipPlanChangeLog.create({
      data: {
        userId,
        oldPlanId: membership.planId,
        changeType: 'CANCELLATION',
        oldPrice: membership.plan.price,
        changedBy: userId,
        reason: reason || 'User-initiated cancellation',
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        activityType: 'MEMBERSHIP_CANCELLED',
        entityType: 'membership',
        entityId: membership.id,
        description: `Membership cancelled: ${membership.plan.name}`,
      },
    });

    return res.json({ success: true, message: 'Membership cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling:', error);
    return res.status(500).json({ success: false, error: 'Failed to cancel membership' });
  }
});

export default router;
