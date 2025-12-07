import type { UUID } from "domain-lib";
import type { Topic } from "../entities/topic";

export interface ITopicRepository {
  save(topic: Topic): Promise<void>;
  update(id: UUID, topic: Partial<Topic>): Promise<void>;
  delete(id: UUID): Promise<void>;
  findAll(): Promise<Topic[]>;
  findById(id: UUID): Promise<Topic | null>;
}
