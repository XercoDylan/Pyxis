/**
 * Express session middleware configured with Redis store.
 * Sessions expire after 8 hours (28800 seconds).
 */

import session from 'express-session';
import RedisStore from 'connect-redis';
import { redis, SESSION_TTL } from '../config/redis.js';
import { config } from '../config/index.js';

export const sessionMiddleware = session({
  store: new RedisStore({
    client: redis,
    prefix: 'session:',
    ttl: SESSION_TTL,
  }),
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    maxAge: SESSION_TTL * 1000, // Convert seconds to milliseconds
    sameSite: 'lax',
  },
});
