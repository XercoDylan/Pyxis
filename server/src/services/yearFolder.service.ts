/**
 * Year Folder service — business logic for year folder CRUD operations.
 *
 * Provides:
 *  - createYearFolder(courseId, year) — creates a year folder with 3 default categories in a transaction
 *  - listYearFolders(courseId) — returns year folders sorted descending by year with file count
 *  - getYearFolder(yearId) — returns a year folder with its categories
 *  - deleteYearFolder(yearId) — deletes a year folder (cascade handles children)
 *  - toggleCompletion(yearId, isComplete) — updates the completion status
 */

import { prisma } from '../config/database.js';
import { AppError, ErrorCode } from '../types/index.js';

const DEFAULT_CATEGORIES = ['Exams', 'Problem_Sets', 'Lectures'];

/**
 * Creates a new year folder with the 3 default categories atomically.
 *
 * Uses a Prisma transaction to ensure the year folder and its default
 * categories are created together or not at all.
 *
 * @throws AppError YEAR_EXISTS (409) if the course already has a folder for that year
 */
export async function createYearFolder(courseId: string, year: number) {
  try {
    const yearFolder = await prisma.$transaction(async (tx) => {
      const created = await tx.yearFolder.create({
        data: {
          courseId,
          year,
          categories: {
            create: DEFAULT_CATEGORIES.map((name) => ({
              name,
              isDefault: true,
            })),
          },
        },
        include: {
          categories: {
            orderBy: { name: 'asc' },
            select: {
              id: true,
              name: true,
              isDefault: true,
              createdAt: true,
            },
          },
        },
      });

      return created;
    });

    return yearFolder;
  } catch (error: unknown) {
    // Prisma unique constraint violation code
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new AppError(
        ErrorCode.YEAR_EXISTS,
        409,
        `A year folder for ${year} already exists in this course`
      );
    }
    throw error;
  }
}

/**
 * Returns all year folders for a course sorted by year descending,
 * including a file count aggregation across all categories.
 */
export async function listYearFolders(courseId: string) {
  const yearFolders = await prisma.yearFolder.findMany({
    where: { courseId },
    orderBy: { year: 'desc' },
    include: {
      categories: {
        select: {
          _count: {
            select: { files: true },
          },
        },
      },
    },
  });

  // Aggregate file counts across all categories for each year folder
  return yearFolders.map((yf) => {
    const fileCount = yf.categories.reduce(
      (sum, cat) => sum + cat._count.files,
      0
    );

    // Remove the raw categories aggregation from the response
    const { categories, ...rest } = yf;
    return { ...rest, fileCount };
  });
}

/**
 * Returns a single year folder with its categories sorted alphabetically.
 *
 * @throws AppError VALIDATION_ERROR (404) if year folder not found
 */
export async function getYearFolder(yearId: string) {
  const yearFolder = await prisma.yearFolder.findUnique({
    where: { id: yearId },
    include: {
      categories: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          isDefault: true,
          createdAt: true,
        },
      },
    },
  });

  if (!yearFolder) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      404,
      'Year folder not found'
    );
  }

  return yearFolder;
}

/**
 * Deletes a year folder by ID.
 * Cascade delete in the schema handles removing associated categories and files.
 *
 * @throws AppError VALIDATION_ERROR (404) if year folder not found
 */
export async function deleteYearFolder(yearId: string) {
  try {
    await prisma.yearFolder.delete({
      where: { id: yearId },
    });
  } catch (error: unknown) {
    // Prisma record not found code
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        404,
        'Year folder not found'
      );
    }
    throw error;
  }
}

/**
 * Updates the completion status of a year folder.
 *
 * @throws AppError VALIDATION_ERROR (404) if year folder not found
 */
export async function toggleCompletion(yearId: string, isComplete: boolean) {
  try {
    const yearFolder = await prisma.yearFolder.update({
      where: { id: yearId },
      data: { isComplete },
    });

    return yearFolder;
  } catch (error: unknown) {
    // Prisma record not found code
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        404,
        'Year folder not found'
      );
    }
    throw error;
  }
}
