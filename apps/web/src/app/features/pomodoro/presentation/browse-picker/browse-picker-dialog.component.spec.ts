import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import type { LearningPathWithNodes } from '@features/learning-path/domain/learning-path.model';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { BrowsePickerDialogComponent } from './browse-picker-dialog.component';

const now = new Date('2026-09-11T10:00:00.000Z');

function fakeLearningPathRepository() {
  return {
    pathsWithNodes: [] as LearningPathWithNodes[],
    async getAllWithNodes(): Promise<LearningPathWithNodes[]> {
      return this.pathsWithNodes;
    },
  };
}

function fakeLearningResourceRepository() {
  return {
    resources: [] as LearningResource[],
    async getAll(): Promise<LearningResource[]> {
      return this.resources;
    },
  };
}

describe('BrowsePickerDialogComponent', () => {
  let learningPathRepository: ReturnType<typeof fakeLearningPathRepository>;
  let learningResourceRepository: ReturnType<typeof fakeLearningResourceRepository>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let component: BrowsePickerDialogComponent;

  beforeEach(() => {
    learningPathRepository = fakeLearningPathRepository();
    learningResourceRepository = fakeLearningResourceRepository();
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
    learningPathRepository.pathsWithNodes = [
      {
        path: {
          id: rustPathId,
          userId: crypto.randomUUID(),
          title: 'Rust for Backend Engineers',
          mode: 'sequential',
          source: 'manual',
          createdAt: now,
          updatedAt: now,
        },
        nodes: [
          {
            id: traitObjectsNodeId,
            pathId: rustPathId,
            title: 'Trait Objects',
            learningResourceId: traitObjectsGuideResourceId,
            progress: 'pending',
            createdAt: now,
            updatedAt: now,
          },
        ],
        edges: [],
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
});
