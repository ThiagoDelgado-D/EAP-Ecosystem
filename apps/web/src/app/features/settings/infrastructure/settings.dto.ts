import type { FeatureKey } from '@features/auth/domain/auth.model';
import type { WidgetKey } from '@features/settings/domain/settings.model';

export interface FeatureConfigDto {
  featureConfig: FeatureKey[];
}

export interface WidgetConfigDto {
  widgetConfig: WidgetKey[];
}

export interface SessionDto {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}
