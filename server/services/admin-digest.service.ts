import * as cron from 'node-cron';
import { prisma } from '../../db';
import { emailService } from './email.service';
import { invoiceQueueService } from './invoice-queue.service';

/**
 * Admin Digest Service
 * 
 * Sends daily digest emails to admin with:
 * - Permanently failed invoice generations (after 3 retries)
 * - Queue health metrics
 * - System alerts
 * 
 * Scheduled daily at 9 AM UTC
 */

interface FailedInvoiceDigest {
  jobId: string;
  paymentId: string;
  userId: string;
  userEmail: string;
  userName: string;
  attempts: number;
  lastError: string;
  failedAt: Date;
}

class AdminDigestService {
  private readonly ADMIN_EMAIL: string;
  private readonly DIGEST_TIME = '0 9 * * *'; // 9 AM UTC daily

  constructor() {
    this.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@indiaangelforum.com';
  }

  /**
   * Initialize cron job for daily digest
   */
  async initialize() {
    // Schedule daily digest at 9 AM UTC
    cron.schedule(this.DIGEST_TIME, async () => {
      console.log('📧 Generating admin daily digest...');
      await this.sendDailyDigest();
    }, {
      timezone: 'UTC'
    });

    console.log('✅ Admin digest service initialized (9 AM UTC daily)');
  }

  /**
   * Generate and send daily digest email
   */
  private async sendDailyDigest() {
    try {
      // Collect failed invoice jobs
      const failedInvoices = await this.getFailedInvoices();

      // Get queue metrics
      const queueMetrics = await invoiceQueueService.getMetrics();

      // Only send if there are failed invoices or critical issues
      if (failedInvoices.length === 0 && queueMetrics.failed === 0) {
        console.log('✅ No issues to report in daily digest');
        return;
      }

      // Generate email content
      const emailContent = this.generateDigestEmail(failedInvoices, queueMetrics);

      // Send email
      await emailService.sendEmail({
        to: this.ADMIN_EMAIL,
        subject: `📊 Daily Admin Digest - ${new Date().toISOString().split('T')[0]} - India Angel Forum`,
        html: emailContent.html,
        text: emailContent.text,
      });

      console.log(`✅ Daily digest sent to ${this.ADMIN_EMAIL}`);
      console.log(`   - Failed invoices: ${failedInvoices.length}`);
      console.log(`   - Queue metrics: ${JSON.stringify(queueMetrics)}`);

    } catch (error) {
      console.error('❌ Failed to send daily digest:', error);
    }
  }

  /**
   * Get failed invoice jobs from queue
   */
  private async getFailedInvoices(): Promise<FailedInvoiceDigest[]> {
    try {
      const failedJobs = await invoiceQueueService.getFailedJobs(100);
      const digest: FailedInvoiceDigest[] = [];

      for (const job of failedJobs) {
        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: job.data.userId },
          select: { email: true, fullName: true },
        });

        digest.push({
          jobId: job.id?.toString() || 'unknown',
          paymentId: job.data.paymentId,
          userId: job.data.userId,
          userEmail: user?.email || 'unknown',
          userName: user?.fullName || 'Unknown User',
          attempts: job.attemptsMade,
          lastError: job.failedReason || 'Unknown error',
          failedAt: new Date(job.processedOn || job.timestamp),
        });
      }

      return digest;
    } catch (error) {
      console.error('Failed to get failed invoices:', error);
      return [];
    }
  }

  /**
   * Generate digest email HTML and text content
   */
  private generateDigestEmail(failedInvoices: FailedInvoiceDigest[], queueMetrics: any) {
    const date = new Date().toISOString().split('T')[0];
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .section { background-color: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
          .critical { border-left-color: #dc2626; }
          .warning { border-left-color: #f59e0b; }
          .info { border-left-color: #3b82f6; }
          .metric { display: inline-block; margin: 10px 20px 10px 0; }
          .metric-value { font-size: 24px; font-weight: bold; color: #1e40af; }
          .metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #e2e8f0; padding: 12px; text-align: left; font-weight: 600; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .error-text { font-family: monospace; font-size: 12px; color: #dc2626; background-color: #fef2f2; padding: 8px; border-radius: 4px; }
          .button { display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📊 Daily Admin Digest</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">India Angel Forum - ${date}</p>
          </div>

          <!-- Queue Metrics -->
          <div class="section info">
            <h2>📈 Invoice Queue Metrics</h2>
            <div>
              <div class="metric">
                <div class="metric-value">${queueMetrics.waiting}</div>
                <div class="metric-label">Waiting</div>
              </div>
              <div class="metric">
                <div class="metric-value">${queueMetrics.active}</div>
                <div class="metric-label">Active</div>
              </div>
              <div class="metric">
                <div class="metric-value">${queueMetrics.completed}</div>
                <div class="metric-label">Completed</div>
              </div>
              <div class="metric">
                <div class="metric-value" style="color: ${queueMetrics.failed > 0 ? '#dc2626' : '#16a34a'};">${queueMetrics.failed}</div>
                <div class="metric-label">Failed</div>
              </div>
              <div class="metric">
                <div class="metric-value">${queueMetrics.delayed}</div>
                <div class="metric-label">Delayed</div>
              </div>
            </div>
          </div>

          ${failedInvoices.length > 0 ? `
          <!-- Failed Invoices -->
          <div class="section critical">
            <h2>🚨 Failed Invoice Generations (${failedInvoices.length})</h2>
            <p>The following invoices failed to generate after ${failedInvoices[0]?.attempts || 3} retry attempts:</p>
            
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Payment ID</th>
                  <th>Attempts</th>
                  <th>Failed At</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                ${failedInvoices.map(invoice => `
                  <tr>
                    <td>
                      <strong>${invoice.userName}</strong><br>
                      <span style="font-size: 12px; color: #64748b;">${invoice.userEmail}</span>
                    </td>
                    <td style="font-family: monospace; font-size: 12px;">${invoice.paymentId.substring(0, 12)}...</td>
                    <td>${invoice.attempts}</td>
                    <td>${new Date(invoice.failedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                    <td><div class="error-text">${this.truncateError(invoice.lastError)}</div></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <h3>Recommended Actions:</h3>
            <ul>
              <li>Review error messages for patterns (PDF generation, file permissions, disk space)</li>
              <li>Use the Invoice Management admin panel to retry failed invoices</li>
              <li>Check Bull Board queue dashboard for detailed job information</li>
              <li>Verify pdfkit installation and dependencies</li>
              <li>Check server logs for additional context</li>
            </ul>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/admin/invoices" class="button">
              View Invoice Management
            </a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/admin/queues" class="button" style="background-color: #6366f1;">
              View Queue Dashboard
            </a>
          </div>
          ` : ''}

          ${queueMetrics.waiting > 20 ? `
          <!-- High Queue Backlog Warning -->
          <div class="section warning">
            <h2>⚠️ High Queue Backlog</h2>
            <p>There are <strong>${queueMetrics.waiting}</strong> jobs waiting in the queue. This may indicate:</p>
            <ul>
              <li>High transaction volume (good problem!)</li>
              <li>Slow processing or worker issues</li>
              <li>Redis connectivity problems</li>
            </ul>
            <p>Monitor the queue dashboard for processing speeds.</p>
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>India Angel Forum - Admin Digest</strong></p>
            <p>This digest is sent daily at 9:00 AM UTC. Adjust timing in environment configuration if needed.</p>
            <p>For immediate issues, check server logs or contact technical support.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Text version for email clients that don't support HTML
    const text = `
Daily Admin Digest - ${date}
India Angel Forum

=== INVOICE QUEUE METRICS ===
Waiting: ${queueMetrics.waiting}
Active: ${queueMetrics.active}
Completed: ${queueMetrics.completed}
Failed: ${queueMetrics.failed}
Delayed: ${queueMetrics.delayed}

${failedInvoices.length > 0 ? `
=== FAILED INVOICE GENERATIONS (${failedInvoices.length}) ===
${failedInvoices.map(invoice => `
User: ${invoice.userName} (${invoice.userEmail})
Payment ID: ${invoice.paymentId}
Attempts: ${invoice.attempts}
Failed At: ${new Date(invoice.failedAt).toISOString()}
Error: ${invoice.lastError}
---
`).join('\n')}

RECOMMENDED ACTIONS:
- Review error messages for patterns
- Use Invoice Management admin panel to retry
- Check Bull Board queue dashboard
- Verify pdfkit installation
` : ''}

${queueMetrics.waiting > 20 ? `
=== HIGH QUEUE BACKLOG WARNING ===
${queueMetrics.waiting} jobs waiting in queue.
Monitor queue dashboard for processing speeds.
` : ''}

---
This digest is sent daily at 9:00 AM UTC.
    `.trim();

    return { html, text };
  }

  /**
   * Truncate error messages for email display
   */
  private truncateError(error: string, maxLength: number = 100): string {
    if (!error) return 'Unknown error';
    if (error.length <= maxLength) return error;
    return error.substring(0, maxLength) + '...';
  }

  /**
   * Send immediate alert (for critical issues)
   */
  async sendImmediateAlert(subject: string, message: string, severity: 'critical' | 'warning' | 'info' = 'warning') {
    try {
      const colors = {
        critical: '#dc2626',
        warning: '#f59e0b',
        info: '#3b82f6',
      };

      await emailService.sendEmail({
        to: this.ADMIN_EMAIL,
        subject: `${severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️'} ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${colors[severity]}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">${subject}</h2>
            </div>
            <div style="padding: 20px; background-color: #f8fafc;">
              <p>${message}</p>
              <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
                Timestamp: ${new Date().toISOString()}
              </p>
            </div>
          </div>
        `,
        text: `${subject}\n\n${message}\n\nTimestamp: ${new Date().toISOString()}`,
      });

      console.log(`✅ Immediate alert sent: ${subject}`);
    } catch (error) {
      console.error('Failed to send immediate alert:', error);
    }
  }

  /**
   * Manual digest trigger (for testing)
   */
  async triggerManualDigest() {
    console.log('🔧 Manual digest triggered');
    await this.sendDailyDigest();
  }
}

// Export singleton instance
export const adminDigestService = new AdminDigestService();
