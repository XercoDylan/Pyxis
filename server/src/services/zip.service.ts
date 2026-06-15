/**
 * ZIP service — handles streaming ZIP archive generation for category and course downloads.
 *
 * Uses the `archiver` library to create ZIP archives streamed directly to the HTTP response,
 * avoiding loading all files into memory at once.
 */

import { Response } from 'express';
import archiver from 'archiver';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import prisma from '../config/database.js';
import { s3Client, BUCKET_NAME } from '../config/s3.js';
import { AppError, ErrorCode } from '../types/index.js';
import { getCategoryZipFilename, getCourseZipFilename } from '../validators/index.js';

/**
 * Fetch a file from S3 and return it as a readable stream.
 */
async function getS3Stream(s3Key: string): Promise<Readable> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error(`Empty response body for key: ${s3Key}`);
  }

  return response.Body as Readable;
}

/**
 * Stream a ZIP archive of all files in a category to the HTTP response.
 *
 * The ZIP is named `{courseNumber}_{categoryName}.zip`.
 * Files are placed at the root level of the archive.
 *
 * @param categoryId - The category whose files to include
 * @param res - The Express response to stream the ZIP to
 */
export async function streamCategoryZip(categoryId: string, res: Response): Promise<void> {
  // Fetch category with its course and files
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      course: true,
      files: {
        select: { filename: true, s3Key: true },
      },
    },
  });

  if (!category) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 404, 'Category not found');
  }

  const zipFilename = getCategoryZipFilename(category.course.courseNumber, category.name);

  // Set response headers for ZIP download
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

  const archive = archiver('zip', { zlib: { level: 5 } });

  // Handle archiver errors
  archive.on('error', () => {
    // If headers already sent, we can't change the response status
    if (!res.headersSent) {
      res.status(503).json({
        error: {
          code: ErrorCode.STORAGE_ERROR,
          message: 'File storage is temporarily unavailable. Please try again.',
        },
      });
    } else {
      // Destroy the response to signal an incomplete download
      res.destroy();
    }
  });

  // Pipe the archive to the response
  archive.pipe(res);

  // Append each file from S3 into the archive
  for (const file of category.files) {
    try {
      const stream = await getS3Stream(file.s3Key);
      archive.append(stream, { name: file.filename });
    } catch {
      // If we can't fetch a file, abort gracefully
      if (!res.headersSent) {
        archive.abort();
        throw new AppError(
          ErrorCode.STORAGE_ERROR,
          503,
          'File storage is temporarily unavailable. Please try again.'
        );
      }
      // If headers already sent, skip this file and continue
    }
  }

  // Finalize the archive (this triggers the end of the stream)
  await archive.finalize();
}

/**
 * Stream a ZIP archive of all files in a course, organized by category subdirectories.
 *
 * The ZIP is named `{courseNumber}_all.zip`.
 * Files are placed in subdirectories named after their category.
 *
 * @param courseId - The course whose files to include
 * @param res - The Express response to stream the ZIP to
 */
export async function streamCourseZip(courseId: string, res: Response): Promise<void> {
  // Fetch course with all categories and their files
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      categories: {
        include: {
          files: {
            select: { filename: true, s3Key: true },
          },
        },
      },
    },
  });

  if (!course) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 404, 'Course not found');
  }

  const zipFilename = getCourseZipFilename(course.courseNumber);

  // Set response headers for ZIP download
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

  const archive = archiver('zip', { zlib: { level: 5 } });

  // Handle archiver errors
  archive.on('error', () => {
    if (!res.headersSent) {
      res.status(503).json({
        error: {
          code: ErrorCode.STORAGE_ERROR,
          message: 'File storage is temporarily unavailable. Please try again.',
        },
      });
    } else {
      res.destroy();
    }
  });

  // Pipe the archive to the response
  archive.pipe(res);

  // Append files organized by category subdirectory
  for (const category of course.categories) {
    for (const file of category.files) {
      try {
        const stream = await getS3Stream(file.s3Key);
        archive.append(stream, { name: `${category.name}/${file.filename}` });
      } catch {
        if (!res.headersSent) {
          archive.abort();
          throw new AppError(
            ErrorCode.STORAGE_ERROR,
            503,
            'File storage is temporarily unavailable. Please try again.'
          );
        }
      }
    }
  }

  // Finalize the archive
  await archive.finalize();
}
