import { computed, inject, Injectable, signal } from '@angular/core';
import type { FeatureKey } from '@features/auth/domain/auth.model';
import { PreferencesRepository } from '@features/settings/domain/preferences.repository';
import type { WidgetKey } from '@features/settings/domain/settings.model';

@Injectable()
export class PreferencesService {
  private readonly repository = inject(PreferencesRepository);

  readonly featureConfig = signal<FeatureKey[]>([]);
  readonly widgetConfig = signal<WidgetKey[]>([]);
  private readonly _loadingFeature = signal(false);
  private readonly _loadingWidget = signal(false);
  readonly loading = computed(() => this._loadingFeature() || this._loadingWidget());
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
    this.saving.set(true);
    this.error.set(null);
    const prev = this.featureConfig();
    this.featureConfig.set(config);
    try {
      const updated = await this.repository.updateFeatureConfig(config);
      this.featureConfig.set(updated);
    } catch {
      this.featureConfig.set(prev);
      this.error.set('Failed to save feature configuration');
    } finally {
      this.saving.set(false);
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
    this.saving.set(true);
    this.error.set(null);
    const prev = this.widgetConfig();
    this.widgetConfig.set(config);
    try {
      const updated = await this.repository.updateWidgetConfig(config);
      this.widgetConfig.set(updated);
    } catch {
      this.widgetConfig.set(prev);
      this.error.set('Failed to save widget configuration');
    } finally {
      this.saving.set(false);
    }
  }
}
