/**
 * Custom error classes for BananaADS
 * Provides consistent error handling across the application
 */

/**
 * Base error class for API-related errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public provider: string
  ) {
    super(message);
    this.name = 'ApiError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Error class for validation failures
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Error class for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public provider?: string
  ) {
    super(message);
    this.name = 'AuthenticationError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
  }
}

/**
 * Error class for rate limiting
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter?: number,
    public provider?: string
  ) {
    super(message);
    this.name = 'RateLimitError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RateLimitError);
    }
  }
}

/**
 * Error class for storage quota exceeded
 */
export class StorageQuotaError extends Error {
  constructor(message: string = 'Storage quota exceeded') {
    super(message);
    this.name = 'StorageQuotaError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StorageQuotaError);
    }
  }
}

/**
 * Error class for network/timeout errors
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public isTimeout: boolean = false
  ) {
    super(message);
    this.name = 'NetworkError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}

/**
 * Error class for JSON parsing failures (e.g., when API returns HTML instead of JSON)
 */
export class JsonParseError extends Error {
  constructor(
    message: string,
    public rawContent?: string,
    public source?: string
  ) {
    super(message);
    this.name = 'JsonParseError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JsonParseError);
    }
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard to check if an error is an AuthenticationError
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * Type guard to check if an error is a RateLimitError
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

/**
 * Type guard to check if an error is a StorageQuotaError
 */
export function isStorageQuotaError(error: unknown): error is StorageQuotaError {
  return error instanceof StorageQuotaError;
}

/**
 * Type guard to check if an error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Type guard to check if an error is a JsonParseError
 */
export function isJsonParseError(error: unknown): error is JsonParseError {
  return error instanceof JsonParseError;
}

/**
 * Converts an unknown error to a human-readable message
 */
export function getHumanReadableError(error: unknown): string {
  if (error instanceof Error) {
    if (isApiError(error)) {
      return `${error.provider} API error (${error.statusCode}): ${error.message}`;
    }
    if (isValidationError(error)) {
      return `Validation error for ${error.field}: ${error.message}`;
    }
    if (isAuthenticationError(error)) {
      return error.provider
        ? `${error.provider} authentication failed: ${error.message}`
        : `Authentication failed: ${error.message}`;
    }
    if (isRateLimitError(error)) {
      const retryMsg = error.retryAfter ? ` Retry after ${error.retryAfter}s.` : '';
      return `Rate limit exceeded.${retryMsg} ${error.message}`;
    }
    if (isStorageQuotaError(error)) {
      return `Storage full: ${error.message}`;
    }
    if (isNetworkError(error)) {
      return error.isTimeout ? `Request timed out: ${error.message}` : `Network error: ${error.message}`;
    }
    if (isJsonParseError(error)) {
      const sourceMsg = error.source ? ` from ${error.source}` : '';
      return `Invalid response${sourceMsg}: ${error.message}`;
    }
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}
