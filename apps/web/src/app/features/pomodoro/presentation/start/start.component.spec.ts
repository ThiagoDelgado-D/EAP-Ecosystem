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
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import { StartComponent } from './start.component';

const now = new Date('2026-09-11T10:00:00.000Z');

function setup() {
  const pomodoroRepository = mockPomodoroRepository();
  const learningPathRepository = mockLearningPathRepository();
  const learningResourceRepository = mockLearningResourceRepository();
  const navigateByUrl = vi.fn();

  TestBed.configureTestingModule({
    providers: [
      PomodoroSessionStore,
      PomodoroPickerService,
      { provide: PomodoroRepository, useValue: pomodoroRepository },
      { provide: LearningPathRepository, useValue: learningPathRepository },
      { provide: LearningResourceRepository, useValue: learningResourceRepository },
      { provide: Router, useValue: { navigateByUrl } },
    ],
  });

  const component = TestBed.createComponent(StartComponent).componentInstance;
  return { component, pomodoroRepository, learningPathRepository, learningResourceRepository, navigateByUrl };
}

describe('StartComponent', () => {
  test('should re-load suggestions when the energy level changes', async () => {
    const { component, pomodoroRepository } = setup();
    pomodoroRepository.getSuggestion = vi.fn(async () => []);

    component.setEnergy('high');
    await Promise.resolve();

    expect(pomodoroRepository.getSuggestion).toHaveBeenCalledWith('high');
    expect(component.energy()).toBe('high');
  });

  test('should require both a duration and a target before starting is allowed', () => {
    const { component } = setup();

    expect(component.canStart()).toBe(false);

    component.pickDuration(25);
    expect(component.canStart()).toBe(false);

    component.pickFree();
    expect(component.canStart()).toBe(true);
    expect(component.description().isFree).toBe(true);
  });

  test('should toggle between hero and browse mode', () => {
    const { component } = setup();

    component.openBrowse();
    expect(component.mode()).toBe('browse');

    component.backToHero();
    expect(component.mode()).toBe('hero');
  });

  test('should auto-resolve to the single path when a library resource belongs to exactly one', async () => {
    const { component, learningPathRepository, learningResourceRepository } = setup();
    const pathId = crypto.randomUUID();
    const nodeId = crypto.randomUUID();
    const resourceId = crypto.randomUUID();
    learningPathRepository.paths = [
      { id: pathId, userId: crypto.randomUUID(), title: 'Rust for Backend Engineers', mode: 'sequential', source: 'manual', createdAt: now, updatedAt: now },
    ];
    learningPathRepository.nodes = [
      { id: nodeId, pathId, title: 'Trait Objects', learningResourceId: resourceId, progress: 'pending', createdAt: now, updatedAt: now },
    ];
    const resource: LearningResource = {
      id: resourceId,
      title: 'Rust Book Chapter 17',
      difficulty: 'Medium',
      energyLevel: 'Medium',
      status: 'Pending',
      estimatedDuration: { value: 45, isEstimated: true },
      topicIds: [],
      typeId: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    learningResourceRepository.resources = [resource];
    await component.picker.load();

    component.pickResource(resource);

    expect(component.pendingResourcePick()).toBeNull();
    expect(component.selectedTarget()).toEqual({
      kind: 'node',
      learningPathId: pathId,
      learningPathNodeId: nodeId,
      resourceId,
    });
  });

  test('should ask which path to count toward when a resource belongs to two or more', async () => {
    const { component, learningPathRepository, learningResourceRepository } = setup();
    const resourceId = crypto.randomUUID();
    const cleanArchPathId = crypto.randomUUID();
    const systemDesignPathId = crypto.randomUUID();
    const cleanArchNodeId = crypto.randomUUID();
    learningPathRepository.paths = [
      { id: cleanArchPathId, userId: crypto.randomUUID(), title: 'Frontend Architecture Mastery', mode: 'graph', source: 'manual', createdAt: now, updatedAt: now },
      { id: systemDesignPathId, userId: crypto.randomUUID(), title: 'System Design Prep', mode: 'graph', source: 'manual', createdAt: now, updatedAt: now },
    ];
    learningPathRepository.nodes = [
      { id: cleanArchNodeId, pathId: cleanArchPathId, title: 'Clean Architecture', learningResourceId: resourceId, progress: 'pending', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), pathId: systemDesignPathId, title: 'Clean Architecture', learningResourceId: resourceId, progress: 'pending', createdAt: now, updatedAt: now },
    ];
    const resource: LearningResource = {
      id: resourceId,
      title: 'Clean Architecture (Book)',
      difficulty: 'High',
      energyLevel: 'High',
      status: 'Pending',
      estimatedDuration: { value: 600, isEstimated: true },
      topicIds: [],
      typeId: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    learningResourceRepository.resources = [resource];
    await component.picker.load();

    component.pickResource(resource);

    expect(component.pendingResourcePick()?.options).toHaveLength(2);
    expect(component.selectedTarget()).toBeNull();

    component.pickPendingPath(component.pendingResourcePick()!.options[0]);

    expect(component.pendingResourcePick()).toBeNull();
    expect(component.selectedTarget()).toEqual({
      kind: 'node',
      learningPathId: cleanArchPathId,
      learningPathNodeId: cleanArchNodeId,
      resourceId,
    });
  });

  test('should fall back to a plain resource target when neither path is picked', async () => {
    const { component, learningPathRepository, learningResourceRepository } = setup();
    const resourceId = crypto.randomUUID();
    learningPathRepository.paths = [
      { id: crypto.randomUUID(), userId: crypto.randomUUID(), title: 'Frontend Architecture Mastery', mode: 'graph', source: 'manual', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), userId: crypto.randomUUID(), title: 'System Design Prep', mode: 'graph', source: 'manual', createdAt: now, updatedAt: now },
    ];
    const [pathA, pathB] = learningPathRepository.paths;
    learningPathRepository.nodes = [
      { id: crypto.randomUUID(), pathId: pathA.id, title: 'Clean Architecture', learningResourceId: resourceId, progress: 'pending', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), pathId: pathB.id, title: 'Clean Architecture', learningResourceId: resourceId, progress: 'pending', createdAt: now, updatedAt: now },
    ];
    const resource: LearningResource = {
      id: resourceId,
      title: 'Clean Architecture (Book)',
      difficulty: 'High',
      energyLevel: 'High',
      status: 'Pending',
      estimatedDuration: { value: 600, isEstimated: true },
      topicIds: [],
      typeId: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    learningResourceRepository.resources = [resource];
    await component.picker.load();
    component.pickResource(resource);

    component.pickPendingNone();

    expect(component.pendingResourcePick()).toBeNull();
    expect(component.selectedTarget()).toEqual({ kind: 'resource', resourceId });
  });

  test('should start the session with the chosen intent and navigate to the active screen', async () => {
    const { component, navigateByUrl } = setup();
    component.pickDuration(25);
    component.pickFree();
    component.intent.set('Finish the current chapter');

    await component.start();

    expect(component.store.activeSession()?.plannedMin).toBe(25);
    expect(component.store.activeSession()?.intent).toBe('Finish the current chapter');
    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro/active');
  });

  test('should pick a free target and start in a single action', async () => {
    const { component, navigateByUrl } = setup();
    component.pickDuration(50);

    await component.startFree();

    expect(component.selectedTarget()).toEqual({ kind: 'free' });
    expect(component.store.activeSession()?.plannedMin).toBe(50);
    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro/active');
  });

  test('should flag when there is no path or resource to suggest from', async () => {
    const { component } = setup();

    await component.picker.load();

    expect(component.hasNoMaterial()).toBe(true);
  });

  test('should not flag missing material once a path or a resource exists', async () => {
    const { component, learningPathRepository } = setup();
    learningPathRepository.paths = [
      { id: crypto.randomUUID(), userId: crypto.randomUUID(), title: 'Rust for Backend Engineers', mode: 'sequential', source: 'manual', createdAt: now, updatedAt: now },
    ];
    await component.picker.load();

    expect(component.hasNoMaterial()).toBe(false);
  });

  function enterKeydown(target: EventTarget = document.body): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    Object.defineProperty(event, 'target', { value: target });
    return event;
  }

  test('should start the session when Enter is pressed with a duration and target already chosen', async () => {
    const { component, navigateByUrl } = setup();
    component.pickDuration(25);
    component.pickFree();

    component.onKeydown(enterKeydown());
    await new Promise((resolve) => setTimeout(resolve));

    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro/active');
  });

  test('should ignore Enter when nothing is ready to start yet', () => {
    const { component, navigateByUrl } = setup();

    component.onKeydown(enterKeydown());

    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  test('should ignore Enter while in browse mode', () => {
    const { component, navigateByUrl } = setup();
    component.pickDuration(25);
    component.pickFree();
    component.openBrowse();

    component.onKeydown(enterKeydown());

    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  test('should ignore Enter pressed on a button to avoid double-triggering its own click', () => {
    const { component, navigateByUrl } = setup();
    component.pickDuration(25);
    component.pickFree();
    const button = document.createElement('button');

    component.onKeydown(enterKeydown(button));

    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  test('should clear the browse search query', () => {
    const { component } = setup();
    component.query.set('clean architecture');

    component.clearQuery();

    expect(component.query()).toBe('');
  });

  test('should report progress for a given path by id', async () => {
    const { component, learningPathRepository } = setup();
    const pathId = crypto.randomUUID();
    learningPathRepository.paths = [
      { id: pathId, userId: crypto.randomUUID(), title: 'Rust for Backend Engineers', mode: 'sequential', source: 'manual', createdAt: now, updatedAt: now },
    ];
    learningPathRepository.nodes = [
      { id: crypto.randomUUID(), pathId, title: 'Ownership', progress: 'done', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), pathId, title: 'Trait Objects', progress: 'pending', createdAt: now, updatedAt: now },
    ];
    await component.picker.load();

    expect(component.progressForPath(pathId)).toEqual(component.pathProgress(learningPathRepository.nodes));
  });
});
