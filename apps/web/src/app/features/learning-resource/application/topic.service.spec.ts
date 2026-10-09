import { TestBed } from '@angular/core/testing';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import type { Topic } from '@features/learning-resource/domain/topic.model';
import { mockTopicRepository, type MockedTopicRepository } from './mocks/mock-topic.repository';
import { DuplicateTopicNameError, TopicService } from './topic.service';

const RUST_TOPIC_NAME = 'Rust';
const RUST_LANG_TOPIC_NAME = 'Rust lang';
const SYSTEMS_DESIGN_TOPIC_NAME = 'Systems Design';
const RUST_RESOURCE_COUNT = 3;

const buildTopic = (name: string, resourceCount = 0): Topic => {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    name,
    color: 'ember',
    resourceCount,
    createdAt: now,
    updatedAt: now,
  };
};

describe('TopicService', () => {
  let service: TopicService;
  let repository: MockedTopicRepository;
  let rustTopic: Topic;
  let systemsDesignTopic: Topic;

  beforeEach(async () => {
    rustTopic = buildTopic(RUST_TOPIC_NAME, RUST_RESOURCE_COUNT);
    systemsDesignTopic = buildTopic(SYSTEMS_DESIGN_TOPIC_NAME);
    repository = mockTopicRepository({ topics: [rustTopic, systemsDesignTopic] });
    TestBed.configureTestingModule({
      providers: [TopicService, { provide: TopicRepository, useValue: repository }],
    });
    service = TestBed.inject(TopicService);
    await service.loadAll();
  });

  test('create adds the new topic to the list', async () => {
    const created = await service.create({ name: RUST_LANG_TOPIC_NAME });

    expect(service.topics().map((topic) => topic.id)).toContain(created.id);
  });

  test('create reports a name the learner already uses as a duplicate', async () => {
    await expect(service.create({ name: RUST_TOPIC_NAME.toUpperCase() })).rejects.toBeInstanceOf(
      DuplicateTopicNameError,
    );
    expect(service.topics()).toHaveLength(2);
  });

  test('update renames in place and keeps how many resources use the topic', async () => {
    await service.update(rustTopic, { name: RUST_LANG_TOPIC_NAME, color: 'plum' });

    const renamed = service.topics().find((topic) => topic.id === rustTopic.id);
    expect(renamed?.name).toBe(RUST_LANG_TOPIC_NAME);
    expect(renamed?.color).toBe('plum');
    expect(renamed?.resourceCount).toBe(RUST_RESOURCE_COUNT);
  });

  test("update reports another topic's name as a duplicate and leaves the list as it was", async () => {
    await expect(
      service.update(rustTopic, { name: SYSTEMS_DESIGN_TOPIC_NAME }),
    ).rejects.toBeInstanceOf(DuplicateTopicNameError);
    expect(service.topics().find((topic) => topic.id === rustTopic.id)?.name).toBe(RUST_TOPIC_NAME);
  });

  test('remove drops the topic from the list', async () => {
    await service.remove(rustTopic);

    expect(service.topics().map((topic) => topic.id)).toEqual([systemsDesignTopic.id]);
  });
});
