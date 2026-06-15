import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { classifyContentType } from '../validators/index.ts';

/**
 * Feature: pyxis-course-materials, Property 13: File format classification
 *
 * Validates: Requirements 6.1, 6.5
 *
 * For any content type string, the format classification function should return
 * "viewable" if and only if the content type is one of: application/pdf, image/png,
 * image/jpeg, image/gif, or image/svg+xml. All other content types should be
 * classified as "download-only".
 */

const VIEWABLE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
] as const;

describe('Property 13: File format classification', () => {
  it('classifies application/pdf as viewable', () => {
    fc.assert(
      fc.property(fc.constant('application/pdf'), (contentType) => {
        expect(classifyContentType(contentType)).toBe('viewable');
      }),
      { numRuns: 100 },
    );
  });

  it('classifies image/png as viewable', () => {
    fc.assert(
      fc.property(fc.constant('image/png'), (contentType) => {
        expect(classifyContentType(contentType)).toBe('viewable');
      }),
      { numRuns: 100 },
    );
  });

  it('classifies image/jpeg as viewable', () => {
    fc.assert(
      fc.property(fc.constant('image/jpeg'), (contentType) => {
        expect(classifyContentType(contentType)).toBe('viewable');
      }),
      { numRuns: 100 },
    );
  });

  it('classifies image/gif as viewable', () => {
    fc.assert(
      fc.property(fc.constant('image/gif'), (contentType) => {
        expect(classifyContentType(contentType)).toBe('viewable');
      }),
      { numRuns: 100 },
    );
  });

  it('classifies image/svg+xml as viewable', () => {
    fc.assert(
      fc.property(fc.constant('image/svg+xml'), (contentType) => {
        expect(classifyContentType(contentType)).toBe('viewable');
      }),
      { numRuns: 100 },
    );
  });

  it('classifies any non-viewable content type as download-only', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !VIEWABLE_TYPES.includes(s as any)),
        (contentType) => {
          expect(classifyContentType(contentType)).toBe('download-only');
        },
      ),
      { numRuns: 100 },
    );
  });
});
