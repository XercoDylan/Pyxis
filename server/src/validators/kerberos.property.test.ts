import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isValidKerberos } from './index';

/**
 * Feature: pyxis-course-materials, Property 4: Kerberos format validation
 *
 * Validates: Requirements 2.5
 *
 * For any string that matches `^[a-z][a-z0-9_]{0,7}@mit.edu$`, the validation
 * function should accept it. For any string that does not match, the validation
 * function should reject it.
 */
describe('Property 4: Kerberos format validation', () => {
  const KERBEROS_PATTERN = /^[a-z][a-z0-9_]{0,7}@mit\.edu$/;

  /**
   * Generator for valid Kerberos strings:
   * - Starts with a lowercase letter [a-z]
   * - Followed by 0–7 characters from [a-z0-9_]
   * - Ends with @mit.edu
   */
  const validKerberosArb = fc
    .tuple(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
      fc.array(
        fc.constantFrom(
          ...'abcdefghijklmnopqrstuvwxyz0123456789_'.split('')
        ),
        { minLength: 0, maxLength: 7 }
      )
    )
    .map(([first, rest]) => `${first}${rest.join('')}@mit.edu`);

  /**
   * Generator for invalid Kerberos strings that specifically violate the pattern.
   * Covers: uppercase start, digits start, too long username, missing @mit.edu,
   * wrong domain, empty string, special characters in username, etc.
   */
  const invalidKerberosArb = fc.oneof(
    // Starts with uppercase letter
    fc
      .tuple(
        fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')),
        fc.array(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_'.split('')),
          { minLength: 0, maxLength: 7 }
        )
      )
      .map(([first, rest]) => `${first}${rest.join('')}@mit.edu`),

    // Starts with digit
    fc
      .tuple(
        fc.constantFrom(...'0123456789'.split('')),
        fc.array(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_'.split('')),
          { minLength: 0, maxLength: 7 }
        )
      )
      .map(([first, rest]) => `${first}${rest.join('')}@mit.edu`),

    // Username too long (> 8 total chars before @mit.edu)
    fc
      .tuple(
        fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
        fc.array(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_'.split('')),
          { minLength: 8, maxLength: 20 }
        )
      )
      .map(([first, rest]) => `${first}${rest.join('')}@mit.edu`),

    // Missing @mit.edu suffix (valid username but wrong domain)
    fc
      .tuple(
        fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
        fc.array(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_'.split('')),
          { minLength: 0, maxLength: 7 }
        ),
        fc.constantFrom('@gmail.com', '@harvard.edu', '@mit.com', '@mit.ed', '')
      )
      .map(([first, rest, suffix]) => `${first}${rest.join('')}${suffix}`),

    // Contains invalid characters in username portion
    fc
      .tuple(
        fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
        fc.array(
          fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()-+= '.split('')),
          { minLength: 1, maxLength: 7 }
        )
      )
      .map(([first, rest]) => `${first}${rest.join('')}@mit.edu`),

    // Empty string
    fc.constant(''),

    // Just the domain
    fc.constant('@mit.edu')
  );

  it('should accept all strings matching the Kerberos pattern', () => {
    fc.assert(
      fc.property(validKerberosArb, (kerberos) => {
        // Sanity check: our generator produces valid patterns
        expect(KERBEROS_PATTERN.test(kerberos)).toBe(true);
        // The function should accept it
        expect(isValidKerberos(kerberos)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject all strings that do not match the Kerberos pattern', () => {
    fc.assert(
      fc.property(invalidKerberosArb, (input) => {
        // Sanity check: our generator produces invalid patterns
        expect(KERBEROS_PATTERN.test(input)).toBe(false);
        // The function should reject it
        expect(isValidKerberos(input)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject arbitrary strings that do not match the pattern', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const matchesPattern = KERBEROS_PATTERN.test(input);
        const result = isValidKerberos(input);
        // The function's output must agree with the pattern
        expect(result).toBe(matchesPattern);
      }),
      { numRuns: 100 }
    );
  });
});
