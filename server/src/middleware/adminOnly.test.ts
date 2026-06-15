/**
 * Unit tests for adminOnly middleware.
 */

import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { adminOnly } from './adminOnly.js';
import { AppError, ErrorCode } from '../types/index.js';

function createMockRequest(sessionData?: { isAdmin: boolean }): Partial<Request> {
  return {
    sessionData: sessionData
      ? {
          memberId: 'member-1',
          kerberos: 'admin@mit.edu',
          name: 'Admin User',
          isAdmin: sessionData.isAdmin,
          createdAt: Date.now(),
        }
      : undefined,
  };
}

describe('adminOnly middleware', () => {
  it('calls next() when user is admin', () => {
    const req = createMockRequest({ isAdmin: true }) as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    adminOnly(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('throws ADMIN_REQUIRED when user is not admin', () => {
    const req = createMockRequest({ isAdmin: false }) as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    expect(() => adminOnly(req, res, next)).toThrow(AppError);
    expect(() => adminOnly(req, res, next)).toThrow(
      'This action requires Academic Chair privileges'
    );
  });

  it('throws ADMIN_REQUIRED with correct error code and status', () => {
    const req = createMockRequest({ isAdmin: false }) as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    try {
      adminOnly(req, res, next);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe(ErrorCode.ADMIN_REQUIRED);
      expect((err as AppError).status).toBe(403);
    }
  });

  it('throws ADMIN_REQUIRED when sessionData is undefined', () => {
    const req = createMockRequest(undefined) as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    expect(() => adminOnly(req, res, next)).toThrow(AppError);
  });
});
