import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: pyxis-course-materials, Property 9: Category list alphabetical ordering
 *
 * Validates: Requirements 5.1
 *
 * For any list of categories within a course, the sort function should produce
 * output where each category's name is lexicographically less than or equal to
 * the next category's name.
 */

interface Category {
  name: string;
}

/**
 * Pure sort function that sorts categories alphabetically by name (ascending).
 * Mirrors the database-level `orderBy: { name: 'asc' }` logic in the category service.
 */
export function sortCategoriesByName(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name));
}

// Arbitrary for category objects with string names
const categoryArb: fc.Arbitrary<Category> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
});

describe('Property 9: Category list alphabetical ordering', () => {
  it('sorted output has each category name <= next lexicographically', () => {
    fc.assert(
      fc.property(
        fc.array(categoryArb, { minLength: 0, maxLength: 50 }),
        (categories) => {
          const sorted = sortCategoriesByName(categories);

          // Verify the ordering invariant for all adjacent pairs
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].name.localeCompare(sorted[i + 1].name)).toBeLessThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preserves all elements (same length, same items)', () => {
    fc.assert(
      fc.property(
        fc.array(categoryArb, { minLength: 0, maxLength: 50 }),
        (categories) => {
          const sorted = sortCategoriesByName(categories);

          // Same number of elements
          expect(sorted).toHaveLength(categories.length);

          // Same elements (sorted is a permutation of the original)
          const originalNames = categories.map((c) => c.name).sort();
          const sortedNames = sorted.map((c) => c.name).sort();
          expect(sortedNames).toEqual(originalNames);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('is idempotent (sorting an already sorted list returns the same result)', () => {
    fc.assert(
      fc.property(
        fc.array(categoryArb, { minLength: 0, maxLength: 50 }),
        (categories) => {
          const sorted = sortCategoriesByName(categories);
          const sortedAgain = sortCategoriesByName(sorted);

          expect(sortedAgain).toEqual(sorted);
        }
      ),
      { numRuns: 100 }
    );
  });
});
