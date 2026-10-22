import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CaptureSheetService } from '@core/capture/capture-sheet.service';
import { AuthStore } from '@features/auth/application/auth.store';
import { CAPABILITY_KEY } from '@features/auth/domain/auth.model';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './quick-actions.component.html',
})
export class QuickActionsComponent {
  private readonly capture = inject(CaptureSheetService);
  private readonly authStore = inject(AuthStore);

  readonly showPomodoro = computed(() => this.authStore.isEnabled(CAPABILITY_KEY.POMODORO));

  openCapture(): void {
    this.capture.open('manual');
  }
}
