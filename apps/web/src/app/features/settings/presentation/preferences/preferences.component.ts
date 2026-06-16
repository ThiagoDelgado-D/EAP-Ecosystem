import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PreferencesService } from '@features/settings/application/preferences.service';
import { LANGUAGE_CODE, START_OF_WEEK } from '@features/settings/domain/settings.model';
import { TIMEZONES } from './timezones.data';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-[680px] mx-auto px-14 py-10">
      <div class="mb-8">
        <h1 class="text-xl font-semibold text-slate-100">Preferences</h1>
        <p class="text-sm text-slate-400 mt-1">Customize your experience and appearance.</p>
      </div>

      @if (loading()) {
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <p class="text-sm text-slate-500">Loading preferences…</p>
        </div>
      } @else if (error()) {
        <div class="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
          <p class="text-sm text-red-400">{{ error() }}</p>
        </div>
      } @else if (appearance()) {
        <div class="flex flex-col gap-6">

          <!-- Language & Region -->
          <div class="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800">

            <!-- Language -->
            <div class="flex items-center justify-between px-6 py-5">
              <div class="flex-1 pr-8">
                <p class="text-sm font-medium text-slate-200">Language</p>
                <p class="text-xs text-slate-500 mt-0.5">Interface display language.</p>
              </div>
              <select
                class="w-44 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-violet-600"
                [ngModel]="appearance()!.language"
                (ngModelChange)="saveImmediate({ language: $event })"
              >
                <option [value]="LANGUAGE_CODE.EN">English</option>
                <option [value]="LANGUAGE_CODE.ES">Español</option>
              </select>
            </div>

            <!-- Timezone -->
            <div class="flex items-center justify-between px-6 py-5">
              <div class="flex-1 pr-8">
                <p class="text-sm font-medium text-slate-200">Timezone</p>
                <p class="text-xs text-slate-500 mt-0.5">All times in the app reflect this timezone.</p>
              </div>
              <select
                class="w-64 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-violet-600"
                [ngModel]="appearance()!.timezone"
                (ngModelChange)="saveImmediate({ timezone: $event })"
              >
                @for (tz of TIMEZONES; track tz.value) {
                  <option [value]="tz.value">{{ tz.label }}</option>
                }
              </select>
            </div>

            <!-- Start of week -->
            <div class="flex items-center justify-between px-6 py-5">
              <div class="flex-1 pr-8">
                <p class="text-sm font-medium text-slate-200">Start of week</p>
                <p class="text-xs text-slate-500 mt-0.5">Change which day your week starts on.</p>
              </div>
              <select
                class="w-44 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-violet-600"
                [ngModel]="appearance()!.startOfWeek"
                (ngModelChange)="saveImmediate({ startOfWeek: $event })"
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
                class="relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
                [class.bg-violet-600]="appearance()!.reduceMotion"
                [class.bg-slate-700]="!appearance()!.reduceMotion"
                (click)="saveImmediate({ reduceMotion: !appearance()!.reduceMotion })"
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
                class="relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
                [class.bg-violet-600]="appearance()!.compactMode"
                [class.bg-slate-700]="!appearance()!.compactMode"
                (click)="saveImmediate({ compactMode: !appearance()!.compactMode })"
              >
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                  [class.translate-x-4]="appearance()!.compactMode"
                ></span>
              </button>
            </div>

          </div>

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

  async saveImmediate(patch: Parameters<PreferencesService['updateAppearance']>[0]): Promise<void> {
    await this.preferencesService.updateAppearance(patch);
  }
}
