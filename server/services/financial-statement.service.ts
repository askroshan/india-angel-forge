import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import path from 'path';
import { emailService } from './email.service';

const prisma = new PrismaClient();

interface StatementGenerationParams {
  userId: number;
  month: number;
  year: number;
  format: 'summary' | 'detailed';
}

interface StatementData {
  statementNumber: string;
  period: string;
  totalAmount: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  tds: number;
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    taxAmount: number;
    type: string;
    status: string;
  }>;
}

/**
 * Financial Statement Service
 * 
 * Generates monthly financial statements with tax breakdown.
 * Supports both summary and detailed formats with PDF export.
 * 
 * Features:
 * - Sequential statement numbering (FS-YYYY-MM-NNNNN)
 * - GST and TDS calculations
 * - PDF generation with Indian formatting
 * - Email delivery
 * - Statement history tracking
 * 
 * E2E Tests: FS-E2E-001 to FS-E2E-008
 */

/**
 * Generate a unique sequential statement number
 * Format: FS-YYYY-MM-NNNNN
 * 
 * @param year - Statement year
 * @param month - Statement month (1-12)
 * @returns Sequential statement number
 */
export async function generateStatementNumber(year: number, month: number): Promise<string> {
  const prefix = `FS-${year}-${month.toString().padStart(2, '0')}`;
  
  // Find the last statement for this month/year
  const lastStatement = await prisma.financialStatement.findFirst({
    where: {
      statementNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      statementNumber: 'desc',
    },
  });

  let sequence = 1;
  if (lastStatement) {
    // Extract sequence number from last statement
    const match = lastStatement.statementNumber.match(/-(\d{5})$/);
    if (match) {
      sequence = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}-${sequence.toString().padStart(5, '0')}`;
}

/**
 * Calculate tax breakdown for a transaction
 * 
 * @param amount - Transaction amount
 * @param isInterstate - Whether transaction is interstate (IGST) or intrastate (CGST+SGST)
 * @returns Tax breakdown
 */
function calculateTaxBreakdown(amount: number, isInterstate: boolean) {
  const taxRate = 0.18; // 18% GST
  const tdsRate = 0.01; // 1% TDS
  
  const taxAmount = amount * taxRate;
  const tds = amount * tdsRate;
  
  if (isInterstate) {
    return {
      cgst: 0,
      sgst: 0,
      igst: taxAmount,
      tds,
    };
  } else {
    return {
      cgst: taxAmount / 2,
      sgst: taxAmount / 2,
      igst: 0,
      tds,
    };
  }
}

/**
 * Generate statement data from transactions
 * 
 * @param userId - User ID
 * @param month - Statement month (1-12)
 * @param year - Statement year
 * @param format - Statement format (SUMMARY or DETAILED)
 * @returns Statement data
 */
async function generateStatementData(
  userId: number,
  month: number,
  year: number,
  format: 'SUMMARY' | 'DETAILED'
): Promise<StatementData> {
  // Get date range for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Fetch all transactions for the period
  const transactions = await prisma.payment.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: 'COMPLETED', // Only include completed payments
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Calculate totals and tax breakdown
  let totalAmount = 0;
  let totalTaxAmount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalTds = 0;

  const transactionDetails = transactions.map((txn) => {
    const isInterstate = false; // Assume intrastate for now (CGST+SGST)
    const taxes = calculateTaxBreakdown(txn.amount, isInterstate);
    
    totalAmount += txn.amount;
    totalTaxAmount += taxes.cgst + taxes.sgst + taxes.igst;
    totalCgst += taxes.cgst;
    totalSgst += taxes.sgst;
    totalIgst += taxes.igst;
    totalTds += taxes.tds;

    return {
      date: txn.createdAt.toISOString(),
      description: txn.description || 'Payment',
      amount: txn.amount,
      taxAmount: taxes.cgst + taxes.sgst + taxes.igst + taxes.tds,
      type: txn.type,
      status: txn.status,
    };
  });

  const statementNumber = await generateStatementNumber(year, month);
  const period = `${new Date(year, month - 1).toLocaleString('en-IN', { month: 'long' })} ${year}`;

  return {
    statementNumber,
    period,
    totalAmount,
    taxAmount: totalTaxAmount,
    cgst: totalCgst,
    sgst: totalSgst,
    igst: totalIgst,
    tds: totalTds,
    transactions: format === 'detailed' ? transactionDetails : [],
  };
}

/**
 * Format amount in Indian currency format
 * 
 * @param amount - Amount to format
 * @returns Formatted amount string
 */
function formatAmount(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generate PDF for financial statement
 * 
 * @param statementData - Statement data
 * @param format - Statement format
 * @param userName - User's name
 * @param userEmail - User's email
 * @returns Path to generated PDF
 */
async function generateStatementPDF(
  statementData: StatementData,
  format: 'SUMMARY' | 'DETAILED',
  userName: string,
  userEmail: string
): Promise<string> {
  const filename = `${statementData.statementNumber}.pdf`;
  const filepath = path.join(process.cwd(), 'public', 'statements', filename);

  // Ensure directory exists
  await fs.mkdir(path.join(process.cwd(), 'public', 'statements'), { recursive: true });

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = doc.pipe(require('fs').createWriteStream(filepath));

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('India Angel Forum', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('Financial Statement', { align: 'center' });
  doc.moveDown();

  // Statement details
  doc.fontSize(10);
  doc.text(`Statement Number: ${statementData.statementNumber}`);
  doc.text(`Period: ${statementData.period}`);
  doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`);
  doc.moveDown();

  // User details
  doc.text(`Name: ${userName}`);
  doc.text(`Email: ${userEmail}`);
  doc.moveDown();

  // Divider line
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  // Summary section
  doc.fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');

  const summaryY = doc.y;
  doc.text('Total Amount:', 50, summaryY);
  doc.text(formatAmount(statementData.totalAmount), 400, summaryY, { align: 'right' });

  doc.text('CGST (9%):', 50, summaryY + 20);
  doc.text(formatAmount(statementData.cgst), 400, summaryY + 20, { align: 'right' });

  doc.text('SGST (9%):', 50, summaryY + 40);
  doc.text(formatAmount(statementData.sgst), 400, summaryY + 40, { align: 'right' });

  doc.text('IGST (18%):', 50, summaryY + 60);
  doc.text(formatAmount(statementData.igst), 400, summaryY + 60, { align: 'right' });

  doc.text('TDS (1%):', 50, summaryY + 80);
  doc.text(formatAmount(statementData.tds), 400, summaryY + 80, { align: 'right' });

  doc.moveTo(50, summaryY + 100).lineTo(550, summaryY + 100).stroke();

  doc.font('Helvetica-Bold').text('Total Tax:', 50, summaryY + 110);
  doc.text(formatAmount(statementData.taxAmount), 400, summaryY + 110, { align: 'right' });

  doc.font('Helvetica-Bold').text('Grand Total:', 50, summaryY + 130);
  doc.text(formatAmount(statementData.totalAmount + statementData.taxAmount), 400, summaryY + 130, { align: 'right' });

  doc.moveDown(10);

  // Detailed transactions (if format is DETAILED)
  if (format === 'detailed' && statementData.transactions.length > 0) {
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Transaction Details', { underline: true });
    doc.moveDown();
    doc.fontSize(9).font('Helvetica');

    // Table headers
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 120;
    const col3 = 320;
    const col4 = 450;

    doc.font('Helvetica-Bold');
    doc.text('Date', col1, tableTop);
    doc.text('Type', col2, tableTop);
    doc.text('Description', col3, tableTop);
    doc.text('Amount', col4, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let yPos = tableTop + 25;
    doc.font('Helvetica');

    for (const txn of statementData.transactions) {
      if (yPos > 750) {
        doc.addPage();
        yPos = 50;
      }

      const date = new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      doc.text(date, col1, yPos);
      doc.text(txn.type, col2, yPos);
      doc.text(txn.description.substring(0, 30), col3, yPos);
      doc.text(formatAmount(txn.amount), col4, yPos);

      yPos += 20;
    }
  }

  // Footer
  doc.fontSize(8).font('Helvetica').text(
    'This is a system-generated statement and does not require a signature.',
    50,
    doc.page.height - 50,
    { align: 'center' }
  );

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(`/statements/${filename}`));
    stream.on('error', reject);
  });
}

/**
 * Generate financial statement
 * 
 * @param params - Statement generation parameters
 * @returns Created financial statement
 */
export async function generateFinancialStatement(params: StatementGenerationParams) {
  const { userId, month, year, format } = params;

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if statement already exists for this period
  const existingStatement = await prisma.financialStatement.findFirst({
    where: {
      userId,
      month,
      year,
    },
  });

  if (existingStatement) {
    throw new Error('Statement already exists for this period');
  }

  // Generate statement data
  const statementData = await generateStatementData(userId, month, year, format);

  // Generate PDF
  const pdfUrl = await generateStatementPDF(
    statementData,
    format,
    user.name || 'User',
    user.email
  );

  // Calculate totals
  const totalAmount = statementData.totalAmount;
  const totalTax = statementData.taxAmount;
  const netAmount = totalAmount + totalTax;

  // Create statement record
  const statement = await prisma.financialStatement.create({
    data: {
      userId,
      statementNumber: statementData.statementNumber,
      month,
      year,
      format,
      totalAmount,
      totalTax,
      netAmount,
      cgst: statementData.cgst,
      sgst: statementData.sgst,
      igst: statementData.igst,
      tds: statementData.tds,
      pdfUrl,
      emailedTo: [],
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId,
      activityType: 'STATEMENT_GENERATED',
      description: `Financial statement ${statementData.statementNumber} generated for ${statementData.period}`,
      metadata: {
        statementId: statement.id,
        statementNumber: statement.statementNumber,
        period: statementData.period,
        format,
      },
    },
  });

  return statement;
}

/**
 * Email financial statement to user
 * 
 * @param statementId - Statement ID
 * @returns Updated statement with email status
 */
export async function emailFinancialStatement(statementId: number) {
  const statement = await prisma.financialStatement.findUnique({
    where: { id: statementId },
    include: { user: true },
  });

  if (!statement) {
    throw new Error('Statement not found');
  }

  const user = statement.user;
  const period = `${new Date(statement.year, statement.month - 1).toLocaleString('en-IN', { month: 'long' })} ${statement.year}`;

  // Send email
  await emailService.sendEmail({
    to: user.email,
    subject: `Financial Statement - ${period}`,
    html: `
      <h2>Financial Statement - ${period}</h2>
      <p>Dear ${user.name || 'User'},</p>
      <p>Your financial statement for ${period} is ready.</p>
      <p><strong>Statement Number:</strong> ${statement.statementNumber}</p>
      <p><strong>Total Amount:</strong> ${formatAmount(statement.totalAmount)}</p>
      <p><strong>Total Tax:</strong> ${formatAmount(statement.totalTax)}</p>
      <p><strong>Net Amount:</strong> ${formatAmount(statement.netAmount)}</p>
      <p><a href="${process.env.APP_URL || 'http://localhost:8080'}${statement.pdfUrl}">Download PDF</a></p>
      <p>Best regards,<br/>India Angel Forum</p>
    `,
  });

  // Update statement with email timestamp
  const updatedStatement = await prisma.financialStatement.update({
    where: { id: statementId },
    data: {
      emailedTo: [...statement.emailedTo, user.email],
      emailedAt: new Date(),
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId: user.id,
      activityType: 'STATEMENT_EMAILED',
      description: `Financial statement ${statement.statementNumber} emailed to ${user.email}`,
      metadata: {
        statementId: statement.id,
        statementNumber: statement.statementNumber,
      },
    },
  });

  return updatedStatement;
}

/**
 * Get user's financial statements
 * 
 * @param userId - User ID
 * @param filters - Optional filters
 * @returns List of financial statements
 */
export async function getUserStatements(
  userId: number,
  filters: { year?: number; month?: number; format?: string } = {}
) {
  const where: any = { userId };

  if (filters.year) where.year = filters.year;
  if (filters.month) where.month = filters.month;
  if (filters.format) where.format = filters.format;

  const statements = await prisma.financialStatement.findMany({
    where,
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
    ],
  });

  return statements;
}
