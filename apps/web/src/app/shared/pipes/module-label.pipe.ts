import { Pipe, PipeTransform } from '@angular/core';
import { MODULE_CATALOG } from '@features/settings/presentation/modules/feature-module-catalog';

@Pipe({ name: 'moduleLabel', standalone: true })
export class ModuleLabelPipe implements PipeTransform {
  transform(key: string): string {
    return MODULE_CATALOG.find((m) => m.key === key)?.label ?? key;
  }
}
