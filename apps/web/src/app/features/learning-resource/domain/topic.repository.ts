import type { Topic } from './topic.model';

export abstract class TopicRepository {
  abstract getAll(): Promise<Topic[]>;
}
