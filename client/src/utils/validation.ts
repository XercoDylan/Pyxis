/**
 * Client-side validation utilities for the Pyxis platform.
 *
 * Pure functions with no side effects — mirrors server-side validation
 * for immediate UI feedback before requests are sent.
 */

// --- Kerberos Validation ---

const KERBEROS_PATTERN = /^[a-z][a-z0-9_]{0,7}@mit\.edu$/;

/**
 * Validates that a string matches the MIT Kerberos identifier format.
 * Pattern: starts with lowercase letter, followed by 0–7 lowercase alphanumeric
 * or underscore characters, ending with @mit.edu.
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

// --- Validation Constants ---

export const VALIDATION_CONSTANTS = {
  MAX_FILE_SIZE,
  MAX_BATCH_SIZE,
  MAX_COURSE_NUMBER_LENGTH: 20,
  MAX_COURSE_NAME_LENGTH: 100,
  MAX_CATEGORY_NAME_LENGTH: 50,
} as const;
