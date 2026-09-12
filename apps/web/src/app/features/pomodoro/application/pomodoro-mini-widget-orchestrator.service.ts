import { Injectable, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { PomodoroSessionStore } from './pomodoro-session.store';
import { PomodoroOverlayHostService } from './pomodoro-overlay-host.service';

const MINI_WIDGET_KEY = 'pomodoro-mini';

@Injectable({ providedIn: 'root' })
export class PomodoroMiniWidgetOrchestratorService {
  private readonly store = inject(PomodoroSessionStore);
  private readonly overlayHost = inject(PomodoroOverlayHostService);
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  constructor() {
    effect(() => {
      const hasActiveSession = this.store.activeSession() !== null;
      const onPomodoroRoute = this.currentUrl().startsWith('/pomodoro');

      if (hasActiveSession && !onPomodoroRoute) {
        void this.showMiniWidget();
      } else {
        this.overlayHost.hide(MINI_WIDGET_KEY);
      }
    });
  }

  private async showMiniWidget(): Promise<void> {
    const { PomodoroMiniWidgetComponent } =
      await import('@features/pomodoro/presentation/mini-widget/pomodoro-mini-widget.component');
    this.overlayHost.show(MINI_WIDGET_KEY, PomodoroMiniWidgetComponent, 'floating-bottom-right');
  }
}
