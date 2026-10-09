import { HttpErrorResponse } from '@angular/common/http';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import type {
  CreateTopicPayload,
  Topic,
  UpdateTopicPayload,
} from '@features/learning-resource/domain/topic.model';
import { TONES } from '@shared/utils/tone';

const CONFLICT_STATUS = 409;
const NOT_FOUND_STATUS = 404;

export interface MockedTopicRepository extends TopicRepository {
  topics: Topic[];
  reset(): void;
}

export function mockTopicRepository(initial: { topics?: Topic[] } = {}): MockedTopicRepository {
  const isNameTaken = (topics: Topic[], name: string, exceptId?: string) =>
    topics.some((t) => t.id !== exceptId && t.name.toLowerCase() === name.toLowerCase());

  return {
    topics: [...(initial.topics ?? [])],

    getAll(): Promise<Topic[]> {
      return Promise.resolve(this.topics);
    },

    create(payload: CreateTopicPayload): Promise<Topic> {
      if (isNameTaken(this.topics, payload.name)) {
        return Promise.reject(new HttpErrorResponse({ status: CONFLICT_STATUS }));
      }
      const now = new Date();
      const created: Topic = {
        id: crypto.randomUUID(),
        name: payload.name,
        color: payload.color ?? TONES[this.topics.length % TONES.length],
        resourceCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      this.topics = [...this.topics, created];
      return Promise.resolve(created);
    },

    update(id: string, payload: UpdateTopicPayload): Promise<Topic> {
      const existing = this.topics.find((t) => t.id === id);
      if (!existing) {
        return Promise.reject(new HttpErrorResponse({ status: NOT_FOUND_STATUS }));
      }
      if (payload.name !== undefined && isNameTaken(this.topics, payload.name, id)) {
        return Promise.reject(new HttpErrorResponse({ status: CONFLICT_STATUS }));
      }
      const updated: Topic = {
        id: existing.id,
        name: payload.name ?? existing.name,
        color: payload.color ?? existing.color,
        resourceCount: existing.resourceCount,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
      };
      this.topics = this.topics.map((t) => (t.id === id ? updated : t));
      return Promise.resolve(updated);
    },

    delete(id: string): Promise<void> {
      this.topics = this.topics.filter((t) => t.id !== id);
      return Promise.resolve();
    },

    reset(): void {
      this.topics = [];
    },
  };
}
