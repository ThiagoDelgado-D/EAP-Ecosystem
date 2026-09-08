import type { EnumOption } from '@shared/components/enum-badge/enum-badge.types';
import type {
  DifficultyLevel,
  EnergyLevel,
  MentalStateType,
  ResourceStatus,
} from '@features/learning-resource/domain/learning-resource.model';

export const DIFFICULTY_BADGE_OPTIONS: EnumOption<DifficultyLevel>[] = [
  { value: 'Low',    label: 'Low',    badgeClass: 'bg-energy-low/10 border border-energy-low/20 text-energy-low',       dotClass: 'bg-energy-low'    },
  { value: 'Medium', label: 'Medium', badgeClass: 'bg-energy-medium/10 border border-energy-medium/20 text-energy-medium', dotClass: 'bg-energy-medium' },
  { value: 'High',   label: 'High',   badgeClass: 'bg-energy-high/10 border border-energy-high/20 text-energy-high',    dotClass: 'bg-energy-high'   },
];

export const ENERGY_BADGE_OPTIONS: EnumOption<EnergyLevel>[] = [
  { value: 'Low',    label: 'Low',    badgeClass: 'bg-energy-low/10 border border-energy-low/20 text-energy-low',       dotClass: 'bg-energy-low'    },
  { value: 'Medium', label: 'Medium', badgeClass: 'bg-energy-medium/10 border border-energy-medium/20 text-energy-medium', dotClass: 'bg-energy-medium' },
  { value: 'High',   label: 'High',   badgeClass: 'bg-energy-high/10 border border-energy-high/20 text-energy-high',    dotClass: 'bg-energy-high'   },
];

export const STATUS_BADGE_OPTIONS: EnumOption<ResourceStatus>[] = [
  { value: 'Pending',    label: 'Pending',     badgeClass: 'bg-status-pending/10 border border-status-pending/20 text-status-pending',       dotClass: 'bg-status-pending'      },
  { value: 'InProgress', label: 'In Progress', badgeClass: 'bg-status-in-progress/10 border border-status-in-progress/20 text-status-in-progress', dotClass: 'bg-status-in-progress' },
  { value: 'Completed',  label: 'Completed',   badgeClass: 'bg-status-done/10 border border-status-done/20 text-status-done',                dotClass: 'bg-status-done'         },
];

export const MENTAL_STATE_BADGE_OPTIONS: EnumOption<MentalStateType>[] = [
  { value: 'deep_focus', label: 'Deep Focus', badgeClass: 'bg-state-deep-focus/10 border border-state-deep-focus/20 text-state-deep-focus', dotClass: 'bg-state-deep-focus' },
  { value: 'light_read', label: 'Light Read', badgeClass: 'bg-state-light-read/10 border border-state-light-read/20 text-state-light-read', dotClass: 'bg-state-light-read' },
  { value: 'creative',   label: 'Creative',   badgeClass: 'bg-state-creative/10 border border-state-creative/20 text-state-creative',       dotClass: 'bg-state-creative'   },
  { value: 'quick_op',   label: 'Quick Op',   badgeClass: 'bg-state-quick-op/10 border border-state-quick-op/20 text-state-quick-op',       dotClass: 'bg-state-quick-op'   },
  { value: 'review',     label: 'Review',     badgeClass: 'bg-state-review/10 border border-state-review/20 text-state-review',             dotClass: 'bg-state-review'     },
];
