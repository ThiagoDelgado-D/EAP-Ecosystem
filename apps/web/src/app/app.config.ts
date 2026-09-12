import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { tokenRefreshInterceptor } from '@core/interceptors/token-refresh.interceptor';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { PomodoroHttpRepository } from '@features/pomodoro/infrastructure/pomodoro-http.repository';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { LearningPathHttpRepository } from '@features/learning-path/infrastructure/learning-path-http.repository';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository';

import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, tokenRefreshInterceptor])),
    { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
    { provide: PomodoroRepository, useClass: PomodoroHttpRepository },
    { provide: LearningPathRepository, useClass: LearningPathHttpRepository },
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
    PomodoroSessionStore,
    PomodoroPickerService,
  ],
};
