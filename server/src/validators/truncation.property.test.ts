/**
 * Property 6: String truncation preserves prefix
 *
 * Feature: pyxis-course-materials, Property 6: String truncation preserves prefix
 * Validates: Requirements 3.3, 5.3
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { truncateString } from '../validators/index';

const ELLIPSIS = '\u2026';

describe('Feature: pyxis-course-materials, Property 6: String truncation preserves prefix', () => {
  it('returns the original string unchanged when length ≤ N', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.integer({ min: 1, max: 300 }),
        (str, maxLength) => {
          fc.pre(str.length <= maxLength);
          const result = truncateString(str, maxLength);
          expect(result).toBe(str);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns a string of exactly N characters when length > N', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 200 }),
        fc.integer({ min: 1, max: 199 }),
        (str, maxLength) => {
          fc.pre(str.length > maxLength);
          const result = truncateString(str, maxLength);
          expect(result.length).toBe(maxLength);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('result is the first (N-1) characters of the original followed by ellipsis when length > N', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 200 }),
        fc.integer({ min: 1, max: 199 }),
        (str, maxLength) => {
          fc.pre(str.length > maxLength);
          const result = truncateString(str, maxLength);
          const expectedPrefix = str.slice(0, maxLength - 1);
          expect(result).toBe(expectedPrefix + ELLIPSIS);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('result length is always ≤ N', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.integer({ min: 1, max: 300 }),
        (str, maxLength) => {
          const result = truncateString(str, maxLength);
          expect(result.length).toBeLessThanOrEqual(maxLength);
        },
      ),
      { numRuns: 100 },
    );
  });
});
