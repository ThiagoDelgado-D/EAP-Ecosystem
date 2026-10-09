import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PreferencesService } from '@features/settings/application/preferences.service';
import { ThemeService } from '@core/theme/theme.service';
import { WeeklyGoalService } from '@features/settings/application/weekly-goal.service';
import { LANGUAGE_CODE, START_OF_WEEK, WEEKLY_GOAL_MINUTES } from '@features/settings/domain/settings.model';
import { TIMEZONES } from './timezones.data';
import { SearchableSelectComponent } from '@shared/ui/searchable-select/searchable-select.component';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [FormsModule, SearchableSelectComponent],
  template: `
    <div>
      @if (loading() && !appearance()) {
        <div class="flex items-center gap-2 text-sm text-ink-faint">
          <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          Loading…
        </div>

      <!-- Load failed, no data to show -->
      } @else if (!appearance() && error()) {
        <div class="rounded-xl border border-energy-high/50 bg-energy-high/20 p-5 flex items-center justify-between gap-4">
          <p class="text-sm text-energy-high">{{ error() }}</p>
          <button
            type="button"
            class="flex-shrink-0 text-sm text-ink-dim hover:text-ink-strong border border-line-strong hover:border-line-strong px-3 py-1.5 rounded-lg transition-colors"
            (click)="reload()"
          >
            Try again
          </button>
        </div>

      <!-- Content -->
      } @else if (appearance()) {
        <div class="flex flex-col gap-4">

          <div class="rounded-xl border border-line-soft bg-surface-raised">
            <div class="flex items-center justify-between px-4 py-3">
              <div class="flex-1 pr-8">
                <p class="text-sm font-medium text-ink-strong">Theme</p>
                <p class="text-xs text-ink-faint mt-0.5">Saved on this device. Match system follows your OS setting.</p>
              </div>
              <select
                aria-label="Theme"
                class="w-44 px-3 py-2 rounded-lg bg-surface-overlay border border-line-strong text-sm text-ink-strong focus:outline-none focus:border-accent"
                [ngModel]="themeService.preference()"
                (ngModelChange)="themeService.setPreference($event)"
              >
                <option value="system">Match system</option>
                <option value="paper">Paper (light)</option>
                <option value="ink">Ink (dark)</option>
              </select>
            </div>
          </div>

          <!-- Language & Region -->
          <div class="rounded-xl border border-line-soft bg-surface-raised divide-y divide-line-soft">

            <div class="flex items-center justify-between px-4 py-3">
              <div class="flex-1 pr-8">
                <p class="text-sm font-medium text-ink-strong">Language</p>
                <p class="text-xs text-ink-faint mt-0.5">Interface display language.</p>
              </div>
              <select
                class="w-44 px-3 py-2 rounded-lg bg-surface-overlay border border-line-strong text-sm text-ink-strong focus:outline-none focus:border-accent"
                [ngModel]="appearance()!.language"
                (ngModelChange)="save({ language: $event })"
              >
                <option [value]="LANGUAGE_CODE.EN">English</option>
                <option [value]="LANGUAGE_CODE.ES">Español</option>
              </select>
            </div>

            <div class="flex items-center justify-between px-4 py-3">
              <div class="flex-1 pr-8">
                <p class="text-sm font-medium text-ink-strong">Timezone</p>
                <p class="text-xs text-ink-faint mt-0.5">All times in the app reflect this timezone.</p>
              </div>
              <app-searchable-select
                class="w-64"
                [options]="TIMEZONES"
                [value]="appearance()!.timezone"
                (valueChange)="save({ timezone: $event })"
              />
            </div>

            <div class="flex items-center justify-between px-4 py-3">
              <div class="flex-1 pr-8">
                <p class="text-sm font-medium text-ink-strong">Start of week</p>
                <p class="text-xs text-ink-faint mt-0.5">Change which day your week starts on.</p>
              </div>
              <select
                class="w-44 px-3 py-2 rounded-lg bg-surface-overlay border border-line-strong text-sm text-ink-strong focus:outline-none focus:border-accent"
                [ngModel]="appearance()!.startOfWeek"
                (ngModelChange)="save({ startOfWeek: $event })"
              >
                <option [value]="START_OF_WEEK.MONDAY">Monday</option>
                <option [value]="START_OF_WEEK.SUNDAY">Sunday</option>
                <option [value]="START_OF_WEEK.SATURDAY">Saturday</option>
              </select>
            </div>

          </div>

          <div class="rounded-xl border border-line-soft bg-surface-raised px-4 py-3">
            <div class="flex items-center justify-between">
              <div class="flex-1 pr-8">
                <p class="text-sm font-medium text-ink-strong">Weekly focus goal</p>
                <p class="text-xs text-ink-faint mt-0.5">Focus time you aim for each week. Home, Start and the weekly summary measure against it.</p>
              </div>
              <span class="tnum text-sm font-semibold text-ink-strong">{{ goalLabel(goalDraft()) }}</span>
            </div>
            <input
              type="range"
              aria-label="Weekly focus goal in minutes"
              class="mt-3 w-full cursor-pointer accent-accent"
              [min]="WEEKLY_GOAL_MINUTES.MIN"
              [max]="WEEKLY_GOAL_MINUTES.MAX"
              [step]="WEEKLY_GOAL_MINUTES.STEP"
              [value]="goalDraft()"
              (input)="goalDraft.set(+$any($event.target).value)"
              (change)="saveGoal(+$any($event.target).value)"
            />
            <div class="mt-1 flex justify-between text-[0.66rem] text-ink-faint">
              <span>{{ goalLabel(WEEKLY_GOAL_MINUTES.MIN) }}</span>
              <span class="tnum">{{ goalPct() }}% of the maximum</span>
              <span>{{ goalLabel(WEEKLY_GOAL_MINUTES.MAX) }}</span>
            </div>
            @if (goalError()) {
              <p class="mt-2 text-xs text-energy-high">{{ goalError() }}</p>
            }
          </div>

          <!-- Accessibility -->
          <div class="rounded-xl border border-line-soft bg-surface-raised divide-y divide-line-soft">

            <div class="flex items-center justify-between px-4 py-3">
              <div>
                <p class="text-sm font-medium text-ink-strong">Reduce motion</p>
                <p class="text-xs text-ink-faint mt-0.5">Minimize animations across the interface.</p>
              </div>
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="appearance()!.reduceMotion"
                aria-label="Reduce motion"
                class="relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-line focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised flex-shrink-0"
                [class.bg-accent]="appearance()!.reduceMotion"
                [class.bg-surface-overlay]="!appearance()!.reduceMotion"
                (click)="save({ reduceMotion: !appearance()!.reduceMotion })"
              >
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                  [class.translate-x-4]="appearance()!.reduceMotion"
                ></span>
              </button>
            </div>

            <div class="flex items-center justify-between px-4 py-3">
              <div>
                <p class="text-sm font-medium text-ink-strong">Compact mode</p>
                <p class="text-xs text-ink-faint mt-0.5">Show more content with reduced spacing.</p>
              </div>
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="appearance()!.compactMode"
                aria-label="Compact mode"
                class="relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-line focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised flex-shrink-0"
                [class.bg-accent]="appearance()!.compactMode"
                [class.bg-surface-overlay]="!appearance()!.compactMode"
                (click)="save({ compactMode: !appearance()!.compactMode })"
              >
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                  [class.translate-x-4]="appearance()!.compactMode"
                ></span>
              </button>
            </div>

          </div>

          <!-- Save error (below content, non-blocking) -->
          @if (error()) {
            <p class="text-sm text-energy-high flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ error() }}
            </p>
          }

        </div>
      }
    </div>
  `,
})
export class PreferencesComponent implements OnInit {
  private readonly preferencesService = inject(PreferencesService);
  private readonly weeklyGoal = inject(WeeklyGoalService);
  readonly themeService = inject(ThemeService);

  readonly LANGUAGE_CODE = LANGUAGE_CODE;
  readonly START_OF_WEEK = START_OF_WEEK;
  readonly TIMEZONES = TIMEZONES;
  readonly WEEKLY_GOAL_MINUTES = WEEKLY_GOAL_MINUTES;

  readonly appearance = this.preferencesService.appearance;
  readonly loading = this.preferencesService.loading;
  readonly error = this.preferencesService.error;

  readonly goalDraft = signal<number>(this.weeklyGoal.goalMinutes());
  readonly goalError = signal<string | null>(null);
  readonly goalPct = computed(() => Math.round((this.goalDraft() / WEEKLY_GOAL_MINUTES.MAX) * 100));

  async ngOnInit(): Promise<void> {
    await Promise.all([this.preferencesService.loadAppearance(), this.loadGoal()]);
  }

  goalLabel(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return `${rest} m`;
    if (rest === 0) return `${hours} h`;
    return `${hours} h ${rest} m`;
  }

  async saveGoal(minutes: number): Promise<void> {
    this.goalError.set(null);
    const saved = await this.weeklyGoal.setGoalMinutes(minutes);
    this.goalDraft.set(this.weeklyGoal.goalMinutes());
    if (!saved) this.goalError.set('Failed to save the weekly goal');
  }

  async save(patch: Parameters<PreferencesService['updateAppearance']>[0]): Promise<void> {
    await this.preferencesService.updateAppearance(patch);
  }

  async reload(): Promise<void> {
    await Promise.all([this.preferencesService.loadAppearance(), this.loadGoal()]);
  }

  private async loadGoal(): Promise<void> {
    await this.weeklyGoal.load();
    this.goalDraft.set(this.weeklyGoal.goalMinutes());
  }
}
