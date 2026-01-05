/**
 * Shared retry utility with exponential backoff
 * Provides consistent retry logic across all services
 */

import { RateLimitError, NetworkError } from './errors';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> & { onRetry?: RetryOptions['onRetry'] } = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error: unknown) => {
    // Check for rate limiting or temporary unavailability
    const err = error as { status?: number; response?: { status?: number }; message?: string };
    const status = err?.status || err?.response?.status;
    const message = err?.message || '';
    
    return (
      status === 429 ||
      status === 503 ||
      status === 502 ||
      status === 504 ||
      message.includes('429') ||
      message.includes('RESOURCE_EXHAUSTED') ||
      message.includes('UNAVAILABLE') ||
      message.includes('rate limit') ||
      message.includes('temporarily unavailable') ||
      message.includes('timeout') ||
      message.includes('ETIMEDOUT') ||
      message.includes('ECONNRESET')
    );
  },
};

/**
 * Executes a function with exponential backoff retry logic
 * 
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 * @throws The last error if all retries are exhausted
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => fetch('/api/endpoint').then(r => r.json()),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries,
    initialDelay,
    maxDelay,
    shouldRetry,
    onRetry,
  } = { ...DEFAULT_OPTIONS, ...options };

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts or shouldn't retry this error
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wraps a promise with a timeout
 * 
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Optional custom timeout message
 * @returns Promise that rejects if timeout is exceeded
 * 
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   fetch('/api/slow-endpoint'),
 *   30000,
 *   'Request timed out after 30 seconds'
 * );
 * ```
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Request timeout'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new NetworkError(timeoutMessage, true));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Combines retry with timeout for robust async operations
 * 
 * @param fn - The async function to execute
 * @param timeoutMs - Timeout per attempt in milliseconds
 * @param retryOptions - Retry configuration options
 * @returns Promise resolving to the function result
 * 
 * @example
 * ```typescript
 * const result = await retryWithTimeout(
 *   () => fetch('/api/endpoint').then(r => r.json()),
 *   30000,
 *   { maxRetries: 3 }
 * );
 * ```
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  retryOptions: RetryOptions = {}
): Promise<T> {
  return retryWithBackoff(
    () => withTimeout(fn(), timeoutMs),
    retryOptions
  );
}
