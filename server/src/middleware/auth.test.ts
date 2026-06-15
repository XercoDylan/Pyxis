import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireAuth } from './auth.js';
import { ErrorCode } from '../types/index.js';

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    session: {},
    path: '/api/test',
    ...overrides,
  } as unknown as Request;
}

function createMockResponse(): Response & { _status: number; _json: any; _redirect: string } {
  const res = {
    _status: 0,
    _json: null,
    _redirect: '',
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: any) {
      res._json = data;
      return res;
    },
    redirect(url: string) {
      res._redirect = url;
      return res;
    },
  };
  return res as any;
}

describe('requireAuth middleware', () => {
  it('should call next and attach sessionData when session is valid', () => {
    const req = createMockRequest({
      session: {
        memberId: 'member-123',
        kerberos: 'jdoe',
        name: 'John Doe',
        isAdmin: false,
        createdAt: 1700000000,
      } as any,
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res as any, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.sessionData).toEqual({
      memberId: 'member-123',
      kerberos: 'jdoe',
      name: 'John Doe',
      isAdmin: false,
      createdAt: 1700000000,
    });
  });

  it('should return 401 AUTH_REQUIRED for API routes with no session', () => {
    const req = createMockRequest({
      session: {} as any,
      path: '/api/courses',
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._json.error.code).toBe(ErrorCode.AUTH_REQUIRED);
    expect(res._json.error.message).toBe('Authentication required');
  });

  it('should redirect to /auth/login for page routes with no session', () => {
    const req = createMockRequest({
      session: {} as any,
      path: '/courses/123',
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._redirect).toBe('/auth/login');
  });

  it('should return 401 for API routes when session exists but memberId is missing', () => {
    const req = createMockRequest({
      session: { kerberos: 'jdoe' } as any,
      path: '/api/files',
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  it('should redirect page routes when session has no memberId', () => {
    const req = createMockRequest({
      session: { kerberos: 'jdoe' } as any,
      path: '/profile',
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._redirect).toBe('/auth/login');
  });

  it('should correctly identify /api/ prefix as API route', () => {
    const req = createMockRequest({
      session: {} as any,
      path: '/api/admin/access-list',
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res as any, next);

    expect(res._status).toBe(401);
  });

  it('should correctly identify non-/api/ paths as page routes', () => {
    const req = createMockRequest({
      session: {} as any,
      path: '/stats',
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res as any, next);

    expect(res._redirect).toBe('/auth/login');
  });

  it('should attach isAdmin=true when session has admin flag', () => {
    const req = createMockRequest({
      session: {
        memberId: 'admin-1',
        kerberos: 'admin',
        name: 'Admin User',
        isAdmin: true,
        createdAt: 1700000000,
      } as any,
    });
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res as any, next);

    expect(next).toHaveBeenCalled();
    expect(req.sessionData?.isAdmin).toBe(true);
  });
});
