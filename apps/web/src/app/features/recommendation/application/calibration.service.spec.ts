import { TestBed } from '@angular/core/testing';
import { ErrorNotifier } from '@core/errors/error-notifier.service';
import { AuthStore } from '@features/auth/application/auth.store';
import { capabilitiesEnabling } from '@features/auth/application/mocks/capabilities.fixture';
import { CAPABILITY_KEY, type AuthUser } from '@features/auth/domain/auth.model';
import type {
  EnergyLevel,
  MentalStateType,
} from '@features/learning-resource/domain/learning-resource.model';
import { RecommendationRepository } from '@features/recommendation/domain/recommendation.repository';
import {
  mockRecommendationRepository,
  type MockedRecommendationRepository,
} from './mocks/mock-recommendation.repository';
import { CalibrationService } from './calibration.service';
import { learner } from './mocks/learner.fixture';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';

const SAVED_MENTAL_STATE: MentalStateType = 'deep_focus';
const UNSAVED_MENTAL_STATE: MentalStateType = 'creative';
const UNSAVED_ENERGY: EnergyLevel = 'Low';
const NEWER_ENERGY: EnergyLevel = 'High';

function recommendationLearner(firstName: string): AuthUser {
  const signedInLearner = learner(firstName);
  signedInLearner.capabilities = capabilitiesEnabling([CAPABILITY_KEY.RECOMMENDATION]);
  return signedInLearner;
}

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
    authStore.currentUser.set(recommendationLearner('Ada'));
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

    authStore.currentUser.set(recommendationLearner('Grace'));
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

  test('should tell the learner why a calibration change was not saved', async () => {
    await service.load();
    const offline = offlineError();
    vi.spyOn(recommendationRepository, 'setContext').mockRejectedValueOnce(offline);
    const notifySpy = vi.spyOn(TestBed.inject(ErrorNotifier), 'notify');

    await service.setAvailableMinutes(service.availableMinutes());

    expect(notifySpy).toHaveBeenCalledWith(offline);
  });

  test('should put the previous value back when a change could not be saved', async () => {
    recommendationRepository.context = { energyLevel: 'high', availableMinutes: 25, mentalState: SAVED_MENTAL_STATE };
    await service.load();
    vi.spyOn(recommendationRepository, 'setContext').mockRejectedValueOnce(offlineError());

    await service.setMentalState(UNSAVED_MENTAL_STATE);

    expect(service.mentalState()).toBe(SAVED_MENTAL_STATE);
  });

  test('should keep a newer change when an earlier one fails to save', async () => {
    await service.load();
    vi.spyOn(recommendationRepository, 'setContext').mockRejectedValueOnce(offlineError());

    await Promise.all([service.setEnergy(UNSAVED_ENERGY), service.setEnergy(NEWER_ENERGY)]);

    expect(service.energy()).toBe(NEWER_ENERGY);
  });

  describe('when loading the saved calibration failed', () => {
    const SAVED_ENERGY_LEVEL = 'low';
    const SAVED_AVAILABLE_MINUTES = 15;
    const SAVED_CONTEXT_MENTAL_STATE: MentalStateType = 'review';
    const NEWER_API_ENERGY_LEVEL = 'high';

    test('should load it again before saving a change, keeping the rest of the saved calibration', async () => {
      recommendationRepository.context = {
        energyLevel: SAVED_ENERGY_LEVEL,
        availableMinutes: SAVED_AVAILABLE_MINUTES,
        mentalState: SAVED_CONTEXT_MENTAL_STATE,
      };
      vi.spyOn(recommendationRepository, 'getContext').mockRejectedValueOnce(offlineError());
      await service.load();

      const saved = await service.setEnergy(NEWER_ENERGY);

      expect(saved).toBe(true);
      expect(recommendationRepository.savedContexts).toEqual([
        {
          energyLevel: NEWER_API_ENERGY_LEVEL,
          availableMinutes: SAVED_AVAILABLE_MINUTES,
          mentalState: SAVED_CONTEXT_MENTAL_STATE,
        },
      ]);
    });

    test('should tell the learner why and save nothing while it keeps failing', async () => {
      const offline = offlineError();
      vi.spyOn(recommendationRepository, 'getContext').mockRejectedValue(offline);
      const notifySpy = vi.spyOn(TestBed.inject(ErrorNotifier), 'notify');
      await service.load();
      const energyBefore = service.energy();

      const saved = await service.setEnergy(UNSAVED_ENERGY);

      expect(saved).toBe(false);
      expect(notifySpy).toHaveBeenCalledWith(offline);
      expect(recommendationRepository.savedContexts).toEqual([]);
      expect(service.energy()).toBe(energyBefore);
    });
  });

  test('should neither load nor persist a context while recommendations are off', async () => {
    const getContextSpy = vi.spyOn(recommendationRepository, 'getContext');
    authStore.currentUser.set(learner('Ada'));

    await service.load();

    expect(getContextSpy).not.toHaveBeenCalled();
    expect(recommendationRepository.savedContexts).toEqual([]);
  });

  test('should load the context once recommendations are turned back on', async () => {
    const getContextSpy = vi.spyOn(recommendationRepository, 'getContext');
    authStore.currentUser.set(learner('Ada'));
    await service.load();

    authStore.updateModulePreferences({
      enabledModules: [],
      capabilities: capabilitiesEnabling([CAPABILITY_KEY.RECOMMENDATION]),
    });
    await service.load();

    expect(getContextSpy).toHaveBeenCalledTimes(1);
  });
});
