import { inject, Injectable, signal } from '@angular/core';
import { messageOf } from '@core/errors/error-messages';
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
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this.loading.set(false);
    }
  }
}
