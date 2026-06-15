/**
 * Shared TypeScript types for the Pyxis client application.
 */

export interface Course {
  id: string;
  courseNumber: string;
  courseName: string;
  createdById: string;
  createdAt: string;
}

export interface Category {
  id: string;
  courseId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CourseFile {
  id: string;
  categoryId: string;
  uploadedById: string;
  uploaderName: string;
  filename: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface Member {
  id: string;
  kerberos: string;
  name: string;
  email: string;
  isAdmin: boolean;
  joinedAt: string;
  lastLoginAt: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
