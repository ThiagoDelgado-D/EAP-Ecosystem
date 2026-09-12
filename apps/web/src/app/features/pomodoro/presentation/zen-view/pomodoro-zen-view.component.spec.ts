import { TestBed } from '@angular/core/testing';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroOverlayHostService } from '@features/pomodoro/application/pomodoro-overlay-host.service';
import { createPomodoroComponentTestProviders } from '@features/pomodoro/application/mocks/pomodoro-component-test-providers';
import { PomodoroZenViewComponent, POMODORO_ZEN_KEY } from './pomodoro-zen-view.component';

function setup() {
  const navigateByUrl = vi.fn();
  const { providers } = createPomodoroComponentTestProviders(navigateByUrl);

  TestBed.configureTestingModule({ providers });

  const store = TestBed.inject(PomodoroSessionStore);
  const overlayHost = TestBed.inject(PomodoroOverlayHostService);
  const hide = vi.spyOn(overlayHost, 'hide');
  const fixture = TestBed.createComponent(PomodoroZenViewComponent);
  return { component: fixture.componentInstance, fixture, store, hide, navigateByUrl };
}

describe('PomodoroZenViewComponent', () => {
  test('should show the remaining time once a session starts', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    expect(component.store.remainingLabel()).toBe('25:00');
  });

  test('should delegate pause toggling to the session store', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    component.togglePause();

    expect(store.paused()).toBe(true);
  });

  test('should hide the zen overlay when exiting', () => {
    const { component, hide } = setup();

    component.exit();

    expect(hide).toHaveBeenCalledWith(POMODORO_ZEN_KEY);
  });

  test('should hide the zen overlay when pressing Escape', () => {
    const { fixture, hide } = setup();
    fixture.detectChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(hide).toHaveBeenCalledWith(POMODORO_ZEN_KEY);
  });

  test('should hide the overlay and navigate to the end screen instead of ending directly', async () => {
    const { component, store, hide, navigateByUrl } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    component.endSession();

    expect(hide).toHaveBeenCalledWith(POMODORO_ZEN_KEY);
    expect(store.activeSession()).not.toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro/end');
  });
});
