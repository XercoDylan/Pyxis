import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isValidFileSize, isValidBatchSize } from './index';

/**
 * Feature: pyxis-course-materials, Property 14: Upload size and batch validation
 *
 * Validates: Requirements 7.2, 7.4
 */

const MAX_FILE_SIZE = 52_428_800; // 50 MB in bytes
const MAX_BATCH_SIZE = 10;

describe('Property 14: Upload size and batch validation', () => {
  describe('isValidFileSize', () => {
    it('accepts any file size between 0 and 52,428,800 bytes (inclusive)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: MAX_FILE_SIZE }),
          (size) => {
            expect(isValidFileSize(size)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects any file size greater than 52,428,800 bytes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MAX_FILE_SIZE + 1, max: Number.MAX_SAFE_INTEGER }),
          (size) => {
            expect(isValidFileSize(size)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidBatchSize', () => {
    it('accepts any batch size between 1 and 10 (inclusive)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MAX_BATCH_SIZE }),
          (count) => {
            expect(isValidBatchSize(count)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('rejects any batch size greater than 10 or less than 1', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: -1000, max: 0 }),
            fc.integer({ min: MAX_BATCH_SIZE + 1, max: 10000 })
          ),
          (count) => {
            expect(isValidBatchSize(count)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
