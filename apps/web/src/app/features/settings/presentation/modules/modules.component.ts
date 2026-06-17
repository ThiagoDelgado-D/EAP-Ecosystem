import { Component, inject, OnInit, computed } from '@angular/core';
import { PreferencesService } from '@features/settings/application/preferences.service';
import { FEATURE_KEY, type FeatureKey } from '@features/auth/domain/auth.model';
import { MODULE_CATALOG, type ModuleDefinition } from './feature-module-catalog';

@Component({
  selector: 'app-modules',
  standalone: true,
  templateUrl: './modules.component.html',
})
export class ModulesComponent implements OnInit {
  private readonly preferencesService = inject(PreferencesService);

  readonly catalog = MODULE_CATALOG;
  readonly loading = this.preferencesService.loading;
  readonly error = this.preferencesService.error;

  readonly enabledKeys = computed(() => new Set(this.preferencesService.featureConfig()));

  async ngOnInit(): Promise<void> {
    await this.preferencesService.loadFeatureConfig();
  }

  isFeatureKey(key: string): key is FeatureKey {
    return Object.values(FEATURE_KEY).includes(key as FeatureKey);
  }

  isOn(key: string): boolean {
    if (!this.isFeatureKey(key)) return false;
    return this.enabledKeys().has(key);
  }

  isToggleable(module: ModuleDefinition): boolean {
    return !module.alwaysOn && module.badge !== 'planned' && this.isFeatureKey(module.key);
  }

  statusLabel(module: ModuleDefinition): string {
    if (module.alwaysOn) return 'Always enabled';
    if (module.badge === 'planned') return '';
    if (this.isOn(module.key)) return 'Enabled';
    return 'Disabled';
  }

  async toggle(module: ModuleDefinition): Promise<void> {
    if (!this.isToggleable(module)) return;
    const current = new Set(this.enabledKeys());
    const key = module.key as FeatureKey;
    current.has(key) ? current.delete(key) : current.add(key);
    await this.preferencesService.updateFeatureConfig([...current]);
  }
}
