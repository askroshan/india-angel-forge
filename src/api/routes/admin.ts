import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../server';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to check admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user.roles.includes('admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all users with their roles
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: String(search), mode: 'insensitive' } },
        { fullName: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const total = await prisma.user.count({ where });

    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      roles: user.roles.map(ur => ur.role.name),
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get available roles
router.get('/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    res.json(roles);
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
});

// Assign role to user
router.post('/users/:userId/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId, roleName } = req.body;

    // Get or create role
    let role;
    if (roleId) {
      role = await prisma.role.findUnique({ where: { id: roleId } });
    } else if (roleName) {
      role = await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: {
          name: roleName,
          description: `${roleName} role`,
        },
      });
    } else {
      return res.status(400).json({ error: 'roleId or roleName required' });
    }

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Assign role to user
    const userRole = await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId,
        roleId: role.id,
      },
    });

    res.json({ success: true, userRole });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
});

// Remove role from user
router.delete('/users/:userId/roles/:roleId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, roleId } = req.params;

    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({ error: 'Failed to remove role' });
  }
});

// Get audit logs
router.get('/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, action, startDate, endDate, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (userId) {
      where.userId = String(userId);
    }
    
    if (action) {
      where.details = { contains: String(action) };
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate));
    }

    // Since we don't have an audit_logs table yet, we'll use event registrations as proxy
    // In production, create a proper audit_logs table
    const logs = await prisma.eventRegistration.findMany({
      where: {
        userId: userId ? String(userId) : undefined,
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
        event: {
          select: {
            title: true,
          },
        },
      },
    });

    const total = await prisma.eventRegistration.count({
      where: {
        userId: userId ? String(userId) : undefined,
      },
    });

    // Format as audit logs
    const formattedLogs = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      userEmail: log.user.email,
      userName: log.user.fullName,
      action: 'event_registration',
      details: `Registered for event: ${log.event.title}`,
      ipAddress: null,
      timestamp: log.createdAt,
    }));

    res.json({
      logs: formattedLogs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

// Create audit log entry
router.post('/audit-logs', authenticateToken, async (req, res) => {
  try {
    const { action, details, ipAddress } = req.body;
    const userId = req.user.userId;

    // For now, we'll just log to console since we don't have an audit_logs table
    // In production, create proper audit_logs table
    console.log('Audit Log:', {
      userId,
      action,
      details,
      ipAddress,
      timestamp: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Create audit log error:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

export default router;
