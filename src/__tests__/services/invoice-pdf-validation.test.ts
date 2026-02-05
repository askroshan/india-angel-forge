import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { invoiceService } from '../../../server/services/invoice.service';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';

/**
 * Invoice PDF Validation Tests
 * 
 * Tests to verify:
 * - PDF files are generated correctly
 * - PDF content includes expected information
 * - PDF files are not corrupted
 * - PDF file sizes are reasonable
 * - Invoice numbers, amounts, and dates are present
 */

const prisma = new PrismaClient();

describe('Invoice PDF Validation', () => {
  let testUserId: string;
  let testPaymentId: string;
  let generatedInvoicePath: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'pdf-test@example.com',
        fullName: 'PDF Test User',
        passwordHash: 'test-hash',
      },
    });
    testUserId = testUser.id;

    // Create test payment
    const testPayment = await prisma.payment.create({
      data: {
        userId: testUserId,
        amount: 100000, // ₹1,000
        currency: 'INR',
        status: 'COMPLETED',
        gateway: 'razorpay',
        gatewayOrderId: 'test-order-pdf',
        gatewayPaymentId: 'test-payment-pdf',
        type: 'membership',
        description: 'Test Membership Payment',
        completedAt: new Date(),
      },
    });
    testPaymentId = testPayment.id;
  });

  afterAll(async () => {
    // Clean up generated PDF
    if (generatedInvoicePath) {
      try {
        await fs.unlink(generatedInvoicePath);
      } catch (error) {
        // Ignore if file doesn't exist
      }
    }

    // Clean up test data
    await prisma.invoice.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.payment.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });

    await prisma.$disconnect();
  });

  it('should generate a PDF invoice successfully', async () => {
    const invoiceData = {
      userId: testUserId,
      paymentId: testPaymentId,
      buyerName: 'PDF Test User',
      buyerEmail: 'pdf-test@example.com',
      buyerPhone: '+91 98765 43210',
      buyerPAN: 'ABCDE1234F',
      buyerAddress: '123 Test Street, Mumbai, Maharashtra 400001',
      lineItems: [
        {
          description: 'Annual Membership Fee',
          quantity: 1,
          unitPrice: 100000,
          amount: 100000,
        },
      ],
      subtotal: 100000,
      cgst: 9000, // 9%
      sgst: 9000, // 9%
      totalAmount: 118000, // ₹1,180 with 18% GST
      notes: 'Thank you for your membership!',
    };

    const result = await invoiceService.generateInvoice(invoiceData);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.invoiceNumber).toMatch(/INV-\d{4}-\d{2}-\d{5}/);
    expect(result.pdfPath).toBeDefined();

    generatedInvoicePath = path.join(process.cwd(), result.pdfPath);

    // Verify PDF file exists
    const fileExists = await fs.access(generatedInvoicePath)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should generate PDF with reasonable file size (5KB - 500KB)', async () => {
    expect(generatedInvoicePath).toBeDefined();

    const stats = await fs.stat(generatedInvoicePath);
    const fileSizeKB = stats.size / 1024;

    expect(fileSizeKB).toBeGreaterThan(5);
    expect(fileSizeKB).toBeLessThan(500);
  });

  it('should generate valid PDF that can be parsed', async () => {
    expect(generatedInvoicePath).toBeDefined();

    const pdfBuffer = await fs.readFile(generatedInvoicePath);
    
    // This will throw an error if PDF is corrupted
    const parsedPdf = await pdfParse(pdfBuffer);
    
    expect(parsedPdf).toBeDefined();
    expect(parsedPdf.text).toBeDefined();
    expect(parsedPdf.numpages).toBeGreaterThan(0);
  });

  it('should include invoice number in PDF content', async () => {
    expect(generatedInvoicePath).toBeDefined();

    const pdfBuffer = await fs.readFile(generatedInvoicePath);
    const parsedPdf = await pdfParse(pdfBuffer);

    // Invoice number format: INV-YYYY-MM-NNNNN
    const invoiceNumberRegex = /INV-\d{4}-\d{2}-\d{5}/;
    expect(parsedPdf.text).toMatch(invoiceNumberRegex);
  });

  it('should include buyer name in PDF content', async () => {
    expect(generatedInvoicePath).toBeDefined();

    const pdfBuffer = await fs.readFile(generatedInvoicePath);
    const parsedPdf = await pdfParse(pdfBuffer);

    expect(parsedPdf.text).toContain('PDF Test User');
  });

  it('should include buyer email in PDF content', async () => {
    expect(generatedInvoicePath).toBeDefined();

    const pdfBuffer = await fs.readFile(generatedInvoicePath);
    const parsedPdf = await pdfParse(pdfBuffer);

    expect(parsedPdf.text).toContain('pdf-test@example.com');
  });

  it('should include line item description in PDF content', async () => {
    expect(generatedInvoicePath).toBeDefined();

    const pdfBuffer = await fs.readFile(generatedInvoicePath);
    const parsedPdf = await pdfParse(pdfBuffer);

    expect(parsedPdf.text).toContain('Annual Membership Fee');
  });

  it('should include subtotal amount in PDF content', async () => {
    expect(generatedInvoicePath).toBeDefined();

    const pdfBuffer = await fs.readFile(generatedInvoicePath);
    const parsedPdf = await pdfParse(pdfBuffer);

    // Subtotal: ₹1,000 (might be formatted as 1,000.00 or 1000)
    expect(parsedPdf.text).toMatch(/1[,\s]?000/);
  });

  it('should include tax breakdown (CGST/SGST) in PDF content', async () => {
    expect(generatedInvoicePath).toBeDefined();

    const pdfBuffer = await fs.readFile(generatedInvoicePath);
    const parsedPdf = await pdfParse(pdfBuffer);

    expect(parsedPdf.text).toContain('CGST');
    expect(parsedPdf.text).toContain('SGST');
  });

  it('should include total amount in PDF content', async () => {
    expect(generatedInvoicePath).toBeDefined();

    const pdfBuffer = await fs.readFile(generatedInvoicePath);
    const parsedPdf = await pdfParse(pdfBuffer);

    // Total: ₹1,180 (might be formatted as 1,180.00 or 1180)
    expect(parsedPdf.text).toMatch(/1[,\s]?180/);
  });

  it('should include seller details (India Angel Forum) in PDF content', async () => {
    expect(generatedInvoicePath).toBeDefined();

    const pdfBuffer = await fs.readFile(generatedInvoicePath);
    const parsedPdf = await pdfParse(pdfBuffer);

    expect(parsedPdf.text).toContain('India Angel Forum');
  });

  it('should include date in PDF content', async () => {
    expect(generatedInvoicePath).toBeDefined();

    const pdfBuffer = await fs.readFile(generatedInvoicePath);
    const parsedPdf = await pdfParse(pdfBuffer);

    // Check for current year at minimum
    const currentYear = new Date().getFullYear().toString();
    expect(parsedPdf.text).toContain(currentYear);
  });

  it('should include notes in PDF content if provided', async () => {
    expect(generatedInvoicePath).toBeDefined();

    const pdfBuffer = await fs.readFile(generatedInvoicePath);
    const parsedPdf = await pdfParse(pdfBuffer);

    expect(parsedPdf.text).toContain('Thank you for your membership');
  });

  it('should create database record with correct status', async () => {
    const invoice = await prisma.invoice.findFirst({
      where: { paymentId: testPaymentId },
    });

    expect(invoice).toBeDefined();
    expect(invoice?.status).toBe('ISSUED');
    expect(invoice?.pdfGeneratedAt).toBeDefined();
    expect(invoice?.pdfPath).toBeDefined();
  });

  it('should generate unique invoice numbers for multiple invoices', async () => {
    // Create second test payment
    const testPayment2 = await prisma.payment.create({
      data: {
        userId: testUserId,
        amount: 200000,
        currency: 'INR',
        status: 'COMPLETED',
        gateway: 'razorpay',
        gatewayOrderId: 'test-order-pdf-2',
        gatewayPaymentId: 'test-payment-pdf-2',
        type: 'membership',
        description: 'Test Payment 2',
        completedAt: new Date(),
      },
    });

    const invoiceData2 = {
      userId: testUserId,
      paymentId: testPayment2.id,
      buyerName: 'PDF Test User',
      buyerEmail: 'pdf-test@example.com',
      lineItems: [
        {
          description: 'Test Item 2',
          quantity: 1,
          unitPrice: 200000,
          amount: 200000,
        },
      ],
      subtotal: 200000,
      totalAmount: 200000,
    };

    const result2 = await invoiceService.generateInvoice(invoiceData2);

    // Get all invoices for this user
    const allInvoices = await prisma.invoice.findMany({
      where: { userId: testUserId },
      select: { invoiceNumber: true },
    });

    // Check that all invoice numbers are unique
    const invoiceNumbers = allInvoices.map(inv => inv.invoiceNumber);
    const uniqueInvoiceNumbers = new Set(invoiceNumbers);
    expect(uniqueInvoiceNumbers.size).toBe(invoiceNumbers.length);

    // Clean up second invoice
    if (result2.pdfPath) {
      const pdfPath2 = path.join(process.cwd(), result2.pdfPath);
      try {
        await fs.unlink(pdfPath2);
      } catch (error) {
        // Ignore
      }
    }
    await prisma.payment.delete({ where: { id: testPayment2.id } });
  });

  it('should handle Indian currency formatting (Lakh/Crore) in amount in words', async () => {
    // Create payment with large amount
    const testPayment3 = await prisma.payment.create({
      data: {
        userId: testUserId,
        amount: 10000000, // ₹1,00,000 (1 Lakh)
        currency: 'INR',
        status: 'COMPLETED',
        gateway: 'razorpay',
        gatewayOrderId: 'test-order-pdf-3',
        gatewayPaymentId: 'test-payment-pdf-3',
        type: 'investment',
        description: 'Test Large Payment',
        completedAt: new Date(),
      },
    });

    const invoiceData3 = {
      userId: testUserId,
      paymentId: testPayment3.id,
      buyerName: 'PDF Test User',
      buyerEmail: 'pdf-test@example.com',
      lineItems: [
        {
          description: 'Investment Amount',
          quantity: 1,
          unitPrice: 10000000,
          amount: 10000000,
        },
      ],
      subtotal: 10000000,
      totalAmount: 10000000,
    };

    const result3 = await invoiceService.generateInvoice(invoiceData3);
    const pdfPath3 = path.join(process.cwd(), result3.pdfPath);

    const pdfBuffer = await fs.readFile(pdfPath3);
    const parsedPdf = await pdfParse(pdfBuffer);

    // Should contain "Lakh" in amount in words
    expect(parsedPdf.text.toLowerCase()).toContain('lakh');

    // Clean up
    try {
      await fs.unlink(pdfPath3);
    } catch (error) {
      // Ignore
    }
    await prisma.payment.delete({ where: { id: testPayment3.id } });
  });
});
