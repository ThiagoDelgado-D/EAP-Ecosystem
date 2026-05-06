import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '@core/config/api.config';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import type { FeatureKey } from '@features/auth/domain/auth.model';
import type { WidgetKey } from '@features/settings/domain/settings.model';
import type { FeatureConfigDto, WidgetConfigDto } from './settings.dto';

@Injectable()
export class PreferencesHttpRepository extends PreferencesRepository {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_CONFIG.baseUrl}/preferences`;

  async getFeatureConfig(): Promise<FeatureKey[]> {
    const dto = await firstValueFrom(this.http.get<FeatureConfigDto>(`${this.base}/features`));
    return dto.featureConfig;
  }

  async updateFeatureConfig(config: FeatureKey[]): Promise<FeatureKey[]> {
    const dto = await firstValueFrom(
      this.http.patch<FeatureConfigDto>(`${this.base}/features`, { featureConfig: config }),
    );
    return dto.featureConfig;
  }

  async getWidgetConfig(): Promise<WidgetKey[]> {
    const dto = await firstValueFrom(this.http.get<WidgetConfigDto>(`${this.base}/widgets`));
    return dto.widgetConfig;
  }

  async updateWidgetConfig(config: WidgetKey[]): Promise<WidgetKey[]> {
    const dto = await firstValueFrom(
      this.http.patch<WidgetConfigDto>(`${this.base}/widgets`, { widgetConfig: config }),
    );
    return dto.widgetConfig;
  }
}
