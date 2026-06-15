import apiClient from './client';
import { Course, Category } from '../types';

export interface CourseWithCategories extends Course {
  categories: Category[];
}

/**
 * Fetch all courses from the API.
 * Supports an optional search query parameter.
 */
export async function listCourses(search?: string): Promise<Course[]> {
  const response = await apiClient.get<{ courses: Course[] }>('/courses', {
    params: search ? { search } : undefined,
  });
  return response.data.courses;
}

/**
 * Create a new course.
 */
export async function createCourse(data: {
  courseNumber: string;
  courseName: string;
}): Promise<Course> {
  const response = await apiClient.post<{ course: Course }>('/courses', data);
  return response.data.course;
}

/**
 * Fetch a single course by ID, including its categories.
 */
export async function getCourse(courseId: string): Promise<CourseWithCategories> {
  const response = await apiClient.get<{ course: CourseWithCategories }>(`/courses/${courseId}`);
  return response.data.course;
}

// Keep backward-compatible alias
export { listCourses as fetchCourses };
