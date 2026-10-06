import { TestBed } from '@angular/core/testing';
import { AuthStore } from '@features/auth/application/auth.store';
import { RecommendationRepository } from '@features/recommendation/domain/recommendation.repository';
import {
  mockRecommendationRepository,
  type MockedRecommendationRepository,
} from './mocks/mock-recommendation.repository';
import { CalibrationService } from './calibration.service';
import { learner } from './mocks/learner.fixture';

describe('CalibrationService', () => {
  let recommendationRepository: MockedRecommendationRepository;
  let authStore: AuthStore;
  let service: CalibrationService;

  beforeEach(() => {
    recommendationRepository = mockRecommendationRepository();
    TestBed.configureTestingModule({
      providers: [
        CalibrationService,
        { provide: RecommendationRepository, useValue: recommendationRepository },
      ],
    });
    authStore = TestBed.inject(AuthStore);
    authStore.currentUser.set(learner('Ada'));
    service = TestBed.inject(CalibrationService);
  });

  test('should restore the context saved on another device instead of the defaults', async () => {
    recommendationRepository.context = { energyLevel: 'low', availableMinutes: 15, mentalState: 'review' };

    await service.load();

    expect(service.energy()).toBe('Low');
    expect(service.availableMinutes()).toBe(15);
    expect(service.mentalState()).toBe('review');
    expect(recommendationRepository.savedContexts).toEqual([]);
  });

  test('should keep the mental state empty when the saved context has none', async () => {
    recommendationRepository.context = { energyLevel: 'high', availableMinutes: 90 };

    await service.load();

    expect(service.mentalState()).toBeNull();
  });

  test('should persist the defaults for a first-time learner so the engine has a context to rank with', async () => {
    await service.load();

    expect(recommendationRepository.savedContexts).toEqual([
      { energyLevel: 'medium', availableMinutes: 45, mentalState: 'deep_focus' },
    ]);
  });

  test('should hit the server only once across repeated loads for the same learner', async () => {
    const getContextSpy = vi.spyOn(recommendationRepository, 'getContext');

    await Promise.all([service.load(), service.load()]);
    await service.load();

    expect(getContextSpy).toHaveBeenCalledTimes(1);
  });

  test('should reload instead of leaking the previous learner\'s calibration after a different sign-in', async () => {
    recommendationRepository.context = { energyLevel: 'high', availableMinutes: 90, mentalState: 'creative' };
    await service.load();

    authStore.currentUser.set(learner('Grace'));
    recommendationRepository.context = { energyLevel: 'low', availableMinutes: 15, mentalState: 'light_read' };
    await service.load();

    expect(service.energy()).toBe('Low');
    expect(service.mentalState()).toBe('light_read');
  });

  test('should save every property independently, leaving the others untouched', async () => {
    recommendationRepository.context = { energyLevel: 'high', availableMinutes: 25, mentalState: 'deep_focus' };
    await service.load();

    await service.setMentalState('review');

    expect(service.energy()).toBe('High');
    expect(recommendationRepository.savedContexts.at(-1)).toEqual({
      energyLevel: 'high',
      availableMinutes: 25,
      mentalState: 'review',
    });
  });

  test('should save a cleared mental state by omitting it', async () => {
    await service.load();

    await service.setMentalState(null);

    expect(recommendationRepository.savedContexts.at(-1)?.mentalState).toBeUndefined();
  });

  test('should bump the saved revision only after the server accepted the change', async () => {
    await service.load();
    const revisionBeforeSave = service.savedRevision();
    vi.spyOn(recommendationRepository, 'setContext').mockRejectedValueOnce(new Error('offline'));

    const savedWhileOffline = await service.setEnergy('Low');
    expect(savedWhileOffline).toBe(false);
    expect(service.savedRevision()).toBe(revisionBeforeSave);

    const savedOnceBackOnline = await service.setEnergy('Low');
    expect(savedOnceBackOnline).toBe(true);
    expect(service.savedRevision()).toBe(revisionBeforeSave + 1);
  });

  test('should send the latest calibration last when changes overlap', async () => {
    await service.load();

    await Promise.all([service.setEnergy('Low'), service.setAvailableMinutes(90), service.setMentalState('creative')]);

    expect(recommendationRepository.context).toEqual({
      energyLevel: 'low',
      availableMinutes: 90,
      mentalState: 'creative',
    });
  });
});
