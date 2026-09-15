import { Component, HostListener, computed, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { PomodoroOverlayHostService } from '@features/pomodoro/application/pomodoro-overlay-host.service';
import type { SegmentTarget } from '@features/pomodoro/domain/pomodoro.model';
import {
  describeTargetLabel,
  type TargetLabel,
} from '@features/pomodoro/presentation/start/target-description';
import { currentSegmentTarget } from '@features/pomodoro/presentation/active/segment-display';
import { createTransientFlag } from '@shared/utils/transient-flag';

export const POMODORO_ZEN_KEY = 'pomodoro-zen';

const RING_RADIUS = 150;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

@Component({
  selector: 'app-pomodoro-zen-view',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './pomodoro-zen-view.component.html',
})
export class PomodoroZenViewComponent {
  private readonly router = inject(Router);
  private readonly overlayHost = inject(PomodoroOverlayHostService);
  readonly store = inject(PomodoroSessionStore);
  readonly picker = inject(PomodoroPickerService);

  readonly RING_RADIUS = RING_RADIUS;
  readonly RING_CIRCUMFERENCE = RING_CIRCUMFERENCE;

  readonly ringDashOffset = computed(() => RING_CIRCUMFERENCE * this.store.progressFraction());

  readonly breakRingDashOffset = computed(
    () => RING_CIRCUMFERENCE * this.store.breakProgressFraction(),
  );

  readonly currentTarget = computed<SegmentTarget | null>(() =>
    currentSegmentTarget(this.store.segments()),
  );

  readonly contextDisplay = computed<TargetLabel | null>(() => {
    const target = this.currentTarget();
    if (!target) return null;
    return describeTargetLabel(target, this.picker.allPaths(), this.picker.library());
  });

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.exit();
  }

  togglePause(): void {
    this.store.togglePause();
  }

  exit(): void {
    this.overlayHost.hide(POMODORO_ZEN_KEY);
  }

  endSession(): void {
    this.overlayHost.hide(POMODORO_ZEN_KEY);
    void this.router.navigateByUrl('/pomodoro/end');
  }

  private readonly extendFlash = createTransientFlag();
  readonly justExtended = this.extendFlash.active;

  async extendBreak(): Promise<void> {
    this.extendFlash.trigger();
    await this.store.extendBreak();
  }

  async finishBreak(): Promise<void> {
    this.overlayHost.hide(POMODORO_ZEN_KEY);
    await this.store.endBreak();
    void this.router.navigateByUrl('/pomodoro');
  }
}
