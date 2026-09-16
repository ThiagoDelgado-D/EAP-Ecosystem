import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { buildWeekDayLog, computeWeeklySummary, startOfWeek, summaryWindowSince } from '@features/pomodoro/application/weekly-summary.calculator';
import type { DayLog, DaySession, MetricDelta, WeeklySummary } from '@features/pomodoro/application/weekly-summary.model';
import { formatMinutes, segmentTotals, type SegmentTotal } from '@features/pomodoro/presentation/active/segment-display';
import { describeTargetLabel, type TargetLabel } from '@features/pomodoro/presentation/start/target-description';
import { BrowsePickerDialogComponent } from '@features/pomodoro/presentation/browse-picker/browse-picker-dialog.component';

export const WEEK_LOG_SCOPE = {
  ALL: 'all',
  UNATTRIBUTED: 'unattributed',
  ADVANCED: 'advanced',
} as const;

export type WeekLogScope = (typeof WEEK_LOG_SCOPE)[keyof typeof WEEK_LOG_SCOPE];

@Component({
  selector: 'app-pomodoro-weekly-summary',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './weekly-summary.component.html',
})
export class WeeklySummaryComponent {
  private readonly repository = inject(PomodoroRepository);
  private readonly dialog = inject(MatDialog);
  readonly picker = inject(PomodoroPickerService);

  readonly WEEK_LOG_SCOPE = WEEK_LOG_SCOPE;

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly summary = signal<WeeklySummary | null>(null);
  readonly dayLog = signal<DayLog[]>([]);
  readonly weekStart = startOfWeek(new Date());
  readonly openSessionId = signal<string | null>(null);
  readonly scope = signal<WeekLogScope>(WEEK_LOG_SCOPE.ALL);
  readonly attributing = signal<string | null>(null);

  readonly formatMinutes = formatMinutes;

  constructor() {
    void this.picker.load();
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const now = new Date();
      const history = await this.repository.getHistory(summaryWindowSince(now), now);
      this.summary.set(computeWeeklySummary(history, now));
      this.dayLog.set(buildWeekDayLog(history, now));
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  toggleSession(sessionId: string): void {
    this.openSessionId.update((current) => (current === sessionId ? null : sessionId));
  }

  isOpen(sessionId: string): boolean {
    return this.openSessionId() === sessionId;
  }

  setScope(scope: WeekLogScope): void {
    this.scope.set(scope);
  }

  isLoose(daySession: DaySession): boolean {
    return daySession.segments.every((segment) => segment.targetKind === 'free');
  }

  visibleSessions(day: DayLog): DaySession[] {
    if (this.scope() === WEEK_LOG_SCOPE.UNATTRIBUTED) {
      return day.sessions.filter((daySession) => this.isLoose(daySession));
    }
    if (this.scope() === WEEK_LOG_SCOPE.ADVANCED) {
      // No use case yet tracks which node/resource a session advanced —
      // this scope always reads empty until that data exists.
      return [];
    }
    return day.sessions;
  }

  allCount(): number {
    return this.dayLog().reduce((sum, day) => sum + day.sessionCount, 0);
  }

  unattributedCount(): number {
    return this.dayLog().reduce(
      (sum, day) => sum + day.sessions.filter((daySession) => this.isLoose(daySession)).length,
      0,
    );
  }

  advancedCount(): number {
    return 0;
  }

  maxDayFocusSec(): number {
    return Math.max(1, ...this.dayLog().map((day) => day.focusSec));
  }

  dayBarHeightPx(day: DayLog): number {
    return Math.max(2, (day.focusSec / this.maxDayFocusSec()) * 34);
  }

  dayLetter(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'narrow' });
  }

  dayFocusLabel(day: DayLog): string {
    return day.focusSec === 0 ? '0m' : formatMinutes(day.focusSec);
  }

  dayLogNewestFirst(): DayLog[] {
    return this.dayLog().slice().reverse();
  }

  async attributeSession(daySession: DaySession): Promise<void> {
    const dialogRef = this.dialog.open(BrowsePickerDialogComponent, {
      panelClass: 'confirm-dark-dialog',
      autoFocus: false,
    });
    const target = await firstValueFrom(dialogRef.afterClosed());
    if (!target) return;

    this.attributing.set(daySession.session.id);
    try {
      await this.repository.attributeSession(daySession.session.id, target);
      await this.load();
    } finally {
      this.attributing.set(null);
    }
  }

  formatDelta(delta: MetricDelta): string {
    if (delta.relativeChange === null) return '';
    const pct = Math.round(Math.abs(delta.relativeChange) * 100);
    return `${delta.absoluteChange > 0 ? '+' : '-'}${pct}%`;
  }

  formatDayDelta(delta: MetricDelta): string {
    const days = Math.round(Math.abs(delta.absoluteChange));
    return `${delta.absoluteChange > 0 ? '+' : '-'}${days}`;
  }

  targetsForSession(daySession: DaySession): SegmentTotal[] {
    return segmentTotals(daySession.segments, 0).sort((a, b) => b.secs - a.secs);
  }

  primaryTarget(daySession: DaySession): SegmentTotal | null {
    return this.targetsForSession(daySession)[0] ?? null;
  }

  targetLabel(total: SegmentTotal): TargetLabel {
    return describeTargetLabel(total.target, this.picker.allPaths(), this.picker.library());
  }

  isStub(total: SegmentTotal): boolean {
    return total.target.kind === 'node' && !total.target.resourceId;
  }

  segmentColor(total: SegmentTotal): string {
    if (total.target.kind === 'node') return 'var(--color-accent-hover)';
    if (total.target.kind === 'resource') return 'var(--color-status-in-progress)';
    return 'transparent';
  }

  segmentBackground(total: SegmentTotal): string {
    if (total.target.kind !== 'free') return this.segmentColor(total);
    return 'repeating-linear-gradient(45deg, var(--color-line-strong) 0 2px, transparent 2px 4px)';
  }

  endedShort(daySession: DaySession): boolean {
    const plannedSec = daySession.session.plannedMin * 60;
    return daySession.focusSec > 0 && daySession.focusSec < plannedSec - 120;
  }

  sessionMinutes(daySession: DaySession): number {
    return Math.round(daySession.focusSec / 60);
  }

  targetPercent(total: SegmentTotal, daySession: DaySession): number {
    return daySession.focusSec === 0 ? 0 : Math.round((total.secs / daySession.focusSec) * 100);
  }

  targetWidthPercent(total: SegmentTotal, daySession: DaySession): number {
    return daySession.focusSec === 0 ? 0 : (total.secs / daySession.focusSec) * 100;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }
}
