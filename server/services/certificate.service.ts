/**
 * Certificate Generation Service
 * 
 * Generates PDF certificates for event attendance with QR code verification
 * 
 * @module services/certificate.service
 */

import PDFDocument from 'pdfkit';
import { prisma } from '../../db';
import QRCode from 'qrcode';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Generate sequential certificate ID
 * Format: CERT-YYYY-NNNNNN
 */
async function generateCertificateId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CERT-${year}-`;
  
  // Find the latest certificate for this year
  const latest = await db.certificate.findFirst({
    where: {
      certificateId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      certificateId: 'desc',
    },
  });
  
  let sequence = 1;
  if (latest) {
    const lastSequence = parseInt(latest.certificateId.split('-')[2]);
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${sequence.toString().padStart(6, '0')}`;
}

/**
 * Generate certificate PDF
 */
async function generateCertificatePDF(
  certificateId: string,
  attendeeName: string,
  eventName: string,
  eventDate: Date,
  duration: number,
  verificationUrl: string
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 72, right: 72 },
      });
      
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      
      // Certificate border
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
        .lineWidth(3)
        .stroke('#1e40af');
      
      doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80)
        .lineWidth(1)
        .stroke('#93c5fd');
      
      // Title
      doc.fontSize(36)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('CERTIFICATE OF ATTENDANCE', {
          align: 'center',
          width: doc.page.width - 160,
        });
      
      doc.moveDown(2);
      
      // This is to certify
      doc.fontSize(14)
        .font('Helvetica')
        .fillColor('#374151')
        .text('This is to certify that', {
          align: 'center',
        });
      
      doc.moveDown(1);
      
      // Attendee name
      doc.fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#111827')
        .text(attendeeName, {
          align: 'center',
        });
      
      doc.moveDown(1.5);
      
      // Has attended
      doc.fontSize(14)
        .font('Helvetica')
        .fillColor('#374151')
        .text('has successfully attended', {
          align: 'center',
        });
      
      doc.moveDown(1);
      
      // Event name
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text(eventName, {
          align: 'center',
        });
      
      doc.moveDown(1.5);
      
      // Event date and duration
      const dateStr = eventDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      const durationHours = Math.floor(duration / 60);
      const durationMins = duration % 60;
      const durationStr = durationHours > 0 
        ? `${durationHours} hour${durationHours > 1 ? 's' : ''}${durationMins > 0 ? ` ${durationMins} minutes` : ''}`
        : `${durationMins} minutes`;
      
      doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(`Date: ${dateStr}`, { align: 'center' });
      
      doc.text(`Duration: ${durationStr}`, { align: 'center' });
      
      doc.moveDown(2);
      
      // Generate QR code for verification
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);
      const qrBase64 = qrCodeDataUrl.split(',')[1];
      const qrBuffer = Buffer.from(qrBase64, 'base64');
      
      // Add QR code (bottom left)
      const qrSize = 80;
      const qrX = 80;
      const qrY = doc.page.height - 130;
      
      doc.image(qrBuffer, qrX, qrY, {
        width: qrSize,
        height: qrSize,
      });
      
      doc.fontSize(8)
        .fillColor('#9ca3af')
        .text('Scan to verify', qrX - 10, qrY + qrSize + 5, {
          width: qrSize + 20,
          align: 'center',
        });
      
      // Certificate ID (bottom right)
      doc.fontSize(10)
        .fillColor('#6b7280')
        .text(`Certificate ID: ${certificateId}`, doc.page.width - 250, doc.page.height - 80, {
          align: 'right',
          width: 200,
        });
      
      // Verification URL
      doc.fontSize(8)
        .fillColor('#9ca3af')
        .text(verificationUrl, doc.page.width - 250, doc.page.height - 65, {
          align: 'right',
          width: 200,
        });
      
      // Issued date
      const issuedDate = new Date().toLocaleDateString('en-IN');
      doc.fontSize(8)
        .text(`Issued: ${issuedDate}`, doc.page.width - 250, doc.page.height - 50, {
          align: 'right',
          width: 200,
        });
      
      // Organization name
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('India Angel Forum', {
          align: 'center',
          width: doc.page.width - 160,
        });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate certificate for an attended event
 */
export async function generateCertificate(userId: string, eventId: string): Promise<{
  certificate: any;
  pdfBuffer: Buffer;
}> {
  // Get attendance record
  const attendance = await db.eventAttendance.findUnique({
    where: { userId_eventId: { userId, eventId } },
    include: {
      user: true,
      event: true,
    },
  });
  
  if (!attendance) {
    throw new Error('Attendance record not found');
  }
  
  if (attendance.attendanceStatus !== 'ATTENDED') {
    throw new Error('Certificate can only be generated for attended events');
  }
  
  if (attendance.certificateId) {
    throw new Error('Certificate already generated for this attendance');
  }
  
  // Calculate duration
  let duration = 120; // Default 2 hours
  if (attendance.checkInTime && attendance.checkOutTime) {
    duration = Math.round(
      (attendance.checkOutTime.getTime() - attendance.checkInTime.getTime()) / 60000
    );
  }
  
  // Generate certificate ID
  const certificateId = await generateCertificateId();
  
  // Generate verification URL
  const verificationUrl = `${process.env.APP_URL || 'https://indiaangelforum.com'}/verify-certificate/${certificateId}`;
  
  // Generate PDF
  const pdfBuffer = await generateCertificatePDF(
    certificateId,
    attendance.user.fullName || attendance.user.email,
    attendance.event.title,
    attendance.event.eventDate,
    duration,
    verificationUrl
  );
  
  // Save PDF to disk
  const certificatesDir = path.join(process.cwd(), 'public', 'certificates');
  await fs.mkdir(certificatesDir, { recursive: true });
  
  const filename = `${certificateId}.pdf`;
  const filepath = path.join(certificatesDir, filename);
  await fs.writeFile(filepath, pdfBuffer);
  
  const pdfUrl = `/certificates/${filename}`;
  
  // Create certificate record
  const certificate = await db.certificate.create({
    data: {
      certificateId,
      userId,
      eventId,
      attendeeName: attendance.user.fullName || attendance.user.email,
      eventName: attendance.event.title,
      eventDate: attendance.event.eventDate,
      duration,
      pdfUrl,
      verificationUrl,
    },
  });
  
  // Update attendance record
  await db.eventAttendance.update({
    where: { userId_eventId: { userId, eventId } },
    data: {
      certificateId,
      certificateUrl: pdfUrl,
    },
  });
  
  // Log activity
  await db.activityLog.create({
    data: {
      userId,
      activityType: 'CERTIFICATE_ISSUED',
      entityType: 'certificate',
      entityId: certificate.id,
      description: `Certificate issued for ${attendance.event.title}`,
    },
  });
  
  return { certificate, pdfBuffer };
}

/**
 * Verify certificate by ID
 */
export async function verifyCertificate(certificateId: string) {
  const certificate = await db.certificate.findUnique({
    where: { certificateId },
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
      event: {
        select: {
          title: true,
        },
      },
    },
  });
  
  return certificate;
}

export const certificateService = {
  generateCertificate,
  verifyCertificate,
};
