import { Component, inject, OnInit, computed } from '@angular/core';
import { PreferencesService } from '@features/settings/application/preferences.service';
import { WIDGET_KEY, type WidgetKey } from '@features/settings/domain/settings.model';

interface WidgetCard {
  key: WidgetKey;
  label: string;
  desc: string;
  icon: string;
  color: string;
}

const WIDGETS: WidgetCard[] = [
  {
    key: WIDGET_KEY.SYSTEM_CHECK,
    label: 'System Check',
    desc: 'Overview of your current learning health.',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#34d399',
  },
  {
    key: WIDGET_KEY.IDEAL_MATCH,
    label: 'Ideal Match',
    desc: 'Suggested resource based on energy and mental state.',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    color: '#818cf8',
  },
  {
    key: WIDGET_KEY.FOCUS_PULSE,
    label: 'Focus Pulse',
    desc: 'Quick snapshot of your focus metrics.',
    icon: 'M22 12h-4l-3 9L9 3l-3 9H2',
    color: '#f87171',
  },
  {
    key: WIDGET_KEY.ARCHITECTS_PULSE,
    label: "Architect's Pulse",
    desc: 'System-level signal for deep work readiness.',
    icon: 'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0v20M2 12h20',
    color: '#38bdf8',
  },
  {
    key: WIDGET_KEY.PENDING_TASKS,
    label: 'Pending Tasks',
    desc: 'Resources waiting to be completed.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    color: '#fbbf24',
  },
];

const WIDGET_BY_KEY = new Map(WIDGETS.map((w) => [w.key, w]));

@Component({
  selector: 'app-widgets',
  standalone: true,
  templateUrl: './widgets.component.html',
})
export class WidgetsComponent implements OnInit {
  private readonly preferencesService = inject(PreferencesService);

  readonly loading = this.preferencesService.loading;
  readonly error = this.preferencesService.error;

  readonly activeWidgets = computed(() =>
    this.preferencesService
      .widgetConfig()
      .map((key) => WIDGET_BY_KEY.get(key))
      .filter((w): w is WidgetCard => w !== undefined),
  );

  readonly inactiveWidgets = computed(() => {
    const active = new Set(this.preferencesService.widgetConfig());
    return WIDGETS.filter((w) => !active.has(w.key));
  });

  async ngOnInit(): Promise<void> {
    await this.preferencesService.loadWidgetConfig();
  }

  async toggle(widget: WidgetCard): Promise<void> {
    const current = this.preferencesService.widgetConfig();
    const next = current.includes(widget.key)
      ? current.filter((k) => k !== widget.key)
      : [...current, widget.key];
    await this.preferencesService.updateWidgetConfig(next);
  }

  async moveUp(index: number): Promise<void> {
    if (index === 0) return;
    const next = [...this.preferencesService.widgetConfig()];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    await this.preferencesService.updateWidgetConfig(next);
  }

  async moveDown(index: number): Promise<void> {
    const config = this.preferencesService.widgetConfig();
    if (index === config.length - 1) return;
    const next = [...config];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    await this.preferencesService.updateWidgetConfig(next);
  }
}
