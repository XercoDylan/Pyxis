import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isValidYear, createYearFolderSchema } from './yearFolder.validator.js';

/**
 * Feature: year-subfolders, Property 1: Year value validation
 *
 * Validates: Requirements 1.4, 2.4
 *
 * For any integer value, isValidYear should return true if and only if the value
 * is between 2000 and 2100 inclusive. All values outside this range should be rejected.
 */

describe('Property 1: Year value validation', () => {
  it('valid years (2000-2100) are always accepted', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2000, max: 2100 }),
        (year) => {
          expect(isValidYear(year)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('years below 2000 are always rejected', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10000, max: 1999 }),
        (year) => {
          expect(isValidYear(year)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('years above 2100 are always rejected', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2101, max: 100000 }),
        (year) => {
          expect(isValidYear(year)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('non-integer numbers are always rejected', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -10000, max: 10000, noNaN: true, noDefaultInfinity: true })
          .filter((n) => !Number.isInteger(n)),
        (value) => {
          expect(isValidYear(value)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Zod schema accepts values consistently with isValidYear', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1900, max: 2200 }),
        (year) => {
          const zodResult = createYearFolderSchema.safeParse({ year });
          const validatorResult = isValidYear(year);

          expect(zodResult.success).toBe(validatorResult);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Zod schema rejects non-integer numbers consistently with isValidYear', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -10000, max: 10000, noNaN: true, noDefaultInfinity: true })
          .filter((n) => !Number.isInteger(n)),
        (value) => {
          const zodResult = createYearFolderSchema.safeParse({ year: value });
          const validatorResult = isValidYear(value);

          expect(zodResult.success).toBe(false);
          expect(validatorResult).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
