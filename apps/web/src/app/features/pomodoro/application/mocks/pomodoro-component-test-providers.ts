import type { Provider } from '@angular/core';
import { Router } from '@angular/router';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { mockPomodoroRepository } from './mock-pomodoro.repository';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { mockLearningPathRepository } from '@features/learning-path/application/mocks/mock-learning-path.repository';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { mockLearningResourceRepository } from '@features/learning-resource/application/mocks/mock-learning-resource.repository';

export function createPomodoroComponentTestProviders(navigateByUrl: (url: string) => unknown) {
  const pomodoroRepository = mockPomodoroRepository();
  const learningPathRepository = mockLearningPathRepository();
  const learningResourceRepository = mockLearningResourceRepository();

  const providers: Provider[] = [
    PomodoroSessionStore,
    PomodoroPickerService,
    { provide: PomodoroRepository, useValue: pomodoroRepository },
    { provide: LearningPathRepository, useValue: learningPathRepository },
    { provide: LearningResourceRepository, useValue: learningResourceRepository },
    { provide: Router, useValue: { navigateByUrl } },
  ];

  return { providers, pomodoroRepository, learningPathRepository, learningResourceRepository };
}
