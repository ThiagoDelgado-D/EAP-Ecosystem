import { Component, input, linkedSignal, output } from '@angular/core';
import type { IntakeAnswer } from '@features/auth/domain/intake.model';
import { toneVar } from '@shared/utils/tone';
import type { IntakeOption } from '../intake-options';

const CHOSEN_CLASSES = {
  card: 'border-(--tone)/50 bg-(--tone)/13 shadow-(--shadow-soft)',
  glyph: 'bg-(--tone) text-white',
};

const IDLE_CLASSES = {
  card: 'border-line-soft bg-surface-raised hover:border-line-strong',
  glyph: 'bg-surface-overlay text-ink-dim group-hover:text-ink-strong',
};

@Component({
  selector: 'app-intake-step',
  standalone: true,
  templateUrl: './intake-step.component.html',
})
export class IntakeStepComponent<T extends IntakeAnswer> {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly options = input.required<readonly IntakeOption<T>[]>();
  readonly multiple = input(false);
  readonly answered = input<readonly T[]>([]);
  readonly skippable = input(false);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly answer = output<T[]>();
  readonly back = output<void>();
  readonly skip = output<void>();

  readonly toneVar = toneVar;
  readonly CHOSEN_CLASSES = CHOSEN_CLASSES;
  readonly IDLE_CLASSES = IDLE_CLASSES;

  readonly chosen = linkedSignal<T[]>(() => [...this.answered()]);

  isChosen(key: T): boolean {
    return this.chosen().includes(key);
  }

  choose(key: T): void {
    if (this.loading()) return;
    if (!this.multiple()) {
      this.chosen.set([key]);
      return;
    }
    const next = this.isChosen(key)
      ? this.chosen().filter((chosen) => chosen !== key)
      : [...this.chosen(), key];
    this.chosen.set(
      this.options()
        .map((option) => option.key)
        .filter((option) => next.includes(option)),
    );
  }

  submit(): void {
    if (this.chosen().length === 0 || this.loading()) return;
    this.answer.emit(this.chosen());
  }
}
