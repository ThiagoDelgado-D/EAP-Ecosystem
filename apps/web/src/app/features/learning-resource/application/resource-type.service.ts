import { inject, Injectable, signal } from '@angular/core';
import { ResourceTypeRepository } from '../domain/resource-type.repository';
import type { ResourceType } from '../domain/resource-type.model';

@Injectable()
export class ResourceTypeService {
  private readonly repository = inject(ResourceTypeRepository);

  readonly resourceTypes = signal<ResourceType[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.repository.getAll();
      this.resourceTypes.set(result);
    } catch {
      this.error.set('Failed to load resource types');
    } finally {
      this.loading.set(false);
    }
  }
}
