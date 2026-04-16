import { inject, Injectable, signal } from '@angular/core';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import type {
  AddResourcePayload,
  LearningResource,
  LearningResourceFilter,
} from '@features/learning-resource/domain/learning-resource.model';

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
    } catch (error) {
      console.error('Error loading resources:', error);
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

  async addResource(resource: AddResourcePayload): Promise<void> {
    await this.repository.addResourceLearning(resource);
    await this.loadAll();
  }

  async getById(id: string): Promise<LearningResource> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.repository.getById(id);
      return result;
    } catch (err) {
      console.error('Error loading resource:', err);
      this.error.set('Failed to load resource');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async deleteResource(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.repository.deleteResource(id);
    } catch (err) {
      console.error('Error deleting resource:', err);
      this.error.set('Failed to delete resource');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }
}
