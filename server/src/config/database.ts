/**
 * Prisma client singleton.
 * Ensures a single database connection pool is shared across the application.
 */

import { PrismaClient } from '@prisma/client';
import { config } from './index.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: config.databaseUrl,
    log: config.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (config.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
