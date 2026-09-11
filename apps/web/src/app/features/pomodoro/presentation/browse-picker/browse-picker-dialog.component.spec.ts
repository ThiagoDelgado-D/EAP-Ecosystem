import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { mockLearningPathRepository } from '@features/learning-path/application/mocks/mock-learning-path.repository';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { mockLearningResourceRepository } from '@features/learning-resource/application/mocks/mock-learning-resource.repository';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { BrowsePickerDialogComponent } from './browse-picker-dialog.component';

const now = new Date('2026-09-11T10:00:00.000Z');

describe('BrowsePickerDialogComponent', () => {
  let learningPathRepository: ReturnType<typeof mockLearningPathRepository>;
  let learningResourceRepository: ReturnType<typeof mockLearningResourceRepository>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let component: BrowsePickerDialogComponent;

  beforeEach(() => {
    learningPathRepository = mockLearningPathRepository();
    learningResourceRepository = mockLearningResourceRepository();
    dialogRef = { close: vi.fn() };

    TestBed.overrideComponent(BrowsePickerDialogComponent, {
      set: {
        providers: [
          PomodoroPickerService,
          { provide: LearningPathRepository, useValue: learningPathRepository },
          { provide: LearningResourceRepository, useValue: learningResourceRepository },
        ],
      },
    });
    TestBed.configureTestingModule({
      providers: [{ provide: MatDialogRef, useValue: dialogRef }],
    });

    component = TestBed.createComponent(BrowsePickerDialogComponent).componentInstance;
  });

  test('should default to the "ready" tab', () => {
    expect(component.activeTab()).toBe('ready');
  });

  test('should switch tabs', () => {
    component.selectTab('library');
    expect(component.activeTab()).toBe('library');
  });

  test('should close with a node SegmentTarget, carrying the node\'s linked resource, when a node is picked', async () => {
    const rustPathId = crypto.randomUUID();
    const traitObjectsNodeId = crypto.randomUUID();
    const traitObjectsGuideResourceId = crypto.randomUUID();
    learningPathRepository.paths = [
      {
        id: rustPathId,
        userId: crypto.randomUUID(),
        title: 'Rust for Backend Engineers',
        mode: 'sequential',
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      },
    ];
    learningPathRepository.nodes = [
      {
        id: traitObjectsNodeId,
        pathId: rustPathId,
        title: 'Trait Objects',
        learningResourceId: traitObjectsGuideResourceId,
        progress: 'pending',
        createdAt: now,
        updatedAt: now,
      },
    ];
    await component.picker.load();

    component.pickNode(component.picker.readyToLearn()[0]);

    expect(dialogRef.close).toHaveBeenCalledWith({
      kind: 'node',
      learningPathId: rustPathId,
      learningPathNodeId: traitObjectsNodeId,
      resourceId: traitObjectsGuideResourceId,
    });
  });

  test('should close with a resource SegmentTarget when a library resource is picked', async () => {
    const tokioDocsResourceId = crypto.randomUUID();
    learningResourceRepository.resources = [
      {
        id: tokioDocsResourceId,
        title: 'Tokio Documentation',
        difficulty: 'Medium',
        energyLevel: 'Medium',
        status: 'Pending',
        estimatedDuration: { value: 45, isEstimated: true },
        topicIds: [],
        typeId: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      },
    ];
    await component.picker.load();

    component.pickResource(component.picker.library()[0]);

    expect(dialogRef.close).toHaveBeenCalledWith({
      kind: 'resource',
      resourceId: tokioDocsResourceId,
    });
  });

  test('should close with undefined when cancelled', () => {
    component.cancel();

    expect(dialogRef.close).toHaveBeenCalledWith(undefined);
  });

  test('should filter ready-to-learn entries by the search query', async () => {
    const cleanArchPathId = crypto.randomUUID();
    const cleanArchNodeId = crypto.randomUUID();
    const systemDesignPathId = crypto.randomUUID();
    const systemDesignNodeId = crypto.randomUUID();
    learningPathRepository.paths = [
      { id: cleanArchPathId, userId: crypto.randomUUID(), title: 'Frontend Architecture Mastery', mode: 'graph', source: 'manual', createdAt: now, updatedAt: now },
      { id: systemDesignPathId, userId: crypto.randomUUID(), title: 'System Design Prep', mode: 'graph', source: 'manual', createdAt: now, updatedAt: now },
    ];
    learningPathRepository.nodes = [
      { id: cleanArchNodeId, pathId: cleanArchPathId, title: 'Clean Architecture', progress: 'pending', createdAt: now, updatedAt: now },
      { id: systemDesignNodeId, pathId: systemDesignPathId, title: 'CAP Theorem', progress: 'pending', createdAt: now, updatedAt: now },
    ];
    await component.picker.load();

    component.query.set('clean');

    expect(component.filteredReady()).toEqual([
      { path: learningPathRepository.paths[0], node: learningPathRepository.nodes[0] },
    ]);
  });

  test('should clear the search query', () => {
    component.query.set('clean architecture');

    component.clearQuery();

    expect(component.query()).toBe('');
  });

  test('should flag stub nodes and describe each subtitle from the path title and the resource duration', async () => {
    const pathId = crypto.randomUUID();
    const linkedNodeId = crypto.randomUUID();
    const stubNodeId = crypto.randomUUID();
    const resourceId = crypto.randomUUID();
    learningPathRepository.paths = [
      { id: pathId, userId: crypto.randomUUID(), title: 'Rust for Backend Engineers', mode: 'sequential', source: 'manual', createdAt: now, updatedAt: now },
    ];
    learningPathRepository.nodes = [
      { id: linkedNodeId, pathId, title: 'Trait Objects', learningResourceId: resourceId, progress: 'pending', createdAt: now, updatedAt: now },
      { id: stubNodeId, pathId, title: 'CAP Theorem', progress: 'pending', createdAt: now, updatedAt: now },
    ];
    learningResourceRepository.resources = [
      {
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
      },
    ];
    await component.picker.load();
    const [linked, stub] = component.picker.readyToLearn();

    expect(component.nodeSubtitle(linked.path, linked.node)).toBe('Rust for Backend Engineers · 45min');
    expect(component.nodeSubtitle(stub.path, stub.node)).toBe('Rust for Backend Engineers · no resource linked');
    expect(component.isStub(linked.node)).toBe(false);
    expect(component.isStub(stub.node)).toBe(true);
  });

  test('should jump to the first tab that actually has matches for the search', async () => {
    const pathId = crypto.randomUUID();
    const nodeId = crypto.randomUUID();
    learningPathRepository.paths = [
      { id: pathId, userId: crypto.randomUUID(), title: 'Frontend desde cero', mode: 'sequential', source: 'manual', createdAt: now, updatedAt: now },
    ];
    learningPathRepository.nodes = [
      { id: nodeId, pathId, title: 'Git y control de versiones', progress: 'in_progress', createdAt: now, updatedAt: now },
    ];
    await component.picker.load();

    component.query.set('Git y control');
    TestBed.tick();

    expect(component.activeTab()).toBe('in-progress');
  });
});
