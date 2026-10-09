import type { FeatureKey } from '@features/auth/domain/auth.model';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import {
  LANGUAGE_CODE,
  START_OF_WEEK,
  WEEKLY_GOAL_MINUTES,
  type AccountStats,
  type UserAppearance,
  type WidgetKey,
} from '@features/settings/domain/settings.model';

export function defaultAppearanceFixture(): UserAppearance {
  return {
    language: LANGUAGE_CODE.EN,
    timezone: 'UTC',
    startOfWeek: START_OF_WEEK.MONDAY,
    reduceMotion: false,
    compactMode: false,
    weeklyGoalMinutes: WEEKLY_GOAL_MINUTES.DEFAULT,
  };
}

export interface MockedPreferencesRepository extends PreferencesRepository {
  appearance: UserAppearance;
  accountStats: AccountStats;
  appearancePatches: Partial<UserAppearance>[];
  failNextUpdate: boolean;
}

export function mockPreferencesRepository(
  initial: { appearance?: UserAppearance; accountStats?: AccountStats } = {},
): MockedPreferencesRepository {
  return {
    appearance: initial.appearance ?? defaultAppearanceFixture(),
    accountStats: initial.accountStats ?? { resources: 0, paths: 0, sessions: 0 },
    appearancePatches: [],
    failNextUpdate: false,

    getFeatureConfig(): Promise<FeatureKey[]> {
      return Promise.resolve([]);
    },

    updateFeatureConfig(config: FeatureKey[]): Promise<FeatureKey[]> {
      return Promise.resolve(config);
    },

    getWidgetConfig(): Promise<WidgetKey[]> {
      return Promise.resolve([]);
    },

    updateWidgetConfig(config: WidgetKey[]): Promise<WidgetKey[]> {
      return Promise.resolve(config);
    },

    getAppearance(): Promise<UserAppearance> {
      return Promise.resolve(this.appearance);
    },

    updateAppearance(patch: Partial<UserAppearance>): Promise<UserAppearance> {
      this.appearancePatches.push(patch);
      if (this.failNextUpdate) {
        this.failNextUpdate = false;
        return Promise.reject(new Error('network down'));
      }
      this.appearance = {
        language: patch.language ?? this.appearance.language,
        timezone: patch.timezone ?? this.appearance.timezone,
        startOfWeek: patch.startOfWeek ?? this.appearance.startOfWeek,
        reduceMotion: patch.reduceMotion ?? this.appearance.reduceMotion,
        compactMode: patch.compactMode ?? this.appearance.compactMode,
        weeklyGoalMinutes: patch.weeklyGoalMinutes ?? this.appearance.weeklyGoalMinutes,
      };
      return Promise.resolve(this.appearance);
    },

    resetPreferences(): Promise<void> {
      return Promise.resolve();
    },

    getAccountStats(): Promise<AccountStats> {
      return Promise.resolve(this.accountStats);
    },
  };
}
