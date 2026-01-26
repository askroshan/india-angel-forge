import { Router } from 'express';
import { prisma } from '@/lib/db';
import { authenticateToken } from '../../server';

const router = Router();

// Get all deals for an investor
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const investorId = req.user.userId;

    const deals = await prisma.deal.findMany({
      where: { investorId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// Get a specific deal
router.get('/:dealId', authenticateToken, async (req: any, res) => {
  try {
    const { dealId } = req.params;
    const investorId = req.user.userId;

    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        investorId,
      },
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json(deal);
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

// Create a new deal
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const investorId = req.user.userId;
    const { companyName, valuation, amount, status, industry, stage } = req.body;

    const deal = await prisma.deal.create({
      data: {
        investorId,
        companyName,
        valuation,
        amount,
        status,
        industry,
        stage,
      },
    });

    res.json(deal);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

// Get due diligence items for a deal
router.get('/:dealId/due-diligence', authenticateToken, async (req: any, res) => {
  try {
    const { dealId } = req.params;
    const investorId = req.user.userId;

    // Verify deal belongs to investor
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, investorId },
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const items = await prisma.dueDiligenceItem.findMany({
      where: { dealId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching due diligence items:', error);
    res.status(500).json({ error: 'Failed to fetch due diligence items' });
  }
});

// Create due diligence item
router.post('/:dealId/due-diligence', authenticateToken, async (req: any, res) => {
  try {
    const { dealId } = req.params;
    const investorId = req.user.userId;
    const { itemName, category, notes } = req.body;

    // Verify deal belongs to investor
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, investorId },
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const item = await prisma.dueDiligenceItem.create({
      data: {
        dealId,
        investorId,
        itemName,
        category,
        notes,
        completed: false,
      },
    });

    res.json(item);
  } catch (error) {
    console.error('Error creating due diligence item:', error);
    res.status(500).json({ error: 'Failed to create due diligence item' });
  }
});

// Update due diligence item
router.patch('/:dealId/due-diligence/:itemId', authenticateToken, async (req: any, res) => {
  try {
    const { dealId, itemId } = req.params;
    const investorId = req.user.userId;
    const { completed, notes } = req.body;

    // Verify item belongs to investor's deal
    const item = await prisma.dueDiligenceItem.findFirst({
      where: {
        id: itemId,
        dealId,
        investorId,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Due diligence item not found' });
    }

    const updated = await prisma.dueDiligenceItem.update({
      where: { id: itemId },
      data: {
        ...(completed !== undefined && { completed }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating due diligence item:', error);
    res.status(500).json({ error: 'Failed to update due diligence item' });
  }
});

export default router;
