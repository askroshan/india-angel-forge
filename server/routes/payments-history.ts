/**
 * Payment History API Routes
 * 
 * Provides enhanced transaction history with pagination, filtering,
 * search, sorting, and export capabilities.
 * 
 * @module routes/payments-history
 */

import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { db } from '../../db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const router = Router();

/**
 * Query parameter validation schema
 */
const historyQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  
  // Date filters
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  
  // Type filter
  type: z.enum(['INVESTMENT', 'MEMBERSHIP_FEE', 'EVENT_FEE', 'REFUND']).optional(),
  
  // Status filter
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  
  // Gateway filter
  gateway: z.enum(['RAZORPAY', 'STRIPE']).optional(),
  
  // Amount filter
  amountMin: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  amountMax: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  
  // Search
  search: z.string().optional(),
  
  // Sort
  sortBy: z.enum(['date', 'amount']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * GET /api/payments/history
 * 
 * Get paginated transaction history with filters
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - dateFrom: Filter from date (ISO 8601)
 * - dateTo: Filter to date (ISO 8601)
 * - type: Transaction type
 * - status: Payment status
 * - gateway: Payment gateway
 * - amountMin: Minimum amount
 * - amountMax: Maximum amount
 * - search: Search term (transaction ID or description)
 * - sortBy: Sort field (date | amount)
 * - sortOrder: Sort order (asc | desc)
 */
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Validate query parameters
    const query = historyQuerySchema.parse(req.query);
    
    // Ensure limit is reasonable
    const limit = Math.min(query.limit, 100);
    const skip = (query.page - 1) * limit;
    
    // Build where clause
    const where: Prisma.PaymentWhereInput = {
      userId,
    };
    
    // Date filters
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = new Date(query.dateTo);
      }
    }
    
    // Type filter
    if (query.type) {
      where.type = query.type;
    }
    
    // Status filter
    if (query.status) {
      where.status = query.status;
    }
    
    // Gateway filter
    if (query.gateway) {
      where.gateway = query.gateway;
    }
    
    // Amount filter
    if (query.amountMin !== undefined || query.amountMax !== undefined) {
      where.amount = {};
      if (query.amountMin !== undefined) {
        where.amount.gte = query.amountMin;
      }
      if (query.amountMax !== undefined) {
        where.amount.lte = query.amountMax;
      }
    }
    
    // Search filter
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        { gatewayOrderId: { contains: query.search, mode: 'insensitive' } },
        { gatewayPaymentId: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    
    // Build orderBy clause
    const orderBy: Prisma.PaymentOrderByWithRelationInput = {};
    if (query.sortBy === 'date') {
      orderBy.createdAt = query.sortOrder;
    } else if (query.sortBy === 'amount') {
      orderBy.amount = query.sortOrder;
    }
    
    // Execute queries in parallel
    const [payments, totalCount] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          amount: true,
          currency: true,
          gateway: true,
          status: true,
          type: true,
          gatewayOrderId: true,
          gatewayPaymentId: true,
          description: true,
          refundAmount: true,
          refundReason: true,
          refundedAt: true,
          createdAt: true,
          completedAt: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
      }),
      db.payment.count({ where }),
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = query.page < totalPages;
    const hasPreviousPage = query.page > 1;
    
    return res.json({
      success: true,
      data: {
        transactions: payments,
        pagination: {
          page: query.page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history',
    });
  }
});

/**
 * GET /api/payments/history/export/csv
 * 
 * Export transaction history to CSV
 */
router.get('/history/export/csv', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Validate query parameters (reuse same filters)
    const query = historyQuerySchema.parse(req.query);
    
    // Build where clause (same as history endpoint)
    const where: Prisma.PaymentWhereInput = { userId };
    
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.gateway) where.gateway = query.gateway;
    if (query.amountMin !== undefined || query.amountMax !== undefined) {
      where.amount = {};
      if (query.amountMin !== undefined) where.amount.gte = query.amountMin;
      if (query.amountMax !== undefined) where.amount.lte = query.amountMax;
    }
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    
    // Fetch all matching payments (no pagination for export)
    const payments = await db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        currency: true,
        gateway: true,
        status: true,
        type: true,
        description: true,
        refundAmount: true,
        createdAt: true,
        completedAt: true,
      },
    });
    
    // Generate CSV
    const csvHeaders = [
      'Transaction ID',
      'Date',
      'Type',
      'Amount',
      'Currency',
      'Status',
      'Gateway',
      'Description',
      'Refund Amount',
    ];
    
    const csvRows = payments.map(payment => [
      payment.id,
      payment.createdAt.toISOString(),
      payment.type,
      payment.amount.toString(),
      payment.currency,
      payment.status,
      payment.gateway,
      payment.description || '',
      payment.refundAmount?.toString() || '',
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
    
    // Set response headers
    const filename = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return res.send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export transactions',
    });
  }
});

/**
 * GET /api/payments/history/export/pdf
 * 
 * Export transaction history to PDF
 */
router.get('/history/export/pdf', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Validate query parameters
    const query = historyQuerySchema.parse(req.query);
    
    // Build where clause
    const where: Prisma.PaymentWhereInput = { userId };
    
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.gateway) where.gateway = query.gateway;
    if (query.amountMin !== undefined || query.amountMax !== undefined) {
      where.amount = {};
      if (query.amountMin !== undefined) where.amount.gte = query.amountMin;
      if (query.amountMax !== undefined) where.amount.lte = query.amountMax;
    }
    
    // Fetch user and payments
    const [user, payments] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          currency: true,
          gateway: true,
          status: true,
          type: true,
          description: true,
          refundAmount: true,
          createdAt: true,
          completedAt: true,
        },
      }),
    ]);
    
    // Generate PDF using pdfkit
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    const filename = `transactions-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).text('Transaction History', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`User: ${user?.fullName || user?.email}`, { align: 'left' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'left' });
    doc.moveDown();
    
    // Table headers
    const tableTop = doc.y;
    const colWidths = [80, 80, 100, 80, 80, 100];
    const headers = ['Date', 'Type', 'Amount', 'Status', 'Gateway', 'Description'];
    
    doc.fontSize(9).font('Helvetica-Bold');
    headers.forEach((header, i) => {
      const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
    });
    
    doc.moveDown();
    doc.font('Helvetica').fontSize(8);
    
    // Table rows
    payments.forEach((payment) => {
      const y = doc.y;
      
      if (y > 700) {
        doc.addPage();
      }
      
      const row = [
        new Date(payment.createdAt).toLocaleDateString('en-IN'),
        payment.type,
        `₹${payment.amount.toLocaleString('en-IN')}`,
        payment.status,
        payment.gateway,
        payment.description || '-',
      ];
      
      row.forEach((cell, i) => {
        const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(cell, x, y, { width: colWidths[i], align: 'left' });
      });
      
      doc.moveDown(0.5);
    });
    
    // Summary
    doc.moveDown();
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    doc.fontSize(10).font('Helvetica-Bold')
      .text(`Total Transactions: ${payments.length}`, 50, doc.y);
    doc.text(`Total Amount: ₹${totalAmount.toLocaleString('en-IN')}`, 50, doc.y);
    
    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export transactions to PDF',
    });
  }
});

export default router;
