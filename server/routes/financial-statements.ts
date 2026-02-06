import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest, authenticateUser, requireRoles } from '../middleware/auth';
import {
  generateFinancialStatement,
  emailFinancialStatement,
  getUserStatements,
} from '../services/financial-statement.service';

const router = Router();

/**
 * Financial Statements API Routes
 * 
 * Provides endpoints for generating, viewing, and emailing financial statements.
 * 
 * Routes:
 * - POST /generate: Generate new statement (admin)
 * - GET /statements: List user's statements
 * - GET /statements/:id: Get single statement
 * - POST /statements/:id/email: Email statement to user (admin)
 * 
 * E2E Tests: FS-E2E-001 to FS-E2E-008
 */

// Zod schema for statement generation
const generateStatementSchema = z.object({
  userId: z.string(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  format: z.enum(['summary', 'detailed']),
});

/**
 * POST /api/financial-statements/generate
 * Generate a new financial statement
 * 
 * Admin only. Creates monthly statement with tax breakdown.
 * 
 * Body:
 * - userId: number (required)
 * - month: number 1-12 (required)
 * - year: number (required)
 * - format: 'SUMMARY' | 'DETAILED' (required)
 * 
 * Response:
 * - success: boolean
 * - data: Statement object with PDF URL
 * 
 * E2E Tests: FS-E2E-001, FS-E2E-003
 */
router.post(
  '/generate',
  authenticateUser,
  requireRoles(['admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validatedData = generateStatementSchema.parse(req.body);

      const statement = await generateFinancialStatement(validatedData);

      res.json({
        success: true,
        data: statement,
        message: 'Financial statement generated successfully',
      });
    } catch (error: any) {
      console.error('Generate statement error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }

      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      if (error.message === 'Statement already exists for this period') {
        return res.status(409).json({
          success: false,
          error: 'Statement already exists for this period',
          code: 'STATEMENT_EXISTS',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to generate statement',
        code: 'GENERATION_ERROR',
      });
    }
  }
);

// Zod schema for statement filters
const statementFiltersSchema = z.object({
  year: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  month: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  format: z.enum(['SUMMARY', 'DETAILED']).optional(),
});

/**
 * GET /api/financial-statements/statements
 * Get user's financial statements
 * 
 * Returns all statements for the authenticated user with optional filters.
 * 
 * Query params:
 * - year: number (optional) - Filter by year
 * - month: number 1-12 (optional) - Filter by month
 * - format: 'SUMMARY' | 'DETAILED' (optional) - Filter by format
 * 
 * Response:
 * - success: boolean
 * - data: Array of statements
 * - count: Total number of statements
 * 
 * E2E Tests: FS-E2E-002, FS-E2E-004, FS-E2E-005
 */
router.get(
  '/statements',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filters = statementFiltersSchema.parse(req.query);

      const statements = await getUserStatements(req.user!.id, filters);

      res.json({
        success: true,
        data: statements,
        count: statements.length,
      });
    } catch (error: any) {
      console.error('Get statements error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid filter parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch statements',
        code: 'FETCH_ERROR',
      });
    }
  }
);

/**
 * GET /api/financial-statements/statements/:id
 * Get single financial statement
 * 
 * Returns statement details if user owns it or is admin.
 * 
 * Params:
 * - id: Statement ID
 * 
 * Response:
 * - success: boolean
 * - data: Statement object
 * 
 * E2E Tests: FS-E2E-006
 */
router.get(
  '/statements/:id',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const statementId = parseInt(req.params.id, 10);

      if (isNaN(statementId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid statement ID',
          code: 'INVALID_ID',
        });
      }

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const statement = await prisma.financialStatement.findUnique({
        where: { id: statementId },
      });

      if (!statement) {
        return res.status(404).json({
          success: false,
          error: 'Statement not found',
          code: 'NOT_FOUND',
        });
      }

      // Check authorization: user must own the statement or be admin
      const isAdmin = req.user!.roles?.includes('admin');
      if (statement.userId !== req.user!.id && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED',
        });
      }

      res.json({
        success: true,
        data: statement,
      });
    } catch (error: any) {
      console.error('Get statement error:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to fetch statement',
        code: 'FETCH_ERROR',
      });
    }
  }
);

/**
 * POST /api/financial-statements/statements/:id/email
 * Email financial statement to user
 * 
 * Admin only. Sends statement PDF to user's email.
 * 
 * Params:
 * - id: Statement ID
 * 
 * Response:
 * - success: boolean
 * - data: Updated statement with email timestamp
 * 
 * E2E Tests: FS-E2E-007, FS-E2E-008
 */
router.post(
  '/statements/:id/email',
  authenticateUser,
  requireRoles(['admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const statementId = parseInt(req.params.id, 10);

      if (isNaN(statementId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid statement ID',
          code: 'INVALID_ID',
        });
      }

      const statement = await emailFinancialStatement(statementId);

      res.json({
        success: true,
        data: statement,
        message: 'Statement emailed successfully',
      });
    } catch (error: any) {
      console.error('Email statement error:', error);

      if (error.message === 'Statement not found') {
        return res.status(404).json({
          success: false,
          error: 'Statement not found',
          code: 'NOT_FOUND',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to email statement',
        code: 'EMAIL_ERROR',
      });
    }
  }
);

export default router;
