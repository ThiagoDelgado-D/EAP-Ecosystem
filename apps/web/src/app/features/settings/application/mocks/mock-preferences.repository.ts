import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { capabilitiesEnabling } from '@features/auth/application/mocks/capabilities.fixture';
import {
  OPTIONAL_MODULES,
  type ModulePreferences,
  type OptionalModuleKey,
} from '@features/auth/domain/auth.model';
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

function modulePreferencesFor(enabledModules: OptionalModuleKey[]): ModulePreferences {
  return { enabledModules, capabilities: capabilitiesEnabling(enabledModules) };
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

    getEnabledModules(): Promise<ModulePreferences> {
      return Promise.resolve(modulePreferencesFor([]));
    },

    updateEnabledModules(enabledModules: OptionalModuleKey[]): Promise<ModulePreferences> {
      return Promise.resolve(modulePreferencesFor(enabledModules));
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
        return Promise.reject(offlineError());
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

    resetPreferences(): Promise<ModulePreferences> {
      return Promise.resolve(modulePreferencesFor([...OPTIONAL_MODULES]));
    },

    getAccountStats(): Promise<AccountStats> {
      return Promise.resolve(this.accountStats);
    },
  };
}
