import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { LearningResourceService } from '@features/learning-resource/application/learning-resource.service';
import { TopicService } from '@features/learning-resource/application/topic.service';
import { ResourceTypeService } from '@features/learning-resource/application/resource-type.service';
import { TopicRepository } from '@features/learning-resource/domain/topic.repository';
import { ResourceTypeRepository } from '@features/learning-resource/domain/resource-type.repository';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import type { Topic } from '@features/learning-resource/domain/topic.model';
import { mockTopicRepository } from '@features/learning-resource/application/mocks/mock-topic.repository';
import { mockResourceTypeRepository } from '@features/learning-resource/application/mocks/mock-resource-type.repository';
import { EditResourceComponent } from './edit-resource.component';

const RUST_BOOK_TITLE = 'The Rust Programming Language';
const RUST_BOOK_MINUTES = 240;

const buildTopic = (name: string): Topic => {
  const now = new Date();
  return { id: crypto.randomUUID(), name, color: 'ember', resourceCount: 1, createdAt: now, updatedAt: now };
};

describe('EditResourceComponent', () => {
  const rustTopic = buildTopic('Rust');
  const systemsTopic = buildTopic('Systems');
  const now = new Date();
  const rustBook: LearningResource = {
    id: crypto.randomUUID(),
    title: RUST_BOOK_TITLE,
    difficulty: 'Medium',
    energyLevel: 'Medium',
    status: 'InProgress',
    estimatedDuration: { value: RUST_BOOK_MINUTES, isEstimated: false },
    topicIds: [rustTopic.id],
    typeId: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  const resourceService = {
    loading: signal(false),
    error: signal<string | null>(null),
    getById: vi.fn().mockResolvedValue(rustBook),
    updateResource: vi.fn().mockResolvedValue(undefined),
    toggleDifficulty: vi.fn().mockResolvedValue(undefined),
    toggleEnergy: vi.fn().mockResolvedValue(undefined),
  };

  const createComponent = async () => {
    TestBed.overrideComponent(EditResourceComponent, {
      set: {
        providers: [
          TopicService,
          ResourceTypeService,
          { provide: LearningResourceService, useValue: resourceService },
          { provide: TopicRepository, useValue: mockTopicRepository({ topics: [rustTopic, systemsTopic] }) },
          { provide: ResourceTypeRepository, useValue: mockResourceTypeRepository() },
        ],
      },
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: rustBook.id }) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(EditResourceComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    await vi.waitFor(() => expect(component.resource()?.id).toBe(rustBook.id));
    return component;
  };

  beforeEach(() => vi.clearAllMocks());

  test('saves a change of topics', async () => {
    const component = await createComponent();

    component.onTopicsChange([systemsTopic.id]);
    await component.onSubmit();

    expect(resourceService.updateResource).toHaveBeenCalledWith(rustBook.id, {
      topicIds: [systemsTopic.id],
    });
  });

  test('saves a change of difficulty and energy', async () => {
    const component = await createComponent();

    component.selectDifficulty('High');
    component.selectEnergy('Low');
    await component.onSubmit();

    expect(resourceService.toggleDifficulty).toHaveBeenCalledWith(rustBook.id, 'High');
    expect(resourceService.toggleEnergy).toHaveBeenCalledWith(rustBook.id, 'Low');
  });

  test('sends nothing when nothing changed', async () => {
    const component = await createComponent();

    await component.onSubmit();

    expect(resourceService.updateResource).not.toHaveBeenCalled();
    expect(resourceService.toggleDifficulty).not.toHaveBeenCalled();
  });
});
