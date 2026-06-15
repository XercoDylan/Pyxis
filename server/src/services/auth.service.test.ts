/**
 * Unit tests for the access list service (auth.service.ts).
 *
 * These tests mock Prisma and Redis to test the service logic in isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, ErrorCode } from '../types/index.js';

// Mock Prisma
const mockPrisma = {
  accessListEntry: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
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
const { checkMembership, addToAccessList, removeFromAccessList, bulkAdd } = await import(
  './auth.service.js'
);

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkMembership', () => {
    it('returns true when kerberos exists in access list', async () => {
      mockPrisma.accessListEntry.findUnique.mockResolvedValue({
        id: '1',
        kerberos: 'testuser@mit.edu',
      });

      const result = await checkMembership('testuser@mit.edu');
      expect(result).toBe(true);
      expect(mockPrisma.accessListEntry.findUnique).toHaveBeenCalledWith({
        where: { kerberos: 'testuser@mit.edu' },
      });
    });

    it('returns false when kerberos does not exist', async () => {
      mockPrisma.accessListEntry.findUnique.mockResolvedValue(null);

      const result = await checkMembership('unknown@mit.edu');
      expect(result).toBe(false);
    });
  });

  describe('addToAccessList', () => {
    it('adds a valid kerberos identifier', async () => {
      mockPrisma.accessListEntry.upsert.mockResolvedValue({
        id: '1',
        kerberos: 'newuser@mit.edu',
      });

      await addToAccessList('newuser@mit.edu', 'admin-id');

      expect(mockPrisma.accessListEntry.upsert).toHaveBeenCalledWith({
        where: { kerberos: 'newuser@mit.edu' },
        update: {},
        create: { kerberos: 'newuser@mit.edu', addedById: 'admin-id' },
      });
    });

    it('throws INVALID_KERBEROS for invalid format', async () => {
      await expect(addToAccessList('invalid-format')).rejects.toThrow(AppError);
      await expect(addToAccessList('invalid-format')).rejects.toMatchObject({
        code: ErrorCode.INVALID_KERBEROS,
        status: 422,
      });
    });

    it('handles duplicate gracefully via upsert', async () => {
      mockPrisma.accessListEntry.upsert.mockResolvedValue({
        id: '1',
        kerberos: 'existing@mit.edu',
      });

      // Should not throw
      await addToAccessList('existing@mit.edu');
      expect(mockPrisma.accessListEntry.upsert).toHaveBeenCalled();
    });
  });

  describe('removeFromAccessList', () => {
    it('removes entry and invalidates sessions', async () => {
      mockPrisma.accessListEntry.delete.mockResolvedValue({
        id: '1',
        kerberos: 'removed@mit.edu',
      });

      // Simulate Redis SCAN finding a matching session
      mockRedis.scan.mockResolvedValue(['0', ['session:abc123']]);
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ kerberos: 'removed@mit.edu', memberId: '1' })
      );
      mockRedis.del.mockResolvedValue(1);

      await removeFromAccessList('removed@mit.edu');

      expect(mockPrisma.accessListEntry.delete).toHaveBeenCalledWith({
        where: { kerberos: 'removed@mit.edu' },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('session:abc123');
    });

    it('does not delete sessions for other users', async () => {
      mockPrisma.accessListEntry.delete.mockResolvedValue({
        id: '1',
        kerberos: 'removed@mit.edu',
      });

      mockRedis.scan.mockResolvedValue(['0', ['session:xyz']]);
      mockRedis.get.mockResolvedValue(
        JSON.stringify({ kerberos: 'otheruser@mit.edu', memberId: '2' })
      );

      await removeFromAccessList('removed@mit.edu');

      // del should only be called for the delete operation on the access entry
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('bulkAdd', () => {
    it('parses comma-separated input', async () => {
      mockPrisma.accessListEntry.findUnique.mockResolvedValue(null);
      mockPrisma.accessListEntry.create.mockResolvedValue({});

      const result = await bulkAdd('alice@mit.edu,bob@mit.edu', 'admin-id');

      expect(result.added).toEqual(['alice@mit.edu', 'bob@mit.edu']);
      expect(result.duplicates).toEqual([]);
      expect(result.invalid).toEqual([]);
    });

    it('parses newline-separated input', async () => {
      mockPrisma.accessListEntry.findUnique.mockResolvedValue(null);
      mockPrisma.accessListEntry.create.mockResolvedValue({});

      const result = await bulkAdd('alice@mit.edu\nbob@mit.edu', 'admin-id');

      expect(result.added).toEqual(['alice@mit.edu', 'bob@mit.edu']);
    });

    it('parses mixed comma and newline input with extra whitespace', async () => {
      mockPrisma.accessListEntry.findUnique.mockResolvedValue(null);
      mockPrisma.accessListEntry.create.mockResolvedValue({});

      const result = await bulkAdd(' alice@mit.edu , bob@mit.edu\n carol@mit.edu ', 'admin-id');

      expect(result.added).toEqual(['alice@mit.edu', 'bob@mit.edu', 'carol@mit.edu']);
    });

    it('reports invalid kerberos identifiers', async () => {
      mockPrisma.accessListEntry.findUnique.mockResolvedValue(null);
      mockPrisma.accessListEntry.create.mockResolvedValue({});

      const result = await bulkAdd('alice@mit.edu,not-valid,bob@mit.edu');

      expect(result.added).toEqual(['alice@mit.edu', 'bob@mit.edu']);
      expect(result.invalid).toEqual(['not-valid']);
    });

    it('reports duplicates', async () => {
      mockPrisma.accessListEntry.findUnique
        .mockResolvedValueOnce({ id: '1', kerberos: 'alice@mit.edu' }) // already exists
        .mockResolvedValueOnce(null); // new entry
      mockPrisma.accessListEntry.create.mockResolvedValue({});

      const result = await bulkAdd('alice@mit.edu,bob@mit.edu');

      expect(result.added).toEqual(['bob@mit.edu']);
      expect(result.duplicates).toEqual(['alice@mit.edu']);
    });

    it('throws BATCH_TOO_LARGE when exceeding 50 entries', async () => {
      const entries = Array.from({ length: 51 }, (_, i) => `user${i}@mit.edu`).join(',');

      await expect(bulkAdd(entries)).rejects.toThrow(AppError);
      await expect(bulkAdd(entries)).rejects.toMatchObject({
        code: ErrorCode.BATCH_TOO_LARGE,
        status: 422,
      });
    });

    it('throws BATCH_TOO_LARGE for empty input (0 entries)', async () => {
      await expect(bulkAdd('')).rejects.toThrow(AppError);
      await expect(bulkAdd('')).rejects.toMatchObject({
        code: ErrorCode.BATCH_TOO_LARGE,
      });
    });
  });
});
