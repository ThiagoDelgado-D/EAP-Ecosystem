import type { FeatureKey } from '@features/auth/domain/auth.model';
import type { AccountStats, UserAppearance, WidgetKey } from './settings.model';

export abstract class PreferencesRepository {
  abstract getFeatureConfig(): Promise<FeatureKey[]>;
  abstract updateFeatureConfig(config: FeatureKey[]): Promise<FeatureKey[]>;
  abstract getWidgetConfig(): Promise<WidgetKey[]>;
  abstract updateWidgetConfig(config: WidgetKey[]): Promise<WidgetKey[]>;
  abstract getAppearance(): Promise<UserAppearance>;
  abstract updateAppearance(appearance: Partial<UserAppearance>): Promise<UserAppearance>;
  abstract resetPreferences(): Promise<void>;
  abstract getAccountStats(): Promise<AccountStats>;
}
