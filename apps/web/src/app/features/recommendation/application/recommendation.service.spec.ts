import { TestBed } from '@angular/core/testing';
import { AuthStore } from '@features/auth/application/auth.store';
import { RecommendationRepository } from '@features/recommendation/domain/recommendation.repository';
import type { ScoredRecommendation } from '@features/recommendation/domain/recommendation.model';
import { inMemoryLocalStorage } from '@features/pomodoro/application/mocks/mock-local-storage';
import { learner } from './mocks/learner.fixture';
import { mockRecommendationRepository } from './mocks/mock-recommendation.repository';
import { RecommendationDismissalsService } from './recommendation-dismissals.service';
import { RecommendationService } from './recommendation.service';

function recommendation(title: string, score: number): ScoredRecommendation {
  return { resourceId: crypto.randomUUID(), title, score, why: [] };
}

describe('RecommendationService', () => {
  const ownershipChapter = recommendation('Ownership & Borrowing', 88);
  const traitObjectsChapter = recommendation('Trait Objects', 74);
  const lifetimesChapter = recommendation('Lifetimes in Depth', 61);

  function setup() {
    const recommendationRepository = mockRecommendationRepository({
      context: { energyLevel: 'medium', availableMinutes: 45 },
      recommendations: [ownershipChapter, traitObjectsChapter, lifetimesChapter],
    });
    TestBed.configureTestingModule({
      providers: [
        RecommendationService,
        RecommendationDismissalsService,
        { provide: RecommendationRepository, useValue: recommendationRepository },
      ],
    });
    TestBed.inject(AuthStore).currentUser.set(learner('Ada'));
    return {
      recommendationRepository,
      service: TestBed.inject(RecommendationService),
      dismissals: TestBed.inject(RecommendationDismissalsService),
    };
  }

  beforeEach(() => {
    vi.stubGlobal('localStorage', inMemoryLocalStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('should ask for recommendations without the ones set aside today, so the list refills', async () => {
    const { service, dismissals, recommendationRepository } = setup();
    dismissals.dismiss(ownershipChapter);

    await service.refresh();

    expect(recommendationRepository.excludedCandidateIds).toEqual([ownershipChapter.resourceId]);
    expect(service.recommendations()).toEqual([traitObjectsChapter, lifetimesChapter]);
  });

  test('should rank every candidate again once the dismissals are restored', async () => {
    const { service, dismissals } = setup();
    dismissals.dismiss(ownershipChapter);
    dismissals.restoreAll();

    await service.refresh();

    expect(service.recommendations()).toEqual([
      ownershipChapter,
      traitObjectsChapter,
      lifetimesChapter,
    ]);
  });
});
