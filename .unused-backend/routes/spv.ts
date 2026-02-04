import { Router } from 'express';
import { prisma } from '@/lib/db';
import { authenticateToken } from '../../../server';

const router = Router();

// Get SPV by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const spv = await prisma.spv.findUnique({
      where: { id },
      include: {
        leadInvestor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        members: {
          include: {
            investor: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!spv) {
      return res.status(404).json({ error: 'SPV not found' });
    }

    // Check access - must be lead investor or member
    const isMember = spv.members.some(m => m.investorId === userId);
    if (spv.leadInvestorId !== userId && !isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Convert to camelCase
    const response = {
      id: spv.id,
      name: spv.name,
      dealId: spv.dealId,
      leadInvestorId: spv.leadInvestorId,
      leadInvestorName: spv.leadInvestor.fullName,
      leadInvestorEmail: spv.leadInvestor.email,
      targetAmount: spv.targetAmount,
      carryPercentage: spv.carryPercentage,
      description: spv.description,
      status: spv.status,
      createdAt: spv.createdAt,
      updatedAt: spv.updatedAt,
      members: spv.members.map(m => ({
        id: m.id,
        spvId: m.spvId,
        investorId: m.investorId,
        investorName: m.investor.fullName,
        investorEmail: m.investor.email,
        commitmentAmount: m.commitmentAmount,
        status: m.status,
        joinedAt: m.joinedAt,
        createdAt: m.createdAt,
      })),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching SPV:', error);
    res.status(500).json({ error: 'Failed to fetch SPV' });
  }
});

// Create SPV
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { name, dealId, targetAmount, carryPercentage, description } = req.body;

    // Validate required fields
    if (!name || !dealId || !targetAmount || carryPercentage === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if SPV already exists for this deal
    const existingSpv = await prisma.spv.findFirst({
      where: { dealId },
    });

    if (existingSpv) {
      return res.status(400).json({ error: 'SPV already exists for this deal' });
    }

    const spv = await prisma.spv.create({
      data: {
        name,
        dealId,
        leadInvestorId: userId,
        targetAmount,
        carryPercentage,
        description,
        status: 'forming',
      },
      include: {
        leadInvestor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Convert to camelCase
    const response = {
      id: spv.id,
      name: spv.name,
      dealId: spv.dealId,
      leadInvestorId: spv.leadInvestorId,
      leadInvestorName: spv.leadInvestor.fullName,
      leadInvestorEmail: spv.leadInvestor.email,
      targetAmount: spv.targetAmount,
      carryPercentage: spv.carryPercentage,
      description: spv.description,
      status: spv.status,
      createdAt: spv.createdAt,
      updatedAt: spv.updatedAt,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating SPV:', error);
    res.status(500).json({ error: 'Failed to create SPV' });
  }
});

// Invite co-investors
router.post('/:id/invite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { investorId, commitmentAmount } = req.body;

    // Validate
    if (!investorId || !commitmentAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check SPV exists and user is lead investor
    const spv = await prisma.spv.findUnique({
      where: { id },
    });

    if (!spv) {
      return res.status(404).json({ error: 'SPV not found' });
    }

    if (spv.leadInvestorId !== userId) {
      return res.status(403).json({ error: 'Only lead investor can invite members' });
    }

    // Check if already a member
    const existingMember = await prisma.spvMember.findUnique({
      where: {
        spvId_investorId: {
          spvId: id,
          investorId,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Investor is already a member' });
    }

    const member = await prisma.spvMember.create({
      data: {
        spvId: id,
        investorId,
        commitmentAmount,
        status: 'invited',
      },
      include: {
        investor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Convert to camelCase
    const response = {
      id: member.id,
      spvId: member.spvId,
      investorId: member.investorId,
      investorName: member.investor.fullName,
      investorEmail: member.investor.email,
      commitmentAmount: member.commitmentAmount,
      status: member.status,
      joinedAt: member.joinedAt,
      createdAt: member.createdAt,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({ error: 'Failed to invite member' });
  }
});

// Update member status (accept/decline invitation)
router.patch('/:id/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user!.userId;
    const { status } = req.body;

    if (!status || !['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check member exists and user is the invited investor
    const member = await prisma.spvMember.findUnique({
      where: { id: memberId },
      include: {
        investor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (member.investorId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (member.spvId !== id) {
      return res.status(400).json({ error: 'Member does not belong to this SPV' });
    }

    const updatedMember = await prisma.spvMember.update({
      where: { id: memberId },
      data: {
        status,
        joinedAt: status === 'accepted' ? new Date() : null,
      },
    });

    // Convert to camelCase
    const response = {
      id: updatedMember.id,
      spvId: updatedMember.spvId,
      investorId: updatedMember.investorId,
      investorName: member.investor.fullName,
      investorEmail: member.investor.email,
      commitmentAmount: updatedMember.commitmentAmount,
      status: updatedMember.status,
      joinedAt: updatedMember.joinedAt,
      createdAt: updatedMember.createdAt,
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating member status:', error);
    res.status(500).json({ error: 'Failed to update member status' });
  }
});

// Get all SPVs for current user (as lead or member)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // Get SPVs where user is lead investor
    const leadSpvs = await prisma.spv.findMany({
      where: { leadInvestorId: userId },
      include: {
        leadInvestor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        members: {
          include: {
            investor: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Get SPVs where user is a member
    const memberSpvs = await prisma.spv.findMany({
      where: {
        members: {
          some: {
            investorId: userId,
          },
        },
      },
      include: {
        leadInvestor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        members: {
          include: {
            investor: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Combine and deduplicate
    const allSpvs = [...leadSpvs, ...memberSpvs].filter(
      (spv, index, self) => self.findIndex(s => s.id === spv.id) === index
    );

    // Convert to camelCase
    const response = allSpvs.map(spv => ({
      id: spv.id,
      name: spv.name,
      dealId: spv.dealId,
      leadInvestorId: spv.leadInvestorId,
      leadInvestorName: spv.leadInvestor.fullName,
      leadInvestorEmail: spv.leadInvestor.email,
      targetAmount: spv.targetAmount,
      carryPercentage: spv.carryPercentage,
      description: spv.description,
      status: spv.status,
      createdAt: spv.createdAt,
      updatedAt: spv.updatedAt,
      members: spv.members.map(m => ({
        id: m.id,
        spvId: m.spvId,
        investorId: m.investorId,
        investorName: m.investor.fullName,
        investorEmail: m.investor.email,
        commitmentAmount: m.commitmentAmount,
        status: m.status,
        joinedAt: m.joinedAt,
        createdAt: m.createdAt,
      })),
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching SPVs:', error);
    res.status(500).json({ error: 'Failed to fetch SPVs' });
  }
});

export default router;
