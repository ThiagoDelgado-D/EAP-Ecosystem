import { inject, Injectable, signal } from '@angular/core';
import { TopicRepository } from '../domain/topic.repository';
import type { Topic } from '../domain/topic.model';

@Injectable()
export class TopicService {
  private readonly repository = inject(TopicRepository);

  readonly topics = signal<Topic[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.repository.getAll();
      this.topics.set(result);
    } catch {
      this.error.set('Failed to load topics');
    } finally {
      this.loading.set(false);
    }
  }
}
