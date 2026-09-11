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
    const dtos: LearningPathWithNodesDto[] = [
      {
        path: {
          id: 'path-rust-backend',
          userId: 'user-1',
          title: 'Rust for Backend Engineers',
          mode: 'sequential',
          source: 'manual',
          createdAt: '2026-08-20T10:00:00.000Z',
          updatedAt: '2026-08-25T10:00:00.000Z',
          stats: { total: 2, done: 1, linked: 1 },
        },
        nodes: [
          {
            id: 'node-ownership',
            pathId: 'path-rust-backend',
            title: 'Ownership & Borrowing',
            learningResourceId: 'resource-1',
            progress: 'done',
            createdAt: '2026-08-20T10:00:00.000Z',
            updatedAt: '2026-08-24T10:00:00.000Z',
          },
          {
            id: 'node-trait-objects',
            pathId: 'path-rust-backend',
            title: 'Trait Objects',
            stubScope: 'path-local',
            progress: 'pending',
            createdAt: '2026-08-20T10:00:00.000Z',
            updatedAt: '2026-08-20T10:00:00.000Z',
          },
        ],
        edges: [
          {
            id: 'edge-ownership-to-traits',
            pathId: 'path-rust-backend',
            sourceNodeId: 'node-ownership',
            targetNodeId: 'node-trait-objects',
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
      id: 'path-rust-backend',
      title: 'Rust for Backend Engineers',
      stats: { total: 2, done: 1, linked: 1 },
    });
    expect(result[0].nodes.map((n) => n.title)).toEqual(['Ownership & Borrowing', 'Trait Objects']);
    expect(result[0].edges).toEqual([
      {
        id: 'edge-ownership-to-traits',
        pathId: 'path-rust-backend',
        sourceNodeId: 'node-ownership',
        targetNodeId: 'node-trait-objects',
      },
    ]);
  });

  test('getAllWithNodes should return an empty array when the user has no paths', async () => {
    const resultPromise = repository.getAllWithNodes();

    httpController.expectOne(`${API_CONFIG.baseUrl}/learning-paths/with-nodes`).flush([]);

    expect(await resultPromise).toEqual([]);
  });
});
