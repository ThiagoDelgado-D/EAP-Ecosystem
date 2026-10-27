import { Component, computed, input, linkedSignal, output } from '@angular/core';
import {
  isOptionalModule,
  MODULE_KEY,
  OPTIONAL_MODULES,
  type ModuleKey,
} from '@features/auth/domain/auth.model';
import {
  WEEKLY_GOAL_SETTING,
  type ComposedSetup,
  type ConfirmedSetup,
  type SetupSetting,
} from '@features/auth/domain/intake.model';
import { WEEKLY_GOAL_MINUTES } from '@features/settings/domain/settings.model';
import { minutesLabel } from '@shared/utils/minutes-label';
import { toneVar, type Tone } from '@shared/utils/tone';
import { reasonFor } from '../intake-options';
import { MODULE_CARDS, type ModuleCard } from '../module-cards';

interface ShownReason {
  label: string;
  detail: string;
  tone: Tone;
}

type ModuleChange = 'new' | 'off';

const GOAL_REASON_TONE: Tone = 'ochre';

const CHANGE_LABELS: Record<ModuleChange, string> = {
  new: 'New',
  off: 'Turns off',
};

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
  readonly eyebrow = input('Ready');
  readonly title = input.required<string>();
  readonly subtitle = input(
    'Nothing here is final. Tap a block to turn it on or off, and retake this from Settings when your context changes.',
  );
  readonly confirmLabel = input('Apply and start');
  readonly pendingLabel = input('Setting up your space...');
  readonly note = input('Saved to your profile');
  readonly setup = input.required<ComposedSetup>();
  readonly current = input<ConfirmedSetup | null>(null);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly confirm = output<ConfirmedSetup>();
  readonly back = output<void>();

  readonly modules = MODULE_CARDS;
  readonly WEEKLY_GOAL_MINUTES = WEEKLY_GOAL_MINUTES;
  readonly toneVar = toneVar;
  readonly minutesLabel = minutesLabel;
  readonly CHANGE_LABELS = CHANGE_LABELS;

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

  readonly previousGoalMinutes = computed(() => {
    const current = this.current();
    if (!current || current.weeklyGoalMinutes === this.goalMinutes()) return null;
    return current.weeklyGoalMinutes;
  });

  changeOf(key: ModuleKey): ModuleChange | null {
    const current = this.current();
    if (!current || key === MODULE_KEY.RESOURCE_LIBRARY) return null;
    const wasOn = isOptionalModule(key) && current.enabledModules.includes(key);
    if (this.isOn(key) && !wasOn) return 'new';
    if (!this.isOn(key) && wasOn) return 'off';
    return null;
  }

  blockLabel(module: ModuleCard): string {
    if (module.locked) return `${module.label} (always on)`;
    const change = this.changeOf(module.key);
    if (!change) return module.label;
    return `${module.label} (${CHANGE_LABELS[change].toLowerCase()})`;
  }

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
