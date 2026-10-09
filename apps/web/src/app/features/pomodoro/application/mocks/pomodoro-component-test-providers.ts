import type { Provider } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, type Params } from '@angular/router';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { mockPomodoroRepository } from './mock-pomodoro.repository';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { mockLearningPathRepository } from '@features/learning-path/application/mocks/mock-learning-path.repository';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { mockLearningResourceRepository } from '@features/learning-resource/application/mocks/mock-learning-resource.repository';
import { CalibrationService } from '@features/recommendation/application/calibration.service';
import { RecommendationRepository } from '@features/recommendation/domain/recommendation.repository';
import { mockRecommendationRepository } from '@features/recommendation/application/mocks/mock-recommendation.repository';
import { WeeklyGoalService } from '@features/settings/application/weekly-goal.service';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import { mockPreferencesRepository } from '@features/settings/application/mocks/mock-preferences.repository';

export function createPomodoroComponentTestProviders(
  navigateByUrl: (url: string) => unknown,
  queryParams: Params = {},
) {
  const pomodoroRepository = mockPomodoroRepository();
  const learningPathRepository = mockLearningPathRepository();
  const learningResourceRepository = mockLearningResourceRepository();
  const recommendationRepository = mockRecommendationRepository();
  const preferencesRepository = mockPreferencesRepository();

  const providers: Provider[] = [
    PomodoroSessionStore,
    PomodoroPickerService,
    { provide: PomodoroRepository, useValue: pomodoroRepository },
    { provide: LearningPathRepository, useValue: learningPathRepository },
    { provide: LearningResourceRepository, useValue: learningResourceRepository },
    CalibrationService,
    { provide: RecommendationRepository, useValue: recommendationRepository },
    WeeklyGoalService,
    { provide: PreferencesRepository, useValue: preferencesRepository },
    { provide: Router, useValue: { navigateByUrl } },
    {
      provide: ActivatedRoute,
      useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
    },
  ];

  return {
    providers,
    pomodoroRepository,
    learningPathRepository,
    learningResourceRepository,
    recommendationRepository,
    preferencesRepository,
  };
}
