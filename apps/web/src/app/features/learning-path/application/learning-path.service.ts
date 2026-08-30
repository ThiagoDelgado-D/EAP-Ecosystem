import { inject, Injectable, signal } from '@angular/core';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import type { LearningPath } from '@features/learning-path/domain/learning-path.model';

@Injectable()
export class LearningPathService {
  private readonly repository = inject(LearningPathRepository);

  readonly paths = signal<LearningPath[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const paths = await this.repository.getAll();
      this.paths.set(paths);
    } catch {
      this.error.set('No pudimos cargar tus Learning Paths.');
    } finally {
      this.loading.set(false);
    }
  }
}
