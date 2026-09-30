import { inject, Injectable, signal } from '@angular/core';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import type { LearningPath, LearningPathWithNodes } from '@features/learning-path/domain/learning-path.model';

@Injectable()
export class LearningPathService {
  private readonly repository = inject(LearningPathRepository);

  readonly paths = signal<LearningPath[]>([]);
  readonly pathsWithNodes = signal<LearningPathWithNodes[]>([]);
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

  async loadAllWithNodes(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const entries = await this.repository.getAllWithNodes();
      this.pathsWithNodes.set(entries);
      this.paths.set(entries.map((entry) => entry.path));
    } catch {
      this.error.set('No pudimos cargar tus Learning Paths.');
    } finally {
      this.loading.set(false);
    }
  }
}
