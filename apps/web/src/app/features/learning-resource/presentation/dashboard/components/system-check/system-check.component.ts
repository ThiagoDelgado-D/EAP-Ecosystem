import { Component, input, output } from '@angular/core';
import type {
  EnergyLevel,
  MentalStateType,
} from '@features/learning-resource/domain/learning-resource.model.js';

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
      iconColor: 'text-orange-400',
      bgColor: 'bg-orange-950/60',
      activeRing: 'border-orange-500/60',
    },
    {
      value: 'Medium',
      label: 'Med',
      iconColor: 'text-violet-400',
      bgColor: 'bg-violet-950/60',
      activeRing: 'border-violet-500',
    },
    {
      value: 'High',
      label: 'High',
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-950/60',
      activeRing: 'border-emerald-500/60',
    },
  ];

  readonly mentalStateOptions: MentalStateOption[] = [
    { value: 'deep_focus', label: 'Deep Focus' },
    { value: 'light_read', label: 'Light Read' },
    { value: 'creative', label: 'Creative' },
    { value: 'quick_op', label: 'Quick Op' },
    { value: 'review', label: 'Review' },
  ];

  selectEnergy(value: EnergyLevel): void {
    this.energyChange.emit(value);
  }

  selectMentalState(value: MentalStateType): void {
    this.mentalStateChange.emit(value);
  }
}
