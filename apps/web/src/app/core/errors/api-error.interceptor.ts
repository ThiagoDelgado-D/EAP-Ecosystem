import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError, NETWORK_ERROR, type ApiErrorContext, type ApiErrorName } from './api-error';
import { isKnownErrorName } from './error-messages';

const UNREACHABLE_STATUS = 0;

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(catchError((error: unknown) => throwError(() => normalize(error))));

function normalize(error: unknown): unknown {
  if (!(error instanceof HttpErrorResponse)) {
    return error;
  }
  return toApiError(error);
}

export function toApiError(response: HttpErrorResponse): ApiError {
  if (response.status === UNREACHABLE_STATUS) {
    return new ApiError(NETWORK_ERROR, response.status, undefined);
  }
  const body: unknown = response.error;
  if (!isErrorBody(body) || !isKnownErrorName(body.error)) {
    return new ApiError('UNEXPECTED_ERROR', response.status, undefined);
  }
  // The server is the source of truth for each name's context; it is trusted, not re-validated.
  const context = contextOf(body) as ApiErrorContext<ApiErrorName>;
  return new ApiError(body.error, response.status, context);
}

function isErrorBody(body: unknown): body is { error: string } {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return false;
  }
  return typeof body.error === 'string';
}

function contextOf(body: { error: string }): Record<string, unknown> | undefined {
  const entries = Object.entries(body).filter(([key]) => key !== 'error');
  if (entries.length === 0) {
    return undefined;
  }
  return Object.fromEntries(entries);
}
