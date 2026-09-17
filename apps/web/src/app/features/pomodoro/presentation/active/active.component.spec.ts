import { TestBed } from '@angular/core/testing';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroOverlayHostService } from '@features/pomodoro/application/pomodoro-overlay-host.service';
import { createPomodoroComponentTestProviders } from '@features/pomodoro/application/mocks/pomodoro-component-test-providers';
import { expectPlannedTimeReachedFlow } from '@features/pomodoro/application/mocks/expect-planned-time-reached-flow';
import { ActiveComponent } from './active.component';

function setup() {
  const navigateByUrl = vi.fn();
  const { providers, pomodoroRepository, learningPathRepository } =
    createPomodoroComponentTestProviders(navigateByUrl);

  TestBed.configureTestingModule({ providers });

  const store = TestBed.inject(PomodoroSessionStore);
  const overlayHost = TestBed.inject(PomodoroOverlayHostService);
  const fixture = TestBed.createComponent(ActiveComponent);
  return {
    component: fixture.componentInstance,
    fixture,
    store,
    overlayHost,
    repository: pomodoroRepository,
    learningPathRepository,
    navigateByUrl,
  };
}

describe('ActiveComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('should count down remaining time from the planned duration', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    expect(component.remainingLabel()).toBe('25:00');

    vi.advanceTimersByTime(90 * 1000);

    expect(component.remainingLabel()).toBe('23:30');
  });

  test('should show the planned-time-reached prompt and let keepGoing clear it', async () => {
    const { component, store } = setup();
    await expectPlannedTimeReachedFlow(component, store);
  });

  test('toggleSound should flip the store sound preference', async () => {
    const { component } = setup();

    expect(component.soundEnabled()).toBe(true);

    component.toggleSound();

    expect(component.soundEnabled()).toBe(false);
  });

  test('should freeze the countdown while paused', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    vi.advanceTimersByTime(10 * 1000);
    component.togglePause();
    vi.advanceTimersByTime(60 * 1000);

    expect(component.remainingLabel()).toBe('24:50');
  });

  test('should show "Free focus" context for a free target', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    expect(component.contextDisplay()).toEqual({
      title: 'Free focus',
      subtitle: 'No material attached',
    });
    expect(component.description().isFree).toBe(true);
  });

  test('should append a new segment and update the context when switching target', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    const resourceId = crypto.randomUUID();

    await component.applySwitchedTarget({ kind: 'resource', resourceId });

    expect(store.segments()).toHaveLength(2);
    expect(component.currentTarget()).toEqual({ kind: 'resource', resourceId });
  });

  test('should label each segment total with its own node title instead of a generic "Path step"', async () => {
    const { component, store, learningPathRepository } = setup();
    const pathId = crypto.randomUUID();
    const gitNodeId = crypto.randomUUID();
    const dockerNodeId = crypto.randomUUID();
    learningPathRepository.paths = [
      {
        id: pathId,
        userId: crypto.randomUUID(),
        title: 'Frontend desde cero',
        mode: 'sequential',
        source: 'manual',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    learningPathRepository.nodes = [
      {
        id: gitNodeId,
        pathId,
        title: 'Git y control de versiones',
        progress: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: dockerNodeId,
        pathId,
        title: '¿Qué es Docker?',
        progress: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    await component.picker.load();
    await store.start({
      plannedMin: 25,
      target: { kind: 'node', learningPathId: pathId, learningPathNodeId: gitNodeId },
    });

    await component.applySwitchedTarget({
      kind: 'node',
      learningPathId: pathId,
      learningPathNodeId: dockerNodeId,
    });

    const labels = component
      .segmentTotals()
      .map((total) => component.segmentTargetLabel(total.target));
    expect(labels).toContain('Git y control de versiones');
    expect(labels).toContain('¿Qué es Docker?');
  });

  test('should navigate to the end screen instead of ending the session directly', async () => {
    const { component, store, navigateByUrl } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    component.endSession();

    expect(store.activeSession()).not.toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro/end');
  });

  test('should minimize by navigating to the dashboard without ending the session', async () => {
    const { component, store, navigateByUrl } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    component.minimize();

    expect(store.activeSession()).not.toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  test('should show the zen overlay without ending or navigating away', async () => {
    const { component, store, overlayHost, navigateByUrl } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    component.openZen();

    expect(overlayHost.isShown('pomodoro-zen')).toBe(true);
    expect(store.activeSession()).not.toBeNull();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  test('should navigate back to start when there is no active session', () => {
    const { component, navigateByUrl } = setup();

    component.backToStart();

    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro');
  });

  test('should have no previous target right after starting the session', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    expect(component.previousTarget()).toBeNull();
  });

  test('should track the target before the current one across a switch', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    const resourceId = crypto.randomUUID();

    await component.applySwitchedTarget({ kind: 'resource', resourceId });

    expect(component.previousTarget()).toEqual({ kind: 'free' });
    expect(component.currentTarget()).toEqual({ kind: 'resource', resourceId });
  });

  test('should end the session and switch to the break phase when taking a break', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    await component.takeBreak();

    expect(component.phase()).toBe('break');
    expect(component.breakRemainingLabel()).toBe('05:00');
    expect(component.startingBreak()).toBe(false);
    expect(store.activeSession()).toBeNull();
  });

  test('should add 5 minutes to the break when extended', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    await component.takeBreak();

    await component.extendBreak();

    expect(component.breakRemainingLabel()).toBe('10:00');
  });

  test('should let a break be taken mid-session, well before the focus timer runs out', async () => {
    const { component, store, repository } = setup();
    await store.start({ plannedMin: 45, target: { kind: 'free' } });
    vi.advanceTimersByTime(30 * 60 * 1000);

    await component.takeBreak();

    expect(component.phase()).toBe('break');
    expect(repository.sessions[0]?.completedAt).toBeDefined();
  });

  test('should not offer switching material by keyboard shortcut while on break', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    await component.takeBreak();
    const openSwitchDialog = vi.spyOn(component, 'openSwitchDialog');

    component.onKeydown(new KeyboardEvent('keydown', { key: 's' }));

    expect(openSwitchDialog).not.toHaveBeenCalled();
    expect(store.phase()).toBe('break');
  });

  test('should flag justExtended briefly when the break is extended', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    await component.takeBreak();

    component.extendBreak();

    expect(component.justExtended()).toBe(true);
    vi.advanceTimersByTime(900);
    expect(component.justExtended()).toBe(false);
  });

  test('should end the break and navigate back to start, ready for a new session', async () => {
    const { component, store, navigateByUrl } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    await component.takeBreak();

    await component.finishBreak();

    expect(component.phase()).toBe('focus');
    expect(store.activeSession()).toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro');
  });
});
