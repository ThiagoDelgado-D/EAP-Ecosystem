import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import type { Topic } from '@features/learning-resource/domain/topic.model';

export interface MockedTopicRepository extends TopicRepository {
  topics: Topic[];
  reset(): void;
}

export function mockTopicRepository(initial: { topics?: Topic[] } = {}): MockedTopicRepository {
  return {
    topics: [...(initial.topics ?? [])],

    async getAll(): Promise<Topic[]> {
      return this.topics;
    },

    reset(): void {
      this.topics = [];
    },
  };
}
