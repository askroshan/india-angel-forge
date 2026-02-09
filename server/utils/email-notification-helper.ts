import { emailService } from '../services/email.service';
import { prisma } from '../../db';

/**
 * Email Notification Helper
 * 
 * Common patterns for email notifications with consistent error handling,
 * logging, and user preference checks.
 */

interface EmailNotificationOptions {
  userId: string;
  templateName: string;
  subject: string;
  data: Record<string, any>;
  entityType?: string;
  entityId?: string;
  activityType?: string;
  activityDescription?: string;
}

/**
 * Send email notification with user preference check and activity logging
 * 
 * @param options - Email notification options
 * @returns Promise<boolean> - True if email sent, false if skipped or failed
 * 
 * @remarks
 * This helper:
 * 1. Checks user notification preferences
 * 2. Sends email if preferences allow
 * 3. Creates activity log entry
 * 4. Logs email send in database
 * 5. Handles errors gracefully without throwing
 * 
 * @example
 * ```typescript
 * await sendEmailNotification({
 *   userId: 'user-123',
 *   templateName: 'payment-success',
 *   subject: 'Payment Successful',
 *   data: { amount: 1000, orderId: 'order-456' },
 *   entityType: 'Payment',
 *   entityId: 'payment-789',
 *   activityType: 'PAYMENT_COMPLETED',
 *   activityDescription: 'Payment of ₹1,000 completed successfully'
 * });
 * ```
 */
export async function sendEmailNotification(options: EmailNotificationOptions): Promise<boolean> {
  const {
    userId,
    templateName,
    subject,
    data,
    entityType,
    entityId,
    activityType,
    activityDescription,
  } = options;

  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreferences: true },
    });

    if (!user) {
      console.error(`User not found: ${userId}`);
      return false;
    }

    // Check notification preferences (default to enabled if not set)
    const preferences = user.notificationPreferences?.[0];
    if (preferences && !preferences.emailEnabled) {
      console.log(`Email notifications disabled for user: ${userId}`);
      return false;
    }

    // Send email
    await emailService.sendEmail({
      to: user.email,
      subject,
      template: templateName,
      data: {
        ...data,
        userName: user.fullName || user.email,
        userEmail: user.email,
      },
    });

    // Create activity log if details provided
    if (entityType && entityId && activityType && activityDescription) {
      await prisma.activityLog.create({
        data: {
          userId,
          activityType,
          entityType,
          entityId,
          description: activityDescription,
          metadata: {
            emailTemplate: templateName,
            emailSubject: subject,
          },
        },
      });
    }

    console.log(`✅ Email notification sent to ${user.email}: ${templateName}`);
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
}

/**
 * Send payment notification email
 * 
 * @param userId - User ID
 * @param paymentId - Payment ID
 * @param type - Notification type (initiated/success/failed)
 * @param data - Payment data for template
 * 
 * @remarks
 * Specialized helper for payment-related notifications.
 * Automatically determines template, subject, and activity type.
 */
export async function sendPaymentNotification(
  userId: string,
  paymentId: string,
  type: 'initiated' | 'success' | 'failed',
  data: {
    amount: number;
    orderId: string;
    gateway?: string;
    failureReason?: string;
    invoiceNumber?: string;
  }
): Promise<boolean> {
  const templates = {
    initiated: {
      template: 'payment-initiated',
      subject: 'Payment Order Created',
      activityType: 'PAYMENT_CREATED',
      description: `Payment of ₹${data.amount} initiated`,
    },
    success: {
      template: 'payment-success',
      subject: 'Payment Successful',
      activityType: 'PAYMENT_COMPLETED',
      description: `Payment of ₹${data.amount} completed successfully`,
    },
    failed: {
      template: 'payment-failed',
      subject: 'Payment Failed',
      activityType: 'PAYMENT_FAILED',
      description: `Payment of ₹${data.amount} failed: ${data.failureReason || 'Unknown reason'}`,
    },
  };

  const config = templates[type];

  return await sendEmailNotification({
    userId,
    templateName: config.template,
    subject: config.subject,
    data: {
      amount: data.amount,
      orderId: data.orderId,
      gateway: data.gateway,
      failureReason: data.failureReason,
      invoiceNumber: data.invoiceNumber,
      paymentId,
    },
    entityType: 'Payment',
    entityId: paymentId,
    activityType: config.activityType,
    activityDescription: config.description,
  });
}

/**
 * Send refund notification email
 * 
 * @param userId - User ID
 * @param paymentId - Original payment ID
 * @param refundId - Refund transaction ID
 * @param data - Refund data for template
 */
export async function sendRefundNotification(
  userId: string,
  paymentId: string,
  refundId: string,
  data: {
    amount: number;
    refundAmount: number;
    reason?: string;
    originalOrderId: string;
  }
): Promise<boolean> {
  return await sendEmailNotification({
    userId,
    templateName: 'refund-processed',
    subject: 'Refund Processed',
    data: {
      amount: data.amount,
      refundAmount: data.refundAmount,
      reason: data.reason,
      originalOrderId: data.originalOrderId,
      paymentId,
      refundId,
    },
    entityType: 'Payment',
    entityId: paymentId,
    activityType: 'PAYMENT_REFUNDED',
    activityDescription: `Refund of ₹${data.refundAmount} processed for payment ${paymentId}`,
  });
}

/**
 * Batch send notifications (with delay to avoid rate limiting)
 * 
 * @param notifications - Array of notification options
 * @param delayMs - Delay between emails in milliseconds (default 100ms)
 * @returns Promise<{ sent: number, failed: number }>
 * 
 * @remarks
 * Sends multiple notifications with configurable delay to avoid email API rate limits.
 * Processes notifications sequentially and reports success/failure counts.
 */
export async function sendBatchNotifications(
  notifications: EmailNotificationOptions[],
  delayMs: number = 100
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const notification of notifications) {
    const success = await sendEmailNotification(notification);
    if (success) {
      sent++;
    } else {
      failed++;
    }

    // Delay between emails to avoid rate limiting
    if (delayMs > 0 && notifications.indexOf(notification) < notifications.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`📧 Batch notifications complete: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

/**
 * Format currency for email templates (Indian format)
 * 
 * @param amount - Amount in rupees
 * @returns Formatted string (e.g., "₹1,00,000.00")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for email templates (Indian timezone)
 * 
 * @param date - Date object or ISO string
 * @returns Formatted date string (e.g., "5 Feb 2026, 2:30 PM IST")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' IST';
}
