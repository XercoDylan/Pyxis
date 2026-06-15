import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { paginate } from './file.service.js';

/**
 * Feature: pyxis-course-materials, Property 11: Pagination invariant
 *
 * Validates: Requirements 5.2
 *
 * For any list of files with length N and page size 50, paginating should produce
 * ⌈N/50⌉ pages where each page has at most 50 items, and the union of all pages
 * equals the original list (no items lost or duplicated).
 */
describe('Property 11: Pagination invariant', () => {
  const PAGE_SIZE = 50;

  /**
   * Generator for arrays of items with varying lengths (0-200).
   * Items are simple objects with an id to allow identity checking.
   */
  const itemsArb = fc.array(
    fc.record({ id: fc.uuid(), name: fc.string({ minLength: 1, maxLength: 50 }) }),
    { minLength: 0, maxLength: 200 }
  );

  it('should produce exactly ⌈N/50⌉ pages for N items with page size 50', () => {
    fc.assert(
      fc.property(itemsArb, (items) => {
        const N = items.length;
        const expectedPages = N === 0 ? 0 : Math.ceil(N / PAGE_SIZE);

        const result = paginate(items, 1, PAGE_SIZE);

        expect(result.totalPages).toBe(expectedPages);
        expect(result.totalCount).toBe(N);
      }),
      { numRuns: 100 }
    );
  });

  it('should have at most 50 items on each page', () => {
    fc.assert(
      fc.property(itemsArb, (items) => {
        const totalPages = items.length === 0 ? 0 : Math.ceil(items.length / PAGE_SIZE);

        for (let page = 1; page <= totalPages; page++) {
          const result = paginate(items, page, PAGE_SIZE);
          expect(result.items.length).toBeLessThanOrEqual(PAGE_SIZE);
          expect(result.items.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have union of all pages equal to the original list (no items lost or duplicated)', () => {
    fc.assert(
      fc.property(itemsArb, (items) => {
        const totalPages = items.length === 0 ? 0 : Math.ceil(items.length / PAGE_SIZE);

        const allPageItems: typeof items = [];
        for (let page = 1; page <= totalPages; page++) {
          const result = paginate(items, page, PAGE_SIZE);
          allPageItems.push(...result.items);
        }

        // Union of all pages should equal original list exactly (same order, same elements)
        expect(allPageItems).toEqual(items);
      }),
      { numRuns: 100 }
    );
  });
});
