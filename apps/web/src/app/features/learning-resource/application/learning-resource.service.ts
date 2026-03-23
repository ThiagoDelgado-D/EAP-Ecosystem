import { inject, Injectable, signal } from '@angular/core';
import { LearningResourceRepository } from '../domain/learning-resource.repository';
import type { LearningResource, LearningResourceFilter } from '../domain/learning-resource.model';

@Injectable()
export class LearningResourceService {
  private readonly repository = inject(LearningResourceRepository);

  readonly resources = signal<LearningResource[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.repository.getAll();
      this.resources.set(result);
    } catch {
      this.error.set('Failed to load resources');
    } finally {
      this.loading.set(false);
    }
  }

  async loadByFilter(filter: LearningResourceFilter): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.repository.getByFilter(filter);
      this.resources.set(result);
    } catch {
      this.error.set('Failed to load resources');
    } finally {
      this.loading.set(false);
    }
  }
}
