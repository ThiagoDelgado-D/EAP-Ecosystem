import type { ModulePreferences, OptionalModuleKey } from '@features/auth/domain/auth.model';
import type { AccountStats, UserAppearance, WidgetKey } from './settings.model';

export abstract class PreferencesRepository {
  abstract getEnabledModules(): Promise<ModulePreferences>;
  abstract updateEnabledModules(enabledModules: OptionalModuleKey[]): Promise<ModulePreferences>;
  abstract getWidgetConfig(): Promise<WidgetKey[]>;
  abstract updateWidgetConfig(config: WidgetKey[]): Promise<WidgetKey[]>;
  abstract getAppearance(): Promise<UserAppearance>;
  abstract updateAppearance(appearance: Partial<UserAppearance>): Promise<UserAppearance>;
  abstract resetPreferences(): Promise<ModulePreferences>;
  abstract getAccountStats(): Promise<AccountStats>;
}
