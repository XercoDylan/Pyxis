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
import multer from 'multer';
import { randomUUID } from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAuth } from '../middleware/auth.js';
import { listFiles, getFileById, confirmUpload } from '../services/file.service.js';
import { generatePresignedDownloadUrl, generatePresignedViewUrl, s3Client, BUCKET_NAME } from '../config/s3.js';
import { streamCategoryZip, streamCourseZip } from '../services/zip.service.js';
import { isValidFileSize, isValidBatchSize } from '../validators/index.js';
import { AppError, ErrorCode } from '../types/index.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 52_428_800 } });

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
 * POST /api/files/upload
 * Direct file upload — server receives file and uploads to S3.
 * Multipart form: file (the file), categoryId (form field)
 */
fileRouter.post(
  '/api/files/upload',
  upload.array('files', 10),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categoryId } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 422, 'No files provided');
      }

      if (!isValidBatchSize(files.length)) {
        throw new AppError(ErrorCode.BATCH_TOO_LARGE, 422, 'Maximum 10 files per upload');
      }

      const uploadedById = req.sessionData!.memberId;
      const results: any[] = [];

      for (const file of files) {
        if (!isValidFileSize(file.size)) {
          results.push({ filename: file.originalname, error: 'File exceeds 50 MB limit' });
          continue;
        }

        const fileId = randomUUID();
        const s3Key = `uploads/${categoryId}/${fileId}/${file.originalname}`;

        // Upload to S3 server-side
        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }));

        // Create database record
        const record = await confirmUpload(
          fileId, file.originalname, s3Key,
          file.mimetype, file.size, categoryId, uploadedById
        );

        results.push(record);
      }

      res.status(201).json({ files: results });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/files/upload-url (legacy — kept for compatibility)
 */
fileRouter.post(
  '/api/files/upload-url',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { filename, contentType, fileSize, categoryId } = req.body;
      const { generateUploadUrl } = await import('../services/file.service.js');
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
