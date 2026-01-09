/**
 * Safe JSON parsing utilities for BananaADS
 * Provides robust error handling for API responses that may return HTML instead of JSON
 */

import { JsonParseError } from './errors';

/**
 * Checks if a string looks like HTML content (starts with DOCTYPE or HTML tags)
 */
export function isHtmlContent(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim().toLowerCase();
  return (
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html') ||
    trimmed.startsWith('<head') ||
    trimmed.startsWith('<body') ||
    trimmed.startsWith('<?xml')
  );
}

/**
 * Checks if a string looks like valid JSON (starts with { or [)
 */
export function looksLikeJson(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

/**
 * Safely parses JSON with proper error handling
 * Throws JsonParseError with helpful context if parsing fails
 */
export function safeJsonParse<T = unknown>(
  content: string,
  source?: string,
  fallback?: T
): T {
  if (!content || typeof content !== 'string') {
    if (fallback !== undefined) return fallback;
    throw new JsonParseError('Empty or invalid content', content, source);
  }

  const trimmed = content.trim();

  if (isHtmlContent(trimmed)) {
    const preview = trimmed.substring(0, 100);
    throw new JsonParseError(
      `Received HTML instead of JSON. The server may have returned an error page. Preview: "${preview}..."`,
      trimmed.substring(0, 500),
      source
    );
  }

  if (!looksLikeJson(trimmed)) {
    if (fallback !== undefined) return fallback;
    const preview = trimmed.substring(0, 100);
    throw new JsonParseError(
      `Content does not appear to be valid JSON. Preview: "${preview}..."`,
      trimmed.substring(0, 500),
      source
    );
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch (error) {
    if (fallback !== undefined) return fallback;
    const errorMessage = error instanceof Error ? error.message : 'Unknown parse error';
    const preview = trimmed.substring(0, 100);
    throw new JsonParseError(
      `Failed to parse JSON: ${errorMessage}. Preview: "${preview}..."`,
      trimmed.substring(0, 500),
      source
    );
  }
}

/**
 * Safely extracts JSON from a fetch Response object
 * Validates content-type and handles HTML error pages gracefully
 */
export async function safeResponseJson<T = unknown>(
  response: Response,
  source?: string,
  fallback?: T
): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('text/html') && !response.ok) {
    const text = await response.text().catch(() => '');
    const preview = text.substring(0, 100);
    throw new JsonParseError(
      `Server returned HTML error page (status ${response.status}). This usually indicates an authentication issue or server error. Preview: "${preview}..."`,
      text.substring(0, 500),
      source
    );
  }

  const text = await response.text();
  
  if (!text || text.trim() === '') {
    if (fallback !== undefined) return fallback;
    throw new JsonParseError(
      `Empty response from server (status ${response.status})`,
      '',
      source
    );
  }

  return safeJsonParse<T>(text, source, fallback);
}

/**
 * Validates that data is a plain object (not null, array, or primitive)
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Sanitizes data before storage by removing any HTML-like content from string fields
 * This prevents corrupted data from being stored in localStorage
 */
export function sanitizeForStorage<T>(data: T, maxDepth: number = 10): T {
  if (maxDepth <= 0) return data;

  if (typeof data === 'string') {
    if (isHtmlContent(data)) {
      console.warn('Attempted to store HTML content, replacing with empty string');
      return '' as T;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForStorage(item, maxDepth - 1)) as T;
  }

  if (isPlainObject(data)) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeForStorage(value, maxDepth - 1);
    }
    return sanitized as T;
  }

  return data;
}

/**
 * Validates that a value can be safely serialized to JSON
 * Returns true if the value can be serialized without data loss
 */
export function canSerializeToJson(value: unknown): boolean {
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) return false;
    const parsed = JSON.parse(serialized);
    return JSON.stringify(parsed) === serialized;
  } catch {
    return false;
  }
}

/**
 * Attempts to extract JSON from a string that may contain markdown code blocks
 * Useful for parsing AI responses that wrap JSON in ```json blocks
 */
export function extractJsonFromMarkdown<T = unknown>(
  content: string,
  source?: string,
  fallback?: T
): T {
  if (!content || typeof content !== 'string') {
    if (fallback !== undefined) return fallback;
    throw new JsonParseError('Empty or invalid content', content, source);
  }

  let text = content.trim();

  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    text = jsonBlockMatch[1].trim();
  } else {
    const genericBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
    if (genericBlockMatch && genericBlockMatch[1]) {
      const blockContent = genericBlockMatch[1].trim();
      if (looksLikeJson(blockContent)) {
        text = blockContent;
      }
    }
  }

  return safeJsonParse<T>(text, source, fallback);
}

/**
 * Creates a safe wrapper for fetch that validates JSON responses
 */
export async function safeFetchJson<T = unknown>(
  url: string,
  options?: RequestInit,
  source?: string,
  fallback?: T
): Promise<T> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    
    if (isHtmlContent(text)) {
      throw new JsonParseError(
        `Request failed with status ${response.status}. Server returned HTML error page.`,
        text.substring(0, 500),
        source || url
      );
    }
    
    try {
      const errorData = JSON.parse(text);
      const errorMessage = errorData.error?.message || errorData.message || errorData.error || text;
      throw new Error(errorMessage);
    } catch (parseError) {
      if (parseError instanceof JsonParseError) throw parseError;
      throw new Error(`Request failed with status ${response.status}: ${text.substring(0, 200)}`);
    }
  }

  return safeResponseJson<T>(response, source || url, fallback);
}
