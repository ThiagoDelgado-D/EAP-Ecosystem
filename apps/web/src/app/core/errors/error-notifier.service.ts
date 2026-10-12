import { Injectable, inject } from '@angular/core';
import { ToastService } from '@core/toast/toast.service';
import { ApiError, isApiError } from './api-error';
import { messageFor } from './error-messages';

const UNKNOWN_STATUS = 0;

@Injectable({ providedIn: 'root' })
export class ErrorNotifier {
  private readonly toast = inject(ToastService);

  notify(error: unknown): void {
    this.toast.show(this.messageOf(error), 'error');
  }

  private messageOf(error: unknown): string {
    if (!isApiError(error)) {
      return messageFor(new ApiError('UNEXPECTED_ERROR', UNKNOWN_STATUS, undefined));
    }
    return messageFor(error);
  }
}
