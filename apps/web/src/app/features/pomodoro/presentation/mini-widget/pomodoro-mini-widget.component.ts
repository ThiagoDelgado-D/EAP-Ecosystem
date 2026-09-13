import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import type { SegmentTarget } from '@features/pomodoro/domain/pomodoro.model';
import { BrowsePickerDialogComponent } from '@features/pomodoro/presentation/browse-picker/browse-picker-dialog.component';
import { describeTargetLabel, type TargetLabel } from '@features/pomodoro/presentation/start/target-description';
import { currentSegmentTarget } from '@features/pomodoro/presentation/active/segment-display';
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

  readonly ringDashOffset = computed(() => RING_CIRCUMFERENCE * this.store.progressFraction());

  readonly breakRingDashOffset = computed(() => RING_CIRCUMFERENCE * this.store.breakProgressFraction());

  readonly currentTarget = computed<SegmentTarget | null>(() => currentSegmentTarget(this.store.segments()));

  readonly contextDisplay = computed<TargetLabel | null>(() => {
    const target = this.currentTarget();
    if (!target) return null;
    return describeTargetLabel(target, this.picker.allPaths(), this.picker.library());
  });

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

  extendBreak(): void {
    this.store.extendBreak();
    this.extendFlash.trigger();
  }

  finishBreak(): void {
    this.store.endBreak();
    void this.router.navigateByUrl('/pomodoro');
  }
}
