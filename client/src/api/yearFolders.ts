import apiClient from './client';
import { YearFolder, YearFolderWithCategories } from '../types';

/**
 * Fetch all year folders for a course, sorted by year descending.
 */
export async function getYearFolders(courseId: string): Promise<YearFolder[]> {
  const response = await apiClient.get<{ yearFolders: YearFolder[] }>(
    `/courses/${courseId}/years`
  );
  return response.data.yearFolders;
}

/**
 * Create a new year folder for a course.
 * Auto-creates default categories (Exams, Problem_Sets, Lectures).
 */
export async function createYearFolder(
  courseId: string,
  year: number
): Promise<YearFolderWithCategories> {
  const response = await apiClient.post<{ yearFolder: YearFolderWithCategories }>(
    `/courses/${courseId}/years`,
    { year }
  );
  return response.data.yearFolder;
}

/**
 * Fetch a single year folder by ID, including its categories.
 */
export async function getYearFolder(
  yearId: string
): Promise<YearFolderWithCategories> {
  const response = await apiClient.get<{ yearFolder: YearFolderWithCategories }>(
    `/years/${yearId}`
  );
  return response.data.yearFolder;
}

/**
 * Delete a year folder. Cascades to all categories and files within.
 */
export async function deleteYearFolder(yearId: string): Promise<void> {
  await apiClient.delete(`/years/${yearId}`);
}

/**
 * Toggle the completion status of a year folder.
 */
export async function toggleYearCompletion(
  yearId: string,
  isComplete: boolean
): Promise<YearFolder> {
  const response = await apiClient.patch<{ yearFolder: YearFolder }>(
    `/years/${yearId}/completion`,
    { isComplete }
  );
  return response.data.yearFolder;
}
