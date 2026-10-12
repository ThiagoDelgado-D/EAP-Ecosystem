import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RecommendationHttpRepository } from './recommendation-http.repository';
import type { RecommendationContextResponseDto, ScoredRecommendationDto } from './recommendation.dto';
import { API_CONFIG } from '@core/config/api.config';
import { apiErrorInterceptor } from '@core/errors/api-error.interceptor';
import type { ApiErrorName } from '@core/errors/api-error';

const CONTEXT_NOT_FOUND_ERROR = 'RECOMMENDATION_CONTEXT_NOT_FOUND_ERROR' satisfies ApiErrorName;
const CONTEXT_NOT_FOUND_BODY = { error: CONTEXT_NOT_FOUND_ERROR };
const NOT_FOUND_RESPONSE = { status: 404, statusText: 'Not Found' };

describe('RecommendationHttpRepository', () => {
  let repository: RecommendationHttpRepository;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecommendationHttpRepository,
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    repository = TestBed.inject(RecommendationHttpRepository);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpController.verify());

  test('getRecommendations should GET /recommendations and map every candidate to domain', async () => {
    const rustOwnershipResourceId = crypto.randomUUID();
    const traitObjectsNodeId = crypto.randomUUID();
    const rustPathId = crypto.randomUUID();

    const dtos: ScoredRecommendationDto[] = [
      {
        resourceId: rustOwnershipResourceId,
        title: 'Ownership & Borrowing',
        score: 45,
        why: ['matches your high energy', 'fits your 30 min window'],
      },
      {
        nodeId: traitObjectsNodeId,
        pathId: rustPathId,
        title: 'Trait Objects',
        score: 20,
        why: ['next step in Rust for Backend Engineers'],
      },
    ];

    const resultPromise = repository.getRecommendations();

    const request = httpController.expectOne(`${API_CONFIG.baseUrl}/recommendations`);
    expect(request.request.method).toBe('GET');
    request.flush(dtos);

    const result = await resultPromise;

    expect(result).toEqual(dtos);
  });

  test('getRecommendations should send each dismissed candidate as a repeated exclude parameter', async () => {
    const dismissedResourceId = crypto.randomUUID();
    const dismissedNodeId = crypto.randomUUID();

    const resultPromise = repository.getRecommendations([dismissedResourceId, dismissedNodeId]);

    const request = httpController.expectOne(
      (req) => req.url === `${API_CONFIG.baseUrl}/recommendations`,
    );
    expect(request.request.params.getAll('exclude')).toEqual([dismissedResourceId, dismissedNodeId]);
    request.flush([]);

    expect(await resultPromise).toEqual([]);
  });

  test('getRecommendations should return an empty array when the user has no context yet (404)', async () => {
    const resultPromise = repository.getRecommendations();

    httpController
      .expectOne(`${API_CONFIG.baseUrl}/recommendations`)
      .flush(CONTEXT_NOT_FOUND_BODY, NOT_FOUND_RESPONSE);

    expect(await resultPromise).toEqual([]);
  });

  test('getContext should GET /recommendations/context and keep only the calibration fields', async () => {
    const tiredEveningReviewContext: RecommendationContextResponseDto = {
      userId: crypto.randomUUID(),
      energyLevel: 'low',
      availableMinutes: 15,
      mentalState: 'review',
      updatedAt: '2026-10-05T21:30:00.000Z',
    };

    const restoredContextPromise = repository.getContext();

    const contextRequest = httpController.expectOne(`${API_CONFIG.baseUrl}/recommendations/context`);
    expect(contextRequest.request.method).toBe('GET');
    contextRequest.flush(tiredEveningReviewContext);

    expect(await restoredContextPromise).toEqual({
      energyLevel: tiredEveningReviewContext.energyLevel,
      availableMinutes: tiredEveningReviewContext.availableMinutes,
      mentalState: tiredEveningReviewContext.mentalState,
    });
  });

  test('getContext should return null when the user has never saved a context (404)', async () => {
    const firstVisitContextPromise = repository.getContext();

    httpController
      .expectOne(`${API_CONFIG.baseUrl}/recommendations/context`)
      .flush(CONTEXT_NOT_FOUND_BODY, NOT_FOUND_RESPONSE);

    expect(await firstVisitContextPromise).toBeNull();
  });

  test('setContext should POST /recommendations/context with the given payload', async () => {
    const resultPromise = repository.setContext({ energyLevel: 'high', mentalState: 'deep_focus', availableMinutes: 30 });

    const request = httpController.expectOne(`${API_CONFIG.baseUrl}/recommendations/context`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      energyLevel: 'high',
      mentalState: 'deep_focus',
      availableMinutes: 30,
    });
    request.flush({});

    await expect(resultPromise).resolves.toBeUndefined();
  });
});
