import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LearningPathHttpRepository } from './learning-path-http.repository';
import type { LearningPathWithNodesDto } from './learning-path.dto';
import { API_CONFIG } from '@core/config/api.config';

describe('LearningPathHttpRepository', () => {
  let repository: LearningPathHttpRepository;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LearningPathHttpRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    repository = TestBed.inject(LearningPathHttpRepository);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpController.verify());

  test('getAllWithNodes should GET /learning-paths/with-nodes and map every path, node, and edge to domain', async () => {
    const rustPathId = crypto.randomUUID();
    const ownershipNodeId = crypto.randomUUID();
    const traitObjectsNodeId = crypto.randomUUID();
    const ownershipResourceId = crypto.randomUUID();
    const ownershipToTraitsEdgeId = crypto.randomUUID();

    const dtos: LearningPathWithNodesDto[] = [
      {
        path: {
          id: rustPathId,
          userId: crypto.randomUUID(),
          title: 'Rust for Backend Engineers',
          mode: 'sequential',
          source: 'manual',
          createdAt: '2026-08-20T10:00:00.000Z',
          updatedAt: '2026-08-25T10:00:00.000Z',
          stats: { total: 2, done: 1, linked: 1 },
        },
        nodes: [
          {
            id: ownershipNodeId,
            pathId: rustPathId,
            title: 'Ownership & Borrowing',
            learningResourceId: ownershipResourceId,
            progress: 'done',
            createdAt: '2026-08-20T10:00:00.000Z',
            updatedAt: '2026-08-24T10:00:00.000Z',
          },
          {
            id: traitObjectsNodeId,
            pathId: rustPathId,
            title: 'Trait Objects',
            stubScope: 'path-local',
            progress: 'pending',
            createdAt: '2026-08-20T10:00:00.000Z',
            updatedAt: '2026-08-20T10:00:00.000Z',
          },
        ],
        edges: [
          {
            id: ownershipToTraitsEdgeId,
            pathId: rustPathId,
            sourceNodeId: ownershipNodeId,
            targetNodeId: traitObjectsNodeId,
          },
        ],
      },
    ];

    const resultPromise = repository.getAllWithNodes();

    const request = httpController.expectOne(`${API_CONFIG.baseUrl}/learning-paths/with-nodes`);
    expect(request.request.method).toBe('GET');
    request.flush(dtos);

    const result = await resultPromise;

    expect(result).toHaveLength(1);
    expect(result[0].path).toMatchObject({
      id: rustPathId,
      title: 'Rust for Backend Engineers',
      stats: { total: 2, done: 1, linked: 1 },
    });
    expect(result[0].nodes.map((n) => n.title)).toEqual(['Ownership & Borrowing', 'Trait Objects']);
    expect(result[0].edges).toEqual([
      {
        id: ownershipToTraitsEdgeId,
        pathId: rustPathId,
        sourceNodeId: ownershipNodeId,
        targetNodeId: traitObjectsNodeId,
      },
    ]);
  });

  test('getAllWithNodes should return an empty array when the user has no paths', async () => {
    const resultPromise = repository.getAllWithNodes();

    httpController.expectOne(`${API_CONFIG.baseUrl}/learning-paths/with-nodes`).flush([]);

    expect(await resultPromise).toEqual([]);
  });
});
