/**
 * B1: Certificate PDF Download - Service Export Test
 *
 * TDD: The certificate download route calls
 * `certificateService.generateCertificatePdf?.(certificate)` but this method
 * is NOT exported from the service. The optional chain always returns undefined,
 * causing the route to return 404.
 *
 * This test verifies the service exports generateCertificatePdf and that it
 * generates a valid PDF buffer from a certificate record.
 */

import { describe, it, expect, vi } from 'vitest';
import { certificateService } from '../../../server/services/certificate.service';

// Mock pdfkit (PDF generation) and QRCode for unit tests
vi.mock('pdfkit', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      const EventEmitter = require('events').EventEmitter;
      const doc = new EventEmitter();
      doc.rect = vi.fn().mockReturnThis();
      doc.lineWidth = vi.fn().mockReturnThis();
      doc.stroke = vi.fn().mockReturnThis();
      doc.fontSize = vi.fn().mockReturnThis();
      doc.font = vi.fn().mockReturnThis();
      doc.fillColor = vi.fn().mockReturnThis();
      doc.text = vi.fn().mockReturnThis();
      doc.moveDown = vi.fn().mockReturnThis();
      doc.moveTo = vi.fn().mockReturnThis();
      doc.lineTo = vi.fn().mockReturnThis();
      doc.image = vi.fn().mockReturnThis();
      doc.page = { width: 841.89, height: 595.28 };
      doc.end = vi.fn(() => {
        const chunk = Buffer.from('%PDF-1.4 mock pdf content');
        doc.emit('data', chunk);
        doc.emit('end');
      });
      return doc;
    }),
  };
});

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,bW9jay1xcg=='),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-qr-code')),
  },
}));

describe('B1: certificateService.generateCertificatePdf', () => {
  it('should export generateCertificatePdf as a method on certificateService', () => {
    // B1 RED: This fails because generateCertificatePdf is NOT in the exports
    expect(typeof certificateService.generateCertificatePdf).toBe('function');
  });

  it('should generate a PDF buffer from a certificate record', async () => {
    const mockCertificate = {
      id: 'cert-db-id-1',
      certificateId: 'IAF-2024-ABCDE-12345',
      userId: 'user-1',
      eventId: 'event-1',
      attendeeName: 'John Doe',
      eventName: 'India Angel Forum Conference 2024',
      eventDate: new Date('2024-06-15'),
      duration: 180,
      pdfUrl: '/certificates/IAF-2024-ABCDE-12345.pdf',
      verificationUrl: 'https://indiaangelforum.com/verify-certificate/IAF-2024-ABCDE-12345',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await certificateService.generateCertificatePdf!(mockCertificate);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });
});
