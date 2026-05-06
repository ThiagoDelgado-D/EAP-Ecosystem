import type { FeatureKey } from '@features/auth/domain/auth.model';
import type { WidgetKey } from './settings.model';

export abstract class PreferencesRepository {
  abstract getFeatureConfig(): Promise<FeatureKey[]>;
  abstract updateFeatureConfig(config: FeatureKey[]): Promise<FeatureKey[]>;
  abstract getWidgetConfig(): Promise<WidgetKey[]>;
  abstract updateWidgetConfig(config: WidgetKey[]): Promise<WidgetKey[]>;
}
