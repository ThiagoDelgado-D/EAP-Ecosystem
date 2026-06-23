import { computed, inject, Injectable, signal } from '@angular/core';
import type { FeatureKey } from '@features/auth/domain/auth.model';
import { AuthStore } from '@features/auth/application/auth.store';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import type { UserAppearance, WidgetKey } from '@features/settings/domain/settings.model';

@Injectable()
export class PreferencesService {
  private readonly repository = inject(PreferencesRepository);
  private readonly authStore = inject(AuthStore);

  readonly featureConfig = signal<FeatureKey[]>([]);
  readonly widgetConfig = signal<WidgetKey[]>([]);
  readonly appearance = signal<UserAppearance | null>(null);
  private readonly _loadingFeature = signal(false);
  private readonly _loadingWidget = signal(false);
  private readonly _loadingAppearance = signal(false);
  readonly loading = computed(
    () => this._loadingFeature() || this._loadingWidget() || this._loadingAppearance(),
  );
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  async loadFeatureConfig(): Promise<void> {
    this._loadingFeature.set(true);
    this.error.set(null);
    try {
      const config = await this.repository.getFeatureConfig();
      this.featureConfig.set(config);
    } catch {
      this.error.set('Failed to load feature configuration');
    } finally {
      this._loadingFeature.set(false);
    }
  }

  async updateFeatureConfig(config: FeatureKey[]): Promise<void> {
    const prev = this.featureConfig();
    this.error.set(null);
    this.featureConfig.set(config);
    this.authStore.updateFeatureConfig(config);
    try {
      await this.repository.updateFeatureConfig(config);
    } catch {
      this.featureConfig.set(prev);
      this.authStore.updateFeatureConfig(prev);
      this.error.set('Failed to save feature configuration');
    }
  }

  async loadWidgetConfig(): Promise<void> {
    this._loadingWidget.set(true);
    this.error.set(null);
    try {
      const config = await this.repository.getWidgetConfig();
      this.widgetConfig.set(config);
    } catch {
      this.error.set('Failed to load widget configuration');
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
    } catch {
      this.widgetConfig.set(prev);
      this.error.set('Failed to save widget configuration');
    }
  }

  async loadAppearance(): Promise<void> {
    this._loadingAppearance.set(true);
    this.error.set(null);
    try {
      const appearance = await this.repository.getAppearance();
      this.appearance.set(appearance);
    } catch {
      this.error.set('Failed to load appearance preferences');
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
    } catch {
      this.appearance.set(prev);
      this.error.set('Failed to save appearance preferences');
    }
  }

  async resetPreferences(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.repository.resetPreferences();
      this.featureConfig.set([]);
      this.widgetConfig.set([]);
      this.authStore.updateFeatureConfig([]);
    } catch {
      this.error.set('Failed to reset preferences');
      throw new Error('Failed to reset preferences');
    } finally {
      this.saving.set(false);
    }
  }
}
