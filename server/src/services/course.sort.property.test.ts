import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sortCoursesByNumber } from './course.service.js';

/**
 * Feature: pyxis-course-materials, Property 8: Course list alphabetical ordering
 *
 * Validates: Requirements 4.1
 *
 * For any list of courses, the sort function should produce output where each
 * course's course number is lexicographically less than or equal to the next
 * course's course number.
 */
describe('Property 8: Course list alphabetical ordering', () => {
  /**
   * Generator for course objects with { courseNumber: string, courseName: string }.
   * courseNumber uses alphanumeric + dots to mimic MIT course numbers (e.g., "6.042", "18.06").
   */
  const courseArb = fc.record({
    courseNumber: fc.stringOf(
      fc.constantFrom(
        ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.'.split('')
      ),
      { minLength: 1, maxLength: 20 }
    ),
    courseName: fc.string({ minLength: 1, maxLength: 100 }),
  });

  const courseListArb = fc.array(courseArb, { minLength: 0, maxLength: 50 });

  it('should produce output where each adjacent pair satisfies a.courseNumber <= b.courseNumber', () => {
    fc.assert(
      fc.property(courseListArb, (courses) => {
        const sorted = sortCoursesByNumber(courses);

        // Verify ordering invariant for all adjacent pairs
        for (let i = 0; i < sorted.length - 1; i++) {
          const current = sorted[i].courseNumber;
          const next = sorted[i + 1].courseNumber;
          expect(current.localeCompare(next)).toBeLessThanOrEqual(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all elements (no items lost or duplicated)', () => {
    fc.assert(
      fc.property(courseListArb, (courses) => {
        const sorted = sortCoursesByNumber(courses);

        // Same length
        expect(sorted.length).toBe(courses.length);

        // Same elements (by reference since sortCoursesByNumber returns copies of references)
        const sortedNumbers = sorted.map((c) => c.courseNumber).sort();
        const originalNumbers = [...courses.map((c) => c.courseNumber)].sort();
        expect(sortedNumbers).toEqual(originalNumbers);
      }),
      { numRuns: 100 }
    );
  });

  it('should not mutate the original array', () => {
    fc.assert(
      fc.property(courseListArb, (courses) => {
        const original = [...courses];
        sortCoursesByNumber(courses);

        // Original array should remain unchanged
        expect(courses).toEqual(original);
      }),
      { numRuns: 100 }
    );
  });

  it('should return an empty array when given an empty array', () => {
    const sorted = sortCoursesByNumber([]);
    expect(sorted).toEqual([]);
  });

  it('should handle a single-element array correctly', () => {
    fc.assert(
      fc.property(courseArb, (course) => {
        const sorted = sortCoursesByNumber([course]);
        expect(sorted).toEqual([course]);
      }),
      { numRuns: 100 }
    );
  });
});
