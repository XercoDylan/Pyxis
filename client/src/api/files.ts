import apiClient from './client';
import { CourseFile } from '../types';

export interface PaginatedFilesResponse {
  files: CourseFile[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface UploadUrlParams {
  filename: string;
  contentType: string;
  fileSize: number;
  categoryId: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileId: string;
  s3Key: string;
}

export interface ConfirmUploadParams {
  fileId: string;
  filename: string;
  s3Key: string;
  contentType: string;
  fileSize: number;
  categoryId: string;
}

/**
 * Fetch paginated files for a category.
 */
export async function listFiles(
  categoryId: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedFilesResponse> {
  const response = await apiClient.get<{ items: Array<any>; totalCount: number; totalPages: number; currentPage: number; pageSize: number }>(
    `/categories/${categoryId}/files`,
    { params: { page, limit } }
  );
  const { items, totalCount, totalPages, currentPage, pageSize } = response.data;
  // Map uploadedBy object to flat uploaderName string
  const files: CourseFile[] = items.map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    uploadedById: item.uploadedById,
    uploaderName: item.uploadedBy?.name || '',
    filename: item.filename,
    contentType: item.contentType,
    fileSize: item.fileSize,
    uploadedAt: item.uploadedAt,
  }));
  return { files, totalCount, totalPages, currentPage, pageSize };
}

/**
 * Fetch file metadata by ID.
 */
export async function fetchFileMetadata(fileId: string): Promise<CourseFile> {
  const response = await apiClient.get<CourseFile>(`/files/${fileId}`);
  return response.data;
}

/**
 * Request a presigned upload URL for a file.
 */
export async function getUploadUrl(params: UploadUrlParams): Promise<UploadUrlResponse> {
  const response = await apiClient.post<UploadUrlResponse>('/files/upload-url', params);
  return response.data;
}

/**
 * Confirm a completed file upload.
 */
export async function confirmUpload(params: ConfirmUploadParams): Promise<CourseFile> {
  const response = await apiClient.post<CourseFile>('/files/confirm', params);
  return response.data;
}

/**
 * Get a presigned download URL for a file.
 */
export async function getDownloadUrl(fileId: string): Promise<string> {
  const response = await apiClient.get<{ url: string }>(`/files/${fileId}/download`);
  return response.data.url;
}

/**
 * Get the view URL for inline file preview.
 * Returns a presigned URL suitable for embedding.
 */
export async function getViewUrl(fileId: string): Promise<string> {
  const response = await apiClient.get<{ url: string }>(`/files/${fileId}/view`);
  return response.data.url;
}

/**
 * Get the download URL for a category ZIP archive.
 */
export function downloadCategoryZip(categoryId: string): string {
  const baseURL = apiClient.defaults.baseURL || '/api';
  return `${baseURL}/categories/${categoryId}/download-zip`;
}

/**
 * Get the download URL for a full course ZIP archive.
 */
export function downloadCourseZip(courseId: string): string {
  const baseURL = apiClient.defaults.baseURL || '/api';
  return `${baseURL}/courses/${courseId}/download-zip`;
}

// Backward-compatible aliases
export { listFiles as fetchCategoryFiles };
export { getViewUrl as fetchFileViewUrl };
