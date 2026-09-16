import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { computeWeeklySummary, startOfWeek, summaryWindowSince } from '@features/pomodoro/application/weekly-summary.calculator';
import type { MetricDelta, WeeklySummary } from '@features/pomodoro/application/weekly-summary.model';
import { formatMinutes } from '@features/pomodoro/presentation/active/segment-display';

@Component({
  selector: 'app-pomodoro-weekly-summary',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './weekly-summary.component.html',
})
export class WeeklySummaryComponent {
  private readonly repository = inject(PomodoroRepository);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly summary = signal<WeeklySummary | null>(null);
  readonly weekStart = startOfWeek(new Date());

  readonly formatMinutes = formatMinutes;

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const now = new Date();
      const history = await this.repository.getHistory(summaryWindowSince(now), now);
      this.summary.set(computeWeeklySummary(history, now));
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
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
}
