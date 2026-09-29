import { Component, input, output } from '@angular/core';
import type {
  EnergyLevel,
  MentalStateType,
} from '@features/learning-resource/domain/learning-resource.model.js';
import {
  MENTAL_STATE_LABELS,
  MENTAL_STATE_TYPES,
} from '@features/learning-resource/domain/learning-resource.constants.js';

interface EnergyOption {
  value: EnergyLevel;
  label: string;
  level: number;
  tone: string;
  hint: string;
  activeStyle: string;
}

interface MentalStateOption {
  value: MentalStateType;
  label: string;
}

@Component({
  selector: 'app-system-check',
  standalone: true,
  templateUrl: './system-check.component.html',
})
export class SystemCheckComponent {
  readonly selectedEnergy = input.required<EnergyLevel>();
  readonly selectedMentalState = input.required<MentalStateType>();
  readonly selectedAvailableMinutes = input.required<number>();
  readonly availableMinutesOptions = input.required<readonly number[]>();

  readonly energyChange = output<EnergyLevel>();
  readonly mentalStateChange = output<MentalStateType>();
  readonly availableMinutesChange = output<number>();

  selectAvailableMinutes(value: number): void {
    this.availableMinutesChange.emit(value);
  }

  readonly energyOptions: EnergyOption[] = [
    {
      value: 'Low',
      label: 'Low',
      level: 1,
      tone: 'var(--color-accent)',
      hint: 'Light reads and quick reviews',
      activeStyle:
        'background: color-mix(in oklab, var(--color-accent) 14%, var(--color-surface-raised)); border-color: color-mix(in oklab, var(--color-accent) 45%, transparent);',
    },
    {
      value: 'Medium',
      label: 'Medium',
      level: 2,
      tone: 'var(--tone-ochre, var(--color-accent))',
      hint: 'Steady progress on open work',
      activeStyle:
        'background: color-mix(in oklab, var(--tone-ochre, var(--color-accent)) 14%, var(--color-surface-raised)); border-color: color-mix(in oklab, var(--tone-ochre, var(--color-accent)) 45%, transparent);',
    },
    {
      value: 'High',
      label: 'High',
      level: 3,
      tone: 'var(--tone-ember, var(--color-accent))',
      hint: 'Deep focus on hard material',
      activeStyle:
        'background: color-mix(in oklab, var(--tone-ember, var(--color-accent)) 14%, var(--color-surface-raised)); border-color: color-mix(in oklab, var(--tone-ember, var(--color-accent)) 45%, transparent);',
    },
  ];

  readonly mentalStateOptions: MentalStateOption[] = MENTAL_STATE_TYPES.map((value) => ({
    value,
    label: MENTAL_STATE_LABELS[value],
  }));

  selectEnergy(value: EnergyLevel): void {
    this.energyChange.emit(value);
  }

  selectMentalState(value: MentalStateType): void {
    this.mentalStateChange.emit(value);
  }
}
