import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getCategoryZipFilename, getCourseZipFilename } from '../validators/index.ts';

/**
 * Feature: pyxis-course-materials, Property 12: ZIP archive naming convention
 *
 * Validates: Requirements 6.3, 6.4
 *
 * For any course number and category name, the category ZIP should be named
 * "{courseNumber}_{categoryName}.zip", and the full-course ZIP should be named
 * "{courseNumber}_all.zip".
 */

describe('Property 12: ZIP archive naming convention', () => {
  it('getCategoryZipFilename returns exactly {courseNumber}_{categoryName}.zip', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (courseNumber, categoryName) => {
          const result = getCategoryZipFilename(courseNumber, categoryName);
          expect(result).toBe(`${courseNumber}_${categoryName}.zip`);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('getCourseZipFilename returns exactly {courseNumber}_all.zip', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (courseNumber) => {
          const result = getCourseZipFilename(courseNumber);
          expect(result).toBe(`${courseNumber}_all.zip`);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('category ZIP filename always ends with .zip', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (courseNumber, categoryName) => {
          const result = getCategoryZipFilename(courseNumber, categoryName);
          expect(result.endsWith('.zip')).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('course ZIP filename always ends with .zip', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (courseNumber) => {
          const result = getCourseZipFilename(courseNumber);
          expect(result.endsWith('.zip')).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('category ZIP filename always contains the course number as a prefix', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (courseNumber, categoryName) => {
          const result = getCategoryZipFilename(courseNumber, categoryName);
          expect(result.startsWith(courseNumber)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('course ZIP filename always contains the course number as a prefix', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (courseNumber) => {
          const result = getCourseZipFilename(courseNumber);
          expect(result.startsWith(courseNumber)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
