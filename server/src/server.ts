import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { sessionMiddleware } from './middleware/session.js';
import { authRouter } from './routes/auth.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { courseRouter } from './routes/course.routes.js';
import { yearFolderRouter } from './routes/yearFolder.routes.js';
import { categoryRouter } from './routes/category.routes.js';
import { fileRouter } from './routes/file.routes.js';
import { statsRouter } from './routes/stats.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Serve client static files in production FIRST (before any API middleware)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDistPath));
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sessionMiddleware);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication routes
app.use(authRouter);

// Admin routes
app.use(adminRouter);

// Course routes
app.use(courseRouter);

// Year folder routes
app.use(yearFolderRouter);

// Category routes
app.use(categoryRouter);

// File routes
app.use(fileRouter);

// Stats and member routes
app.use(statsRouter);

// Error handler
app.use(errorHandler);

// SPA fallback — serve index.html for any unmatched non-API route
if (process.env.NODE_ENV === 'production') {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Pyxis server running on port ${PORT}`);
  console.log(`Static files: ${clientDistPath}`);
});

export default app;
