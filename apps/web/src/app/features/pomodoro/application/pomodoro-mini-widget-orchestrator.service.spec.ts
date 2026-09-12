import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';
import { createPomodoroComponentTestProviders } from './mocks/pomodoro-component-test-providers';
import { PomodoroSessionStore } from './pomodoro-session.store';
import { PomodoroOverlayHostService } from './pomodoro-overlay-host.service';
import { PomodoroMiniWidgetOrchestratorService } from './pomodoro-mini-widget-orchestrator.service';

const MINI_WIDGET_KEY = 'pomodoro-mini';

function setup(initialUrl: string) {
  const { providers } = createPomodoroComponentTestProviders(vi.fn());
  const events = new Subject<NavigationEnd>();
  const fakeRouter = { url: initialUrl, events };

  TestBed.configureTestingModule({
    providers: [...providers, { provide: Router, useValue: fakeRouter }],
  });

  const store = TestBed.inject(PomodoroSessionStore);
  const overlayHost = TestBed.inject(PomodoroOverlayHostService);
  const appRef = TestBed.inject(ApplicationRef);
  TestBed.inject(PomodoroMiniWidgetOrchestratorService);

  return { store, overlayHost, appRef, events };
}

function navigateTo(events: Subject<NavigationEnd>, url: string): void {
  events.next(new NavigationEnd(1, url, url));
}

function waitForShown(overlayHost: PomodoroOverlayHostService, key: string, expected: boolean): Promise<void> {
  return vi.waitFor(() => {
    if (overlayHost.isShown(key) !== expected) throw new Error('not yet');
  });
}

describe('PomodoroMiniWidgetOrchestratorService', () => {
  afterEach(() => {
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  test('should show the mini widget once a session starts while browsing outside /pomodoro', async () => {
    const { store, overlayHost, appRef } = setup('/library');

    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    appRef.tick();

    await waitForShown(overlayHost, MINI_WIDGET_KEY, true);
  });

  test('should keep the widget hidden while the user is on a /pomodoro route', async () => {
    const { store, overlayHost, appRef } = setup('/pomodoro/active');

    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    appRef.tick();

    expect(overlayHost.isShown(MINI_WIDGET_KEY)).toBe(false);
  });

  test('should show and hide the widget as the user navigates in and out of /pomodoro', async () => {
    const { store, overlayHost, appRef, events } = setup('/pomodoro/active');
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    appRef.tick();
    expect(overlayHost.isShown(MINI_WIDGET_KEY)).toBe(false);

    navigateTo(events, '/library');
    appRef.tick();
    await waitForShown(overlayHost, MINI_WIDGET_KEY, true);

    navigateTo(events, '/pomodoro/end');
    appRef.tick();
    expect(overlayHost.isShown(MINI_WIDGET_KEY)).toBe(false);
  });

  test('should hide the widget once the session ends', async () => {
    const { store, overlayHost, appRef } = setup('/library');
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    appRef.tick();
    await waitForShown(overlayHost, MINI_WIDGET_KEY, true);

    await store.end();
    appRef.tick();

    expect(overlayHost.isShown(MINI_WIDGET_KEY)).toBe(false);
  });
});
