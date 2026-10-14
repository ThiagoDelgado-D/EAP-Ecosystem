import { TestBed } from '@angular/core/testing';
import { ERROR_MESSAGES } from '@core/errors/error-messages';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { AuthStore } from '@features/auth/application/auth.store';
import { learner } from '@features/recommendation/application/mocks/learner.fixture';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import {
  mockPreferencesRepository,
  type MockedPreferencesRepository,
} from './mocks/mock-preferences.repository';
import { PreferencesService } from './preferences.service';

const COMPACT_MODE_ON = true;

describe('PreferencesService', () => {
  let preferencesRepository: MockedPreferencesRepository;
  let service: PreferencesService;

  beforeEach(() => {
    preferencesRepository = mockPreferencesRepository();
    TestBed.configureTestingModule({
      providers: [
        PreferencesService,
        { provide: PreferencesRepository, useValue: preferencesRepository },
      ],
    });
    TestBed.inject(AuthStore).currentUser.set(learner('Ada'));
    service = TestBed.inject(PreferencesService);
  });

  test('should explain why the appearance preferences could not load', async () => {
    vi.spyOn(preferencesRepository, 'getAppearance').mockRejectedValueOnce(offlineError());

    await service.loadAppearance();

    expect(service.error()).toBe(ERROR_MESSAGES.NETWORK_ERROR);
  });

  test('should keep the saved appearance and explain why when a change fails to save', async () => {
    await service.loadAppearance();
    const savedAppearance = service.appearance();
    preferencesRepository.failNextUpdate = true;

    await service.updateAppearance({ compactMode: COMPACT_MODE_ON });

    expect(service.appearance()).toEqual(savedAppearance);
    expect(service.error()).toBe(ERROR_MESSAGES.NETWORK_ERROR);
  });

  test('should pass the original error on when resetting the preferences fails', async () => {
    const offline = offlineError();
    vi.spyOn(preferencesRepository, 'resetPreferences').mockRejectedValueOnce(offline);

    await expect(service.resetPreferences()).rejects.toBe(offline);
    expect(service.error()).toBe(ERROR_MESSAGES.NETWORK_ERROR);
  });
});
