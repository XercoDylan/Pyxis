/**
 * Unit tests for file.service.ts
 *
 * Tests presigned URL generation, upload confirmation, file listing,
 * and batch validation logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, ErrorCode } from '../types/index.js';

// Mock the Prisma client
vi.mock('../config/database.js', () => {
  const mockPrisma = {
    file: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };
  return { default: mockPrisma, prisma: mockPrisma };
});

// Mock the S3 presigned URL generation — include all exports from the real module
vi.mock('../config/s3.js', () => ({
  generatePresignedUploadUrl: vi.fn().mockResolvedValue('https://s3.example.com/presigned-put-url'),
  generatePresignedDownloadUrl: vi.fn().mockResolvedValue('https://s3.example.com/presigned-get-url'),
  PRESIGNED_UPLOAD_EXPIRY: 900,
  PRESIGNED_DOWNLOAD_EXPIRY: 3600,
  BUCKET_NAME: 'test-bucket',
  s3Client: {},
  default: {},
}));

import prisma from '../config/database.js';
import { generatePresignedUploadUrl } from '../config/s3.js';
import {
  generateUploadUrl,
  confirmUpload,
  listFiles,
  validateBatchSize,
} from './file.service.js';

const mockPrisma = prisma as unknown as {
  file: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
};

const mockGeneratePresignedUploadUrl = generatePresignedUploadUrl as ReturnType<typeof vi.fn>;

describe('file.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateUploadUrl', () => {
    it('returns uploadUrl, fileId, and s3Key for valid file', async () => {
      const result = await generateUploadUrl(
        'notes.pdf',
        'application/pdf',
        1024,
        'category-123'
      );

      expect(result.uploadUrl).toBe('https://s3.example.com/presigned-put-url');
      expect(result.fileId).toBeTruthy();
      expect(result.s3Key).toContain('uploads/category-123/');
      expect(result.s3Key).toContain('/notes.pdf');
    });

    it('calls generatePresignedUploadUrl with correct s3Key, contentType, fileSize', async () => {
      await generateUploadUrl(
        'notes.pdf',
        'application/pdf',
        2048,
        'cat-abc'
      );

      expect(mockGeneratePresignedUploadUrl).toHaveBeenCalledWith(
        expect.stringContaining('uploads/cat-abc/'),
        'application/pdf',
        2048
      );
    });

    it('throws FILE_TOO_LARGE (413) when file exceeds 50 MB', async () => {
      const oversizedFile = 52_428_801; // 1 byte over limit

      await expect(
        generateUploadUrl('big.zip', 'application/zip', oversizedFile, 'cat-1')
      ).rejects.toMatchObject({
        code: ErrorCode.FILE_TOO_LARGE,
        status: 413,
      });
    });

    it('accepts file exactly at the 50 MB limit', async () => {
      const exactLimit = 52_428_800;

      const result = await generateUploadUrl(
        'exactly50.bin',
        'application/octet-stream',
        exactLimit,
        'cat-1'
      );

      expect(result.uploadUrl).toBe('https://s3.example.com/presigned-put-url');
    });

    it('throws FILE_TOO_LARGE for negative file size', async () => {
      await expect(
        generateUploadUrl('bad.txt', 'text/plain', -1, 'cat-1')
      ).rejects.toMatchObject({
        code: ErrorCode.FILE_TOO_LARGE,
        status: 413,
      });
    });

    it('generates S3 key with format uploads/{categoryId}/{uuid}/{filename}', async () => {
      const result = await generateUploadUrl(
        'exam1.pdf',
        'application/pdf',
        5000,
        'my-category-id'
      );

      // S3 key format: uploads/{categoryId}/{uuid}/{filename}
      const parts = result.s3Key.split('/');
      expect(parts[0]).toBe('uploads');
      expect(parts[1]).toBe('my-category-id');
      expect(parts[2]).toBeTruthy(); // uuid
      expect(parts[3]).toBe('exam1.pdf');
    });
  });

  describe('confirmUpload', () => {
    it('creates a file record in the database', async () => {
      const mockFile = {
        id: 'file-id',
        filename: 'notes.pdf',
        s3Key: 'uploads/cat-1/file-id/notes.pdf',
        contentType: 'application/pdf',
        fileSize: BigInt(2048),
        categoryId: 'cat-1',
        uploadedById: 'user-1',
        uploadedAt: new Date('2024-01-15'),
        uploadedBy: { name: 'Test User', kerberos: 'testuser' },
      };
      mockPrisma.file.create.mockResolvedValue(mockFile);

      const result = await confirmUpload(
        'file-id',
        'notes.pdf',
        'uploads/cat-1/file-id/notes.pdf',
        'application/pdf',
        2048,
        'cat-1',
        'user-1'
      );

      expect(result.fileSize).toBe(2048);
      expect(result.filename).toBe('notes.pdf');
      expect(mockPrisma.file.create).toHaveBeenCalledWith({
        data: {
          id: 'file-id',
          filename: 'notes.pdf',
          s3Key: 'uploads/cat-1/file-id/notes.pdf',
          contentType: 'application/pdf',
          fileSize: BigInt(2048),
          categoryId: 'cat-1',
          uploadedById: 'user-1',
        },
        include: {
          uploadedBy: {
            select: { name: true },
          },
        },
      });
    });

    it('converts BigInt fileSize to Number in the response', async () => {
      const mockFile = {
        id: 'file-id',
        filename: 'test.txt',
        s3Key: 'uploads/cat/file-id/test.txt',
        contentType: 'text/plain',
        fileSize: BigInt(999999),
        categoryId: 'cat',
        uploadedById: 'user-1',
        uploadedAt: new Date(),
        uploadedBy: { name: 'User', kerberos: 'user' },
      };
      mockPrisma.file.create.mockResolvedValue(mockFile);

      const result = await confirmUpload(
        'file-id', 'test.txt', 'uploads/cat/file-id/test.txt',
        'text/plain', 999999, 'cat', 'user-1'
      );

      expect(typeof result.fileSize).toBe('number');
      expect(result.fileSize).toBe(999999);
    });
  });

  describe('listFiles', () => {
    it('returns paginated files with fileSize converted to number', async () => {
      const mockFiles = [
        {
          id: '1',
          filename: 'exam2.pdf',
          fileSize: BigInt(1000),
          uploadedAt: new Date('2024-01-15'),
          uploadedBy: { name: 'User', kerberos: 'user' },
          categoryId: 'cat-1',
          uploadedById: 'user-1',
          s3Key: 'uploads/cat-1/1/exam2.pdf',
          contentType: 'application/pdf',
        },
      ];
      mockPrisma.file.findMany.mockResolvedValue(mockFiles);
      mockPrisma.file.count.mockResolvedValue(1);

      const result = await listFiles('cat-1', 1, 50);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].fileSize).toBe(1000);
      expect(result.totalCount).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.pageSize).toBe(50);
    });

    it('calculates pagination correctly', async () => {
      mockPrisma.file.findMany.mockResolvedValue([]);
      mockPrisma.file.count.mockResolvedValue(120);

      const result = await listFiles('cat-1', 2, 50);

      expect(result.totalPages).toBe(3); // ceil(120/50) = 3
      expect(result.currentPage).toBe(2);
      expect(mockPrisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50, // (2-1) * 50
          take: 50,
        })
      );
    });

    it('applies correct ordering', async () => {
      mockPrisma.file.findMany.mockResolvedValue([]);
      mockPrisma.file.count.mockResolvedValue(0);

      await listFiles('cat-1');

      expect(mockPrisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ uploadedAt: 'desc' }, { filename: 'asc' }],
        })
      );
    });
  });

  describe('validateBatchSize', () => {
    it('does not throw for valid batch sizes (1-10)', () => {
      expect(() => validateBatchSize(1)).not.toThrow();
      expect(() => validateBatchSize(5)).not.toThrow();
      expect(() => validateBatchSize(10)).not.toThrow();
    });

    it('throws BATCH_TOO_LARGE for more than 10 files', () => {
      expect(() => validateBatchSize(11)).toThrow(AppError);
      try {
        validateBatchSize(11);
      } catch (err) {
        const appErr = err as AppError;
        expect(appErr.code).toBe(ErrorCode.BATCH_TOO_LARGE);
        expect(appErr.status).toBe(422);
      }
    });

    it('throws BATCH_TOO_LARGE for zero files', () => {
      expect(() => validateBatchSize(0)).toThrow(AppError);
    });
  });
});
