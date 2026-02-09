import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../../db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Email Service for India Angel Forum
 * Integrates with EmailIt for transactional emails
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  variables?: Record<string, any>;
  userId?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
  }>;
}

export interface EmailItResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.apiKey = process.env.EMAILIT_API_KEY || '';
    this.apiUrl = process.env.EMAILIT_API_URL || 'https://api.emailit.com/v1';
    this.fromEmail = process.env.EMAILIT_FROM_EMAIL || 'noreply@indiaangelforum.com';
    this.fromName = process.env.EMAILIT_FROM_NAME || 'India Angel Forum';

    if (!this.apiKey || this.apiKey === 'your-emailit-api-key-here') {
      console.warn('⚠️  EmailIt API key not configured. Emails will be logged but not sent.');
    }
  }

  /**
   * Send email using EmailIt API
   */
  async sendEmail(options: EmailOptions): Promise<EmailItResponse> {
    try {
      const { to, subject, html, text, template, variables, userId, attachments } = options;

      // Load template if specified
      let emailHtml = html;
      let emailText = text;

      if (template) {
        const compiled = await this.getTemplate(template);
        emailHtml = compiled(variables || {});
        emailText = this.stripHtml(emailHtml);
      }

      // Format recipient(s)
      const recipients = Array.isArray(to) ? to : [to];

      // If API key not configured, log and return
      if (!this.apiKey || this.apiKey === 'your-emailit-api-key-here') {
        console.log('📧 Email would be sent (API key not configured):', {
          to: recipients,
          subject,
          template,
        });

        // Log to database
        await this.logEmail({
          userId,
          to: recipients[0],
          subject,
          templateName: template,
          status: 'PENDING',
          error: 'API key not configured',
        });

        return {
          success: false,
          error: 'Email API key not configured',
        };
      }

      // Send via EmailIt API
      const response = await fetch(`${this.apiUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: {
            email: this.fromEmail,
            name: this.fromName,
          },
          to: recipients.map(email => ({ email })),
          subject,
          html: emailHtml,
          text: emailText,
          attachments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `EmailIt API error: ${response.status}`);
      }

      // Log success
      await this.logEmail({
        userId,
        to: recipients[0],
        subject,
        templateName: template,
        status: 'SENT',
        providerId: data.messageId,
      });

      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (error: any) {
      console.error('❌ Email sending failed:', error);

      // Log failure
      await this.logEmail({
        userId: options.userId,
        to: Array.isArray(options.to) ? options.to[0] : options.to,
        subject: options.subject,
        templateName: options.template,
        status: 'FAILED',
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send payment success email with invoice
   */
  async sendPaymentSuccessEmail(
    userEmail: string,
    userName: string,
    paymentDetails: {
      amount: number;
      currency: string;
      transactionId: string;
      paymentDate: Date;
      invoicePath?: string;
    },
    userId?: string
  ): Promise<EmailItResponse> {
    const attachments = [];
    if (paymentDetails.invoicePath) {
      attachments.push({
        filename: 'invoice.pdf',
        path: paymentDetails.invoicePath,
      });
    }

    return this.sendEmail({
      to: userEmail,
      subject: 'Payment Successful - India Angel Forum',
      template: 'payment-success',
      variables: {
        userName,
        amount: this.formatCurrency(paymentDetails.amount, paymentDetails.currency),
        transactionId: paymentDetails.transactionId,
        paymentDate: this.formatDate(paymentDetails.paymentDate),
      },
      userId,
      attachments,
    });
  }

  /**
   * Send payment failure email
   */
  async sendPaymentFailureEmail(
    userEmail: string,
    userName: string,
    paymentDetails: {
      amount: number;
      currency: string;
      orderId: string;
      reason?: string;
      retryLink: string;
    },
    userId?: string
  ): Promise<EmailItResponse> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Payment Failed - India Angel Forum',
      template: 'payment-failed',
      variables: {
        userName,
        amount: this.formatCurrency(paymentDetails.amount, paymentDetails.currency),
        orderId: paymentDetails.orderId,
        reason: paymentDetails.reason || 'Unknown error',
        retryLink: paymentDetails.retryLink,
      },
      userId,
    });
  }

  /**
   * Send payment initiated email
   */
  async sendPaymentInitiatedEmail(
    userEmail: string,
    userName: string,
    paymentDetails: {
      amount: number;
      currency: string;
      orderId: string;
      paymentLink?: string;
    },
    userId?: string
  ): Promise<EmailItResponse> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Payment Order Created - India Angel Forum',
      template: 'payment-initiated',
      variables: {
        userName,
        amount: this.formatCurrency(paymentDetails.amount, paymentDetails.currency),
        orderId: paymentDetails.orderId,
        paymentLink: paymentDetails.paymentLink,
      },
      userId,
    });
  }

  /**
   * Send refund processed email
   */
  async sendRefundProcessedEmail(
    userEmail: string,
    userName: string,
    refundDetails: {
      amount: number;
      currency: string;
      refundId: string;
      originalTransactionId: string;
      reason: string;
      expectedDays: number;
    },
    userId?: string
  ): Promise<EmailItResponse> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Refund Processed - India Angel Forum',
      template: 'refund-processed',
      variables: {
        userName,
        amount: this.formatCurrency(refundDetails.amount, refundDetails.currency),
        refundId: refundDetails.refundId,
        originalTransactionId: refundDetails.originalTransactionId,
        reason: refundDetails.reason,
        expectedDays: refundDetails.expectedDays,
      },
      userId,
    });
  }

  /**
   * Get compiled Handlebars template
   */
  private async getTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    // Check cache
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    // Load from database
    const dbTemplate = await prisma.emailTemplate.findUnique({
      where: { name: templateName },
    });

    if (dbTemplate && dbTemplate.isActive) {
      const compiled = Handlebars.compile(dbTemplate.htmlBody);
      this.templateCache.set(templateName, compiled);
      return compiled;
    }

    // Load from file system as fallback
    const templatePath = path.join(__dirname, '../../templates/emails', `${templateName}.hbs`);
    
    try {
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiled = Handlebars.compile(templateContent);
      this.templateCache.set(templateName, compiled);
      return compiled;
    } catch (error) {
      console.error(`Template not found: ${templateName}`, error);
      throw new Error(`Email template '${templateName}' not found`);
    }
  }

  /**
   * Log email to database
   */
  private async logEmail(data: {
    userId?: string;
    to: string;
    subject: string;
    templateName?: string;
    status: 'PENDING' | 'SENT' | 'FAILED';
    providerId?: string;
    error?: string;
  }): Promise<void> {
    try {
      await prisma.emailLog.create({
        data: {
          userId: data.userId,
          to: data.to,
          subject: data.subject,
          templateName: data.templateName,
          status: data.status,
          provider: 'emailit',
          providerId: data.providerId,
          error: data.error,
        },
      });
    } catch (error) {
      console.error('Failed to log email:', error);
    }
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    });
    return formatter.format(amount / 100); // Amount is in paise
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Strip HTML tags
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Clear template cache (for hot reload in development)
   */
  clearCache(): void {
    this.templateCache.clear();
  }
}

// Export singleton instance
export const emailService = new EmailService();
