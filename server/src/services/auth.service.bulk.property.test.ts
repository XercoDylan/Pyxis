/**
 * Feature: pyxis-course-materials, Property 3: Bulk access list parsing
 *
 * Validates: Requirements 2.4
 *
 * For any list of valid Kerberos identifiers (up to 50) separated by commas,
 * newlines, or a mix of both, parsing and adding them should result in all
 * identifiers being present in the access list (in the `added` result array).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { randomUUID } from 'node:crypto';

// In-memory store for access list entries
let inMemoryStore: Map<string, { id: string; kerberos: string; addedById: string | null }>;

// Mock Prisma
const mockPrisma = {
  accessListEntry: {
    findUnique: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock('../config/database.js', () => ({
  prisma: mockPrisma,
}));

// Mock Redis
const mockRedis = {
  scan: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
};

vi.mock('../config/redis.js', () => ({
  default: mockRedis,
  redis: mockRedis,
  SESSION_PREFIX: 'session:',
}));

// Import after mocks are set up
const { bulkAdd } = await import('./auth.service.js');

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
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_'.split('')),
      { minLength: 0, maxLength: 7 }
    )
  )
  .map(([first, rest]) => `${first}${rest.join('')}@mit.edu`);

/**
 * Generator for a unique set of 1–50 valid Kerberos identifiers.
 */
const uniqueKerberosListArb = fc
  .uniqueArray(validKerberosArb, { minLength: 1, maxLength: 50 });

/**
 * Generator for a separator: comma, newline, or a mix.
 */
const separatorArb = fc.constantFrom(',', '\n', ',\n', '\n,');

function setupMocks() {
  mockPrisma.accessListEntry.findUnique.mockImplementation(
    async ({ where }: { where: { kerberos: string } }) => {
      return inMemoryStore.get(where.kerberos) ?? null;
    }
  );

  mockPrisma.accessListEntry.create.mockImplementation(
    async ({ data }: { data: { kerberos: string; addedById: string | null } }) => {
      const entry = { id: randomUUID(), kerberos: data.kerberos, addedById: data.addedById };
      inMemoryStore.set(data.kerberos, entry);
      return entry;
    }
  );
}

describe('Property 3: Bulk access list parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inMemoryStore = new Map();
    setupMocks();
  });

  it('all valid kerberos IDs joined by commas/newlines end up in the added result array', async () => {
    await fc.assert(
      fc.asyncProperty(
        uniqueKerberosListArb,
        separatorArb,
        async (kerberosList, separator) => {
          // Reset store for each property run
          inMemoryStore.clear();
          vi.clearAllMocks();
          setupMocks();

          // Join kerberos IDs with the separator
          const input = kerberosList.join(separator);

          // Call bulkAdd
          const result = await bulkAdd(input);

          // All generated kerberos should be in the added array
          expect(result.added.sort()).toEqual([...kerberosList].sort());

          // No duplicates or invalid entries
          expect(result.duplicates).toEqual([]);
          expect(result.invalid).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
