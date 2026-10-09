import { Component, input, computed } from '@angular/core';
import { WEEKLY_GOAL_MINUTES } from '@features/settings/domain/settings.model';
import { CounterComponent } from '@shared/components/counter/counter.component';

export interface WeekDay {
  key: string;
  label: string;
  focusMinutes: number;
  isToday: boolean;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

@Component({
  selector: 'app-kpi-row',
  standalone: true,
  imports: [CounterComponent],
  templateUrl: './kpi-row.component.html',
})
export class KpiRowComponent {
  readonly Math = Math;
  readonly pendingResourceCount = input.required<number>();
  readonly inProgressCount = input<number>(0);
  readonly catalogMinutes = input<number>(0);
  readonly weeklyFocusMinutes = input.required<number | null>();
  readonly weekDeltaPct = input<number | null>(null);
  readonly weekDays = input<WeekDay[]>([]);
  readonly streakDays = input<number>(0);
  readonly goalMinutes = input<number>(WEEKLY_GOAL_MINUTES.DEFAULT);

  readonly weeklyFocusHours = computed(() => {
    const minutes = this.weeklyFocusMinutes();
    return minutes === null ? 0 : Math.round(minutes / 60);
  });

  readonly liveCount = computed(() => this.pendingResourceCount() + this.inProgressCount());

  readonly catalogLabel = computed(() => formatMinutes(this.catalogMinutes()));

  readonly goalPct = computed(() => {
    const minutes = this.weeklyFocusMinutes() ?? 0;
    const goal = Math.max(1, this.goalMinutes());
    return Math.min(100, Math.round((minutes / goal) * 100));
  });

  readonly maxDay = computed(() =>
    Math.max(this.goalMinutes() / 5, ...this.weekDays().map((d) => d.focusMinutes), 30),
  );

  barColor(minutes: number): string {
    if (minutes === 0) return 'var(--color-line-strong)';
    return minutes >= this.goalMinutes() / 5 ? 'var(--color-accent)' : 'var(--tone-ochre, var(--color-accent))';
  }
}
