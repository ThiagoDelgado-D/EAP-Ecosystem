import { Component, input, output, signal } from '@angular/core';
import { FEATURE_KEY, FeatureKey } from '@features/auth/domain/auth.model';

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
  selector: 'app-modules-step',
  standalone: true,
  templateUrl: './modules-step.component.html',
})
export class ModulesStepComponent {
  readonly firstName = input<string>('');
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly modulesSubmit = output<FeatureKey[]>();
  readonly back = output<void>();

  readonly modules = MODULES;
  readonly selected = signal<Set<string>>(
    new Set([FEATURE_KEY.LEARNING_PATHS, FEATURE_KEY.KNOWLEDGE_GRAPH]),
  );

  isOn(key: string): boolean {
    return key === 'resource-library' || this.selected().has(key);
  }

  toggle(module: ModuleCard): void {
    if (module.locked || this.loading()) return;
    const current = new Set(this.selected());
    current.has(module.key) ? current.delete(module.key) : current.add(module.key);
    this.selected.set(current);
  }

  submit(): void {
    const keys = [...this.selected()].filter((k): k is FeatureKey =>
      Object.values(FEATURE_KEY).includes(k as FeatureKey),
    );
    this.modulesSubmit.emit(keys);
  }
}
