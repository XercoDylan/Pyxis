/**
 * Statistics and member profile routes.
 *
 * All routes require authentication (requireAuth).
 *
 * GET  /api/members/me              — Get current member profile with stats
 * GET  /api/stats/leaderboard       — Get contribution leaderboard
 * GET  /api/stats/members/:memberId — Get member's detailed contributions
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getLeaderboard,
  getMemberContributions,
  getMemberProfile,
} from '../services/stats.service.js';

export const statsRouter = Router();

// Apply auth middleware to all stats routes
statsRouter.use(requireAuth);

/**
 * GET /api/members/me
 * Returns the current authenticated member's profile with contribution stats.
 */
statsRouter.get(
  '/api/members/me',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = req.sessionData!.memberId;
      const profile = await getMemberProfile(memberId);

      if (!profile) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Member not found' },
        });
        return;
      }

      res.json({ member: profile });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/stats/leaderboard
 * Returns the contribution leaderboard sorted by totalFiles DESC, name ASC.
 * Only includes members with at least 1 upload.
 */
statsRouter.get(
  '/api/stats/leaderboard',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const leaderboard = await getLeaderboard();
      res.json({ leaderboard });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/stats/members/:memberId
 * Returns all files uploaded by a member, grouped by course.
 */
statsRouter.get(
  '/api/stats/members/:memberId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { memberId } = req.params;
      const contributions = await getMemberContributions(memberId);
      res.json({ contributions });
    } catch (err) {
      next(err);
    }
  }
);

export default statsRouter;
