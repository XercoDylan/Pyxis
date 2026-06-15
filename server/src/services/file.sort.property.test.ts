import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: pyxis-course-materials, Property 10: File list composite sort
 *
 * Validates: Requirements 5.4
 *
 * For any list of files, the sort function should produce output where for every
 * adjacent pair (a, b): either a.uploadedAt > b.uploadedAt, or (a.uploadedAt
 * equals b.uploadedAt AND a.filename <= b.filename).
 */

interface FileEntry {
  uploadedAt: Date;
  filename: string;
}

/**
 * Pure sort function that sorts files by uploadedAt descending (newest first),
 * then by filename ascending for ties.
 * Mirrors the database-level `orderBy: [{ uploadedAt: 'desc' }, { filename: 'asc' }]`
 * logic in the file service.
 */
export function sortFiles(files: FileEntry[]): FileEntry[] {
  return [...files].sort((a, b) => {
    const dateDiff = b.uploadedAt.getTime() - a.uploadedAt.getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.filename.localeCompare(b.filename);
  });
}

// Arbitrary for file objects with a Date and a string filename
const fileArb: fc.Arbitrary<FileEntry> = fc.record({
  uploadedAt: fc.date(),
  filename: fc.string({ minLength: 0, maxLength: 80 }),
});

describe('Property 10: File list composite sort', () => {
  it('for adjacent pairs: either a.uploadedAt > b.uploadedAt, or equal dates with a.filename <= b.filename', () => {
    fc.assert(
      fc.property(
        fc.array(fileArb, { minLength: 0, maxLength: 50 }),
        (files) => {
          const sorted = sortFiles(files);

          // Verify the composite sort invariant for all adjacent pairs
          for (let i = 0; i < sorted.length - 1; i++) {
            const a = sorted[i];
            const b = sorted[i + 1];

            const aTime = a.uploadedAt.getTime();
            const bTime = b.uploadedAt.getTime();

            if (aTime !== bTime) {
              // Primary sort: uploadedAt descending (a should be newer or equal)
              expect(aTime).toBeGreaterThan(bTime);
            } else {
              // Secondary sort: filename ascending
              expect(a.filename.localeCompare(b.filename)).toBeLessThanOrEqual(0);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preserves all elements (same length, same items)', () => {
    fc.assert(
      fc.property(
        fc.array(fileArb, { minLength: 0, maxLength: 50 }),
        (files) => {
          const sorted = sortFiles(files);

          // Same number of elements
          expect(sorted).toHaveLength(files.length);

          // Same elements (sorted is a permutation of the original)
          const originalKeys = files
            .map((f) => `${f.uploadedAt.getTime()}|${f.filename}`)
            .sort();
          const sortedKeys = sorted
            .map((f) => `${f.uploadedAt.getTime()}|${f.filename}`)
            .sort();
          expect(sortedKeys).toEqual(originalKeys);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('is idempotent (sorting an already sorted list returns the same result)', () => {
    fc.assert(
      fc.property(
        fc.array(fileArb, { minLength: 0, maxLength: 50 }),
        (files) => {
          const sorted = sortFiles(files);
          const sortedAgain = sortFiles(sorted);

          expect(sortedAgain).toEqual(sorted);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does not mutate the original array', () => {
    fc.assert(
      fc.property(
        fc.array(fileArb, { minLength: 0, maxLength: 50 }),
        (files) => {
          const original = [...files];
          sortFiles(files);
          expect(files).toEqual(original);
        }
      ),
      { numRuns: 100 }
    );
  });
});
