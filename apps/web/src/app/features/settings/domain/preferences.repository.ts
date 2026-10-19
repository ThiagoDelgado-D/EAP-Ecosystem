import type { OptionalModuleKey } from '@features/auth/domain/auth.model';
import type { AccountStats, UserAppearance, WidgetKey } from './settings.model';

export abstract class PreferencesRepository {
  abstract getEnabledModules(): Promise<OptionalModuleKey[]>;
  abstract updateEnabledModules(enabledModules: OptionalModuleKey[]): Promise<OptionalModuleKey[]>;
  abstract getWidgetConfig(): Promise<WidgetKey[]>;
  abstract updateWidgetConfig(config: WidgetKey[]): Promise<WidgetKey[]>;
  abstract getAppearance(): Promise<UserAppearance>;
  abstract updateAppearance(appearance: Partial<UserAppearance>): Promise<UserAppearance>;
  abstract resetPreferences(): Promise<void>;
  abstract getAccountStats(): Promise<AccountStats>;
}
