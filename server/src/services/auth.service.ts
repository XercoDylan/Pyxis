/**
 * Access list service.
 *
 * Handles membership checks, adding/removing entries from the access list,
 * and bulk parsing with validation.
 */

import { prisma } from '../config/database.js';
import redis, { SESSION_PREFIX } from '../config/redis.js';
import { AppError, ErrorCode } from '../types/index.js';
import { isValidKerberos, isValidBulkAddCount } from '../validators/index.js';

/**
 * Checks whether a Kerberos identifier exists in the access list.
 */
export async function checkMembership(kerberos: string): Promise<boolean> {
  const entry = await prisma.accessListEntry.findUnique({
    where: { kerberos },
  });
  return entry !== null;
}

/**
 * Adds a single Kerberos identifier to the access list.
 * Silently ignores duplicates (Req 2.6).
 */
export async function addToAccessList(kerberos: string, addedById?: string): Promise<void> {
  if (!isValidKerberos(kerberos)) {
    throw new AppError(
      ErrorCode.INVALID_KERBEROS,
      422,
      `Invalid Kerberos identifier: ${kerberos}`
    );
  }

  // Use upsert to handle duplicates gracefully
  await prisma.accessListEntry.upsert({
    where: { kerberos },
    update: {}, // No-op on duplicate
    create: {
      kerberos,
      addedById: addedById ?? null,
    },
  });
}

/**
 * Removes a Kerberos identifier from the access list and invalidates
 * any active sessions for that user (Req 2.3).
 */
export async function removeFromAccessList(kerberos: string): Promise<void> {
  // Delete the access list entry (will throw if not found)
  await prisma.accessListEntry.delete({
    where: { kerberos },
  });

  // Invalidate active sessions for the removed kerberos via Redis SCAN
  await invalidateSessionsForKerberos(kerberos);
}

/**
 * Parses comma/newline-separated input, validates each entry, and adds
 * valid entries to the access list. Returns a summary of results.
 *
 * Max 50 identifiers per operation.
 */
export async function bulkAdd(
  input: string,
  addedById?: string
): Promise<{ added: string[]; duplicates: string[]; invalid: string[] }> {
  // Split by commas and/or newlines, trim each entry, filter empties
  const entries = input
    .split(/[,\n]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (!isValidBulkAddCount(entries.length)) {
    throw new AppError(
      ErrorCode.BATCH_TOO_LARGE,
      422,
      'Maximum 50 identifiers per bulk operation'
    );
  }

  const added: string[] = [];
  const duplicates: string[] = [];
  const invalid: string[] = [];

  for (const kerberos of entries) {
    if (!isValidKerberos(kerberos)) {
      invalid.push(kerberos);
      continue;
    }

    // Check if already exists
    const existing = await prisma.accessListEntry.findUnique({
      where: { kerberos },
    });

    if (existing) {
      duplicates.push(kerberos);
      continue;
    }

    await prisma.accessListEntry.create({
      data: {
        kerberos,
        addedById: addedById ?? null,
      },
    });

    added.push(kerberos);
  }

  return { added, duplicates, invalid };
}

/**
 * Scans Redis for sessions belonging to the given kerberos and deletes them.
 * Uses SCAN to avoid blocking Redis with KEYS command.
 */
async function invalidateSessionsForKerberos(kerberos: string): Promise<void> {
  let cursor = '0';

  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      'MATCH',
      `${SESSION_PREFIX}*`,
      'COUNT',
      100
    );

    cursor = nextCursor;

    for (const key of keys) {
      const raw = await redis.get(key);
      if (raw) {
        try {
          const sessionData = JSON.parse(raw);
          if (sessionData.kerberos === kerberos) {
            await redis.del(key);
          }
        } catch {
          // Skip malformed session data
        }
      }
    }
  } while (cursor !== '0');
}
