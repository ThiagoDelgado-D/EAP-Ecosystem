import { Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { BrowsePickerDialogComponent } from '@features/pomodoro/presentation/browse-picker/browse-picker-dialog.component';
import { createPomodoroRingDisplay } from '@features/pomodoro/presentation/active/pomodoro-ring-display';
import { createTransientFlag } from '@shared/utils/transient-flag';

const RING_RADIUS = 58;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

@Component({
  selector: 'app-pomodoro-mini-widget',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './pomodoro-mini-widget.component.html',
})
export class PomodoroMiniWidgetComponent {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  readonly store = inject(PomodoroSessionStore);
  readonly picker = inject(PomodoroPickerService);

  readonly RING_RADIUS = RING_RADIUS;
  readonly RING_CIRCUMFERENCE = RING_CIRCUMFERENCE;

  readonly collapsed = signal(false);

  private readonly ringDisplay = createPomodoroRingDisplay(this.store, this.picker, RING_CIRCUMFERENCE);
  readonly ringDashOffset = this.ringDisplay.ringDashOffset;
  readonly breakRingDashOffset = this.ringDisplay.breakRingDashOffset;
  readonly currentTarget = this.ringDisplay.currentTarget;
  readonly contextDisplay = this.ringDisplay.contextDisplay;

  toggleCollapsed(): void {
    this.collapsed.update((v) => !v);
  }

  togglePause(): void {
    this.store.togglePause();
  }

  goFull(): void {
    void this.router.navigateByUrl('/pomodoro/active');
  }

  async openSwitchDialog(): Promise<void> {
    const dialogRef = this.dialog.open(BrowsePickerDialogComponent, {
      panelClass: 'confirm-dark-dialog',
      autoFocus: false,
    });
    const target = await firstValueFrom(dialogRef.afterClosed());
    if (target) await this.store.switchTarget(target);
  }

  endSession(): void {
    void this.router.navigateByUrl('/pomodoro/end');
  }

  private readonly extendFlash = createTransientFlag();
  readonly justExtended = this.extendFlash.active;

  async extendBreak(): Promise<void> {
    this.extendFlash.trigger();
    await this.store.extendBreak();
  }

  async finishBreak(): Promise<void> {
    await this.store.endBreak();
    void this.router.navigateByUrl('/pomodoro');
  }
}
