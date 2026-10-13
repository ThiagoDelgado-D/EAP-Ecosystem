import { Injectable, inject } from '@angular/core';
import { ToastService } from '@core/toast/toast.service';
import { messageOf } from './error-messages';

@Injectable({ providedIn: 'root' })
export class ErrorNotifier {
  private readonly toast = inject(ToastService);

  notify(error: unknown): void {
    this.toast.show(messageOf(error), 'error');
  }
}
