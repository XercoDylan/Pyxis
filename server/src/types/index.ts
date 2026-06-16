/**
 * Shared TypeScript types for the Pyxis backend.
 */

// --- Session ---

export interface SessionData {
  memberId: string;
  kerberos: string;
  name: string;
  isAdmin: boolean;
  createdAt: number; // Unix timestamp
}

// --- API Error Response ---

export interface ApiErrorBody {
  error: {
    code: string; // Machine-readable error code (e.g., "COURSE_EXISTS")
    message: string; // Human-readable message
    details?: Record<string, string[]>; // Field-level validation errors
  };
}

// --- Pagination ---

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// --- Application Error Codes ---

export const ErrorCode = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',
  COURSE_EXISTS: 'COURSE_EXISTS',
  CATEGORY_EXISTS: 'CATEGORY_EXISTS',
  YEAR_EXISTS: 'YEAR_EXISTS',
  INVALID_KERBEROS: 'INVALID_KERBEROS',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  BATCH_TOO_LARGE: 'BATCH_TOO_LARGE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  AUTH_UNAVAILABLE: 'AUTH_UNAVAILABLE',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

// --- Application Error Class ---

export class AppError extends Error {
  public readonly code: ErrorCodeValue;
  public readonly status: number;
  public readonly details?: Record<string, string[]>;

  constructor(
    code: ErrorCodeValue,
    status: number,
    message: string,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.name = 'AppError';

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Serialize to the standard API error response format.
   */
  toResponse(): ApiErrorBody {
    const body: ApiErrorBody = {
      error: {
        code: this.code,
        message: this.message,
      },
    };
    if (this.details) {
      body.error.details = this.details;
    }
    return body;
  }
}
