/**
 * Pure utility functions for breadcrumb generation.
 * Extracted from the Breadcrumbs component for testability.
 */

export interface BreadcrumbSegment {
  label: string;
  path: string;
}

/**
 * Mapping of known route segments to human-readable labels.
 * Dynamic segments (course IDs, category IDs) are handled separately
 * via customLabels.
 */
export const SEGMENT_LABELS: Record<string, string> = {
  '': 'Home',
  stats: 'Stats',
  profile: 'Profile',
  admin: 'Admin',
  courses: 'Courses',
  categories: 'Categories',
};

/**
 * Segments that should be skipped in breadcrumb generation.
 * These are structural path parts that don't correspond to actual pages.
 * Their child segments will use the parent's path as a fallback.
 */
const SKIP_SEGMENTS = new Set(['courses', 'categories', 'files', 'years']);

/**
 * Generates an array of breadcrumb segments from a route pathname.
 *
 * The first segment is always { label: 'Home', path: '/' }.
 * Each subsequent segment is derived from the path components,
 * using customLabels for dynamic segments (e.g., course IDs),
 * SEGMENT_LABELS for known routes, or the raw decoded segment.
 *
 * Structural segments like "categories" are skipped since they don't have
 * their own page — the course page shows categories.
 *
 * @param pathname - The current route path (e.g., '/courses/abc/categories/def')
 * @param customLabels - Optional mapping of dynamic path segments to display labels
 * @returns Ordered array of breadcrumb segments with labels and paths
 */
export function generateBreadcrumbs(
  pathname: string,
  customLabels: Record<string, string> = {}
): BreadcrumbSegment[] {
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbSegment[] = [{ label: 'Home', path: '/' }];

  let currentPath = '';
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;

    // Skip structural segments that don't have their own route
    if (SKIP_SEGMENTS.has(segment)) {
      continue;
    }

    const label =
      (Object.prototype.hasOwnProperty.call(customLabels, segment) ? customLabels[segment] : undefined) ||
      SEGMENT_LABELS[segment] ||
      decodeURIComponent(segment);

    // For course IDs that follow "courses", link to the course page (not /courses)
    // For category IDs that follow "categories", link to the full path
    breadcrumbs.push({ label, path: currentPath });
  }

  return breadcrumbs;
}
