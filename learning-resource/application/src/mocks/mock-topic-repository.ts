import type { UUID } from "domain-lib";
import type { ITopicRepository, Topic } from "@learning-resource/domain";

export interface MockedTopicRepository extends ITopicRepository {
  topics: Topic[];
}

export function mockTopicRepository(
  topics: Topic[] = []
): MockedTopicRepository {
  return {
    topics: [...topics],

    async save(topic: Topic): Promise<void> {
      const index = this.topics.findIndex((t) => t.id === topic.id);
      if (index >= 0) {
        this.topics[index] = topic;
      } else {
        this.topics.push(topic);
      }
    },

    async findById(id: UUID): Promise<Topic | null> {
      return this.topics.find((t) => t.id === id) || null;
    },

    async findAll(): Promise<Topic[]> {
      return [...this.topics];
    },

    async update(id: UUID, data: Partial<Topic>): Promise<void> {
      const index = this.topics.findIndex((t) => t.id === id);

      const updatedTopic = {
        ...this.topics[index],
        ...data,
        updatedAt: new Date(),
      };

      this.topics = this.topics.map((t) => (t.id === id ? updatedTopic : t));
    },

    async delete(id: UUID): Promise<void> {
      const index = this.topics.findIndex((t) => t.id === id);
      if (index >= 0) {
        this.topics.splice(index, 1);
      }
    },
  };
}
