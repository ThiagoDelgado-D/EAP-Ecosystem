import { TestBed } from '@angular/core/testing';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { mockLearningPathRepository } from '@features/learning-path/application/mocks/mock-learning-path.repository';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import { mockLearningResourceRepository } from '@features/learning-resource/application/mocks/mock-learning-resource.repository';
import { PomodoroPickerService } from './pomodoro-picker.service';

const now = new Date('2026-09-11T10:00:00.000Z');

describe('PomodoroPickerService', () => {
  let learningPathRepository: ReturnType<typeof mockLearningPathRepository>;
  let learningResourceRepository: ReturnType<typeof mockLearningResourceRepository>;
  let service: PomodoroPickerService;

  beforeEach(() => {
    learningPathRepository = mockLearningPathRepository();
    learningResourceRepository = mockLearningResourceRepository();
    TestBed.configureTestingModule({
      providers: [
        PomodoroPickerService,
        { provide: LearningPathRepository, useValue: learningPathRepository },
        { provide: LearningResourceRepository, useValue: learningResourceRepository },
      ],
    });
    service = TestBed.inject(PomodoroPickerService);
  });

  test('should put a pending node with a done prerequisite in readyToLearn, and a pending node with a pending prerequisite in neither list', async () => {
    const rustPathId = crypto.randomUUID();
    const ownershipNodeId = crypto.randomUUID();
    const traitObjectsNodeId = crypto.randomUUID();
    const asyncRuntimesNodeId = crypto.randomUUID();
    const macrosNodeId = crypto.randomUUID();

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
        id: ownershipNodeId,
        pathId: rustPathId,
        title: 'Ownership & Borrowing',
        progress: 'done',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: traitObjectsNodeId,
        pathId: rustPathId,
        title: 'Trait Objects',
        progress: 'pending',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: asyncRuntimesNodeId,
        pathId: rustPathId,
        title: 'Async Runtimes',
        progress: 'pending',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: macrosNodeId,
        pathId: rustPathId,
        title: 'Procedural Macros',
        progress: 'in_progress',
        createdAt: now,
        updatedAt: now,
      },
    ];
    learningPathRepository.edges = [
      {
        id: crypto.randomUUID(),
        pathId: rustPathId,
        sourceNodeId: ownershipNodeId,
        targetNodeId: traitObjectsNodeId,
      },
      {
        id: crypto.randomUUID(),
        pathId: rustPathId,
        sourceNodeId: traitObjectsNodeId,
        targetNodeId: asyncRuntimesNodeId,
      },
    ];

    await service.load();

    expect(service.readyToLearn().map((entry) => entry.node.id)).toEqual([traitObjectsNodeId]);
    expect(service.inProgress().map((entry) => entry.node.id)).toEqual([macrosNodeId]);
  });

  test('should treat a node with no prerequisites as ready when pending', async () => {
    const typescriptPathId = crypto.randomUUID();
    const handbookNodeId = crypto.randomUUID();

    learningPathRepository.paths = [
      {
        id: typescriptPathId,
        userId: crypto.randomUUID(),
        title: 'TypeScript, Step by Step',
        mode: 'sequential',
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      },
    ];
    learningPathRepository.nodes = [
      {
        id: handbookNodeId,
        pathId: typescriptPathId,
        title: 'TypeScript Handbook',
        progress: 'pending',
        createdAt: now,
        updatedAt: now,
      },
    ];

    await service.load();

    expect(service.readyToLearn().map((entry) => entry.node.id)).toEqual([handbookNodeId]);
  });

  test('should group every path with all of its nodes in allPaths regardless of progress', async () => {
    const angularPathId = crypto.randomUUID();
    const angularPath = {
      id: angularPathId,
      userId: crypto.randomUUID(),
      title: 'Angular from scratch',
      mode: 'graph' as const,
      source: 'manual' as const,
      createdAt: now,
      updatedAt: now,
    };
    const nodes = [
      {
        id: crypto.randomUUID(),
        pathId: angularPathId,
        title: 'Components',
        progress: 'done' as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        pathId: angularPathId,
        title: 'Services',
        progress: 'pending' as const,
        createdAt: now,
        updatedAt: now,
      },
    ];
    learningPathRepository.paths = [angularPath];
    learningPathRepository.nodes = nodes;

    await service.load();

    expect(service.allPaths()).toEqual([{ path: angularPath, nodes }]);
  });

  test('should expose the learning resource library as-is', async () => {
    const library: LearningResource[] = [
      {
        id: crypto.randomUUID(),
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
    learningResourceRepository.resources = library;

    await service.load();

    expect(service.library()).toEqual(library);
  });

  test('should set an error message when loading fails', async () => {
    learningPathRepository.getAllWithNodes = async () => Promise.reject(new Error('network down'));

    await service.load();

    expect(service.error()).toBe('We could not load the available material.');
    expect(service.loading()).toBe(false);
  });
});
