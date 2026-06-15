import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Mock external dependencies before importing the module
vi.mock('../config/saml.js', () => ({
  passport: {
    authenticate: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
    initialize: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
  },
}));

vi.mock('../config/database.js', () => ({
  prisma: {
    accessListEntry: {
      findUnique: vi.fn(),
    },
    member: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../config/redis.js', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
  redis: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
  SESSION_TTL: 28800,
  SESSION_PREFIX: 'session:',
}));

import { authRouter } from './auth.routes.js';
import { prisma } from '../config/database.js';
import redis from '../config/redis.js';
import { ErrorCode } from '../types/index.js';

// Helper to find route handlers registered on the router
function getRouteHandler(method: string, path: string) {
  const layer = (authRouter as any).stack.find(
    (l: any) => l.route?.path === path && l.route?.methods[method]
  );
  return layer?.route?.stack;
}

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    cookies: {},
    user: undefined,
    ...overrides,
  } as unknown as Request;
}

function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('auth.routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /auth/login', () => {
    it('should have a route registered for GET /auth/login', () => {
      const handlers = getRouteHandler('get', '/auth/login');
      expect(handlers).toBeDefined();
      expect(handlers!.length).toBeGreaterThan(0);
    });
  });

  describe('POST /auth/callback', () => {
    it('should have a route registered for POST /auth/callback', () => {
      const handlers = getRouteHandler('post', '/auth/callback');
      expect(handlers).toBeDefined();
      expect(handlers!.length).toBeGreaterThan(0);
    });
  });

  describe('POST /auth/logout', () => {
    it('deletes session from Redis and clears cookie', async () => {
      const handlers = getRouteHandler('post', '/auth/logout');
      const handler = handlers![handlers!.length - 1].handle;

      const req = createMockRequest({ cookies: { pyxis_session: 'test-session-id' } });
      const res = createMockResponse();
      const next = vi.fn();

      (redis.del as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      await handler(req, res, next);

      expect(redis.del).toHaveBeenCalledWith('session:test-session-id');
      expect(res.clearCookie).toHaveBeenCalledWith('pyxis_session');
      expect(res.redirect).toHaveBeenCalledWith('/');
    });

    it('redirects home even without an active session cookie', async () => {
      const handlers = getRouteHandler('post', '/auth/logout');
      const handler = handlers![handlers!.length - 1].handle;

      const req = createMockRequest({ cookies: {} });
      const res = createMockResponse();
      const next = vi.fn();

      await handler(req, res, next);

      expect(redis.del).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('GET /auth/session', () => {
    it('returns 401 when no session cookie is present', async () => {
      const handlers = getRouteHandler('get', '/auth/session');
      const handler = handlers![handlers!.length - 1].handle;

      const req = createMockRequest({ cookies: {} });
      const res = createMockResponse();
      const next = vi.fn();

      await handler(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.code).toBe(ErrorCode.AUTH_REQUIRED);
      expect(error.status).toBe(401);
    });

    it('returns 401 when session is expired (not in Redis)', async () => {
      const handlers = getRouteHandler('get', '/auth/session');
      const handler = handlers![handlers!.length - 1].handle;

      const req = createMockRequest({ cookies: { pyxis_session: 'expired-id' } });
      const res = createMockResponse();
      const next = vi.fn();

      (redis.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await handler(req, res, next);

      expect(res.clearCookie).toHaveBeenCalledWith('pyxis_session');
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.code).toBe(ErrorCode.AUTH_REQUIRED);
    });

    it('returns session data for a valid session', async () => {
      const handlers = getRouteHandler('get', '/auth/session');
      const handler = handlers![handlers!.length - 1].handle;

      const sessionData = {
        memberId: 'member-123',
        kerberos: 'jdoe@mit.edu',
        name: 'John Doe',
        isAdmin: false,
        createdAt: Date.now(),
      };

      const req = createMockRequest({ cookies: { pyxis_session: 'valid-id' } });
      const res = createMockResponse();
      const next = vi.fn();

      (redis.get as ReturnType<typeof vi.fn>).mockResolvedValue(JSON.stringify(sessionData));

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        memberId: 'member-123',
        kerberos: 'jdoe@mit.edu',
        name: 'John Doe',
        isAdmin: false,
      });
    });
  });
});
