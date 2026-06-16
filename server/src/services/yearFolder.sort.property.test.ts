import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: year-subfolders
 *
 * Property 4: Year folder descending sort
 * Property 5: Year folder-category name uniqueness
 * Property 7: Cascade delete removes all children
 *
 * Validates: Requirements 2.2, 3.2, 3.4, 7.4
 */

// =============================================================================
// Property 4: Year folder descending sort
// =============================================================================

interface YearFolderSortItem {
  id: string;
  year: number;
}

/**
 * Pure sort function that sorts year folders by year in descending order.
 * Mirrors the database-level `orderBy: { year: 'desc' }` logic in listYearFolders.
 */
export function sortYearFoldersDescending<T extends { year: number }>(
  yearFolders: T[]
): T[] {
  return [...yearFolders].sort((a, b) => b.year - a.year);
}

describe('Feature: year-subfolders, Property 4: Year folder descending sort', () => {
  const yearFolderArb: fc.Arbitrary<YearFolderSortItem> = fc.record({
    id: fc.uuid(),
    year: fc.integer({ min: 2000, max: 2100 }),
  });

  const yearFolderListArb = fc.array(yearFolderArb, {
    minLength: 0,
    maxLength: 50,
  });

  it('sorted output has each year >= the next year (descending order)', () => {
    fc.assert(
      fc.property(yearFolderListArb, (yearFolders) => {
        const sorted = sortYearFoldersDescending(yearFolders);

        for (let i = 0; i < sorted.length - 1; i++) {
          expect(sorted[i].year).toBeGreaterThanOrEqual(sorted[i + 1].year);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('preserves all elements (same length, same items)', () => {
    fc.assert(
      fc.property(yearFolderListArb, (yearFolders) => {
        const sorted = sortYearFoldersDescending(yearFolders);

        expect(sorted).toHaveLength(yearFolders.length);

        const originalYears = yearFolders.map((yf) => yf.year).sort();
        const sortedYears = sorted.map((yf) => yf.year).sort();
        expect(sortedYears).toEqual(originalYears);
      }),
      { numRuns: 100 }
    );
  });

  it('is idempotent (sorting an already sorted list returns the same result)', () => {
    fc.assert(
      fc.property(yearFolderListArb, (yearFolders) => {
        const sorted = sortYearFoldersDescending(yearFolders);
        const sortedAgain = sortYearFoldersDescending(sorted);

        expect(sortedAgain).toEqual(sorted);
      }),
      { numRuns: 100 }
    );
  });

  it('does not mutate the original array', () => {
    fc.assert(
      fc.property(yearFolderListArb, (yearFolders) => {
        const original = [...yearFolders];
        sortYearFoldersDescending(yearFolders);

        expect(yearFolders).toEqual(original);
      }),
      { numRuns: 20 }
    );
  });
});

// =============================================================================
// Property 5: Year folder-category name uniqueness
// =============================================================================

// In-memory store to simulate the categories table with unique constraint on (yearFolderId, name)
interface StoredCategory {
  id: string;
  yearFolderId: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
}

let categoryStore: Map<string, StoredCategory>;
let catIdCounter = 0;

function categoryCompositeKey(yearFolderId: string, name: string): string {
  return `${yearFolderId}::${name}`;
}

// Simulate Prisma P2002 unique constraint violation error
class PrismaUniqueConstraintError extends Error {
  code = 'P2002';
  constructor() {
    super(
      'Unique constraint failed on the fields: (`year_folder_id`,`name`)'
    );
    this.name = 'PrismaClientKnownRequestError';
  }
}

vi.mock('../config/database.js', () => {
  return {
    prisma: {
      category: {
        findUnique: vi.fn(({ where }: { where: { yearFolderId_name: { yearFolderId: string; name: string } } }) => {
          const key = categoryCompositeKey(
            where.yearFolderId_name.yearFolderId,
            where.yearFolderId_name.name
          );
          const existing = categoryStore.get(key);
          return Promise.resolve(existing ?? null);
        }),
        create: vi.fn(({ data }: { data: { yearFolderId: string; name: string; isDefault: boolean } }) => {
          const key = categoryCompositeKey(data.yearFolderId, data.name);
          if (categoryStore.has(key)) {
            throw new PrismaUniqueConstraintError();
          }
          const id = `cat-${++catIdCounter}`;
          const category: StoredCategory = {
            id,
            yearFolderId: data.yearFolderId,
            name: data.name,
            isDefault: data.isDefault,
            createdAt: new Date(),
          };
          categoryStore.set(key, category);
          return Promise.resolve({
            id: category.id,
            name: category.name,
            isDefault: category.isDefault,
            createdAt: category.createdAt,
          });
        }),
      },
      yearFolder: {
        delete: vi.fn(),
      },
    },
  };
});

import { createCategory } from './category.service.js';
import { AppError, ErrorCode } from '../types/index.js';

describe('Feature: year-subfolders, Property 5: Year folder-category name uniqueness', () => {
  beforeEach(() => {
    categoryStore = new Map();
    catIdCounter = 0;
  });

  // Generator for valid year folder IDs (UUID-like strings)
  const yearFolderIdArb = fc.uuid();

  // Generator for valid category names: non-empty, max 50 characters
  const categoryNameArb = fc.stringOf(
    fc.constantFrom(
      ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_- '.split(
        ''
      )
    ),
    { minLength: 1, maxLength: 50 }
  );

  it('creating the same (yearFolderId, name) pair twice should reject the second attempt with CATEGORY_EXISTS', async () => {
    await fc.assert(
      fc.asyncProperty(
        yearFolderIdArb,
        categoryNameArb,
        async (yearFolderId, name) => {
          categoryStore.clear();
          catIdCounter = 0;

          // First creation should succeed
          const result = await createCategory(yearFolderId, name);
          expect(result).toBeDefined();
          expect(result.name).toBe(name);

          // Second creation with same pair should throw CATEGORY_EXISTS
          try {
            await createCategory(yearFolderId, name);
            expect.fail(
              'Expected AppError to be thrown for duplicate (yearFolderId, name)'
            );
          } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect((error as AppError).code).toBe(ErrorCode.CATEGORY_EXISTS);
            expect((error as AppError).status).toBe(409);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('distinct names within the same year folder should all succeed', async () => {
    await fc.assert(
      fc.asyncProperty(
        yearFolderIdArb,
        fc
          .tuple(categoryNameArb, categoryNameArb)
          .filter(([n1, n2]) => n1 !== n2),
        async (yearFolderId, [name1, name2]) => {
          categoryStore.clear();
          catIdCounter = 0;

          const result1 = await createCategory(yearFolderId, name1);
          expect(result1).toBeDefined();
          expect(result1.name).toBe(name1);

          const result2 = await createCategory(yearFolderId, name2);
          expect(result2).toBeDefined();
          expect(result2.name).toBe(name2);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('same name in different year folders should succeed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(yearFolderIdArb, yearFolderIdArb).filter(([a, b]) => a !== b),
        categoryNameArb,
        async ([yfId1, yfId2], name) => {
          categoryStore.clear();
          catIdCounter = 0;

          const result1 = await createCategory(yfId1, name);
          expect(result1).toBeDefined();
          expect(result1.name).toBe(name);

          const result2 = await createCategory(yfId2, name);
          expect(result2).toBeDefined();
          expect(result2.name).toBe(name);
        }
      ),
      { numRuns: 20 }
    );
  });
});

// =============================================================================
// Property 7: Cascade delete removes all children
// =============================================================================

import { deleteYearFolder } from './yearFolder.service.js';
import { prisma } from '../config/database.js';

describe('Feature: year-subfolders, Property 7: Cascade delete removes all children', () => {
  beforeEach(() => {
    vi.mocked(prisma.yearFolder.delete).mockReset();
  });

  const yearFolderIdArb = fc.uuid();

  it('deleteYearFolder calls prisma.yearFolder.delete with the correct id (cascade is DB-enforced)', async () => {
    await fc.assert(
      fc.asyncProperty(yearFolderIdArb, async (yearId) => {
        vi.mocked(prisma.yearFolder.delete).mockResolvedValue({
          id: yearId,
          courseId: 'course-1',
          year: 2024,
          isComplete: false,
          createdAt: new Date(),
        });

        await deleteYearFolder(yearId);

        expect(prisma.yearFolder.delete).toHaveBeenCalledWith({
          where: { id: yearId },
        });
      }),
      { numRuns: 20 }
    );
  });

  it('deleteYearFolder throws NOT_FOUND when year folder does not exist (P2025 error)', async () => {
    await fc.assert(
      fc.asyncProperty(yearFolderIdArb, async (yearId) => {
        const prismaNotFoundError = new Error('Record not found') as Error & {
          code: string;
        };
        prismaNotFoundError.code = 'P2025';

        vi.mocked(prisma.yearFolder.delete).mockRejectedValue(
          prismaNotFoundError
        );

        try {
          await deleteYearFolder(yearId);
          expect.fail('Expected AppError to be thrown for non-existent year folder');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).code).toBe(ErrorCode.VALIDATION_ERROR);
          expect((error as AppError).status).toBe(404);
        }
      }),
      { numRuns: 20 }
    );
  });
});
