import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: pyxis-course-materials, Property 7: Course search filter correctness
 *
 * Validates: Requirements 4.4
 *
 * For any list of courses and any non-empty search term, the filter function
 * should return exactly those courses where the search term is a case-insensitive
 * substring of either the course number or the course name.
 */

interface CourseEntry {
  courseNumber: string;
  courseName: string;
}

/**
 * Pure filter function that mirrors the server's search logic:
 * Returns courses where searchTerm is a case-insensitive substring
 * of courseNumber or courseName.
 */
function filterCourses(courses: CourseEntry[], searchTerm: string): CourseEntry[] {
  const term = searchTerm.toLowerCase();
  return courses.filter(
    (course) =>
      course.courseNumber.toLowerCase().includes(term) ||
      course.courseName.toLowerCase().includes(term)
  );
}

// Arbitrary for course entries with realistic-ish data
const courseEntryArb: fc.Arbitrary<CourseEntry> = fc.record({
  courseNumber: fc.stringOf(
    fc.constantFrom(
      ...'0123456789.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
    ),
    { minLength: 1, maxLength: 20 }
  ),
  courseName: fc.stringOf(
    fc.constantFrom(
      ...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz 0123456789'.split('')
    ),
    { minLength: 1, maxLength: 100 }
  ),
});

// Non-empty search term arbitrary
const searchTermArb = fc.stringOf(
  fc.constantFrom(
    ...'0123456789.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz '.split('')
  ),
  { minLength: 1, maxLength: 15 }
);

describe('Property 7: Course search filter correctness', () => {
  it('returns exactly courses where search term is a case-insensitive substring of number or name', () => {
    fc.assert(
      fc.property(
        fc.array(courseEntryArb, { minLength: 0, maxLength: 30 }),
        searchTermArb,
        (courses, searchTerm) => {
          const result = filterCourses(courses, searchTerm);
          const term = searchTerm.toLowerCase();

          // Compute expected result independently
          const expected = courses.filter(
            (c) =>
              c.courseNumber.toLowerCase().includes(term) ||
              c.courseName.toLowerCase().includes(term)
          );

          // The filter returns exactly the matching courses
          expect(result).toHaveLength(expected.length);

          // Every returned course must match the search term
          for (const course of result) {
            const matchesNumber = course.courseNumber.toLowerCase().includes(term);
            const matchesName = course.courseName.toLowerCase().includes(term);
            expect(matchesNumber || matchesName).toBe(true);
          }

          // Every course NOT in the result must NOT match the search term
          const resultSet = new Set(result);
          for (const course of courses) {
            if (!resultSet.has(course)) {
              const matchesNumber = course.courseNumber.toLowerCase().includes(term);
              const matchesName = course.courseName.toLowerCase().includes(term);
              expect(matchesNumber || matchesName).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preserves order of matching courses from the original list', () => {
    fc.assert(
      fc.property(
        fc.array(courseEntryArb, { minLength: 0, maxLength: 30 }),
        searchTermArb,
        (courses, searchTerm) => {
          const result = filterCourses(courses, searchTerm);
          const term = searchTerm.toLowerCase();

          // Filtered result should maintain relative order from input
          let lastIndex = -1;
          for (const course of result) {
            const idx = courses.indexOf(course);
            expect(idx).toBeGreaterThan(lastIndex);
            lastIndex = idx;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('is case-insensitive: filtering with upper/lower term yields same results', () => {
    fc.assert(
      fc.property(
        fc.array(courseEntryArb, { minLength: 0, maxLength: 20 }),
        searchTermArb,
        (courses, searchTerm) => {
          const resultLower = filterCourses(courses, searchTerm.toLowerCase());
          const resultUpper = filterCourses(courses, searchTerm.toUpperCase());

          expect(resultLower).toHaveLength(resultUpper.length);
          for (let i = 0; i < resultLower.length; i++) {
            expect(resultLower[i]).toBe(resultUpper[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
