/**
 * Course service — handles course CRUD and search operations.
 */

import prisma from '../config/database.js';
import { AppError, ErrorCode } from '../types/index.js';
import { isValidCourseNumber, isValidCourseName } from '../validators/index.js';

/**
 * Pure sort function: sorts courses by courseNumber in ascending lexicographic order.
 * Returns a new sorted array without mutating the input.
 */
export function sortCoursesByNumber<T extends { courseNumber: string }>(
  courses: T[]
): T[] {
  return [...courses].sort((a, b) => a.courseNumber.localeCompare(b.courseNumber));
}

const DEFAULT_CATEGORIES = ['Exams', 'Problem_Sets', 'Lectures'];

/**
 * Returns all courses sorted alphabetically by courseNumber.
 */
export async function listCourses() {
  return prisma.course.findMany({
    orderBy: { courseNumber: 'asc' },
    include: {
      createdBy: {
        select: { name: true },
      },
    },
  });
}

/**
 * Returns courses where the search term is a case-insensitive substring
 * of either courseNumber or courseName.
 */
export async function searchCourses(term: string) {
  return prisma.course.findMany({
    where: {
      OR: [
        { courseNumber: { contains: term, mode: 'insensitive' } },
        { courseName: { contains: term, mode: 'insensitive' } },
      ],
    },
    orderBy: { courseNumber: 'asc' },
    include: {
      createdBy: {
        select: { name: true },
      },
    },
  });
}

/**
 * Creates a new course with three default categories.
 * Validates inputs and checks uniqueness before creating.
 *
 * @throws AppError VALIDATION_ERROR if inputs are invalid
 * @throws AppError COURSE_EXISTS if courseNumber already exists
 */
export async function createCourse(
  courseNumber: string,
  courseName: string,
  createdById: string
) {
  // Validate inputs
  const details: Record<string, string[]> = {};

  if (!isValidCourseNumber(courseNumber)) {
    details.courseNumber = ['Course number must be non-empty and at most 20 characters'];
  }

  if (!isValidCourseName(courseName)) {
    details.courseName = ['Course name must be non-empty and at most 100 characters'];
  }

  if (Object.keys(details).length > 0) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      422,
      'Invalid course data',
      details
    );
  }

  // Check uniqueness
  const existing = await prisma.course.findUnique({
    where: { courseNumber },
  });

  if (existing) {
    throw new AppError(
      ErrorCode.COURSE_EXISTS,
      409,
      'A course with this number already exists'
    );
  }

  // Create course with default categories in a transaction
  const course = await prisma.course.create({
    data: {
      courseNumber,
      courseName,
      createdById,
      categories: {
        create: DEFAULT_CATEGORIES.map((name) => ({
          name,
          isDefault: true,
        })),
      },
    },
    include: {
      categories: true,
      createdBy: {
        select: { name: true },
      },
    },
  });

  return course;
}

/**
 * Returns a course with its categories.
 *
 * @throws AppError VALIDATION_ERROR if course is not found
 */
export async function getCourseWithCategories(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      categories: {
        orderBy: { name: 'asc' },
      },
      createdBy: {
        select: { name: true },
      },
    },
  });

  if (!course) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      404,
      'Course not found'
    );
  }

  return course;
}
