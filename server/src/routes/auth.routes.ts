/**
 * Authentication routes — token-based login.
 *
 * POST /auth/login    — Authenticate with a pre-assigned token
 * POST /auth/logout   — Destroy session
 * GET  /auth/session  — Return current session data or 401
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../config/database.js';
import redis, { SESSION_TTL, SESSION_PREFIX } from '../config/redis.js';
import { AppError, ErrorCode } from '../types/index.js';
import type { SessionData } from '../types/index.js';

export const authRouter = Router();

/**
 * POST /auth/login
 * Authenticates a user by their pre-assigned token.
 * Body: { token: string }
 */
authRouter.post('/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        422,
        'Token is required'
      );
    }

    // Look up member by token
    const member = await prisma.member.findUnique({
      where: { token: token.trim() },
    });

    if (!member) {
      throw new AppError(
        ErrorCode.ACCESS_DENIED,
        403,
        'Invalid token. Please check your access token and try again.'
      );
    }

    // Update last login
    await prisma.member.update({
      where: { id: member.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session in Redis
    const sessionId = randomUUID();
    const sessionData: SessionData = {
      memberId: member.id,
      kerberos: member.token, // Using token field as identifier
      name: member.name,
      isAdmin: member.isAdmin,
      createdAt: Date.now(),
    };

    await redis.set(
      `${SESSION_PREFIX}${sessionId}`,
      JSON.stringify(sessionData),
      'EX',
      SESSION_TTL
    );

    // Set session cookie
    res.cookie('pyxis_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_TTL * 1000,
      sameSite: 'lax',
    });

    res.json({
      memberId: member.id,
      name: member.name,
      isAdmin: member.isAdmin,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/logout
 * Destroys the current session.
 */
authRouter.post('/auth/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.cookies?.pyxis_session;

    if (sessionId) {
      await redis.del(`${SESSION_PREFIX}${sessionId}`);
      res.clearCookie('pyxis_session');
    }

    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /auth/session
 * Returns the current session data or 401 if not authenticated.
 */
authRouter.get('/auth/session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Dev bypass
    if (process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
      res.json({
        memberId: 'dev-user-001',
        name: 'Dev User',
        isAdmin: true,
      });
      return;
    }

    const sessionId = req.cookies?.pyxis_session;

    if (!sessionId) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 401, 'Authentication required');
    }

    const raw = await redis.get(`${SESSION_PREFIX}${sessionId}`);

    if (!raw) {
      res.clearCookie('pyxis_session');
      throw new AppError(ErrorCode.AUTH_REQUIRED, 401, 'Session expired');
    }

    const session: SessionData = JSON.parse(raw);

    res.json({
      memberId: session.memberId,
      name: session.name,
      isAdmin: session.isAdmin,
    });
  } catch (err) {
    next(err);
  }
});

export default authRouter;
