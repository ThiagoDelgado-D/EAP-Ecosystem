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
  iconColor: string;
  bgColor: string;
  activeRing: string;
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

  readonly energyChange = output<EnergyLevel>();
  readonly mentalStateChange = output<MentalStateType>();

  readonly energyOptions: EnergyOption[] = [
    {
      value: 'Low',
      label: 'Low',
      iconColor: 'text-energy-low',
      bgColor: 'bg-energy-low/10',
      activeRing: 'border-energy-low/60',
    },
    {
      value: 'Medium',
      label: 'Medium',
      iconColor: 'text-energy-medium',
      bgColor: 'bg-energy-medium/10',
      activeRing: 'border-energy-medium/60',
    },
    {
      value: 'High',
      label: 'High',
      iconColor: 'text-energy-high',
      bgColor: 'bg-energy-high/10',
      activeRing: 'border-energy-high/60',
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
