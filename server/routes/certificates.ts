/**
 * Certificate Routes
 * 
 * Manages certificate generation and verification
 * 
 * @module routes/certificates
 */

import { Router } from 'express';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { certificateService } from '../services/certificate.service';
import { prisma } from '../../db';
import path from 'path';
import { existsSync, readFileSync } from 'fs';

const router = Router();

/**
 * POST /api/certificates/generate
 * 
 * Generate certificate for an attended event (admin only)
 */
router.post('/generate', authenticateUser, requireRoles(['admin']), async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    
    if (!userId || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'userId and eventId are required',
      });
    }
    
    const result = await certificateService.generateCertificate(userId, eventId);
    
    return res.json({
      success: true,
      data: {
        certificate: result.certificate,
        message: 'Certificate generated successfully',
      },
    });
  } catch (error: any) {
    console.error('Error generating certificate:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to generate certificate',
    });
  }
});

/**
 * GET /api/certificates
 * 
 * Get user's certificates
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            title: true,
            eventDate: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });
    
    return res.json({
      success: true,
      data: { certificates },
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch certificates',
    });
  }
});

/**
 * GET /api/certificates/:id
 * 
 * Get certificate by ID
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const certificate = await prisma.certificate.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        event: {
          select: {
            title: true,
            eventDate: true,
          },
        },
      },
    });
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found',
      });
    }
    
    return res.json({
      success: true,
      data: { certificate },
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch certificate',
    });
  }
});

/**
 * GET /api/certificates/:certificateId/download
 * 
 * Download certificate PDF
 */
router.get('/:certificateId/download', async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    // Look up certificate in database
    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [
          { certificateId },
          { id: certificateId },
        ],
      },
    });
    
    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }
    
    // Try to find the PDF file
    const pdfPath = path.join(process.cwd(), 'public', 'certificates', `${certificate.certificateId}.pdf`);
    
    if (existsSync(pdfPath)) {
      const pdfBuffer = readFileSync(pdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateId}.pdf"`);
      return res.send(pdfBuffer);
    }
    
    // If file not on disk, regenerate it
    const result = await certificateService.generateCertificatePdf?.(certificate);
    if (result) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateId}.pdf"`);
      return res.send(result);
    }
    
    return res.status(404).json({ success: false, error: 'Certificate PDF not found' });
  } catch (error) {
    console.error('Error downloading certificate:', error);
    return res.status(500).json({ success: false, error: 'Failed to download certificate' });
  }
});

/**
 * GET /api/certificates/verify/:certificateId
 * 
 * Verify certificate (public endpoint)
 */
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    const certificate = await certificateService.verifyCertificate(certificateId);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found',
        verified: false,
      });
    }
    
    return res.json({
      success: true,
      verified: true,
      data: {
        certificateId: certificate.certificateId,
        attendeeName: certificate.attendeeName,
        eventName: certificate.eventName,
        eventDate: certificate.eventDate,
        duration: certificate.duration,
        issuedAt: certificate.issuedAt,
      },
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify certificate',
    });
  }
});

export default router;
