import { Routes } from '@angular/router';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { PomodoroHttpRepository } from '@features/pomodoro/infrastructure/pomodoro-http.repository';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { LearningPathHttpRepository } from '@features/learning-path/infrastructure/learning-path-http.repository';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository';

export const pomodoroRoutes: Routes = [
  {
    path: '',
    providers: [
      { provide: PomodoroRepository, useClass: PomodoroHttpRepository },
      { provide: LearningPathRepository, useClass: LearningPathHttpRepository },
      { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
      PomodoroSessionStore,
      PomodoroPickerService,
    ],
    children: [
      {
        path: '',
        loadComponent: () => import('./start/start.component').then((m) => m.StartComponent),
      },
    ],
  },
];
