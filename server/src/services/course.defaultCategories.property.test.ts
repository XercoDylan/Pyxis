import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: pyxis-course-materials, Property 15: Course creation produces default categories
 *
 * Validates: Requirements 8.2
 *
 * For any valid course number (1–20 characters, non-empty) and valid course name
 * (1–100 characters, non-empty), creating a course should result in a course with
 * exactly three default categories: "Exams", "Problem_Sets", and "Lectures",
 * all with isDefault: true (created via a year folder).
 */

// Capture the data passed to prisma.course.create
let capturedCreateData: any;

// Mock Prisma client
vi.mock('../config/database.js', () => {
  return {
    default: {
      course: {
        findUnique: vi.fn(() => Promise.resolve(null)), // No duplicates
        create: vi.fn((args: any) => {
          capturedCreateData = args.data;
          // Return a mock course with the yearFolders/categories structure
          const yearFolderCreate = args.data.yearFolders?.create;
          const categories = (yearFolderCreate?.categories?.create ?? []).map(
            (cat: any, idx: number) => ({
              id: `cat-id-${idx}`,
              yearFolderId: 'mock-year-folder-id',
              name: cat.name,
              isDefault: cat.isDefault,
              createdAt: new Date(),
            })
          );
          return Promise.resolve({
            id: 'mock-course-id',
            courseNumber: args.data.courseNumber,
            courseName: args.data.courseName,
            createdById: args.data.createdById,
            createdAt: new Date(),
            yearFolders: [
              {
                id: 'mock-year-folder-id',
                year: yearFolderCreate?.year,
                categories,
              },
            ],
            createdBy: { name: 'Test User' },
          });
        }),
      },
    },
  };
});

import { createCourse } from './course.service.js';

describe('Property 15: Course creation produces default categories', () => {
  beforeEach(() => {
    capturedCreateData = null;
  });

  /**
   * Generator for valid course numbers: non-empty strings of 1–20 characters.
   * Uses printable ASCII to simulate realistic course numbers.
   */
  const validCourseNumberArb = fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0);

  /**
   * Generator for valid course names: non-empty strings of 1–100 characters.
   */
  const validCourseNameArb = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

  it('creating a valid course produces exactly 3 default categories: Exams, Problem_Sets, Lectures', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCourseNumberArb,
        validCourseNameArb,
        async (courseNumber, courseName) => {
          capturedCreateData = null;

          const result = await createCourse(courseNumber, courseName, 'mock-member-id');

          // Verify the create call included yearFolders with categories
          expect(capturedCreateData).not.toBeNull();
          const yearFolderCreate = capturedCreateData.yearFolders?.create;
          expect(yearFolderCreate).toBeDefined();
          const categoriesCreate = yearFolderCreate.categories?.create;
          expect(categoriesCreate).toBeDefined();
          expect(categoriesCreate).toHaveLength(3);

          // Extract the category names and sort for consistent comparison
          const categoryNames = categoriesCreate.map((c: any) => c.name).sort();
          expect(categoryNames).toEqual(['Exams', 'Lectures', 'Problem_Sets']);

          // Verify all default categories have isDefault: true
          for (const cat of categoriesCreate) {
            expect(cat.isDefault).toBe(true);
          }

          // Also verify the returned result has year folders with 3 categories
          expect(result.yearFolders[0].categories).toHaveLength(3);
        }
      ),
      { numRuns: 100 }
    );
  });
});
