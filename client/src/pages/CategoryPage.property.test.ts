import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: year-subfolders, Property 8: Category alphabetical sort within year
 *
 * Validates: Requirements 4.3
 *
 * For any list of categories within a year folder, the sort function should
 * produce output where each category's name is lexicographically less than or
 * equal to the next category's name.
 */

/**
 * Sorts categories alphabetically by name using locale-aware comparison.
 * Pure function that does not mutate the input array.
 */
export function sortCategoriesAlphabetically<T extends { name: string }>(categories: T[]): T[] {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Generator for category objects with realistic fields.
 */
const categoryArb = fc.record({
  id: fc.uuid(),
  yearFolderId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  isDefault: fc.boolean(),
  createdAt: fc.date().map((d) => d.toISOString()),
});

describe('Property 8: Category alphabetical sort within year', () => {
  it('sorted output has each name <= next name (alphabetical/ascending)', () => {
    fc.assert(
      fc.property(
        fc.array(categoryArb, { minLength: 0, maxLength: 50 }),
        (categories) => {
          const sorted = sortCategoriesAlphabetically(categories);

          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].name.localeCompare(sorted[i + 1].name)).toBeLessThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preserves all elements', () => {
    fc.assert(
      fc.property(
        fc.array(categoryArb, { minLength: 0, maxLength: 50 }),
        (categories) => {
          const sorted = sortCategoriesAlphabetically(categories);

          // Same length
          expect(sorted.length).toBe(categories.length);

          // Same items (by reference)
          const originalSet = new Set(categories);
          for (const item of sorted) {
            expect(originalSet.has(item)).toBe(true);
          }

          const sortedSet = new Set(sorted);
          for (const item of categories) {
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
        fc.array(categoryArb, { minLength: 0, maxLength: 50 }),
        (categories) => {
          const sortedOnce = sortCategoriesAlphabetically(categories);
          const sortedTwice = sortCategoriesAlphabetically(sortedOnce);

          expect(sortedTwice).toEqual(sortedOnce);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does not mutate input', () => {
    fc.assert(
      fc.property(
        fc.array(categoryArb, { minLength: 0, maxLength: 50 }),
        (categories) => {
          const originalCopy = [...categories];
          sortCategoriesAlphabetically(categories);

          expect(categories).toEqual(originalCopy);
        }
      ),
      { numRuns: 100 }
    );
  });
});
