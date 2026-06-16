import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Mock external dependencies before importing the module
vi.mock('../config/database.js', () => ({
  prisma: {
    member: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../config/redis.js', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
  SESSION_TTL: 28800,
  SESSION_PREFIX: 'session:',
}));

import { authRouter } from './auth.routes.js';
import redis from '../config/redis.js';
import { ErrorCode } from '../types/index.js';

const mockRedis = redis as unknown as {
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

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
    body: {},
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
    delete process.env.DEV_BYPASS_AUTH;
  });

  describe('POST /auth/login', () => {
    it('should have a route registered for POST /auth/login', () => {
      const handlers = getRouteHandler('post', '/auth/login');
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
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out' });
    });

    it('returns success even without an active session cookie', async () => {
      const handlers = getRouteHandler('post', '/auth/logout');
      const handler = handlers![handlers!.length - 1].handle;

      const req = createMockRequest({ cookies: {} });
      const res = createMockResponse();
      const next = vi.fn();

      await handler(req, res, next);

      expect(redis.del).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out' });
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

      mockRedis.get.mockResolvedValue(null);

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
        name: 'John Doe',
        isAdmin: false,
        createdAt: Date.now(),
      };

      const req = createMockRequest({ cookies: { pyxis_session: 'valid-id' } });
      const res = createMockResponse();
      const next = vi.fn();

      mockRedis.get.mockResolvedValue(JSON.stringify(sessionData));

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        memberId: 'member-123',
        name: 'John Doe',
        isAdmin: false,
      });
    });
  });
});
