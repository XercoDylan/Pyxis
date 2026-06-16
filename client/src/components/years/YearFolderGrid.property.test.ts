import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: year-subfolders, Property 4: Year folder descending sort
 *
 * Validates: Requirements 2.2, 7.4
 *
 * For any list of year folders belonging to a course, the sort function should
 * produce output where each year folder's year value is greater than or equal
 * to the next year folder's year value (descending order).
 */

/**
 * Sorts year folders in descending order by year value.
 * Pure function that does not mutate the input array.
 */
export function sortYearFoldersDescending<T extends { year: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.year - a.year);
}

/**
 * Generator for year folder objects with a year in the valid range (2000–2100).
 */
const yearFolderArb = fc.record({
  id: fc.uuid(),
  courseId: fc.uuid(),
  year: fc.integer({ min: 2000, max: 2100 }),
  isComplete: fc.boolean(),
  createdAt: fc.date().map((d) => d.toISOString()),
  fileCount: fc.nat({ max: 500 }),
});

describe('Property 4: Year folder descending sort (frontend)', () => {
  it('sorted output has each year >= the next year (descending order)', () => {
    fc.assert(
      fc.property(
        fc.array(yearFolderArb, { minLength: 0, maxLength: 50 }),
        (yearFolders) => {
          const sorted = sortYearFoldersDescending(yearFolders);

          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].year).toBeGreaterThanOrEqual(sorted[i + 1].year);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preserves all elements (same length, same items)', () => {
    fc.assert(
      fc.property(
        fc.array(yearFolderArb, { minLength: 0, maxLength: 50 }),
        (yearFolders) => {
          const sorted = sortYearFoldersDescending(yearFolders);

          // Same length
          expect(sorted.length).toBe(yearFolders.length);

          // Same items (by reference)
          const originalSet = new Set(yearFolders);
          for (const item of sorted) {
            expect(originalSet.has(item)).toBe(true);
          }

          // Same items the other way
          const sortedSet = new Set(sorted);
          for (const item of yearFolders) {
            expect(sortedSet.has(item)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('idempotent (sorting twice gives same result)', () => {
    fc.assert(
      fc.property(
        fc.array(yearFolderArb, { minLength: 0, maxLength: 50 }),
        (yearFolders) => {
          const sortedOnce = sortYearFoldersDescending(yearFolders);
          const sortedTwice = sortYearFoldersDescending(sortedOnce);

          expect(sortedTwice).toEqual(sortedOnce);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does not mutate the original array', () => {
    fc.assert(
      fc.property(
        fc.array(yearFolderArb, { minLength: 0, maxLength: 50 }),
        (yearFolders) => {
          const originalCopy = [...yearFolders];
          sortYearFoldersDescending(yearFolders);

          expect(yearFolders).toEqual(originalCopy);
        }
      ),
      { numRuns: 100 }
    );
  });
});
