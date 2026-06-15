/**
 * Property 16: Course and category input validation
 * Feature: pyxis-course-materials, Property 16: Course and category input validation
 *
 * Validates: Requirements 8.3, 8.5
 *
 * Properties:
 * 1. For any non-empty string of length 1-20, isValidCourseNumber returns true
 * 2. For empty string or string > 20 chars, isValidCourseNumber returns false
 * 3. For any non-empty string of length 1-100, isValidCourseName returns true
 * 4. For empty string or string > 100 chars, isValidCourseName returns false
 * 5. For any non-empty string of length 1-50, isValidCategoryName returns true
 * 6. For empty string or string > 50 chars, isValidCategoryName returns false
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isValidCourseNumber,
  isValidCourseName,
  isValidCategoryName,
} from '../validators/index';

describe('Feature: pyxis-course-materials, Property 16: Course and category input validation', () => {
  describe('isValidCourseNumber', () => {
    it('accepts any non-empty string of length 1-20', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          (input) => {
            expect(isValidCourseNumber(input)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects empty string', () => {
      expect(isValidCourseNumber('')).toBe(false);
    });

    it('rejects strings exceeding 20 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 21, maxLength: 200 }),
          (input) => {
            expect(isValidCourseNumber(input)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidCourseName', () => {
    it('accepts any non-empty string of length 1-100', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (input) => {
            expect(isValidCourseName(input)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects empty string', () => {
      expect(isValidCourseName('')).toBe(false);
    });

    it('rejects strings exceeding 100 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 300 }),
          (input) => {
            expect(isValidCourseName(input)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidCategoryName', () => {
    it('accepts any non-empty string of length 1-50', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (input) => {
            expect(isValidCategoryName(input)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects empty string', () => {
      expect(isValidCategoryName('')).toBe(false);
    });

    it('rejects strings exceeding 50 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 51, maxLength: 200 }),
          (input) => {
            expect(isValidCategoryName(input)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
