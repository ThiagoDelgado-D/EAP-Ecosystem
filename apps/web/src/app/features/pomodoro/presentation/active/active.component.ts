import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import type { SegmentTarget } from '@features/pomodoro/domain/pomodoro.model';
import { BrowsePickerDialogComponent } from '@features/pomodoro/presentation/browse-picker/browse-picker-dialog.component';
import { describeTarget, describeTargetLabel, type TargetLabel } from '@features/pomodoro/presentation/start/target-description';
import { formatMinutes, segmentToTarget, segmentTotals, type SegmentTotal } from './segment-display';

type RailTab = 'session' | 'segments';

const RING_RADIUS = 134;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

@Component({
  selector: 'app-pomodoro-active',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './active.component.html',
})
export class ActiveComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  readonly store = inject(PomodoroSessionStore);
  readonly picker = inject(PomodoroPickerService);

  readonly RING_RADIUS = RING_RADIUS;
  readonly RING_CIRCUMFERENCE = RING_CIRCUMFERENCE;

  private readonly intervalId = setInterval(() => {
    if (!this.paused()) this.now.set(new Date());
  }, 1000);
  private readonly now = signal(new Date());

  readonly session = this.store.activeSession;
  readonly paused = signal(false);
  readonly railOpen = signal(true);
  readonly activeTab = signal<RailTab>('session');

  constructor() {
    void this.picker.load();
  }

  readonly elapsedSec = computed(() => {
    const session = this.session();
    if (!session) return 0;
    return Math.max(0, Math.floor((this.now().getTime() - session.startedAt.getTime()) / 1000));
  });

  readonly totalSec = computed(() => (this.session()?.plannedMin ?? 0) * 60);

  readonly remainingSec = computed(() => Math.max(0, this.totalSec() - this.elapsedSec()));

  readonly remainingLabel = computed(() => {
    const total = this.remainingSec();
    const minutes = Math.floor(total / 60).toString().padStart(2, '0');
    const seconds = (total % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  });

  readonly progressFraction = computed(() => {
    const total = this.totalSec();
    return total > 0 ? Math.min(1, this.elapsedSec() / total) : 0;
  });

  readonly ringDashOffset = computed(() => RING_CIRCUMFERENCE * this.progressFraction());

  readonly currentTarget = computed<SegmentTarget | null>(() => {
    const segs = this.store.segments();
    const last = segs[segs.length - 1];
    return last ? segmentToTarget(last) : null;
  });

  readonly previousTarget = computed<SegmentTarget | null>(() => {
    const segs = this.store.segments();
    const previous = segs[segs.length - 2];
    return previous ? segmentToTarget(previous) : null;
  });

  readonly description = computed(() => describeTarget(this.currentTarget(), this.picker.allPaths()));

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
    if (!this.session()) return;
    if (event.code === 'Space') {
      event.preventDefault();
      this.togglePause();
    } else if (event.key === 's' || event.key === 'S') {
      void this.openSwitchDialog();
    }
  }

  togglePause(): void {
    this.paused.update((v) => !v);
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

  backToStart(): void {
    void this.router.navigateByUrl('/pomodoro');
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
