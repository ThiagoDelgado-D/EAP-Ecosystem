import { TestBed } from '@angular/core/testing';
import { AuthStore } from '@features/auth/application/auth.store';
import { learner } from '@features/recommendation/application/mocks/learner.fixture';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import { WEEKLY_GOAL_MINUTES } from '@features/settings/domain/settings.model';
import {
  mockPreferencesRepository,
  type MockedPreferencesRepository,
} from './mocks/mock-preferences.repository';
import { WeeklyGoalService } from './weekly-goal.service';

const TWELVE_HOUR_WEEKLY_GOAL = 720;
const FIFTEEN_HOUR_WEEKLY_GOAL = 900;

describe('WeeklyGoalService', () => {
  let preferencesRepository: MockedPreferencesRepository;
  let authStore: AuthStore;
  let service: WeeklyGoalService;

  beforeEach(() => {
    preferencesRepository = mockPreferencesRepository();
    TestBed.configureTestingModule({
      providers: [
        WeeklyGoalService,
        { provide: PreferencesRepository, useValue: preferencesRepository },
      ],
    });
    authStore = TestBed.inject(AuthStore);
    authStore.currentUser.set(learner('Ada'));
    service = TestBed.inject(WeeklyGoalService);
  });

  test('should start from the default goal before loading', () => {
    expect(service.goalMinutes()).toBe(WEEKLY_GOAL_MINUTES.DEFAULT);
  });

  test('should restore the goal saved on the learner profile', async () => {
    preferencesRepository.appearance.weeklyGoalMinutes = TWELVE_HOUR_WEEKLY_GOAL;

    await service.load();

    expect(service.goalMinutes()).toBe(TWELVE_HOUR_WEEKLY_GOAL);
  });

  test('should save a new goal as an appearance patch', async () => {
    await service.load();

    const saved = await service.setGoalMinutes(FIFTEEN_HOUR_WEEKLY_GOAL);

    expect(saved).toBe(true);
    expect(service.goalMinutes()).toBe(FIFTEEN_HOUR_WEEKLY_GOAL);
    expect(preferencesRepository.appearancePatches).toEqual([
      { weeklyGoalMinutes: FIFTEEN_HOUR_WEEKLY_GOAL },
    ]);
  });

  test('should roll back to the previous goal when saving fails', async () => {
    await service.load();
    preferencesRepository.failNextUpdate = true;

    const saved = await service.setGoalMinutes(FIFTEEN_HOUR_WEEKLY_GOAL);

    expect(saved).toBe(false);
    expect(service.goalMinutes()).toBe(WEEKLY_GOAL_MINUTES.DEFAULT);
  });

  test('should reload the goal when another learner signs in', async () => {
    preferencesRepository.appearance.weeklyGoalMinutes = TWELVE_HOUR_WEEKLY_GOAL;
    await service.load();

    authStore.currentUser.set(learner('Grace'));
    preferencesRepository.appearance.weeklyGoalMinutes = FIFTEEN_HOUR_WEEKLY_GOAL;
    await service.load();

    expect(service.goalMinutes()).toBe(FIFTEEN_HOUR_WEEKLY_GOAL);
  });
});
