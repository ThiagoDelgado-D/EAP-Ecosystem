import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PreferencesService } from '@features/settings/application/preferences.service';
import { LANGUAGE_CODE, START_OF_WEEK } from '@features/settings/domain/settings.model';
import { TIMEZONES } from './timezones.data';
import { SearchableSelectComponent } from '@shared/ui/searchable-select/searchable-select.component';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [FormsModule, SearchableSelectComponent],
  template: `
    <div class="max-w-[680px] mx-auto px-14 py-10">
      <div class="mb-8">
        <h1 class="text-xl font-semibold text-slate-100">Preferences</h1>
        <p class="text-sm text-slate-400 mt-1">Customize your experience and appearance.</p>
      </div>

      <!-- Initial loading -->
      @if (loading() && !appearance()) {
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          Loading…
        </div>

      <!-- Load failed, no data to show -->
      } @else if (!appearance() && error()) {
        <div class="rounded-xl border border-red-900/50 bg-red-950/20 p-5 flex items-center justify-between gap-4">
          <p class="text-sm text-red-400">{{ error() }}</p>
          <button
            type="button"
            class="flex-shrink-0 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-colors"
            (click)="reload()"
          >
            Try again
          </button>
        </div>

      <!-- Content -->
      } @else if (appearance()) {
        <div class="flex flex-col gap-6">

          <!-- Language & Region -->
          <div class="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800">

            <div class="flex items-center justify-between px-6 py-5">
              <div class="flex-1 pr-8">
                <p class="text-sm font-medium text-slate-200">Language</p>
                <p class="text-xs text-slate-500 mt-0.5">Interface display language.</p>
              </div>
              <select
                class="w-44 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-violet-600"
                [ngModel]="appearance()!.language"
                (ngModelChange)="save({ language: $event })"
              >
                <option [value]="LANGUAGE_CODE.EN">English</option>
                <option [value]="LANGUAGE_CODE.ES">Español</option>
              </select>
            </div>

            <div class="flex items-center justify-between px-6 py-5">
              <div class="flex-1 pr-8">
                <p class="text-sm font-medium text-slate-200">Timezone</p>
                <p class="text-xs text-slate-500 mt-0.5">All times in the app reflect this timezone.</p>
              </div>
              <app-searchable-select
                class="w-64"
                [options]="TIMEZONES"
                [value]="appearance()!.timezone"
                (valueChange)="save({ timezone: $event })"
              />
            </div>

            <div class="flex items-center justify-between px-6 py-5">
              <div class="flex-1 pr-8">
                <p class="text-sm font-medium text-slate-200">Start of week</p>
                <p class="text-xs text-slate-500 mt-0.5">Change which day your week starts on.</p>
              </div>
              <select
                class="w-44 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-violet-600"
                [ngModel]="appearance()!.startOfWeek"
                (ngModelChange)="save({ startOfWeek: $event })"
              >
                <option [value]="START_OF_WEEK.MONDAY">Monday</option>
                <option [value]="START_OF_WEEK.SUNDAY">Sunday</option>
                <option [value]="START_OF_WEEK.SATURDAY">Saturday</option>
              </select>
            </div>

          </div>

          <!-- Accessibility -->
          <div class="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800">

            <div class="flex items-center justify-between px-6 py-5">
              <div>
                <p class="text-sm font-medium text-slate-200">Reduce motion</p>
                <p class="text-xs text-slate-500 mt-0.5">Minimize animations across the interface.</p>
              </div>
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="appearance()!.reduceMotion"
                aria-label="Reduce motion"
                class="relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 flex-shrink-0"
                [class.bg-violet-600]="appearance()!.reduceMotion"
                [class.bg-slate-700]="!appearance()!.reduceMotion"
                (click)="save({ reduceMotion: !appearance()!.reduceMotion })"
              >
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                  [class.translate-x-4]="appearance()!.reduceMotion"
                ></span>
              </button>
            </div>

            <div class="flex items-center justify-between px-6 py-5">
              <div>
                <p class="text-sm font-medium text-slate-200">Compact mode</p>
                <p class="text-xs text-slate-500 mt-0.5">Show more content with reduced spacing.</p>
              </div>
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="appearance()!.compactMode"
                aria-label="Compact mode"
                class="relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 flex-shrink-0"
                [class.bg-violet-600]="appearance()!.compactMode"
                [class.bg-slate-700]="!appearance()!.compactMode"
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
            <p class="text-sm text-red-400 flex items-center gap-1.5">
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

  readonly LANGUAGE_CODE = LANGUAGE_CODE;
  readonly START_OF_WEEK = START_OF_WEEK;
  readonly TIMEZONES = TIMEZONES;

  readonly appearance = this.preferencesService.appearance;
  readonly loading = this.preferencesService.loading;
  readonly error = this.preferencesService.error;

  async ngOnInit(): Promise<void> {
    await this.preferencesService.loadAppearance();
  }

  async save(patch: Parameters<PreferencesService['updateAppearance']>[0]): Promise<void> {
    await this.preferencesService.updateAppearance(patch);
  }

  async reload(): Promise<void> {
    await this.preferencesService.loadAppearance();
  }
}
