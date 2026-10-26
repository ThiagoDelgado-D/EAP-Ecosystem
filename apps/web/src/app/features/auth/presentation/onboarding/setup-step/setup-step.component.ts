import { Component, computed, input, linkedSignal, output } from '@angular/core';
import {
  MODULE_KEY,
  OPTIONAL_MODULES,
  type ModuleKey,
  type OptionalModuleKey,
} from '@features/auth/domain/auth.model';
import {
  WEEKLY_GOAL_SETTING,
  type ComposedSetup,
  type SetupSetting,
} from '@features/auth/domain/intake.model';
import { WEEKLY_GOAL_MINUTES } from '@features/settings/domain/settings.model';
import { MODULE_TONE } from '@features/settings/presentation/modules/module-tone';
import { minutesLabel } from '@shared/utils/minutes-label';
import { toneVar } from '@shared/utils/tone';
import { reasonFor } from '../intake-options';

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

export interface ConfirmedSetup {
  enabledModules: OptionalModuleKey[];
  weeklyGoalMinutes: number;
}

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
  selector: 'app-setup-step',
  standalone: true,
  templateUrl: './setup-step.component.html',
})
export class SetupStepComponent {
  readonly firstName = input<string>('');
  readonly setup = input.required<ComposedSetup>();
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly confirm = output<ConfirmedSetup>();
  readonly back = output<void>();

  readonly modules = MODULES;
  readonly MODULE_TONE = MODULE_TONE;
  readonly WEEKLY_GOAL_MINUTES = WEEKLY_GOAL_MINUTES;
  readonly toneVar = toneVar;
  readonly minutesLabel = minutesLabel;

  readonly selected = linkedSignal(() => new Set<ModuleKey>(this.setup().enabledModules));
  readonly goalMinutes = linkedSignal(() => this.setup().weeklyGoalMinutes);
  readonly goalReason = computed(() => this.reasonOf(WEEKLY_GOAL_SETTING));

  isOn(key: ModuleKey): boolean {
    return key === MODULE_KEY.RESOURCE_LIBRARY || this.selected().has(key);
  }

  classesFor(key: ModuleKey) {
    if (this.isOn(key)) return CARD_CLASSES.on;
    return CARD_CLASSES.off;
  }

  reasonOf(setting: SetupSetting): string | null {
    const reason = this.setup().reasons.find((candidate) => candidate.setting === setting);
    if (!reason) return null;
    return reasonFor(reason.answers) || null;
  }

  toggle(module: ModuleCard): void {
    if (module.locked || this.loading()) return;
    const next = new Set(this.selected());
    if (next.has(module.key)) next.delete(module.key);
    else next.add(module.key);
    this.selected.set(next);
  }

  submit(): void {
    if (this.loading()) return;
    this.confirm.emit({
      enabledModules: OPTIONAL_MODULES.filter((key) => this.selected().has(key)),
      weeklyGoalMinutes: this.goalMinutes(),
    });
  }
}
