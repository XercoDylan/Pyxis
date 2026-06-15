/**
 * File service — handles presigned URL generation for uploads and file record creation.
 */

import { randomUUID } from 'crypto';
import prisma from '../config/database.js';
import { generatePresignedUploadUrl } from '../config/s3.js';
import { AppError, ErrorCode } from '../types/index.js';
import { isValidFileSize, isValidBatchSize } from '../validators/index.js';

/**
 * Generate a presigned PUT URL for uploading a file to S3.
 *
 * Validates file size, generates an S3 key using the format:
 *   uploads/{categoryId}/{uuid}/{filename}
 *
 * @returns { uploadUrl, fileId, s3Key }
 * @throws AppError FILE_TOO_LARGE if fileSize > 50 MB
 */
export async function generateUploadUrl(
  filename: string,
  contentType: string,
  fileSize: number,
  categoryId: string
): Promise<{ uploadUrl: string; fileId: string; s3Key: string }> {
  // Validate file size
  if (!isValidFileSize(fileSize)) {
    throw new AppError(
      ErrorCode.FILE_TOO_LARGE,
      413,
      'File exceeds the 50 MB size limit'
    );
  }

  const fileId = randomUUID();
  const s3Key = `uploads/${categoryId}/${fileId}/${filename}`;

  const uploadUrl = await generatePresignedUploadUrl(s3Key, contentType, fileSize);

  return { uploadUrl, fileId, s3Key };
}

/**
 * Confirm a file upload by creating a File record in the database.
 *
 * Called after the client has successfully uploaded to S3 using the presigned URL.
 */
export async function confirmUpload(
  fileId: string,
  filename: string,
  s3Key: string,
  contentType: string,
  fileSize: number,
  categoryId: string,
  uploadedById: string
) {
  const file = await prisma.file.create({
    data: {
      id: fileId,
      filename,
      s3Key,
      contentType,
      fileSize: BigInt(fileSize),
      categoryId,
      uploadedById,
    },
    include: {
      uploadedBy: {
        select: { name: true },
      },
    },
  });

  return {
    ...file,
    fileSize: Number(file.fileSize),
  };
}

/**
 * List files in a category with pagination.
 * Sorted by uploadedAt descending, then filename ascending.
 *
 * @param categoryId - The category to list files from
 * @param page - Page number (1-indexed)
 * @param limit - Items per page (default 50)
 */
export async function listFiles(
  categoryId: string,
  page: number = 1,
  limit: number = 50
) {
  const skip = (page - 1) * limit;

  const [files, totalCount] = await Promise.all([
    prisma.file.findMany({
      where: { categoryId },
      orderBy: [{ uploadedAt: 'desc' }, { filename: 'asc' }],
      skip,
      take: limit,
      include: {
        uploadedBy: {
          select: { name: true },
        },
      },
    }),
    prisma.file.count({ where: { categoryId } }),
  ]);

  return {
    items: files.map((f) => ({ ...f, fileSize: Number(f.fileSize) })),
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    pageSize: limit,
  };
}

/**
 * Get a file record by its ID.
 *
 * @throws AppError with 404 if not found
 */
export async function getFileById(fileId: string) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      404,
      'File not found'
    );
  }

  return file;
}

/**
 * Validate batch size for multi-file uploads.
 *
 * @throws AppError BATCH_TOO_LARGE if fileCount > 10
 */
export function validateBatchSize(fileCount: number): void {
  if (!isValidBatchSize(fileCount)) {
    throw new AppError(
      ErrorCode.BATCH_TOO_LARGE,
      422,
      'Maximum 10 files per upload'
    );
  }
}

/**
 * Pure pagination function that slices a list of items into pages.
 *
 * @param items - The full list of items to paginate
 * @param page - The 1-indexed page number to retrieve
 * @param pageSize - The maximum number of items per page
 * @returns A paginated response with items for the requested page and metadata
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; totalCount: number; totalPages: number; currentPage: number; pageSize: number } {
  const totalCount = items.length;
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = items.slice(start, end);

  return {
    items: pageItems,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
}
