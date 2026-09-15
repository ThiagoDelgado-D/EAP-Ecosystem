import { Component, HostListener, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { PomodoroOverlayHostService } from '@features/pomodoro/application/pomodoro-overlay-host.service';
import { createPomodoroRingDisplay } from '@features/pomodoro/presentation/active/pomodoro-ring-display';
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

  private readonly ringDisplay = createPomodoroRingDisplay(this.store, this.picker, RING_CIRCUMFERENCE);
  readonly ringDashOffset = this.ringDisplay.ringDashOffset;
  readonly breakRingDashOffset = this.ringDisplay.breakRingDashOffset;
  readonly currentTarget = this.ringDisplay.currentTarget;
  readonly contextDisplay = this.ringDisplay.contextDisplay;

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
