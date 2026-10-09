import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { tokenRefreshInterceptor } from '@core/interceptors/token-refresh.interceptor';
import { AppTitleStrategy } from '@core/title/app-title.strategy';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { PomodoroHttpRepository } from '@features/pomodoro/infrastructure/pomodoro-http.repository';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { LearningPathHttpRepository } from '@features/learning-path/infrastructure/learning-path-http.repository';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository';
import { RecommendationRepository } from '@features/recommendation/domain/recommendation.repository';
import { RecommendationHttpRepository } from '@features/recommendation/infrastructure/recommendation-http.repository';
import { CalibrationService } from '@features/recommendation/application/calibration.service';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import { PreferencesHttpRepository } from '@features/settings/infrastructure/preferences-http.repository';
import { WeeklyGoalService } from '@features/settings/application/weekly-goal.service';

import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideHttpClient(withInterceptors([authInterceptor, tokenRefreshInterceptor])),
    { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
    { provide: PomodoroRepository, useClass: PomodoroHttpRepository },
    { provide: LearningPathRepository, useClass: LearningPathHttpRepository },
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
    { provide: RecommendationRepository, useClass: RecommendationHttpRepository },
    { provide: PreferencesRepository, useClass: PreferencesHttpRepository },
    PomodoroSessionStore,
    PomodoroPickerService,
    CalibrationService,
    WeeklyGoalService,
  ],
};
