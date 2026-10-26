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
import { minutesLabel } from '@shared/utils/minutes-label';
import { toneVar, type Tone } from '@shared/utils/tone';
import { reasonFor } from '../intake-options';
import { MODULE_CARDS, type ModuleCard } from '../module-cards';

export interface ConfirmedSetup {
  enabledModules: OptionalModuleKey[];
  weeklyGoalMinutes: number;
}

interface ShownReason {
  label: string;
  detail: string;
  tone: Tone;
}

const GOAL_REASON_TONE: Tone = 'ochre';

const BLOCK_CLASSES: Record<'on' | 'off', Record<'block' | 'glyph', string>> = {
  on: {
    block: 'border-(--tone)/55 bg-(--tone)/12',
    glyph: 'bg-(--tone)',
  },
  off: {
    block: 'border-dashed border-line-strong opacity-60',
    glyph: 'bg-(--tone-slate)',
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

  readonly modules = MODULE_CARDS;
  readonly WEEKLY_GOAL_MINUTES = WEEKLY_GOAL_MINUTES;
  readonly toneVar = toneVar;
  readonly minutesLabel = minutesLabel;

  readonly selected = linkedSignal(() => new Set<ModuleKey>(this.setup().enabledModules));
  readonly goalMinutes = linkedSignal(() => this.setup().weeklyGoalMinutes);

  readonly reasons = computed<ShownReason[]>(() => {
    const proposed = new Set<ModuleKey>(this.setup().enabledModules);
    const shown: ShownReason[] = [];
    for (const module of this.modules) {
      const detail = this.reasonOf(module.key);
      if (!detail || !proposed.has(module.key) || !this.isOn(module.key)) continue;
      shown.push({ label: module.label, detail, tone: module.tone });
    }
    const goalDetail = this.reasonOf(WEEKLY_GOAL_SETTING);
    if (goalDetail && this.goalMinutes() === this.setup().weeklyGoalMinutes) {
      shown.push({
        label: `${minutesLabel(this.goalMinutes())} a week`,
        detail: goalDetail,
        tone: GOAL_REASON_TONE,
      });
    }
    return shown;
  });

  isOn(key: ModuleKey): boolean {
    return key === MODULE_KEY.RESOURCE_LIBRARY || this.selected().has(key);
  }

  classesFor(key: ModuleKey) {
    if (this.isOn(key)) return BLOCK_CLASSES.on;
    return BLOCK_CLASSES.off;
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

  private reasonOf(setting: SetupSetting): string | null {
    const reason = this.setup().reasons.find((candidate) => candidate.setting === setting);
    if (!reason) return null;
    return reasonFor(reason.answers) || null;
  }
}
