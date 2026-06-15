/**
 * Authentication middleware.
 * Validates the pyxis_session cookie against Redis.
 * - API routes (/api/*): returns 401 with AUTH_REQUIRED error code
 * - Non-API routes: returns 401 (handled client-side)
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode, SessionData } from '../types/index.js';
import { config } from '../config/index.js';
import redis, { SESSION_PREFIX } from '../config/redis.js';

/** Dev-mode fake session data */
const DEV_SESSION: SessionData = {
  memberId: 'dev-user-001',
  kerberos: 'DEVTOKEN',
  name: 'Dev Admin',
  isAdmin: true,
  createdAt: Date.now(),
};

/**
 * Augment Express Request to expose typed session data on `req.sessionData`.
 */
declare global {
  namespace Express {
    interface Request {
      sessionData?: SessionData;
    }
  }
}

/**
 * Middleware that requires a valid authenticated session.
 * Reads the pyxis_session cookie and validates it against Redis.
 * Attaches session data to `req.sessionData` for downstream handlers.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Dev bypass — skip auth entirely in local development
    if (process.env.DEV_BYPASS_AUTH === 'true' && config.nodeEnv !== 'production') {
      req.sessionData = DEV_SESSION;
      next();
      return;
    }

    const sessionId = req.cookies?.pyxis_session;

    if (!sessionId) {
      const error = new AppError(ErrorCode.AUTH_REQUIRED, 401, 'Authentication required');
      res.status(error.status).json(error.toResponse());
      return;
    }

    const raw = await redis.get(`${SESSION_PREFIX}${sessionId}`);

    if (!raw) {
      res.clearCookie('pyxis_session');
      const error = new AppError(ErrorCode.AUTH_REQUIRED, 401, 'Session expired');
      res.status(error.status).json(error.toResponse());
      return;
    }

    const session: SessionData = JSON.parse(raw);
    req.sessionData = session;
    next();
  } catch (err) {
    next(err);
  }
}
