import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import type { SegmentTarget } from '@features/pomodoro/domain/pomodoro.model';
import { BrowsePickerDialogComponent } from '@features/pomodoro/presentation/browse-picker/browse-picker-dialog.component';
import { describeTarget } from '@features/pomodoro/presentation/start/target-description';
import { formatMinutes, segmentToTarget, segmentTotals, type SegmentTotal } from './segment-display';

type RailTab = 'session' | 'segments';

interface ContextDisplay {
  title: string;
  subtitle?: string;
}

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

  readonly description = computed(() => describeTarget(this.currentTarget(), this.picker.allPaths()));

  readonly contextDisplay = computed<ContextDisplay | null>(() => {
    const target = this.currentTarget();
    if (!target) return null;
    if (target.kind === 'free') return { title: 'Free focus', subtitle: 'No material attached' };
    if (target.kind === 'resource') {
      const resource = this.picker.library().find((r) => r.id === target.resourceId);
      return { title: resource?.title ?? 'Resource' };
    }
    const group = this.picker.allPaths().find((g) => g.path.id === target.learningPathId);
    const node = group?.nodes.find((n) => n.id === target.learningPathNodeId);
    return { title: node?.title ?? 'Path step', subtitle: group?.path.title };
  });

  readonly segmentTotals = computed<SegmentTotal[]>(() =>
    segmentTotals(this.store.segments(), this.elapsedSec()),
  );

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
    const dialogRef = this.dialog.open(BrowsePickerDialogComponent, {
      panelClass: 'confirm-dark-dialog',
      autoFocus: false,
    });
    const target = await firstValueFrom(dialogRef.afterClosed());
    if (target) await this.applySwitchedTarget(target);
  }

  async applySwitchedTarget(target: SegmentTarget): Promise<void> {
    await this.store.switchTarget(target);
  }

  async endSession(): Promise<void> {
    await this.store.end();
    void this.router.navigateByUrl('/pomodoro');
  }

  backToStart(): void {
    void this.router.navigateByUrl('/pomodoro');
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
