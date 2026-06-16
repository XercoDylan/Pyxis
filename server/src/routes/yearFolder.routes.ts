/**
 * Year Folder routes for managing year-based organization within courses.
 *
 * All routes require authentication (requireAuth).
 *
 * GET    /api/courses/:courseId/years       — List year folders for a course (descending by year)
 * POST   /api/courses/:courseId/years       — Create a year folder (auto-creates default categories)
 * GET    /api/years/:yearId                 — Get a single year folder with its categories
 * DELETE /api/years/:yearId                 — Delete a year folder (cascades to categories and files)
 * PATCH  /api/years/:yearId/completion      — Toggle completion status
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createYearFolder,
  listYearFolders,
  getYearFolder,
  deleteYearFolder,
  toggleCompletion,
} from '../services/yearFolder.service.js';
import {
  createYearFolderSchema,
  toggleCompletionSchema,
} from '../validators/yearFolder.validator.js';
import { AppError, ErrorCode } from '../types/index.js';

export const yearFolderRouter = Router();

// All year folder routes require authentication
yearFolderRouter.use(requireAuth);

/**
 * GET /api/courses/:courseId/years
 * Returns all year folders for the specified course, sorted by year descending.
 */
yearFolderRouter.get(
  '/api/courses/:courseId/years',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const yearFolders = await listYearFolders(courseId);
      res.json({ yearFolders });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/courses/:courseId/years
 * Creates a new year folder within the specified course.
 *
 * Body: { year: number }
 */
yearFolderRouter.post(
  '/api/courses/:courseId/years',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;

      const result = createYearFolderSchema.safeParse(req.body);
      if (!result.success) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of result.error.issues) {
          const field = issue.path.join('.');
          if (!fieldErrors[field]) {
            fieldErrors[field] = [];
          }
          fieldErrors[field].push(issue.message);
        }
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          422,
          'Validation failed',
          fieldErrors
        );
      }

      const yearFolder = await createYearFolder(courseId, result.data.year);
      res.status(201).json({ yearFolder });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/years/:yearId
 * Returns a single year folder with its categories.
 */
yearFolderRouter.get(
  '/api/years/:yearId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { yearId } = req.params;
      const yearFolder = await getYearFolder(yearId);
      res.json({ yearFolder });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/years/:yearId
 * Deletes a year folder (cascade handles removing categories and files).
 */
yearFolderRouter.delete(
  '/api/years/:yearId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { yearId } = req.params;
      await deleteYearFolder(yearId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/years/:yearId/completion
 * Toggles the completion status of a year folder.
 *
 * Body: { isComplete: boolean }
 */
yearFolderRouter.patch(
  '/api/years/:yearId/completion',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { yearId } = req.params;

      const result = toggleCompletionSchema.safeParse(req.body);
      if (!result.success) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of result.error.issues) {
          const field = issue.path.join('.');
          if (!fieldErrors[field]) {
            fieldErrors[field] = [];
          }
          fieldErrors[field].push(issue.message);
        }
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          422,
          'Validation failed',
          fieldErrors
        );
      }

      const yearFolder = await toggleCompletion(yearId, result.data.isComplete);
      res.json({ yearFolder });
    } catch (err) {
      next(err);
    }
  }
);

export default yearFolderRouter;
