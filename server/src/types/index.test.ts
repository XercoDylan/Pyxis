import { describe, it, expect } from 'vitest';
import { AppError, ErrorCode } from './index.js';

describe('AppError', () => {
  it('creates an error with code, status, and message', () => {
    const error = new AppError(ErrorCode.COURSE_EXISTS, 409, 'A course with this number already exists');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('COURSE_EXISTS');
    expect(error.status).toBe(409);
    expect(error.message).toBe('A course with this number already exists');
    expect(error.name).toBe('AppError');
    expect(error.details).toBeUndefined();
  });

  it('creates an error with field-level validation details', () => {
    const details = {
      courseNumber: ['Course number is required'],
      courseName: ['Course name must be at most 100 characters'],
    };
    const error = new AppError(ErrorCode.VALIDATION_ERROR, 422, 'Validation failed', details);

    expect(error.details).toEqual(details);
  });

  it('serializes to the API error response format without details', () => {
    const error = new AppError(ErrorCode.FILE_TOO_LARGE, 413, 'File exceeds the 50 MB size limit');
    const response = error.toResponse();

    expect(response).toEqual({
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'File exceeds the 50 MB size limit',
      },
    });
  });

  it('serializes to the API error response format with details', () => {
    const details = { kerberos: ['Invalid Kerberos identifier: bad@value'] };
    const error = new AppError(ErrorCode.INVALID_KERBEROS, 422, 'Invalid kerberos format', details);
    const response = error.toResponse();

    expect(response).toEqual({
      error: {
        code: 'INVALID_KERBEROS',
        message: 'Invalid kerberos format',
        details: { kerberos: ['Invalid Kerberos identifier: bad@value'] },
      },
    });
  });

  it('maintains proper prototype chain for instanceof checks', () => {
    const error = new AppError(ErrorCode.INTERNAL_ERROR, 500, 'Something went wrong');
    expect(error instanceof AppError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});

describe('ErrorCode', () => {
  it('contains all expected error codes', () => {
    expect(ErrorCode.AUTH_REQUIRED).toBe('AUTH_REQUIRED');
    expect(ErrorCode.ACCESS_DENIED).toBe('ACCESS_DENIED');
    expect(ErrorCode.ADMIN_REQUIRED).toBe('ADMIN_REQUIRED');
    expect(ErrorCode.COURSE_EXISTS).toBe('COURSE_EXISTS');
    expect(ErrorCode.CATEGORY_EXISTS).toBe('CATEGORY_EXISTS');
    expect(ErrorCode.INVALID_KERBEROS).toBe('INVALID_KERBEROS');
    expect(ErrorCode.FILE_TOO_LARGE).toBe('FILE_TOO_LARGE');
    expect(ErrorCode.BATCH_TOO_LARGE).toBe('BATCH_TOO_LARGE');
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.STORAGE_ERROR).toBe('STORAGE_ERROR');
    expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    expect(ErrorCode.AUTH_UNAVAILABLE).toBe('AUTH_UNAVAILABLE');
  });
});
