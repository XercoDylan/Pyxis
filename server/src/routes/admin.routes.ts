/**
 * Admin routes for member management.
 *
 * All routes require authentication (requireAuth) and admin privileges (adminOnly).
 *
 * GET    /api/admin/members       — List all members
 * POST   /api/admin/members       — Create a new member (generates token)
 * DELETE /api/admin/members/:id   — Remove a member
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { prisma } from '../config/database.js';
import { AppError, ErrorCode } from '../types/index.js';

export const adminRouter = Router();

// Apply auth + admin middleware to all admin routes
adminRouter.use(requireAuth);
adminRouter.use(adminOnly);

/**
 * Generates a short, readable access token (8 chars uppercase alphanumeric).
 */
function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (I, O, 0, 1)
  let token = '';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 8; i++) {
    token += chars[bytes[i] % chars.length];
  }
  return token;
}

/**
 * GET /api/admin/members
 * Returns all members with their tokens.
 */
adminRouter.get(
  '/api/admin/members',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const members = await prisma.member.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          major: true,
          grade: true,
          token: true,
          isAdmin: true,
          joinedAt: true,
          lastLoginAt: true,
        },
      });

      res.json({ members });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/admin/members
 * Creates a new member with an auto-generated token.
 * Body: { name: string, major?: string, grade?: string, isAdmin?: boolean }
 */
adminRouter.post(
  '/api/admin/members',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, major, grade, isAdmin } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          422,
          'Name is required',
          { name: ['Required'] }
        );
      }

      // Generate a unique token
      let token = generateToken();
      let existing = await prisma.member.findUnique({ where: { token } });
      while (existing) {
        token = generateToken();
        existing = await prisma.member.findUnique({ where: { token } });
      }

      const member = await prisma.member.create({
        data: {
          name: name.trim(),
          major: major?.trim() || '',
          grade: grade?.trim() || '',
          token,
          isAdmin: isAdmin === true,
        },
        select: {
          id: true,
          name: true,
          major: true,
          grade: true,
          token: true,
          isAdmin: true,
          joinedAt: true,
        },
      });

      res.status(201).json({ member });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/admin/members/:id
 * Removes a member.
 */
adminRouter.delete(
  '/api/admin/members/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await prisma.member.delete({
        where: { id },
      });

      res.json({ message: 'Member removed' });
    } catch (err) {
      next(err);
    }
  }
);

export default adminRouter;
