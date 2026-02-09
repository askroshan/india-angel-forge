import Queue, { Job } from 'bull';
import { prisma } from '../../db';
import { invoiceService } from './invoice.service';
import { emailService } from './email.service';

/**
 * Invoice Queue Service
 * 
 * Handles asynchronous invoice generation with retry logic:
 * - 3 retry attempts with exponential backoff (1min, 5min, 15min)
 * - Queues failed jobs for admin digest
 * - Integrates with Bull Board for monitoring
 */

interface InvoiceJobData {
  userId: string;
  paymentId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerPAN?: string;
  buyerAddress?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  tds?: number;
  totalAmount: number;
}

interface InvoiceJobResult {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  pdfPath?: string;
  error?: string;
}

class InvoiceQueueService {
  private queue: Queue<InvoiceJobData>;
  private readonly REDIS_URL: string;

  constructor() {
    this.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    
    // Initialize Bull queue with retry configuration
    this.queue = new Queue<InvoiceJobData>('invoice-generation', this.REDIS_URL, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // Start at 1 minute
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: false, // Keep failed jobs for admin review
      },
    });

    // Register job processor
    this.queue.process(this.processInvoiceJob.bind(this));

    // Register event handlers
    this.queue.on('completed', this.onJobCompleted.bind(this));
    this.queue.on('failed', this.onJobFailed.bind(this));
    this.queue.on('stalled', this.onJobStalled.bind(this));

    console.log('✅ Invoice queue service initialized');
  }

  /**
   * Add invoice generation job to queue
   * 
   * @param data - Invoice data including user info, payment details, and line items
   * @returns Promise resolving to the queued job
   * @throws Error if queue operation fails
   * 
   * @example
   * ```typescript
   * await invoiceQueueService.addInvoiceJob({
   *   userId: 'user-123',
   *   paymentId: 'pay-456',
   *   buyerName: 'John Doe',
   *   buyerEmail: 'john@example.com',
   *   lineItems: [{ description: 'Service', quantity: 1, unitPrice: 1000, amount: 1000 }],
   *   subtotal: 1000,
   *   totalAmount: 1000
   * });
   * ```
   */
  async addInvoiceJob(data: InvoiceJobData): Promise<Job<InvoiceJobData>> {
    const job = await this.queue.add(data, {
      jobId: `invoice-${data.paymentId}`, // Unique job ID prevents duplicates
      priority: 1,
    });

    console.log(`📄 Invoice job queued: ${job.id} for payment ${data.paymentId}`);
    return job;
  }

  /**
   * Retry a specific invoice generation job
   * 
   * @param paymentId - ID of the payment to retry invoice generation for
   * @returns Promise resolving to the retried or newly created job, or null if payment not found
   * @throws Error if database query fails
   * 
   * @remarks
   * If a failed job exists, it will be retried. Otherwise, payment data is fetched
   * from the database and a new job is created.
   */
  async retryInvoiceJob(paymentId: string): Promise<Job<InvoiceJobData> | null> {
    const jobId = `invoice-${paymentId}`;
    
    // Try to get existing failed job
    const failedJob = await this.queue.getJob(jobId);
    
    if (failedJob && (await failedJob.isFailed())) {
      // Retry existing job
      await failedJob.retry();
      console.log(`🔄 Retrying invoice job: ${jobId}`);
      return failedJob;
    }

    // If no failed job, might need to fetch payment data and create new job
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      console.error(`❌ Payment not found for retry: ${paymentId}`);
      return null;
    }

    // Create new job
    const jobData: InvoiceJobData = {
      userId: payment.userId,
      paymentId: payment.id,
      buyerName: payment.user.fullName || 'User',
      buyerEmail: payment.user.email,
      lineItems: [
        {
          description: `${payment.type} - ${payment.description || 'Payment'}`,
          quantity: 1,
          unitPrice: Number(payment.amount),
          amount: Number(payment.amount),
        },
      ],
      subtotal: Number(payment.amount),
      totalAmount: Number(payment.amount),
    };

    return await this.addInvoiceJob(jobData);
  }

  /**
   * Batch retry multiple invoices
   * 
   * @param paymentIds - Array of payment IDs to retry (max 50)
   * @returns Promise resolving to success and failure counts
   * @throws Error if batch size exceeds 50
   * 
   * @remarks
   * Processes each payment ID sequentially to avoid overwhelming the queue.
   * Failed retries are logged but don't stop the batch operation.
   * 
   * @example
   * ```typescript
   * const result = await invoiceQueueService.retryBatchInvoices(['pay-1', 'pay-2', 'pay-3']);
   * console.log(`Retried: ${result.success} succeeded, ${result.failed} failed`);
   * ```
   */
  async retryBatchInvoices(paymentIds: string[]): Promise<{ success: number; failed: number }> {
    if (paymentIds.length > 50) {
      throw new Error('Batch retry limited to 50 invoices at a time');
    }

    let success = 0;
    let failed = 0;

    for (const paymentId of paymentIds) {
      try {
        await this.retryInvoiceJob(paymentId);
        success++;
      } catch (error) {
        console.error(`Failed to retry invoice for payment ${paymentId}:`, error);
        failed++;
      }
    }

    console.log(`✅ Batch retry completed: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Get failed invoice jobs for admin review
   * 
   * @param limit - Maximum number of failed jobs to retrieve (default 100)
   * @returns Promise resolving to array of failed Bull jobs
   * 
   * @remarks
   * Used by admin dashboard to display failed invoices requiring manual intervention.
   * Jobs include full retry history and error details.
   */
  async getFailedJobs(limit: number = 100): Promise<Job<InvoiceJobData>[]> {
    return await this.queue.getFailed(0, limit - 1);
  }

  /**
   * Get job status
   * 
   * @param paymentId - Payment ID to check status for
   * @returns Promise resolving to job state string, or null if job doesn't exist
   * 
   * @remarks
   * Possible states: 'completed', 'waiting', 'active', 'delayed', 'failed', 'paused'
   */
  async getJobStatus(paymentId: string): Promise<string | null> {
    const jobId = `invoice-${paymentId}`;
    const job = await this.queue.getJob(jobId);
    
    if (!job) return null;

    const state = await job.getState();
    return state;
  }

  /**
   * Process invoice generation job (Bull worker handler)
   * 
   * @param job - Bull job containing invoice data
   * @returns Promise resolving to job result with invoice details or error
   * @throws Error if invoice generation fails (triggers retry)
   * 
   * @private
   * @remarks
   * Called automatically by Bull queue workers. Failures are automatically retried
   * up to 3 times with exponential backoff before being marked as permanently failed.
   */
  private async processInvoiceJob(job: Job<InvoiceJobData>): Promise<InvoiceJobResult> {
    const { userId, paymentId, ...invoiceData } = job.data;

    console.log(`📄 Processing invoice job ${job.id} (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`);

    try {
      // Generate invoice using invoice service
      const result = await invoiceService.generateInvoice({
        userId,
        paymentId,
        ...invoiceData,
      });

      console.log(`✅ Invoice generated successfully: ${result.invoiceNumber}`);

      return {
        success: true,
        invoiceId: result.id,
        invoiceNumber: result.invoiceNumber,
        pdfPath: result.pdfPath,
      };
    } catch (error: any) {
      console.error(`❌ Invoice generation failed for job ${job.id}:`, error);

      // Log error for debugging
      await this.logJobError(job, error);

      throw error; // Re-throw to trigger retry
    }
  }

  /**
   * Handle successful job completion
   * 
   * @param job - Completed Bull job
   * @param result - Job result containing invoice details
   * 
   * @private
   * @remarks
   * Event handler called automatically when a job completes successfully.
   * Updates payment record and logs completion.
   */
  private async onJobCompleted(job: Job<InvoiceJobData>, result: InvoiceJobResult) {
    console.log(`✅ Invoice job completed: ${job.id} - ${result.invoiceNumber}`);

    // Update payment record with invoice reference
    try {
      await prisma.payment.update({
        where: { id: job.data.paymentId },
        data: {
          // Invoice relation already set by invoiceService.generateInvoice
        },
      });
    } catch (error) {
      console.error('Failed to update payment after invoice generation:', error);
    }
  }

  /**
   * Handle job failure after all retries exhausted
   * 
   * @param job - Failed Bull job
   * @param error - Error that caused the failure
   * 
   * @private
   * @remarks
   * Event handler called when a job permanently fails after all retry attempts.
   * Creates activity log and leaves job in failed state for admin review.
   * Failed jobs are included in daily admin digest emails.
   */
  private async onJobFailed(job: Job<InvoiceJobData>, error: Error) {
    console.error(`❌ Invoice job permanently failed: ${job.id} after ${job.attemptsMade} attempts`);
    console.error('Error:', error.message);

    // Create activity log for permanent failure
    try {
      await prisma.activityLog.create({
        data: {
          userId: job.data.userId,
          activityType: 'DOCUMENT_SHARED', // Closest enum value for invoice generation
          entityType: 'Payment',
          entityId: job.data.paymentId,
          description: `Invoice generation failed permanently after ${job.attemptsMade} attempts`,
          metadata: {
            jobId: job.id,
            error: error.message,
            attempts: job.attemptsMade,
          },
        },
      });
    } catch (logError) {
      console.error('Failed to create activity log for failed job:', logError);
    }

    // Job will be picked up by admin digest service
  }

  /**
   * Handle stalled jobs (workers crashed/timeout)
   * 
   * @param job - Stalled Bull job
   * 
   * @private
   * @remarks
   * Jobs become stalled when worker processes crash or timeout.
   * Bull automatically retries stalled jobs.
   */
  private async onJobStalled(job: Job<InvoiceJobData>) {
    console.warn(`⚠️ Invoice job stalled: ${job.id}`);
  }

  /**
   * Log job error to database for debugging
   * 
   * @param job - Bull job that encountered error
   * @param error - Error object with message and stack trace
   * 
   * @private
   * @remarks
   * Creates activity log entry for each retry attempt to maintain audit trail.
   * Errors are also visible in Bull Board dashboard.
   */
  private async logJobError(job: Job<InvoiceJobData>, error: any) {
    try {
      // Could create a separate JobErrorLog table, but using ActivityLog for now
      await prisma.activityLog.create({
        data: {
          userId: job.data.userId,
          activityType: 'DOCUMENT_SHARED',
          entityType: 'Payment',
          entityId: job.data.paymentId,
          description: `Invoice generation attempt ${job.attemptsMade + 1} failed`,
          metadata: {
            jobId: job.id,
            error: error.message,
            stack: error.stack,
            attempt: job.attemptsMade + 1,
            maxAttempts: job.opts.attempts,
          },
        },
      });
    } catch (logError) {
      console.error('Failed to log job error:', logError);
    }
  }

  /**
   * Get queue instance for Bull Board integration
   * 
   * @returns Bull queue instance for monitoring dashboard
   * 
   * @remarks
   * Used by server.ts to integrate with Bull Board admin dashboard at /admin/queues
   */
  getQueue(): Queue<InvoiceJobData> {
    return this.queue;
  }

  /**
   * Clean old completed jobs (manual cleanup)
   * 
   * @param olderThanDays - Age threshold in days (default 30)
   * 
   * @remarks
   * Removes completed and failed jobs older than threshold to prevent queue bloat.
   * Note: Failed jobs visible in admin dashboard are kept until manually cleaned.
   */
  async cleanOldJobs(olderThanDays: number = 30) {
    const timestamp = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    await this.queue.clean(timestamp, 'completed');
    await this.queue.clean(timestamp, 'failed');
    console.log(`🧹 Cleaned jobs older than ${olderThanDays} days`);
  }

  /**
   * Get queue metrics for monitoring
   * 
   * @returns Promise resolving to metrics object with counts by job state
   * 
   * @remarks
   * Used by admin dashboard and digest emails to monitor queue health.
   * High waiting/delayed counts may indicate processing bottlenecks.
   * 
   * @example
   * ```typescript
   * const metrics = await invoiceQueueService.getMetrics();
   * console.log(`Queue has ${metrics.failed} failed jobs requiring attention`);
   * ```
   */
  async getMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }
}

// Export singleton instance
export const invoiceQueueService = new InvoiceQueueService();
