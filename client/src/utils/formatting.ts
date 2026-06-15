/**
 * Client-side formatting utilities for the Pyxis platform.
 *
 * Pure functions for display formatting — string truncation,
 * content type classification, and ZIP filename generation.
 */

// --- String Truncation ---

/**
 * Truncates a string to N characters. If the string length exceeds N,
 * returns the first (N-1) characters followed by the ellipsis character (…).
 * If the string length is ≤ N, returns the original string unchanged.
 */
export function truncateString(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength - 1) + '\u2026';
}

/**
 * Truncates a member display name to 30 characters.
 */
export function truncateMemberName(name: string): string {
  return truncateString(name, 30);
}

/**
 * Truncates a filename to 80 characters.
 */
export function truncateFilename(filename: string): string {
  return truncateString(filename, 80);
}

// --- Content Type Classification ---

const VIEWABLE_CONTENT_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
]);

/**
 * Classifies a content type as either "viewable" (inline preview) or "download-only".
 *
 * Viewable formats: PDF, PNG, JPEG, GIF, SVG
 * All other content types are download-only.
 */
export function classifyContentType(contentType: string): 'viewable' | 'download-only' {
  return VIEWABLE_CONTENT_TYPES.has(contentType) ? 'viewable' : 'download-only';
}

/**
 * Returns true if the content type can be rendered inline.
 */
export function isViewableContentType(contentType: string): boolean {
  return VIEWABLE_CONTENT_TYPES.has(contentType);
}

// --- ZIP Filename Generation ---

/**
 * Generates a ZIP filename for downloading all files in a category.
 * Format: {courseNumber}_{categoryName}.zip
 */
export function getCategoryZipFilename(courseNumber: string, categoryName: string): string {
  return `${courseNumber}_${categoryName}.zip`;
}

/**
 * Generates a ZIP filename for downloading all files in a course.
 * Format: {courseNumber}_all.zip
 */
export function getCourseZipFilename(courseNumber: string): string {
  return `${courseNumber}_all.zip`;
}

// --- Display Constants ---

export const DISPLAY_CONSTANTS = {
  MAX_MEMBER_NAME_DISPLAY_LENGTH: 30,
  MAX_FILENAME_DISPLAY_LENGTH: 80,
} as const;
