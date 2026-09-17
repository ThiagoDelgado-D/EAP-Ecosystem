import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { createPomodoroComponentTestProviders } from '@features/pomodoro/application/mocks/pomodoro-component-test-providers';
import { expectExtendBreakFlash } from '@features/pomodoro/application/mocks/expect-extend-break-flash';
import { PomodoroMiniWidgetComponent } from './pomodoro-mini-widget.component';

function setup() {
  const navigateByUrl = vi.fn();
  const { providers, pomodoroRepository } = createPomodoroComponentTestProviders(navigateByUrl);
  const dialogOpen = vi.fn();

  TestBed.configureTestingModule({
    providers: [...providers, { provide: MatDialog, useValue: { open: dialogOpen } }],
  });

  const store = TestBed.inject(PomodoroSessionStore);
  const component = TestBed.createComponent(PomodoroMiniWidgetComponent).componentInstance;
  return { component, store, pomodoroRepository, navigateByUrl, dialogOpen };
}

describe('PomodoroMiniWidgetComponent', () => {
  test('should show the free-focus context once a session starts', async () => {
    const { component, store } = setup();

    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    expect(component.contextDisplay()).toEqual({ title: 'Free focus', subtitle: 'No material attached' });
  });

  test('should toggle between the expanded card and the collapsed pill', () => {
    const { component } = setup();

    expect(component.collapsed()).toBe(false);
    component.toggleCollapsed();
    expect(component.collapsed()).toBe(true);
    component.toggleCollapsed();
    expect(component.collapsed()).toBe(false);
  });

  test('should delegate pause toggling to the session store', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    component.togglePause();

    expect(store.paused()).toBe(true);
  });

  test('should navigate to the full view when expanded', () => {
    const { component, navigateByUrl } = setup();

    component.goFull();

    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro/active');
  });

  test('should navigate to the end screen instead of ending the session directly', async () => {
    const { component, store, navigateByUrl } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    component.endSession();

    expect(store.activeSession()).not.toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro/end');
  });

  test('should switch target through the browse-picker dialog', async () => {
    const { component, store, dialogOpen } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    const resourceId = crypto.randomUUID();
    dialogOpen.mockReturnValue({ afterClosed: () => of({ kind: 'resource', resourceId }) });

    await component.openSwitchDialog();

    expect(store.segments()).toHaveLength(2);
    expect(component.currentTarget()).toEqual({ kind: 'resource', resourceId });
  });

  test('should show the break countdown once a break starts', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    await store.startBreak();

    expect(store.phase()).toBe('break');
    expect(store.breakRemainingLabel()).toBe('05:00');
  });

  test('should add 5 minutes to the break when extended', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    await store.startBreak();

    await component.extendBreak();

    expect(store.breakRemainingLabel()).toBe('10:00');
  });

  test('should flag justExtended briefly when the break is extended', async () => {
    const { component, store } = setup();
    await expectExtendBreakFlash(component, store);
  });

  test('should end the break and navigate back to start', async () => {
    const { component, store, navigateByUrl } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    await store.startBreak();

    await component.finishBreak();

    expect(store.phase()).toBe('focus');
    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro');
  });

  describe('planned time reached', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('should mirror the store prompt once the countdown hits zero', async () => {
      const { component, store } = setup();
      await store.start({ plannedMin: 25, target: { kind: 'free' } });

      expect(component.plannedTimeReached()).toBe(false);

      vi.advanceTimersByTime(25 * 60 * 1000);
      TestBed.tick();

      expect(component.plannedTimeReached()).toBe(true);
    });

    test('keepGoing should replace the session and clear the prompt', async () => {
      const { component, store } = setup();
      const session = await store.start({ plannedMin: 25, target: { kind: 'free' } });
      vi.advanceTimersByTime(25 * 60 * 1000);
      TestBed.tick();

      await component.keepGoing();

      expect(component.plannedTimeReached()).toBe(false);
      expect(store.activeSession()?.id).not.toBe(session!.id);
    });
  });
});
