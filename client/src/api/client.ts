import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * Maximum number of retry attempts for 5xx errors.
 */
export const MAX_RETRIES = 3;

/**
 * Base delay in milliseconds for exponential backoff (1s, 2s, 4s).
 */
export const BASE_DELAY_MS = 1000;

/**
 * HTTP status codes that trigger automatic retry.
 */
export const RETRYABLE_STATUS_CODES = [500, 502, 503, 504];

export interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

/**
 * Returns a promise that resolves after the specified delay.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates the delay for a given retry attempt using exponential backoff.
 * Attempt 1 → 1000ms, Attempt 2 → 2000ms, Attempt 3 → 4000ms
 */
export function getRetryDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(2, attempt - 1);
}

/**
 * Determines whether a given status code should trigger a retry.
 */
export function isRetryableStatus(status: number | undefined): boolean {
  return status !== undefined && RETRYABLE_STATUS_CODES.includes(status);
}

/**
 * Determines whether the request has exceeded the maximum number of retries.
 */
export function shouldRetry(config: RetryableRequestConfig): boolean {
  const retryCount = config.__retryCount || 0;
  return retryCount < MAX_RETRIES;
}

/**
 * Axios instance configured for the Pyxis API.
 *
 * Features:
 * - Base URL configurable via VITE_API_BASE_URL environment variable (defaults to '/api')
 * - Session cookies included with every request (withCredentials)
 * - Automatic redirect to /auth/login on 401 responses
 * - Automatic retry with exponential backoff for 5xx errors (max 3 attempts)
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined;

    // If there's no config, we can't retry
    if (!config) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    // On 401, just reject — the useAuth hook handles showing the login page
    if (status === 401) {
      return Promise.reject(error);
    }

    // Retry logic for 5xx server errors
    if (isRetryableStatus(status) && shouldRetry(config)) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      const retryDelay = getRetryDelay(config.__retryCount);
      await delay(retryDelay);
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
