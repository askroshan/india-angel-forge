import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../server';

const router = express.Router();
const prisma = new PrismaClient();

// Get portfolio companies for investor
router.get('/companies', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const companies = await prisma.portfolioCompany.findMany({
      where: { investorId: userId },
      orderBy: { investmentDate: 'desc' },
    });

    res.json(companies);
  } catch (error) {
    console.error('Get portfolio companies error:', error);
    res.status(500).json({ error: 'Failed to get portfolio companies' });
  }
});

// Add portfolio company
router.post('/companies', authenticateToken, async (req, res) => {
  try {
    const investorId = req.user.userId;
    const {
      companyName,
      industry,
      investmentAmount,
      investmentDate,
      equityPercentage,
      currentValuation,
      notes,
    } = req.body;

    const company = await prisma.portfolioCompany.create({
      data: {
        investorId,
        companyName,
        industry,
        investmentAmount,
        investmentDate: new Date(investmentDate),
        equityPercentage,
        currentValuation,
        notes,
      },
    });

    res.json(company);
  } catch (error) {
    console.error('Add portfolio company error:', error);
    res.status(500).json({ error: 'Failed to add portfolio company' });
  }
});

// Update portfolio company
router.patch('/companies/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.userId;
    const { currentValuation, notes, status } = req.body;

    // Verify ownership
    const company = await prisma.portfolioCompany.findUnique({
      where: { id: companyId },
    });

    if (!company || company.investorId !== userId) {
      return res.status(404).json({ error: 'Portfolio company not found' });
    }

    const updated = await prisma.portfolioCompany.update({
      where: { id: companyId },
      data: {
        ...(currentValuation && { currentValuation }),
        ...(notes && { notes }),
        ...(status && { status }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update portfolio company error:', error);
    res.status(500).json({ error: 'Failed to update portfolio company' });
  }
});

// Get portfolio updates
router.get('/updates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { companyId } = req.query;

    const where: any = {};
    
    if (companyId) {
      // Get updates for specific company if investor owns it
      const company = await prisma.portfolioCompany.findFirst({
        where: {
          id: String(companyId),
          investorId: userId,
        },
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      where.companyId = String(companyId);
    } else {
      // Get updates for all portfolio companies
      const companies = await prisma.portfolioCompany.findMany({
        where: { investorId: userId },
        select: { id: true },
      });

      where.companyId = {
        in: companies.map(c => c.id),
      };
    }

    const updates = await prisma.portfolioUpdate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            companyName: true,
          },
        },
      },
    });

    res.json(updates);
  } catch (error) {
    console.error('Get portfolio updates error:', error);
    res.status(500).json({ error: 'Failed to get updates' });
  }
});

// Post portfolio update (founder)
router.post('/updates', authenticateToken, async (req, res) => {
  try {
    const founderId = req.user.userId;
    const { companyId, title, content, updateType, metrics } = req.body;

    // Verify company exists (simplified - in production check if founder owns company)
    const company = await prisma.portfolioCompany.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const update = await prisma.portfolioUpdate.create({
      data: {
        companyId,
        founderId,
        title,
        content,
        updateType,
        metrics,
      },
    });

    res.json(update);
  } catch (error) {
    console.error('Post portfolio update error:', error);
    res.status(500).json({ error: 'Failed to post update' });
  }
});

// Get portfolio performance metrics
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const companies = await prisma.portfolioCompany.findMany({
      where: { investorId: userId },
    });

    // Calculate metrics
    const totalInvested = companies.reduce((sum, c) => sum + (c.investmentAmount || 0), 0);
    const currentValue = companies.reduce((sum, c) => sum + (c.currentValuation || 0), 0);
    const totalReturn = currentValue - totalInvested;
    const roi = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    const metrics = {
      totalCompanies: companies.length,
      totalInvested,
      currentValue,
      totalReturn,
      roi: roi.toFixed(2),
      companies: companies.map(c => ({
        id: c.id,
        companyName: c.companyName,
        industry: c.industry,
        invested: c.investmentAmount,
        currentValue: c.currentValuation,
        return: (c.currentValuation || 0) - (c.investmentAmount || 0),
        roi: c.investmentAmount > 0 
          ? (((c.currentValuation || 0) - c.investmentAmount) / c.investmentAmount * 100).toFixed(2)
          : '0.00',
      })),
    };

    res.json(metrics);
  } catch (error) {
    console.error('Get portfolio performance error:', error);
    res.status(500).json({ error: 'Failed to get performance' });
  }
});

export default router;
