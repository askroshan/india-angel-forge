import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../db';

/**
 * Invoice Service for India Angel Forum
 * Generates PDF invoices using pdfkit with Indian formatting
 */

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  userId: string;
  paymentId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerPAN?: string;
  buyerAddress?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  tds?: number;
  totalAmount: number;
  notes?: string;
}

// PDF template cache for optimization
interface PDFTemplateCache {
  header?: Buffer;
  footer?: Buffer;
  companyLogo?: Buffer;
}

class InvoiceService {
  private readonly invoiceDir: string;
  private readonly sellerDetails = {
    name: 'India Angel Forum',
    gst: 'GST_NUMBER_HERE', // TODO: Add actual GST number
    pan: 'PAN_NUMBER_HERE', // TODO: Add actual PAN
    address: 'Mumbai, Maharashtra, India',
  };
  private templateCache: PDFTemplateCache = {};

  constructor() {
    this.invoiceDir = process.env.INVOICE_DIR || './invoices';
    this.ensureDirectoryExists();
    this.preloadTemplateAssets();
  }

  /**
   * Preload template assets for performance optimization
   * 
   * @private
   * @remarks
   * Loads company logo and other static assets into memory
   * to avoid repeated file I/O during PDF generation.
   */
  private async preloadTemplateAssets() {
    try {
      // Load company logo if exists
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      if (fs.existsSync(logoPath)) {
        this.templateCache.companyLogo = fs.readFileSync(logoPath);
      }
    } catch (error) {
      console.warn('Failed to preload template assets:', error);
    }
  }

  /**
   * Generate invoice and save to database
   * 
   * @param data - Invoice data including buyer details and line items
   * @returns Promise resolving to invoice record with PDF path
   * 
   * @remarks
   * Process:
   * 1. Generate sequential invoice number
   * 2. Create invoice record in database
   * 3. Generate PDF using pdfkit
   * 4. Update record with PDF path
   * 
   * Uses cached template assets for improved performance.
   */
  async generateInvoice(data: InvoiceData): Promise<{ id: string; invoiceNumber: string; invoice: any; pdfPath: string }> {
    try {
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Create invoice record in database
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          userId: data.userId,
          paymentId: data.paymentId,
          issueDate: new Date(),
          buyerName: data.buyerName,
          buyerEmail: data.buyerEmail,
          buyerPhone: data.buyerPhone,
          buyerPAN: data.buyerPAN,
          buyerAddress: data.buyerAddress,
          sellerName: this.sellerDetails.name,
          sellerGST: this.sellerDetails.gst,
          sellerPAN: this.sellerDetails.pan,
          sellerAddress: this.sellerDetails.address,
          lineItems: data.lineItems,
          subtotal: data.subtotal,
          cgst: data.cgst || 0,
          sgst: data.sgst || 0,
          igst: data.igst || 0,
          tds: data.tds || 0,
          totalAmount: data.totalAmount,
          notes: data.notes,
          status: 'PAID',
        },
      });

      // Generate PDF
      const pdfPath = await this.generatePDF(invoice);

      // Update invoice with PDF path
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          pdfPath,
          pdfGeneratedAt: new Date(),
          status: 'ISSUED',
        },
      });

      return { 
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        invoice: updatedInvoice, 
        pdfPath 
      };
    } catch (error) {
      console.error('Invoice generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate PDF document
   * 
   * @param invoice - Invoice database record
   * @returns Promise resolving to file path of generated PDF
   * 
   * @private
   * @remarks
   * Uses pdfkit to generate A4 PDF with:
   * - Company header and logo (from cache if available)
   * - Seller and buyer details
   * - Line items table with Indian number formatting
   * - Tax breakdown (CGST, SGST, IGST, TDS)
   * - Total with amount in words (Lakh/Crore format)
   * - Footer with notes and digital watermark
   * 
   * Template assets are cached for performance optimization.
   */
  private async generatePDF(invoice: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `${invoice.invoiceNumber}.pdf`;
        const filePath = path.join(this.invoiceDir, fileName);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Header (uses cached logo if available)
        this.addHeader(doc, invoice);

        // Seller & Buyer Details
        this.addPartyDetails(doc, invoice);

        // Line Items Table
        this.addLineItems(doc, invoice);

        // Tax Summary
        this.addTaxSummary(doc, invoice);

        // Total
        this.addTotal(doc, invoice);

        // Footer
        this.addFooter(doc, invoice);

        doc.end();

        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add header to PDF (uses cached logo for performance)
   * 
   * @private
   */
  private addHeader(doc: PDFKit.PDFDocument, invoice: any): void {
    // Add company logo from cache if available
    if (this.templateCache.companyLogo) {
      try {
        doc.image(this.templateCache.companyLogo, 50, 45, { width: 50 });
      } catch (error) {
        console.warn('Failed to add logo to PDF:', error);
      }
    }

    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('INVOICE', 50, 50, { align: 'center' })
      .fontSize(10)
      .font('Helvetica')
      .moveDown();

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(invoice.sellerName, 50, 100)
      .fontSize(9)
      .font('Helvetica')
      .text(invoice.sellerAddress, 50, 115)
      .text(`GST: ${invoice.sellerGST}`, 50, 130)
      .text(`PAN: ${invoice.sellerPAN}`, 50, 145);

    doc
      .fontSize(9)
      .text(`Invoice No: ${invoice.invoiceNumber}`, 400, 100, { align: 'right' })
      .text(`Date: ${this.formatDate(invoice.issueDate)}`, 400, 115, { align: 'right' });

    doc.moveDown(2);
  }

  /**
   * Add seller and buyer details
   */
  private addPartyDetails(doc: PDFKit.PDFDocument, invoice: any): void {
    const startY = 180;

    // Bill To
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('BILL TO:', 50, startY)
      .fontSize(9)
      .font('Helvetica')
      .text(invoice.buyerName, 50, startY + 15)
      .text(invoice.buyerEmail, 50, startY + 30);

    if (invoice.buyerPhone) {
      doc.text(invoice.buyerPhone, 50, startY + 45);
    }

    if (invoice.buyerPAN) {
      doc.text(`PAN: ${invoice.buyerPAN}`, 50, startY + 60);
    }

    if (invoice.buyerAddress) {
      doc.text(invoice.buyerAddress, 50, startY + 75, { width: 250 });
    }

    doc.moveDown(3);
  }

  /**
   * Add line items table
   */
  private addLineItems(doc: PDFKit.PDFDocument, invoice: any): void {
    const tableTop = 300;
    const lineItems = invoice.lineItems as InvoiceLineItem[];

    // Table Header
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Description', 50, tableTop)
      .text('Qty', 300, tableTop, { width: 50, align: 'right' })
      .text('Unit Price', 360, tableTop, { width: 80, align: 'right' })
      .text('Amount', 450, tableTop, { width: 100, align: 'right' });

    // Line
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Table Rows
    let y = tableTop + 25;
    lineItems.forEach((item) => {
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(item.description, 50, y, { width: 240 })
        .text(item.quantity.toString(), 300, y, { width: 50, align: 'right' })
        .text(this.formatCurrency(item.unitPrice), 360, y, { width: 80, align: 'right' })
        .text(this.formatCurrency(item.amount), 450, y, { width: 100, align: 'right' });

      y += 25;
    });

    // Bottom Line
    doc
      .moveTo(50, y + 5)
      .lineTo(550, y + 5)
      .stroke();

    doc.moveDown();
  }

  /**
   * Add tax summary
   */
  private addTaxSummary(doc: PDFKit.PDFDocument, invoice: any): void {
    const startY = doc.y + 20;
    let y = startY;

    doc.fontSize(9).font('Helvetica');

    // Subtotal
    doc
      .text('Subtotal:', 400, y, { width: 100, align: 'right' })
      .text(this.formatCurrency(Number(invoice.subtotal)), 510, y, { width: 80, align: 'right' });
    y += 20;

    // GST
    if (Number(invoice.cgst) > 0) {
      doc
        .text('CGST:', 400, y, { width: 100, align: 'right' })
        .text(this.formatCurrency(Number(invoice.cgst)), 510, y, { width: 80, align: 'right' });
      y += 20;
    }

    if (Number(invoice.sgst) > 0) {
      doc
        .text('SGST:', 400, y, { width: 100, align: 'right' })
        .text(this.formatCurrency(Number(invoice.sgst)), 510, y, { width: 80, align: 'right' });
      y += 20;
    }

    if (Number(invoice.igst) > 0) {
      doc
        .text('IGST:', 400, y, { width: 100, align: 'right' })
        .text(this.formatCurrency(Number(invoice.igst)), 510, y, { width: 80, align: 'right' });
      y += 20;
    }

    // TDS
    if (Number(invoice.tds) > 0) {
      doc
        .text('TDS:', 400, y, { width: 100, align: 'right' })
        .text(`(${this.formatCurrency(Number(invoice.tds))})`, 510, y, { width: 80, align: 'right' });
      y += 20;
    }
  }

  /**
   * Add total
   */
  private addTotal(doc: PDFKit.PDFDocument, invoice: any): void {
    const y = doc.y + 10;

    doc
      .moveTo(400, y)
      .lineTo(550, y)
      .stroke();

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('TOTAL:', 400, y + 10, { width: 100, align: 'right' })
      .text(this.formatCurrency(Number(invoice.totalAmount)), 510, y + 10, { width: 80, align: 'right' });

    // Amount in words
    doc
      .fontSize(9)
      .font('Helvetica-Italic')
      .text(`Amount in words: ${this.numberToWords(Number(invoice.totalAmount))}`, 50, y + 40, {
        width: 500,
      });
  }

  /**
   * Add footer
   */
  private addFooter(doc: PDFKit.PDFDocument, invoice: any): void {
    const bottomY = 700;

    if (invoice.notes) {
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Notes:', 50, bottomY)
        .font('Helvetica')
        .text(invoice.notes, 50, bottomY + 15, { width: 500 });
    }

    doc
      .fontSize(8)
      .font('Helvetica')
      .text('This is a computer-generated invoice. No signature required.', 50, 750, {
        align: 'center',
        width: 500,
      });

    doc.text('© 2026 India Angel Forum. All rights reserved.', 50, 765, {
      align: 'center',
      width: 500,
    });
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Count invoices this month
    const startOfMonth = new Date(year, now.getMonth(), 1);
    const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59);

    const count = await prisma.invoice.count({
      where: {
        issueDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const sequence = String(count + 1).padStart(5, '0');
    return `INV-${year}-${month}-${sequence}`;
  }

  /**
   * Format currency in Indian format
   */
  private formatCurrency(amount: number): string {
    const inr = amount / 100; // Convert from paise to rupees
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(inr);
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  }

  /**
   * Convert number to words (simplified for Indian numbering)
   */
  private numberToWords(amount: number): string {
    const rupees = Math.floor(amount / 100);
    const paise = amount % 100;

    if (rupees === 0 && paise === 0) {
      return 'Zero Rupees Only';
    }

    let words = '';

    if (rupees > 0) {
      words += this.convertNumberToWords(rupees) + ' Rupees';
    }

    if (paise > 0) {
      if (rupees > 0) words += ' and ';
      words += this.convertNumberToWords(paise) + ' Paise';
    }

    return words + ' Only';
  }

  /**
   * Helper to convert number to words
   */
  private convertNumberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = [
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];

    if (num === 0) return 'Zero';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    }
    if (num < 1000) {
      return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + this.convertNumberToWords(num % 100) : '');
    }
    if (num < 100000) {
      return (
        this.convertNumberToWords(Math.floor(num / 1000)) +
        ' Thousand' +
        (num % 1000 ? ' ' + this.convertNumberToWords(num % 1000) : '')
      );
    }
    if (num < 10000000) {
      return (
        this.convertNumberToWords(Math.floor(num / 100000)) +
        ' Lakh' +
        (num % 100000 ? ' ' + this.convertNumberToWords(num % 100000) : '')
      );
    }
    return (
      this.convertNumberToWords(Math.floor(num / 10000000)) +
      ' Crore' +
      (num % 10000000 ? ' ' + this.convertNumberToWords(num % 10000000) : '')
    );
  }

  /**
   * Get invoice by payment ID
   */
  async getInvoiceByPaymentId(paymentId: string): Promise<any> {
    return await prisma.invoice.findUnique({
      where: { paymentId },
    });
  }

  /**
   * Ensure invoice directory exists
   */
  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.invoiceDir)) {
      fs.mkdirSync(this.invoiceDir, { recursive: true });
    }
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();
