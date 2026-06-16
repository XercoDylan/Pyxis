import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: year-subfolders, Property 2: Course-year uniqueness
 *
 * Validates: Requirements 1.2, 2.3
 *
 * For any course and any year value, attempting to create a second year folder
 * with the same (courseId, year) pair should be rejected, while distinct pairs
 * should succeed.
 */

// In-memory store to simulate the year_folders table with unique constraint on (courseId, year)
interface StoredYearFolder {
  id: string;
  courseId: string;
  year: number;
  isComplete: boolean;
  createdAt: Date;
  categories: { id: string; name: string; isDefault: boolean; createdAt: Date }[];
}

let yearFolderStore: Map<string, StoredYearFolder>;
let idCounter = 0;

function compositeKey(courseId: string, year: number): string {
  return `${courseId}::${year}`;
}

// Simulate Prisma P2002 unique constraint violation error
class PrismaUniqueConstraintError extends Error {
  code = 'P2002';
  constructor() {
    super('Unique constraint failed on the fields: (`course_id`,`year`)');
    this.name = 'PrismaClientKnownRequestError';
  }
}

// Mock Prisma client with in-memory uniqueness enforcement
vi.mock('../config/database.js', () => {
  return {
    prisma: {
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          yearFolder: {
            create: vi.fn(({ data, include }: { data: { courseId: string; year: number; categories?: { create: { name: string; isDefault: boolean }[] } }; include?: unknown }) => {
              const key = compositeKey(data.courseId, data.year);
              if (yearFolderStore.has(key)) {
                throw new PrismaUniqueConstraintError();
              }
              const id = `yf-${++idCounter}`;
              // Sort categories by name ascending to simulate orderBy: { name: 'asc' }
              const categories = (data.categories?.create ?? [])
                .map((cat, idx) => ({
                  id: `cat-${idCounter}-${idx}`,
                  name: cat.name,
                  isDefault: cat.isDefault,
                  createdAt: new Date(),
                }))
                .sort((a, b) => a.name.localeCompare(b.name));
              const yearFolder: StoredYearFolder = {
                id,
                courseId: data.courseId,
                year: data.year,
                isComplete: false,
                createdAt: new Date(),
                categories,
              };
              yearFolderStore.set(key, yearFolder);
              return Promise.resolve(yearFolder);
            }),
          },
        };
        return fn(tx);
      }),
    },
  };
});

import { createYearFolder } from './yearFolder.service.js';
import { AppError, ErrorCode } from '../types/index.js';

describe('Property 2: Course-year uniqueness', () => {
  beforeEach(() => {
    yearFolderStore = new Map();
    idCounter = 0;
  });

  // Generator for valid course IDs (UUID-like strings)
  const courseIdArb = fc.uuid();

  // Generator for valid year values (2000-2100)
  const yearArb = fc.integer({ min: 2000, max: 2100 });

  it('creating the same (courseId, year) pair twice should reject the second attempt with YEAR_EXISTS', async () => {
    await fc.assert(
      fc.asyncProperty(courseIdArb, yearArb, async (courseId, year) => {
        // Clear store for each iteration
        yearFolderStore.clear();

        // First creation should succeed
        const result = await createYearFolder(courseId, year);
        expect(result).toBeDefined();
        expect(result.courseId).toBe(courseId);
        expect(result.year).toBe(year);

        // Second creation with same pair should throw YEAR_EXISTS
        try {
          await createYearFolder(courseId, year);
          // Should not reach here
          expect.fail('Expected AppError to be thrown for duplicate (courseId, year)');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).code).toBe(ErrorCode.YEAR_EXISTS);
          expect((error as AppError).status).toBe(409);
        }
      }),
      { numRuns: 20 },
    );
  });

  it('distinct (courseId, year) pairs should all succeed', async () => {
    await fc.assert(
      fc.asyncProperty(
        courseIdArb,
        fc.tuple(yearArb, yearArb).filter(([y1, y2]) => y1 !== y2),
        async (courseId, [year1, year2]) => {
          // Clear store for each iteration
          yearFolderStore.clear();

          // Both distinct years for the same course should succeed
          const result1 = await createYearFolder(courseId, year1);
          expect(result1).toBeDefined();
          expect(result1.year).toBe(year1);

          const result2 = await createYearFolder(courseId, year2);
          expect(result2).toBeDefined();
          expect(result2.year).toBe(year2);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('same year on different courses should succeed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(courseIdArb, courseIdArb).filter(([c1, c2]) => c1 !== c2),
        yearArb,
        async ([courseId1, courseId2], year) => {
          // Clear store for each iteration
          yearFolderStore.clear();

          // Same year on different courses should both succeed
          const result1 = await createYearFolder(courseId1, year);
          expect(result1).toBeDefined();
          expect(result1.courseId).toBe(courseId1);

          const result2 = await createYearFolder(courseId2, year);
          expect(result2).toBeDefined();
          expect(result2.courseId).toBe(courseId2);
        },
      ),
      { numRuns: 20 },
    );
  });
});


/**
 * Feature: year-subfolders, Property 3: Default completion status on creation
 *
 * Validates: Requirements 1.3
 *
 * For any valid year folder creation (valid course, valid year in range),
 * the resulting year folder should have `isComplete` equal to `false`.
 */
describe('Feature: year-subfolders, Property 3: Default completion status on creation', () => {
  beforeEach(() => {
    yearFolderStore = new Map();
    idCounter = 0;
  });

  // Generator for valid year values: integers in [2000, 2100]
  const validYearArb = fc.integer({ min: 2000, max: 2100 });

  // Generator for valid course IDs (UUID-like strings)
  const courseIdArb = fc.uuid();

  it('for any valid year in [2000, 2100], created year folder has isComplete === false', async () => {
    await fc.assert(
      fc.asyncProperty(courseIdArb, validYearArb, async (courseId, year) => {
        // Clear store for each iteration to avoid uniqueness conflicts
        yearFolderStore.clear();
        idCounter = 0;

        const result = await createYearFolder(courseId, year);

        expect(result.isComplete).toBe(false);
      }),
      { numRuns: 20 }
    );
  });
});


/**
 * Feature: year-subfolders, Property 6: Default categories on year folder creation
 *
 * Validates: Requirements 3.3
 *
 * For any valid year folder creation, the resulting year folder should contain
 * exactly three categories named "Exams", "Lectures", and "Problem_Sets",
 * each marked as default (isDefault: true).
 */
describe('Feature: year-subfolders, Property 6: Default categories on year folder creation', () => {
  beforeEach(() => {
    yearFolderStore = new Map();
    idCounter = 0;
  });

  // Generator for valid year values: integers in [2000, 2100]
  const validYearArb = fc.integer({ min: 2000, max: 2100 });

  // Generator for valid course IDs (UUID-like strings)
  const courseIdArb = fc.uuid();

  it('created year folder contains exactly 3 categories', async () => {
    await fc.assert(
      fc.asyncProperty(courseIdArb, validYearArb, async (courseId, year) => {
        yearFolderStore.clear();
        idCounter = 0;

        const result = await createYearFolder(courseId, year);

        expect(result.categories).toHaveLength(3);
      }),
      { numRuns: 15 }
    );
  });

  it('created year folder categories have names sorted: ["Exams", "Lectures", "Problem_Sets"]', async () => {
    await fc.assert(
      fc.asyncProperty(courseIdArb, validYearArb, async (courseId, year) => {
        yearFolderStore.clear();
        idCounter = 0;

        const result = await createYearFolder(courseId, year);

        const categoryNames = result.categories.map((c: { name: string }) => c.name);
        expect(categoryNames).toEqual(['Exams', 'Lectures', 'Problem_Sets']);
      }),
      { numRuns: 15 }
    );
  });

  it('all 3 default categories have isDefault === true', async () => {
    await fc.assert(
      fc.asyncProperty(courseIdArb, validYearArb, async (courseId, year) => {
        yearFolderStore.clear();
        idCounter = 0;

        const result = await createYearFolder(courseId, year);

        for (const category of result.categories) {
          expect(category.isDefault).toBe(true);
        }
      }),
      { numRuns: 15 }
    );
  });
});
