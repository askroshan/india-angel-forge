// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { invoiceService } from '../../../server/services/invoice.service';
import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';

/**
 * Invoice PDF Validation Tests
 *
 * Uses real database and PDFKit generation.
 * PDF content is validated by decompressing FlateDecode streams
 * and searching for text strings in PDF drawing commands.
 */

const prisma = new PrismaClient();

/** Helper: read PDF file, decompress FlateDecode streams, extract text */
async function readPDFContent(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);

  const extractedLines: string[] = [];

  // Find and decompress all FlateDecode streams using byte search
  const streamMarker = Buffer.from('stream\n');
  const endstreamMarker = Buffer.from('endstream');

  let pos = 0;
  while (pos < buffer.length) {
    const streamStart = buffer.indexOf(streamMarker, pos);
    if (streamStart === -1) break;

    const dataStart = streamStart + streamMarker.length;
    // Also handle \r\n
    const actualStart = buffer[dataStart - 1] === 0x0a && buffer[dataStart - 2] === 0x0d
      ? dataStart
      : dataStart;

    const endPos = buffer.indexOf(endstreamMarker, actualStart);
    if (endPos === -1) break;

    // Trim trailing whitespace from stream data
    let dataEnd = endPos;
    while (dataEnd > actualStart && (buffer[dataEnd - 1] === 0x0a || buffer[dataEnd - 1] === 0x0d)) {
      dataEnd--;
    }

    const compressedData = buffer.subarray(actualStart, dataEnd);
    try {
      const decompressed = zlib.inflateSync(compressedData);
      const text = decompressed.toString('utf-8');

      // Extract text from TJ operators BEFORE hex decoding
      // TJ format: [<hex> kern <hex> kern ...] TJ
      // We extract hex strings and literal strings, ignoring kerning numbers
      const tjRegex = /\[([^\]]+)\]\s*TJ/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(text)) !== null) {
        const inner = tjMatch[1];
        let lineText = '';

        // Extract hex strings <hex> and decode them
        const hexRegex = /<([0-9a-fA-F]+)>/g;
        let hexMatch;
        while ((hexMatch = hexRegex.exec(inner)) !== null) {
          const hex = hexMatch[1];
          for (let i = 0; i < hex.length; i += 2) {
            lineText += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
          }
        }

        // Also extract literal strings (text)
        const litRegex = /\(([^)]*)\)/g;
        let litMatch;
        while ((litMatch = litRegex.exec(inner)) !== null) {
          lineText += litMatch[1];
        }

        if (lineText) extractedLines.push(lineText);
      }

      // Also extract Tj single-string operators
      const tjSingleRegex = /\(([^)]*)\)\s*Tj/g;
      let tjSingle;
      while ((tjSingle = tjSingleRegex.exec(text)) !== null) {
        if (tjSingle[1]) extractedLines.push(tjSingle[1]);
      }
    } catch {
      // Not all streams are FlateDecode; skip failures
    }

    pos = endPos + endstreamMarker.length;
  }

  // Also include literal PDF strings in parentheses from non-stream parts
  const rawStr = buffer.toString('latin1');
  const parenRegex = /\(([^)]+)\)/g;
  let parenMatch;
  while ((parenMatch = parenRegex.exec(rawStr)) !== null) {
    extractedLines.push(parenMatch[1]);
  }

  return extractedLines.join('\n');
}

describe('Invoice PDF Validation', () => {
  let testUserId: string;
  let testPaymentId: string;
  let testPayment2Id: string;
  let generatedInvoicePath: string;
  let invoiceResult: {
    id: string;
    invoiceNumber: string;
    invoice: Record<string, unknown>;
    pdfPath: string;
  };

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: `pdf-test-${Date.now()}@example.com`,
        fullName: 'PDF Test User',
        passwordHash: 'test-hash',
      },
    });
    testUserId = testUser.id;

    // Create test payments (two for unique-invoice-number test)
    const testPayment = await prisma.payment.create({
      data: {
        userId: testUserId,
        amount: 100000,
        currency: 'INR',
        status: 'COMPLETED',
        gateway: 'RAZORPAY',
        gatewayOrderId: `test-order-pdf-${Date.now()}`,
        gatewayPaymentId: `test-pay-pdf-${Date.now()}`,
        type: 'MEMBERSHIP_FEE',
        description: 'Test Membership Payment',
        completedAt: new Date(),
      },
    });
    testPaymentId = testPayment.id;

    const testPayment2 = await prisma.payment.create({
      data: {
        userId: testUserId,
        amount: 200000,
        currency: 'INR',
        status: 'COMPLETED',
        gateway: 'RAZORPAY',
        gatewayOrderId: `test-order-pdf2-${Date.now()}`,
        gatewayPaymentId: `test-pay-pdf2-${Date.now()}`,
        type: 'MEMBERSHIP_FEE',
        description: 'Test Membership Payment 2',
        completedAt: new Date(),
      },
    });
    testPayment2Id = testPayment2.id;

    // Generate first invoice (used by most tests)
    invoiceResult = await invoiceService.generateInvoice({
      userId: testUserId,
      paymentId: testPaymentId,
      buyerName: 'PDF Test User',
      buyerEmail: `pdf-test-${Date.now()}@example.com`,
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
      cgst: 9000,
      sgst: 9000,
      totalAmount: 118000,
      notes: 'Thank you for your membership!',
    });

    generatedInvoicePath = path.join(process.cwd(), invoiceResult.pdfPath);
  }, 30000);

  afterAll(async () => {
    // Clean up generated PDFs
    const invoices = await prisma.invoice.findMany({
      where: { userId: testUserId },
    });
    for (const inv of invoices) {
      if (inv.pdfPath) {
        try {
          await fs.unlink(path.join(process.cwd(), inv.pdfPath));
        } catch {
          // ignore
        }
      }
    }

    // Clean up test data in correct order
    await prisma.invoice.deleteMany({ where: { userId: testUserId } });
    await prisma.payment.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });

    await prisma.$disconnect();
  }, 15000);

  // ─── PDF Generation Tests ─────────────────────────────────────────

  it('should generate a PDF invoice successfully', () => {
    expect(invoiceResult).toBeDefined();
    expect(invoiceResult.id).toBeDefined();
    expect(invoiceResult.invoiceNumber).toMatch(/INV-\d{4}-\d{2}-\d{5}/);
    expect(invoiceResult.pdfPath).toBeDefined();
  });

  it('should create the PDF file on disk', async () => {
    const fileExists = await fs
      .access(generatedInvoicePath)
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);
  });

  it('should generate PDF with reasonable file size (1KB - 500KB)', async () => {
    const stats = await fs.stat(generatedInvoicePath);
    const fileSizeKB = stats.size / 1024;
    expect(fileSizeKB).toBeGreaterThan(1);
    expect(fileSizeKB).toBeLessThan(500);
  });

  it('should generate a valid PDF file (starts with %PDF header)', async () => {
    const buffer = await fs.readFile(generatedInvoicePath);
    const header = buffer.subarray(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });

  // ─── PDF Content Tests (raw buffer inspection) ────────────────────

  it('should include INVOICE title in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('INVOICE');
  });

  it('should include invoice number in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain(invoiceResult.invoiceNumber);
  });

  it('should include buyer name in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('PDF Test User');
  });

  it('should include BILL TO label in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('BILL TO');
  });

  it('should include line item description in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('Annual Membership Fee');
  });

  it('should include seller name (India Angel Forum) in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('India Angel Forum');
  });

  it('should include seller address in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('Mumbai');
  });

  it('should include buyer PAN in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('ABCDE1234F');
  });

  it('should include buyer phone in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('+91 98765 43210');
  });

  it('should include buyer address in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('123 Test Street');
  });

  it('should include date in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    const year = new Date().getFullYear().toString();
    expect(content).toContain(year);
  });

  it('should include notes in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('Thank you for your membership!');
  });

  it('should include TOTAL label in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('TOTAL');
  });

  it('should include amount in words in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('Amount in words');
    expect(content).toContain('Rupees');
  });

  it('should include CGST label in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('CGST');
  });

  it('should include SGST label in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('SGST');
  });

  it('should include computer-generated disclaimer in PDF', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('computer-generated');
  });

  it('should include copyright notice in PDF', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    // PDFKit renders © as a special char; check the year and org name
    expect(content).toContain('India Angel Forum');
    expect(content).toContain('All rights reserved');
  });

  it('should include table headers in PDF content', async () => {
    const content = await readPDFContent(generatedInvoicePath);
    expect(content).toContain('Description');
    expect(content).toContain('Qty');
    expect(content).toContain('Amount');
  });

  // ─── Database Record Tests ────────────────────────────────────────

  it('should create database record with ISSUED status after PDF generation', async () => {
    const invoice = await prisma.invoice.findFirst({
      where: { paymentId: testPaymentId },
    });

    expect(invoice).toBeDefined();
    expect(invoice?.status).toBe('ISSUED');
    expect(invoice?.pdfGeneratedAt).toBeDefined();
    expect(invoice?.pdfPath).toBeDefined();
  });

  it('should store correct buyer details in database record', async () => {
    const invoice = await prisma.invoice.findFirst({
      where: { paymentId: testPaymentId },
    });

    expect(invoice).toBeDefined();
    expect(invoice?.buyerName).toBe('PDF Test User');
    expect(invoice?.buyerPAN).toBe('ABCDE1234F');
  });

  it('should store correct financial data in database record', async () => {
    const invoice = await prisma.invoice.findFirst({
      where: { paymentId: testPaymentId },
    });

    expect(invoice).toBeDefined();
    expect(Number(invoice?.subtotal)).toBe(100000);
    expect(Number(invoice?.cgst)).toBe(9000);
    expect(Number(invoice?.sgst)).toBe(9000);
    expect(Number(invoice?.totalAmount)).toBe(118000);
  });

  // ─── Unique Invoice Number Test ───────────────────────────────────

  it('should generate unique invoice numbers for multiple invoices', async () => {
    const secondResult = await invoiceService.generateInvoice({
      userId: testUserId,
      paymentId: testPayment2Id,
      buyerName: 'PDF Test User',
      buyerEmail: 'pdf-test-2@example.com',
      lineItems: [
        {
          description: 'Second Membership Fee',
          quantity: 1,
          unitPrice: 200000,
          amount: 200000,
        },
      ],
      subtotal: 200000,
      totalAmount: 200000,
    });

    expect(secondResult.invoiceNumber).not.toBe(invoiceResult.invoiceNumber);
    expect(secondResult.invoiceNumber).toMatch(/INV-\d{4}-\d{2}-\d{5}/);
  });
});
