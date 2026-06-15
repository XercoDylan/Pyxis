/**
 * Category routes for managing material categories within courses.
 *
 * All routes require authentication (requireAuth).
 *
 * GET  /api/courses/:courseId/categories — List categories for a course (alphabetically)
 * POST /api/courses/:courseId/categories — Create a custom category
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listCategories, createCategory } from '../services/category.service.js';
import { AppError, ErrorCode } from '../types/index.js';

export const categoryRouter = Router();

// All category routes require authentication
categoryRouter.use(requireAuth);

/**
 * GET /api/courses/:courseId/categories
 * Returns all categories for the specified course, sorted alphabetically.
 */
categoryRouter.get(
  '/api/courses/:courseId/categories',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const categories = await listCategories(courseId);
      res.json({ categories });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/courses/:courseId/categories
 * Creates a new custom category within the specified course.
 *
 * Body: { name: string }
 */
categoryRouter.post(
  '/api/courses/:courseId/categories',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const { name } = req.body;

      if (!name || typeof name !== 'string') {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          422,
          'Category name is required',
          { name: ['Required'] }
        );
      }

      const trimmedName = name.trim();
      const category = await createCategory(courseId, trimmedName);
      res.status(201).json({ category });
    } catch (err) {
      next(err);
    }
  }
);

export default categoryRouter;
