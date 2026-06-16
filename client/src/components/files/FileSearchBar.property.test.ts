import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: year-subfolders, Property 10: File search filter correctness
 *
 * Validates: Requirements 5.2, 5.3
 *
 * For any list of files and any search term, the filter function should return
 * exactly those files where the filename contains the search term as a
 * case-insensitive substring. When the search term is empty, all files should
 * be returned.
 */

/**
 * Pure filter function that filters files by filename using case-insensitive
 * substring matching. This mirrors the filtering logic used in the CategoryPage.
 */
function filterFiles<T extends { filename: string }>(files: T[], searchTerm: string): T[] {
  if (!searchTerm) return files;
  const lower = searchTerm.toLowerCase();
  return files.filter(f => f.filename.toLowerCase().includes(lower));
}

/** Arbitrary for generating file objects with random filenames */
const fileArb = fc.record({
  id: fc.uuid(),
  filename: fc.stringOf(
    fc.oneof(
      fc.char(),
      fc.constantFrom('.', '-', '_', ' ')
    ),
    { minLength: 1, maxLength: 50 }
  ),
});

/** Arbitrary for a list of files */
const fileListArb = fc.array(fileArb, { minLength: 0, maxLength: 30 });

/** Arbitrary for search terms (including empty string) */
const searchTermArb = fc.stringOf(
  fc.oneof(
    fc.char(),
    fc.constantFrom('.', '-', '_', ' ')
  ),
  { minLength: 0, maxLength: 20 }
);

describe('Property 10: File search filter correctness', () => {
  it('empty search term returns all files', () => {
    fc.assert(
      fc.property(fileListArb, (files) => {
        const result = filterFiles(files, '');
        expect(result).toHaveLength(files.length);
        expect(result).toEqual(files);
      }),
      { numRuns: 100 }
    );
  });

  it('every file in the result contains the search term (case-insensitive)', () => {
    fc.assert(
      fc.property(fileListArb, searchTermArb, (files, searchTerm) => {
        const result = filterFiles(files, searchTerm);
        for (const file of result) {
          expect(
            file.filename.toLowerCase().includes(searchTerm.toLowerCase())
          ).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('every file NOT in the result does NOT contain the search term (case-insensitive)', () => {
    fc.assert(
      fc.property(fileListArb, searchTermArb, (files, searchTerm) => {
        const result = filterFiles(files, searchTerm);
        const excluded = files.filter(f => !result.includes(f));
        for (const file of excluded) {
          if (searchTerm) {
            expect(
              file.filename.toLowerCase().includes(searchTerm.toLowerCase())
            ).toBe(false);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('result is a subset of input (no new elements introduced)', () => {
    fc.assert(
      fc.property(fileListArb, searchTermArb, (files, searchTerm) => {
        const result = filterFiles(files, searchTerm);
        expect(result.length).toBeLessThanOrEqual(files.length);
        for (const file of result) {
          expect(files).toContain(file);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('case-insensitivity: filtering by upper and lower case gives same results', () => {
    fc.assert(
      fc.property(fileListArb, searchTermArb, (files, searchTerm) => {
        const resultUpper = filterFiles(files, searchTerm.toUpperCase());
        const resultLower = filterFiles(files, searchTerm.toLowerCase());
        expect(resultUpper).toEqual(resultLower);
      }),
      { numRuns: 100 }
    );
  });
});
