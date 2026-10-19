import { Component, input, output, signal } from '@angular/core';
import {
  isOptionalModule,
  MODULE_KEY,
  OPTIONAL_MODULES,
  type ModuleKey,
  type OptionalModuleKey,
} from '@features/auth/domain/auth.model';
import { MODULE_TONE } from '@features/settings/presentation/modules/module-tone';
import { toneVar } from '@shared/utils/tone';

interface ModuleCard {
  key: ModuleKey;
  label: string;
  desc: string;
  icon: string;
  locked?: boolean;
}

const MODULES: ModuleCard[] = [
  {
    key: MODULE_KEY.RESOURCE_LIBRARY,
    label: 'Resource Library',
    desc: 'Your learning catalog. Always on.',
    icon: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
    locked: true,
  },
  {
    key: MODULE_KEY.LEARNING_PATHS,
    label: 'Learning Paths',
    desc: 'Curated sequences with phases and milestones.',
    icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7',
  },
  {
    key: MODULE_KEY.POMODORO,
    label: 'Pomodoro',
    desc: 'Built-in timer, integrated with sessions.',
    icon: 'M12 22c6 0 10-4.69 10-10.455 0-4.688-2.91-8.69-7-10.227',
  },
  {
    key: MODULE_KEY.RECOMMENDATION,
    label: 'Recommendations',
    desc: 'What to study next, matched to your energy and time.',
    icon: 'M12 2a10 10 0 100 20A10 10 0 0012 2zm4.24 5.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
  },
];

const CARD_CLASSES: Record<'on' | 'off', Record<'card' | 'icon' | 'label' | 'track', string>> = {
  on: {
    card: 'bg-(--tone)/8 border-(--tone)/35',
    icon: 'border-(--tone)/35 text-(--tone)',
    label: 'text-ink-strong',
    track: 'bg-(--tone)',
  },
  off: {
    card: 'bg-surface-inset border-line-soft',
    icon: 'border-line-soft text-ink-faint',
    label: 'text-ink-body',
    track: 'bg-line-strong',
  },
};

@Component({
  selector: 'app-modules-step',
  standalone: true,
  templateUrl: './modules-step.component.html',
})
export class ModulesStepComponent {
  readonly firstName = input<string>('');
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly modulesSubmit = output<OptionalModuleKey[]>();
  readonly back = output<void>();

  readonly modules = MODULES;
  readonly MODULE_TONE = MODULE_TONE;
  readonly toneVar = toneVar;
  readonly selected = signal<Set<string>>(new Set(OPTIONAL_MODULES));

  isOn(key: string): boolean {
    return key === MODULE_KEY.RESOURCE_LIBRARY || this.selected().has(key);
  }

  classesFor(key: string) {
    if (this.isOn(key)) return CARD_CLASSES.on;
    return CARD_CLASSES.off;
  }

  toggle(module: ModuleCard): void {
    if (module.locked || this.loading()) return;
    const current = new Set(this.selected());
    current.has(module.key) ? current.delete(module.key) : current.add(module.key);
    this.selected.set(current);
  }

  submit(): void {
    this.modulesSubmit.emit([...this.selected()].filter(isOptionalModule));
  }
}
