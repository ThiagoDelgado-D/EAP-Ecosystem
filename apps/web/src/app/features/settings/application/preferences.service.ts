import { computed, inject, Injectable, signal } from '@angular/core';
import type { OptionalModuleKey } from '@features/auth/domain/auth.model';
import { AuthStore } from '@features/auth/application/auth.store';
import { messageOf } from '@core/errors/error-messages';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import type { AccountStats, UserAppearance, WidgetKey } from '@features/settings/domain/settings.model';

@Injectable()
export class PreferencesService {
  private readonly repository = inject(PreferencesRepository);
  private readonly authStore = inject(AuthStore);

  readonly enabledModules = signal<OptionalModuleKey[]>([]);
  readonly widgetConfig = signal<WidgetKey[]>([]);
  readonly appearance = signal<UserAppearance | null>(null);
  readonly accountStats = signal<AccountStats | null>(null);
  private readonly _loadingModules = signal(false);
  private readonly _loadingWidget = signal(false);
  private readonly _loadingAppearance = signal(false);
  readonly loading = computed(
    () => this._loadingModules() || this._loadingWidget() || this._loadingAppearance(),
  );
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  async loadEnabledModules(): Promise<void> {
    this._loadingModules.set(true);
    this.error.set(null);
    try {
      const { enabledModules } = await this.repository.getEnabledModules();
      this.enabledModules.set(enabledModules);
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this._loadingModules.set(false);
    }
  }

  async updateEnabledModules(enabledModules: OptionalModuleKey[]): Promise<void> {
    const prev = this.enabledModules();
    this.error.set(null);
    this.enabledModules.set(enabledModules);
    try {
      this.authStore.updateModulePreferences(
        await this.repository.updateEnabledModules(enabledModules),
      );
    } catch (error) {
      this.enabledModules.set(prev);
      this.error.set(messageOf(error));
    }
  }

  async loadWidgetConfig(): Promise<void> {
    this._loadingWidget.set(true);
    this.error.set(null);
    try {
      const config = await this.repository.getWidgetConfig();
      this.widgetConfig.set(config);
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this._loadingWidget.set(false);
    }
  }

  async updateWidgetConfig(config: WidgetKey[]): Promise<void> {
    const prev = this.widgetConfig();
    this.error.set(null);
    this.widgetConfig.set(config);
    try {
      await this.repository.updateWidgetConfig(config);
    } catch (error) {
      this.widgetConfig.set(prev);
      this.error.set(messageOf(error));
    }
  }

  async loadAppearance(): Promise<void> {
    this._loadingAppearance.set(true);
    this.error.set(null);
    try {
      const appearance = await this.repository.getAppearance();
      this.appearance.set(appearance);
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this._loadingAppearance.set(false);
    }
  }

  async updateAppearance(patch: Partial<UserAppearance>): Promise<void> {
    const prev = this.appearance();
    if (!prev) return;
    this.error.set(null);
    this.appearance.set({ ...prev, ...patch });
    try {
      await this.repository.updateAppearance(patch);
    } catch (error) {
      this.appearance.set(prev);
      this.error.set(messageOf(error));
    }
  }

  async loadAccountStats(): Promise<void> {
    try {
      this.accountStats.set(await this.repository.getAccountStats());
    } catch {
      this.accountStats.set(null);
    }
  }

  async resetPreferences(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      const modulePreferences = await this.repository.resetPreferences();
      this.enabledModules.set(modulePreferences.enabledModules);
      this.widgetConfig.set([]);
      this.authStore.updateModulePreferences(modulePreferences);
    } catch (error) {
      this.error.set(messageOf(error));
      throw error;
    } finally {
      this.saving.set(false);
    }
  }
}
