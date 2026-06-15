import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: pyxis-course-materials, Property 18: Contribution statistics aggregation
 *
 * Validates: Requirements 9.2
 *
 * For any member with uploaded files distributed across courses, the statistics
 * function should report a total file count equal to the actual number of files
 * they uploaded, and a distinct course count equal to the number of unique courses
 * they contributed to.
 */

interface FileEntry {
  courseId: string;
}

interface ContributionStats {
  totalFiles: number;
  distinctCourses: number;
}

/**
 * Pure function that computes contribution statistics from an array of file objects.
 * Each file has a courseId indicating which course it belongs to.
 *
 * Returns:
 * - totalFiles: the total number of files (length of input array)
 * - distinctCourses: the number of unique courseId values in the input
 */
export function computeStats(files: FileEntry[]): ContributionStats {
  const totalFiles = files.length;
  const distinctCourses = new Set(files.map((f) => f.courseId)).size;
  return { totalFiles, distinctCourses };
}

// Arbitrary for file objects with a courseId string (UUID-like for realism)
const fileEntryArb: fc.Arbitrary<FileEntry> = fc.record({
  courseId: fc.uuid(),
});

describe('Property 18: Contribution statistics aggregation', () => {
  it('totalFiles equals the length of the input array', () => {
    fc.assert(
      fc.property(
        fc.array(fileEntryArb, { minLength: 0, maxLength: 200 }),
        (files) => {
          const stats = computeStats(files);
          expect(stats.totalFiles).toBe(files.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('distinctCourses equals the number of unique courseId values', () => {
    fc.assert(
      fc.property(
        fc.array(fileEntryArb, { minLength: 0, maxLength: 200 }),
        (files) => {
          const stats = computeStats(files);
          const expectedDistinct = new Set(files.map((f) => f.courseId)).size;
          expect(stats.distinctCourses).toBe(expectedDistinct);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns zero for both stats when given an empty array', () => {
    const stats = computeStats([]);
    expect(stats.totalFiles).toBe(0);
    expect(stats.distinctCourses).toBe(0);
  });

  it('distinctCourses is always <= totalFiles', () => {
    fc.assert(
      fc.property(
        fc.array(fileEntryArb, { minLength: 0, maxLength: 200 }),
        (files) => {
          const stats = computeStats(files);
          expect(stats.distinctCourses).toBeLessThanOrEqual(stats.totalFiles);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('distinctCourses equals totalFiles when all courseIds are unique', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.uuid(), { minLength: 1, maxLength: 50 }),
        (courseIds) => {
          const files = courseIds.map((courseId) => ({ courseId }));
          const stats = computeStats(files);
          expect(stats.distinctCourses).toBe(stats.totalFiles);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('distinctCourses equals 1 when all files belong to the same course', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.integer({ min: 1, max: 100 }),
        (courseId, count) => {
          const files = Array.from({ length: count }, () => ({ courseId }));
          const stats = computeStats(files);
          expect(stats.totalFiles).toBe(count);
          expect(stats.distinctCourses).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
