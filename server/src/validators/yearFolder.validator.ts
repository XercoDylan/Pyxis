/**
 * Year Folder validation schemas and utility functions.
 *
 * Uses Zod for schema-based validation of year folder inputs.
 * Pure functions with no side effects — designed for testability
 * and reuse across route handlers and services.
 */

import { z } from 'zod';

// --- Year Folder Creation Schema ---

/**
 * Schema for creating a year folder.
 * Validates that the year is an integer between 2000 and 2100 inclusive.
 */
export const createYearFolderSchema = z.object({
  year: z
    .number()
    .int({ message: 'Year must be an integer' })
    .min(2000, { message: 'Year must be at least 2000' })
    .max(2100, { message: 'Year must be at most 2100' }),
});

// --- Completion Toggle Schema ---

/**
 * Schema for toggling the completion status of a year folder.
 * Validates that isComplete is a boolean value.
 */
export const toggleCompletionSchema = z.object({
  isComplete: z.boolean({ message: 'isComplete is required and must be a boolean' }),
});

// --- Pure Validation Functions ---

/**
 * Validates that a year value is an integer between 2000 and 2100 inclusive.
 * Pure function alternative for contexts where Zod parsing is not needed.
 */
export function isValidYear(value: number): boolean {
  return Number.isInteger(value) && value >= 2000 && value <= 2100;
}

// --- Type Exports ---

export type CreateYearFolderInput = z.infer<typeof createYearFolderSchema>;
export type ToggleCompletionInput = z.infer<typeof toggleCompletionSchema>;
