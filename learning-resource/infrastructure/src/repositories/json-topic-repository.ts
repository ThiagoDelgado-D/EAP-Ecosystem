import type { UUID } from "domain-lib";
import type { ITopicRepository, Topic } from "@learning-resource/domain";
import { topicStorage } from "../storage/index.js";

export class JsonTopicRepository implements ITopicRepository {
  async save(topic: Topic): Promise<void> {
    await topicStorage.save(topic);
  }

  async update(id: UUID, topic: Partial<Topic>): Promise<void> {
    const existing = await topicStorage.findById(id);
    if (!existing) return;
    await topicStorage.save({ ...existing, ...topic, id });
  }

  async delete(id: UUID): Promise<void> {
    await topicStorage.delete(id);
  }

  async findAll(): Promise<Topic[]> {
    return topicStorage.readAll();
  }

  async findById(id: UUID): Promise<Topic | null> {
    return (await topicStorage.findById(id)) ?? null;
  }
}
