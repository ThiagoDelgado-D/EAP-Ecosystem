import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CaptureSheetService } from '@core/capture/capture-sheet.service';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './quick-actions.component.html',
})
export class QuickActionsComponent {
  private readonly capture = inject(CaptureSheetService);

  openCapture(): void {
    this.capture.open('manual');
  }
}
