import { Component, inject, OnInit, computed } from '@angular/core';
import { PreferencesService } from '@features/settings/application/preferences.service';
import { FEATURE_KEY, type FeatureKey } from '@features/auth/domain/auth.model';

interface ModuleCard {
  key: FeatureKey | 'resource-library';
  label: string;
  desc: string;
  icon: string;
  color: string;
  locked?: boolean;
}

const MODULES: ModuleCard[] = [
  {
    key: 'resource-library',
    label: 'Resource Library',
    desc: 'Your learning catalog. Always on.',
    icon: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
    color: '#a78bfa',
    locked: true,
  },
  {
    key: FEATURE_KEY.LEARNING_PATHS,
    label: 'Learning Paths',
    desc: 'Curated sequences with phases and milestones.',
    icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7',
    color: '#818cf8',
  },
  {
    key: FEATURE_KEY.KNOWLEDGE_GRAPH,
    label: 'Atlas (Knowledge Graph)',
    desc: 'Force-directed graph of your resources.',
    icon: 'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0v20M2 12h20',
    color: '#38bdf8',
  },
  {
    key: FEATURE_KEY.POMODORO,
    label: 'Pomodoro',
    desc: 'Built-in timer, integrated with sessions.',
    icon: 'M12 22c6 0 10-4.69 10-10.455 0-4.688-2.91-8.69-7-10.227',
    color: '#f87171',
  },
  {
    key: FEATURE_KEY.SPACED_REPETITION,
    label: 'Spaced Repetition',
    desc: 'Smart review intervals for long-term retention.',
    icon: 'M4 4h16v16H4zM4 12h16M12 4v16',
    color: '#34d399',
  },
];

@Component({
  selector: 'app-modules',
  standalone: true,
  templateUrl: './modules.component.html',
})
export class ModulesComponent implements OnInit {
  private readonly preferencesService = inject(PreferencesService);

  readonly modules = MODULES;
  readonly loading = this.preferencesService.loading;
  readonly saving = this.preferencesService.saving;
  readonly error = this.preferencesService.error;

  readonly enabledKeys = computed(() => new Set(this.preferencesService.featureConfig()));

  async ngOnInit(): Promise<void> {
    await this.preferencesService.loadFeatureConfig();
  }

  isOn(key: string): boolean {
    return key === 'resource-library' || this.enabledKeys().has(key as FeatureKey);
  }

  async toggle(module: ModuleCard): Promise<void> {
    if (module.locked || this.saving()) return;
    const current = new Set(this.enabledKeys());
    current.has(module.key as FeatureKey)
      ? current.delete(module.key as FeatureKey)
      : current.add(module.key as FeatureKey);
    const keys = [...current].filter((k): k is FeatureKey =>
      Object.values(FEATURE_KEY).includes(k as FeatureKey),
    );
    await this.preferencesService.updateFeatureConfig(keys);
  }
}
