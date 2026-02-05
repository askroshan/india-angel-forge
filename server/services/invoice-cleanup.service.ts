import * as cron from 'node-cron';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as archiver from 'archiver';
import { createWriteStream } from 'fs';
import { prisma } from '../../db';
import { emailService } from './email.service';
import checkDiskSpace from 'check-disk-space';

/**
 * Invoice Cleanup Service
 * 
 * Automated cleanup and archival of old invoices:
 * 1. Daily at 2 AM UTC: Archive and delete invoices older than 2 years
 * 2. Daily at 3 AM UTC: Delete archive ZIPs older than 7 years
 * 3. Hourly: Check disk space and alert admin if < 10GB free
 */

class InvoiceCleanupService {
  private readonly INVOICE_DIR: string;
  private readonly ARCHIVE_DIR: string;
  private readonly INVOICE_RETENTION_YEARS: number;
  private readonly ARCHIVE_RETENTION_YEARS: number;
  private readonly DISK_SPACE_THRESHOLD_GB: number;
  private readonly ADMIN_EMAIL: string;
  private lastDiskAlert: Date | null = null;

  constructor() {
    this.INVOICE_DIR = process.env.INVOICE_DIR || './invoices';
    this.ARCHIVE_DIR = process.env.ARCHIVE_DIR || './archives';
    this.INVOICE_RETENTION_YEARS = parseInt(process.env.INVOICE_RETENTION_YEARS || '2', 10);
    this.ARCHIVE_RETENTION_YEARS = parseInt(process.env.ARCHIVE_RETENTION_YEARS || '7', 10);
    this.DISK_SPACE_THRESHOLD_GB = parseInt(process.env.DISK_SPACE_ALERT_THRESHOLD_GB || '10', 10);
    this.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@indiaangelforum.com';
  }

  /**
   * Initialize cron jobs
   */
  async initialize() {
    // Ensure archive directory exists
    await this.ensureArchiveDirectory();

    // Schedule invoice cleanup (daily at 2 AM UTC)
    cron.schedule('0 2 * * *', async () => {
      console.log('🗑️ Starting invoice cleanup job...');
      await this.cleanupOldInvoices();
    }, {
      timezone: 'UTC'
    });

    // Schedule archive cleanup (daily at 3 AM UTC)
    cron.schedule('0 3 * * *', async () => {
      console.log('🗑️ Starting archive cleanup job...');
      await this.cleanupOldArchives();
    }, {
      timezone: 'UTC'
    });

    // Schedule disk space check (hourly)
    cron.schedule('0 * * * *', async () => {
      await this.checkDiskSpace();
    }, {
      timezone: 'UTC'
    });

    console.log('✅ Invoice cleanup service initialized');
    console.log(`   - Invoice retention: ${this.INVOICE_RETENTION_YEARS} years`);
    console.log(`   - Archive retention: ${this.ARCHIVE_RETENTION_YEARS} years`);
    console.log(`   - Disk space threshold: ${this.DISK_SPACE_THRESHOLD_GB} GB`);
  }

  /**
   * Ensure archive directory exists
   */
  private async ensureArchiveDirectory() {
    try {
      await fs.access(this.ARCHIVE_DIR);
    } catch {
      await fs.mkdir(this.ARCHIVE_DIR, { recursive: true });
      console.log(`📁 Created archive directory: ${this.ARCHIVE_DIR}`);
    }
  }

  /**
   * Archive and delete invoices older than retention period
   */
  private async cleanupOldInvoices() {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - this.INVOICE_RETENTION_YEARS);

    try {
      // Find old invoices
      const oldInvoices = await prisma.invoice.findMany({
        where: {
          issueDate: {
            lt: cutoffDate,
          },
          status: {
            in: ['PAID', 'CANCELLED', 'REFUNDED'],
          },
        },
        select: {
          id: true,
          invoiceNumber: true,
          pdfPath: true,
          issueDate: true,
        },
      });

      if (oldInvoices.length === 0) {
        console.log('✅ No invoices to cleanup');
        return;
      }

      console.log(`📦 Found ${oldInvoices.length} invoices to archive`);

      // Create archive ZIP
      const archiveFileName = `invoices-${new Date().toISOString().split('T')[0]}.zip`;
      const archivePath = path.join(this.ARCHIVE_DIR, archiveFileName);
      
      await this.createArchive(oldInvoices, archivePath);

      // Delete invoice records and files
      let deletedCount = 0;
      let failedCount = 0;

      for (const invoice of oldInvoices) {
        try {
          // Delete PDF file
          if (invoice.pdfPath) {
            const fullPath = path.join(process.cwd(), invoice.pdfPath);
            try {
              await fs.unlink(fullPath);
            } catch (error) {
              console.warn(`⚠️ Could not delete PDF: ${fullPath}`);
            }
          }

          // Delete database record
          await prisma.invoice.delete({
            where: { id: invoice.id },
          });

          deletedCount++;
        } catch (error) {
          console.error(`❌ Failed to delete invoice ${invoice.invoiceNumber}:`, error);
          failedCount++;
        }
      }

      console.log(`✅ Invoice cleanup completed:`);
      console.log(`   - Archived: ${archiveFileName}`);
      console.log(`   - Deleted: ${deletedCount} invoices`);
      console.log(`   - Failed: ${failedCount} invoices`);

      // Send summary email to admin
      await this.sendCleanupSummary('invoice', {
        archived: archiveFileName,
        deleted: deletedCount,
        failed: failedCount,
        cutoffDate: cutoffDate.toISOString().split('T')[0],
      });

    } catch (error) {
      console.error('❌ Invoice cleanup failed:', error);
      await this.sendCleanupError('invoice', error);
    }
  }

  /**
   * Create ZIP archive of invoice PDFs
   */
  private async createArchive(invoices: any[], archivePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(archivePath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      output.on('close', () => {
        console.log(`📦 Archive created: ${archivePath} (${archive.pointer()} bytes)`);
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add each invoice PDF to archive
      for (const invoice of invoices) {
        if (invoice.pdfPath) {
          const fullPath = path.join(process.cwd(), invoice.pdfPath);
          const archiveName = `${invoice.invoiceNumber}.pdf`;
          
          try {
            archive.file(fullPath, { name: archiveName });
          } catch (error) {
            console.warn(`⚠️ Could not add ${fullPath} to archive:`, error);
          }
        }
      }

      archive.finalize();
    });
  }

  /**
   * Delete archive ZIPs older than retention period
   */
  private async cleanupOldArchives() {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - this.ARCHIVE_RETENTION_YEARS);

    try {
      const files = await fs.readdir(this.ARCHIVE_DIR);
      const zipFiles = files.filter(f => f.endsWith('.zip') && f.startsWith('invoices-'));

      let deletedCount = 0;
      let skippedCount = 0;

      for (const file of zipFiles) {
        const filePath = path.join(this.ARCHIVE_DIR, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          try {
            await fs.unlink(filePath);
            console.log(`🗑️ Deleted old archive: ${file}`);
            deletedCount++;
          } catch (error) {
            console.error(`❌ Failed to delete archive ${file}:`, error);
          }
        } else {
          skippedCount++;
        }
      }

      console.log(`✅ Archive cleanup completed:`);
      console.log(`   - Deleted: ${deletedCount} archives`);
      console.log(`   - Retained: ${skippedCount} archives`);

      if (deletedCount > 0) {
        await this.sendCleanupSummary('archive', {
          deleted: deletedCount,
          retained: skippedCount,
          cutoffDate: cutoffDate.toISOString().split('T')[0],
        });
      }

    } catch (error) {
      console.error('❌ Archive cleanup failed:', error);
      await this.sendCleanupError('archive', error);
    }
  }

  /**
   * Check available disk space and alert if low
   */
  private async checkDiskSpace() {
    try {
      const diskSpace = await checkDiskSpace(process.cwd());
      const freeGB = diskSpace.free / (1024 * 1024 * 1024);

      if (freeGB < this.DISK_SPACE_THRESHOLD_GB) {
        // Check if we already alerted in last 24 hours (throttle)
        const now = new Date();
        if (this.lastDiskAlert && 
            (now.getTime() - this.lastDiskAlert.getTime()) < 24 * 60 * 60 * 1000) {
          return; // Skip alert, already sent in last 24h
        }

        console.warn(`⚠️ Low disk space: ${freeGB.toFixed(2)} GB free`);

        // Send alert email
        await emailService.sendEmail({
          to: this.ADMIN_EMAIL,
          subject: '🚨 Low Disk Space Alert - India Angel Forum',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">⚠️ Low Disk Space Alert</h2>
              <p>The server is running low on disk space.</p>
              
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
                <p style="margin: 0;"><strong>Free Space:</strong> ${freeGB.toFixed(2)} GB</p>
                <p style="margin: 8px 0 0 0;"><strong>Threshold:</strong> ${this.DISK_SPACE_THRESHOLD_GB} GB</p>
                <p style="margin: 8px 0 0 0;"><strong>Total Space:</strong> ${(diskSpace.size / (1024 * 1024 * 1024)).toFixed(2)} GB</p>
              </div>

              <h3>Recommended Actions:</h3>
              <ul>
                <li>Review and clean old archives in <code>${this.ARCHIVE_DIR}</code></li>
                <li>Check for large log files</li>
                <li>Consider expanding storage capacity</li>
                <li>Review backup retention policies</li>
              </ul>

              <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                This alert will not repeat for 24 hours to prevent spam.
              </p>
            </div>
          `,
          text: `Low Disk Space Alert\n\nFree Space: ${freeGB.toFixed(2)} GB\nThreshold: ${this.DISK_SPACE_THRESHOLD_GB} GB\n\nPlease review storage usage.`,
        });

        this.lastDiskAlert = now;
      }

    } catch (error) {
      console.error('❌ Disk space check failed:', error);
    }
  }

  /**
   * Send cleanup summary email to admin
   */
  private async sendCleanupSummary(type: 'invoice' | 'archive', data: any) {
    try {
      const subject = type === 'invoice' 
        ? '✅ Invoice Cleanup Summary - India Angel Forum'
        : '✅ Archive Cleanup Summary - India Angel Forum';

      const html = type === 'invoice' ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">✅ Invoice Cleanup Completed</h2>
          <p>The scheduled invoice cleanup has completed successfully.</p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Archive File:</strong> ${data.archived}</p>
            <p style="margin: 8px 0 0 0;"><strong>Invoices Deleted:</strong> ${data.deleted}</p>
            ${data.failed > 0 ? `<p style="margin: 8px 0 0 0; color: #dc2626;"><strong>Failed:</strong> ${data.failed}</p>` : ''}
            <p style="margin: 8px 0 0 0;"><strong>Cutoff Date:</strong> ${data.cutoffDate}</p>
          </div>

          <p style="color: #64748b; font-size: 14px;">
            Archive Location: <code>${this.ARCHIVE_DIR}</code>
          </p>
        </div>
      ` : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">✅ Archive Cleanup Completed</h2>
          <p>The scheduled archive cleanup has completed successfully.</p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Archives Deleted:</strong> ${data.deleted}</p>
            <p style="margin: 8px 0 0 0;"><strong>Archives Retained:</strong> ${data.retained}</p>
            <p style="margin: 8px 0 0 0;"><strong>Cutoff Date:</strong> ${data.cutoffDate}</p>
          </div>

          <p style="color: #64748b; font-size: 14px;">
            Archive Location: <code>${this.ARCHIVE_DIR}</code>
          </p>
        </div>
      `;

      await emailService.sendEmail({
        to: this.ADMIN_EMAIL,
        subject,
        html,
        text: `Cleanup Summary\n\n${JSON.stringify(data, null, 2)}`,
      });

    } catch (error) {
      console.error('Failed to send cleanup summary email:', error);
    }
  }

  /**
   * Send cleanup error email to admin
   */
  private async sendCleanupError(type: 'invoice' | 'archive', error: any) {
    try {
      await emailService.sendEmail({
        to: this.ADMIN_EMAIL,
        subject: `🚨 ${type === 'invoice' ? 'Invoice' : 'Archive'} Cleanup Failed - India Angel Forum`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">🚨 Cleanup Job Failed</h2>
            <p>The ${type} cleanup job encountered an error.</p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
              <p style="margin: 0;"><strong>Error:</strong></p>
              <pre style="background-color: #fff; padding: 12px; border-radius: 4px; overflow-x: auto;">${error.message || error}</pre>
            </div>

            <p>Please review the server logs for more details.</p>
          </div>
        `,
        text: `Cleanup Failed\n\nType: ${type}\nError: ${error.message || error}`,
      });
    } catch (emailError) {
      console.error('Failed to send cleanup error email:', emailError);
    }
  }

  /**
   * Manual cleanup trigger (for admin use)
   */
  async triggerManualCleanup() {
    console.log('🔧 Manual cleanup triggered');
    await this.cleanupOldInvoices();
    await this.cleanupOldArchives();
    await this.checkDiskSpace();
  }

  /**
   * Get cleanup statistics
   */
  async getStatistics() {
    try {
      const invoiceCount = await prisma.invoice.count();
      const archiveFiles = await fs.readdir(this.ARCHIVE_DIR);
      const archiveCount = archiveFiles.filter(f => f.endsWith('.zip')).length;
      
      const diskSpace = await checkDiskSpace(process.cwd());
      const freeGB = diskSpace.free / (1024 * 1024 * 1024);
      const totalGB = diskSpace.size / (1024 * 1024 * 1024);

      return {
        invoices: {
          total: invoiceCount,
          retentionYears: this.INVOICE_RETENTION_YEARS,
        },
        archives: {
          total: archiveCount,
          retentionYears: this.ARCHIVE_RETENTION_YEARS,
          directory: this.ARCHIVE_DIR,
        },
        diskSpace: {
          free: freeGB.toFixed(2) + ' GB',
          total: totalGB.toFixed(2) + ' GB',
          usedPercent: ((1 - diskSpace.free / diskSpace.size) * 100).toFixed(2) + '%',
          threshold: this.DISK_SPACE_THRESHOLD_GB + ' GB',
          status: freeGB < this.DISK_SPACE_THRESHOLD_GB ? 'critical' : 'ok',
        },
      };
    } catch (error) {
      console.error('Failed to get cleanup statistics:', error);
      return null;
    }
  }
}

// Export singleton instance
export const invoiceCleanupService = new InvoiceCleanupService();
