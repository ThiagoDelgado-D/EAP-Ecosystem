import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { PomodoroOverlayHostService } from '@features/pomodoro/application/pomodoro-overlay-host.service';
import { readHideShortcutHints } from '@features/pomodoro/application/pomodoro-view-preferences';
import type { SegmentTarget } from '@features/pomodoro/domain/pomodoro.model';
import { BrowsePickerDialogComponent } from '@features/pomodoro/presentation/browse-picker/browse-picker-dialog.component';
import {
  PomodoroZenViewComponent,
  POMODORO_ZEN_KEY,
} from '@features/pomodoro/presentation/zen-view/pomodoro-zen-view.component';
import {
  describeTarget,
  describeTargetLabel,
  type TargetLabel,
} from '@features/pomodoro/presentation/start/target-description';
import {
  currentSegmentTarget,
  formatMinutes,
  segmentToTarget,
  segmentTotals,
  type SegmentTotal,
} from './segment-display';
import { createTransientFlag } from '@shared/utils/transient-flag';
import { TodayPanelComponent } from './today-panel.component';

type RailTab = 'session' | 'segments' | 'today';

const RING_RADIUS = 134;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

@Component({
  selector: 'app-pomodoro-active',
  standalone: true,
  imports: [DatePipe, DecimalPipe, TodayPanelComponent],
  templateUrl: './active.component.html',
})
export class ActiveComponent {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly overlayHost = inject(PomodoroOverlayHostService);
  readonly store = inject(PomodoroSessionStore);
  readonly picker = inject(PomodoroPickerService);

  readonly RING_RADIUS = RING_RADIUS;
  readonly RING_CIRCUMFERENCE = RING_CIRCUMFERENCE;

  readonly session = this.store.activeSession;
  readonly paused = this.store.paused;
  readonly phase = this.store.phase;
  readonly elapsedSec = this.store.elapsedSec;
  readonly totalSec = this.store.totalSec;
  readonly remainingLabel = this.store.remainingLabel;
  readonly progressFraction = this.store.progressFraction;
  readonly breakRemainingLabel = this.store.breakRemainingLabel;
  readonly breakProgressFraction = this.store.breakProgressFraction;
  readonly plannedTimeReached = this.store.plannedTimeReached;
  readonly soundEnabled = this.store.soundEnabled;
  readonly hideShortcutHints = signal(readHideShortcutHints());
  readonly startingBreak = signal(false);
  readonly railOpen = signal(true);
  readonly activeTab = signal<RailTab>('session');

  constructor() {
    void this.picker.load();
  }

  readonly ringDashOffset = computed(() => RING_CIRCUMFERENCE * this.progressFraction());

  readonly breakRingDashOffset = computed(() => RING_CIRCUMFERENCE * this.breakProgressFraction());

  readonly currentTarget = computed<SegmentTarget | null>(() =>
    currentSegmentTarget(this.store.segments()),
  );

  readonly previousTarget = computed<SegmentTarget | null>(() => {
    const segs = this.store.segments();
    const previous = segs[segs.length - 2];
    return previous ? segmentToTarget(previous) : null;
  });

  readonly description = computed(() =>
    describeTarget(this.currentTarget(), this.picker.allPaths()),
  );

  readonly contextDisplay = computed<TargetLabel | null>(() => {
    const target = this.currentTarget();
    return target ? this.resolveTargetDisplay(target) : null;
  });

  readonly segmentTotals = computed<SegmentTotal[]>(() =>
    segmentTotals(this.store.segments(), this.elapsedSec()),
  );

  segmentTargetLabel(target: SegmentTarget): string {
    return this.resolveTargetDisplay(target).title;
  }

  private resolveTargetDisplay(target: SegmentTarget): TargetLabel {
    return describeTargetLabel(target, this.picker.allPaths(), this.picker.library());
  }

  readonly formatMinutes = formatMinutes;

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.session() && this.phase() !== 'break') return;
    if (event.code === 'Space') {
      event.preventDefault();
      this.togglePause();
    } else if ((event.key === 's' || event.key === 'S') && this.phase() === 'focus') {
      void this.openSwitchDialog();
    }
  }

  togglePause(): void {
    this.store.togglePause();
  }

  toggleRail(): void {
    this.railOpen.update((v) => !v);
  }

  selectTab(tab: RailTab): void {
    this.activeTab.set(tab);
  }

  async openSwitchDialog(): Promise<void> {
    const previous = this.previousTarget();
    const dialogRef = this.dialog.open(BrowsePickerDialogComponent, {
      panelClass: 'confirm-dark-dialog',
      autoFocus: false,
      data: previous ? { target: previous, label: this.resolveTargetDisplay(previous) } : null,
    });
    const target = await firstValueFrom(dialogRef.afterClosed());
    if (target) await this.applySwitchedTarget(target);
  }

  async applySwitchedTarget(target: SegmentTarget): Promise<void> {
    await this.store.switchTarget(target);
  }

  endSession(): void {
    void this.router.navigateByUrl('/pomodoro/end');
  }

  toggleSound(): void {
    this.store.toggleSound();
  }

  async keepGoing(): Promise<void> {
    await this.store.continueAtPlannedTime();
  }

  async takeBreak(): Promise<void> {
    this.startingBreak.set(true);
    try {
      await this.store.startBreak();
    } finally {
      this.startingBreak.set(false);
    }
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

  minimize(): void {
    void this.router.navigateByUrl('/dashboard');
  }

  openZen(): void {
    this.overlayHost.show(POMODORO_ZEN_KEY, PomodoroZenViewComponent, 'fullscreen');
  }

  backToStart(): void {
    void this.router.navigateByUrl('/pomodoro');
  }
}
