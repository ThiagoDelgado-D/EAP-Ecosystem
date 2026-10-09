import type { CreateTopicPayload, Topic, UpdateTopicPayload } from './topic.model';

export abstract class TopicRepository {
  abstract getAll(): Promise<Topic[]>;
  abstract create(payload: CreateTopicPayload): Promise<Topic>;
  abstract update(id: string, payload: UpdateTopicPayload): Promise<Topic>;
  abstract delete(id: string): Promise<void>;
}
