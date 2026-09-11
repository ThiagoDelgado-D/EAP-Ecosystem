import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PomodoroRepository } from '@features/pomodoro/domain/pomodoro.repository';
import { mockPomodoroRepository } from '@features/pomodoro/application/mocks/mock-pomodoro.repository';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { mockLearningPathRepository } from '@features/learning-path/application/mocks/mock-learning-path.repository';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { mockLearningResourceRepository } from '@features/learning-resource/application/mocks/mock-learning-resource.repository';
import { ActiveComponent } from './active.component';

function setup() {
  const repository = mockPomodoroRepository();
  const learningPathRepository = mockLearningPathRepository();
  const learningResourceRepository = mockLearningResourceRepository();
  const navigateByUrl = vi.fn();

  TestBed.configureTestingModule({
    providers: [
      PomodoroSessionStore,
      PomodoroPickerService,
      { provide: PomodoroRepository, useValue: repository },
      { provide: LearningPathRepository, useValue: learningPathRepository },
      { provide: LearningResourceRepository, useValue: learningResourceRepository },
      { provide: Router, useValue: { navigateByUrl } },
    ],
  });

  const store = TestBed.inject(PomodoroSessionStore);
  const fixture = TestBed.createComponent(ActiveComponent);
  return { component: fixture.componentInstance, fixture, store, repository, learningPathRepository, navigateByUrl };
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

    component.ngOnDestroy();
  });

  test('should freeze the countdown while paused', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    vi.advanceTimersByTime(10 * 1000);
    component.togglePause();
    vi.advanceTimersByTime(60 * 1000);

    expect(component.remainingLabel()).toBe('24:50');

    component.ngOnDestroy();
  });

  test('should show "Free focus" context for a free target', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    expect(component.contextDisplay()).toEqual({ title: 'Free focus', subtitle: 'No material attached' });
    expect(component.description().isFree).toBe(true);

    component.ngOnDestroy();
  });

  test('should append a new segment and update the context when switching target', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    const resourceId = crypto.randomUUID();

    await component.applySwitchedTarget({ kind: 'resource', resourceId });

    expect(store.segments()).toHaveLength(2);
    expect(component.currentTarget()).toEqual({ kind: 'resource', resourceId });

    component.ngOnDestroy();
  });

  test('should label each segment total with its own node title instead of a generic "Path step"', async () => {
    const { component, store, learningPathRepository } = setup();
    const pathId = crypto.randomUUID();
    const gitNodeId = crypto.randomUUID();
    const dockerNodeId = crypto.randomUUID();
    learningPathRepository.paths = [
      { id: pathId, userId: crypto.randomUUID(), title: 'Frontend desde cero', mode: 'sequential', source: 'manual', createdAt: new Date(), updatedAt: new Date() },
    ];
    learningPathRepository.nodes = [
      { id: gitNodeId, pathId, title: 'Git y control de versiones', progress: 'in_progress', createdAt: new Date(), updatedAt: new Date() },
      { id: dockerNodeId, pathId, title: '¿Qué es Docker?', progress: 'pending', createdAt: new Date(), updatedAt: new Date() },
    ];
    await component.picker.load();
    await store.start({ plannedMin: 25, target: { kind: 'node', learningPathId: pathId, learningPathNodeId: gitNodeId } });

    await component.applySwitchedTarget({ kind: 'node', learningPathId: pathId, learningPathNodeId: dockerNodeId });

    const labels = component.segmentTotals().map((total) => component.segmentTargetLabel(total.target));
    expect(labels).toContain('Git y control de versiones');
    expect(labels).toContain('¿Qué es Docker?');

    component.ngOnDestroy();
  });

  test('should end the session and navigate back to start', async () => {
    const { component, store, navigateByUrl } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    await component.endSession();

    expect(store.activeSession()).toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro');

    component.ngOnDestroy();
  });

  test('should navigate back to start when there is no active session', () => {
    const { component, navigateByUrl } = setup();

    component.backToStart();

    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro');

    component.ngOnDestroy();
  });

  test('should have no previous target right after starting the session', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    expect(component.previousTarget()).toBeNull();

    component.ngOnDestroy();
  });

  test('should track the target before the current one across a switch', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    const resourceId = crypto.randomUUID();

    await component.applySwitchedTarget({ kind: 'resource', resourceId });

    expect(component.previousTarget()).toEqual({ kind: 'free' });
    expect(component.currentTarget()).toEqual({ kind: 'resource', resourceId });

    component.ngOnDestroy();
  });
});
