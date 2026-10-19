import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '@core/config/api.config';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import type { OptionalModuleKey } from '@features/auth/domain/auth.model';
import type { AccountStats, UserAppearance, WidgetKey } from '@features/settings/domain/settings.model';
import type { AccountStatsDto, AppearanceDto, EnabledModulesDto, WidgetConfigDto } from './settings.dto';

@Injectable()
export class PreferencesHttpRepository extends PreferencesRepository {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_CONFIG.baseUrl}/preferences`;

  async getEnabledModules(): Promise<OptionalModuleKey[]> {
    const dto = await firstValueFrom(this.http.get<EnabledModulesDto>(`${this.base}/modules`));
    return dto.enabledModules;
  }

  async updateEnabledModules(enabledModules: OptionalModuleKey[]): Promise<OptionalModuleKey[]> {
    const dto = await firstValueFrom(
      this.http.patch<EnabledModulesDto>(`${this.base}/modules`, { enabledModules }),
    );
    return dto.enabledModules;
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

  async getAppearance(): Promise<UserAppearance> {
    const dto = await firstValueFrom(this.http.get<AppearanceDto>(`${this.base}/appearance`));
    return dto.appearance as UserAppearance;
  }

  async updateAppearance(appearance: Partial<UserAppearance>): Promise<UserAppearance> {
    const dto = await firstValueFrom(
      this.http.patch<AppearanceDto>(`${this.base}/appearance`, appearance),
    );
    return dto.appearance as UserAppearance;
  }

  async resetPreferences(): Promise<void> {
    await firstValueFrom(this.http.post(`${this.base}/reset`, {}));
  }

  async getAccountStats(): Promise<AccountStats> {
    const dto = await firstValueFrom(this.http.get<AccountStatsDto>(`${this.base}/stats`));
    return { resources: dto.resources, paths: dto.paths, sessions: dto.sessions };
  }
}
