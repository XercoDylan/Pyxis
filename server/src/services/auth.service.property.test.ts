import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: pyxis-course-materials, Property 1: Access list membership round-trip
 *
 * Validates: Requirements 1.2, 2.2
 *
 * For any valid Kerberos identifier, adding it to the access list and then
 * checking membership should return true.
 */

// In-memory store to simulate Prisma's access list table
let accessListStore: Map<string, { id: string; kerberos: string; addedAt: Date; addedById: string | null }>;
let idCounter = 0;

// Mock Prisma client
vi.mock('../config/database.js', () => {
  return {
    prisma: {
      accessListEntry: {
        findUnique: vi.fn(({ where }: { where: { kerberos: string } }) => {
          const entry = accessListStore.get(where.kerberos);
          return Promise.resolve(entry ?? null);
        }),
        upsert: vi.fn(({ where, create }: { where: { kerberos: string }; update: object; create: { kerberos: string; addedById: string | null } }) => {
          if (!accessListStore.has(where.kerberos)) {
            accessListStore.set(where.kerberos, {
              id: `test-id-${++idCounter}`,
              kerberos: create.kerberos,
              addedAt: new Date(),
              addedById: create.addedById,
            });
          }
          return Promise.resolve(accessListStore.get(where.kerberos));
        }),
      },
    },
  };
});

// Mock Redis to avoid real connections
vi.mock('../config/redis.js', () => {
  return {
    default: {
      scan: vi.fn(() => Promise.resolve(['0', []])),
      get: vi.fn(() => Promise.resolve(null)),
      del: vi.fn(() => Promise.resolve(1)),
    },
    SESSION_PREFIX: 'session:',
    SESSION_TTL: 28800,
  };
});

// Import after mocks are set up (vi.mock is hoisted)
import { addToAccessList, checkMembership } from './auth.service.js';

describe('Property 1: Access list membership round-trip', () => {
  beforeEach(() => {
    accessListStore = new Map();
    idCounter = 0;
  });

  /**
   * Generator for valid Kerberos strings:
   * - Starts with a lowercase letter [a-z]
   * - Followed by 0–7 characters from [a-z0-9_]
   * - Ends with @mit.edu
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

  it('adding a valid kerberos then checking membership returns true', async () => {
    await fc.assert(
      fc.asyncProperty(validKerberosArb, async (kerberos) => {
        // Clear store for each iteration to test independently
        accessListStore.clear();

        // Add to access list
        await addToAccessList(kerberos);

        // Check membership
        const isMember = await checkMembership(kerberos);

        expect(isMember).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
