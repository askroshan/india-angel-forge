/**
 * Authentication Middleware
 * 
 * Provides user authentication middleware for API routes
 * 
 * @module middleware/auth
 */

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * Extended request interface with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles?: string[];
  };
}

/**
 * Middleware to authenticate user via JWT token
 * 
 * Extracts token from Authorization header and verifies it.
 * Adds user information to request object if valid.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  jwt.verify(
    token,
    JWT_SECRET,
    (err: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
      if (err) {
        res.status(403).json({
          success: false,
          error: 'Invalid or expired token',
          code: 'FORBIDDEN',
        });
        return;
      }

      // Add user to request
      const payload = decoded as JwtPayload;
      (req as AuthenticatedRequest).user = {
        id: payload.userId,
        email: payload.email,
        roles: payload.roles || [],
      };

      next();
    }
  );
};

/**
 * Middleware to require specific roles
 * 
 * Must be used after authenticateUser middleware
 * 
 * @param allowedRoles - Array of roles that can access the route
 * @returns Express middleware function
 * 
 * @example
 * router.get('/admin/users', authenticateUser, requireRoles(['admin']), handler);
 */
export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const userRoles = user.roles || [];
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.',
        code: 'FORBIDDEN',
        requiredRoles: allowedRoles,
        userRoles,
      });
      return;
    }

    next();
  };
};
