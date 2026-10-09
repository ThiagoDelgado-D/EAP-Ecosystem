import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TopicRepository } from '../domain/topic.repository';
import type { CreateTopicPayload, Topic, UpdateTopicPayload } from '../domain/topic.model';

export class DuplicateTopicNameError extends Error {
  constructor(readonly topicName: string) {
    super(`A topic named "${topicName}" already exists`);
  }
}

const CONFLICT_STATUS = 409;

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

  async create(payload: CreateTopicPayload): Promise<Topic> {
    const created = await this.withDuplicateNameCheck(payload.name, () =>
      this.repository.create(payload),
    );
    this.topics.update((topics) => [...topics, created]);
    return created;
  }

  async update(topic: Topic, payload: UpdateTopicPayload): Promise<Topic> {
    const updated = await this.withDuplicateNameCheck(payload.name ?? topic.name, () =>
      this.repository.update(topic.id, payload),
    );
    const withUsage: Topic = {
      id: updated.id,
      name: updated.name,
      color: updated.color,
      resourceCount: topic.resourceCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
    this.topics.update((topics) => topics.map((t) => (t.id === topic.id ? withUsage : t)));
    return withUsage;
  }

  async remove(topic: Topic): Promise<void> {
    await this.repository.delete(topic.id);
    this.topics.update((topics) => topics.filter((t) => t.id !== topic.id));
  }

  private async withDuplicateNameCheck<T>(name: string, request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === CONFLICT_STATUS) {
        throw new DuplicateTopicNameError(name);
      }
      throw error;
    }
  }
}
