import type { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../types/index.js';
import type { ApiErrorBody } from '../types/index.js';

/**
 * Centralized error handling middleware.
 *
 * Catches all errors thrown or passed via next(err) in route handlers and
 * services, and returns a consistent JSON error response matching the
 * ApiError format from the design.
 *
 * - AppError instances are serialized directly using their code, status, and details.
 * - Unknown errors are logged and returned as a generic 500 INTERNAL_ERROR.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.status).json(err.toResponse());
    return;
  }

  // Log unexpected errors for debugging (do not expose internals to client)
  console.error('[Unhandled Error]', err);

  const body: ApiErrorBody = {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Something went wrong. Please try again later.',
    },
  };

  res.status(500).json(body);
}
