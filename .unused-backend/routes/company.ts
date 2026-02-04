import { Router } from 'express';
import { prisma } from '@/lib/db';
import { authenticateToken } from '../../server';

const router = Router();

// Get company profile by founder ID
router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    const founderId = req.user.userId;

    const profile = await prisma.companyProfile.findUnique({
      where: { founderId },
    });

    res.json(profile);
  } catch (error) {
    console.error('Error fetching company profile:', error);
    res.status(500).json({ error: 'Failed to fetch company profile' });
  }
});

// Create or update company profile
router.post('/profile', authenticateToken, async (req: any, res) => {
  try {
    const founderId = req.user.userId;
    const {
      companyName,
      description,
      industry,
      stage,
      foundedYear,
      teamSize,
      website,
      linkedin,
      twitter,
      location,
    } = req.body;

    // Check if profile exists
    const existing = await prisma.companyProfile.findUnique({
      where: { founderId },
    });

    let profile;
    if (existing) {
      // Update existing profile
      profile = await prisma.companyProfile.update({
        where: { founderId },
        data: {
          companyName,
          description,
          industry,
          stage,
          foundedYear,
          teamSize,
          website,
          linkedin,
          twitter,
          location,
        },
      });
    } else {
      // Create new profile
      profile = await prisma.companyProfile.create({
        data: {
          founderId,
          companyName,
          description,
          industry,
          stage,
          foundedYear,
          teamSize,
          website,
          linkedin,
          twitter,
          location,
        },
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error saving company profile:', error);
    res.status(500).json({ error: 'Failed to save company profile' });
  }
});

// Get fundraising rounds for a company
router.get('/fundraising-rounds', authenticateToken, async (req: any, res) => {
  try {
    const founderId = req.user.userId;

    // Get company profile
    const profile = await prisma.companyProfile.findUnique({
      where: { founderId },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    // Get fundraising rounds
    const rounds = await prisma.fundraisingRound.findMany({
      where: { companyId: profile.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(rounds);
  } catch (error) {
    console.error('Error fetching fundraising rounds:', error);
    res.status(500).json({ error: 'Failed to fetch fundraising rounds' });
  }
});

// Create fundraising round
router.post('/fundraising-rounds', authenticateToken, async (req: any, res) => {
  try {
    const founderId = req.user.userId;
    const {
      roundName,
      targetAmount,
      raisedAmount,
      status,
      startDate,
      targetCloseDate,
    } = req.body;

    // Get company profile
    const profile = await prisma.companyProfile.findUnique({
      where: { founderId },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    const round = await prisma.fundraisingRound.create({
      data: {
        companyId: profile.id,
        roundName,
        targetAmount,
        raisedAmount: raisedAmount || 0,
        status,
        startDate: startDate ? new Date(startDate) : null,
        targetCloseDate: targetCloseDate ? new Date(targetCloseDate) : null,
      },
    });

    res.json(round);
  } catch (error) {
    console.error('Error creating fundraising round:', error);
    res.status(500).json({ error: 'Failed to create fundraising round' });
  }
});

export default router;
