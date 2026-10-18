import { HttpErrorResponse } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import type { ApiError } from './models/api-error';

/** Base URL of the Atom REST API. Same-origin by default (proxied in dev). */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api/v1',
});

function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 'error' in value;
}

/** Extracts a user-facing message from an HTTP error. */
export function errorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Cannot reach the server. Check your connection.';
    if (isApiError(err.error)) return err.error.error.message;
  }
  return fallback;
}

/** Extracts per-field validation messages from an HTTP error. */
export function fieldErrors(err: unknown): Record<string, string> {
  if (err instanceof HttpErrorResponse && isApiError(err.error)) {
    return err.error.error.fields ?? {};
  }
  return {};
}
