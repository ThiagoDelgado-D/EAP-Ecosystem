import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { tokenRefreshInterceptor } from '@core/interceptors/token-refresh.interceptor';

import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, tokenRefreshInterceptor])),
    { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
  ],
};
