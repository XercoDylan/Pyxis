/**
 * Category service — business logic for category CRUD operations.
 *
 * Provides:
 *  - listCategories(courseId) — returns categories sorted alphabetically by name
 *  - createCategory(courseId, name) — validates, checks uniqueness, creates category
 */

import { prisma } from '../config/database.js';
import { isValidCategoryName } from '../validators/index.js';
import { AppError, ErrorCode } from '../types/index.js';

/**
 * Returns all categories for a given course, sorted alphabetically by name.
 */
export async function listCategories(courseId: string) {
  const categories = await prisma.category.findMany({
    where: { courseId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      isDefault: true,
      createdAt: true,
    },
  });

  return categories;
}

/**
 * Creates a new custom category within a course.
 *
 * Validates:
 *  - Category name is non-empty and at most 50 characters
 *  - Category name does not already exist within the same course
 *
 * Returns the created category record.
 */
export async function createCategory(courseId: string, name: string) {
  // Validate category name
  if (!isValidCategoryName(name)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      422,
      'Category name must be non-empty and at most 50 characters',
      { name: ['Must be non-empty and at most 50 characters'] }
    );
  }

  // Check uniqueness within the course
  const existing = await prisma.category.findUnique({
    where: {
      courseId_name: { courseId, name },
    },
  });

  if (existing) {
    throw new AppError(
      ErrorCode.CATEGORY_EXISTS,
      409,
      'This category already exists in this course'
    );
  }

  // Create the category (custom categories are not defaults)
  const category = await prisma.category.create({
    data: {
      courseId,
      name,
      isDefault: false,
    },
    select: {
      id: true,
      name: true,
      isDefault: true,
      createdAt: true,
    },
  });

  return category;
}
