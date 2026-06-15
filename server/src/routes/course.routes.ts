/**
 * Course routes.
 *
 * All routes require authentication (requireAuth).
 *
 * GET  /api/courses          — List all courses (supports ?search= query)
 * POST /api/courses          — Create a new course folder
 * GET  /api/courses/:courseId — Get course details with categories
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listCourses,
  searchCourses,
  createCourse,
  getCourseWithCategories,
} from '../services/course.service.js';

export const courseRouter = Router();

// Apply auth middleware to all course routes
courseRouter.use(requireAuth);

/**
 * GET /api/courses
 * Returns all courses sorted alphabetically by course number.
 * If ?search= is provided, filters by case-insensitive substring match
 * on courseNumber or courseName.
 */
courseRouter.get(
  '/api/courses',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const search = req.query.search;

      if (search && typeof search === 'string' && search.trim().length > 0) {
        const courses = await searchCourses(search.trim());
        res.json({ courses });
        return;
      }

      const courses = await listCourses();
      res.json({ courses });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/courses
 * Creates a new course folder with default categories.
 *
 * Body: { courseNumber: string, courseName: string }
 */
courseRouter.post(
  '/api/courses',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseNumber, courseName } = req.body;
      const createdById = req.sessionData!.memberId;

      const course = await createCourse(
        courseNumber ?? '',
        courseName ?? '',
        createdById
      );

      res.status(201).json({ course });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/courses/:courseId
 * Returns a single course with its categories.
 */
courseRouter.get(
  '/api/courses/:courseId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const course = await getCourseWithCategories(courseId);
      res.json({ course });
    } catch (err) {
      next(err);
    }
  }
);

export default courseRouter;
