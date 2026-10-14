import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from '@core/errors/api-error.interceptor';
import type { ApiError } from '@core/errors/api-error';

export function offlineError(): ApiError {
  return toApiError(new HttpErrorResponse({ error: new ProgressEvent('error') }));
}
