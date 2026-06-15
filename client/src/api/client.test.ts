/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  MAX_RETRIES,
  BASE_DELAY_MS,
  RETRYABLE_STATUS_CODES,
  getRetryDelay,
  isRetryableStatus,
  shouldRetry,
  type RetryableRequestConfig,
} from './client';

describe('API Client - Retry Logic', () => {
  describe('getRetryDelay', () => {
    it('should return 1000ms for attempt 1', () => {
      expect(getRetryDelay(1)).toBe(1000);
    });

    it('should return 2000ms for attempt 2', () => {
      expect(getRetryDelay(2)).toBe(2000);
    });

    it('should return 4000ms for attempt 3', () => {
      expect(getRetryDelay(3)).toBe(4000);
    });

    it('should use exponential backoff formula (BASE_DELAY * 2^(attempt-1))', () => {
      for (let i = 1; i <= 5; i++) {
        expect(getRetryDelay(i)).toBe(BASE_DELAY_MS * Math.pow(2, i - 1));
      }
    });
  });

  describe('isRetryableStatus', () => {
    it('should return true for 500', () => {
      expect(isRetryableStatus(500)).toBe(true);
    });

    it('should return true for 502', () => {
      expect(isRetryableStatus(502)).toBe(true);
    });

    it('should return true for 503', () => {
      expect(isRetryableStatus(503)).toBe(true);
    });

    it('should return true for 504', () => {
      expect(isRetryableStatus(504)).toBe(true);
    });

    it('should return false for 400', () => {
      expect(isRetryableStatus(400)).toBe(false);
    });

    it('should return false for 401', () => {
      expect(isRetryableStatus(401)).toBe(false);
    });

    it('should return false for 403', () => {
      expect(isRetryableStatus(403)).toBe(false);
    });

    it('should return false for 404', () => {
      expect(isRetryableStatus(404)).toBe(false);
    });

    it('should return false for 200', () => {
      expect(isRetryableStatus(200)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isRetryableStatus(undefined)).toBe(false);
    });

    it('should return false for 501 (not in retry list)', () => {
      expect(isRetryableStatus(501)).toBe(false);
    });
  });

  describe('shouldRetry', () => {
    it('should return true when retryCount is 0', () => {
      const config = { headers: {} } as RetryableRequestConfig;
      config.__retryCount = 0;
      expect(shouldRetry(config)).toBe(true);
    });

    it('should return true when retryCount is less than MAX_RETRIES', () => {
      const config = { headers: {} } as RetryableRequestConfig;
      config.__retryCount = MAX_RETRIES - 1;
      expect(shouldRetry(config)).toBe(true);
    });

    it('should return false when retryCount equals MAX_RETRIES', () => {
      const config = { headers: {} } as RetryableRequestConfig;
      config.__retryCount = MAX_RETRIES;
      expect(shouldRetry(config)).toBe(false);
    });

    it('should return false when retryCount exceeds MAX_RETRIES', () => {
      const config = { headers: {} } as RetryableRequestConfig;
      config.__retryCount = MAX_RETRIES + 1;
      expect(shouldRetry(config)).toBe(false);
    });

    it('should return true when __retryCount is undefined (first attempt)', () => {
      const config = { headers: {} } as RetryableRequestConfig;
      expect(shouldRetry(config)).toBe(true);
    });
  });

  describe('constants', () => {
    it('should have MAX_RETRIES set to 3', () => {
      expect(MAX_RETRIES).toBe(3);
    });

    it('should have BASE_DELAY_MS set to 1000', () => {
      expect(BASE_DELAY_MS).toBe(1000);
    });

    it('should include 500, 502, 503, 504 in retryable status codes', () => {
      expect(RETRYABLE_STATUS_CODES).toEqual([500, 502, 503, 504]);
    });
  });
});

describe('API Client - Interceptor Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('retry with exponential backoff', () => {
    it('should retry and succeed after transient 500 errors', async () => {
      const mockAdapter = vi.fn()
        .mockRejectedValueOnce(createAxiosError(500, true))
        .mockResolvedValueOnce(createSuccessResponse('success'));

      const client = createRetryClient(mockAdapter);

      const requestPromise = client.get('/test');
      await vi.advanceTimersByTimeAsync(1000);

      const response = await requestPromise;
      expect(response.data).toBe('success');
      expect(mockAdapter).toHaveBeenCalledTimes(2);
    });

    it('should retry on 502 errors', async () => {
      const mockAdapter = vi.fn()
        .mockRejectedValueOnce(createAxiosError(502, true))
        .mockResolvedValueOnce(createSuccessResponse('ok'));

      const client = createRetryClient(mockAdapter);

      const requestPromise = client.get('/test');
      await vi.advanceTimersByTimeAsync(1000);

      const response = await requestPromise;
      expect(response.data).toBe('ok');
    });

    it('should retry on 503 errors', async () => {
      const mockAdapter = vi.fn()
        .mockRejectedValueOnce(createAxiosError(503, true))
        .mockResolvedValueOnce(createSuccessResponse('ok'));

      const client = createRetryClient(mockAdapter);

      const requestPromise = client.get('/test');
      await vi.advanceTimersByTimeAsync(1000);

      const response = await requestPromise;
      expect(response.data).toBe('ok');
    });

    it('should retry on 504 errors', async () => {
      const mockAdapter = vi.fn()
        .mockRejectedValueOnce(createAxiosError(504, true))
        .mockResolvedValueOnce(createSuccessResponse('ok'));

      const client = createRetryClient(mockAdapter);

      const requestPromise = client.get('/test');
      await vi.advanceTimersByTimeAsync(1000);

      const response = await requestPromise;
      expect(response.data).toBe('ok');
    });

    it('should not retry on 404 errors', async () => {
      const mockAdapter = vi.fn()
        .mockRejectedValueOnce(createAxiosError(404, true));

      const client = createRetryClient(mockAdapter);

      await expect(client.get('/test')).rejects.toMatchObject({
        response: { status: 404 },
      });
      expect(mockAdapter).toHaveBeenCalledTimes(1);
    });

    it('should succeed immediately on 2xx responses', async () => {
      const mockAdapter = vi.fn()
        .mockResolvedValueOnce(createSuccessResponse('ok'));

      const client = createRetryClient(mockAdapter);

      const response = await client.get('/test');
      expect(response.data).toBe('ok');
      expect(mockAdapter).toHaveBeenCalledTimes(1);
    });

    it('should recover after two failed attempts', async () => {
      const mockAdapter = vi.fn()
        .mockRejectedValueOnce(createAxiosError(503, true))
        .mockRejectedValueOnce(createAxiosError(503, true))
        .mockResolvedValueOnce(createSuccessResponse('recovered'));

      const client = createRetryClient(mockAdapter);

      const requestPromise = client.get('/test');
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      const response = await requestPromise;
      expect(response.data).toBe('recovered');
      expect(mockAdapter).toHaveBeenCalledTimes(3);
    });
  });

  describe('401 redirect', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      // jsdom doesn't allow reassigning window.location normally,
      // so we delete it and replace with a simple object
      // @ts-expect-error - Deleting window.location for test mock
      delete window.location;
      window.location = { href: 'http://localhost:3000/' } as unknown as Location;
    });

    afterEach(() => {
      window.location = originalLocation;
    });

    it('should set location.href to /auth/login on 401 response', async () => {
      const mockAdapter = vi.fn()
        .mockRejectedValueOnce(createAxiosError(401, true));

      const client = createRetryClient(mockAdapter);

      await expect(client.get('/test')).rejects.toMatchObject({
        response: { status: 401 },
      });
      expect(window.location.href).toBe('/auth/login');
    });

    it('should not retry on 401 errors', async () => {
      const mockAdapter = vi.fn()
        .mockRejectedValueOnce(createAxiosError(401, true));

      const client = createRetryClient(mockAdapter);

      await expect(client.get('/test')).rejects.toMatchObject({
        response: { status: 401 },
      });
      expect(mockAdapter).toHaveBeenCalledTimes(1);
    });
  });

  describe('configuration', () => {
    it('should include credentials with requests', async () => {
      const mockAdapter = vi.fn()
        .mockResolvedValueOnce(createSuccessResponse('ok'));

      const client = createRetryClient(mockAdapter);
      await client.get('/test');

      const config = mockAdapter.mock.calls[0][0];
      expect(config.withCredentials).toBe(true);
    });

    it('should set Content-Type to application/json', async () => {
      const mockAdapter = vi.fn()
        .mockResolvedValueOnce(createSuccessResponse('ok'));

      const client = createRetryClient(mockAdapter);
      await client.get('/test');

      const config = mockAdapter.mock.calls[0][0];
      expect(config.headers['Content-Type']).toBe('application/json');
    });

    it('should use /api as base URL', async () => {
      const mockAdapter = vi.fn()
        .mockResolvedValueOnce(createSuccessResponse('ok'));

      const client = createRetryClient(mockAdapter);
      await client.get('/test');

      const config = mockAdapter.mock.calls[0][0];
      expect(config.baseURL).toBe('/api');
    });
  });
});

// --- Test helpers ---

/**
 * Creates a test axios instance that mimics the production interceptors.
 */
function createRetryClient(mockAdapter: ReturnType<typeof vi.fn>) {
  const client = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
    adapter: mockAdapter,
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      if (!config) return Promise.reject(error);

      const status = error.response?.status;

      if (status === 401) {
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }

      if (isRetryableStatus(status)) {
        const retryCount = config.__retryCount || 0;
        if (retryCount < MAX_RETRIES) {
          config.__retryCount = retryCount + 1;
          const retryDelay = getRetryDelay(config.__retryCount);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return client(config);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Creates an Axios error with proper config for retry testing.
 * When `includeAdapter` is true, the error's config references the actual adapter
 * so retries don't break.
 */
function createAxiosError(status: number, _includeAdapter?: boolean): AxiosError {
  const error = new Error(`Request failed with status ${status}`) as AxiosError;
  error.response = {
    status,
    data: {},
    headers: {},
    statusText: `Error ${status}`,
    config: { headers: {} } as InternalAxiosRequestConfig,
  };
  error.config = { headers: {} } as InternalAxiosRequestConfig;
  error.isAxiosError = true;
  return error;
}

function createSuccessResponse(data: unknown): AxiosResponse {
  return {
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: {} } as InternalAxiosRequestConfig,
    data,
  };
}
