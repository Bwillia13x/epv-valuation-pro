// EPV Valuation Pro - Authentication Middleware
import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../services/AuthService';
import { UserRole } from '../generated/prisma';

export interface AuthenticatedRequest extends NextApiRequest {
  userId: string;
  userEmail: string;
  userRole: UserRole;
}

/**
 * Authentication middleware for API routes
 */
export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authorization header missing or invalid format',
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token and get user
      const user = await AuthService.verifyToken(token);

      if (!user) {
        return res.status(401).json({
          error: 'Invalid or expired token',
        });
      }

      // Attach user info to request
      (req as AuthenticatedRequest).userId = user.id;
      (req as AuthenticatedRequest).userEmail = user.email;
      (req as AuthenticatedRequest).userRole = user.role;

      // Call the actual handler
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Authentication failed',
      });
    }
  };
}

/**
 * Role-based authorization middleware
 */
export function withRole(requiredRoles: UserRole[]) {
  return function (
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
  ) {
    return withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
      const userRole = (req as AuthenticatedRequest).userRole;

      if (!requiredRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
        });
      }

      return handler(req, res);
    });
  };
}

/**
 * Admin-only middleware
 */
export function withAdmin(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return withRole(['ADMIN', 'SUPER_ADMIN'])(handler);
}

/**
 * Manager+ middleware
 */
export function withManager(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return withRole(['MANAGER', 'ADMIN', 'SUPER_ADMIN'])(handler);
}

/**
 * Senior+ middleware
 */
export function withSenior(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return withRole(['SENIOR_ANALYST', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'])(
    handler
  );
}

/**
 * Extract user info from request (for use in authenticated handlers)
 */
export function getUserFromRequest(req: NextApiRequest) {
  const authReq = req as AuthenticatedRequest;
  return {
    userId: authReq.userId,
    userEmail: authReq.userEmail,
    userRole: authReq.userRole,
  };
}

/**
 * Check if user has specific role
 */
export function hasRole(
  userRole: UserRole,
  requiredRoles: UserRole[]
): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
}

/**
 * Check if user is manager or higher
 */
export function isManager(userRole: UserRole): boolean {
  return ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);
}

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: UserRole): number {
  const roleLevels = {
    ANALYST: 1,
    SENIOR_ANALYST: 2,
    MANAGER: 3,
    ADMIN: 4,
    SUPER_ADMIN: 5,
  };

  return roleLevels[role] || 0;
}

/**
 * Check if user can access resource based on role hierarchy
 */
export function canAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}
