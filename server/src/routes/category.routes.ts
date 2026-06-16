/**
 * Category routes for managing material categories within year folders.
 *
 * All routes require authentication (requireAuth).
 *
 * GET  /api/years/:yearId/categories — List categories for a year folder (alphabetically)
 * POST /api/years/:yearId/categories — Create a custom category within a year folder
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listCategories, createCategory } from '../services/category.service.js';
import { AppError, ErrorCode } from '../types/index.js';

export const categoryRouter = Router();

// All category routes require authentication
categoryRouter.use(requireAuth);

/**
 * GET /api/years/:yearId/categories
 * Returns all categories for the specified year folder, sorted alphabetically.
 */
categoryRouter.get(
  '/api/years/:yearId/categories',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { yearId } = req.params;
      const categories = await listCategories(yearId);
      res.json({ categories });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/years/:yearId/categories
 * Creates a new custom category within the specified year folder.
 *
 * Body: { name: string }
 */
categoryRouter.post(
  '/api/years/:yearId/categories',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { yearId } = req.params;
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
      const category = await createCategory(yearId, trimmedName);
      res.status(201).json({ category });
    } catch (err) {
      next(err);
    }
  }
);

export default categoryRouter;
