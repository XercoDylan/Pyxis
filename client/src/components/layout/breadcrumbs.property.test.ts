import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateBreadcrumbs } from './breadcrumbs.utils';

/**
 * Feature: pyxis-course-materials, Property 21: Breadcrumb generation from route path
 *
 * Validates: Requirements 11.2
 *
 * For any valid navigation path consisting of [Home], [Home, Course], or
 * [Home, Course, Category], the breadcrumb function should produce an ordered
 * list of segments matching the path components, where each segment contains
 * a label and a valid navigation link.
 */
describe('Property 21: Breadcrumb generation from route path', () => {
  /**
   * Generator for valid path segment strings.
   * Generates alphanumeric strings with hyphens/underscores to mimic
   * real URL segments (e.g., course IDs, category names, UUIDs).
   */
  const pathSegmentArb = fc.stringOf(
    fc.constantFrom(
      ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split(
        ''
      )
    ),
    { minLength: 1, maxLength: 20 }
  );

  /**
   * Generator for valid route paths built from sequences of path segments.
   * Produces paths like '/courses/abc/categories/def'.
   */
  const pathArb = fc
    .array(pathSegmentArb, { minLength: 0, maxLength: 6 })
    .map((segments) => '/' + segments.join('/'));

  /**
   * Generator for custom labels: a record mapping segment strings to label strings.
   */
  const customLabelsArb = fc.dictionary(
    pathSegmentArb,
    fc.string({ minLength: 1, maxLength: 50 })
  );

  it('first segment is always { label: "Home", path: "/" }', () => {
    fc.assert(
      fc.property(pathArb, customLabelsArb, (pathname, customLabels) => {
        const breadcrumbs = generateBreadcrumbs(pathname, customLabels);

        expect(breadcrumbs[0]).toEqual({ label: 'Home', path: '/' });
      }),
      { numRuns: 100 }
    );
  });

  it('each segment path is a prefix of the next segment path (cumulative paths)', () => {
    fc.assert(
      fc.property(pathArb, customLabelsArb, (pathname, customLabels) => {
        const breadcrumbs = generateBreadcrumbs(pathname, customLabels);

        for (let i = 0; i < breadcrumbs.length - 1; i++) {
          const currentPath = breadcrumbs[i].path;
          const nextPath = breadcrumbs[i + 1].path;

          // The current segment's path should be a prefix of the next one
          // Home '/' is a prefix of everything; '/courses' is a prefix of '/courses/abc', etc.
          expect(nextPath.startsWith(currentPath === '/' ? '/' : currentPath + '/')).toBe(
            true
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it('number of segments equals 1 + number of path segments (for non-root paths)', () => {
    fc.assert(
      fc.property(pathArb, customLabelsArb, (pathname, customLabels) => {
        const breadcrumbs = generateBreadcrumbs(pathname, customLabels);

        // Count non-empty path segments from the pathname
        const pathSegments = pathname.split('/').filter(Boolean);
        const expectedLength = 1 + pathSegments.length; // 1 for Home + path segments

        expect(breadcrumbs.length).toBe(expectedLength);
      }),
      { numRuns: 100 }
    );
  });

  it('all segments have non-empty labels and non-empty paths', () => {
    fc.assert(
      fc.property(pathArb, customLabelsArb, (pathname, customLabels) => {
        const breadcrumbs = generateBreadcrumbs(pathname, customLabels);

        for (const segment of breadcrumbs) {
          expect(segment.label.length).toBeGreaterThan(0);
          expect(segment.path.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});
