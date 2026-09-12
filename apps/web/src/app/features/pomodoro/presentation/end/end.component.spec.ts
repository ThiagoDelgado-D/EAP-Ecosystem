import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import { createPomodoroComponentTestProviders } from '@features/pomodoro/application/mocks/pomodoro-component-test-providers';
import { startPathNodeSession } from '@features/pomodoro/application/mocks/pomodoro-node-session';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import { mockResourceTypeRepository } from '@features/learning-resource/application/mocks/mock-resource-type.repository';
import type { ResourceType } from '@features/learning-resource/domain/resource-type.model';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import { mockTopicRepository } from '@features/learning-resource/application/mocks/mock-topic.repository';
import type { Topic } from '@features/learning-resource/domain/topic.model';
import { EndComponent } from './end.component';

const now = new Date('2026-09-11T10:00:00.000Z');

function setup(options: { resourceTypes?: ResourceType[]; topics?: Topic[] } = {}) {
  const navigateByUrl = vi.fn();
  const { providers, learningPathRepository, learningResourceRepository } =
    createPomodoroComponentTestProviders(navigateByUrl);
  const resourceTypeRepository = mockResourceTypeRepository({ resourceTypes: options.resourceTypes });
  const topicRepository = mockTopicRepository({ topics: options.topics });
  const dialogOpen = vi.fn();

  TestBed.overrideComponent(EndComponent, {
    set: {
      providers: [
        { provide: ResourceTypeRepository, useValue: resourceTypeRepository },
        { provide: TopicRepository, useValue: topicRepository },
      ],
    },
  });
  TestBed.configureTestingModule({
    providers: [...providers, { provide: MatDialog, useValue: { open: dialogOpen } }],
  });

  const store = TestBed.inject(PomodoroSessionStore);
  const component = TestBed.createComponent(EndComponent).componentInstance;
  return {
    component,
    store,
    learningPathRepository,
    learningResourceRepository,
    resourceTypeRepository,
    topicRepository,
    navigateByUrl,
    dialogOpen,
  };
}

describe('EndComponent', () => {
  test('should flag a free-only session and offer nothing to adjust', async () => {
    const { component, store } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });

    expect(component.freeOnly()).toBe(true);
    expect(component.touchedTargets()).toEqual([]);
  });

  test('should list each non-free touched target with its real title and time', async () => {
    const ctx = setup();
    const { component } = ctx;
    const { pathId, nodeId } = await startPathNodeSession(ctx, { pathTitle: 'Frontend desde cero', nodeTitle: 'HTML fundamentals' });

    expect(component.freeOnly()).toBe(false);
    const [touched] = component.touchedTargets();
    expect(touched.label.title).toBe('HTML fundamentals');
    expect(touched.isStub).toBe(true);
    expect(touched.pathId).toBe(pathId);
    expect(touched.nodeId).toBe(nodeId);
  });

  test('should apply pending node progress and resource status only on save, then end the session', async () => {
    const ctx = setup();
    const { component, learningPathRepository, learningResourceRepository, navigateByUrl } = ctx;
    const resourceId = crypto.randomUUID();
    learningResourceRepository.resources = [
      { id: resourceId, title: 'Rust Book Chapter 17', difficulty: 'Medium', energyLevel: 'Medium', status: 'Pending', estimatedDuration: { value: 45, isEstimated: true }, topicIds: [], typeId: crypto.randomUUID(), createdAt: now, updatedAt: now },
    ];
    const { nodeId } = await startPathNodeSession(ctx, { pathTitle: 'Rust for Backend Engineers', nodeTitle: 'Trait Objects', resourceId });
    const [touched] = component.touchedTargets();

    component.setNodeProgress(touched, 'done');
    component.setResourceStatus(resourceId, 'Completed');
    expect(component.pendingCount()).toBe(2);

    await component.saveAndClose();

    expect(learningPathRepository.nodes.find((n) => n.id === nodeId)?.progress).toBe('done');
    expect(learningResourceRepository.resources.find((r) => r.id === resourceId)?.status).toBe('Completed');
    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro');
  });

  test('should discard pending changes without applying them, but still end the session', async () => {
    const ctx = setup();
    const { component, learningPathRepository, navigateByUrl } = ctx;
    const { nodeId } = await startPathNodeSession(ctx, { pathTitle: 'Rust for Backend Engineers', nodeTitle: 'Trait Objects' });
    const [touched] = component.touchedTargets();
    component.setNodeProgress(touched, 'done');

    await component.discard();

    expect(learningPathRepository.nodes.find((n) => n.id === nodeId)?.progress).toBe('pending');
    expect(navigateByUrl).toHaveBeenCalledWith('/pomodoro');
  });

  test('should attach the open segment when the picker dialog closes with a target', async () => {
    const { component, store, dialogOpen } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    const pathId = crypto.randomUUID();
    const nodeId = crypto.randomUUID();
    dialogOpen.mockReturnValue({
      afterClosed: () => of({ kind: 'node', learningPathId: pathId, learningPathNodeId: nodeId }),
    });

    await component.openAttachDialog();

    expect(component.freeOnly()).toBe(false);
    const [touched] = component.touchedTargets();
    expect(touched.pathId).toBe(pathId);
    expect(touched.nodeId).toBe(nodeId);
  });

  test('should not attach anything when the picker dialog is cancelled', async () => {
    const { component, store, dialogOpen } = setup();
    await store.start({ plannedMin: 25, target: { kind: 'free' } });
    dialogOpen.mockReturnValue({ afterClosed: () => of(undefined) });

    await component.openAttachDialog();

    expect(component.freeOnly()).toBe(true);
  });

  test('should link an existing resource to a stub node and reflect it as promoted', async () => {
    const ctx = setup();
    const { component, learningPathRepository, learningResourceRepository } = ctx;
    const resourceId = crypto.randomUUID();
    learningResourceRepository.resources = [
      { id: resourceId, title: 'CAP Theorem Explained', difficulty: 'Medium', energyLevel: 'Medium', status: 'Pending', estimatedDuration: { value: 20, isEstimated: true }, topicIds: [], typeId: crypto.randomUUID(), createdAt: now, updatedAt: now },
    ];
    const { nodeId } = await startPathNodeSession(ctx, { pathTitle: 'System Design Prep', pathMode: 'graph', nodeTitle: 'CAP Theorem' });
    const [touched] = component.touchedTargets();

    component.selectPromoteResource(touched.key, resourceId);
    await component.linkExistingResource(touched);

    expect(learningPathRepository.nodes.find((n) => n.id === nodeId)?.learningResourceId).toBe(resourceId);
    expect(component.effectiveResourceId(touched)).toBe(resourceId);
  });

  test('should refuse to create a resource without at least one topic selected', async () => {
    const typeId = crypto.randomUUID();
    const ctx = setup({
      resourceTypes: [{ id: typeId, code: 'article', displayName: 'Article', createdAt: now, updatedAt: now }],
    });
    const { component, learningResourceRepository } = ctx;
    await startPathNodeSession(ctx, { pathTitle: 'System Design Prep', pathMode: 'graph', nodeTitle: 'CAP Theorem' });
    const [touched] = component.touchedTargets();

    await component.createAndLinkResource(touched);

    expect(learningResourceRepository.resources).toHaveLength(0);
  });

  test('should create a new resource with the selected topics and link it to a stub node', async () => {
    const typeId = crypto.randomUUID();
    const topicId = crypto.randomUUID();
    const ctx = setup({
      resourceTypes: [{ id: typeId, code: 'article', displayName: 'Article', createdAt: now, updatedAt: now }],
      topics: [{ id: topicId, name: 'System Design', createdAt: now, updatedAt: now }],
    });
    const { component, learningPathRepository, learningResourceRepository } = ctx;
    const { nodeId } = await startPathNodeSession(ctx, { pathTitle: 'System Design Prep', pathMode: 'graph', nodeTitle: 'CAP Theorem' });
    const [touched] = component.touchedTargets();
    component.toggleCreateTopic(touched.key, topicId);

    await component.createAndLinkResource(touched);

    const createdResource = learningResourceRepository.resources[0]!;
    expect(createdResource.title).toBe('CAP Theorem');
    expect(createdResource.topicIds).toEqual([topicId]);
    expect(learningPathRepository.nodes.find((n) => n.id === nodeId)?.learningResourceId).toBe(createdResource.id);
  });
});
