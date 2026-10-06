import { TestBed } from '@angular/core/testing';
import { AuthStore } from '@features/auth/application/auth.store';
import {
  inMemoryLocalStorage,
  mockThrowingLocalStorage,
} from '@features/pomodoro/application/mocks/mock-local-storage';
import { learner } from './mocks/learner.fixture';
import {
  MAX_EXCLUDED_CANDIDATES,
  RecommendationDismissalsService,
  dismissalCandidateId,
  nextLocalMidnight,
} from './recommendation-dismissals.service';

const lateEvening = new Date(2026, 9, 6, 22, 30);
const nextMorning = new Date(2026, 9, 7, 8, 0);

function setup() {
  TestBed.configureTestingModule({ providers: [RecommendationDismissalsService] });
  const authStore = TestBed.inject(AuthStore);
  authStore.currentUser.set(learner('Ada'));
  const service = TestBed.inject(RecommendationDismissalsService);
  return { authStore, service };
}

describe('RecommendationDismissalsService', () => {
  const ownershipResourceId = crypto.randomUUID();
  const traitObjectsNodeId = crypto.randomUUID();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(lateEvening);
    vi.stubGlobal('localStorage', inMemoryLocalStorage());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test('should exclude a dismissed recommendation for the rest of the day', () => {
    const { service } = setup();

    service.dismiss({ resourceId: ownershipResourceId });

    expect(service.activeCandidateIds()).toEqual([ownershipResourceId]);
    expect(service.count()).toBe(1);
  });

  test('should bring every dismissal back after local midnight', () => {
    const { service } = setup();
    service.dismiss({ resourceId: ownershipResourceId });

    vi.setSystemTime(nextMorning);

    expect(service.activeCandidateIds()).toEqual([]);
    expect(service.count()).toBe(0);
  });

  test('should keep dismissals across a page reload', () => {
    const { service } = setup();
    service.dismiss({ nodeId: traitObjectsNodeId });

    const afterReload = TestBed.runInInjectionContext(() => new RecommendationDismissalsService());

    expect(afterReload.activeCandidateIds()).toEqual([traitObjectsNodeId]);
  });

  test('should not share dismissals between learners on the same browser', () => {
    const { authStore, service } = setup();
    service.dismiss({ resourceId: ownershipResourceId });

    authStore.currentUser.set(learner('Grace'));

    expect(service.activeCandidateIds()).toEqual([]);
  });

  test('should not record the same candidate twice', () => {
    const { service } = setup();

    service.dismiss({ resourceId: ownershipResourceId });
    service.dismiss({ resourceId: ownershipResourceId });

    expect(service.activeCandidateIds()).toEqual([ownershipResourceId]);
  });

  test('should keep only the most recent dismissals once the exclusion cap is reached', () => {
    const { service } = setup();
    const candidateIds = Array.from({ length: MAX_EXCLUDED_CANDIDATES + 1 }, () =>
      crypto.randomUUID(),
    );

    for (const resourceId of candidateIds) service.dismiss({ resourceId });

    const active = service.activeCandidateIds();
    expect(active).toHaveLength(MAX_EXCLUDED_CANDIDATES);
    expect(active).not.toContain(candidateIds[0]);
    expect(active.at(-1)).toBe(candidateIds.at(-1));
  });

  test('restoreAll should clear every dismissal', () => {
    const { service } = setup();
    service.dismiss({ resourceId: ownershipResourceId });
    service.dismiss({ nodeId: traitObjectsNodeId });

    service.restoreAll();

    expect(service.activeCandidateIds()).toEqual([]);
    expect(service.count()).toBe(0);
  });

  test('should ignore a corrupted stored value', () => {
    const { authStore, service } = setup();
    localStorage.setItem(`recommendation_dismissals:${authStore.currentUser()!.id}`, '{not json');

    expect(service.activeCandidateIds()).toEqual([]);
  });

  test('should still apply dismissals for the page view when storage is blocked', () => {
    vi.stubGlobal('localStorage', mockThrowingLocalStorage());
    const { service } = setup();

    service.dismiss({ resourceId: ownershipResourceId });

    expect(service.activeCandidateIds()).toEqual([ownershipResourceId]);
  });
});

describe('dismissalCandidateId', () => {
  test('should prefer the resource id when a path step links to a resource', () => {
    const ownershipResourceId = crypto.randomUUID();

    expect(
      dismissalCandidateId({ resourceId: ownershipResourceId, nodeId: crypto.randomUUID() }),
    ).toBe(ownershipResourceId);
  });

  test('should fall back to the node id for a stub path step', () => {
    const traitObjectsNodeId = crypto.randomUUID();

    expect(dismissalCandidateId({ nodeId: traitObjectsNodeId })).toBe(traitObjectsNodeId);
  });
});

describe('nextLocalMidnight', () => {
  test('should land on the start of the next local day', () => {
    expect(nextLocalMidnight(lateEvening)).toEqual(new Date(2026, 9, 7, 0, 0));
  });
});
