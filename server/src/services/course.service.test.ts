/**
 * Unit tests for course.service.ts
 *
 * Tests the validation logic and error handling in the course service.
 * Database interactions are mocked via Prisma mock.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, ErrorCode } from '../types/index.js';

// Mock the Prisma client
vi.mock('../config/database.js', () => {
  const mockPrisma = {
    course: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
  return { default: mockPrisma, prisma: mockPrisma };
});

import prisma from '../config/database.js';
import {
  listCourses,
  searchCourses,
  createCourse,
  getCourseWithCategories,
} from './course.service.js';

const mockPrisma = prisma as unknown as {
  course: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

describe('course.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCourses', () => {
    it('returns courses sorted by courseNumber ascending', async () => {
      const mockCourses = [
        { id: '1', courseNumber: '6.042', courseName: 'Math for CS' },
        { id: '2', courseNumber: '18.06', courseName: 'Linear Algebra' },
      ];
      mockPrisma.course.findMany.mockResolvedValue(mockCourses);

      const result = await listCourses();

      expect(result).toEqual(mockCourses);
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        orderBy: { courseNumber: 'asc' },
        include: {
          createdBy: {
            select: { name: true },
          },
        },
      });
    });
  });

  describe('searchCourses', () => {
    it('queries with case-insensitive substring match on courseNumber and courseName', async () => {
      mockPrisma.course.findMany.mockResolvedValue([]);

      await searchCourses('math');

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { courseNumber: { contains: 'math', mode: 'insensitive' } },
            { courseName: { contains: 'math', mode: 'insensitive' } },
          ],
        },
        orderBy: { courseNumber: 'asc' },
        include: {
          createdBy: {
            select: { name: true },
          },
        },
      });
    });
  });

  describe('createCourse', () => {
    it('throws VALIDATION_ERROR for empty courseNumber', async () => {
      await expect(createCourse('', 'Valid Name', 'user-id'))
        .rejects
        .toMatchObject({
          code: ErrorCode.VALIDATION_ERROR,
          status: 422,
        });
    });

    it('throws VALIDATION_ERROR for courseNumber exceeding 20 characters', async () => {
      const longNumber = 'a'.repeat(21);
      await expect(createCourse(longNumber, 'Valid Name', 'user-id'))
        .rejects
        .toMatchObject({
          code: ErrorCode.VALIDATION_ERROR,
          status: 422,
        });
    });

    it('throws VALIDATION_ERROR for empty courseName', async () => {
      await expect(createCourse('6.042', '', 'user-id'))
        .rejects
        .toMatchObject({
          code: ErrorCode.VALIDATION_ERROR,
          status: 422,
        });
    });

    it('throws VALIDATION_ERROR for courseName exceeding 100 characters', async () => {
      const longName = 'a'.repeat(101);
      await expect(createCourse('6.042', longName, 'user-id'))
        .rejects
        .toMatchObject({
          code: ErrorCode.VALIDATION_ERROR,
          status: 422,
        });
    });

    it('throws VALIDATION_ERROR with both fields when both are invalid', async () => {
      try {
        await createCourse('', '', 'user-id');
        expect.fail('Expected AppError to be thrown');
      } catch (err) {
        const appErr = err as AppError;
        expect(appErr.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(appErr.details).toHaveProperty('courseNumber');
        expect(appErr.details).toHaveProperty('courseName');
      }
    });

    it('throws COURSE_EXISTS (409) when courseNumber already exists', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'existing-id',
        courseNumber: '6.042',
      });

      await expect(createCourse('6.042', 'Math for CS', 'user-id'))
        .rejects
        .toMatchObject({
          code: ErrorCode.COURSE_EXISTS,
          status: 409,
        });
    });

    it('creates course with a year folder containing three default categories when valid', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);
      const currentYear = new Date().getFullYear();
      const mockCreated = {
        id: 'new-id',
        courseNumber: '6.042',
        courseName: 'Math for CS',
        yearFolders: [
          {
            year: currentYear,
            categories: [
              { name: 'Exams', isDefault: true },
              { name: 'Problem_Sets', isDefault: true },
              { name: 'Lectures', isDefault: true },
            ],
          },
        ],
      };
      mockPrisma.course.create.mockResolvedValue(mockCreated);

      const result = await createCourse('6.042', 'Math for CS', 'user-id');

      expect(result).toEqual(mockCreated);
      expect(mockPrisma.course.create).toHaveBeenCalledWith({
        data: {
          courseNumber: '6.042',
          courseName: 'Math for CS',
          createdById: 'user-id',
          yearFolders: {
            create: {
              year: currentYear,
              categories: {
                create: [
                  { name: 'Exams', isDefault: true },
                  { name: 'Problem_Sets', isDefault: true },
                  { name: 'Lectures', isDefault: true },
                ],
              },
            },
          },
        },
        include: {
          yearFolders: {
            include: {
              categories: true,
            },
          },
          createdBy: {
            select: { name: true },
          },
        },
      });
    });
  });

  describe('getCourseWithCategories', () => {
    it('returns course with year folders and categories sorted by name', async () => {
      const mockCourse = {
        id: 'course-1',
        courseNumber: '6.042',
        courseName: 'Math for CS',
        yearFolders: [
          {
            year: 2024,
            categories: [
              { name: 'Exams', isDefault: true },
              { name: 'Lectures', isDefault: true },
              { name: 'Problem_Sets', isDefault: true },
            ],
          },
        ],
      };
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse);

      const result = await getCourseWithCategories('course-1');

      expect(result).toEqual(mockCourse);
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'course-1' },
        include: {
          yearFolders: {
            orderBy: { year: 'desc' },
            include: {
              categories: {
                orderBy: { name: 'asc' },
              },
            },
          },
          createdBy: {
            select: { name: true },
          },
        },
      });
    });

    it('throws 404 when course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(getCourseWithCategories('nonexistent'))
        .rejects
        .toMatchObject({
          code: ErrorCode.VALIDATION_ERROR,
          status: 404,
        });
    });
  });
});
