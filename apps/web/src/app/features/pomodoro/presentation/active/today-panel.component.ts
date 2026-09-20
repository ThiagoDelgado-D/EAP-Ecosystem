import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import type { Break, Segment, Session } from '@features/pomodoro/domain/pomodoro.model';
import { formatMinutes, segmentTotals } from './segment-display';
import { describeTargetLabel } from '@features/pomodoro/presentation/start/target-description';

const MINUTE_PX = 1;
const DAY_MINUTES = 24 * 60;
const MIN_BLOCK_PX = 14;
const HOUR_GUTTER_PX = 40;
const NOW_LINE_REFRESH_MS = 30_000;
const SCROLL_MARGIN_PX = 90;

interface BlockBreakdownEntry {
  label: string;
  secs: number;
}

interface TimelineBlock {
  key: string;
  kind: 'focus' | 'break';
  label: string;
  topPx: number;
  heightPx: number;
  ongoing: boolean;
  breakdown: BlockBreakdownEntry[];
}

interface HourMark {
  label: string;
  topPx: number;
}

function startOfToday(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatClock12h(date: Date, withMinutes: boolean): string {
  const hours = date.getHours();
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  if (!withMinutes) return `${displayHour} ${period}`;
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${displayHour}:${minutes} ${period}`;
}

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

@Component({
  selector: 'app-pomodoro-today-panel',
  standalone: true,
  templateUrl: './today-panel.component.html',
})
export class TodayPanelComponent {
  private readonly repository = inject(PomodoroRepository);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly picker = inject(PomodoroPickerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly formatMinutes = formatMinutes;
  readonly loading = signal(true);
  private readonly sessions = signal<Session[]>([]);
  private readonly breaks = signal<Break[]>([]);
  private readonly segments = signal<Segment[]>([]);

  readonly hoveredBlock = signal<{ key: string; top: number; left: number } | null>(null);

  readonly HOUR_GUTTER_PX = HOUR_GUTTER_PX;
  readonly dayHeightPx = DAY_MINUTES * MINUTE_PX;
  readonly nowTopPx = signal(minutesSinceMidnight(new Date()) * MINUTE_PX);

  readonly hourMarks: HourMark[] = Array.from({ length: 24 }, (_, hour) => ({
    label: formatClock12h(new Date(2000, 0, 1, hour), false),
    topPx: hour * 60 * MINUTE_PX,
  }));

  readonly totalFocusSec = computed(() =>
    this.sessions().reduce((total, session) => total + this.sessionDurationSec(session), 0),
  );

  readonly totalLabel = computed(() => formatMinutes(this.totalFocusSec()));

  readonly blocks = computed<TimelineBlock[]>(() => {
    const sessionBlocks = this.sessions().map((session) =>
      this.toBlock(
        `session:${session.id}`,
        'focus',
        session.startedAt,
        this.sessionBlockDurationSec(session),
        !session.completedAt,
        this.sessionBreakdown(session),
      ),
    );
    const breakBlocks = this.breaks().map((activeBreak) =>
      this.toBlock(
        `break:${activeBreak.id}`,
        'break',
        activeBreak.startedAt,
        this.breakDurationSec(activeBreak),
        !activeBreak.endedAt,
        [{ label: 'Break', secs: this.breakDurationSec(activeBreak) }],
      ),
    );
    return [...sessionBlocks, ...breakBlocks].sort((a, b) => a.topPx - b.topPx);
  });

  constructor() {
    afterNextRender(() => {
      this.scrollToNow();
      void this.load();
    });

    const intervalId = setInterval(
      () => this.nowTopPx.set(minutesSinceMidnight(new Date()) * MINUTE_PX),
      NOW_LINE_REFRESH_MS,
    );
    this.destroyRef.onDestroy(() => clearInterval(intervalId));
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const snapshot = await this.repository.getHistory(startOfToday());
      this.sessions.set(snapshot.sessions);
      this.breaks.set(snapshot.breaks);
      this.segments.set(snapshot.segments);
    } finally {
      this.loading.set(false);
      this.scrollToNow();
    }
  }

  showBreakdown(block: TimelineBlock, event: MouseEvent): void {
    if (block.breakdown.length === 0) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.hoveredBlock.set({ key: block.key, top: rect.top, left: rect.left - 8 });
  }

  hideBreakdown(): void {
    this.hoveredBlock.set(null);
  }

  breakdownFor(key: string): BlockBreakdownEntry[] {
    return this.blocks().find((block) => block.key === key)?.breakdown ?? [];
  }

  private scrollToNow(): void {
    const scrollHost = this.elementRef.nativeElement.closest('[data-today-scroll-host]') as HTMLElement | null;
    if (!scrollHost) return;
    scrollHost.scrollTop = Math.max(0, this.nowTopPx() - SCROLL_MARGIN_PX);
  }

  private toBlock(
    key: string,
    kind: 'focus' | 'break',
    startedAt: Date,
    durationSec: number,
    ongoing: boolean,
    breakdown: BlockBreakdownEntry[],
  ): TimelineBlock {
    return {
      key,
      kind,
      label: `${formatClock12h(startedAt, true)} · ${formatMinutes(durationSec)}`,
      topPx: minutesSinceMidnight(startedAt) * MINUTE_PX,
      heightPx: Math.max(MIN_BLOCK_PX, (durationSec / 60) * MINUTE_PX),
      ongoing,
      breakdown,
    };
  }

  private sessionBreakdown(session: Session): BlockBreakdownEntry[] {
    const sessionSegments = this.segments().filter((segment) => segment.sessionId === session.id);
    const elapsedSec = this.sessionDurationSec(session);
    return segmentTotals(sessionSegments, elapsedSec).map((total) => ({
      label: describeTargetLabel(total.target, this.picker.allPaths(), this.picker.library()).title,
      secs: total.secs,
    }));
  }

  private sessionDurationSec(session: Session): number {
    const end = session.completedAt ?? new Date();
    return Math.max(0, Math.floor((end.getTime() - session.startedAt.getTime()) / 1000));
  }

  private sessionBlockDurationSec(session: Session): number {
    return session.completedAt ? this.sessionDurationSec(session) : session.plannedMin * 60;
  }

  private breakDurationSec(activeBreak: Break): number {
    if (activeBreak.endedAt) {
      return Math.max(
        0,
        Math.floor((activeBreak.endedAt.getTime() - activeBreak.startedAt.getTime()) / 1000),
      );
    }
    return activeBreak.durationSec;
  }
}
