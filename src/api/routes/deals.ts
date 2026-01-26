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

// Get all deal interests for the current investor
router.get('/interests', authenticateToken, async (req: any, res) => {
  try {
    const investorId = req.user.userId;

    const interests = await prisma.dealInterest.findMany({
      where: { investorId },
      include: {
        deal: {
          select: {
            id: true,
            title: true,
            companyName: true,
            slug: true,
            description: true,
            industrySector: true,
            dealSize: true,
            minInvestment: true,
            dealStatus: true,
            closingDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(interests);
  } catch (error) {
    console.error('Error fetching deal interests:', error);
    res.status(500).json({ error: 'Failed to fetch deal interests' });
  }
});

// Get a specific deal interest
router.get('/interests/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const investorId = req.user.userId;

    const interest = await prisma.dealInterest.findFirst({
      where: {
        id,
        investorId,
      },
      include: {
        deal: {
          select: {
            id: true,
            title: true,
            companyName: true,
            description: true,
            dealSize: true,
            minInvestment: true,
            dealStatus: true,
            closingDate: true,
          },
        },
      },
    });

    if (!interest) {
      return res.status(404).json({ error: 'Deal interest not found' });
    }

    res.json(interest);
  } catch (error) {
    console.error('Error fetching deal interest:', error);
    res.status(500).json({ error: 'Failed to fetch deal interest' });
  }
});

// Get documents for a deal
router.get('/:dealId/documents', authenticateToken, async (req: any, res) => {
  try {
    const { dealId } = req.params;
    const investorId = req.user.userId;

    // Check if investor has access to this deal
    const interest = await prisma.dealInterest.findFirst({
      where: {
        dealId,
        investorId,
      },
    });

    if (!interest) {
      return res.status(403).json({ error: 'Access denied. You must express interest in this deal to view documents.' });
    }

    const documents = await prisma.dealDocument.findMany({
      where: { dealId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching deal documents:', error);
    res.status(500).json({ error: 'Failed to fetch deal documents' });
  }
});

// Create investment commitment
router.post('/commitments', authenticateToken, async (req: any, res) => {
  try {
    const investorId = req.user.userId;
    const { interestId, spvId, amount } = req.body;

    // Verify interest belongs to investor and is accepted
    const interest = await prisma.dealInterest.findFirst({
      where: {
        id: interestId,
        investorId,
        status: 'accepted',
      },
    });

    if (!interest) {
      return res.status(403).json({ error: 'Deal interest not found or not accepted' });
    }

    const commitment = await prisma.investmentCommitment.create({
      data: {
        interestId,
        investorId,
        spvId,
        amount,
        status: 'pending',
      },
    });

    res.json(commitment);
  } catch (error) {
    console.error('Error creating commitment:', error);
    res.status(500).json({ error: 'Failed to create commitment' });
  }
});

// Get commitment by interest ID
router.get('/commitments/by-interest/:interestId', authenticateToken, async (req: any, res) => {
  try {
    const { interestId } = req.params;
    const investorId = req.user.userId;

    const commitment = await prisma.investmentCommitment.findFirst({
      where: {
        interestId,
        investorId,
      },
    });

    if (!commitment) {
      return res.status(404).json({ error: 'Commitment not found' });
    }

    res.json(commitment);
  } catch (error) {
    console.error('Error fetching commitment:', error);
    res.status(500).json({ error: 'Failed to fetch commitment' });
  }
});

export default router;
