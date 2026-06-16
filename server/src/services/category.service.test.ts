/**
 * Unit tests for the category service (category.service.ts).
 *
 * Tests mock Prisma to validate service logic in isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, ErrorCode } from '../types/index.js';

// Mock Prisma
const mockPrisma = {
  category: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock('../config/database.js', () => ({
  prisma: mockPrisma,
}));

// Import after mocks are set up
const { listCategories, createCategory } = await import('./category.service.js');

describe('category.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCategories', () => {
    it('returns categories sorted alphabetically by name', async () => {
      const mockCategories = [
        { id: '1', name: 'Exams', isDefault: true, createdAt: new Date() },
        { id: '2', name: 'Lectures', isDefault: true, createdAt: new Date() },
        { id: '3', name: 'Problem_Sets', isDefault: true, createdAt: new Date() },
      ];
      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await listCategories('course-123');

      expect(result).toEqual(mockCategories);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { yearFolderId: 'course-123' },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          isDefault: true,
          createdAt: true,
        },
      });
    });

    it('returns empty array when course has no categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);

      const result = await listCategories('empty-course');

      expect(result).toEqual([]);
    });
  });

  describe('createCategory', () => {
    it('creates a category with valid name', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Quizzes',
        isDefault: false,
        createdAt: new Date(),
      };
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(mockCategory);

      const result = await createCategory('course-123', 'Quizzes');

      expect(result).toEqual(mockCategory);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          yearFolderId: 'course-123',
          name: 'Quizzes',
          isDefault: false,
        },
        select: {
          id: true,
          name: true,
          isDefault: true,
          createdAt: true,
        },
      });
    });

    it('throws VALIDATION_ERROR for empty name', async () => {
      await expect(createCategory('course-123', '')).rejects.toThrow(AppError);
      await expect(createCategory('course-123', '')).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_ERROR,
        status: 422,
      });
    });

    it('throws VALIDATION_ERROR for name exceeding 50 characters', async () => {
      const longName = 'a'.repeat(51);

      await expect(createCategory('course-123', longName)).rejects.toThrow(AppError);
      await expect(createCategory('course-123', longName)).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_ERROR,
        status: 422,
      });
    });

    it('throws CATEGORY_EXISTS for duplicate name within same course', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'existing-cat',
        name: 'Exams',
        courseId: 'course-123',
      });

      await expect(createCategory('course-123', 'Exams')).rejects.toThrow(AppError);
      await expect(createCategory('course-123', 'Exams')).rejects.toMatchObject({
        code: ErrorCode.CATEGORY_EXISTS,
        status: 409,
      });
    });

    it('checks uniqueness with the correct compound key', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({
        id: 'new-cat',
        name: 'Notes',
        isDefault: false,
        createdAt: new Date(),
      });

      await createCategory('course-456', 'Notes');

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: {
          yearFolderId_name: { yearFolderId: 'course-456', name: 'Notes' },
        },
      });
    });

    it('accepts a name at exactly 50 characters', async () => {
      const name50 = 'a'.repeat(50);
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({
        id: 'cat-50',
        name: name50,
        isDefault: false,
        createdAt: new Date(),
      });

      const result = await createCategory('course-123', name50);

      expect(result.name).toBe(name50);
    });
  });
});
