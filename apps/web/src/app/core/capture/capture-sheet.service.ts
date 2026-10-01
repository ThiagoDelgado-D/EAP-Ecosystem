import { Injectable, signal } from '@angular/core';

export type CaptureTab = 'manual' | 'url' | 'voice' | 'file';

@Injectable({
  providedIn: 'root',
})
export class CaptureSheetService {
  readonly isOpen = signal(false);
  readonly tab = signal<CaptureTab>('manual');

  open(tab: CaptureTab = 'manual'): void {
    this.tab.set(tab);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
