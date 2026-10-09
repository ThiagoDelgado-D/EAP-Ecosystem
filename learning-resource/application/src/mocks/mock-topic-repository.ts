import type { UUID } from "domain-lib";
import type { ITopicRepository, Topic, TopicWithUsage } from "@learning-resource/domain";

export interface MockedTopicRepository extends ITopicRepository {
  topics: Topic[];
}

export type CountResourcesUsingTopic = (topicId: UUID) => number;

export function mockTopicRepository(
  topics: Topic[] = [],
  countResourcesUsing: CountResourcesUsingTopic = () => 0,
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

    async findAllByUserId(userId: UUID): Promise<TopicWithUsage[]> {
      return this.topics
        .filter((t) => t.userId === userId)
        .map((t) => ({
          id: t.id,
          userId: t.userId,
          name: t.name,
          color: t.color,
          resourceCount: countResourcesUsing(t.id),
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }));
    },

    async findByName(userId: UUID, name: string): Promise<Topic | null> {
      const lowerName = name.toLowerCase();
      return (
        this.topics.find((t) => t.userId === userId && t.name.toLowerCase() === lowerName) ?? null
      );
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
