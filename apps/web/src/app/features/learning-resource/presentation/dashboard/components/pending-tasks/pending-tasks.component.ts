import { Component } from '@angular/core';

export interface PendingTask {
  id: string;
  name: string;
  category: string;
  estimateLabel: string;
  iconVariant: 'lightning' | 'edit' | 'code' | 'folder';
}

// Hardcoded — task management is not in the current roadmap scope.
// These will be replaced with real data when the task/session module is added.
const MOCK_TASKS: PendingTask[] = [
  {
    id: '1',
    name: 'Refactor API Gateway',
    category: 'Infrastructure',
    estimateLabel: '2h',
    iconVariant: 'lightning',
  },
  {
    id: '2',
    name: 'Draft System Documentation',
    category: 'Writing',
    estimateLabel: '45min',
    iconVariant: 'edit',
  },
  {
    id: '3',
    name: 'Review Pull Requests',
    category: 'Routine',
    estimateLabel: '15m',
    iconVariant: 'code',
  },
  {
    id: '4',
    name: 'Archive Q3 Reports',
    category: 'Admin',
    estimateLabel: '30m',
    iconVariant: 'folder',
  },
];

@Component({
  selector: 'app-pending-tasks',
  standalone: true,
  templateUrl: './pending-tasks.component.html',
})
export class PendingTasksComponent {
  readonly tasks = MOCK_TASKS;

  getIconBg(variant: PendingTask['iconVariant']): string {
    const map: Record<PendingTask['iconVariant'], string> = {
      lightning: 'bg-violet-950/60 text-violet-400',
      edit: 'bg-slate-800 text-slate-300',
      code: 'bg-orange-950/60 text-orange-400',
      folder: 'bg-yellow-950/60 text-yellow-400',
    };
    return map[variant];
  }
}
