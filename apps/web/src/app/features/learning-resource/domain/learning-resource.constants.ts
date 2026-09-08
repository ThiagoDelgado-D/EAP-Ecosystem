export const DIFFICULTY_LEVELS = ['Low', 'Medium', 'High'] as const;
export const ENERGY_LEVELS = ['Low', 'Medium', 'High'] as const;
export const RESOURCE_STATUSES = ['Pending', 'InProgress', 'Completed'] as const;
export const MENTAL_STATE_TYPES = [
  'deep_focus',
  'light_read',
  'creative',
  'quick_op',
  'review',
] as const;

export const RESOURCE_STATUS_LABELS: Record<(typeof RESOURCE_STATUSES)[number], string> = {
  Pending: 'Pending',
  InProgress: 'In Progress',
  Completed: 'Completed',
};

export const MENTAL_STATE_LABELS: Record<(typeof MENTAL_STATE_TYPES)[number], string> = {
  deep_focus: 'Deep Focus',
  light_read: 'Light Read',
  creative: 'Creative',
  quick_op: 'Quick Op',
  review: 'Review',
};
