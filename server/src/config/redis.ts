/**
 * Redis client singleton using ioredis.
 * Used for session storage with TTL-based expiry.
 */

import Redis from 'ioredis';
import { config } from './index.js';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
    lazyConnect: true,
  });

if (config.nodeEnv !== 'production') {
  globalForRedis.redis = redis;
}

/**
 * Session data stored in Redis.
 * Key format: session:{sessionId}
 * TTL: 28800 seconds (8 hours)
 */
export interface SessionData {
  memberId: string;
  kerberos: string;
  name: string;
  isAdmin: boolean;
  createdAt: number; // Unix timestamp
}

export const SESSION_TTL = config.session.ttlSeconds;
export const SESSION_PREFIX = 'session:';

export default redis;
