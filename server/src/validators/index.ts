/**
 * Server-side validation utilities for the Pyxis platform.
 *
 * Pure functions with no side effects — designed for testability
 * and reuse across route handlers and services.
 */

// --- Kerberos Validation ---

const KERBEROS_PATTERN = /^[a-z][a-z0-9_]{0,7}@mit\.edu$/;

/**
 * Validates that a string matches the MIT Kerberos identifier format.
 * Pattern: starts with lowercase letter, followed by 0–7 lowercase alphanumeric
 * or underscore characters, ending with @mit.edu.
 *
 * Total username portion: 1–8 characters.
 */
export function isValidKerberos(value: string): boolean {
  return KERBEROS_PATTERN.test(value);
}

// --- Course Validation ---

/**
 * Validates a course number: non-empty, max 20 characters.
 */
export function isValidCourseNumber(value: string): boolean {
  return value.length > 0 && value.length <= 20;
}

/**
 * Validates a course name: non-empty, max 100 characters.
 */
export function isValidCourseName(value: string): boolean {
  return value.length > 0 && value.length <= 100;
}

// --- Category Validation ---

/**
 * Validates a category name: non-empty, max 50 characters.
 */
export function isValidCategoryName(value: string): boolean {
  return value.length > 0 && value.length <= 50;
}

// --- File Validation ---

const MAX_FILE_SIZE = 52_428_800; // 50 MB in bytes
const MAX_BATCH_SIZE = 10;
const MAX_BULK_ADD_COUNT = 50;

/**
 * Validates that a file size is within the 50 MB limit.
 */
export function isValidFileSize(sizeInBytes: number): boolean {
  return sizeInBytes >= 0 && sizeInBytes <= MAX_FILE_SIZE;
}

/**
 * Validates that a batch of files does not exceed 10 files.
 */
export function isValidBatchSize(fileCount: number): boolean {
  return fileCount >= 1 && fileCount <= MAX_BATCH_SIZE;
}

/**
 * Validates that a bulk add operation does not exceed 50 identifiers.
 */
export function isValidBulkAddCount(count: number): boolean {
  return count >= 1 && count <= MAX_BULK_ADD_COUNT;
}

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
 */
export function classifyContentType(contentType: string): 'viewable' | 'download-only' {
  return VIEWABLE_CONTENT_TYPES.has(contentType) ? 'viewable' : 'download-only';
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

// --- Constants Export ---

export const VALIDATION_CONSTANTS = {
  MAX_FILE_SIZE,
  MAX_BATCH_SIZE,
  MAX_BULK_ADD_COUNT,
  MAX_COURSE_NUMBER_LENGTH: 20,
  MAX_COURSE_NAME_LENGTH: 100,
  MAX_CATEGORY_NAME_LENGTH: 50,
  MAX_MEMBER_NAME_DISPLAY_LENGTH: 30,
  MAX_FILENAME_DISPLAY_LENGTH: 80,
} as const;
