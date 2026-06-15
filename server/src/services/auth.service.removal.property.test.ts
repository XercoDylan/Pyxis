import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: pyxis-course-materials, Property 2: Access list removal revokes membership
 *
 * Validates: Requirements 2.3
 *
 * For any valid Kerberos identifier, adding it to the access list then removing it
 * then checking membership should return false.
 */

// In-memory store for access list entries
let accessListStore: Set<string>;

// Mock Prisma
vi.mock('../config/database.js', () => {
  return {
    prisma: {
      accessListEntry: {
        findUnique: vi.fn(({ where }: { where: { kerberos: string } }) => {
          if (accessListStore.has(where.kerberos)) {
            return Promise.resolve({ id: 'test-id', kerberos: where.kerberos, addedAt: new Date(), addedById: null });
          }
          return Promise.resolve(null);
        }),
        upsert: vi.fn(({ where, create }: { where: { kerberos: string }; update: object; create: { kerberos: string; addedById: string | null } }) => {
          accessListStore.add(create.kerberos);
          return Promise.resolve({ id: 'test-id', kerberos: create.kerberos, addedAt: new Date(), addedById: null });
        }),
        delete: vi.fn(({ where }: { where: { kerberos: string } }) => {
          if (!accessListStore.has(where.kerberos)) {
            return Promise.reject(new Error('Record not found'));
          }
          accessListStore.delete(where.kerberos);
          return Promise.resolve({ id: 'test-id', kerberos: where.kerberos, addedAt: new Date(), addedById: null });
        }),
      },
    },
  };
});

// Mock Redis (no-op for session invalidation)
vi.mock('../config/redis.js', () => {
  return {
    default: {
      scan: vi.fn(() => Promise.resolve(['0', []])),
      get: vi.fn(() => Promise.resolve(null)),
      del: vi.fn(() => Promise.resolve(1)),
    },
    redis: {
      scan: vi.fn(() => Promise.resolve(['0', []])),
      get: vi.fn(() => Promise.resolve(null)),
      del: vi.fn(() => Promise.resolve(1)),
    },
    SESSION_PREFIX: 'session:',
    SESSION_TTL: 28800,
  };
});

describe('Property 2: Access list removal revokes membership', () => {
  beforeEach(() => {
    accessListStore = new Set();
  });

  /**
   * Generator for valid Kerberos strings matching `^[a-z][a-z0-9_]{0,7}@mit.edu$`
   */
  const validKerberosArb = fc
    .tuple(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
      fc.array(
        fc.constantFrom(
          ...'abcdefghijklmnopqrstuvwxyz0123456789_'.split('')
        ),
        { minLength: 0, maxLength: 7 }
      )
    )
    .map(([first, rest]) => `${first}${rest.join('')}@mit.edu`);

  it('adding then removing a kerberos then checking membership should return false', async () => {
    const { addToAccessList, removeFromAccessList, checkMembership } = await import('./auth.service.js');

    await fc.assert(
      fc.asyncProperty(validKerberosArb, async (kerberos) => {
        // Reset store for each iteration
        accessListStore.clear();

        // 1. Add the kerberos to the access list
        await addToAccessList(kerberos);
        // Confirm it was added
        expect(accessListStore.has(kerberos)).toBe(true);

        // 2. Remove the kerberos from the access list
        await removeFromAccessList(kerberos);

        // 3. Check membership — should be false
        const isMember = await checkMembership(kerberos);
        expect(isMember).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
