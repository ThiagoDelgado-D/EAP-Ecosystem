import { Component, inject, OnInit, computed } from '@angular/core';
import { PreferencesService } from '@features/settings/application/preferences.service';
import { isOptionalModule } from '@features/auth/domain/auth.model';
import { MODULE_CATALOG, type ModuleDefinition } from './feature-module-catalog';
import { MODULE_TONE } from './module-tone';
import { toneVar } from '@shared/utils/tone';

@Component({
  selector: 'app-modules',
  standalone: true,
  templateUrl: './modules.component.html',
})
export class ModulesComponent implements OnInit {
  private readonly preferencesService = inject(PreferencesService);

  readonly catalog = MODULE_CATALOG;
  readonly MODULE_TONE = MODULE_TONE;
  readonly toneVar = toneVar;
  readonly loading = this.preferencesService.loading;
  readonly error = this.preferencesService.error;

  readonly enabledKeys = computed(() => new Set<string>(this.preferencesService.enabledModules()));

  async ngOnInit(): Promise<void> {
    await this.preferencesService.loadEnabledModules();
  }

  isOn(key: string): boolean {
    return this.enabledKeys().has(key);
  }

  isToggleable(module: ModuleDefinition): boolean {
    return !module.alwaysOn && isOptionalModule(module.key);
  }

  statusLabel(module: ModuleDefinition): string {
    if (module.alwaysOn) return 'Always enabled';
    if (this.isOn(module.key)) return 'Enabled';
    return 'Disabled';
  }

  async toggle(module: ModuleDefinition): Promise<void> {
    if (!this.isToggleable(module)) return;
    const next = this.preferencesService.enabledModules().filter((key) => key !== module.key);
    if (!this.isOn(module.key) && isOptionalModule(module.key)) next.push(module.key);
    await this.preferencesService.updateEnabledModules(next);
  }
}
