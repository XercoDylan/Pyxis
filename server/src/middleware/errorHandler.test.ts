import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler.js';
import { AppError, ErrorCode } from '../types/index.js';

function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const mockRequest = {} as Request;
const mockNext = vi.fn() as unknown as NextFunction;

describe('errorHandler', () => {
  it('handles AppError and returns the correct status and body', () => {
    const error = new AppError(ErrorCode.COURSE_EXISTS, 409, 'A course with this number already exists');
    const res = createMockResponse();

    errorHandler(error, mockRequest, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'COURSE_EXISTS',
        message: 'A course with this number already exists',
      },
    });
  });

  it('handles AppError with validation details', () => {
    const details = { courseName: ['Course name is required'] };
    const error = new AppError(ErrorCode.VALIDATION_ERROR, 422, 'Validation failed', details);
    const res = createMockResponse();

    errorHandler(error, mockRequest, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { courseName: ['Course name is required'] },
      },
    });
  });

  it('handles unknown errors with a generic 500 response', () => {
    const error = new Error('Unexpected failure');
    const res = createMockResponse();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(error, mockRequest, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong. Please try again later.',
      },
    });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('does not expose internal error details to the client', () => {
    const error = new Error('database connection refused at 127.0.0.1:5432');
    const res = createMockResponse();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(error, mockRequest, res, mockNext);

    const jsonCall = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonCall.error.message).not.toContain('database');
    expect(jsonCall.error.message).not.toContain('127.0.0.1');

    vi.restoreAllMocks();
  });
});
