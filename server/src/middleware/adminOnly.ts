/**
 * Admin-only middleware.
 *
 * Restricts access to Academic Chair (admin) users.
 * Must be used after requireAuth middleware so that req.sessionData is populated.
 */

import type { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../types/index.js';

/**
 * Middleware that checks req.sessionData.isAdmin === true.
 * If not admin, throws a 403 ADMIN_REQUIRED error.
 */
export function adminOnly(req: Request, _res: Response, next: NextFunction): void {
  if (!req.sessionData?.isAdmin) {
    throw new AppError(
      ErrorCode.ADMIN_REQUIRED,
      403,
      'This action requires Academic Chair privileges'
    );
  }

  next();
}
