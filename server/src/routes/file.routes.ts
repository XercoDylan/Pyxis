/**
 * File routes for file listing, upload, download, view, and ZIP download operations.
 *
 * All routes require authentication (requireAuth).
 *
 * GET /api/categories/:categoryId/files — List files (paginated, ?page=&limit=50)
 * GET /api/files/:fileId/download — Generate presigned download URL and redirect
 * GET /api/files/:fileId/view — Generate presigned view URL for inline viewing
 * GET /api/categories/:categoryId/download-zip — Download category as ZIP
 * GET /api/courses/:courseId/download-zip — Download course as ZIP
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listFiles, getFileById, generateUploadUrl, confirmUpload } from '../services/file.service.js';
import { generatePresignedDownloadUrl, generatePresignedViewUrl } from '../config/s3.js';
import { streamCategoryZip, streamCourseZip } from '../services/zip.service.js';

export const fileRouter = Router();

// All file routes require authentication
fileRouter.use(requireAuth);

/**
 * GET /api/categories/:categoryId/files
 * Returns a paginated list of files in the specified category.
 *
 * Query params:
 *  - page (default: 1)
 *  - limit (default: 50)
 *
 * Sorted by uploadedAt DESC, then filename ASC for ties.
 */
fileRouter.get(
  '/api/categories/:categoryId/files',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categoryId } = req.params;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const result = await listFiles(categoryId, page, limit);

      // Convert BigInt fileSize to number for JSON serialization
      const serializedItems = result.items.map((item) => ({
        ...item,
        fileSize: Number(item.fileSize),
      }));

      res.json({
        items: serializedItems,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        pageSize: result.pageSize,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/files/upload-url
 * Generates a presigned S3 PUT URL for file upload.
 * Body: { filename, contentType, fileSize, categoryId }
 */
fileRouter.post(
  '/api/files/upload-url',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filename, contentType, fileSize, categoryId } = req.body;
      const result = await generateUploadUrl(filename, contentType, fileSize, categoryId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/files/confirm
 * Confirms a completed upload by creating the file record in the database.
 * Body: { fileId, filename, s3Key, contentType, fileSize, categoryId }
 */
fileRouter.post(
  '/api/files/confirm',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileId, filename, s3Key, contentType, fileSize, categoryId } = req.body;
      const uploadedById = req.sessionData!.memberId;
      const file = await confirmUpload(fileId, filename, s3Key, contentType, fileSize, categoryId, uploadedById);
      res.status(201).json(file);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/files/:fileId
 * Returns file metadata.
 */
fileRouter.get(
  '/api/files/:fileId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileId } = req.params;
      const file = await getFileById(fileId);
      res.json({
        id: file.id,
        categoryId: file.categoryId,
        uploadedById: file.uploadedById,
        uploaderName: '',
        filename: file.filename,
        contentType: file.contentType,
        fileSize: Number(file.fileSize),
        uploadedAt: file.uploadedAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/files/:fileId/download
 * Generates a presigned S3 GET URL with Content-Disposition: attachment
 * (preserving the original filename) and redirects the client to it.
 */
fileRouter.get(
  '/api/files/:fileId/download',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileId } = req.params;
      const file = await getFileById(fileId);

      const presignedUrl = await generatePresignedDownloadUrl(
        file.s3Key,
        file.filename
      );

      res.redirect(presignedUrl);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/files/:fileId/view
 * Generates a presigned S3 GET URL with Content-Disposition: inline
 * for rendering the file in the browser. Returns the URL as JSON.
 */
fileRouter.get(
  '/api/files/:fileId/view',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileId } = req.params;
      const file = await getFileById(fileId);

      const presignedUrl = await generatePresignedViewUrl(file.s3Key);

      res.json({ url: presignedUrl });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/categories/:categoryId/download-zip
 * Streams a ZIP archive containing all files in the specified category.
 * The archive is named `{courseNumber}_{categoryName}.zip`.
 */
fileRouter.get(
  '/api/categories/:categoryId/download-zip',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categoryId } = req.params;
      await streamCategoryZip(categoryId, res);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/courses/:courseId/download-zip
 * Streams a ZIP archive containing all files in the specified course,
 * organized by category subdirectories.
 * The archive is named `{courseNumber}_all.zip`.
 */
fileRouter.get(
  '/api/courses/:courseId/download-zip',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      await streamCourseZip(courseId, res);
    } catch (err) {
      next(err);
    }
  }
);

export default fileRouter;
